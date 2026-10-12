// The scene model (Spec 01b, Tests; task 6.2): the one per-cell description both displays read. These tests run once
// and serve both: what each cell holds in its three states, door and feature states, item classes and creature roles,
// and that the text display rebuilt on the scene draws every cell exactly as it did before (the frozen reference).

import { describe, expect, it } from 'vitest';
import type { Game } from '../src/game/game.ts';
import { ALLY_COLOUR } from '../src/game/monsters.ts';
import type { Level, Loot } from '../src/rules/world/level.ts';
import { cameraOrigin } from '../src/ui/camera.ts';
import { Grid } from '../src/ui/grid.ts';
import { drawMap } from '../src/ui/map-view.ts';
import { DEFAULT_LOOK, MAP, mapLook } from '../src/ui/palette.ts';
import { MAIN_PANE, inner } from '../src/ui/panes.ts';
import { buildScene, sceneAt, type SceneCell } from '../src/ui/scene.ts';
import { legacyDrawMap } from './fixtures/legacy-map-view.ts';
import { GOLDEN_CASES, frozenLevel } from './frozen.ts';
import { cell, gameAt, gameOn, keyItem, levelFrom, monsterAt, room, walk, withThings } from './helpers.ts';

const whole = (level: Level) => ({ x: 0, y: 0, w: level.width, h: level.height });
const sceneOf = (game: Game) => buildScene(game.state, whole(game.state.map.level));
const at = (game: Game, x: number, y: number): SceneCell | null => sceneAt(sceneOf(game), x, y);

describe('scene model (Spec 01b): the three cell states', () => {
  it('leaves unseen cells out, and marks known cells visible or remembered', () => {
    const level = room(40, 4, 2, 2);
    const game = gameOn(level);
    walk(game, 'd'.repeat(26));
    expect(at(game, level.width - 3, 3)).toBeNull(); // never seen
    const remembered = at(game, 3, 2)!;
    expect(remembered.light).toBe('remembered');
    expect(remembered.terrain).toMatchObject({ kind: 'floor', glyph: 250, fg: MAP.floor.remembered });
    const visible = at(game, game.state.map.player.x + 2, 2)!;
    expect(visible.light).toBe('visible');
    expect(visible.terrain).toMatchObject({ kind: 'floor', fg: MAP.floor.visible });
    expect(at(game, 1, 0)!.terrain).toMatchObject({ kind: 'wall', glyph: 35, fg: MAP.wall.remembered });
  });

  it('shows creatures and loose items on visible cells only', () => {
    const level = withThings(room(40, 4, 2, 2), { piles: [{ x: 4, y: 2, contents: [{ kind: 'coins', amount: 5 }] }] });
    const game = gameOn(level);
    game.state.monsters.push(monsterAt(5, 2));
    let c = at(game, 4, 2)!;
    expect(c.item).toMatchObject({ cls: 'coins', glyph: 36 });
    expect(at(game, 5, 2)!.occupant).toMatchObject({ kind: 'creature', role: 'monster', glyph: 103 });
    game.state.map.player = { x: 30, y: 2 }; // far off: both are out of sight now
    game.refreshSight();
    c = at(game, 4, 2)!;
    expect(c.light).toBe('remembered');
    expect(c.item).toBeUndefined();
    expect(at(game, 5, 2)!.occupant).toBeUndefined();
  });

  it('always puts the player on their cell, over any creature', () => {
    const level = levelFrom(['#####', '#<.>#', '#####']);
    const game = gameOn(level);
    expect(at(game, 1, 1)!.occupant).toMatchObject({ kind: 'player', glyph: 64, fg: MAP.player });
    expect(at(game, 1, 1)!.terrain!.kind).toBe('stairsUp');
    expect(at(game, 3, 1)!.terrain).toMatchObject({ kind: 'stairsDown', glyph: 62 });
  });

  it('covers a window that reaches past the level, with nothing outside it', () => {
    const level = levelFrom(['#####', '#<..#', '#####']);
    const game = gameOn(level);
    const scene = buildScene(game.state, { x: -2, y: -1, w: 9, h: 5 });
    expect(scene.cells).toHaveLength(45);
    expect(sceneAt(scene, -1, 0)).toBeNull();
    expect(sceneAt(scene, 1, 1)!.occupant!.kind).toBe('player');
    expect(sceneAt(scene, 7, 1)).toBeNull(); // outside the window
    expect(scene.cells.filter((c) => c !== null)).toHaveLength(15);
  });
});

describe('scene model (Spec 01b): doors, traps and features with their states', () => {
  const rows = ['#########', '#<......#', '#.......#', '###+#+###', '#.......#', '#########'];

  it('names each door state, and keeps a secret door as wall until found', () => {
    const base = levelFrom(rows);
    const tiles = base.tiles.slice();
    tiles[3] = '#+#+#+#+#';
    const level = withThings({ ...base, tiles }, {
      doors: [
        { x: 1, y: 3, kind: 'normal' },
        { x: 3, y: 3, kind: 'locked' },
        { x: 5, y: 3, kind: 'sealed' },
        { x: 7, y: 3, kind: 'normal' },
        { x: 4, y: 3, kind: 'secret' },
      ],
    });
    const game = gameAt(level, 4, 2);
    game.state.map.openDoors.push(cell(level, 7, 3));
    game.state.used.broken.push(cell(level, 7, 3));
    expect(at(game, 1, 3)!.terrain).toMatchObject({ kind: 'door', door: 'closed', glyph: 43 });
    expect(at(game, 3, 3)!.terrain!.door).toBe('locked');
    expect(at(game, 5, 3)!.terrain!.door).toBe('sealed');
    expect(at(game, 7, 3)!.terrain).toMatchObject({ door: 'broken', glyph: 39 });
    expect(at(game, 4, 3)!.terrain).toMatchObject({ kind: 'wall' });
    expect(at(game, 4, 3)!.terrain!.door).toBeUndefined();
    game.state.revealed.push(cell(level, 4, 3));
    expect(at(game, 4, 3)!.terrain).toMatchObject({ kind: 'door', door: 'closed' });
    game.state.map.openDoors.push(cell(level, 1, 3));
    expect(at(game, 1, 3)!.terrain).toMatchObject({ door: 'open', glyph: 39 });
  });

  it('shows a found trap that is still armed, and a feature over it', () => {
    const level = withThings(levelFrom(rows), {
      traps: [{ x: 3, y: 1, id: 'dart' }],
      features: [{ x: 5, y: 1, type: 'container', kind: 'chest', contents: [], trap: 'needle' }],
    });
    const game = gameOn(level);
    expect(at(game, 3, 1)!.trap).toBeUndefined(); // not found yet
    game.state.revealed.push(cell(level, 3, 1), cell(level, 5, 1));
    expect(at(game, 3, 1)!.trap).toEqual({ glyph: 94, fg: MAP.trap.visible });
    const chest = at(game, 5, 1)!;
    expect(chest.trap).toBeDefined();
    expect(chest.feature).toMatchObject({ kind: 'chest', state: 'closed', dim: false });
    game.state.used.disarmed.push(cell(level, 3, 1));
    expect(at(game, 3, 1)!.trap).toBeUndefined();
  });

  it('names container and fixture states as look does, and dims what is used', () => {
    const level = withThings(levelFrom(rows), {
      features: [
        { x: 2, y: 1, type: 'container', kind: 'chest', contents: [{ kind: 'coins', amount: 3 }] },
        { x: 3, y: 1, type: 'container', kind: 'sack', contents: [] },
        { x: 4, y: 1, type: 'container', kind: 'pottery', contents: [] },
        { x: 5, y: 1, type: 'fixture', kind: 'fountain' },
        { x: 6, y: 1, type: 'fixture', kind: 'altar' },
        { x: 7, y: 1, type: 'fixture', kind: 'rune' },
        { x: 2, y: 2, type: 'debris' },
      ],
      lore: [{ x: 4, y: 0, kind: 'graffiti', text: 'Turn back.' } as Level['lore'][number]],
      specials: [{ x: 3, y: 2, kind: 'lever', link: 'v', landingLevel: 2 }, { x: 5, y: 2, kind: 'teleporter', to: 0 }],
    });
    const game = gameOn(level);
    const used = game.state.used;
    used.features[0] = { left: [{ kind: 'coins', amount: 3 }] };
    game.state.looted.features.push(1);
    game.state.map.cleared.push(cell(level, 4, 1));
    used.features[3] = { drinks: 2, limit: 2 };
    used.features[4] = { done: true };
    used.searched.push(cell(level, 2, 2));
    used.lever = true;
    const f = (x: number, y: number) => at(game, x, y)!.feature!;
    expect(f(2, 1)).toMatchObject({ kind: 'chest', state: 'open', dim: false, fg: MAP.container.visible });
    expect(f(3, 1)).toMatchObject({ kind: 'sack', state: 'looted', dim: true, fg: MAP.container.remembered });
    expect(f(4, 1)).toMatchObject({ kind: 'pottery', state: 'smashed' });
    expect(f(5, 1)).toMatchObject({ kind: 'fountain', state: 'dry' });
    expect(f(6, 1)).toMatchObject({ kind: 'altar', state: 'offered', dim: true });
    expect(f(7, 1)).toMatchObject({ kind: 'rune', state: 'dormant', dim: false, fg: MAP.rune.visible });
    expect(f(2, 2)).toMatchObject({ kind: 'debris', state: 'searched' });
    expect(f(3, 2)).toMatchObject({ kind: 'lever', state: 'pulled', dim: true });
    expect(f(5, 2)).toMatchObject({ kind: 'teleporter', fg: DEFAULT_LOOK.colours.special.visible });
    expect(f(4, 0)).toMatchObject({ kind: 'graffiti', glyph: 20 });
  });
});

describe('scene model (Spec 01b): items and who stands on a cell', () => {
  it('classes the top item of a pile as the art families name them', () => {
    const things: [Loot, string | undefined, number][] = [
      [{ kind: 'coins', amount: 1 }, 'coins', 36],
      [{ kind: 'magic', id: 'm', name: 'm' }, 'potion', 33],
      [{ kind: 'quest_item', quest: 'q', id: 'i', name: 'i' }, 'quest-item', 42],
      [{ kind: 'artifact', id: 'a', name: 'a' }, undefined, 42],
      [{ kind: 'item', item: keyItem() }, 'key', 169],
    ];
    const level = withThings(room(12, 3, 1, 1), { piles: things.map(([loot], i) => ({ x: 2 + i, y: 1, contents: [loot] })) });
    const game = gameOn(level);
    things.forEach(([loot, cls, glyph], i) => {
      const item = at(game, 2 + i, 1)!.item!;
      expect(item.loot).toBe(loot);
      expect(item.cls).toBe(cls);
      expect(item.glyph).toBe(glyph);
    });
  });

  it('gives creatures their role for markers, and the people theirs until freed', () => {
    const level = withThings(room(12, 3, 1, 1), {
      npcs: [{ x: 7, y: 1, kind: 'trader', name: 'Oda' }, { x: 8, y: 1, kind: 'captive', name: 'Ilse' }],
    });
    const game = gameOn(level);
    game.state.monsters.push(
      monsterAt(2, 1, { kind: 'ally', ally: 'raised', colour: ALLY_COLOUR }),
      monsterAt(3, 1, { kind: 'ally', ally: 'phantom', glyph: '@' }),
      monsterAt(4, 1, { kind: 'bandit', glyph: 'B' }),
      monsterAt(5, 1, { role: 'boss', glyph: 'D' }),
      monsterAt(6, 1, { kind: 'rival', glyph: 'R' }),
    );
    const role = (x: number) => {
      const o = at(game, x, 1)!.occupant!;
      return o.kind === 'player' ? 'player' : o.role;
    };
    expect([2, 3, 4, 5, 6, 7, 8].map(role)).toEqual(['ally', 'phantom', 'bandit', 'boss', 'rival', 'trader', 'captive']);
    expect(at(game, 2, 1)!.occupant).toMatchObject({ kind: 'creature', fg: ALLY_COLOUR });
    game.state.used.npcs[1] = { freed: true };
    expect(at(game, 8, 1)!.occupant).toBeUndefined();
  });
});

describe('text display rebuilt on the scene (task 6.2): every cell as before', () => {
  const view = inner(MAIN_PANE);

  /** Every kind of state a level can be in, spread over its cells by a fixed pattern. */
  function churn(game: Game): void {
    const { state } = game;
    const { level } = state.map;
    const odd = (i: number, n: number) => (i * 2654435761) % n === 0;
    state.map.exploration.explored.fill(1);
    state.map.visible = Uint8Array.from({ length: level.width * level.height }, (_, i) => (odd(i + 3, 4) ? 0 : 1));
    for (const d of level.doors) {
      const i = cell(level, d.x, d.y);
      if (odd(i, 2)) state.revealed.push(i);
      if (odd(i, 3)) state.map.openDoors.push(i);
      if (odd(i, 5)) state.used.broken.push(i);
    }
    for (const t of level.traps) {
      const i = cell(level, t.x, t.y);
      state.revealed.push(i);
      if (odd(i, 3)) state.used.disarmed.push(i);
    }
    level.features.forEach((f, n) => {
      const i = cell(level, f.x, f.y);
      state.revealed.push(i);
      if (n % 3 === 0) state.looted.features.push(n);
      if (n % 4 === 1) state.used.features[n] = { done: true, trapGone: true };
      if (n % 5 === 2) state.used.features[n] = { left: [], drinks: 3, limit: 3 };
      if (f.type === 'container' && f.kind === 'pottery' && n % 2 === 0) state.map.cleared.push(i);
    });
    level.lore.forEach((_, n) => n % 2 === 0 && state.used.marks.push(n));
    level.piles.forEach((_, n) => n % 2 === 0 && state.looted.piles.push(n));
    level.npcs.forEach((_, n) => n % 2 === 1 && (state.used.npcs[n] = { freed: true }));
    state.used.lever = level.depth % 2 === 0;
    // Drops of every kind, a collapse and the totem on floor cells near the player.
    const floor: { x: number; y: number }[] = [];
    for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) if (level.tiles[y]![x] === '.') floor.push({ x, y });
    const loot: Loot[] = [
      { kind: 'coins', amount: 4 }, { kind: 'gem', id: 'g', name: 'g', value: 1 }, { kind: 'jewelry', id: 'j', name: 'j', value: 1 },
      { kind: 'book', id: 'b' }, { kind: 'weapon' }, { kind: 'key' }, { kind: 'vault_key', link: 'v' }, { kind: 'lift_token' },
      { kind: 'quest_item', quest: 'q', id: 'i', name: 'i' }, { kind: 'item', item: keyItem() },
    ];
    const near = floor.sort((a, b) => Math.abs(a.x - state.map.player.x) + Math.abs(a.y - state.map.player.y) - (Math.abs(b.x - state.map.player.x) + Math.abs(b.y - state.map.player.y)));
    loot.forEach((l, n) => near[n + 1] && state.drops.push({ ...near[n + 1]!, contents: [l] }));
    if (near[12]) state.used.collapsed.push(cell(level, near[12].x, near[12].y));
    if (near[13]) state.map.totem = near[13];
    state.monsters.slice(0, 3).forEach((m, n) => near[n + 2] && Object.assign(m, near[n + 2]));
    if (state.monsters[3]) Object.assign(state.monsters[3], { kind: 'ally', ally: 'companion' });
  }

  const same = (a: Grid, b: Grid): void => {
    const diff = [...a.glyph.keys()].filter((i) => a.glyph[i] !== b.glyph[i] || a.fg[i] !== b.fg[i] || a.bg[i] !== b.bg[i]);
    expect(diff.slice(0, 5)).toEqual([]);
  };

  it.each(GOLDEN_CASES)('seed %i level %i draws identically, plain and themed, from several places', (seed, depth) => {
    const level = frozenLevel(seed, depth);
    if (!level) return;
    const game = gameOn(level);
    churn(game);
    const looks = [DEFAULT_LOOK, mapLook({ palette: { wall: '#808080', floor: '#303030', accent: '#ff00ff', door: '#a06030' }, tiles: { wall: 219, floor: 46 } })];
    const places = [level.upStair, level.downStair ?? level.upStair, { x: Math.floor(level.width / 2), y: Math.floor(level.height / 2) }];
    for (const look of looks) {
      for (const p of places) {
        game.state.map.player = { ...p };
        const before = new Grid();
        const after = new Grid();
        legacyDrawMap(before, game.state, null, null, look);
        drawMap(after, game.state, null, null, look);
        same(after, before);
      }
    }
    // The map is really there: the player's cell holds the @.
    const o = cameraOrigin(level.width, level.height, game.state.map.player, view.w, view.h);
    const probe = new Grid();
    drawMap(probe, game.state);
    expect(probe.glyph[(view.y + game.state.map.player.y - o.y) * 100 + view.x + game.state.map.player.x - o.x]).toBe(64);
  });
});
