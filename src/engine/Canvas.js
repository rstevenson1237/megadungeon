/**
 * Wraps a 2D canvas context with helpers for tile-based ASCII rendering.
 * The font atlas is a 16×16 grid of glyphs (CP437 layout), each TILE_W×TILE_H px.
 */
export class CanvasRenderer {
  constructor(canvasEl, fontAtlas) {
    this.ctx = canvasEl.getContext('2d');
    this.font = fontAtlas;         // ImageBitmap
    this.TILE_W = 12;
    this.TILE_H = 20;
    this.COLS = 80;
    this.ROWS = 40;
    canvasEl.width  = this.COLS * this.TILE_W;
    canvasEl.height = this.ROWS * this.TILE_H;
    this.ctx.imageSmoothingEnabled = false;
  }

  /** 
   * Draw a single ASCII glyph at grid position (col, row).
   * @param {number} col
   * @param {number} row
   * @param {number} charCode  CP437 char code
   * @param {string} fg        CSS color for foreground
   * @param {string} bg        CSS color for background (null = transparent)
   */
  drawGlyph(col, row, charCode, fg, bg = null) {
    const x = col * this.TILE_W;
    const y = row * this.TILE_H;
    const srcCol = charCode % 16;
    const srcRow = Math.floor(charCode / 16);

    if (bg) {
      this.ctx.fillStyle = bg;
      this.ctx.fillRect(x, y, this.TILE_W, this.TILE_H);
    }

    // Tint via composite operation
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.drawImage(
      this.font,
      srcCol * this.TILE_W, srcRow * this.TILE_H, this.TILE_W, this.TILE_H,
      x, y, this.TILE_W, this.TILE_H
    );
    // Apply color tint
    this.ctx.globalCompositeOperation = 'source-atop';
    this.ctx.fillStyle = fg;
    this.ctx.fillRect(x, y, this.TILE_W, this.TILE_H);
    this.ctx.restore();
  }

  /** Fill a rectangle of tiles with a background color */
  fillRect(col, row, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(col * this.TILE_W, row * this.TILE_H, w * this.TILE_W, h * this.TILE_H);
  }

  /** Draw a string left-to-right starting at (col, row) */
  drawString(col, row, str, fg, bg = null) {
    for (let i = 0; i < str.length; i++) {
      this.drawGlyph(col + i, row, str.charCodeAt(i), fg, bg);
    }
  }

  clear(color = '#000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }
}
