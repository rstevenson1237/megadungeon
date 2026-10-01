// Procedural shapes for CP437 shades, blocks and box-drawing characters
// (codes 176-223), so borders join seamlessly across 9 x 16 cells whatever the
// font. Returns rectangles in cell pixels; other codes return undefined.

import { CELL_H, CELL_W } from './grid.ts';

export type Rect = readonly [x: number, y: number, w: number, h: number];

/** Line weight of each arm: 0 none, 1 single, 2 double. */
type Arms = readonly [up: number, down: number, left: number, right: number];

// CP437 codes 179-218.
const BOX: Record<number, Arms> = {
  179: [1, 1, 0, 0], 180: [1, 1, 1, 0], 181: [1, 1, 2, 0], 182: [2, 2, 1, 0],
  183: [0, 2, 1, 0], 184: [0, 1, 2, 0], 185: [2, 2, 2, 0], 186: [2, 2, 0, 0],
  187: [0, 2, 2, 0], 188: [2, 0, 2, 0], 189: [2, 0, 1, 0], 190: [1, 0, 2, 0],
  191: [0, 1, 1, 0], 192: [1, 0, 0, 1], 193: [1, 0, 1, 1], 194: [0, 1, 1, 1],
  195: [1, 1, 0, 1], 196: [0, 0, 1, 1], 197: [1, 1, 1, 1], 198: [1, 1, 0, 2],
  199: [2, 2, 0, 1], 200: [2, 0, 0, 2], 201: [0, 2, 0, 2], 202: [2, 0, 2, 2],
  203: [0, 2, 2, 2], 204: [2, 2, 0, 2], 205: [0, 0, 2, 2], 206: [2, 2, 2, 2],
  207: [1, 0, 2, 2], 208: [2, 0, 1, 1], 209: [0, 1, 2, 2], 210: [0, 2, 1, 1],
  211: [2, 0, 0, 1], 212: [1, 0, 0, 2], 213: [0, 1, 0, 2], 214: [0, 2, 0, 1],
  215: [2, 2, 1, 1], 216: [1, 1, 2, 2], 217: [1, 0, 1, 0], 218: [0, 1, 0, 1],
};

// Line positions: a single line is one pixel on the cell's centre; a double
// line is two pixels with a one-pixel gap.
const CX = 4;
const CY = 8;
const xs = (weight: number): number[] => (weight === 2 ? [CX - 1, CX + 1] : [CX]);
const ys = (weight: number): number[] => (weight === 2 ? [CY - 1, CY + 1] : [CY]);

function boxRects([up, down, left, right]: Arms): Rect[] {
  const rects: Rect[] = [];
  const vWeight = Math.max(up, down);
  const hWeight = Math.max(left, right);
  const vx = vWeight ? xs(vWeight) : [CX];
  const hy = hWeight ? ys(hWeight) : [CY];
  const xl = Math.min(...vx);
  const xr = Math.max(...vx);
  const yt = Math.min(...hy);
  const yb = Math.max(...hy);
  const vLines = (weight: number): number[] => (weight ? xs(weight) : []);
  const hLines = (weight: number): number[] => (weight ? ys(weight) : []);
  // Vertical arms run from the cell edge to the far side of the horizontal band.
  for (const x of vLines(up)) rects.push([x, 0, 1, (hWeight ? yb : CY) + 1]);
  for (const x of vLines(down)) rects.push([x, hWeight ? yt : CY, 1, CELL_H - (hWeight ? yt : CY)]);
  // Horizontal arms run from the cell edge to the far side of the vertical band.
  for (const y of hLines(left)) rects.push([0, y, (vWeight ? xr : CX) + 1, 1]);
  for (const y of hLines(right)) rects.push([vWeight ? xl : CX, y, CELL_W - (vWeight ? xl : CX), 1]);
  return rects;
}

function shadeRects(code: number): Rect[] {
  const on = (x: number, y: number): boolean =>
    code === 176 ? x % 2 === 0 && (y + (x >> 1)) % 2 === 0 : code === 177 ? (x + y) % 2 === 0 : !(x % 2 === 1 && y % 2 === 1);
  const rects: Rect[] = [];
  for (let y = 0; y < CELL_H; y++) for (let x = 0; x < CELL_W; x++) if (on(x, y)) rects.push([x, y, 1, 1]);
  return rects;
}

export function glyphRects(code: number): Rect[] | undefined {
  if (code >= 176 && code <= 178) return shadeRects(code);
  const arms = BOX[code];
  if (arms) return boxRects(arms);
  switch (code) {
    case 219: return [[0, 0, CELL_W, CELL_H]];
    case 220: return [[0, CELL_H / 2, CELL_W, CELL_H / 2]];
    case 221: return [[0, 0, 5, CELL_H]];
    case 222: return [[4, 0, 5, CELL_H]];
    case 223: return [[0, 0, CELL_W, CELL_H / 2]];
    default: return undefined;
  }
}
