// Seeded randomness (Spec 02, "Seeds, determinism and persistence").
// All game content draws from these generators; Math.random is never used.

/** The three independent streams every level gets (Spec 02). */
export type StreamName = 'layout' | 'contents' | 'runtime';

/** Hash a list of 32-bit integers and strings to one unsigned 32-bit integer. */
export function hash32(...parts: (number | string)[]): number {
  let h = 0x9e3779b9;
  let words = 0;
  const mix = (word: number): void => {
    let k = Math.imul(word, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, 0x1b873593);
    h ^= k;
    h = (h << 13) | (h >>> 19);
    h = (Math.imul(h, 5) + 0xe6546b64) | 0;
    words++;
  };
  for (const part of parts) {
    if (typeof part === 'number') {
      if (!Number.isInteger(part)) throw new RangeError(`hash32: not an integer: ${part}`);
      mix(1); // type tag, so 12 and "12" never collide
      mix(part | 0);
      mix(Math.floor(part / 0x100000000) | 0); // high word keeps integers beyond 32 bits distinct
    } else {
      mix(2);
      mix(part.length);
      for (let i = 0; i < part.length; i++) mix(part.charCodeAt(i));
    }
  }
  h ^= words * 4;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Seed of the day: a hash of the UTC date, e.g. "2026-09-30". Same for every player that day. */
export function seedOfTheDay(date: Date | string): number {
  const day = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new RangeError(`seedOfTheDay: expected YYYY-MM-DD, got ${day}`);
  return hash32('seed-of-the-day', day);
}

/** A seed as the title screen shows it: eight upper-case hex digits, e.g. "0A1B2C3D". */
export function formatSeed(seed: number): string {
  return (seed >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

/** Random run seed from the browser's crypto source. */
export function randomRunSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]!;
}

/** Per-level seed: hash(run seed, level number). Never depends on any other level. */
export function levelSeed(runSeed: number, level: number): number {
  return hash32('level', runSeed >>> 0, level);
}

/**
 * Sub-seed for a generation retry (Spec 02, step 12). Attempt 0 is the first try;
 * each failed validation moves to the next attempt.
 */
export function subSeed(seed: number, attempt: number): number {
  return hash32('sub', seed >>> 0, attempt);
}

/** Seed for one named stream of a seed, so streams never share a sequence. */
export function streamSeed(seed: number, stream: StreamName): number {
  return hash32('stream', seed >>> 0, stream);
}

/** The seeded generator: sfc32 with helpers. State is four 32-bit words. */
export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(seed: number) {
    // Expand one 32-bit seed into four state words, then discard the first
    // outputs, as is usual for sfc32, so nearby seeds diverge immediately.
    this.a = hash32('sfc32', seed >>> 0, 0) | 0;
    this.b = hash32('sfc32', seed >>> 0, 1) | 0;
    this.c = hash32('sfc32', seed >>> 0, 2) | 0;
    this.d = 1;
    for (let i = 0; i < 15; i++) this.nextU32();
  }

  /** Next unsigned 32-bit integer. */
  nextU32(): number {
    const t = (((this.a + this.b) | 0) + this.d) | 0;
    this.d = (this.d + 1) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.c = (this.c + t) | 0;
    return t >>> 0;
  }

  /** Float in [0, 1). */
  float(): number {
    return this.nextU32() / 0x100000000;
  }

  /** Integer in [min, max], both inclusive, without modulo bias. */
  int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(`Rng.int: bad range ${min}..${max}`);
    }
    const range = max - min + 1;
    if (range > 0x100000000) throw new RangeError('Rng.int: range exceeds 32 bits');
    const limit = Math.floor(0x100000000 / range) * range;
    let x = this.nextU32();
    while (x >= limit) x = this.nextU32();
    return min + (x % range);
  }

  /** True with probability 1 in `n` (n >= 1). */
  oneIn(n: number): boolean {
    return this.int(1, n) === 1;
  }

  /** One element of a non-empty array. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError('Rng.pick: empty array');
    return items[this.int(0, items.length - 1)]!;
  }

  /** Fisher-Yates shuffle; returns a new array. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    return out;
  }
}

/** Create a generator from a 32-bit seed. */
export function createRng(seed: number): Rng {
  return new Rng(seed);
}

/** The three streams of one level, from the level's (sub-)seed. */
export function levelStreams(seed: number): Record<StreamName, Rng> {
  return {
    layout: createRng(streamSeed(seed, 'layout')),
    contents: createRng(streamSeed(seed, 'contents')),
    runtime: createRng(streamSeed(seed, 'runtime')),
  };
}
