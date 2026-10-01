// Plane geometry for sight, range and targeting (Spec 01 "Targeting", Spec 02 "Visibility").
// Distances are straight-line, so ranges are circles, not squares.

import type { Point } from './level.ts';

/** Squared straight-line distance. A cell is within `r` cells when this is at most r * r. */
export const distanceSq = (a: Point, b: Point): number => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/** Whole cells away, rounded to the nearest, for display ("4 away"). */
export const distanceCells = (a: Point, b: Point): number => Math.round(Math.sqrt(distanceSq(a, b)));

/**
 * The cells of a Bresenham line from `from` to `to`, excluding `from` and including `to`.
 * Used for the targeting path and for line of fire.
 */
export function lineCells(from: Point, to: Point): Point[] {
  const cells: Point[] = [];
  let x = from.x;
  let y = from.y;
  const dx = Math.abs(to.x - x);
  const dy = -Math.abs(to.y - y);
  const sx = x < to.x ? 1 : -1;
  const sy = y < to.y ? 1 : -1;
  let err = dx + dy;
  while (x !== to.x || y !== to.y) {
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
    cells.push({ x, y });
  }
  return cells;
}

/** Bearing of `to` from `from`, in radians clockwise from north, in [0, 2 pi). Breaks distance ties in targeting. */
export function bearingFromNorth(from: Point, to: Point): number {
  const a = Math.atan2(to.x - from.x, from.y - to.y);
  return a < 0 ? a + 2 * Math.PI : a;
}

/** The cells of a square footprint of odd `size` centred on `centre` (3 x 3 is `size` 3). */
export function squareFootprint(centre: Point, size: number): Point[] {
  const half = (size - 1) / 2;
  const cells: Point[] = [];
  for (let y = centre.y - half; y <= centre.y + half; y++) {
    for (let x = centre.x - half; x <= centre.x + half; x++) cells.push({ x, y });
  }
  return cells;
}
