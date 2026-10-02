import { describe, expect, it } from 'vitest';
import { Run } from '../src/game/run.ts';
import { parseSave, restoreRun, serialise, toSave } from '../src/game/save.ts';
import { createPlayer } from '../src/game/game.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { generateLevel } from '../src/rules/world/generate.ts';
import { GENERATOR_VERSION, SUPPORTED_GENERATORS, type Level } from '../src/rules/world/level.ts';
import { FROZEN, GOLDEN_CASES, frozenLevel, levelHash } from './frozen.ts';

// Spec 02, Addendum A: one stream per placement step, whole-level hashes against frozen tables, and older
// generator versions kept so a save keeps its levels.

/** Stored hashes of whole levels (tiles and every placement) built from the frozen tables. Bump GENERATOR_VERSION if these change on purpose. */
const GOLDEN: Record<number, readonly number[]> = {
  3: [1377192405, 2391738355, 2781338382, 1599728655, 1211507975, 1594066818, 2414900546, 2710281323, 1287150800, 3941704079, 3553031795, 2902157400, 368094642],
  4: [2499789697, 3919751097, 2419653366, 1526465663, 1893042836, 1484175144, 3592912404, 3067319704, 461384772, 3215958730, 4184165187, 3105824461, 1933411304],
};

describe('Spec 02, Addendum A: determinism of whole levels', () => {
  it('the current generator is version 4, and this build still has version 3', () => {
    expect(GENERATOR_VERSION).toBe(4);
    expect(SUPPORTED_GENERATORS).toEqual([3, 4]);
  });

  for (const version of [3, 4]) {
    it(`generator ${version} matches the stored hashes of whole levels for fixed seeds`, () => {
      const actual = GOLDEN_CASES.map(([seed, depth]) => {
        const level = frozenLevel(seed, depth, version)!;
        expect(level.generatorVersion).toBe(version);
        return levelHash(level);
      });
      expect(actual).toEqual(GOLDEN[version]);
    });
  }

  it('the same seed and level give a byte-identical level, contents and all', () => {
    for (const [seed, depth] of GOLDEN_CASES.slice(0, 4)) expect(JSON.stringify(frozenLevel(seed, depth))).toBe(JSON.stringify(frozenLevel(seed, depth)));
  });

  it('a generator version the build does not have is refused', () => {
    expect(() => generateLevel(1, 1, 'small', undefined, undefined, 2)).toThrow('not in this build');
  });
});

/** What each placement step put on a level, so two levels can be compared step by step. */
function byStep(level: Level): Record<string, unknown> {
  const piles = (kind: string) => level.piles.filter((p) => p.contents.some((c) => c.kind === kind));
  return {
    doors: level.doors,
    keys: piles('key'),
    features: level.features.map((f) => ({ ...f, contents: undefined })),
    traps: level.traps,
    monsters: level.monsters,
    treasure: [level.features.map((f) => ('contents' in f ? f.contents : null)), level.piles.filter((p) => !p.contents.some((c) => c.kind === 'key'))],
    npcs: level.npcs,
    lore: level.lore,
    specials: level.specials,
  };
}

describe('Spec 02, Addendum A: a table change moves only its own step and the steps after it', () => {
  const STEPS = ['doors', 'keys', 'features', 'traps', 'monsters', 'treasure', 'npcs', 'lore', 'specials'] as const;
  /** The frozen tables with one more row in `table`, as a content edit would add. */
  const withRow = (table: string): typeof FROZEN => {
    const edited = structuredClone(FROZEN);
    const rows = edited.tables[table] as Record<string, unknown>[];
    rows.push({ ...rows[0]!, id: 'added_for_test', weight: 40, ...(table === 'monsters' ? { depth: [1, 100] } : {}) });
    return edited;
  };
  /** For each golden case: the steps that moved, and whether the level needed a different number of tries. */
  const moves = (table: string, version: number) => {
    const edited = withRow(table);
    return GOLDEN_CASES.map(([seed, depth]) => {
      const make = (bundle: typeof FROZEN) => {
        const o = runOptionsFor(bundle, seed);
        return generateLevel(seed, depth, o.sizeFor!(depth), o.styleFor!(depth), o.contentsFor!(depth), version);
      };
      const [a, b] = [make(FROZEN), make(edited)];
      const [sa, sb] = [byStep(a), byStep(b)];
      return { moved: STEPS.filter((k) => JSON.stringify(sa[k]) !== JSON.stringify(sb[k])), retried: a.attempts !== b.attempts };
    });
  };

  it('with generator 4 a new monster row never moves the steps before monsters, unless the level had to retry', () => {
    const cases = moves('monsters', 4);
    for (const { moved, retried } of cases) if (!retried) for (const step of ['doors', 'keys', 'features', 'traps']) expect(moved).not.toContain(step);
    expect(cases.some((c) => c.moved.includes('monsters'))).toBe(true);
  });

  it('with generator 4 a new gem row moves the treasure and nothing before it; generator 3 moved far more', () => {
    const v4 = moves('gems_jewelry', 4);
    for (const { moved, retried } of v4) if (!retried) for (const step of ['doors', 'keys', 'features', 'traps', 'monsters']) expect(moved).not.toContain(step);
    const total = (cases: { moved: readonly string[] }[]) => cases.reduce((n, c) => n + c.moved.length, 0);
    expect(total(v4)).toBeLessThan(total(moves('gems_jewelry', 3)));
  });

  it('a new graffiti row moves only the lore', () => {
    for (const { moved } of moves('graffiti', 4)) expect(moved.filter((s) => s !== 'lore')).toEqual([]);
  });
});

describe('Spec 02 and 09: a run keeps its generator', () => {
  it('a new run builds with the current generator, and a run loaded from a version 3 save keeps building version 3 levels', () => {
    const options = runOptionsFor(FROZEN, 31);
    const fresh = new Run(31, createPlayer({ combatStep: 6, combatDice: 1, combatMax: 1 }), options);
    expect(fresh.generator).toBe(GENERATOR_VERSION);
    const old = new Run(31, createPlayer({ combatStep: 6, combatDice: 1, combatMax: 1 }), { ...options, generator: 3 });
    const save = parseSave(serialise(toSave({ run: old, contentVersion: 'v' })));
    expect(save.generator).toBe(3);
    const loaded = restoreRun(save, runOptionsFor(FROZEN, 31));
    expect(loaded.generator).toBe(3);
    const depth = [1, 2, 3, 4].find((d) => !loaded.villages.includes(d))!;
    expect(loaded.peek(depth).generatorVersion).toBe(3);
    expect(JSON.stringify(loaded.peek(depth))).toBe(JSON.stringify(frozenLevel(31, depth, 3)));
  });
});

