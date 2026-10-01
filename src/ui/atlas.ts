// The glyph atlas (Spec 01, "Rendering"): 256 glyphs of 9 x 16 pixels baked
// once into a sheet, then tinted per foreground colour and copied to the grid.

import { CP437_TO_UNICODE } from './cp437.ts';
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
 * Glyphs from a 9 x 16 CP437 font such as Px437 IBM VGA 9x16 (see
 * src/ui/fonts/NOTICE.md). At 16px that font's advance is 9px and its ascent
 * 12px, so each glyph lands exactly on its cell. Its own box-drawing and block
 * glyphs fill the cell, so borders join with no special handling.
 */
export function fontMaskSource(family: string, sizePx = CELL_H): MaskSource {
  const baseline = Math.round(sizePx * 0.75);
  return {
    paint(ctx, code, x, y) {
      if (code === 0 || code === 32 || code === 255) return;
      ctx.fillStyle = '#fff';
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, CELL_W, CELL_H);
      ctx.clip();
      ctx.font = `${sizePx}px ${family}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(CP437_TO_UNICODE[code]!, x, y + baseline);
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
