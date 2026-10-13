// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), for the review's "wings are flat pale slabs with no
// finger struts and the ears/face are a muddle". The base's wing and ear geometry is recomputed here from the same
// rig pose (art/lib/beast.v1.js), so the ops follow every frame and facing:
// 1. three dark finger struts per wing (the arm bone to the wrist and on to the tip, and the two fingers fanning from
//    the wrist) drawn in the leather mid step over the pale membrane (its leather.0 pixels);
// 2. a scalloped trailing edge: between the finger tips the membrane's edge is notched 1-2 px in (outline);
// 3. bigger ears: on top of each ear (the first drawn pixel under the ear's tip) a lit point rising 2-4 px to a common tip height, ringed by outline.
// Colours are direction tokens (R11).
import { pose } from '../../../lib/beast.v1.js';
export const base = 'base.v3';
export const meta = { notes: 'dark finger struts, scalloped trailing edge, taller pointed ears' };

export function finish(g, ctx) {
  const { px } = ctx.lib, w = g.w, h = g.h, P = pose(ctx), back = ctx.facing === 'n' || ctx.facing === 'w', flip = ctx.facing === 'e' || ctx.facing === 'n';
  const F = back ? [-0.894, -0.447] : [-0.894, 0.447], Rt = back ? [0.894, -0.447] : [-0.894, -0.447], g0 = [w / 2, h - 5];
  const at = (u, v = 0, ht = 0) => [g0[0] + F[0] * u + Rt[0] * v, g0[1] + F[1] * u + Rt[1] * v - ht - P.bob * (ht > 0 ? 1 : 0)];
  const X = ([x, y]) => [flip ? w - 1 - Math.round(x) : Math.round(x), Math.round(y)];
  const tok = p => px.tokenAt(g, p);
  const L = P.lunge * 4;
  const beat = P.walking ? [1, 0.2, -0.8, 0.2][Math.round(P.phase * 4) % 4] : (ctx.state === 'attack' ? [0.6, -0.6, -0.9, 0][ctx.frame % 4] : [0.6, 0.3][ctx.frame % 2]);
  const fly = 16 + (ctx.state === 'idle' ? ctx.frame % 2 : 0), body = at(L, 0, fly);
  const ears = [-1, 1].map(v => X(at(L + 1, v * 1.8, fly + 8)));
  for (const v of [-1, 1]) {
    const root = [body[0] + v * 1.6, body[1] - 1], wr = [body[0] + v * 5.5, body[1] - 3 - 4 * beat], tip = [body[0] + v * 10, body[1] - 1 - 6 * beat];
    const dx = tip[0] - wr[0], dy = tip[1] - wr[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    let nx = -uy, ny = ux; if (ny < 0) { nx = -nx; ny = -ny; }
    const fA = [wr[0] + ux * len * 0.75 + nx * 3.4, wr[1] + uy * len * 0.75 + ny * 3.4], fB = [wr[0] + ux * len * 0.2 + nx * 4.2, wr[1] + uy * len * 0.2 + ny * 4.2];
    // struts: only over the wing's own pixels (leather), never into the empty air or the outline
    const strut = (a, b) => {
      const [x0, y0] = X(a), [x1, y1] = X(b), n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) {
        const p = [Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n)], t = tok(p);
        if (t === 'leather.0') px.set(g, p, 'leather.1');
      }
    };
    strut(wr, tip); strut(wr, fA); strut(wr, fB); // from the wrist out: the arm bone stays as drawn
    // scallops: between neighbouring tips, step in from the outside and notch the edge
    const tail = [body[0] + v * 2.6, body[1] + 3];
    for (const [p, q] of [[tip, fA], [fA, fB], [fB, tail]]) {
      const m = [(p[0] + q[0]) / 2 + nx * 3, (p[1] + q[1]) / 2 + ny * 3];
      let e = null;
      for (let s = 0; s < 6; s++) { const c = X([m[0] - nx * s, m[1] - ny * s]); if (tok(c)) { e = s; break; } }
      if (e === null) continue;
      const e0 = X([m[0] - nx * e, m[1] - ny * e]), e1 = X([m[0] - nx * (e + 1), m[1] - ny * (e + 1)]);
      if (tok(e0) !== 'outline' || !(tok(e1) || '').startsWith('leather')) continue;
      px.patch(g, e0, ['_'], {}, { anchor: 'topleft' });
      px.set(g, e1, 'outline');
    }
  }
  // the ears: a 2 px lit point on top of each ear tip, ringed by outline
  const tops = ears.map(([x, y]) => { let t = y - 1; while (t < y + 6 && !tok([x, t])) t++; return t; });
  const yt = Math.min(...tops) - 2; // both points rise to the same height
  ears.forEach(([x], i) => {
    px.set(g, [x, yt], 'outline');
    for (let y = yt + 1; y <= tops[i]; y++) {
      px.set(g, [x, y], 'leather.0');
      for (const sx of [x - 1, x + 1]) if (!tok([sx, y])) px.set(g, [sx, y], 'outline');
    }
  });
  return g;
}
