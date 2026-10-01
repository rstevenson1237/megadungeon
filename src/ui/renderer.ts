// The grid renderer (Spec 01, "Rendering"): draws a Grid onto a canvas,
// repainting only the cells that changed since the last frame.

import type { Atlas } from './atlas.ts';
import { cssColor } from './atlas.ts';
import { CELL_H, CELL_W, COLS, Grid, ROWS } from './grid.ts';

/** The slice of CanvasRenderingContext2D the renderer uses. */
export interface RenderContext {
  fillStyle: string | CanvasGradient | CanvasPattern;
  fillRect(x: number, y: number, w: number, h: number): void;
  drawImage: CanvasDrawImage['drawImage'];
}

export class Renderer {
  // What is on the canvas now. 256 is no glyph; it forces the first full paint.
  private readonly shownGlyph = new Uint16Array(COLS * ROWS).fill(256);
  private readonly shownFg = new Uint32Array(COLS * ROWS);
  private readonly shownBg = new Uint32Array(COLS * ROWS);

  constructor(
    private readonly ctx: RenderContext,
    private readonly atlas: Atlas,
  ) {}

  /** Paint every cell that differs from the last frame; returns how many were repainted. */
  render(grid: Grid): number {
    let painted = 0;
    let lastBg = -1;
    for (let i = 0; i < COLS * ROWS; i++) {
      const glyph = grid.glyph[i]!;
      const fg = grid.fg[i]!;
      const bg = grid.bg[i]!;
      if (glyph === this.shownGlyph[i] && bg === this.shownBg[i] && (fg === this.shownFg[i] || isBlank(glyph))) continue;
      this.shownGlyph[i] = glyph;
      this.shownFg[i] = fg;
      this.shownBg[i] = bg;
      const dx = (i % COLS) * CELL_W;
      const dy = Math.floor(i / COLS) * CELL_H;
      if (bg !== lastBg) {
        this.ctx.fillStyle = cssColor(bg);
        lastBg = bg;
      }
      this.ctx.fillRect(dx, dy, CELL_W, CELL_H);
      if (!isBlank(glyph) && fg !== bg) this.atlas.draw(this.ctx, glyph, fg, dx, dy);
      painted++;
    }
    return painted;
  }
}

// Space, NUL and no-break space draw nothing, so their foreground never matters.
const isBlank = (glyph: number): boolean => glyph === 0 || glyph === 32 || glyph === 255;
