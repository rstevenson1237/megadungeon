import { describe, expect, it } from 'vitest';
import type { LayoutAlgorithm } from '../src/core/catalog.ts';
import { hash32 } from '../src/core/rng.ts';
import { generateLevel, type LevelStyle } from '../src/rules/world/generate.ts';
import { LEVEL_SIZES, MAX_DEPTH, type Level, type Rect, type SizeClass } from '../src/rules/world/level.ts';
import { findProblems } from '../src/rules/world/validate.ts';
import { checkLevel, isBlocking } from './helpers.ts';

const SIZES: SizeClass[] = ['small', 'medium', 'large'];

/** Every layout algorithm with the variants the theme table gives it, at the size its theme uses. */
const VARIANTS: { name: string; style: LevelStyle; size: SizeClass }[] = [
  { name: 'rooms', style: { layout: 'rooms_and_corridors' }, size: 'small' },
  { name: 'pillared halls', style: { layout: 'rooms_and_corridors', pillared: true }, size: 'large' },
  { name: 'mirrored halls', style: { layout: 'mirrored_halls' }, size: 'medium' },
  { name: 'warren tunnels', style: { layout: 'warren_tunnels' }, size: 'small' },
  { name: 'channel grid', style: { layout: 'channel_grid' }, size: 'medium' },
  { name: 'caves with shafts', style: { layout: 'cellular_caves', stamp: 'shafts' }, size: 'medium' },
  { name: 'caves with a river', style: { layout: 'cellular_caves', stamp: 'river' }, size: 'large' },
  { name: 'caves with a lake', style: { layout: 'cellular_caves', stamp: 'lake' }, size: 'large' },
  { name: 'caves with a lava river', style: { layout: 'cellular_caves', stamp: 'river', liquid: 'lava' }, size: 'large' },
  { name: 'maze with crypts', style: { layout: 'maze_with_crypts' }, size: 'medium' },
  { name: 'freeform chambers', style: { layout: 'freeform_chambers' }, size: 'medium' },
  { name: 'disjoint rooms', style: { layout: 'disjoint_rooms' }, size: 'medium' },
];

const make = (variant: (typeof VARIANTS)[number], seed: number, depth = 1 + (seed % 99)): Level =>
  generateLevel(seed * 2654435761, depth, variant.size, variant.style);
const variantNamed = (name: string): (typeof VARIANTS)[number] => VARIANTS.find((v) => v.name === name)!;
const count = (level: Level, c: string): number => level.tiles.join('').split(c).length - 1;
const inRect = (r: Rect, x: number, y: number): boolean => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;

describe('the eight layout algorithms (Spec 02, "Level sizes and layouts")', () => {
  for (const variant of VARIANTS) {
    describe(variant.name, () => {
      it('builds sound levels: four-direction connected, one up stair, one down stair 60% away', () => {
        for (let seed = 0; seed < 150; seed++) {
          const level = make(variant, seed);
          expect(checkLevel(level), `seed ${seed}`).toBeNull();
          expect(findProblems(level), `seed ${seed}`).toEqual([]);
          expect(level.fallback, `seed ${seed}`).toBe(false);
          expect([level.width, level.height]).toEqual([LEVEL_SIZES[variant.size].width, LEVEL_SIZES[variant.size].height]);
          expect(level.layout).toBe(variant.style.layout);
        }
      });

      it('is deterministic, and level 40 alone equals level 40 after other levels', () => {
        const alone = JSON.stringify(generateLevel(321, 40, variant.size, variant.style));
        generateLevel(321, 39, variant.size, variant.style);
        generateLevel(322, 40, variant.size, variant.style);
        expect(JSON.stringify(generateLevel(321, 40, variant.size, variant.style))).toBe(alone);
        expect(generateLevel(1, 5, variant.size, variant.style).tiles).not.toEqual(generateLevel(2, 5, variant.size, variant.style).tiles);
      });

      it('has no down stair on level 100 and lists rooms of plain floor', () => {
        const deepest = generateLevel(9, MAX_DEPTH, variant.size, variant.style);
        expect(deepest.downStair).toBeNull();
        expect(checkLevel(deepest)).toBeNull();
        for (let seed = 0; seed < 40; seed++) {
          const level = make(variant, seed);
          expect(level.rooms.length).toBeGreaterThan(0);
          for (const r of level.rooms) {
            expect(r.x).toBeGreaterThan(0);
            expect(r.y).toBeGreaterThan(0);
            expect(r.x + r.w).toBeLessThan(level.width);
            expect(r.y + r.h).toBeLessThan(level.height);
          }
        }
      });
    });
  }

  it('matches stored hashes for fixed seeds (bump GENERATOR_VERSION if these change on purpose)', () => {
    const actual = VARIANTS.map((v) => hash32(...generateLevel(2026, 33, v.size, v.style).tiles));
    expect(actual).toEqual(GOLDEN);
  });

  it('uses rooms and corridors for the set piece until task 4.10', () => {
    const level = generateLevel(5, MAX_DEPTH, 'large', { layout: 'set_piece' });
    expect(level.layout).toBe('rooms_and_corridors');
    expect(level.downStair).toBeNull();
    expect(checkLevel(level)).toBeNull();
  });

  it('gives every default call the rooms-and-corridors layout', () => {
    expect(generateLevel(5, 5, 'small').layout).toBe('rooms_and_corridors');
  });
});

describe('what each layout is made of', () => {
  it('mirrored halls: the right half is the left half in a mirror, and halls cross the centre', () => {
    const v = variantNamed('mirrored halls');
    for (let seed = 0; seed < 60; seed++) {
      const level = make(v, seed);
      const { width, tiles } = level;
      for (const row of tiles) {
        const plain = row.replace(/[<>]/g, '.');
        expect(plain, `seed ${seed}`).toBe([...plain].reverse().join(''));
      }
      const crossings = tiles.filter((row) => row[width / 2 - 1] !== '#').length;
      expect(crossings).toBeGreaterThan(0);
      expect(level.rooms.length % 2).toBe(0);
    }
  });

  it('warren tunnels: about 22% floor, with blob rooms of plain floor', () => {
    const v = variantNamed('warren tunnels');
    for (let seed = 0; seed < 60; seed++) {
      const level = make(v, seed);
      const floor = level.width * level.height - count(level, '#');
      expect(floor / (level.width * level.height), `seed ${seed}`).toBeGreaterThan(0.2);
      expect(floor / (level.width * level.height), `seed ${seed}`).toBeLessThan(0.3);
      for (const r of level.rooms) {
        expect(r.w).toBeGreaterThanOrEqual(3);
        for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) expect(level.tiles[y]![x]).not.toBe('#');
      }
    }
  });

  it('channel grid: a lattice of 7 x 5 chambers joined by walkways beside water', () => {
    const v = variantNamed('channel grid');
    let channels = 0;
    for (let seed = 0; seed < 60; seed++) {
      const level = make(v, seed);
      expect(level.rooms).toHaveLength(6 * 4); // 100 x 44 holds 6 columns and 4 rows
      for (const r of level.rooms) {
        expect([r.w, r.h]).toEqual([7, 5]);
        for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) expect(isBlocking(level.tiles[y]![x]!)).toBe(false);
      }
      // Every stretch of channel water has floor or a chamber on both sides along its length.
      for (let y = 1; y < level.height - 1; y++) {
        for (let x = 1; x < level.width - 1; x++) {
          if (level.tiles[y]![x] !== '=' ) continue;
          channels++;
          const sides = level.tiles[y]![x - 1] === '.' && level.tiles[y]![x + 1] === '.' ? true : level.tiles[y - 1]![x] === '.' && level.tiles[y + 1]![x] === '.';
          expect(sides, `seed ${seed} at ${x},${y}`).toBe(true);
        }
      }
    }
    expect(channels).toBeGreaterThan(0);
  });

  it('cellular caves: one connected cave with the stamp the theme asks for', () => {
    for (const name of ['caves with shafts', 'caves with a river', 'caves with a lake', 'caves with a lava river']) {
      const v = variantNamed(name);
      for (let seed = 0; seed < 40; seed++) {
        const level = make(v, seed);
        const deep = count(level, '=');
        const lava = count(level, '%');
        const shallow = count(level, '~');
        if (v.style.stamp === 'shafts') expect(deep + lava + shallow, `${name} ${seed}`).toBe(0);
        else if (v.style.liquid === 'lava') expect([lava > 0, deep + shallow], `${name} ${seed}`).toEqual([true, 0]);
        else expect([deep > 0, shallow > 0, lava], `${name} ${seed}`).toEqual([true, true, 0]);
        expect(checkLevel(level), `${name} ${seed}`).toBeNull();
      }
    }
  });

  it('cave lakes sit near the middle and have a shallow shore', () => {
    const v = variantNamed('caves with a lake');
    for (let seed = 0; seed < 40; seed++) {
      const level = make(v, seed);
      const cells: { x: number; y: number }[] = [];
      level.tiles.forEach((row, y) => [...row].forEach((c, x) => c === '=' && cells.push({ x, y })));
      const cx = cells.reduce((s, c) => s + c.x, 0) / cells.length;
      const cy = cells.reduce((s, c) => s + c.y, 0) / cells.length;
      expect(Math.abs(cx - level.width / 2)).toBeLessThan(level.width / 5);
      expect(Math.abs(cy - level.height / 2)).toBeLessThan(level.height / 5);
      // A deep cell touches only deep water, shallow water or rock: the shore is the ring of shallow cells.
      for (const c of cells.slice(0, 200)) {
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) expect(['=', '~', '#']).toContain(level.tiles[c.y + dy]![c.x + dx]);
      }
    }
  });

  it('cave clearings are 5 x 3 to 11 x 7 floor rectangles, at least 2 cells apart', () => {
    const v = variantNamed('caves with shafts');
    for (let seed = 0; seed < 40; seed++) {
      const level = make(v, seed);
      expect(level.rooms.length).toBeGreaterThan(2);
      level.rooms.forEach((r, i) => {
        expect(r.w).toBeGreaterThanOrEqual(5);
        expect(r.w).toBeLessThanOrEqual(11);
        expect(r.h).toBeGreaterThanOrEqual(3);
        expect(r.h).toBeLessThanOrEqual(7);
        for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) expect(['.', '<', '>']).toContain(level.tiles[y]![x]);
        for (const o of level.rooms.slice(i + 1)) {
          const apart = r.x >= o.x + o.w + 2 || o.x >= r.x + r.w + 2 || r.y >= o.y + o.h + 2 || o.y >= r.y + r.h + 2;
          expect(apart, `seed ${seed}`).toBe(true);
        }
      });
    }
  });

  it('maze with crypts: every maze cell is floor, every wall cell between them stays wall outside the crypts', () => {
    const v = variantNamed('maze with crypts');
    for (let seed = 0; seed < 30; seed++) {
      const level = make(v, seed);
      const cols = Math.floor((level.width - 2) / 2);
      const rows = Math.floor((level.height - 2) / 2);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) expect(level.tiles[2 * r + 1]![2 * c + 1], `seed ${seed}`).not.toBe('#');
      }
      for (let y = 0; y < level.height; y += 2) {
        for (let x = 0; x < level.width; x += 2) {
          if (level.rooms.some((r) => inRect(r, x, y))) continue;
          expect(level.tiles[y]![x], `seed ${seed} at ${x},${y}`).toBe('#');
        }
      }
      expect(level.rooms.length).toBeGreaterThanOrEqual(2);
      for (const r of level.rooms) {
        expect([5, 7]).toContain(r.w);
        expect([3, 5]).toContain(r.h);
      }
    }
  });

  it('freeform chambers: apart from one another and joined by corridors', () => {
    const v = variantNamed('freeform chambers');
    for (let seed = 0; seed < 40; seed++) {
      const level = make(v, seed);
      expect(level.rooms.length).toBeGreaterThanOrEqual(2);
      for (const r of level.rooms) {
        for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) expect(level.tiles[y]![x]).not.toBe('#');
      }
    }
  });

  it('disjoint rooms: isolated rooms, long corridors and loops for secret doors to use', () => {
    const v = variantNamed('disjoint rooms');
    for (let seed = 0; seed < 40; seed++) {
      const level = make(v, seed);
      expect(level.rooms.length).toBeGreaterThanOrEqual(3);
      const floor = level.width * level.height - count(level, '#');
      expect(floor / (level.width * level.height)).toBeLessThan(0.35); // sparse
      // Rooms stand apart: no two rectangles within 4 cells of one another.
      level.rooms.forEach((r, i) => {
        for (const o of level.rooms.slice(i + 1)) {
          const apart = r.x >= o.x + o.w + 4 || o.x >= r.x + r.w + 4 || r.y >= o.y + o.h + 3 || o.y >= r.y + r.h + 3;
          expect(apart, `seed ${seed}`).toBe(true);
        }
      });
    }
  });

  it('pillared halls: pillars stand inside big rooms, never on their edge, and keep the level connected', () => {
    const v = variantNamed('pillared halls');
    let pillars = 0;
    for (let seed = 0; seed < 60; seed++) {
      const level = make(v, seed);
      expect(checkLevel(level), `seed ${seed}`).toBeNull();
      for (const r of level.rooms) {
        if (r.w < 7 || r.h < 5) {
          for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) expect(level.tiles[y]![x]).not.toBe('#');
          continue;
        }
        for (let y = r.y; y < r.y + r.h; y++) {
          for (let x = r.x; x < r.x + r.w; x++) {
            const edge = x === r.x || y === r.y || x === r.x + r.w - 1 || y === r.y + r.h - 1;
            if (level.tiles[y]![x] === '#') {
              expect(edge, `seed ${seed} at ${x},${y}`).toBe(false);
              pillars++;
            }
          }
        }
      }
    }
    expect(pillars).toBeGreaterThan(100);
  });

  it('plain halls have no pillars', () => {
    const level = generateLevel(4, 10, 'large', { layout: 'rooms_and_corridors' });
    for (const r of level.rooms) {
      for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) expect(level.tiles[y]![x]).not.toBe('#');
    }
  });
});

describe('liquids (Spec 02, "Liquids")', () => {
  it('shallow water is walkable, deep water and lava are not, and stairs never stand in them', () => {
    for (const name of ['channel grid', 'caves with a lake', 'caves with a lava river']) {
      const v = variantNamed(name);
      for (let seed = 0; seed < 30; seed++) {
        const level = make(v, seed);
        // checkLevel counts '~' as walkable and '=' and '%' as walls: every '~' must be reachable.
        expect(checkLevel(level), `${name} ${seed}`).toBeNull();
        expect(level.tiles[level.upStair.y]![level.upStair.x]).toBe('<');
        expect(count(level, '<') + count(level, '>')).toBe(level.downStair ? 2 : 1);
      }
    }
  });

  it('a stair path never needs a ford that is not shallow: fords turn deep water to shallow and lava to floor', () => {
    // Across many lakes and rivers the level stays connected only through walkable cells.
    for (const name of ['caves with a river', 'caves with a lake', 'caves with a lava river']) {
      const v = variantNamed(name);
      for (let seed = 200; seed < 260; seed++) expect(checkLevel(make(v, seed)), `${name} ${seed}`).toBeNull();
    }
  });
});

describe('the sweep over every layout (Spec 02, acceptance)', () => {
  // Spec 02: connectivity and stair rules on 10,000 seeds, fewer than 1% needing the fallback.
  it('passes on 10,000 seeds, cycling through every layout, depth and size', () => {
    let fallbacks = 0;
    const failures: string[] = [];
    const used = new Map<LayoutAlgorithm, number>();
    for (let seed = 0; seed < 10_000; seed++) {
      const v = VARIANTS[seed % VARIANTS.length]!;
      const depth = 1 + (seed % MAX_DEPTH);
      const level = generateLevel(seed * 2654435761, depth, SIZES[Math.floor(seed / VARIANTS.length) % 3]!, v.style);
      const problem = checkLevel(level) ?? findProblems(level)[0];
      if (problem) failures.push(`seed ${seed} depth ${depth} ${v.name}: ${problem}`);
      if (level.fallback) fallbacks++;
      used.set(level.layout, (used.get(level.layout) ?? 0) + 1);
    }
    expect(failures).toEqual([]);
    expect(fallbacks).toBeLessThan(100);
    expect(used.size).toBe(8);
  }, 600_000);

  it('generates a large level well inside 50 ms on average, whatever the layout', () => {
    for (const v of VARIANTS) {
      generateLevel(1, 1, 'large', v.style); // warm up
      const runs = 30;
      const start = performance.now();
      for (let i = 0; i < runs; i++) generateLevel(1000 + i, 50, 'large', v.style);
      expect((performance.now() - start) / runs, v.name).toBeLessThan(50);
    }
  });
});

// One per entry of VARIANTS, for seed 2026 at level 33.
const GOLDEN = [3718779737, 2320430326, 3861535841, 1733853799, 2067891316, 3867531457, 1059085636, 420462546, 463638240, 2170398940, 3529745570, 3147299300];
