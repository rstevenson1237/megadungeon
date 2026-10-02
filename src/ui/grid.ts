// The cell model (Spec 01, "Screen grid and panes", "Rendering"): a fixed
// 100 x 40 grid; each cell holds a glyph code (0-255) and 24-bit colours.

import { CP437_TO_UNICODE, toCp437 } from './cp437.ts';

export const COLS = 100;
export const ROWS = 40;
export const CELL_W = 9;
export const CELL_H = 16;
export const NATIVE_W = COLS * CELL_W; // 900
export const NATIVE_H = ROWS * CELL_H; // 640

export class Grid {
  readonly glyph = new Uint8Array(COLS * ROWS);
  readonly fg = new Uint32Array(COLS * ROWS);
  readonly bg = new Uint32Array(COLS * ROWS);

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < COLS && y < ROWS;
  }

  /** Set one cell. Out-of-bounds writes are ignored, so callers can clip freely. */
  set(x: number, y: number, glyph: number, fg: number, bg: number): void {
    if (!this.inBounds(x, y)) return;
    const i = y * COLS + x;
    this.glyph[i] = glyph;
    this.fg[i] = fg & 0xffffff;
    this.bg[i] = bg & 0xffffff;
  }

  /** Change only a cell's background, keeping its glyph and foreground (used to tint cells). */
  setBg(x: number, y: number, bg: number): void {
    if (this.inBounds(x, y)) this.bg[y * COLS + x] = bg & 0xffffff;
  }

  /** Write a string left to right, one cell per character. */
  text(x: number, y: number, s: string, fg: number, bg: number): void {
    let cx = x;
    for (const ch of s) this.set(cx++, y, toCp437(ch), fg, bg);
  }

  /** Fill a rectangle with one glyph and colours. */
  fill(x: number, y: number, w: number, h: number, glyph: number, fg: number, bg: number): void {
    for (let cy = y; cy < y + h; cy++) for (let cx = x; cx < x + w; cx++) this.set(cx, cy, glyph, fg, bg);
  }

  clear(bg = 0): void {
    this.glyph.fill(0);
    this.fg.fill(0);
    this.bg.fill(bg & 0xffffff);
  }

  /** The screen as text, one line per row, each glyph as its Unicode character (read by the browser smoke test). */
  lines(): string[] {
    return Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) => CP437_TO_UNICODE[this.glyph[y * COLS + x]!]).join(''));
  }
}
