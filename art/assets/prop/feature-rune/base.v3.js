// feature-rune base.v3 (r3) — from base.v1 (best so far, 6), as the v1 roster and the v2 review asked: the glyph and its light.
// 1. Glyph: the ring with an X (read as a 'forbidden' sign or a trap marker) is now othala (ᛟ: a diamond whose two lower
//    sides run on as crossing legs), defined once in glyph units and shared exactly with feature-wall-rune base.v3. Laid
//    flat by one affine map (glyph x across, glyph y into the floor at 2:1), so the diamond's sides are clean floor-axis lines.
// 2. Light: dormant is active magic, so it glows: 1 px strokes on the glow ramp (bright step) with a lit core (the light
//    glow step on the crossing's up-left side, where the light comes from), ringed by the direction's ink; no heavy stone lip, so it sits in the floor.
//    Spent: the same cut, cold: a dim stone groove (stone mid step) in the same ink ring, far darker than dormant but
//    still findable on the floor.
// Placement as v1: flat on the cell's bottom diamond, centre (16, h-8), floor undrawn. Role ramps only (R11).
export const meta = { brief: 'feature-rune', pass: 'r3', notes: 'othala (shared with feature-wall-rune) laid flat; dormant glow ramp with lit core; spent dim stone groove', mirror: false };

// othala in glyph units (x across, y down, 8 x 11), shared with feature-wall-rune
const SEGS = [[4, 0, 8, 4], [4, 0, 0, 4], [8, 4, 1, 11], [0, 4, 7, 11]];
const CROSS = [4, 8];
const S = 1.75; // floor scale: 14 px across, ~10 px deep

function line(x0, y0, x1, y1, f) {
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
  for (;;) { f(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}

// the shared carving: glyph strokes through `map`, dormant glow with a lit core or spent cold groove, ink ring
function carve(ctx, g, map, spent) {
  const { pal, outline } = ctx.dir, gl = pal.glow, st = pal.stone;
  const G = new Map();
  for (const [a, b, c, d] of SEGS) { const p = map(a, b), q = map(c, d); line(p[0], p[1], q[0], q[1], (x, y) => G.set(x + ',' + y, [x, y])); }
  const [ox, oy] = map(...CROSS);
  const fill = new Map();
  for (const [k, [x, y]] of G) {
    if (spent) fill.set(k, st[Math.min(1, st.length - 1)]);
    else fill.set(k, Math.max(Math.abs(x - ox), Math.abs(y - oy)) <= 2 && G.has((x + 1) + ',' + y) && G.has(x + ',' + (y + 1)) ? gl[0] : gl[gl.length - 1]);
  }
  for (const k of fill.keys()) { const [x, y] = k.split(',').map(Number);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const n = (x + dx) + ',' + (y + dy);
      if (!fill.has(n) && g.inb(x + dx, y + dy)) g.set(x + dx, y + dy, outline); } }
  for (const [k, c] of fill) { const [x, y] = k.split(',').map(Number); if (g.inb(x, y)) g.set(x, y, c); }
}

export function render(ctx) {
  const [w, h] = ctx.size, g = new ctx.lib.Grid(w, h);
  const cx = w / 2, cy = h - 8;
  const map = (gx, gy) => [Math.round(cx - 0.5 + (gx - 4) * S), Math.round(cy - 0.5 + (gy - 5.5) * S / 2)];
  carve(ctx, g, map, ctx.state === 'spent');
  return g;
}
