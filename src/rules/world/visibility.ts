// Visibility (Spec 02, "Visibility and explored cells"): which cells the player sees.
// Recursive shadowcasting over four-direction-agnostic geometry: sight may run at any
// angle, only movement is orthogonal.

import type { Point } from './level.ts';

/** Sight range in cells (Spec 02): dx squared plus dy squared at most 64. */
export const SIGHT_RADIUS = 8;

// Each octant as a transform from (column, row) offsets to map offsets.
const OCTANTS: readonly (readonly [number, number, number, number])[] = [
  [1, 0, 0, 1],
  [0, 1, 1, 0],
  [0, -1, 1, 0],
  [-1, 0, 0, 1],
  [-1, 0, 0, -1],
  [0, -1, -1, 0],
  [0, 1, -1, 0],
  [1, 0, 0, -1],
];

/**
 * Cells visible from `origin` within `radius`, as one byte per cell (1 = visible).
 * `isOpaque` says whether a cell blocks sight. An opaque cell that sight reaches is itself
 * visible, so walls draw as soon as the floor in front of them does. Cells outside the map
 * count as opaque.
 */
export function computeVisible(
  width: number,
  height: number,
  origin: Point,
  isOpaque: (x: number, y: number) => boolean,
  radius: number = SIGHT_RADIUS,
): Uint8Array {
  const visible = new Uint8Array(width * height);
  const r2 = radius * radius;
  const opaque = (x: number, y: number): boolean => x < 0 || y < 0 || x >= width || y >= height || isOpaque(x, y);

  visible[origin.y * width + origin.x] = 1;

  const cast = (row: number, start: number, end: number, xx: number, xy: number, yx: number, yy: number): void => {
    if (start < end) return;
    let newStart = start;
    for (let j = row; j <= radius; j++) {
      let blocked = false;
      for (let dx = -j; dx <= 0; dx++) {
        const dy = -j;
        const x = origin.x + dx * xx + dy * xy;
        const y = origin.y + dx * yx + dy * yy;
        const leftSlope = (dx - 0.5) / (dy + 0.5);
        const rightSlope = (dx + 0.5) / (dy - 0.5);
        if (start < rightSlope) continue;
        if (end > leftSlope) break;
        if (dx * dx + dy * dy <= r2 && x >= 0 && y >= 0 && x < width && y < height) visible[y * width + x] = 1;
        if (blocked) {
          if (opaque(x, y)) {
            newStart = rightSlope;
            continue;
          }
          blocked = false;
          start = newStart;
        } else if (opaque(x, y) && j < radius) {
          blocked = true;
          cast(j + 1, start, leftSlope, xx, xy, yx, yy);
          newStart = rightSlope;
        }
      }
      if (blocked) break;
    }
  };

  for (const [xx, xy, yx, yy] of OCTANTS) cast(1, 1, 0, xx, xy, yx, yy);
  return visible;
}
