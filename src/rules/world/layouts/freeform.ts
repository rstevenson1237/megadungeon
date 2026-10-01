// Layout algorithm "Freeform chambers" (Spec 02): round and odd-shaped chambers placed apart, joined by corridors.

import type { Rng } from '../../../core/rng.ts';
import type { Point, Rect } from '../level.ts';
import { MARGIN, carveEllipse, inscribedRect, inside, linkPoints, type Carved } from './common.ts';

/** One chamber for about this many map cells. */
const CELLS_PER_CHAMBER = 330;
const PLACEMENT_TRIES = 30;
/** Cells of wall kept between two chambers' bounding boxes. */
const GAP = 3;
/** Percent chance that a chamber's near neighbour gets a second corridor. */
const EXTRA_LINKS = 25;

interface Part {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export function carveFreeform(cells: Uint8Array, width: number, height: number, rng: Rng): Carved | null {
  const want = Math.max(4, Math.round((width * height) / CELLS_PER_CHAMBER));
  const rooms: Rect[] = [];
  const centres: Point[] = [];
  const boxes: Rect[] = [];

  for (let tries = 0; tries < want * PLACEMENT_TRIES && rooms.length < want; tries++) {
    // The main ellipse, then one or two smaller ones overlapping its edge: lobes, a cross, an L.
    const main: Part = { cx: 0, cy: 0, rx: rng.int(3, 7), ry: rng.int(2, 4) };
    main.cx = rng.int(MARGIN + main.rx + 1, width - MARGIN - main.rx - 2);
    main.cy = rng.int(MARGIN + main.ry + 1, height - MARGIN - main.ry - 2);
    const parts: Part[] = [main];
    for (let extra = rng.int(0, 2); extra > 0; extra--) {
      const rx = rng.int(2, 5);
      const ry = rng.int(2, 4);
      parts.push({
        cx: main.cx + rng.int(-main.rx, main.rx),
        cy: main.cy + rng.int(-main.ry, main.ry),
        rx,
        ry,
      });
    }
    const box = {
      x: Math.min(...parts.map((p) => p.cx - p.rx)),
      y: Math.min(...parts.map((p) => p.cy - p.ry)),
      w: 0,
      h: 0,
    };
    box.w = Math.max(...parts.map((p) => p.cx + p.rx)) - box.x + 1;
    box.h = Math.max(...parts.map((p) => p.cy + p.ry)) - box.y + 1;
    if (!inside(box.x, box.y, width, height) || !inside(box.x + box.w - 1, box.y + box.h - 1, width, height)) continue;
    const apart = boxes.every(
      (o) => box.x >= o.x + o.w + GAP || o.x >= box.x + box.w + GAP || box.y >= o.y + o.h + GAP || o.y >= box.y + box.h + GAP,
    );
    if (!apart) continue;
    for (const p of parts) carveEllipse(cells, width, height, p.cx, p.cy, p.rx, p.ry);
    boxes.push(box);
    rooms.push(inscribedRect(main.cx, main.cy, main.rx, main.ry));
    centres.push({ x: main.cx, y: main.cy });
  }
  if (rooms.length < 2) return null;
  linkPoints(cells, width, centres, rng, EXTRA_LINKS);
  return { rooms, looseStairs: false };
}
