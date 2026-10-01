// Layout algorithm "Channel grid" (Spec 02): a regular grid of channels and junction chambers, with
// walkways beside the water.

import type { Rng } from '../../../core/rng.ts';
import { DEEP, FLOOR, LAVA, SHALLOW, fillRect } from '../grid.ts';
import type { Rect } from '../level.ts';
import { MARGIN, type Carved, type LayoutStyle } from './common.ts';

const CHAMBER_W = 7;
const CHAMBER_H = 5;
const SPACING_X = 17;
const SPACING_Y = 11;
/** Percent of neighbouring chambers that a channel joins. */
const CHANNEL_CHANCE = 85;
/** Percent of channels whose water is shallow, so they can be waded. */
const SHALLOW_CHANNEL_CHANCE = 25;

export function carveChannelGrid(cells: Uint8Array, width: number, height: number, rng: Rng, style: LayoutStyle): Carved | null {
  const halfW = CHAMBER_W >> 1;
  const halfH = CHAMBER_H >> 1;
  const x0 = MARGIN + halfW + 1;
  const y0 = MARGIN + halfH + 1;
  const cols = Math.floor((width - x0 - x0) / SPACING_X) + 1;
  const rows = Math.floor((height - y0 - y0) / SPACING_Y) + 1;
  if (cols < 2 || rows < 1) return null;
  const deep = style.liquid === 'lava' ? LAVA : DEEP;
  const rooms: Rect[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = x0 + c * SPACING_X;
      const cy = y0 + r * SPACING_Y;
      const room = { x: cx - halfW, y: cy - halfH, w: CHAMBER_W, h: CHAMBER_H };
      fillRect(cells, width, room, FLOOR);
      rooms.push(room);
      // A few puddles on the chamber floor.
      for (let n = rng.int(0, 3); n > 0; n--) {
        cells[rng.int(room.y, room.y + room.h - 1) * width + rng.int(room.x, room.x + room.w - 1)] = SHALLOW;
      }
    }
  }
  const channel = (from: { x: number; y: number }, to: { x: number; y: number }, horizontal: boolean): void => {
    const water = rng.int(1, 100) <= SHALLOW_CHANNEL_CHANCE ? SHALLOW : deep;
    const [a0, a1] = horizontal ? [from.x + halfW + 1, to.x - halfW - 1] : [from.y + halfH + 1, to.y - halfH - 1];
    for (let a = a0; a <= a1; a++) {
      for (let side = -1; side <= 1; side++) {
        const [x, y] = horizontal ? [a, from.y + side] : [from.x + side, a];
        cells[y * width + x] = side === 0 ? water : FLOOR;
      }
    }
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const here = { x: x0 + c * SPACING_X, y: y0 + r * SPACING_Y };
      if (c + 1 < cols && rng.int(1, 100) <= CHANNEL_CHANCE) channel(here, { x: here.x + SPACING_X, y: here.y }, true);
      if (r + 1 < rows && rng.int(1, 100) <= CHANNEL_CHANCE) channel(here, { x: here.x, y: here.y + SPACING_Y }, false);
    }
  }
  return { rooms, looseStairs: false };
}
