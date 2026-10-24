// feature-wall-rune base.v3 (r3) — from base.v2 (best so far, 7), as the v2 review asked: the glyph's placement and its light,
// so the wall rune and the floor rune are one feature (Spec 06's magical rune) drawn two ways.
// 1. One glyph: othala defined once in glyph units, the same SEGS and the same carve() as feature-rune base.v3. The cap lays
//    it flat with feature-rune's exact map (same size, same pixels); the faces stand it upright.
// 2. The faces follow the face's slant: one affine map, x across the face and every row sheared down by x/2 like the
//    block's edges, so the diamond tilts with the face instead of standing upright on it; right is the mirror.
// 3. Light as feature-rune base.v3: dormant 1 px glow-ramp strokes with a lit core (light glow step on the crossing's
//    up-left side) in the ink ring (no deep-red halo). Spent: a dim stone groove in the same ink ring, one step darker on
//    the wall (stone dark, so it stays findable against the face's stone courses), darker than dormant, no white lip.
// Placement as v2: the 32 x 40 wall frame, block 24 px above the floor diamond (top diamond centre y 8), cap 4 px (top
// diamond centre y 28). Only the mark is drawn (the wall is under it). Role ramps only (R11).
export const meta = { brief: 'feature-wall-rune', pass: 'r3', notes: 'feature-rune v3 glyph and glow; face glyph sheared along the face; spent stone-dark groove', mirror: false };

export const params = {};

// othala in glyph units (x across, y down, 8 x 11), shared with feature-wall-rune
const SEGS = [[4, 0, 8, 4], [4, 0, 0, 4], [8, 4, 1, 11], [0, 4, 7, 11]];
const CROSS = [4, 8];
const S = 1.75; // flat scale (floor and cap): 14 px across, ~10 px deep
const SX = 1.25, SY = 1.25; // upright scale on a face: 10 px across, 14 px tall before the slant

function line(x0, y0, x1, y1, f) {
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
  for (;;) { f(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}

// the shared carving: glyph strokes through `map`, dormant glow with a lit core or spent cold groove, ink ring
function carve(ctx, g, map, spent, deep) {
  const { pal, outline } = ctx.dir, gl = pal.glow, st = pal.stone;
  const G = new Map();
  for (const [a, b, c, d] of SEGS) { const p = map(a, b), q = map(c, d); line(p[0], p[1], q[0], q[1], (x, y) => G.set(x + ',' + y, [x, y])); }
  const [ox, oy] = map(...CROSS);
  const fill = new Map();
  // lit core: stroke pixels on the crossing's up-left side (feature-rune's rule); where a slanted face leaves none,
  // the stroke pixels nearest the crossing
  const core = new Set();
  for (const [k, [x, y]] of G) if (Math.max(Math.abs(x - ox), Math.abs(y - oy)) <= 2 && G.has((x + 1) + ',' + y) && G.has(x + ',' + (y + 1))) core.add(k);
  if (!core.size) { let best = Infinity;
    for (const [x, y] of G.values()) best = Math.min(best, Math.hypot(x - ox, y - oy));
    for (const [k, [x, y]] of G) if (Math.hypot(x - ox, y - oy) <= best + 0.01) core.add(k); }
  for (const [k] of G) {
    if (spent) fill.set(k, deep ? st[st.length - 1] : st[Math.min(1, st.length - 1)]);
    else fill.set(k, core.has(k) ? gl[0] : gl[gl.length - 1]);
  }
  for (const k of fill.keys()) { const [x, y] = k.split(',').map(Number);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const n = (x + dx) + ',' + (y + dy);
      if (!fill.has(n) && g.inb(x + dx, y + dy)) g.set(x + dx, y + dy, outline); } }
  for (const [k, c] of fill) { const [x, y] = k.split(',').map(Number); if (g.inb(x, y)) g.set(x, y, c); }
}

export function render(ctx) {
  const [w, h] = ctx.size, g = new ctx.lib.Grid(w, h);
  const spent = String(ctx.state).endsWith('-spent'), face = String(ctx.state).replace('-spent', '');
  let map;
  if (face === 'cap') {
    const T = h - 16 - Math.max(2, Math.round((h - 16) / 6)), cx = w / 2, cy = T + 8; // the cap's top diamond centre
    map = (gx, gy) => [Math.round(cx - 0.5 + (gx - 4) * S), Math.round(cy - 0.5 + (gy - 5.5) * S / 2)];
  } else {
    // left face: x 0..15, top edge y = 8 + x/2; glyph x 3..13, top 4 px under the edge, sheared with the face
    const x0 = 3, v0 = 4;
    map = (gx, gy) => { const x = x0 + gx * SX, y = 8 + (x + 0.5) / 2 + v0 + gy * SY;
      const xl = Math.round(x); return [face === 'right' ? w - 1 - xl : xl, Math.round(y)]; };
  }
  carve(ctx, g, map, spent, true);
  return g;
}
