// Level generation pipeline (Spec 02, "Generation pipeline"). Task 1.6 builds steps 1 to 3
// (carve, connect, stairs) and the validation they need (step 12) for the rooms-and-corridors
// layout. Doors, keys, features and the rest arrive with tasks 2.3 and 2.4.

import { levelSeed, levelStreams, subSeed, type Rng } from '../../core/rng.ts';
import {
  FLOOR,
  STAIRS_DOWN,
  STAIRS_UP,
  carveCorridor,
  distancesFrom,
  labelRegions,
  toRows,
} from './grid.ts';
import { GENERATOR_VERSION, LEVEL_SIZES, MAX_DEPTH, type Level, type Point, type Rect, type SizeClass } from './level.ts';
import { carveRoomsAndCorridors } from './rooms-and-corridors.ts';
import { farEnough, findProblems } from './validate.ts';

/** Tries with successive sub-seeds before the plain-rooms fallback (Spec 02, step 12). */
export const MAX_ATTEMPTS = 20;

/**
 * Step 2, "Connect": flood-fill in four directions and join every separate region to the
 * main one (the one holding `anchor`) with a corridor. Two regions that touch only at a
 * corner are at distance 2, so their joining corridor is the cell that widens the touch
 * into a real passage.
 */
export function connectRegions(cells: Uint8Array, width: number, height: number, anchor: Point, rng: Rng): void {
  for (;;) {
    const { labels, count } = labelRegions(cells, width, height);
    if (count <= 1) return;
    const main = labels[anchor.y * width + anchor.x]!;
    const mainCells: Point[] = [];
    const otherCells: Point[] = [];
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i]!;
      if (label === 0) continue;
      (label === main ? mainCells : otherCells).push({ x: i % width, y: Math.floor(i / width) });
    }
    // Join the nearest other-region cell to the nearest main-region cell; the next pass
    // finds any region still left over.
    let best: [Point, Point] = [mainCells[0]!, otherCells[0]!];
    let bestDist = Infinity;
    for (const o of otherCells) {
      for (const m of mainCells) {
        const d = Math.abs(o.x - m.x) + Math.abs(o.y - m.y);
        if (d < bestDist) {
          bestDist = d;
          best = [m, o];
        }
      }
    }
    carveCorridor(cells, width, best[0], best[1], rng.oneIn(2));
  }
}

/** Cells with floor on all four sides inside a room: never a doorway, never in a corridor mouth. */
function roomInteriorCells(rooms: Rect[]): Point[] {
  const out: Point[] = [];
  for (const r of rooms) {
    for (let y = r.y + 1; y < r.y + r.h - 1; y++) {
      for (let x = r.x + 1; x < r.x + r.w - 1; x++) out.push({ x, y });
    }
  }
  return out;
}

/**
 * Step 3, "Stairs": the up stair in a random room, then the down stair at least 60% of the
 * longest walkable distance away (none on level 100). Returns null when no cell qualifies,
 * which makes the attempt fail validation.
 */
export function placeStairs(
  cells: Uint8Array,
  width: number,
  height: number,
  rooms: Rect[],
  depth: number,
  rng: Rng,
): { up: Point; down: Point | null } | null {
  const spots = roomInteriorCells(rooms);
  if (spots.length === 0) return null;
  const up = rng.pick(spots);
  cells[up.y * width + up.x] = STAIRS_UP;
  if (depth >= MAX_DEPTH) return { up, down: null };

  const dist = distancesFrom(cells, width, height, up);
  let longest = 0;
  for (const d of dist) if (d > longest) longest = d;
  const far = spots.filter((p) => farEnough(dist[p.y * width + p.x]!, longest) && (p.x !== up.x || p.y !== up.y));
  if (far.length === 0) return null;
  const down = rng.pick(far);
  cells[down.y * width + down.x] = STAIRS_DOWN;
  return { up, down };
}

function build(
  runSeed: number,
  depth: number,
  size: SizeClass,
  attempts: number,
  fallback: boolean,
  cells: Uint8Array,
  rooms: Rect[],
  stairs: { up: Point; down: Point | null },
): Level {
  const { width, height } = LEVEL_SIZES[size];
  return {
    generatorVersion: GENERATOR_VERSION,
    runSeed: runSeed >>> 0,
    depth,
    size,
    width,
    height,
    tiles: toRows(cells, width, height),
    rooms,
    upStair: stairs.up,
    downStair: stairs.down,
    attempts,
    fallback,
  };
}

/** One try with one sub-seed: carve, connect, stairs. Null when stairs cannot be placed. */
function attempt(runSeed: number, depth: number, size: SizeClass, seed: number, attempts: number): Level | null {
  const { width, height } = LEVEL_SIZES[size];
  const { layout } = levelStreams(seed);
  const cells = new Uint8Array(width * height);
  const rooms = carveRoomsAndCorridors(cells, width, height, layout);
  const first = rooms[0]!;
  connectRegions(cells, width, height, { x: first.x, y: first.y }, layout);
  const stairs = placeStairs(cells, width, height, rooms, depth, layout);
  if (!stairs) return null;
  return build(runSeed, depth, size, attempts, false, cells, rooms, stairs);
}

/**
 * The plain-rooms fallback: two fixed rooms in opposite corners joined by one corridor,
 * with seeded stairs. Used only after 20 failed tries.
 */
export function fallbackLevel(runSeed: number, depth: number, size: SizeClass, seed: number): Level {
  const { width, height } = LEVEL_SIZES[size];
  const { layout } = levelStreams(seed);
  const cells = new Uint8Array(width * height);
  const rooms: Rect[] = [
    { x: 3, y: 3, w: 12, h: 6 },
    { x: width - 16, y: height - 10, w: 12, h: 6 },
  ];
  for (const r of rooms) {
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) cells[y * width + x] = FLOOR;
  }
  carveCorridor(cells, width, { x: 9, y: 5 }, { x: width - 10, y: height - 7 }, true);
  const stairs = placeStairs(cells, width, height, rooms, depth, layout);
  if (!stairs) throw new Error('fallback level could not place stairs');
  return build(runSeed, depth, size, MAX_ATTEMPTS, true, cells, rooms, stairs);
}

/**
 * Generate level `depth` of the run `runSeed`. Deterministic: the same seed, depth, size
 * and generator version always give the same level, and no other level is needed first.
 * If validation fails, the next sub-seed is tried (up to 20 times), then the fallback.
 */
export function generateLevel(runSeed: number, depth: number, size: SizeClass): Level {
  if (!Number.isInteger(depth) || depth < 1 || depth > MAX_DEPTH) throw new RangeError(`bad level number: ${depth}`);
  const seed = levelSeed(runSeed, depth);
  for (let n = 0; n < MAX_ATTEMPTS; n++) {
    const level = attempt(runSeed, depth, size, subSeed(seed, n), n + 1);
    if (level && findProblems(level).length === 0) return level;
  }
  const level = fallbackLevel(runSeed, depth, size, subSeed(seed, MAX_ATTEMPTS));
  const problems = findProblems(level);
  if (problems.length > 0) throw new Error(`fallback level invalid: ${problems.join('; ')}`);
  return level;
}
