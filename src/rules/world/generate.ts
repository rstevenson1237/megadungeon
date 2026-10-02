// Level generation pipeline (Spec 02, "Generation pipeline"). Tasks 1.6 and 2.3 build steps 1 to 3
// (carve, connect, stairs) for all eight layout algorithms, with the retries and the plain-rooms fallback.
// Task 2.4 adds steps 4 to 11 (placement/) and the validation they need (step 12), when the level is given
// its contents; without them a level is walls, floor, liquids and stairs only. Task 3.2 gives each placement step
// its own stream (generator version 4) and keeps version 3, so a save keeps the levels it started with.

import type { LayoutAlgorithm } from '../../core/catalog.ts';
import { createRng, hash32, levelSeed, levelStreams, streamSeed, subSeed, type Rng } from '../../core/rng.ts';
import {
  FLOOR,
  STAIRS_DOWN,
  STAIRS_UP,
  carveCorridor,
  distancesFrom,
  fillRect,
  findClearings,
  interiorOf,
  labelRegions,
  toRows,
} from './grid.ts';
import { carveLayout, DEFAULT_STYLE, type LayoutStyle } from './layouts/index.ts';
import {
  FINAL_BOSS_GENERATOR,
  GENERATOR_VERSION,
  LEVEL_SIZES,
  SUPPORTED_GENERATORS,
  MAX_DEPTH,
  emptyPlacements,
  type Level,
  type Placements,
  type Point,
  type Rect,
  type SizeClass,
} from './level.ts';
import { placeContents, type LevelContents } from './placement/index.ts';
import { farEnough, findProblems } from './validate.ts';

/**
 * Which layout algorithm builds a level, and its variants (Spec 02, clarifications of task 2.3).
 * A theme row has exactly these fields, so a theme can be passed as it is.
 */
export interface LevelStyle extends Partial<LayoutStyle> {
  layout: LayoutAlgorithm;
}

/** The style a level gets when none is given. */
export const PLAIN_STYLE: LevelStyle = { layout: 'rooms_and_corridors' };

/** Tries with successive sub-seeds before the plain-rooms fallback (Spec 02, step 12). */
export const MAX_ATTEMPTS = 20;

const ORTHOGONAL_STEPS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;

/**
 * Step 2, "Connect": flood-fill in four directions and join every separate region to the
 * main one (the one holding `anchor`, or the largest when there is no anchor) with an L-shaped
 * corridor between the nearest pair of cells. Two regions that touch only at a corner are
 * at distance 2, so their joining corridor is the cell that widens the touch into a real passage.
 * Deep water on the way becomes a ford and lava a causeway (see `carveCorridor`).
 */
export function connectRegions(cells: Uint8Array, width: number, height: number, anchor: Point | null, rng: Rng): void {
  const size = width * height;
  const dist = new Int32Array(size);
  const source = new Int32Array(size);
  const queue = new Int32Array(size);
  for (;;) {
    const { labels, count } = labelRegions(cells, width, height);
    if (count <= 1) return;
    let main: number;
    if (anchor) {
      main = labels[anchor.y * width + anchor.x]!;
    } else {
      const sizes = new Int32Array(count + 1);
      for (const label of labels) sizes[label]!++;
      main = 1;
      for (let l = 2; l <= count; l++) if (sizes[l]! > sizes[main]!) main = l;
    }
    // Breadth-first from every cell of the main region over everything, walls included: the first
    // cell of another region reached is the nearest by Manhattan distance, and `source` is its partner.
    dist.fill(-1);
    let head = 0;
    let tail = 0;
    for (let i = 0; i < size; i++) {
      if (labels[i] === main) {
        dist[i] = 0;
        source[i] = i;
        queue[tail++] = i;
      }
    }
    let found = -1;
    while (head < tail) {
      const i = queue[head++]!;
      if (labels[i] !== 0 && labels[i] !== main) {
        found = i;
        break;
      }
      const x = i % width;
      const y = (i - x) / width;
      for (const [dx, dy] of ORTHOGONAL_STEPS) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const n = ny * width + nx;
        if (dist[n] !== -1) continue;
        dist[n] = dist[i]! + 1;
        source[n] = source[i]!;
        queue[tail++] = n;
      }
    }
    const from = source[found]!;
    carveCorridor(
      cells,
      width,
      { x: from % width, y: Math.floor(from / width) },
      { x: found % width, y: Math.floor(found / width) },
      rng.oneIn(2),
    );
  }
}

/** Plain floor cells inside rooms, never on a room's edge: not a doorway, not in a corridor mouth. */
function roomInteriorCells(cells: Uint8Array, width: number, rooms: Rect[]): Point[] {
  const out: Point[] = [];
  for (const r of rooms) {
    const inner = interiorOf(r);
    for (let y = inner.y; y < inner.y + inner.h; y++) {
      for (let x = inner.x; x < inner.x + inner.w; x++) if (cells[y * width + x] === FLOOR) out.push({ x, y });
    }
  }
  return out;
}

function plainFloorCells(cells: Uint8Array, width: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < cells.length; i++) if (cells[i] === FLOOR) out.push({ x: i % width, y: Math.floor(i / width) });
  return out;
}

/**
 * Step 3, "Stairs": the up stair in a random room, then the down stair at least 60% of the
 * longest walkable distance away (none on level 100). Returns null when no cell qualifies,
 * which makes the attempt fail validation. With `loose`, a stair that finds no room cell
 * (or no room cell far enough) goes on any plain floor cell instead.
 */
export function placeStairs(
  cells: Uint8Array,
  width: number,
  height: number,
  rooms: Rect[],
  depth: number,
  rng: Rng,
  loose = false,
): { up: Point; down: Point | null } | null {
  let spots = roomInteriorCells(cells, width, rooms);
  if (spots.length === 0 && loose) spots = plainFloorCells(cells, width);
  if (spots.length === 0) return null;
  const up = rng.pick(spots);
  cells[up.y * width + up.x] = STAIRS_UP;
  if (depth >= MAX_DEPTH) return { up, down: null };

  const dist = distancesFrom(cells, width, height, up);
  let longest = 0;
  for (const d of dist) if (d > longest) longest = d;
  const far = (p: Point): boolean => farEnough(dist[p.y * width + p.x]!, longest) && (p.x !== up.x || p.y !== up.y);
  let candidates = spots.filter(far);
  if (candidates.length === 0 && loose) candidates = plainFloorCells(cells, width).filter(far);
  if (candidates.length === 0) return null;
  const down = rng.pick(candidates);
  cells[down.y * width + down.x] = STAIRS_DOWN;
  return { up, down };
}

/** What a generator version places: before version 5 level 100 had no final boss, so its plan drops it (Spec 02, Addendum A). */
function contentsFor(version: number, contents: LevelContents | undefined): LevelContents | undefined {
  if (!contents || version >= FINAL_BOSS_GENERATOR || !contents.plan.boss?.final) return contents;
  return { ...contents, plan: { ...contents.plan, boss: undefined } };
}

/**
 * The streams placement steps 4 to 11 draw from (Spec 02, Addendum A). From generator version 4 each step has its
 * own, made from the level's contents seed and the step number, so a change to one table moves only its own step.
 * Version 3 drew every step from the one contents stream, and is kept so older saves keep their levels.
 */
export function placementStreams(seed: number, version: number): (step: number) => Rng {
  if (version < 4) {
    const shared = levelStreams(seed).contents;
    return () => shared;
  }
  const contents = streamSeed(seed, 'contents');
  const made = new Map<number, Rng>();
  return (step) => {
    let rng = made.get(step);
    if (!rng) made.set(step, (rng = createRng(hash32('step', contents, step))));
    return rng;
  };
}

function build(
  version: number,
  runSeed: number,
  depth: number,
  size: SizeClass,
  layout: LayoutAlgorithm,
  attempts: number,
  fallback: boolean,
  cells: Uint8Array,
  rooms: Rect[],
  stairs: { up: Point; down: Point | null },
  placements: Placements = emptyPlacements(),
): Level {
  const { width, height } = LEVEL_SIZES[size];
  return {
    generatorVersion: version,
    runSeed: runSeed >>> 0,
    depth,
    size,
    layout,
    width,
    height,
    tiles: toRows(cells, width, height),
    rooms,
    upStair: stairs.up,
    downStair: stairs.down,
    attempts,
    fallback,
    ...placements,
  };
}

/** The algorithm that really builds a level: the set piece is rooms and corridors until task 4.10. */
const algorithmFor = (layout: LayoutAlgorithm): LayoutAlgorithm => (layout === 'set_piece' ? 'rooms_and_corridors' : layout);

/**
 * One try with one sub-seed: carve, connect, stairs, then (given contents) steps 4 to 11. Null when the
 * layout comes out unusable, the stairs cannot be placed or a required piece does not fit.
 */
function attempt(
  version: number,
  runSeed: number,
  depth: number,
  size: SizeClass,
  style: LevelStyle,
  seed: number,
  attempts: number,
  fallback: boolean,
  contents?: LevelContents,
  strict = true,
): Level | null {
  const { width, height } = LEVEL_SIZES[size];
  const streams = levelStreams(seed);
  const { layout } = streams;
  const cells = new Uint8Array(width * height);
  const variants: LayoutStyle = {
    stamp: style.stamp ?? DEFAULT_STYLE.stamp,
    liquid: style.liquid ?? DEFAULT_STYLE.liquid,
    pillared: style.pillared ?? DEFAULT_STYLE.pillared,
  };
  const carved = carveLayout(style.layout, cells, width, height, layout, variants);
  if (!carved) return null;
  connectRegions(cells, width, height, null, layout);
  const rooms = carved.rooms ?? findClearings(cells, width, height);
  if (rooms.length === 0) return null;
  const stairs = placeStairs(cells, width, height, rooms, depth, layout, carved.looseStairs);
  if (!stairs) return null;
  if (!contents) return build(version, runSeed, depth, size, algorithmFor(style.layout), attempts, fallback, cells, rooms, stairs);
  const placed = placeContents({
    cells,
    width,
    height,
    rooms,
    up: stairs.up,
    down: stairs.down,
    size,
    depth,
    literalRooms: carved.rooms !== null,
    contents,
    steps: placementStreams(seed, version),
    strict,
  });
  if (!placed) return null;
  return build(version, runSeed, depth, size, algorithmFor(style.layout), attempts, fallback, cells, placed.rooms, stairs, placed.placements);
}

/**
 * The plain-rooms fallback (Spec 02, step 12): rooms and corridors with 20 more sub-seeds, and
 * only if all of those fail, two fixed rooms in opposite corners joined by one corridor.
 */
export function fallbackLevel(
  runSeed: number,
  depth: number,
  size: SizeClass,
  seed: number,
  contents?: LevelContents,
  version = GENERATOR_VERSION,
): Level {
  for (let n = 0; n < MAX_ATTEMPTS; n++) {
    const level = attempt(version, runSeed, depth, size, PLAIN_STYLE, subSeed(seed, n), MAX_ATTEMPTS, true, contents);
    if (level && findProblems(level).length === 0) return level;
  }
  const { width, height } = LEVEL_SIZES[size];
  const { layout } = levelStreams(seed);
  const cells = new Uint8Array(width * height);
  const rooms: Rect[] = [
    { x: 3, y: 3, w: 12, h: 6 },
    { x: width - 16, y: height - 10, w: 12, h: 6 },
  ];
  for (const r of rooms) fillRect(cells, width, r, FLOOR);
  carveCorridor(cells, width, { x: 9, y: 5 }, { x: width - 10, y: height - 7 }, true);
  const stairs = placeStairs(cells, width, height, rooms, depth, layout);
  if (!stairs) throw new Error('fallback level could not place stairs');
  // The last resort never fails: whatever of the contents fits is placed, and what does not is left out.
  const placed = contents
    ? placeContents({
        cells, width, height, rooms, up: stairs.up, down: stairs.down, size, depth,
        literalRooms: true, contents, steps: placementStreams(seed, version), strict: false,
      })
    : null;
  return build(version, runSeed, depth, size, 'rooms_and_corridors', MAX_ATTEMPTS, true, cells, placed?.rooms ?? rooms, stairs, placed?.placements);
}

/**
 * Generate level `depth` of the run `runSeed`. Deterministic: the same seed, depth, size, style
 * and generator version always give the same level, and no other level is needed first.
 * If validation fails, the next sub-seed is tried (up to 20 times), then the fallback.
 */
export function generateLevel(
  runSeed: number,
  depth: number,
  size: SizeClass,
  style: LevelStyle = PLAIN_STYLE,
  contents?: LevelContents,
  version = GENERATOR_VERSION,
): Level {
  if (!SUPPORTED_GENERATORS.includes(version)) throw new RangeError(`generator version ${version} is not in this build`);
  if (!Number.isInteger(depth) || depth < 1 || depth > MAX_DEPTH) throw new RangeError(`bad level number: ${depth}`);
  contents = contentsFor(version, contents);
  const seed = levelSeed(runSeed, depth);
  for (let n = 0; n < MAX_ATTEMPTS; n++) {
    const level = attempt(version, runSeed, depth, size, style, subSeed(seed, n), n + 1, false, contents);
    if (level && findProblems(level).length === 0) return level;
  }
  const level = fallbackLevel(runSeed, depth, size, subSeed(seed, MAX_ATTEMPTS), contents, version);
  const problems = findProblems(level);
  if (problems.length > 0) throw new Error(`fallback level invalid: ${problems.join('; ')}`);
  return level;
}
