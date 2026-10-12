// The isometric renderer with no art (Spec 01b, Tests; task 6.3): the draw list is checked without pixels for the
// projection and camera, the depth order, the cutaway rule, the three visibility states, the markers and the fallback
// chain; then the painter is checked on a recording canvas, and the text display is left as it was.

import { describe, expect, it } from 'vitest';
import type { Game } from '../src/game/game.ts';
import { ALLY_COLOUR, BANDIT, RIVAL } from '../src/game/monsters.ts';
import { applyStatus } from '../src/rules/magic/status.ts';
import type { Atlas } from '../src/ui/atlas.ts';
import { paintIso, type IsoContext } from '../src/ui/iso-paint.ts';
import {
  CAMERA_ANCHOR, CAP_H, ISO_LAYERS, ISO_VIEW, TILE_H, TILE_W, WALL_H, buildIsoDraws, isoArea, project, resolveAsset, type IsoDraw,
} from '../src/ui/iso-view.ts';
import { DEFAULT_LOOK, MAP, NPC_LOOK, mapLook } from '../src/ui/palette.ts';
import { buildScene, type SceneCell } from '../src/ui/scene.ts';
import { GOLDEN_CASES, frozenLevel } from './frozen.ts';
import { cell, gameAt, gameOn, levelFrom, monsterAt, room, walk, withThings } from './helpers.ts';

const at = (draws: IsoDraw[], x: number, y: number): IsoDraw[] => draws.filter((d) => d.cell.x === x && d.cell.y === y);
const one = (draws: IsoDraw[], x: number, y: number, layer: IsoDraw['layer']): IsoDraw | undefined => at(draws, x, y).find((d) => d.layer === layer);
const wallHeight = (draws: IsoDraw[], x: number, y: number): number | undefined => one(draws, x, y, 'wall')?.height;

describe('isometric projection and camera (Spec 01b)', () => {
  it('puts cell centres on the 2:1 diamond grid, with map north up and to the right', () => {
    const cam = { x: 10, y: 10 };
    const me = project(10, 10, cam);
    expect(me).toEqual({ x: ISO_VIEW.x + CAMERA_ANCHOR.x, y: ISO_VIEW.y + CAMERA_ANCHOR.y });
    expect(me).toEqual({ x: 9 + 315, y: 16 + 260 });
    const offset = (x: number, y: number) => {
      const p = project(x, y, cam);
      return [p.x - me.x, p.y - me.y];
    };
    expect(offset(10, 9)).toEqual([TILE_W / 2, -TILE_H / 2]); // north: up and right
    expect(offset(11, 10)).toEqual([16, 8]); // east: down and right
    expect(offset(10, 11)).toEqual([-16, 8]); // south: down and left
    expect(offset(9, 10)).toEqual([-16, -8]); // west: up and left
    expect(offset(13, 7)).toEqual([(3 + 3) * 16, 0]);
  });

  it('rounds every position to a whole pixel while the camera moves between cells', () => {
    for (const f of [0.1, 0.25, 0.5, 0.77]) {
      const p = project(4, 7, { x: 5 + f, y: 5 });
      expect(Number.isInteger(p.x) && Number.isInteger(p.y)).toBe(true);
    }
  });

  it('has the view area inside the main view border, 630 x 448 px at (9, 16)', () => {
    expect(ISO_VIEW).toEqual({ x: 9, y: 16, w: 630, h: 448 });
  });

  it('shows every cell within the player\'s sight (8 cells) in every direction', () => {
    const cam = { x: 50, y: 50 };
    const area = isoArea(cam);
    for (let dy = -8; dy <= 8; dy++) {
      for (let dx = -8; dx <= 8; dx++) {
        const p = project(50 + dx, 50 + dy, cam);
        expect(p.x - TILE_W / 2).toBeGreaterThanOrEqual(ISO_VIEW.x);
        expect(p.x + TILE_W / 2).toBeLessThanOrEqual(ISO_VIEW.x + ISO_VIEW.w);
        expect(p.y - TILE_H / 2 - WALL_H).toBeGreaterThanOrEqual(ISO_VIEW.y);
        expect(p.y + TILE_H / 2).toBeLessThanOrEqual(ISO_VIEW.y + ISO_VIEW.h);
        expect(50 + dx >= area.x && 50 + dx < area.x + area.w && 50 + dy >= area.y && 50 + dy < area.y + area.h).toBe(true);
      }
    }
  });

  it('draws the whole sight of a player in a big open room, and centres on the player', () => {
    const level = room(40, 40, 20, 20);
    const game = gameOn(level);
    const draws = buildIsoDraws(game.state);
    const { player, visible } = game.state.map;
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        if (visible[y * level.width + x] !== 1) continue;
        expect(at(draws, x, y).length, `${x},${y}`).toBeGreaterThan(0);
      }
    }
    expect(one(draws, player.x, player.y, 'creature')).toMatchObject({ x: 324, y: 276, glyph: 64 });
  });

  it('leaves out draws that miss the view area, and keeps those whose sprite box reaches into it', () => {
    const level = room(80, 80, 40, 40);
    const game = gameOn(level);
    game.state.map.exploration.explored.fill(1);
    const draws = buildIsoDraws(game.state);
    for (const d of draws) {
      const b = d.box;
      expect(b.x < ISO_VIEW.x + ISO_VIEW.w && b.x + b.w > ISO_VIEW.x && b.y < ISO_VIEW.y + ISO_VIEW.h && b.y + b.h > ISO_VIEW.y).toBe(true);
    }
    // Far corners of the level are known but off screen.
    expect(at(draws, 1, 1)).toHaveLength(0);
    expect(at(draws, 80, 80)).toHaveLength(0);
    // A cell straight below the view's bottom edge is out; one whose wall block pokes up into it is in.
    const below = Math.ceil((ISO_VIEW.h - CAMERA_ANCHOR.y + TILE_H / 2) / TILE_H);
    expect(at(draws, 40 + below + 1, 40 + below + 1)).toHaveLength(0);
  });
});

describe('isometric depth order (Spec 01b, Draw order)', () => {
  it('draws cells back to front by x + y, then by x, and each cell\'s layers in order', () => {
    const level = withThings(room(12, 12, 6, 6), { piles: [{ x: 7, y: 6, contents: [{ kind: 'coins', amount: 3 }] }] });
    const game = gameOn(level);
    game.state.monsters.push(monsterAt(7, 6));
    const draws = buildIsoDraws(game.state);
    for (let i = 1; i < draws.length; i++) {
      const a = draws[i - 1]!;
      const b = draws[i]!;
      const key = (d: IsoDraw) => [d.cell.x + d.cell.y, d.cell.x, ISO_LAYERS.indexOf(d.layer)];
      const [ka, kb] = [key(a), key(b)];
      const cmp = ka[0]! - kb[0]! || ka[1]! - kb[1]! || ka[2]! - kb[2]!;
      expect(cmp).toBeLessThanOrEqual(0);
    }
    expect(at(draws, 7, 6).map((d) => d.layer)).toEqual(['floor', 'item', 'creature']);
  });

  it('lets nearer things cover farther ones: a creature in front of a wall paints after it', () => {
    const level = room(6, 6, 3, 3);
    const game = gameOn(level);
    game.state.monsters.push(monsterAt(1, 1));
    const draws = buildIsoDraws(game.state);
    const wall = draws.indexOf(one(draws, 1, 0, 'wall')!);
    const goblin = draws.indexOf(one(draws, 1, 1, 'creature')!);
    const nearWall = draws.indexOf(one(draws, 1, 7, 'wall')!);
    expect(wall).toBeLessThan(goblin);
    expect(goblin).toBeLessThan(nearWall);
  });
});

describe('isometric walls and doors (Spec 01b, Walls and doors)', () => {
  // A 6 x 4 room inside a wall border: x 0 and 7, y 0 and 5 are walls.
  const level = room(6, 4, 3, 2);

  it.each([
    [1, 1],
    [6, 4],
    [3, 2],
  ])('stands the far walls and cuts the near walls, corner included, with the player at (%i, %i)', (px, py) => {
    const game = gameAt(level, px, py);
    const draws = buildIsoDraws(game.state);
    for (let x = 0; x <= 7; x++) expect(wallHeight(draws, x, 0), `north ${x}`).toBe(WALL_H); // far side: north
    for (let y = 0; y <= 5; y++) expect(wallHeight(draws, 0, y), `west ${y}`).toBe(WALL_H); // far side: west
    for (let x = 1; x <= 7; x++) expect(wallHeight(draws, x, 5), `south ${x}`).toBe(CAP_H); // near side: south
    for (let y = 1; y <= 5; y++) expect(wallHeight(draws, 7, y), `east ${y}`).toBe(CAP_H); // near side: east
    expect(one(draws, 7, 5, 'wall')).toMatchObject({ frame: 'cap', height: CAP_H }); // the near corner
    expect(one(draws, 0, 5, 'wall')!.frame).toBe('full');
  });

  it('keeps a wall full when the cell behind it is unknown, and counts remembered cells as known', () => {
    const rows = ['#######', '#.....#', '#.....#', '###.###', '#..<..#', '#######'];
    const game = gameAt(levelFrom(rows), 3, 4);
    let draws = buildIsoDraws(game.state);
    // The wall row y = 3 hides the upper room, which is not yet seen except through the gap.
    expect(wallHeight(draws, 1, 3)).toBe(WALL_H);
    walk(game, 'ww');
    walk(game, 'ss');
    draws = buildIsoDraws(game.state);
    expect(wallHeight(draws, 1, 3)).toBe(CAP_H); // the upper room is remembered now
  });

  it('draws a door as a block in its wall cell, by the same height rule, with its state as the frame', () => {
    const rows = ['#######', '#..<..#', '###+###', '#.....#', '#######'];
    const base = levelFrom(rows);
    const lvl = withThings(base, { doors: [{ x: 3, y: 2, kind: 'locked' }] });
    const game = gameAt(lvl, 3, 1);
    game.state.map.exploration.explored.fill(1);
    const door = one(buildIsoDraws(game.state), 3, 2, 'wall')!;
    expect(door).toMatchObject({ shape: 'block', frame: 'locked-cap', height: CAP_H, glyph: 43 });
  });
});

describe('isometric visibility (Spec 01b, Visibility)', () => {
  it('draws no unseen cell, remembered terrain and features dimmed with no creatures or items, and visible cells in full', () => {
    const level = withThings(room(40, 4, 2, 2), {
      piles: [{ x: 4, y: 2, contents: [{ kind: 'coins', amount: 5 }] }],
      features: [{ x: 5, y: 3, type: 'container', kind: 'chest', contents: [] }],
    });
    const game = gameOn(level);
    game.state.monsters.push(monsterAt(6, 2));
    walk(game, 'd'.repeat(14));
    const draws = buildIsoDraws(game.state);
    const { player } = game.state.map;
    expect(at(draws, 39, 2)).toHaveLength(0); // never seen
    const floor = one(draws, 4, 2, 'floor')!;
    expect(floor).toMatchObject({ dim: true, fg: MAP.floor.remembered });
    expect(one(draws, 4, 2, 'item')).toBeUndefined();
    expect(one(draws, 6, 2, 'creature')).toBeUndefined();
    expect(one(draws, 5, 3, 'feature')).toMatchObject({ dim: true, fg: MAP.container.remembered, frame: 'closed' });
    expect(one(draws, player.x + 2, 2, 'floor')).toMatchObject({ dim: false, fg: MAP.floor.visible });
  });
});

describe('isometric markers (Spec 01b, Sprites)', () => {
  const lvl = () =>
    withThings(room(12, 6, 2, 2), { npcs: [{ x: 4, y: 4, kind: 'trader', name: 'Oda' }, { x: 5, y: 4, kind: 'hermit', name: 'Ulf' }] });

  it('stands allies on a ring in the ally colour, and people on a ring in their role colour', () => {
    const game = gameOn(lvl());
    game.state.monsters.push(
      monsterAt(3, 3, { kind: 'ally', ally: 'raised' }),
      monsterAt(6, 3, { kind: 'rival', glyph: RIVAL.glyph, colour: RIVAL.colour }),
      monsterAt(7, 3, { kind: 'bandit', glyph: BANDIT.glyph, colour: BANDIT.colour }),
      monsterAt(8, 3),
    );
    const draws = buildIsoDraws(game.state);
    expect(one(draws, 3, 3, 'marker')).toMatchObject({ shape: 'ring', fg: ALLY_COLOUR });
    expect(one(draws, 4, 4, 'marker')).toMatchObject({ shape: 'ring', fg: NPC_LOOK['trader']!.colour });
    expect(one(draws, 5, 4, 'marker')).toMatchObject({ shape: 'ring', fg: NPC_LOOK['hermit']!.colour });
    expect(one(draws, 6, 3, 'marker')).toMatchObject({ shape: 'ring', fg: RIVAL.colour });
    expect(one(draws, 7, 3, 'marker')).toMatchObject({ shape: 'ring', fg: BANDIT.colour });
    expect(one(draws, 8, 3, 'marker')).toBeUndefined(); // a plain monster has none
    expect(one(draws, 2, 2, 'marker')).toBeUndefined(); // nor the player
  });

  it('draws the phantom half transparent and a boss at the large size', () => {
    const game = gameOn(lvl());
    game.state.monsters.push(monsterAt(3, 3, { kind: 'ally', ally: 'phantom', glyph: '@' }), monsterAt(6, 3, { role: 'boss', glyph: 'D' }));
    const draws = buildIsoDraws(game.state);
    expect(one(draws, 3, 3, 'creature')).toMatchObject({ alpha: 0.5, glyph: 64 });
    expect(one(draws, 6, 3, 'creature')).toMatchObject({ large: true, alpha: 1 });
    expect(one(draws, 6, 3, 'creature')!.box.h).toBe(80);
  });

  it('puts status icons over a head, at most three, in the Status block\'s order with the Shield last', () => {
    const game = gameOn(lvl());
    const me = game.state.player;
    applyStatus(me.statuses, 'blessed', 5);
    me.shield = 2;
    const goblin = monsterAt(6, 3);
    applyStatus(goblin.statuses, 'poisoned', null);
    applyStatus(goblin.statuses, 'slowed', 3);
    applyStatus(goblin.statuses, 'held', 3);
    applyStatus(goblin.statuses, 'frightened', 3);
    game.state.monsters.push(goblin);
    const pack = new Set(['icon-blessed', 'icon-shield', 'icon-poisoned', 'icon-slowed', 'icon-held']);
    let draws = buildIsoDraws(game.state, { pack });
    const icons = (x: number, y: number) => at(draws, x, y).filter((d) => d.layer === 'effect');
    expect(icons(2, 2).map((d) => d.asset)).toEqual(['icon-blessed', 'icon-shield']);
    expect(icons(6, 3).map((d) => d.asset)).toEqual(['icon-poisoned', 'icon-slowed', 'icon-held']);
    const head = one(draws, 6, 3, 'creature')!;
    for (const icon of icons(6, 3)) expect(icon.y).toBeLessThan(head.y - 32);
    // With no art, an icon has no glyph to fall back to: it is listed, and draws nothing.
    draws = buildIsoDraws(game.state);
    expect(icons(2, 2).every((d) => d.asset === null && d.shape === 'none')).toBe(true);
  });
});

describe('isometric fallback chain (Spec 08, Addendum B)', () => {
  it('takes the first candidate the pack has, else the glyph', () => {
    expect(resolveAsset(['npc-rival', 'family-r-cap'], new Set(['family-r-cap', 'npc-rival']))).toBe('npc-rival');
    expect(resolveAsset(['npc-rival', 'family-r-cap'], new Set(['family-r-cap']))).toBe('family-r-cap');
    expect(resolveAsset(['npc-rival', 'family-r-cap'], new Set())).toBeNull();
    expect(resolveAsset(['family-g'], null)).toBeNull();
  });

  it('with no art, draws everything by its glyph shape: diamonds, blocks and cards', () => {
    const level = withThings(room(8, 6, 2, 2), { piles: [{ x: 4, y: 2, contents: [{ kind: 'coins', amount: 5 }] }] });
    const game = gameOn(level);
    game.state.monsters.push(monsterAt(5, 3));
    const draws = buildIsoDraws(game.state);
    expect(draws.every((d) => d.asset === null)).toBe(true);
    expect(one(draws, 3, 3, 'floor')).toMatchObject({ shape: 'diamond', glyph: 250 });
    expect(one(draws, 3, 0, 'wall')).toMatchObject({ shape: 'block', glyph: 35 });
    expect(one(draws, 4, 2, 'item')).toMatchObject({ shape: 'card', glyph: 36 });
    expect(one(draws, 5, 3, 'creature')).toMatchObject({ shape: 'card', glyph: 103, fg: 0x7fc75a });
  });

  it('names each thing\'s sprite when the pack has it: terrain, family recoloured by its colour, class, people and items', () => {
    const level = withThings(room(8, 6, 2, 2), {
      piles: [{ x: 4, y: 2, contents: [{ kind: 'coins', amount: 5 }] }],
      npcs: [{ x: 6, y: 4, kind: 'captive', name: 'Ilse' }],
      features: [{ x: 3, y: 4, type: 'container', kind: 'rack', contents: [] }],
    });
    const game = gameOn(level);
    game.state.player.classId = 'warrior';
    game.state.monsters.push(monsterAt(5, 3), monsterAt(6, 3, { kind: 'rival', glyph: 'R', colour: RIVAL.colour }), monsterAt(4, 4, { glyph: 'H', colour: 0x123456 }));
    const pack = new Set(['terrain-floor', 'terrain-wall', 'family-g', 'family-h-cap', 'family-r-cap', 'class-warrior', 'npc-captive', 'family-coins', 'feature-weapon-rack']);
    const draws = buildIsoDraws(game.state, { pack });
    expect(one(draws, 3, 3, 'floor')!.asset).toBe('terrain-floor');
    expect(one(draws, 3, 0, 'wall')).toMatchObject({ asset: 'terrain-wall', frame: 'full' });
    expect(one(draws, 3, 7, 'wall')).toMatchObject({ asset: 'terrain-wall', frame: 'cap' });
    expect(one(draws, 5, 3, 'creature')).toMatchObject({ asset: 'family-g', tint: 0x7fc75a, frame: 'idle' });
    expect(one(draws, 4, 4, 'creature')).toMatchObject({ asset: 'family-h-cap', tint: 0x123456 });
    expect(one(draws, 6, 3, 'creature')!.asset).toBe('family-r-cap'); // no npc-rival yet: its family
    expect(one(draws, 2, 2, 'creature')!.asset).toBe('class-warrior');
    expect(one(draws, 6, 4, 'creature')!.asset).toBe('npc-captive');
    expect(one(draws, 4, 2, 'item')!.asset).toBe('family-coins');
    expect(one(draws, 3, 4, 'feature')).toMatchObject({ asset: 'feature-weapon-rack', frame: 'closed' });
  });

  it('draws the floor\'s art under a rising stair\'s art, which stands on it (Spec 01b, clarification of task 6.5)', () => {
    const game = gameOn(room(8, 6, 2, 2));
    const stair = at(buildIsoDraws(game.state, { pack: new Set(['terrain-floor', 'terrain-stairs-up']) }), 2, 2).filter((d) => d.layer === 'floor');
    expect(stair.map((d) => d.asset)).toEqual(['terrain-floor', 'terrain-stairs-up']);
    // With no stair art, or no floor art, the stair is one draw as before.
    expect(at(buildIsoDraws(game.state, { pack: new Set(['terrain-stairs-up']) }), 2, 2).filter((d) => d.layer === 'floor')).toHaveLength(1);
    expect(at(buildIsoDraws(game.state), 2, 2).filter((d) => d.layer === 'floor')).toHaveLength(1);
  });

  it('draws searched debris with its one drawn state, not the glyph (task 6.5)', () => {
    const level = withThings(room(8, 6, 2, 2), { features: [{ x: 3, y: 2, type: 'debris' }] });
    const game = gameOn(level);
    game.state.used.searched.push(cell(level, 3, 2));
    const debris = at(buildIsoDraws(game.state, { pack: new Set(['terrain-debris']) }), 3, 2).find((d) => d.layer === 'mark');
    expect(debris).toMatchObject({ asset: 'terrain-debris', frame: '' });
  });

  it('spreads the floor variants with no grid: a cell four along does not repeat its variant', () => {
    const game = gameOn(room(40, 20, 2, 2));
    const draws = buildIsoDraws(game.state).filter((d) => d.layer === 'floor');
    const variant = new Map(draws.map((d) => [`${d.cell.x},${d.cell.y}`, d.variant]));
    let pairs = 0;
    let same = 0;
    for (const d of draws) {
      const v = variant.get(`${d.cell.x + 4},${d.cell.y}`);
      if (v === undefined) continue;
      pairs++;
      if (v === d.variant) same++;
    }
    expect(pairs).toBeGreaterThan(20);
    expect(same / pairs).toBeLessThan(0.5);
  });

  it('keeps each floor cell\'s variant as the camera moves', () => {
    const game = gameOn(room(20, 6, 2, 2));
    const before = one(buildIsoDraws(game.state), 6, 3, 'floor')!.variant;
    walk(game, 'dd');
    expect(one(buildIsoDraws(game.state), 6, 3, 'floor')!.variant).toBe(before);
    expect(before).toBeGreaterThanOrEqual(0);
    expect(before).toBeLessThan(4);
  });
});

describe('isometric display with no art: complete (Spec 01b, acceptance)', () => {
  it.each(GOLDEN_CASES)('seed %i level %i: every layer of every cell in view is drawn in the text display\'s glyph and colour', (seed, depth) => {
    const level = frozenLevel(seed, depth);
    if (!level) return;
    const game = gameOn(level);
    const { state } = game;
    state.map.exploration.explored.fill(1);
    state.map.visible = Uint8Array.from({ length: level.width * level.height }, (_, i) => (i % 3 === 0 ? 0 : 1));
    state.revealed.push(...level.traps.map((t) => t.y * level.width + t.x));
    const look = mapLook({ palette: { wall: '#808080', floor: '#303030', door: '#a06030' }, tiles: { wall: 219, floor: 46 } });
    for (const look_ of [DEFAULT_LOOK, look]) {
      for (const p of [level.upStair, level.downStair ?? level.upStair]) {
        state.map.player = { ...p };
        const draws = buildIsoDraws(state, { look: look_ });
        const scene = buildScene(state, isoArea(p), look_);
        let checked = 0;
        for (const cell of scene.cells) {
          if (!cell) continue;
          const mine = at(draws, cell.x, cell.y);
          const centre = project(cell.x, cell.y, p);
          const inView = centre.x > ISO_VIEW.x && centre.x < ISO_VIEW.x + ISO_VIEW.w && centre.y > ISO_VIEW.y && centre.y < ISO_VIEW.y + ISO_VIEW.h;
          if (!inView) continue;
          for (const layer of [cell.terrain, cell.trap, cell.feature, cell.item, cell.occupant] as SceneCell['terrain'][]) {
            if (!layer) continue;
            expect(mine.some((d) => d.glyph === layer.glyph && d.fg === layer.fg && d.shape !== 'none'), `${cell.x},${cell.y}`).toBe(true);
            checked++;
          }
        }
        expect(checked).toBeGreaterThan(100);
      }
    }
  });
});

describe('painting the draw list', () => {
  /** A canvas that records what was painted. */
  function recorder() {
    const calls: string[] = [];
    const ctx: IsoContext = {
      fillStyle: '',
      globalAlpha: 1,
      fillRect: (x, y, w, h) => void calls.push(`rect ${String(ctx.fillStyle)} ${x},${y} ${w}x${h} a${ctx.globalAlpha}`),
      drawImage: () => undefined,
      save: () => void calls.push('save'),
      restore: () => void calls.push('restore'),
      beginPath: () => undefined,
      rect: (x, y, w, h) => void calls.push(`clip ${x},${y} ${w}x${h}`),
      clip: () => undefined,
    };
    const glyphs: string[] = [];
    const atlas: Atlas = { draw: (_c, code, fg, dx, dy) => void glyphs.push(`${code} ${fg.toString(16)} ${dx},${dy}`) };
    return { ctx, calls, glyphs, atlas };
  }

  const game = (): Game => {
    const g = gameOn(room(8, 6, 2, 2));
    g.state.monsters.push(monsterAt(3, 3), monsterAt(4, 3, { kind: 'ally', ally: 'phantom', glyph: '@' }));
    return g;
  };

  it('clips to the view area, clears it, and paints every glyph the draws fall back to', () => {
    const { ctx, calls, glyphs, atlas } = recorder();
    const draws = buildIsoDraws(game().state);
    paintIso(ctx, draws, atlas);
    expect(calls[0]).toBe('save');
    expect(calls[1]).toBe(`clip ${ISO_VIEW.x},${ISO_VIEW.y} ${ISO_VIEW.w}x${ISO_VIEW.h}`);
    expect(calls[2]).toBe(`rect #000000 9,16 630x448 a1`);
    expect(calls.at(-1)).toBe('restore');
    // Every diamond, card and door carries its glyph; walls and rings do not.
    const withGlyph = draws.filter((d) => d.shape === 'diamond' || d.shape === 'card' || (d.shape === 'block' && d.frame !== 'full' && d.frame !== 'cap'));
    expect(glyphs).toHaveLength(withGlyph.length);
    const goblin = one(draws, 3, 3, 'creature')!;
    expect(glyphs).toContain(`103 7fc75a ${goblin.x - 5 + 1},${goblin.y + 2 - 18 + 1}`);
    // The phantom's card is half transparent.
    expect(calls.some((c) => c.endsWith('a0.5'))).toBe(true);
  });

  it('lets a sprite source draw what it has, and falls back to the glyph where it declines', () => {
    const { ctx, glyphs, atlas } = recorder();
    const g = game();
    const draws = buildIsoDraws(g.state, { pack: new Set(['family-g']) });
    const drawn: string[] = [];
    paintIso(ctx, draws, atlas, { draw: (_c, d) => (drawn.push(d.asset!), true) });
    expect(drawn).toEqual(['family-g']);
    expect(glyphs.some((s) => s.startsWith('103 '))).toBe(false); // the goblin came from its sprite
    const { ctx: ctx2, glyphs: glyphs2, atlas: atlas2 } = recorder();
    paintIso(ctx2, draws, atlas2, { draw: () => false });
    expect(glyphs2.some((s) => s.startsWith('103 '))).toBe(true);
  });

  it('paints a full wall taller than a cap', () => {
    const tops = (frame: string, height: number): number => {
      const { ctx, calls, atlas } = recorder();
      const d: IsoDraw = { cell: { x: 0, y: 0 }, layer: 'wall', x: 100, y: 100, asset: null, frame, variant: 0, tint: 0x808080, shape: 'block', glyph: 35, fg: 0x808080, height, alpha: 1, dim: false, large: false, box: { x: 0, y: 0, w: 1, h: 1 } };
      paintIso(ctx, [d], atlas);
      return Math.min(...calls.filter((c) => c.startsWith('rect #808080')).map((c) => Number(c.split(' ')[2]!.split(',')[1])));
    };
    expect(tops('full', WALL_H)).toBe(100 - WALL_H - TILE_H / 2);
    expect(tops('cap', CAP_H)).toBe(100 - CAP_H - TILE_H / 2);
  });
});
