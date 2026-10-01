// Layout algorithm "Warren tunnels" (Spec 02): random-walk tunnels with small blob rooms at junctions.

import type { Rng } from '../../../core/rng.ts';
import { FLOOR } from '../grid.ts';
import type { Point, Rect } from '../level.ts';
import { carveEllipse, inscribedRect, inside, type Carved } from './common.ts';

/** Share of the level that ends as floor. */
const FLOOR_SHARE = 0.22;
const MAX_WALKERS = 10;
const MAX_STEPS = 40_000;
const DIRS: readonly Point[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

export function carveWarren(cells: Uint8Array, width: number, height: number, rng: Rng): Carved | null {
  const target = Math.floor(width * height * FLOOR_SHARE);
  const rooms: Rect[] = [];
  let floor = 0;

  const carve = (x: number, y: number): void => {
    if (cells[y * width + x] !== FLOOR) floor++;
    cells[y * width + x] = FLOOR;
  };
  // A blob room: an ellipse 3 to 5 cells wide each way from its centre and 2 to 3 high.
  const blob = (cx: number, cy: number): void => {
    const rx = rng.int(3, 5);
    const ry = rng.int(2, 3);
    floor += carveEllipse(cells, width, height, cx, cy, rx, ry);
    const r = inscribedRect(cx, cy, rx, ry);
    if (inside(r.x, r.y, width, height) && inside(r.x + r.w - 1, r.y + r.h - 1, width, height)) rooms.push(r);
  };

  const start = { x: rng.int(width >> 2, width - (width >> 2)), y: rng.int(height >> 2, height - (height >> 2)) };
  carve(start.x, start.y);
  blob(start.x, start.y);
  const walkers: { x: number; y: number; dir: number }[] = [{ ...start, dir: rng.int(0, 3) }];

  for (let step = 0; floor < target && step < MAX_STEPS; step++) {
    const w = walkers[rng.int(0, walkers.length - 1)]!;
    if (rng.int(1, 100) > 70) w.dir = rng.int(0, 3);
    for (let tries = 0; tries < 4; tries++) {
      const d = DIRS[w.dir]!;
      if (inside(w.x + d.x, w.y + d.y, width, height)) {
        w.x += d.x;
        w.y += d.y;
        break;
      }
      w.dir = rng.int(0, 3);
    }
    carve(w.x, w.y);
    // A junction: a new tunnel leaves here, often with a blob room.
    if (walkers.length < MAX_WALKERS && rng.oneIn(40)) {
      walkers.push({ x: w.x, y: w.y, dir: (w.dir + (rng.oneIn(2) ? 1 : 3)) % 4 });
      if (rng.oneIn(3) || rooms.length < 3) blob(w.x, w.y);
    }
  }
  if (rooms.length < 2) return null;
  return { rooms, looseStairs: true };
}
