// feature-wall-rune base.v1 (r1) — adapted from the template to the brief: a rune carved in a wall, a wall mark in the
// 32 x 40 wall frame (block 24 px above the floor diamond, T = 0; cap 4 px, T = 20; see terrain-wall). States left (lower-left
// face), right (lower-right face, the mirror), cap (flat on the cap's top diamond), and each with -spent. Dormant: the
// carved strokes glow (glow light core strokes, glow orange outer strokes) inside a 1 px outline ring cut into the stone; spent:
// the same cut, cold (strokes in stone dark, same ring, no light). Only the mark is drawn (the wall is under it). Role ramps only.
export const meta = { brief: 'feature-wall-rune', pass: 'r1', notes: 'glowing carved rune; cold when spent; left/right/cap', mirror: false };

export const params = {};

// the rune, 7 x 9: a forked stem over a barbed foot ('#' stroke; 'o' bright core)
const GLYPH = [
  '#..o..#',
  '.#.o.#.',
  '..#o#..',
  '...o...',
  '.#.o.#.',
  '..#o#..',
  '...o...',
  '...o...',
  '..###..',
];
const GW = 7, GH = GLYPH.length;

export function render(ctx) {
  const { pal, outline } = ctx.dir, [w, h] = ctx.size, { Grid } = ctx.lib;
  const spent = String(ctx.state).endsWith('-spent');
  const face = String(ctx.state).replace('-spent', '');
  const g = new Grid(w, h), half = w / 2;
  const core = pal.glow[0], body = pal.glow[Math.min(1, pal.glow.length - 1)], cold = pal.stone[pal.stone.length - 1];
  const at = (i, j) => (i < 0 || j < 0 || i >= GW || j >= GH ? '.' : GLYPH[j][i]);
  const colour = ch => (spent ? cold : ch === 'o' ? core : body);

  // pixel -> glyph cell, per placement; `put(x, y, c)` writes it
  const cellsOf = [];
  if (face === 'cap') {
    const T = h - 16 - Math.max(2, Math.round((h - 16) / 6)), cy = T + 8;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const sx = x + 0.5 - half, sy = y + 0.5 - cy;
      const a = sx / 2 + sy, b = sy - sx / 2; // iso axes in px: 1 glyph cell is 1 px along each
      cellsOf.push([x, y, Math.floor(a + GW / 2), Math.floor(b + GH / 2)]);
    }
  } else {
    const x0 = 5, v0 = 10; // left face: glyph spans x 5..11, v 10..18 below the block's top edge (y = 8 + x/2)
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const xl = x0 + i, yl = 8 + Math.floor((xl + 0.5) / 2) + v0 + j;
      cellsOf.push([face === 'right' ? w - 1 - xl : xl, yl, i, j]);
    }
  }
  // ring first: any pixel 4-adjacent to a stroke pixel and not itself a stroke
  const stroke = new Map();
  for (const [x, y, i, j] of cellsOf) if (at(i, j) !== '.') stroke.set(`${x},${y}`, at(i, j));
  {
    for (const k of stroke.keys()) {
      const [x, y] = k.split(',').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = `${x + dx},${y + dy}`;
        if (!stroke.has(n) && g.inb(x + dx, y + dy)) g.set(x + dx, y + dy, outline);
      }
    }
  }
  for (const [k, ch] of stroke) { const [x, y] = k.split(',').map(Number); g.set(x, y, colour(ch)); }
  return g;
}
