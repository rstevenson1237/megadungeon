// Layout algorithm "Mirrored halls" (Spec 02): rooms and corridors generated on one half, mirrored across the centre.

import type { Rng } from '../../../core/rng.ts';
import { carveCorridor } from '../grid.ts';
import type { Rect } from '../level.ts';
import { centreOf, type Carved } from './common.ts';
import { carveRoomsAndCorridors } from '../rooms-and-corridors.ts';

/** How many straight corridors cross the centre, from the rooms nearest it. */
const CROSSINGS = [1, 3] as const;

export function carveMirrored(cells: Uint8Array, width: number, height: number, rng: Rng): Carved | null {
  const half = width >> 1;
  // Carve the left half alone: a level half as wide, copied into the left of the grid.
  const left = new Uint8Array(half * height);
  const leftRooms = carveRoomsAndCorridors(left, half, height, rng);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < half; x++) {
      const v = left[y * half + x]!;
      cells[y * width + x] = v;
      cells[y * width + (width - 1 - x)] = v;
    }
  }
  // The strip of wall at the edge of the half stays wall on both sides; cross the centre with halls.
  const nearest = leftRooms.slice().sort((a, b) => b.x + b.w - (a.x + a.w) || a.y - b.y);
  const count = rng.int(CROSSINGS[0], Math.min(CROSSINGS[1], nearest.length));
  for (const room of nearest.slice(0, count)) {
    const c = centreOf(room);
    carveCorridor(cells, width, c, { x: width - 1 - c.x, y: c.y }, true);
  }
  const rooms: Rect[] = leftRooms.concat(leftRooms.map((r) => ({ x: width - r.x - r.w, y: r.y, w: r.w, h: r.h })));
  return { rooms, looseStairs: false };
}
