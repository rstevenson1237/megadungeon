import { describe, expect, it } from 'vitest';
import { createRng, hash32, levelSeed } from '../src/core/rng.ts';
import { connectRegions, fallbackLevel, generateLevel, placeStairs } from '../src/rules/world/generate.ts';
import { FLOOR, STAIRS_UP, WALL, labelRegions } from '../src/rules/world/grid.ts';
import { LEVEL_SIZES, MAX_DEPTH, TILE, type Level, type SizeClass } from '../src/rules/world/level.ts';
import { findProblems } from '../src/rules/world/validate.ts';

const SIZES: SizeClass[] = ['small', 'medium', 'large'];
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;

// An independent checker, written separately from the generator's own: breadth-first
// search over orthogonal steps only.
function checkLevel(level: Level): string | null {
  const { width, height, tiles } = level;
  if (tiles.length !== height || tiles.some((r) => r.length !== width)) return 'bad dimensions';
  const at = (x: number, y: number): string => (tiles[y]?.[x] ?? TILE.wall);
  for (let x = 0; x < width; x++) if (at(x, 0) !== '#' || at(x, height - 1) !== '#') return 'open edge';
  for (let y = 0; y < height; y++) if (at(0, y) !== '#' || at(width - 1, y) !== '#') return 'open edge';

  let ups = 0;
  let downs = 0;
  let walkable = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = at(x, y);
      if (c === '<') ups++;
      if (c === '>') downs++;
      if (c !== '#') walkable++;
    }
  }
  if (ups !== 1 || at(level.upStair.x, level.upStair.y) !== '<') return 'up stair';
  if (level.depth === MAX_DEPTH ? downs !== 0 || level.downStair !== null : downs !== 1) return 'down stair count';

  const dist = new Map<number, number>([[level.upStair.y * width + level.upStair.x, 0]]);
  const queue = [level.upStair.y * width + level.upStair.x];
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head]!;
    const x = i % width;
    const y = (i - x) / width;
    for (const [dx, dy] of DIRS) {
      const n = (y + dy) * width + (x + dx);
      if (at(x + dx, y + dy) === '#' || dist.has(n)) continue;
      dist.set(n, dist.get(i)! + 1);
      queue.push(n);
    }
  }
  if (dist.size !== walkable) return `unreachable cells: ${walkable - dist.size}`;
  if (level.downStair) {
    const longest = Math.max(...dist.values());
    const d = dist.get(level.downStair.y * width + level.downStair.x)!;
    if (d < 0.6 * longest) return `down stair at ${d} of ${longest}`;
    if (at(level.downStair.x, level.downStair.y) !== '>') return 'down stair position';
  }
  return null;
}

describe('rooms-and-corridors generator (Spec 02)', () => {
  it('produces each size class at its size', () => {
    for (const size of SIZES) {
      const level = generateLevel(1, 1, size);
      expect([level.width, level.height]).toEqual([LEVEL_SIZES[size].width, LEVEL_SIZES[size].height]);
      expect(level.tiles).toHaveLength(level.height);
      expect(level.rooms.length).toBeGreaterThan(1);
    }
  });

  it('is deterministic: the same seed and level give a byte-identical level', () => {
    for (const size of SIZES) {
      const a = JSON.stringify(generateLevel(12345, 37, size));
      const b = JSON.stringify(generateLevel(12345, 37, size));
      expect(a).toBe(b);
    }
    expect(generateLevel(1, 5, 'medium').tiles).not.toEqual(generateLevel(2, 5, 'medium').tiles);
    expect(generateLevel(1, 5, 'medium').tiles).not.toEqual(generateLevel(1, 6, 'medium').tiles);
  });

  it('never needs another level: level 40 alone equals level 40 after generating 1 to 39', () => {
    const alone = JSON.stringify(generateLevel(777, 40, 'medium'));
    for (let d = 1; d < 40; d++) generateLevel(777, d, 'medium');
    expect(JSON.stringify(generateLevel(777, 40, 'medium'))).toBe(alone);
  });

  it('matches stored hashes for fixed seeds (bump GENERATOR_VERSION if these change on purpose)', () => {
    const golden: [number, number, SizeClass, number][] = [
      [1, 1, 'small', 2755546884],
      [2026, 20, 'medium', 4073926531],
      [0xdeadbeef, 99, 'large', 3497175761],
      [42, 100, 'medium', 2513632261],
    ];
    const actual = golden.map(([seed, depth, size]) => hash32(...generateLevel(seed, depth, size).tiles));
    expect(actual).toEqual(golden.map((g) => g[3]));
  });

  it('has no down stair on level 100 and one up stair', () => {
    for (const size of SIZES) {
      const level = generateLevel(9, MAX_DEPTH, size);
      expect(level.downStair).toBeNull();
      expect(level.tiles.join('')).not.toContain('>');
      expect(level.tiles.join('').split('<').length - 1).toBe(1);
    }
  });

  it('puts both stairs inside rooms, never in a corridor', () => {
    for (let seed = 0; seed < 200; seed++) {
      const level = generateLevel(seed, 1 + (seed % 99), SIZES[seed % 3]!);
      for (const p of [level.upStair, level.downStair!]) {
        expect(level.rooms.some((r) => p.x > r.x && p.x < r.x + r.w - 1 && p.y > r.y && p.y < r.y + r.h - 1)).toBe(true);
      }
    }
  });

  // Spec 02 acceptance: 100% connectivity, both stairs, down stair at least 60% away, fewer
  // than 1% of levels on the fallback. One level per seed, depth and size cycling.
  it('passes connectivity and stair checks on 10,000 seeds', () => {
    let fallbacks = 0;
    const failures: string[] = [];
    for (let seed = 0; seed < 10_000; seed++) {
      const depth = 1 + (seed % MAX_DEPTH);
      const size = SIZES[seed % 3]!;
      const level = generateLevel(seed * 2654435761, depth, size);
      const problem = checkLevel(level);
      if (problem) failures.push(`seed ${seed} depth ${depth} ${size}: ${problem}`);
      expect(findProblems(level)).toEqual([]);
      if (level.fallback) fallbacks++;
    }
    expect(failures).toEqual([]);
    expect(fallbacks).toBeLessThan(100);
  }, 120_000);

  it('generates a large level well inside 50 ms on average', () => {
    generateLevel(1, 1, 'large'); // warm up
    const runs = 40;
    const start = performance.now();
    for (let i = 0; i < runs; i++) generateLevel(1000 + i, 50, 'large');
    expect((performance.now() - start) / runs).toBeLessThan(50);
  });

  it('the plain-rooms fallback is valid at every size and depth', () => {
    for (const size of SIZES) {
      for (const depth of [1, 50, MAX_DEPTH]) {
        const level = fallbackLevel(5, depth, size, levelSeed(5, depth));
        expect(level.fallback).toBe(true);
        expect(checkLevel(level)).toBeNull();
        expect(findProblems(level)).toEqual([]);
      }
    }
  });
});

describe('connecting regions (Spec 02, step 2)', () => {
  const grid = (w: number, h: number, rows: string[]): Uint8Array => {
    const cells = new Uint8Array(w * h);
    rows.forEach((row, y) => [...row].forEach((c, x) => (cells[y * w + x] = c === '.' ? FLOOR : WALL)));
    return cells;
  };

  it('joins a region that touches the main one only at a corner into a real passage', () => {
    // Two blocks that touch only at a corner: (3,2) and (4,3).
    const cells = grid(9, 5, [
      '#########',
      '#..######',
      '#...#####',
      '####..###',
      '#########',
    ]);
    expect(labelRegions(cells, 9, 5).count).toBe(2);
    connectRegions(cells, 9, 5, { x: 1, y: 1 }, createRng(1));
    expect(labelRegions(cells, 9, 5).count).toBe(1);
  });

  it('joins several far-apart regions into one', () => {
    const w = 40;
    const h = 20;
    const cells = new Uint8Array(w * h);
    for (const [x0, y0] of [[2, 2], [30, 3], [10, 14], [34, 15]] as const) {
      for (let y = y0; y < y0 + 3; y++) for (let x = x0; x < x0 + 4; x++) cells[y * w + x] = FLOOR;
    }
    expect(labelRegions(cells, w, h).count).toBe(4);
    connectRegions(cells, w, h, { x: 2, y: 2 }, createRng(7));
    expect(labelRegions(cells, w, h).count).toBe(1);
  });

  it('places no down stair when no room cell is far enough, and reports it', () => {
    const w = 20;
    const h = 10;
    const cells = new Uint8Array(w * h);
    const room = { x: 2, y: 2, w: 3, h: 3 }; // a single interior cell
    for (let y = 2; y < 5; y++) for (let x = 2; x < 5; x++) cells[y * w + x] = FLOOR;
    expect(placeStairs(cells, w, h, [room], 5, createRng(1))).toBeNull();
    expect(cells.includes(STAIRS_UP)).toBe(true);
  });
});

describe('validation (Spec 02, step 12)', () => {
  const good = generateLevel(3, 10, 'small');

  it('accepts a generated level', () => expect(findProblems(good)).toEqual([]));

  it('rejects an unreachable cell', () => {
    const rows = good.tiles.map((r) => r.split(''));
    rows[1]![1] = '.'; // an isolated floor cell in the corner area
    rows[1]![2] = '#';
    const bad = { ...good, tiles: rows.map((r) => r.join('')) };
    expect(findProblems(bad).join()).toContain('not reachable');
  });

  it('rejects a missing down stair, an open edge and a down stair on level 100', () => {
    const noDown = { ...good, tiles: good.tiles.map((r) => r.replace('>', '.')) };
    expect(findProblems(noDown).join()).toContain('down stair');
    const open = { ...good, tiles: good.tiles.map((r, y) => (y === 0 ? '.' + r.slice(1) : r)) };
    expect(findProblems(open).join()).toContain('edge');
    expect(findProblems({ ...good, depth: MAX_DEPTH }).join()).toContain('level 100');
  });

  it('rejects a down stair that is too close to the up stair', () => {
    const rows = good.tiles.map((r) => r.split(''));
    const { x: dx, y: dy } = good.downStair!;
    rows[dy]![dx] = '.';
    const up = good.upStair;
    // Put the down stair on a floor cell right beside the up stair.
    const spot = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => ({ x: up.x + a!, y: up.y + b! })).find((p) => rows[p.y]![p.x] === '.')!;
    rows[spot.y]![spot.x] = '>';
    const bad = { ...good, tiles: rows.map((r) => r.join('')), downStair: spot };
    expect(findProblems(bad).join()).toContain('under 60%');
  });

  it('has no wall-only level: every level has walkable floor', () => {
    expect(WALL).toBe(0);
    expect(good.tiles.join('')).toContain('.');
  });
});
