// Shared pieces of the layout algorithms (Spec 02, "Level sizes and layouts"; step 1, "Carve").
// Every carver writes into a grid that is all wall on entry and keeps the outermost two rings wall.

import type { CaveStamp, Liquid } from '../../../core/catalog.ts';
import type { Rng } from '../../../core/rng.ts';
import { FLOOR, carveCorridor } from '../grid.ts';
import type { Point, Rect } from '../level.ts';

/** The theme's layout variants (Spec 02, clarifications of task 2.3). */
export interface LayoutStyle {
  stamp: CaveStamp;
  liquid: Liquid;
  pillared: boolean;
}

export const DEFAULT_STYLE: LayoutStyle = { stamp: 'shafts', liquid: 'water', pillared: false };

/** What a carver hands back. */
export interface Carved {
  /** Literal rooms; null for layouts without any, which get clearings once the level is finished. */
  rooms: Rect[] | null;
  /** True when the down stair may go outside a room if no room cell is far enough (Spec 02, step 3). */
  looseStairs: boolean;
}

/** Cells kept as wall on every side: the edge ring and one more, so walls always draw beside floor. */
export const MARGIN = 2;

export const centreOf = (r: Rect): Point => ({ x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) });
export const manhattan = (a: Point, b: Point): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const pointIn = (r: Rect, rng: Rng): Point => ({ x: rng.int(r.x, r.x + r.w - 1), y: rng.int(r.y, r.y + r.h - 1) });

export const inside = (x: number, y: number, width: number, height: number): boolean =>
  x >= MARGIN && y >= MARGIN && x < width - MARGIN && y < height - MARGIN;

/** Stamp an ellipse of `value` centred on (cx, cy); cells outside the margin are skipped. Returns the cells changed. */
export function carveEllipse(
  cells: Uint8Array,
  width: number,
  height: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  value: number = FLOOR,
): number {
  let n = 0;
  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) {
      if (!inside(x, y, width, height)) continue;
      const dx = (x - cx) / (rx + 0.5);
      const dy = (y - cy) / (ry + 0.5);
      if (dx * dx + dy * dy > 1) continue;
      if (cells[y * width + x] !== value) n++;
      cells[y * width + x] = value;
    }
  }
  return n;
}

/**
 * The largest rectangle that lies inside an ellipse of radii (rx, ry): half the ellipse's reach
 * along each axis divided by root two, rounded down. Every cell of it is inside the ellipse.
 */
export function inscribedRect(cx: number, cy: number, rx: number, ry: number): Rect {
  const hx = Math.floor(rx / Math.SQRT2);
  const hy = Math.floor(ry / Math.SQRT2);
  return { x: cx - hx, y: cy - hy, w: 2 * hx + 1, h: 2 * hy + 1 };
}

/**
 * Join points with corridors: a spanning tree (each point to the nearest already joined), then each
 * point's two nearest neighbours with chance `extra` in 100, which makes loops. L-shaped corridors.
 */
export function linkPoints(cells: Uint8Array, width: number, points: readonly Point[], rng: Rng, extra: number): void {
  const n = points.length;
  if (n < 2) return;
  const joined = new Set<number>([0]);
  const linked = new Set<number>();
  const key = (i: number, j: number): number => (i < j ? i * n + j : j * n + i);
  const join = (i: number, j: number): void => {
    linked.add(key(i, j));
    carveCorridor(cells, width, points[i]!, points[j]!, rng.oneIn(2));
  };
  while (joined.size < n) {
    let best: [number, number] = [0, 0];
    let bestDist = Infinity;
    for (const i of joined) {
      for (let j = 0; j < n; j++) {
        if (joined.has(j)) continue;
        const d = manhattan(points[i]!, points[j]!);
        if (d < bestDist) {
          bestDist = d;
          best = [i, j];
        }
      }
    }
    join(best[0], best[1]);
    joined.add(best[1]);
  }
  for (let i = 0; i < n; i++) {
    const near = [...points.keys()]
      .filter((j) => j !== i)
      .sort((a, b) => manhattan(points[i]!, points[a]!) - manhattan(points[i]!, points[b]!) || a - b)
      .slice(0, 2);
    for (const j of near) {
      if (linked.has(key(i, j))) continue;
      if (rng.int(1, 100) <= extra) join(i, j);
    }
  }
}
