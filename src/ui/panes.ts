// The three panes (Spec 01, "Screen grid and panes"): main view 72 x 30, log
// 72 x 10 below it, character pane 28 x 40 on the right, each outlined with
// single-line box characters, so each usable area is two cells smaller.

import { TRUNCATED } from './cp437.ts';
import type { Grid } from './grid.ts';
import { UI } from './palette.ts';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const MAIN_PANE: Rect = { x: 0, y: 0, w: 72, h: 30 };
export const LOG_PANE: Rect = { x: 0, y: 30, w: 72, h: 10 };
export const CHARACTER_PANE: Rect = { x: 72, y: 0, w: 28, h: 40 };

/** The usable area inside a pane's border. */
export const inner = (r: Rect): Rect => ({ x: r.x + 1, y: r.y + 1, w: r.w - 2, h: r.h - 2 });

const CORNER_TL = 218;
const CORNER_TR = 191;
const CORNER_BL = 192;
const CORNER_BR = 217;
const HORIZONTAL = 196;
const VERTICAL = 179;

/** Draw a single-line border around `r`, with an optional title in the top edge. */
export function drawFrame(grid: Grid, r: Rect, title?: string, colour: number = UI.frame): void {
  const { x, y, w, h } = r;
  const f = colour;
  const bg = UI.background;
  grid.set(x, y, CORNER_TL, f, bg);
  grid.set(x + w - 1, y, CORNER_TR, f, bg);
  grid.set(x, y + h - 1, CORNER_BL, f, bg);
  grid.set(x + w - 1, y + h - 1, CORNER_BR, f, bg);
  for (let cx = x + 1; cx < x + w - 1; cx++) {
    grid.set(cx, y, HORIZONTAL, f, bg);
    grid.set(cx, y + h - 1, HORIZONTAL, f, bg);
  }
  for (let cy = y + 1; cy < y + h - 1; cy++) {
    grid.set(x, cy, VERTICAL, f, bg);
    grid.set(x + w - 1, cy, VERTICAL, f, bg);
  }
  if (title) {
    const room = w - 6; // two border cells, two cells of dash, two of padding
    const shown = title.length > room ? `${title.slice(0, Math.max(0, room - 1))}${TRUNCATED}` : title;
    grid.text(x + 2, y, ` ${shown} `, UI.title, bg);
  }
}

/** Clear all three panes and draw their borders. `mainTitle` is the level name and depth. */
export function drawPanes(grid: Grid, mainTitle: string): void {
  grid.clear(UI.background);
  drawFrame(grid, MAIN_PANE, mainTitle);
  drawFrame(grid, LOG_PANE, 'Log');
  drawFrame(grid, CHARACTER_PANE, 'Character');
}
