import { describe, expect, it } from 'vitest';
import {
  Rng,
  createRng,
  hash32,
  levelSeed,
  levelStreams,
  randomRunSeed,
  seedOfTheDay,
  streamSeed,
  subSeed,
} from '../src/core/rng.ts';

function take(rng: Rng, n: number): number[] {
  return Array.from({ length: n }, () => rng.nextU32());
}

// Independent sfc32 reference using BigInt, seeded the same way as Rng.
function referenceSfc32(seed: number, n: number): number[] {
  const M = 0xffffffffn;
  let a = BigInt(hash32('sfc32', seed, 0));
  let b = BigInt(hash32('sfc32', seed, 1));
  let c = BigInt(hash32('sfc32', seed, 2));
  let d = 1n;
  const out: number[] = [];
  for (let i = 0; i < 15 + n; i++) {
    const t = (a + b + d) & M;
    d = (d + 1n) & M;
    a = b ^ (b >> 9n);
    b = (c + (c << 3n)) & M;
    c = ((c << 21n) | (c >> 11n)) & M;
    c = (c + t) & M;
    if (i >= 15) out.push(Number(t));
  }
  return out;
}

describe('hash32', () => {
  it('is stable and unsigned 32-bit', () => {
    expect(hash32('a', 1)).toBe(hash32('a', 1));
    for (let i = 0; i < 1000; i++) {
      const h = hash32(i);
      expect(Number.isInteger(h) && h >= 0 && h <= 0xffffffff).toBe(true);
    }
  });

  it('keeps pinned values (changing the hash reshapes every level)', () => {
    expect(hash32(0)).toBe(833106851);
    expect(hash32('seed-of-the-day', '2026-09-30')).toBe(2136546936);
  });

  it('separates part boundaries and types', () => {
    expect(hash32('ab', 'c')).not.toBe(hash32('a', 'bc'));
    expect(hash32(12)).not.toBe(hash32('12'));
    expect(hash32(1, 2)).not.toBe(hash32(2, 1));
  });

  it('has no collisions over 100,000 consecutive integers', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 100_000; i++) seen.add(hash32(i));
    expect(seen.size).toBeGreaterThan(99_990);
  });

  it('rejects non-integers', () => {
    expect(() => hash32(1.5)).toThrow(RangeError);
  });
});

describe('Rng (sfc32)', () => {
  it('gives identical sequences for the same seed', () => {
    expect(take(createRng(12345), 1000)).toEqual(take(createRng(12345), 1000));
  });

  it('gives different sequences for different seeds', () => {
    expect(take(createRng(1), 8)).not.toEqual(take(createRng(2), 8));
  });

  it('matches an independent sfc32 reference', () => {
    for (const seed of [0, 1, 42, 0xdeadbeef, 0xffffffff]) {
      expect(take(createRng(seed), 200)).toEqual(referenceSfc32(seed, 200));
    }
  });

  it('keeps a pinned sequence', () => {
    expect(take(createRng(42), 4)).toEqual(referenceSfc32(42, 4));
    expect(take(createRng(42), 4)).toEqual([3702961502, 1409149661, 3068202200, 3112773661]);
  });

  it('float() stays in [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 10_000; i++) {
      const f = rng.float();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });

  it('int() covers its inclusive range evenly', () => {
    const rng = createRng(99);
    const counts = new Array<number>(6).fill(0);
    for (let i = 0; i < 60_000; i++) counts[rng.int(1, 6) - 1]!++;
    for (const c of counts) expect(Math.abs(c - 10_000)).toBeLessThan(500);
    expect(createRng(1).int(5, 5)).toBe(5);
  });

  it('int() rejects bad ranges', () => {
    expect(() => createRng(1).int(3, 2)).toThrow(RangeError);
    expect(() => createRng(1).int(0.5, 2)).toThrow(RangeError);
  });

  it('pick() and shuffle() are deterministic and shuffle keeps the elements', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(createRng(5).shuffle(items)).toEqual(createRng(5).shuffle(items));
    expect(createRng(5).shuffle(items).sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(createRng(5).pick(items)).toBe(createRng(5).pick(items));
    expect(() => createRng(1).pick([])).toThrow(RangeError);
  });

  it('oneIn(1) is always true', () => {
    expect(createRng(3).oneIn(1)).toBe(true);
  });
});

describe('seeds and streams', () => {
  it('seed of the day is the same for the whole UTC day and differs between days', () => {
    expect(seedOfTheDay('2026-09-30')).toBe(seedOfTheDay(new Date('2026-09-30T00:00:00Z')));
    expect(seedOfTheDay('2026-09-30')).toBe(seedOfTheDay(new Date('2026-09-30T23:59:59Z')));
    expect(seedOfTheDay('2026-09-30')).not.toBe(seedOfTheDay('2026-10-01'));
    expect(() => seedOfTheDay('30/09/2026')).toThrow(RangeError);
  });

  it('random run seed is an unsigned 32-bit integer', () => {
    const s = randomRunSeed();
    expect(Number.isInteger(s) && s >= 0 && s <= 0xffffffff).toBe(true);
  });

  it('level seed depends only on run seed and level, not on other levels', () => {
    const direct = levelSeed(777, 40);
    for (let l = 1; l <= 39; l++) levelSeed(777, l);
    expect(levelSeed(777, 40)).toBe(direct);
    const seeds = new Set(Array.from({ length: 100 }, (_, i) => levelSeed(777, i + 1)));
    expect(seeds.size).toBe(100);
    expect(levelSeed(778, 40)).not.toBe(direct);
  });

  it('sub-seeds differ per attempt and are deterministic', () => {
    const base = levelSeed(1, 1);
    const subs = new Set(Array.from({ length: 21 }, (_, i) => subSeed(base, i)));
    expect(subs.size).toBe(21);
    expect(subSeed(base, 3)).toBe(subSeed(base, 3));
  });

  it('streams are independent: drawing from one never shifts another', () => {
    const seed = levelSeed(2026, 12);
    const a = levelStreams(seed);
    const layoutAlone = take(levelStreams(seed).layout, 50);
    take(a.runtime, 500);
    take(a.contents, 500);
    expect(take(a.layout, 50)).toEqual(layoutAlone);
    expect(streamSeed(seed, 'layout')).not.toBe(streamSeed(seed, 'contents'));
    expect(streamSeed(seed, 'contents')).not.toBe(streamSeed(seed, 'runtime'));
    expect(take(levelStreams(seed).layout, 8)).not.toEqual(take(levelStreams(seed).contents, 8));
  });
});
