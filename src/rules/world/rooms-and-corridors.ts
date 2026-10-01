// Layout algorithm "Rooms and corridors" (Spec 02): binary space partition into
// rooms, joined by straight or L-shaped corridors. Step 1 of the pipeline, "Carve".

import type { Rng } from '../../core/rng.ts';
import { FLOOR, carveCorridor } from './grid.ts';
import type { Point, Rect } from './level.ts';

// Rooms are at least 5 x 3. A leaf keeps a one-cell margin on every side of its room,
// so rooms in different leaves are never adjacent. Leaves are wider than tall because
// a glyph cell is taller than it is wide.
const MIN_LEAF_W = 12;
const MIN_LEAF_H = 7;
const MAX_LEAF_W = 26;
const MAX_LEAF_H = 14;
const SPLIT_CHANCE = 0.8;
const MIN_ROOM_W = 5;
const MIN_ROOM_H = 3;

interface Leaf {
  x: number;
  y: number;
  w: number;
  h: number;
  children?: [Leaf, Leaf];
}

function split(leaf: Leaf, rng: Rng): void {
  const canCutX = leaf.w >= 2 * MIN_LEAF_W;
  const canCutY = leaf.h >= 2 * MIN_LEAF_H;
  if (!canCutX && !canCutY) return;
  const mustSplit = leaf.w > MAX_LEAF_W || leaf.h > MAX_LEAF_H;
  if (!mustSplit && rng.float() >= SPLIT_CHANCE) return;

  let cutX: boolean;
  if (!canCutY) cutX = true;
  else if (!canCutX) cutX = false;
  else if (leaf.w > leaf.h * 2) cutX = true;
  else if (leaf.h * 2 > leaf.w) cutX = false;
  else cutX = rng.oneIn(2);

  let a: Leaf;
  let b: Leaf;
  if (cutX) {
    const at = rng.int(MIN_LEAF_W, leaf.w - MIN_LEAF_W);
    a = { x: leaf.x, y: leaf.y, w: at, h: leaf.h };
    b = { x: leaf.x + at, y: leaf.y, w: leaf.w - at, h: leaf.h };
  } else {
    const at = rng.int(MIN_LEAF_H, leaf.h - MIN_LEAF_H);
    a = { x: leaf.x, y: leaf.y, w: leaf.w, h: at };
    b = { x: leaf.x, y: leaf.y + at, w: leaf.w, h: leaf.h - at };
  }
  leaf.children = [a, b];
  split(a, rng);
  split(b, rng);
}

const centre = (r: Rect): Point => ({ x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) });
const manhattan = (a: Point, b: Point): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const pointIn = (r: Rect, rng: Rng): Point => ({ x: rng.int(r.x, r.x + r.w - 1), y: rng.int(r.y, r.y + r.h - 1) });

/** Carve rooms and the corridors that join them into `cells` (all walls on entry). Returns the rooms. */
export function carveRoomsAndCorridors(cells: Uint8Array, width: number, height: number, rng: Rng): Rect[] {
  // The outermost two rings of cells always stay wall.
  const root: Leaf = { x: 1, y: 1, w: width - 2, h: height - 2 };
  split(root, rng);

  const carveRooms = (leaf: Leaf): Rect[] => {
    if (!leaf.children) {
      const w = rng.int(MIN_ROOM_W, leaf.w - 2);
      const h = rng.int(MIN_ROOM_H, leaf.h - 2);
      const room: Rect = {
        x: rng.int(leaf.x + 1, leaf.x + leaf.w - 1 - w),
        y: rng.int(leaf.y + 1, leaf.y + leaf.h - 1 - h),
        w,
        h,
      };
      for (let y = room.y; y < room.y + room.h; y++) {
        for (let x = room.x; x < room.x + room.w; x++) cells[y * width + x] = FLOOR;
      }
      return [room];
    }
    const left = carveRooms(leaf.children[0]);
    const right = carveRooms(leaf.children[1]);
    // Join the nearest pair of rooms, one from each side, so corridors stay short.
    let best: [Rect, Rect] = [left[0]!, right[0]!];
    let bestDist = Infinity;
    for (const a of left) {
      for (const b of right) {
        const d = manhattan(centre(a), centre(b));
        if (d < bestDist) {
          bestDist = d;
          best = [a, b];
        }
      }
    }
    carveCorridor(cells, width, pointIn(best[0], rng), pointIn(best[1], rng), rng.oneIn(2));
    return left.concat(right);
  };

  return carveRooms(root);
}
