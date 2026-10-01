// The glyph atlas (Spec 01, "Rendering"): 256 glyphs of 9 x 16 pixels baked
// once into a sheet, then tinted per foreground colour and copied to the grid.

import { CP437_TO_UNICODE } from './cp437.ts';
import { glyphRects } from './boxdraw.ts';
import { CELL_H, CELL_W } from './grid.ts';

const SHEET_COLS = 16;
const SHEET_W = SHEET_COLS * CELL_W; // 144
const SHEET_H = SHEET_COLS * CELL_H; // 256
const MAX_TINTS = 128;

type Canvas = HTMLCanvasElement | OffscreenCanvas;
type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** What the renderer needs from an atlas. */
export interface Atlas {
  /** Draw glyph `code` in colour `fg` (24-bit) with its top-left at (dx, dy). */
  draw(ctx: { drawImage: CanvasDrawImage['drawImage'] }, code: number, fg: number, dx: number, dy: number): void;
}

/** Paints one glyph in white at (x, y); the atlas does the rest. */
export interface MaskSource {
  paint(ctx: Ctx, code: number, x: number, y: number): void;
}

/**
 * Glyphs from a font family, with shades, blocks and box lines drawn
 * procedurally so borders join. With the approved Px437 IBM VGA 9x16 font
 * loaded (see README, "Font"), pass its family name; until then any monospace
 * family works as a stand-in.
 */
export function fontMaskSource(family: string, sizePx = CELL_H): MaskSource {
  return {
    paint(ctx, code, x, y) {
      ctx.fillStyle = '#fff';
      const rects = glyphRects(code);
      if (rects) {
        for (const [rx, ry, rw, rh] of rects) ctx.fillRect(x + rx, y + ry, rw, rh);
        return;
      }
      if (code === 0 || code === 32 || code === 255) return;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, CELL_W, CELL_H);
      ctx.clip();
      ctx.font = `${sizePx}px ${family}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(CP437_TO_UNICODE[code]!, x + CELL_W / 2, y + CELL_H * 0.78);
      ctx.restore();
    },
  };
}

export type CanvasFactory = (width: number, height: number) => Canvas;

function context(canvas: Canvas): Ctx {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2D canvas is not available');
  return ctx as Ctx;
}

export class CanvasAtlas implements Atlas {
  private readonly mask: Canvas;
  private readonly tints = new Map<number, Canvas>();

  constructor(
    private readonly makeCanvas: CanvasFactory,
    source: MaskSource,
  ) {
    this.mask = makeCanvas(SHEET_W, SHEET_H);
    const ctx = context(this.mask);
    for (let code = 0; code < 256; code++) {
      source.paint(ctx, code, (code % SHEET_COLS) * CELL_W, Math.floor(code / SHEET_COLS) * CELL_H);
    }
    // Crisp pixels only: no partial transparency left by font anti-aliasing.
    const img = ctx.getImageData(0, 0, SHEET_W, SHEET_H);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i]! >= 128 ? 255 : 0;
    ctx.putImageData(img, 0, 0);
  }

  private tinted(fg: number): Canvas {
    let sheet = this.tints.get(fg);
    if (!sheet) {
      if (this.tints.size >= MAX_TINTS) this.tints.delete(this.tints.keys().next().value!);
      sheet = this.makeCanvas(SHEET_W, SHEET_H);
      const ctx = context(sheet);
      ctx.drawImage(this.mask, 0, 0);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = cssColor(fg);
      ctx.fillRect(0, 0, SHEET_W, SHEET_H);
      this.tints.set(fg, sheet);
    }
    return sheet;
  }

  draw(ctx: { drawImage: CanvasDrawImage['drawImage'] }, code: number, fg: number, dx: number, dy: number): void {
    ctx.drawImage(
      this.tinted(fg),
      (code % SHEET_COLS) * CELL_W,
      Math.floor(code / SHEET_COLS) * CELL_H,
      CELL_W,
      CELL_H,
      dx,
      dy,
      CELL_W,
      CELL_H,
    );
  }
}

/** 24-bit colour as a CSS string. */
export function cssColor(rgb: number): string {
  return `#${(rgb & 0xffffff).toString(16).padStart(6, '0')}`;
}
