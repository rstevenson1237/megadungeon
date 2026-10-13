// family-q base.v4 (x1, from base.v3) — the blind reviewer's point: the head did not read (a lump from in front), the
// legs were straight segmented pipes (a comb of sticks), and n/w stood up like a sitting shape. Rebuilt on the same
// creature rig: a longer, lower body (rump, barrel, chest at one height, the back line level); exactly four legs, each
// one jointed tube (forelegs with elbow and wrist, hind legs with a forward stifle and a high backward hock) in a
// diagonal trot, the far pair a step darker; the head held low and forward of the shoulders as a long wedge with a
// dark-ink muzzle (nose and mouth line) and two large pricked ears; from behind, the head drops below the shoulders'
// line so the view is a foreshortened rear: haunches and a hanging brush tail nearest, the back running away.
// family-q base.v3 (r3) — wolf wedge head, ruff, rebuilt back views. base.v2 (r2) — head raised. base.v1 (r1) — wolves,
// boars and hounds (glyph q, 1.0 m at the head) on the creature rig (art/lib/beast.v1.js). The whole body is the grass
// ramp, a cold grey (recolour: grass), so a row's colour token becomes the coat.
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-q', pass: 'x1', notes: 'lean wolf, long low body, jointed legs, wedge muzzle, big ears, brush tail', mirror: false, recolour: 'grass' };

const BODY_H = 8.6, HEAD_H = 10.2, BACK_HEAD_H = 8.6, REACH = 1;
const lay = k => {
  const L = k.P.lunge * 9, r = REACH * (1 - k.P.open), hh = k.back ? BACK_HEAD_H : HEAD_H;
  return { L, r, hh, head: [9.6 + L, 0, hh], snout: [14 + r + L + k.P.open * 0.5, 0, hh - 1.8] };
};

export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, c = pal.grass, far = [c[1], c[2], c[2]], o = lay(k), L = o.L;
    // ---- four legs in a diagonal trot: near fore + far hind together. v < 0 is the near side from in front.
    const near = v => (k.back ? v > 0 : v < 0);
    const legs = [['fore', 4.4, -1.9, 0], ['fore', 4.4, 1.9, 0.5], ['hind', -6.4, -1.9, 0.5], ['hind', -6.4, 1.9, 0]];
    for (const [kind, u, v, ph] of legs) {
      const s = step(ph, 1.8, 1.2), mat = near(v) ? c : far, u0 = u + L;
      const pts = kind === 'fore'
        ? [at(u0, v, 7), at(u0 - 0.9 + s.du * 0.3, v, 4.4), at(u0 + 0.2 + s.du * 0.8, v, 1.6 + s.dh), at(u0 + 0.9 + s.du, v, s.dh)]
        : [at(u0, v, 7.4), at(u0 + 1.8 + s.du * 0.3, v, 4.6), at(u0 - 1.4 + s.du * 0.7, v, 2.6 + s.dh), at(u0 - 0.6 + s.du, v, s.dh)];
      const dz = depth(u0 + (kind === 'fore' ? 0.9 : -0.6), v) + (near(v) ? 0.3 : -3);
      k.add({ type: 'tube', name: 'leg', underlay: true, mat, shade: 'cyl', pts, w: kind === 'fore' ? 2.6 : 3.4, w1: 1.6 }, dz);
      if (kind === 'hind') { const th = at(u0 + 0.4, v, 7); k.add({ type: 'ellipse', name: 'haunch', underlay: true, mat, shade: 'sphere', cx: th[0], cy: th[1], rx: 2.6, ry: 2.8 }, dz + 0.01); }
      const p = pts[3];
      k.add({ type: 'ellipse', name: 'paw', mat, shade: 'flat', band: near(v) ? 1 : 2, cx: p[0] + (k.back ? 0 : -0.5), cy: p[1] - 0.4, rx: 1.4, ry: 0.8 }, dz + 0.02);
    }
    // ---- the brush tail: from the rump, hanging down and back
    k.add({ type: 'tube', name: 'tail', underlay: true, mat: c, shade: 'cyl', pts: [at(-8.6 + L, 0, BODY_H + 1.4), at(-11 + L, 0, BODY_H), at(-12.4 + L, 0, 4.6)], w: 3.2, w1: 1.6 }, depth(-10 + L) + (k.back ? 2 : -0.5));
    // ---- the long low body: one smooth hull from rump to chest, the back line level
    const hull = [];
    for (const [u, ht] of [[-8.8, BODY_H + 0.4], [-6.5, BODY_H + 2.8], [-1, BODY_H + 2.4], [4.5, BODY_H + 3], [7, BODY_H + 1.4], [6.4, BODY_H - 2.8], [2.5, BODY_H - 3.2], [-2.5, BODY_H - 2.2], [-7.4, BODY_H - 2.6]]) hull.push(at(u + L, 0, ht));
    k.add({ type: 'path', name: 'body', underlay: true, mat: c, shade: 'normal', round: 3, d: k.smooth(hull) }, depth(-1 + L));
    // the ruff over the shoulders
    const rf = at(5.6 + L, 0, BODY_H + 1.6);
    k.add({ type: 'star', name: 'ruff', underlay: true, mat: c, shade: 'sphere', cx: rf[0], cy: rf[1], r: 3.6, r2: 2.8, n: 9, rot: 10 }, k.back ? depth(4 + L) - 0.2 : depth(5.6 + L));
    // ---- the head: a long wedge, broad skull tapering to the nose, low and forward of the shoulders
    const hc = at(...o.head), sn = at(...o.snout), dx = sn[0] - hc[0], dy = sn[1] - hc[1], dl = Math.hypot(dx, dy), d = [dx / dl, dy / dl], p = [-d[1], d[0]];
    const Q = (a, b) => [hc[0] + d[0] * a + p[0] * b, hc[1] + d[1] * a + p[1] * b];
    const hd = k.back ? depth(4 + L) - 0.6 : depth(9.6 + L);
    k.add({ type: 'path', name: 'head', underlay: true, mat: c, shade: 'normal', round: 2, d: k.smooth([Q(-2.8, 0), Q(-1.6, -2.8), Q(1.6, -2.4), Q(dl - 0.8, -0.9), Q(dl + 0.4, 0), Q(dl - 0.8, 1), Q(1.6, 2.4), Q(-1.6, 2.8)]) }, hd);
    if (!k.back) {
      // the dark-ink muzzle: the snout's lower half in shadow, a black nose and a mouth line back to the cheek
      k.add({ type: 'path', name: 'muzzle', mat: c, shade: 'flat', band: 2, d: k.smooth([Q(2.6, 1.2), Q(dl - 0.6, 0.7), Q(dl, 1.1), Q(2.6, 2.3)]) }, hd + 0.1);
      const n = Q(dl - 0.2, 0);
      k.add({ type: 'rect', name: 'nose', x: Math.round(n[0]) - 1, y: Math.round(n[1]) - 1, w: 2, h: 2, color: 'outline' }, hd + 0.2);
      const m0 = Q(dl - 1.2, 1), m1 = Q(1.2, 1.4);
      k.add({ type: 'line', name: 'mouth', x0: m0[0], y0: m0[1], x1: m1[0], y1: m1[1], w: 1, color: 'outline' }, hd + 0.2);
      const e = Q(0.6, -1.2);
      k.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 1, h: 1, color: 'accent.0' }, hd + 0.2);
    }
    if (k.P.open > 0.5) k.add({ type: 'capsule', name: 'jaw', underlay: true, mat: pal.accent, shade: 'flat', band: 2, a: at(10.8 + L, 0, o.hh - 2.4), b: at(13.6 + o.r + L, 0, o.hh - 4.2), r: 0.9 }, hd - 0.01);
    // ---- two large pricked ears on the skull, ahead of the shoulders
    for (const v of [-1.3, 1.3]) {
      const b0 = at(8.8 + L, v - 0.8, o.hh + 1.6), tip = at(8.6 + L, v * 1.3, o.hh + 6.4), b1 = at(9.9 + L, v + 0.6, o.hh + 1.4);
      k.add({ type: 'poly', name: 'ear', underlay: true, mat: c, shade: 'flat', band: k.back ? 1 : 0, pts: [b0, tip, b1] }, hd + (k.back ? 0.1 : -0.1));
    }
  });
}
export const anchors = ctx => groundAnchors(ctx, { head: [9.6, 0, HEAD_H], hand: [14 + REACH, 0, HEAD_H - 1.8] }, { lunge: 9 });
