// Layout algorithm "Cellular caves" (Spec 02): cellular automata smoothing, then shafts, rivers or a
// central lake stamped in. The theme says which (task 2.3 clarifications).

import type { Liquid } from '../../../core/catalog.ts';
import type { Rng } from '../../../core/rng.ts';
import { DEEP, FLOOR, LAVA, SHALLOW, WALL, keepLargestRegion } from '../grid.ts';
import { MARGIN, carveEllipse, inside, type Carved, type LayoutStyle } from './common.ts';

const WALL_CHANCE = 45; // percent
const SMOOTHING_PASSES = 5;
// The 4-5 rule: a wall stays wall with four or more wall neighbours, a floor cell turns wall with five or more.
const WALL_KEEPS = 4;
const WALL_FORMS = 5;
/** A cave must fill at least this share of the level, or the try is dropped. */
const MIN_FLOOR_SHARE = 0.18;

function smooth(cells: Uint8Array, width: number, height: number): Uint8Array {
  const next = new Uint8Array(cells.length);
  for (let y = MARGIN; y < height - MARGIN; y++) {
    for (let x = MARGIN; x < width - MARGIN; x++) {
      let walls = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if ((dx !== 0 || dy !== 0) && cells[(y + dy) * width + x + dx] === WALL) walls++;
        }
      }
      const wall = cells[y * width + x] === WALL;
      next[y * width + x] = walls >= (wall ? WALL_KEEPS : WALL_FORMS) ? WALL : FLOOR;
    }
  }
  return next;
}

/** One to three straight one-cell passages through rock, each through a cave cell so it joins the cave. */
function stampShafts(cells: Uint8Array, width: number, height: number, rng: Rng): void {
  const floor: number[] = [];
  for (let i = 0; i < cells.length; i++) if (cells[i] === FLOOR) floor.push(i);
  for (let n = rng.int(2, 4); n > 0; n--) {
    const at = rng.pick(floor);
    const x0 = at % width;
    const y0 = (at - x0) / width;
    const horizontal = rng.oneIn(2);
    const before = rng.int(6, 16);
    const after = rng.int(6, 16);
    for (let k = -before; k <= after; k++) {
      const x = horizontal ? x0 + k : x0;
      const y = horizontal ? y0 : y0 + k;
      if (inside(x, y, width, height) && cells[y * width + x] === WALL) cells[y * width + x] = FLOOR;
    }
  }
}

/** What a liquid's bank, ford and shore are made of: shallow water for water, plain floor for lava. */
const shore = (liquid: Liquid): number => (liquid === 'lava' ? FLOOR : SHALLOW);
const deep = (liquid: Liquid): number => (liquid === 'lava' ? LAVA : DEEP);

/**
 * A meandering band one or two cells wide from one side of the level to the other, with shallow banks and
 * two to four fords. Runs along `a` (the long axis), drifting along `b`.
 */
function stampRiver(cells: Uint8Array, width: number, height: number, rng: Rng, liquid: Liquid): void {
  const horizontal = rng.oneIn(2);
  const lenA = horizontal ? width : height;
  const lenB = horizontal ? height : width;
  const cell = (a: number, b: number): number => (horizontal ? b * width + a : a * width + b);
  const ok = (a: number, b: number): boolean => (horizontal ? inside(a, b, width, height) : inside(b, a, width, height));
  let b = rng.int(lenB >> 2, lenB - (lenB >> 2));
  const riverCells: [number, number][] = [];
  for (let a = MARGIN; a < lenA - MARGIN; a++) {
    if (rng.oneIn(4)) {
      const nb = b + (rng.oneIn(2) ? 1 : -1);
      if (nb >= MARGIN + 3 && nb < lenB - MARGIN - 3) {
        riverCells.push([a, b]); // the step across keeps the river connected edge to edge
        b = nb;
      }
    }
    riverCells.push([a, b]);
    if (rng.oneIn(2) && ok(a, b + 1)) riverCells.push([a, b + 1]);
  }
  for (const [a, rb] of riverCells) cells[cell(a, rb)] = deep(liquid);
  // Banks: floor beside the river turns shallow (water only).
  if (liquid === 'water') {
    for (const [a, rb] of riverCells) {
      for (const [da, db] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
        if (ok(a + da, rb + db) && cells[cell(a + da, rb + db)] === FLOOR) cells[cell(a + da, rb + db)] = SHALLOW;
      }
    }
  }
  // Fords: two to four spans of three cells where the river can be crossed.
  for (let n = rng.int(2, 4); n > 0; n--) {
    const a0 = rng.int(MARGIN + 2, lenA - MARGIN - 5);
    for (let a = a0; a < a0 + 3; a++) {
      for (const [ra, rb] of riverCells) if (ra === a) cells[cell(ra, rb)] = shore(liquid);
    }
  }
}

/** An ellipse of deep liquid near the centre with a two-cell shore (shallow water, or plain floor beside lava). */
function stampLake(cells: Uint8Array, width: number, height: number, rng: Rng, liquid: Liquid): void {
  const cx = (width >> 1) + rng.int(-(width >> 3), width >> 3);
  const cy = (height >> 1) + rng.int(-(height >> 4), height >> 4);
  const rx = Math.max(4, Math.floor(width / 8) + rng.int(-2, 2));
  const ry = Math.max(3, Math.floor(height / 6) + rng.int(-1, 1));
  carveEllipse(cells, width, height, cx, cy, rx + 2, ry + 2, shore(liquid));
  carveEllipse(cells, width, height, cx, cy, rx, ry, deep(liquid));
}

export function carveCaves(cells: Uint8Array, width: number, height: number, rng: Rng, style: LayoutStyle): Carved | null {
  for (let y = MARGIN; y < height - MARGIN; y++) {
    for (let x = MARGIN; x < width - MARGIN; x++) cells[y * width + x] = rng.int(1, 100) > WALL_CHANCE ? FLOOR : WALL;
  }
  let grid = cells;
  for (let pass = 0; pass < SMOOTHING_PASSES; pass++) grid = smooth(grid, width, height);
  cells.set(grid);
  const kept = keepLargestRegion(cells, width, height);
  if (kept < width * height * MIN_FLOOR_SHARE) return null;

  if (style.stamp === 'shafts') stampShafts(cells, width, height, rng);
  else if (style.stamp === 'river') stampRiver(cells, width, height, rng, style.liquid);
  else stampLake(cells, width, height, rng, style.liquid);
  return { rooms: null, looseStairs: true };
}
