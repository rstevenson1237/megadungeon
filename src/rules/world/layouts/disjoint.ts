// Layout algorithm "Disjoint rooms" (Spec 02): isolated rooms on a sparse grid, linked by long corridors.
// The secret doors come with the placement pipeline (task 2.4); the extra links here are what lets them
// be secret without closing the critical path.

import type { Rng } from '../../../core/rng.ts';
import { FLOOR, fillRect } from '../grid.ts';
import type { Point, Rect } from '../level.ts';
import { MARGIN, centreOf, linkPoints, type Carved } from './common.ts';

const CELL_W = 22;
const CELL_H = 10;
/** Percent of grid cells that hold a room. */
const ROOM_CHANCE = 70;
/** Percent chance that a room's near neighbour gets a second corridor. */
const EXTRA_LINKS = 45;

export function carveDisjoint(cells: Uint8Array, width: number, height: number, rng: Rng): Carved | null {
  const cols = Math.floor((width - 2 * MARGIN) / CELL_W);
  const rowCount = Math.floor((height - 2 * MARGIN) / CELL_H);
  const rooms: Rect[] = [];
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng.int(1, 100) > ROOM_CHANCE) continue;
      // A room 5 to 12 by 3 to 6 inside its grid cell, with two cells of wall all round.
      const w = rng.int(5, CELL_W - 6);
      const h = rng.int(3, CELL_H - 4);
      const room = {
        x: MARGIN + c * CELL_W + rng.int(2, CELL_W - 2 - w),
        y: MARGIN + r * CELL_H + rng.int(2, CELL_H - 2 - h),
        w,
        h,
      };
      fillRect(cells, width, room, FLOOR);
      rooms.push(room);
    }
  }
  if (rooms.length < 3) return null;
  const centres: Point[] = rooms.map(centreOf);
  linkPoints(cells, width, centres, rng, EXTRA_LINKS);
  return { rooms, looseStairs: false };
}
