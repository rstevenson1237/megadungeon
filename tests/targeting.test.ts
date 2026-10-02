import { describe, expect, it } from 'vitest';
import { Targeting, startTargeting, validTargets } from '../src/game/targeting.ts';
import { bearingFromNorth, distanceCells, lineCells, squareFootprint } from '../src/rules/world/geometry.ts';
import { COLS, Grid } from '../src/ui/grid.ts';
import { cameraOrigin } from '../src/ui/camera.ts';
import { drawMap } from '../src/ui/map-view.ts';
import { TARGET } from '../src/ui/palette.ts';
import { MAIN_PANE, inner } from '../src/ui/panes.ts';
import { gameOn, levelFrom, monsterAt, press, room, screenText, shellOn, stonesLeft } from './helpers.ts';

// A 21 x 21 open room, the player in the middle at (11,11).
const open = () => room(21, 21, 11, 11);
const names = (list: { x: number; y: number }[]): string => list.map((m) => `${m.x},${m.y}`).join(' ');

describe('geometry', () => {
  it('draws a Bresenham line, leaving out the start and keeping the end', () => {
    expect(lineCells({ x: 0, y: 0 }, { x: 4, y: 0 })).toEqual([1, 2, 3, 4].map((x) => ({ x, y: 0 })));
    const diag = lineCells({ x: 0, y: 0 }, { x: 3, y: 3 });
    expect(diag).toEqual([{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }]);
    const shallow = lineCells({ x: 28, y: 6 }, { x: 34, y: 4 }); // the mockup's path
    expect(shallow.at(-1)).toEqual({ x: 34, y: 4 });
    expect(shallow).toHaveLength(6);
    expect(lineCells({ x: 2, y: 2 }, { x: 2, y: 2 })).toEqual([]);
  });

  it('measures bearings clockwise from north', () => {
    const o = { x: 5, y: 5 };
    const b = (x: number, y: number): number => bearingFromNorth(o, { x, y }) / (Math.PI / 2);
    expect([b(5, 3), b(7, 5), b(5, 7), b(3, 5)]).toEqual([0, 1, 2, 3]);
    expect(b(6, 4)).toBeCloseTo(0.5);
  });

  it('rounds distances to whole cells and builds odd squares', () => {
    expect(distanceCells({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(distanceCells({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(1);
    expect(squareFootprint({ x: 5, y: 5 }, 3)).toHaveLength(9);
    expect(squareFootprint({ x: 5, y: 5 }, 5)).toHaveLength(25);
  });
});

describe('valid targets (Spec 01, Targeting)', () => {
  it('are visible, in range, and sorted by distance, ties clockwise from north', () => {
    const game = gameOn(open());
    // All four at distance 3: north, east, south, west; added in scrambled order.
    game.state.monsters.push(monsterAt(8, 11), monsterAt(11, 14), monsterAt(14, 11), monsterAt(11, 8));
    const got = validTargets(game, 6);
    expect(names(got)).toBe('11,8 14,11 11,14 8,11'); // N, E, S, W
  });

  it('puts nearer targets first whatever their bearing', () => {
    const game = gameOn(open());
    game.state.monsters.push(monsterAt(11, 15), monsterAt(12, 11), monsterAt(11, 7));
    expect(names(validTargets(game, 6))).toBe('12,11 11,7 11,15'); // 1, 4, 4 away, N before S
  });

  it('leave out creatures beyond range, using straight-line distance', () => {
    const game = gameOn(open());
    game.state.monsters.push(monsterAt(17, 11), monsterAt(18, 11), monsterAt(15, 15));
    // 6 away is in range; 7 is not; (4,4) is 5.66 away, in range.
    expect(names(validTargets(game, 6))).toBe('15,15 17,11');
    game.state.monsters.push(monsterAt(16, 15)); // (5,4): 6.4 away, out of range 6
    expect(names(validTargets(game, 6))).toBe('15,15 17,11');
  });

  it('leave out creatures that are not visible (behind a wall)', () => {
    const game = gameOn(levelFrom(['#########', '#<..#...#', '#########']));
    game.state.monsters.push(monsterAt(6, 1));
    expect(validTargets(game, 8)).toEqual([]);
  });

  it('leave out a creature behind a closed door, and include it once the door is open', () => {
    const game = gameOn(levelFrom(['#########', '#<..+...#', '#########']));
    game.state.monsters.push(monsterAt(6, 1));
    expect(validTargets(game, 8)).toEqual([]);
    game.act({ type: 'move', dx: 1, dy: 0 });
    game.act({ type: 'move', dx: 1, dy: 0 });
    game.act({ type: 'move', dx: 1, dy: 0 }); // opens the door
    expect(validTargets(game, 8)).toHaveLength(1);
  });

  it('leave out a creature with another creature in the line of fire', () => {
    const game = gameOn(open());
    game.state.monsters.push(monsterAt(13, 11), monsterAt(15, 11));
    expect(names(validTargets(game, 6))).toBe('13,11'); // the farther one is shielded
  });
});

describe('targeting session (Spec 01, Targeting)', () => {
  const setup = () => {
    const game = gameOn(open());
    game.state.monsters.push(monsterAt(11, 8), monsterAt(14, 11), monsterAt(11, 14), monsterAt(8, 11), monsterAt(12, 12));
    return game;
  };
  const single = { range: 6, shape: { kind: 'single' } } as const;

  it('starts on the closest valid target', () => {
    const t = startTargeting(setup(), single)!;
    expect([t.selected.x, t.selected.y]).toEqual([12, 12]);
    expect(t.index).toBe(0);
  });

  it('cycles forward with Tab and back with Shift+Tab, wrapping at both ends', () => {
    const t = startTargeting(setup(), single)!;
    const order = t.targets.map((m) => `${m.x},${m.y}`);
    expect(order).toEqual(['12,12', '11,8', '14,11', '11,14', '8,11']);
    const seen: string[] = [];
    for (let i = 0; i < 6; i++) {
      seen.push(`${t.selected.x},${t.selected.y}`);
      t.next();
    }
    expect(seen).toEqual([...order, '12,12']); // wrapped to the start
    const back = startTargeting(setup(), single)!;
    back.prev(); // from the first, back to the last
    expect(`${back.selected.x},${back.selected.y}`).toBe('8,11');
    back.next();
    expect(back.index).toBe(0);
  });

  it('returns null when there is no valid target', () => {
    expect(startTargeting(gameOn(open()), single)).toBeNull();
  });

  it('draws the path as the line to the target, both ends left out', () => {
    const game = gameOn(open());
    game.state.monsters.push(monsterAt(15, 11));
    const t = startTargeting(game, single)!;
    expect(names(t.path())).toBe('12,11 13,11 14,11');
    expect(t.footprint()).toEqual([]);
    expect(t.marked()).toEqual([]);
  });

  it('previews a 3 x 3 area footprint around the selected target and marks the monsters inside', () => {
    const game = gameOn(open());
    game.state.monsters.push(monsterAt(15, 11), monsterAt(16, 12), monsterAt(18, 11), monsterAt(11, 11 + 5));
    const t = startTargeting(game, { range: 8, shape: { kind: 'area', size: 3 } })!;
    expect(t.selected.x).toBe(15);
    const cells = t.footprint().map((c) => `${c.x},${c.y}`);
    expect(cells).toHaveLength(9);
    for (let y = 10; y <= 12; y++) for (let x = 14; x <= 16; x++) expect(cells).toContain(`${x},${y}`);
    expect(names(t.marked().sort((a, b) => a.x - b.x))).toBe('15,11 16,12'); // 18,11 is outside
    expect(t.includesPlayer()).toBe(false);
  });

  it('previews a 5 x 5 footprint, clipped at the map edge, and shows when the caster stands in it', () => {
    const game = gameOn(room(21, 21, 2, 2));
    game.state.monsters.push(monsterAt(1, 1));
    const t = startTargeting(game, { range: 8, shape: { kind: 'area', size: 5 } })!;
    expect(t.footprint().every((c) => c.x >= 0 && c.y >= 0)).toBe(true);
    expect(t.footprint().length).toBeLessThan(25);
    expect(t.includesPlayer()).toBe(true); // the caster is in the footprint (Spec 04)
  });

  it('builds the Target block: name, rating, distance and position in the list', () => {
    const game = gameOn(open());
    game.state.monsters.push(monsterAt(15, 11), monsterAt(11, 8, { name: 'ogre', maxDice: 2, modifier: 1 }));
    const t = new Targeting(game, single, validTargets(game, 6));
    expect(t.paneTarget('d6')).toEqual({ name: 'ogre', rating: 'd6', distance: 3, index: 1, count: 2 });
  });
});

describe('targeting in the shell (Spec 01): F then Enter is the quick shot', () => {
  const shell = () => shellOn(open(), [monsterAt(14, 11), monsterAt(11, 15, { name: 'ogre', glyph: 'O', maxDice: 2, modifier: 1 })]);

  it('F starts on the closest target and fills the Target block; Tab cycles it', () => {
    const s = shell();
    press(s, 'f');
    expect(s.targeting!.selected.name).toBe('goblin');
    expect(s.character.target).toEqual({ name: 'goblin', rating: 'd6', distance: 3, index: 1, count: 2 });
    press(s, 'Tab');
    expect(s.character.target).toEqual({ name: 'ogre', rating: '2d6+1', distance: 4, index: 2, count: 2 });
    press(s, 'Tab', true); // Shift+Tab goes back
    expect(s.character.target!.name).toBe('goblin');
    expect(screenText(s).some((l) => l.includes('Target 1 of 2'))).toBe(true);
  });

  it('Esc cancels with no turn spent and clears the Target block', () => {
    const s = shell();
    press(s, 'f');
    press(s, 'Escape');
    expect(s.targeting).toBeNull();
    expect(s.character.target).toBeUndefined();
    expect(s.game!.state.round).toBe(1);
    expect(s.overlays).toHaveLength(0); // that Esc cancelled targeting; it did not open the game menu
  });

  it('Enter confirms and fires: one round and one ammunition are spent', () => {
    const s = shell();
    const ammo = stonesLeft(s.game!);
    press(s, 'f');
    press(s, 'Enter');
    expect(s.targeting).toBeNull();
    expect(s.game!.state.round).toBe(2);
    expect(stonesLeft(s.game!)).toBe(ammo - 1);
    expect(s.log.lines(s.turn).some((l) => /shot misses|You (hit|kill)/.test(l.text))).toBe(true);
  });

  it('says so and spends no turn when there is no valid target', () => {
    const s = shellOn(open());
    press(s, 'f');
    expect(s.targeting).toBeNull();
    expect(s.game!.state.round).toBe(1);
    expect(s.log.lines(s.turn).some((l) => l.text === 'There is no valid target.')).toBe(true);
  });

  it('ignores movement while targeting, so nothing moves', () => {
    const s = shell();
    press(s, 'f');
    press(s, 'd');
    expect(s.game!.state.map.player).toEqual({ x: 11, y: 11 });
    expect(s.game!.state.round).toBe(1);
    expect(s.targeting).not.toBeNull();
  });

  it('without a game, F says so', () => {
    const s = shellOn(open());
    s.run = null;
    press(s, 'f');
    expect(s.log.lines(s.turn).at(-1)!.text).toBe('There is no game in progress.');
  });
});

describe('targeting overlay on the main view', () => {
  const view = inner(MAIN_PANE);
  const cellOf = (g: Grid, game: ReturnType<typeof gameOn>, x: number, y: number) => {
    const o = cameraOrigin(game.state.map.level.width, game.state.map.level.height, game.state.map.player, view.w, view.h);
    const i = (view.y + y - o.y) * COLS + view.x + x - o.x;
    return { glyph: g.glyph[i]!, fg: g.fg[i]!, bg: g.bg[i]! };
  };

  it('highlights the selected target and draws the path as dim dots', () => {
    const game = gameOn(open());
    game.state.monsters.push(monsterAt(15, 11));
    const t = startTargeting(game, { range: 6, shape: { kind: 'single' } })!;
    const g = new Grid();
    drawMap(g, game.state, t);
    const sel = cellOf(g, game, 15, 11);
    expect([sel.glyph, sel.fg, sel.bg]).toEqual([103, TARGET.selectedFg, TARGET.selectedBg]); // 'g'
    for (const x of [12, 13, 14]) {
      const c = cellOf(g, game, x, 11);
      expect([c.glyph, c.fg]).toEqual([250, TARGET.path]);
    }
    expect(cellOf(g, game, 17, 11).bg).not.toBe(TARGET.footprintBg);
  });

  it('tints every cell an area footprint touches and marks the monsters inside', () => {
    const game = gameOn(open());
    game.state.monsters.push(monsterAt(15, 11), monsterAt(16, 12));
    const t = startTargeting(game, { range: 8, shape: { kind: 'area', size: 3 } })!;
    const g = new Grid();
    drawMap(g, game.state, t);
    expect(cellOf(g, game, 14, 10).bg).toBe(TARGET.footprintBg);
    expect(cellOf(g, game, 16, 10).bg).toBe(TARGET.footprintBg);
    expect(cellOf(g, game, 13, 11).bg).not.toBe(TARGET.footprintBg); // outside the 3 x 3
    expect(cellOf(g, game, 16, 12).bg).toBe(TARGET.markedBg); // a monster inside is marked
    expect(cellOf(g, game, 15, 11).bg).toBe(TARGET.selectedBg);
  });
});
