import { describe, expect, it } from 'vitest';
import { artifactsCarried } from '../src/game/connective.ts';
import { Run } from '../src/game/run.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { makeArtifact } from '../src/rules/items/magic.ts';
import { generateLevel } from '../src/rules/world/generate.ts';
import { distancesFrom, toCells } from '../src/rules/world/grid.ts';
import { FINAL_BOSS_RATING, MAX_DEPTH, type Level, type Rect } from '../src/rules/world/level.ts';
import { findProblems } from '../src/rules/world/validate.ts';
import { ITEMS, content, testPlayer } from './helpers.ts';

// Task 4.10 (Spec 02, "Level sizes and layouts" and the clarifications of task 4.10): The Abyssal Throne, the level 100
// set piece, and the real final bosses. The artifact seals themselves are proved in connective.test.ts.

const bundle = content().bundle;
const SEEDS = Array.from({ length: 60 }, (_, i) => i + 1);

const level100 = (seed: number): Level => {
  const o = runOptionsFor(bundle, seed);
  return generateLevel(seed, MAX_DEPTH, o.sizeFor!(MAX_DEPTH), o.styleFor!(MAX_DEPTH), o.contentsFor!(MAX_DEPTH));
};
const inRect = (r: Rect, p: { x: number; y: number }): boolean => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;

describe('the final boss rows', () => {
  const rows = (bundle.tables.bosses as unknown as { id: string; name: string; rating: string; depth: number[]; tags?: string[]; behaviour: string }[]).filter((b) => b.tags?.includes('final'));

  it('are at least three, for level 100 only, each rated 20d6+6, with no stub left', () => {
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const r of rows) {
      expect(r.rating, r.id).toBe(`${FINAL_BOSS_RATING.dice}d6+${FINAL_BOSS_RATING.modifier}`);
      expect(r.depth, r.id).toEqual([100, 100]);
      expect(r.tags, r.id).not.toContain('stub');
      expect(r.tags, r.id).not.toContain('undead'); // Turn Undead would send the last boss running
    }
    expect((bundle.tables.bosses as unknown as { id: string }[]).some((b) => b.id === 'stub_final_boss')).toBe(false);
  });

  it('are the only bosses level 100 can draw, and no other level can', () => {
    const ids = new Set(rows.map((r) => r.id));
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      const boss = level100(seed).monsters.find((m) => m.role === 'boss')!;
      expect(ids.has(boss.id)).toBe(true);
      seen.add(boss.id);
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('level 100 is the throne set piece', () => {
  it('is a sound large level of the set_piece layout on every seed, with no down stair and no fallback', () => {
    for (const seed of SEEDS) {
      const level = level100(seed);
      expect(findProblems(level), `seed ${seed}`).toEqual([]);
      expect([level.layout, level.size, level.fallback, level.downStair], `seed ${seed}`).toEqual(['set_piece', 'large', false, null]);
    }
  });

  it('is an antechamber with the up stair, a hall, two to four side chambers and the throne room, in that order', () => {
    for (const seed of SEEDS) {
      const { rooms, upStair } = level100(seed);
      const [ante, hall, ...rest] = rooms;
      const throne = rest.pop()!;
      expect(inRect(ante!, upStair), `seed ${seed}`).toBe(true);
      expect(rest.length, `seed ${seed}`).toBeGreaterThanOrEqual(2);
      expect(rest.length, `seed ${seed}`).toBeLessThanOrEqual(4);
      expect(hall!.w, `seed ${seed}`).toBeGreaterThanOrEqual(52);
      expect(throne.w * throne.h, `seed ${seed}`).toBeGreaterThan(hall!.h * 30);
      for (const chamber of rest) {
        const beside = chamber.x >= hall!.x && chamber.x + chamber.w <= hall!.x + hall!.w;
        expect(beside, `seed ${seed}`).toBe(true);
      }
    }
  });

  it('holds exactly one boss, a final row, alone in the throne room, the deepest room from the up stair', () => {
    for (const seed of SEEDS) {
      const level = level100(seed);
      const throne = level.rooms[level.rooms.length - 1]!;
      const bosses = level.monsters.filter((m) => m.role === 'boss');
      expect(bosses, `seed ${seed}`).toHaveLength(1);
      const boss = bosses[0]!;
      expect([boss.dice, boss.modifier, boss.final], `seed ${seed}`).toEqual([20, 6, true]);
      expect(boss.artifact).toBeUndefined();
      expect(inRect(throne, boss), `seed ${seed}`).toBe(true);
      expect(level.monsters.filter((m) => inRect(throne, m)), `seed ${seed}`).toEqual([boss]);
      // It stands deeper than the centre of every other room.
      const cells = toCells(level)!;
      const dist = distancesFrom(cells, level.width, level.height, level.upStair);
      const at = (p: { x: number; y: number }): number => dist[p.y * level.width + p.x]!;
      for (const r of level.rooms.slice(0, -1)) expect(at({ x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) }), `seed ${seed}`).toBeLessThan(at(boss));
    }
  });

  it('never shuts the throne room behind a locked or secret door', () => {
    for (const seed of SEEDS) {
      const level = level100(seed);
      const throne = level.rooms[level.rooms.length - 1]!;
      const cells = toCells(level)!;
      // Walk from the up stair through plain doors only: the boss must be reached.
      const open = distancesFrom(cells, level.width, level.height, level.upStair, (c) => c !== 0 && c !== 6 && c !== 7 && c !== 8 && c !== 9 && c !== 10);
      const boss = level.monsters.find((m) => m.role === 'boss')!;
      expect(open[boss.y * level.width + boss.x], `seed ${seed}`).toBeGreaterThanOrEqual(0);
      expect(inRect(throne, boss)).toBe(true);
    }
  });

  it('varies with the seed, and is the same level every time for one seed', () => {
    const shapes = new Set(SEEDS.map((seed) => JSON.stringify(level100(seed).rooms)));
    expect(shapes.size).toBeGreaterThan(40);
    expect(JSON.stringify(level100(7))).toBe(JSON.stringify(level100(7)));
  });

  it('a level 100 of generator 5 is still rooms and corridors, so an older save keeps its level', () => {
    const o = runOptionsFor(bundle, 3);
    const old = generateLevel(3, MAX_DEPTH, o.sizeFor!(MAX_DEPTH), o.styleFor!(MAX_DEPTH), o.contentsFor!(MAX_DEPTH), 5);
    expect([old.generatorVersion, old.layout]).toEqual([5, 'rooms_and_corridors']);
    expect(old.monsters.filter((m) => m.final)).toHaveLength(1);
  });
});

describe('the boss fight on the generated level', () => {
  const artifact = (n: number) => makeArtifact(ITEMS.artifacts.get(['art_pale_lantern', 'art_tallow_ring', 'art_goblin_purse'][n - 1]!)!, 7000 + n);

  it('wakes alert when the player enters the throne room, loses a die per artifact carried, and says so by name', () => {
    const player = testPlayer({ pack: [artifact(1), artifact(2), artifact(3)] });
    expect(artifactsCarried(player)).toBe(3);
    const game = new Run(5, player, { ...runOptionsFor(bundle, 5), startDepth: MAX_DEPTH }).game!;
    const boss = game.state.monsters.find((m) => m.final)!;
    expect(boss).toMatchObject({ role: 'boss', fearless: true, dice: 20, modifier: 6, awareness: 'unaware' });
    const throne = game.state.map.level.rooms[game.state.map.level.rooms.length - 1]!;
    // The player stands in the throne room's far corner, in sight of the boss, and a round passes.
    game.state.map.player = { x: throne.x + 1, y: throne.y + throne.h - 1 };
    game.refreshSight();
    const result = game.act({ type: 'wait' })!;
    expect(boss.awareness).toBe('alert');
    expect(boss.dice).toBe(17);
    expect(result.messages.map((m) => m.text).join(' | ')).toContain(`The seals of your 3 artifacts burn against ${boss.name}: it loses 3 dice.`);
  });
});
