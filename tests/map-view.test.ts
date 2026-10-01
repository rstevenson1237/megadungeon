import { describe, expect, it } from 'vitest';
import { createExploration, updateExploration } from '../src/game/exploration.ts';
import { buildTerrain } from '../src/game/map-state.ts';
import { generateLevel } from '../src/rules/world/generate.ts';
import type { Level, Point } from '../src/rules/world/level.ts';
import { SIGHT_RADIUS, computeVisible } from '../src/rules/world/visibility.ts';
import { cameraOrigin } from '../src/ui/camera.ts';
import { COLS, Grid } from '../src/ui/grid.ts';
import { drawMap } from '../src/ui/map-view.ts';
import { MAP } from '../src/ui/palette.ts';
import { MAIN_PANE, inner } from '../src/ui/panes.ts';
import { Shell } from '../src/ui/shell.ts';
import { gameOn, levelFrom, room, walk } from './helpers.ts';

const opaqueOf = (level: Level) => (x: number, y: number): boolean => level.tiles[y]![x] === '#';
const visibleSet = (level: Level, from: Point, radius?: number): Uint8Array =>
  computeVisible(level.width, level.height, from, opaqueOf(level), radius);

describe('sight (Spec 02, Visibility and explored cells)', () => {
  it('always sees the player cell and every open cell within radius 8, but none beyond', () => {
    const level = room(40, 30, 20, 15);
    const v = visibleSet(level, level.upStair);
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const d2 = (x - 20) ** 2 + (y - 15) ** 2;
        if (level.tiles[y]![x] === '.' || level.tiles[y]![x] === '<') expect(v[y * level.width + x] === 1, `${x},${y}`).toBe(d2 <= SIGHT_RADIUS ** 2);
      }
    }
    expect(v[15 * level.width + 20]).toBe(1);
  });

  it('sees the walls that bound visible floor', () => {
    const level = room(6, 4, 3, 2);
    const v = visibleSet(level, level.upStair);
    expect(v.every((c) => c === 1)).toBe(true); // the whole small room and its border
  });

  it('is blocked by walls: a pillar hides the cells behind it', () => {
    const level = levelFrom([
      '###########',
      '#.........#',
      '#.........#',
      '#<..#.....#',
      '#.........#',
      '#.........#',
      '###########',
    ]);
    const v = visibleSet(level, level.upStair);
    const at = (x: number, y: number): number => v[y * level.width + x]!;
    expect(at(4, 3)).toBe(1); // the pillar itself is seen
    expect(at(5, 3)).toBe(0); // directly behind it
    expect(at(7, 3)).toBe(0);
    expect(at(5, 1)).toBe(1); // cells off the shadow's axis are seen
  });

  it('does not see through a wall into the next room, nor around a corner', () => {
    const level = levelFrom([
      '#########',
      '#<..#...#',
      '#...#...#',
      '#...#...#',
      '#########',
    ]);
    const v = visibleSet(level, level.upStair);
    for (let y = 1; y <= 3; y++) for (let x = 5; x <= 7; x++) expect(v[y * level.width + x]).toBe(0);
  });

  it('treats a closed door as blocking and an open door as clear (opacity is supplied by the caller)', () => {
    const level = levelFrom(['#########', '#<..+...#', '#########']);
    const door = { x: 4, y: 1 };
    const seeing = (closed: boolean): Uint8Array =>
      computeVisible(level.width, level.height, level.upStair, (x, y) => level.tiles[y]![x] === '#' || (closed && x === door.x && y === door.y));
    expect(seeing(true)[1 * 9 + 6]).toBe(0);
    expect(seeing(false)[1 * 9 + 6]).toBe(1);
  });

  it('every visible cell on generated levels is within 8 cells of the viewer', () => {
    for (let seed = 0; seed < 30; seed++) {
      const level = generateLevel(seed, 1 + seed, 'medium');
      const v = visibleSet(level, level.upStair);
      for (let i = 0; i < v.length; i++) {
        if (!v[i]) continue;
        const x = i % level.width;
        const y = Math.floor(i / level.width);
        expect((x - level.upStair.x) ** 2 + (y - level.upStair.y) ** 2).toBeLessThanOrEqual(SIGHT_RADIUS ** 2);
      }
    }
  });
});

describe('explored cells (Spec 02)', () => {
  it('every visible cell becomes explored and stays explored after the player moves away', () => {
    const level = room(40, 4, 2, 2);
    const ex = createExploration(level);
    const first = updateExploration(ex, { x: 2, y: 2 }, buildTerrain(level, []));
    for (let i = 0; i < first.length; i++) if (first[i]) expect(ex.explored[i]).toBe(1);
    const seenBefore = ex.explored.filter((c) => c === 1).length;
    const far = updateExploration(ex, { x: 38, y: 2 }, buildTerrain(level, []));
    expect(far[2 * level.width + 2]).toBe(0); // no longer visible...
    expect(ex.explored[2 * level.width + 2]).toBe(1); // ...but remembered
    expect(ex.explored.filter((c) => c === 1).length).toBeGreaterThan(seenBefore);
  });

  it('is plain data that survives a JSON round trip', () => {
    const ex = createExploration(room(5, 5, 2, 2));
    updateExploration(ex, { x: 2, y: 2 }, buildTerrain(room(5, 5, 2, 2), []));
    expect(JSON.parse(JSON.stringify(ex))).toEqual(ex);
  });

  it('starts a new map on the up stair, and moves only orthogonally and not into walls', () => {
    const game = gameOn(levelFrom(['#####', '#<..#', '#####']));
    expect(game.state.map.player).toEqual({ x: 1, y: 1 });
    expect(game.act({ type: 'move', dx: 1, dy: 1 })!.spent).toBe(false);
    expect(game.act({ type: 'move', dx: 0, dy: -1 })!.spent).toBe(false);
    expect(game.act({ type: 'move', dx: 1, dy: 0 })!.spent).toBe(true);
    expect(game.state.map.player).toEqual({ x: 2, y: 1 });
  });
});

describe('camera (Spec 01, Main view and camera)', () => {
  it('centres on the player in the middle of a large level', () => {
    expect(cameraOrigin(140, 60, { x: 70, y: 30 })).toEqual({ x: 35, y: 16 });
  });

  it('clamps at every level edge so no empty space shows past a wall', () => {
    expect(cameraOrigin(140, 60, { x: 2, y: 2 })).toEqual({ x: 0, y: 0 });
    expect(cameraOrigin(140, 60, { x: 138, y: 58 })).toEqual({ x: 70, y: 32 });
    expect(cameraOrigin(100, 44, { x: 98, y: 1 })).toEqual({ x: 30, y: 0 });
  });

  it('follows the player one cell at a time', () => {
    const a = cameraOrigin(140, 60, { x: 70, y: 30 });
    const b = cameraOrigin(140, 60, { x: 71, y: 30 });
    expect(b.x - a.x).toBe(1);
  });

  it('shows a small level exactly, and centres anything smaller than the window', () => {
    expect(cameraOrigin(70, 28, { x: 5, y: 5 })).toEqual({ x: 0, y: 0 });
    expect(cameraOrigin(40, 20, { x: 5, y: 5 })).toEqual({ x: -15, y: -4 });
    expect(cameraOrigin(71, 28, { x: 70, y: 5 }).x).toBe(1);
  });
});

describe('main view drawing (Spec 01): three cell states', () => {
  const view = inner(MAIN_PANE);
  const cell = (g: Grid, x: number, y: number) => {
    const i = (view.y + y) * COLS + view.x + x;
    return { glyph: g.glyph[i]!, fg: g.fg[i]!, bg: g.bg[i]! };
  };

  it('draws unseen blank, remembered dimmed and visible in full colour', () => {
    const level = room(40, 4, 2, 2); // 42 x 6, centred in the 70 x 28 window
    const game = gameOn(level);
    walk(game, 'd'.repeat(26)); // far from the start, which is now out of sight
    const state = game.state.map;
    const g = new Grid();
    drawMap(g, game.state);
    const origin = cameraOrigin(level.width, level.height, state.player, view.w, view.h);
    const at = (lx: number, ly: number) => cell(g, lx - origin.x, ly - origin.y);

    const unseen = at(level.width - 3, 3); // never seen: far from the path
    expect(unseen.glyph).toBe(0);
    expect(unseen.fg).toBe(0);

    const remembered = at(3, 2); // seen at the start, out of sight now
    expect(state.visible[2 * level.width + 3]).toBe(0);
    expect(remembered.glyph).toBe(250);
    expect(remembered.fg).toBe(MAP.floor.remembered);

    const visible = at(state.player.x + 2, 2);
    expect(visible.glyph).toBe(250);
    expect(visible.fg).toBe(MAP.floor.visible);
    expect(at(state.player.x, 0).fg).toBe(MAP.wall.visible);
    expect(at(1, 0).fg).toBe(MAP.wall.remembered);
    expect(new Set([0, MAP.floor.remembered, MAP.floor.visible]).size).toBe(3);
  });

  it('draws stairs as < and > and the player as @ on top', () => {
    const level = levelFrom(['#####', '#<.>#', '#####']);
    const game = gameOn(level);
    const state = game.state.map;
    const g = new Grid();
    drawMap(g, game.state);
    const origin = cameraOrigin(level.width, level.height, state.player, view.w, view.h);
    expect(cell(g, 1 - origin.x, 1 - origin.y).glyph).toBe(64); // the player stands on the up stair
    expect(cell(g, 3 - origin.x, 1 - origin.y).glyph).toBe(62);
    walk(game, 'd');
    drawMap(g, game.state);
    expect(cell(g, 1 - origin.x, 1 - origin.y).glyph).toBe(60);
  });

  it('keeps the player at the centre of the view in the middle of a large level, and shows no map past the level', () => {
    const level = generateLevel(5, 3, 'large');
    const game = gameOn(level);
    game.state.map.player = { x: 70, y: 30 };
    game.state.map.visible = updateExploration(game.state.map.exploration, game.state.map.player, game.state.map.terrain);
    const g = new Grid();
    drawMap(g, game.state);
    expect(cell(g, 35, 14).glyph).toBe(64);
  });

  it('the shell moves the player on WASD and draws the map, and says so only when no level is loaded', () => {
    const shell = new Shell('Test', {
      name: 'M', className: 'T', level: 1, xp: 0, xpNext: 1, bank: 0, carried: 0, stats: [], equipment: [],
      abilities: [], status: [], wait: { rounds: 0, needed: 10 }, inventory: { used: 0, total: 12 },
    });
    shell.handleKey({ key: 'd', shiftKey: false });
    expect(shell.log.lines(shell.turn).some((l) => l.text.includes('not yet available'))).toBe(true);
    shell.game = gameOn(levelFrom(['#####', '#<..#', '#####']));
    shell.handleKey({ key: 'd', shiftKey: false });
    expect(shell.game.state.map.player).toEqual({ x: 2, y: 1 });
    const g = new Grid();
    shell.draw(g);
    expect(g.glyph.includes(64)).toBe(true);
  });
});
