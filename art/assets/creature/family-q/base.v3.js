// family-q base.v3 (r3, from base.v2) — head and back views: the boxy horse-like head (round skull, capsule muzzle,
// tall ears) is redrawn as a tapered wolf wedge (broad skull narrowing to a dark nose tip) with short pointed ears and
// a shaggy ruff round the neck; and n/w are rebuilt as the same body seen from behind: the head keeps the same lift
// in every facing (no longer thrown up), sits behind the ruff, and the body is shaded with the same light so the back
// view no longer shows a pale chest.
// family-q base.v2 (r2, from base.v1) — head only: in the front views (s/e) the head is raised 6 px so it stands
// clear above the chest, level with the neck of the back views, on a longer tapered muzzle with taller pricked ears;
// the back views (n/w) are unchanged.
// family-q base.v1 (r1) — wolves, boars and hounds (glyph q, 1.0 m at the head): a lean wolf on the creature rig
// (art/lib/beast.v1.js): a deep chest and narrow waist, a long muzzle, pricked ears, a brush tail, four legs in a
// diagonal trot. The whole body is the grass ramp, a cold grey (recolour: grass), so a row's colour token becomes the coat.
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-q', pass: 'r3', notes: 'lean wolf, wedge snout, short ears, ruff, brush tail', mirror: false, recolour: 'grass' };

// one body in every facing (seen from in front or behind): the head's height and reach
const HEAD_H = 13.5, REACH = 1;
const lay = k => {
  const L = k.P.lunge * 9, r = REACH * (1 - k.P.open); // drawn back in as the jaws open, to stay inside the frame
  return { L, r, head: [8.5 + L, 0, HEAD_H], snout: [12.5 + r + L + k.P.open * 0.5, 0, HEAD_H - 1.8] };
};

export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, c = pal.grass, o = lay(k), L = o.L;
    const legs = [[4, -2.2, 0], [4, 2.2, 0.5], [-5.5, -2.2, 0.5], [-5.5, 2.2, 0]];
    for (const [u, v, ph] of legs) {
      const s = step(ph, 2.5, 1.5);
      k.leg('leg', c, at(u + L, v, 7.5), at(u + L + s.du, v, s.dh), 1.4, 0, { kneeY: u > 0 ? -0.5 : 1 });
    }
    k.add({ type: 'tube', name: 'tail', underlay: true, mat: c, shade: 'cyl', pts: [at(-7 + L, 0, 10), at(-10 + L, 0, 8.5), at(-11.5 + L, 0, 5)], w: 3, w1: 1.2 }, depth(-9 + L));
    // the body as round volumes (rump, barrel, deep chest), sorted by depth: the chest is nearest from in front,
    // the rump from behind
    for (const [u, ht, rx, ry] of [[-5.5, 9.5, 3.6, 3.4], [-1, 9.2, 3.4, 3.1], [3.5, 9.4, 4, 3.8]]) {
      const pt = at(u + L, 0, ht);
      k.add({ type: 'ellipse', name: 'body', mat: c, shade: 'sphere', gain: 0.8, cx: pt[0], cy: pt[1], rx, ry }, depth(u + L));
    }
    // the ruff: a shaggy collar of fur round the neck and shoulders
    const rf = at(6.5 + L, 0, 11.5);
    k.add({ type: 'star', name: 'ruff', underlay: true, mat: c, shade: 'sphere', cx: rf[0], cy: rf[1], r: 4, r2: 3.1, n: 9, rot: 10 }, k.back ? depth(3.5 + L) + 0.5 : depth(6.5 + L));
    // the head: a wedge, broad at the skull and tapering to the nose, built in screen space along the muzzle
    const hc = at(...o.head), sn = at(...o.snout), dx = sn[0] - hc[0], dy = sn[1] - hc[1], dl = Math.hypot(dx, dy), d = [dx / dl, dy / dl], p = [-d[1], d[0]];
    const P = (a, b) => [hc[0] + d[0] * a + p[0] * b, hc[1] + d[1] * a + p[1] * b];
    const hd = k.back ? depth(3.5 + L) + 0.6 : depth(8.5 + L); // from behind the back of the skull rises out of the ruff
    if (k.back) k.add({ type: 'ellipse', name: 'head', underlay: true, mat: c, shade: 'sphere', gain: 0.8, cx: hc[0] - 0.5, cy: hc[1], rx: 3, ry: 2.7 }, hd + 0.05); // the back of the skull
    k.add({ type: 'path', name: 'head', underlay: true, mat: c, shade: 'normal', round: 2, d: k.smooth([P(-2.8, 0), P(-1.5, -2.7), P(1.5, -2.4), P(dl - 1, -0.9), P(dl + 0.3, 0), P(dl - 1, 0.9), P(1.5, 2.3), P(-1.5, 2.7)]) }, hd);
    if (k.P.open > 0.5) k.add({ type: 'capsule', name: 'jaw', underlay: true, mat: pal.accent, shade: 'flat', band: 2, a: at(10 + L, 0, HEAD_H - 2.5), b: at(12.5 + o.r + L, 0, HEAD_H - 4.5), r: 0.9 }, hd - 0.01);
    // short pointed ears set back on the skull
    if (k.back) {
      // from behind: two pointed ears standing on the crown of the skull, drawn in screen space round its centre
      const x0 = hc[0] - 0.5, y0 = hc[1] - 1.8;
      for (const s of [-1, 1]) k.add({ type: 'poly', name: 'ear', underlay: true, mat: c, shade: 'flat', band: s < 0 ? 0 : 1, pts: [[x0 + s * 0.4, y0], [x0 + s * 1.6, y0 - 3.6], [x0 + s * 2.9, y0 + 0.6]] }, hd + 0.2);
    } else {
      for (const v of [-1.4, 1.4]) k.add({ type: 'poly', name: 'ear', underlay: true, mat: c, shade: 'flat', band: 0, pts: [at(7.8 + L, v - 0.9, HEAD_H + 1.6), at(7.6 + L, v, HEAD_H + 4.2), at(8.6 + L, v + 0.7, HEAD_H + 1.6)] }, hd - 0.1);
    }
    if (!k.back) {
      const e = P(1.2, -1.1);
      k.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 1, h: 1, color: 'accent.0' }, hd + 0.2);
      const n = P(dl - 0.6, 0);
      k.add({ type: 'rect', name: 'nose', x: Math.round(n[0]) - 1, y: Math.round(n[1]) - 1, w: 2, h: 2, color: 'outline' }, hd + 0.2);
    }
  });
}
export const anchors = ctx => groundAnchors(ctx, { head: [8.5, 0, HEAD_H], hand: [12.5 + REACH, 0, HEAD_H - 1.8] }, { lunge: 9 });
