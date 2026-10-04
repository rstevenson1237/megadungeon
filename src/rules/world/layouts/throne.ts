// The set piece (Spec 02, "Level sizes and layouts"; clarifications of task 4.10): The Abyssal Throne, level 100.
// A hand-authored template with seeded variation: an antechamber with the up stair, a long pillared hall, side
// chambers off it, and the throne room at the far end. Only the sizes and the side chambers vary with the seed.

import type { Rng } from '../../../core/rng.ts';
import { FLOOR, WALL, fillRect } from '../grid.ts';
import type { Rect } from '../level.ts';
import { MARGIN, type Carved } from './common.ts';

/** Passage cells between the antechamber, hall and throne room, and from the hall to a side chamber. */
const LINK = 3;
/** The hall is cut into this many slots along its length; a side chamber may stand on either side of each slot. */
const SLOTS = 3;
/** The least level the template fits in: only a large level does. */
const MIN_WIDTH = 130;
const MIN_HEIGHT = 44;

/** Wall pillars on the given rows, every fourth cell from `x0` to `x1`, so none touches another or the room's edge. */
function pillarRows(cells: Uint8Array, width: number, rows: readonly number[], x0: number, x1: number): void {
  for (const y of rows) for (let x = x0; x <= x1; x += 4) cells[y * width + x] = WALL;
}

export function carveThrone(cells: Uint8Array, width: number, height: number, rng: Rng): Carved | null {
  if (width < MIN_WIDTH || height < MIN_HEIGHT) return null;
  const mid = (height >> 1) + rng.int(-3, 3);

  const anteW = rng.int(9, 13);
  const anteH = rng.int(7, 9);
  const hallLen = rng.int(52, 64);
  const hallH = rng.pick([7, 9, 11]);
  const throneW = rng.int(27, 35);
  const throneH = rng.int(15, 21);

  const ante: Rect = { x: MARGIN + 2, y: mid - (anteH >> 1), w: anteW, h: anteH };
  const hall: Rect = { x: ante.x + anteW + LINK, y: mid - (hallH >> 1), w: hallLen, h: hallH };
  const throne: Rect = { x: hall.x + hallLen + LINK, y: mid - (throneH >> 1), w: throneW, h: throneH };
  if (throne.x + throne.w > width - MARGIN - 2) return null;

  for (const r of [ante, hall, throne]) fillRect(cells, width, r, FLOOR);
  // The two straight passages, one cell wide, along the middle row.
  fillRect(cells, width, { x: ante.x + anteW, y: mid, w: LINK, h: 1 }, FLOOR);
  fillRect(cells, width, { x: hall.x + hallLen, y: mid, w: LINK, h: 1 }, FLOOR);

  // Two to four side chambers, each on one side of the hall in its own slot, joined by a straight passage.
  const spots: { slot: number; north: boolean }[] = [];
  for (let slot = 0; slot < SLOTS; slot++) spots.push({ slot, north: true }, { slot, north: false });
  const chambers: Rect[] = [];
  const slotW = Math.floor(hallLen / SLOTS);
  for (const { slot, north } of rng.shuffle(spots).slice(0, rng.int(2, 4))) {
    const w = rng.int(9, 13);
    const h = rng.int(6, 8);
    const x = hall.x + slot * slotW + rng.int(1, slotW - w - 1);
    const y = north ? hall.y - LINK - h : hall.y + hall.h + LINK;
    const room: Rect = { x, y, w, h };
    fillRect(cells, width, room, FLOOR);
    const gate = x + (w >> 1);
    fillRect(cells, width, { x: gate, y: north ? hall.y - LINK : hall.y + hall.h, w: 1, h: LINK }, FLOOR);
    chambers.push(room);
  }
  chambers.sort((a, b) => a.x - b.x || a.y - b.y);

  // Pillars: two rows down the hall, and four in the throne room, clear of the middle row the boss stands on.
  pillarRows(cells, width, [hall.y + 1, hall.y + hall.h - 2], hall.x + 2, hall.x + hall.w - 3);
  pillarRows(cells, width, [throne.y + 2, throne.y + 5, throne.y + throne.h - 3, throne.y + throne.h - 6], throne.x + 3, throne.x + throne.w - 4);

  return { rooms: [ante, hall, ...chambers, throne], looseStairs: false, upRoom: 0, bossRoom: chambers.length + 2 };
}
