/**
 * Mulberry32 seeded PRNG — fast, good distribution for game use.
 */
export class RNG {
  constructor(seed) {
    this.seed = seed >>> 0; // unsigned 32-bit
  }

  /** Returns float [0, 1) */
  next() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] inclusive */
  int(min, max) { return min + Math.floor(this.next() * (max - min + 1)); }

  /** Float in [min, max) */
  float(min, max) { return min + this.next() * (max - min); }

  /** True with probability p (0–1) */
  chance(p) { return this.next() < p; }

  /** Pick random element from array */
  pick(arr) { return arr[this.int(0, arr.length - 1)]; }

  /** Shuffle array in place (Fisher-Yates) */
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Weighted pick: items = [{value, weight}, ...] */
  weightedPick(items) {
    const total = items.reduce((s, i) => s + i.weight, 0);
    let r = this.float(0, total);
    for (const item of items) {
      r -= item.weight;
      if (r <= 0) return item.value;
    }
    return items[items.length - 1].value;
  }

  /** Fork a child RNG with a derived seed */
  fork(salt = 0) { return new RNG(this.seed ^ (salt * 2654435761)); }
}
