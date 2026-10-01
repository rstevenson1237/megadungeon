// Layout algorithm "Maze with crypts" (Spec 02): a recursive-backtracker maze with small rooms cut into it.

import type { Rng } from '../../../core/rng.ts';
import { FLOOR, fillRect } from '../grid.ts';
import type { Rect } from '../level.ts';
import type { Carved } from './common.ts';

const CRYPT_WIDTHS = [5, 7];
const CRYPT_HEIGHTS = [3, 5];
/** One crypt for about this many maze cells. */
const CELLS_PER_CRYPT = 60;
/** Cells of wall kept between two crypts. */
const CRYPT_GAP = 2;

export function carveMaze(cells: Uint8Array, width: number, height: number, rng: Rng): Carved | null {
  // Maze cells stand at odd coordinates; the cell between two of them is the passage.
  const cols = Math.floor((width - 2) / 2);
  const rows = Math.floor((height - 2) / 2);
  const seen = new Uint8Array(cols * rows);
  const at = (c: number, r: number): number => (2 * r + 1) * width + 2 * c + 1;
  const stack: [number, number][] = [[rng.int(0, cols - 1), rng.int(0, rows - 1)]];
  seen[stack[0]![1] * cols + stack[0]![0]] = 1;
  cells[at(...stack[0]!)] = FLOOR;
  while (stack.length > 0) {
    const [c, r] = stack[stack.length - 1]!;
    const next: [number, number][] = [];
    for (const [dc, dr] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc >= 0 && nr >= 0 && nc < cols && nr < rows && !seen[nr * cols + nc]) next.push([nc, nr]);
    }
    if (next.length === 0) {
      stack.pop();
      continue;
    }
    const [nc, nr] = rng.pick(next);
    seen[nr * cols + nc] = 1;
    cells[at(nc, nr)] = FLOOR;
    cells[(at(c, r) + at(nc, nr)) >> 1] = FLOOR;
    stack.push([nc, nr]);
  }

  // Crypts, aligned to the maze: corners on maze cells, so the wall around each is a maze wall.
  const rooms: Rect[] = [];
  const want = Math.max(2, Math.floor((cols * rows) / CELLS_PER_CRYPT));
  for (let tries = 0; tries < want * 12 && rooms.length < want; tries++) {
    const w = rng.pick(CRYPT_WIDTHS);
    const h = rng.pick(CRYPT_HEIGHTS);
    const c = rng.int(0, cols - 1 - (w >> 1));
    const r = rng.int(0, rows - 1 - (h >> 1));
    const room = { x: 2 * c + 1, y: 2 * r + 1, w, h };
    if (room.x + room.w > width - 2 || room.y + room.h > height - 2) continue;
    const apart = rooms.every(
      (o) => room.x >= o.x + o.w + CRYPT_GAP || o.x >= room.x + room.w + CRYPT_GAP || room.y >= o.y + o.h + CRYPT_GAP || o.y >= room.y + room.h + CRYPT_GAP,
    );
    if (!apart) continue;
    fillRect(cells, width, room, FLOOR);
    rooms.push(room);
  }
  if (rooms.length < 2) return null;
  return { rooms, looseStairs: true };
}
