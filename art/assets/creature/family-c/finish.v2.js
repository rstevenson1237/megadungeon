// finish.v2 (f) on base.v4 — the one direct-pixel pass (R2), for the pixel-level part of base.v4's review ("a pair of
// 2 px dark legs on each segment on both sides, and the shadow under the whole length"; the body's angle is a form
// change and is left to the base):
// 1. a pair of 2 px dark leg ticks (the outline ink, so the silhouette's edge stays inked) on every plate, one on each side, reaching out across the body from
//    the plate's ends, with the alternate pairs stepping forward in the walk as in the base; the base's pale leg
//    pixels away from the lit (up-left) edge are turned to the leather ramp's dark middle so the comb reads dark (the feelers and tail cerci stay pale);
// 2. the round ground shadow under the middle is replaced by one that runs under the whole length: the creature's
//    silhouette dropped 2 px onto the floor (and 1 px toward the light's far side), on empty pixels only, in the
//    direction's shadow colour and alpha.
// Geometry is the base's own (the same plate layout and pose from art/lib/beast.v1.js). Colours are direction tokens.
import { pose } from '../../../lib/beast.v1.js';
export const base = 'base.v4';
export const meta = { notes: 'paired 2 px dark leg ticks on every plate, both sides; the shadow under the whole length' };

export function finish(g, ctx) {
  const { px } = ctx.lib, w = g.w, h = g.h, P = pose(ctx), back = ctx.facing === 'n' || ctx.facing === 'w', flip = ctx.facing === 'e' || ctx.facing === 'n';
  px.fix.orphans(g);
  const M = ([x, y]) => [flip ? w - 1 - Math.round(x) : Math.round(x), Math.round(y)];
  // the base's layout (base.v4): body axis A, across-axis N (up the screen), centre C, plates 2 px apart
  const A = back ? [-0.8, -0.6] : [-0.8, 0.6];
  let N = [-A[1], A[0]]; if (N[1] > 0) N = [-N[0], -N[1]];
  const C = [w / 2, back ? 25 : 26], n = 10, gap = 2, L = P.lunge * 4, bob = P.bob, wave = P.walking ? P.phase * Math.PI * 2 : 0;
  const pt = (a, b = 0, up = 0) => [C[0] + A[0] * a + N[0] * b, C[1] + A[1] * a + N[1] * b - up - bob];
  const plate = i => [9 - 1.5 - i * gap + (i < 3 ? L * (3 - i) / 3 : 0), Math.sin(i * 0.7 - wave) * 0.8];

  // 2a. lift the old round ground shadow (every partly transparent pixel)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const al = g.alpha(x, y); if (al > 0 && al < 255) g.clear(x, y); }

  // 1. the leg comb: pale leg pixels to the dark middle, then a dark 2 px tick per plate side
  const head = M(pt(9 + L, 0, 2.2)), tail = M(pt(plate(n - 1)[0] - 2, plate(n - 1)[1], 1));
  const near = ([x, y], [qx, qy], r) => Math.abs(x - qx) <= r && Math.abs(y - qy) <= r;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = px.tokenAt(g, [x, y]);
    if (t !== 'leather.0' || near([x, y], head, 5) || near([x, y], tail, 3)) continue;
    const open = (qx, qy) => { const q = px.tokenAt(g, [qx, qy]); return !q || q === 'outline'; };
    if (!open(x - 1, y) && !open(x, y - 1)) px.set(g, [x, y], 'leather.1'); // the lit edge (up-left) keeps its pale pixel
  }
  for (let i = 0; i < n; i++) {
    const [a, b] = plate(i), wd = 1.9 - i * 0.06;
    for (const sd of [-1, 1]) {
      const st = P.walking ? ((i + (sd > 0 ? 1 : 0) + Math.round(P.phase * 4)) % 2 ? 0.7 : -0.7) : 0;
      const p0 = M(pt(a - 0.3 + st * 0.5, b + sd * (wd + 1.5), 0.3)), p1 = M(pt(a - 0.8 + st, b + sd * (wd + 2.6), -0.6));
      for (const p of [p0, p1]) if (px.tokenAt(g, p) !== 'accent.0' && px.tokenAt(g, p) !== 'accent.1') px.set(g, p, 'outline');
    }
  }

  // 2b. the long shadow: the silhouette dropped onto the floor, on empty pixels
  const sh = ctx.dir.palette.shadow, hex = sh.color.replace('#', ''), rgb = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)), al = Math.round(sh.alpha * 255);
  const solid = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g.alpha(x, y) === 255) solid.push([x, y]);
  const dx = flip ? -1 : 1;
  for (const [x, y] of solid) for (const [ox, oy] of [[0, 2], [dx, 2], [0, 3]]) {
    const X = x + ox, Y = y + oy;
    if (X < 0 || Y < 0 || X >= w || Y >= h - 1 || g.alpha(X, Y) !== 0) continue;
    const k = (Y * w + X) * 4; g.d[k] = rgb[0]; g.d[k + 1] = rgb[1]; g.d[k + 2] = rgb[2]; g.d[k + 3] = al;
  }
  return g;
}
