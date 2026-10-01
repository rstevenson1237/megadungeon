import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng.ts';
import {
  eligibleEntries,
  rollTable,
  themeMultiplier,
  weightOf,
  type Rollable,
  type TableLookup,
} from '../src/core/roller.ts';

const lookupOf =
  (tables: Record<string, Rollable[]>): TableLookup =>
  (name) =>
    tables[name];

const sample: Rollable[] = [
  { id: 'rat', depth: [1, 5], tags: ['beast'] },
  { id: 'archer', depth: [3, 25], weight: 12, themes: { warrens: 3, mine: 1.5 }, tags: ['goblinoid', 'ranged'] },
  { id: 'ogre', depth: [10, 40], tags: ['giant'] },
  { id: 'anywhere' },
];

describe('roller filters', () => {
  it('filters by depth range, inclusive at both ends, and keeps entries with no range', () => {
    const ids = (depth: number): string[] => eligibleEntries(sample, { depth }).map((e) => e.id);
    expect(ids(1)).toEqual(['rat', 'anywhere']);
    expect(ids(3)).toEqual(['rat', 'archer', 'anywhere']);
    expect(ids(6)).toEqual(['archer', 'anywhere']);
    expect(ids(10)).toEqual(['archer', 'ogre', 'anywhere']);
    expect(ids(41)).toEqual(['anywhere']);
  });

  it('with no depth in the filter, every depth range passes', () => {
    expect(eligibleEntries(sample, {})).toHaveLength(4);
  });

  it('filters by tags: an entry needs every tag asked for', () => {
    const ids = (tags: string[]): string[] => eligibleEntries(sample, { tags }).map((e) => e.id);
    expect(ids(['ranged'])).toEqual(['archer']);
    expect(ids(['goblinoid', 'ranged'])).toEqual(['archer']);
    expect(ids(['goblinoid', 'beast'])).toEqual([]);
    expect(ids([])).toHaveLength(4);
  });

  it('theme multipliers favour: a listed theme multiplies, any other theme is x1', () => {
    const archer = sample[1]!;
    expect(themeMultiplier(archer, 'warrens')).toBe(3);
    expect(themeMultiplier(archer, 'mine')).toBe(1.5);
    expect(themeMultiplier(archer, 'sewers')).toBe(1);
    expect(themeMultiplier(archer, undefined)).toBe(1);
    expect(themeMultiplier(sample[0]!, 'warrens')).toBe(1);
    expect(weightOf(archer, 'warrens')).toBe(36);
    expect(weightOf(sample[0]!)).toBe(10); // default weight
    expect(weightOf(archer, 'constructor')).toBe(12); // never read from the prototype
  });
});

describe('roller picks', () => {
  const lookup = lookupOf({ t: sample });

  it('gives the same entry for the same seed, and a different stream for another', () => {
    const run = (seed: number): string[] =>
      Array.from({ length: 50 }, ((rng) => () => rollTable(lookup, 't', rng, { depth: 12 })!.id)(createRng(seed)));
    expect(run(7)).toEqual(run(7));
    expect(run(7)).not.toEqual(run(8));
  });

  it('only ever returns eligible entries', () => {
    const rng = createRng(1);
    for (let i = 0; i < 500; i++) {
      expect(['rat', 'archer', 'anywhere']).toContain(rollTable(lookup, 't', rng, { depth: 4 })!.id);
    }
  });

  it('returns undefined when nothing is eligible', () => {
    expect(rollTable(lookup, 't', createRng(1), { depth: 4, tags: ['giant'] })).toBeUndefined();
  });

  it('picks in proportion to weight times theme multiplier', () => {
    const rng = createRng(42);
    const N = 40000;
    const counts: Record<string, number> = {};
    for (let i = 0; i < N; i++) {
      const id = rollTable(lookup, 't', rng, { depth: 4, theme: 'warrens' })!.id;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    // weights at depth 4 in warrens: rat 10, archer 12 x 3 = 36, anywhere 10; total 56
    expect(counts['rat']! / N).toBeCloseTo(10 / 56, 1);
    expect(counts['archer']! / N).toBeCloseTo(36 / 56, 1);
    expect(counts['anywhere']! / N).toBeCloseTo(10 / 56, 1);
  });

  it('throws for an unknown table', () => {
    expect(() => rollTable(lookup, 'nope', createRng(1))).toThrow(/unknown table/);
  });
});

describe('nested rolls', () => {
  const tables: Record<string, Rollable[]> = {
    loot: [
      { id: 'coins', roll: 'coins' },
      { id: 'gems', roll: 'gems', depth: [20, 100] },
    ],
    coins: [{ id: 'copper' }, { id: 'silver', depth: [5, 100] }],
    gems: [{ id: 'ruby', tags: ['gem'] }],
  };
  const lookup = lookupOf(tables);

  it('follows roll: entries to a final entry', () => {
    const rng = createRng(3);
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) seen.add(rollTable(lookup, 'loot', rng, { depth: 30 })!.id);
    expect([...seen].sort()).toEqual(['copper', 'ruby', 'silver']);
  });

  it('gives a nested table the caller depth', () => {
    const rng = createRng(3);
    for (let i = 0; i < 300; i++) expect(rollTable(lookup, 'loot', rng, { depth: 2 })!.id).toBe('copper');
  });

  it('applies the caller tags to the first table only', () => {
    const tagged: Record<string, Rollable[]> = {
      loot: [{ id: 'pile', roll: 'coins', tags: ['hoard'] }, { id: 'single' }],
      coins: [{ id: 'copper' }],
    };
    const rng = createRng(5);
    for (let i = 0; i < 50; i++) {
      expect(rollTable(lookupOf(tagged), 'loot', rng, { tags: ['hoard'] })!.id).toBe('copper');
    }
  });

  it('treats an entry whose nested table has nothing eligible as not eligible', () => {
    const rng = createRng(9);
    // "to_dead" rolls a table whose only entry is out of depth, so it can never be picked.
    const dead: Record<string, Rollable[]> = {
      top: [{ id: 'to_dead', roll: 'dead' }, { id: 'plain' }],
      dead: [{ id: 'never', depth: [50, 60] }],
    };
    for (let i = 0; i < 100; i++) expect(rollTable(lookupOf(dead), 'top', rng, { depth: 1 })!.id).toBe('plain');
  });

  it('refuses a cycle', () => {
    const loop: Record<string, Rollable[]> = {
      a: [{ id: 'to_b', roll: 'b' }],
      b: [{ id: 'to_a', roll: 'a' }],
    };
    expect(() => rollTable(lookupOf(loop), 'a', createRng(1))).toThrow(/roll cycle: a -> b -> a/);
  });

  it('is deterministic through nesting', () => {
    const run = (seed: number): string[] => {
      const rng = createRng(seed);
      return Array.from({ length: 40 }, () => rollTable(lookup, 'loot', rng, { depth: 30 })!.id);
    };
    expect(run(11)).toEqual(run(11));
  });
});
