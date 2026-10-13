// family-d-cap base.v2 (r2, from base.v1) — ONE change: the body plan. v1 read as a winged deer on stilts; the body is
// now a low heavy barrel close to the floor on short legs (~1/3 of the body's height) that bend at the knee and splay
// out to the sides, each ending in a clawed foot, and the whole rig is drawn smaller about its centre (body, neck,
// wings, tail) so nothing touches the 64 x 80 frame's edge in any facing.
// v1: drakes and dragons (glyph D, 4 m): a dragon on the creature rig (art/lib/beast.v1.js) at the large frame: a
// heavy body on four clawed legs, great bat wings half raised, a long neck curving up to a horned head with a long jaw
// that opens in the attack, a spined back and a tail sweeping behind. The scales are the recoloured ramp (recolour:
// accent).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-d-cap', pass: 'r2', notes: 'low heavy barrel body on short bent splayed clawed legs, rig pulled inside the frame', mirror: false, recolour: 'accent' };
const GROUND = 14;
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, c = pal.accent, L = k.P.lunge * 10, op = k.P.open * 4, flap = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) * 3 : (k.state === 'idle' ? k.frame : 0);
    k.add({ type: 'tube', name: 'tail', underlay: true, mat: c, shade: 'cyl', pts: [at(-8 + L, 0, 12), at(-14 + L, 3, 6), at(-19 + L, -1, 3), at(-21 + L, -5, 2)], w: 7, w1: 1.5 }, depth(-14 + L));
    // short heavy legs: hip under the barrel, knee bent up and out, the clawed foot splayed wide
    for (const [u, v, ph] of [[6, -4, 0], [6, 4, 0.5], [-6, -4.5, 0.5], [-6, 4.5, 0]]) {
      const s = step(ph, 1, 0.6), fu = u + L + s.du + 1, fv = v * 1.8;
      const hip = at(u + L, v, 7), knee = at(u + L + s.du * 0.5, v * 1.7, 5 + s.dh), foot = at(fu, fv, s.dh), d0 = depth(fu, fv);
      k.add({ type: 'capsule', name: 'leg', underlay: true, mat: c, shade: 'cyl', a: hip, b: knee, r: 3.4, r1: 3 }, d0);
      k.add({ type: 'capsule', name: 'leg', underlay: true, mat: c, shade: 'cyl', a: knee, b: foot, r: 2.8, r1: 2.2 }, d0 + 0.01);
      for (const d of [-1, 0, 1]) { const p = at(fu + 2.4, fv + d * 1.4, s.dh); k.add({ type: 'rect', name: 'claw', x: Math.round(p[0]), y: Math.round(p[1]), w: 1, h: 1, color: 'hair.0' }, d0 + 0.02); }
    }
    for (const v of [-1, 1]) {
      const root = at(2 + L, v * 3, 18), elbow = at(-1 + L, v * 12, 30 + flap), tip = at(-10 + L, v * 17, 26 + flap * 1.5), trail = at(-9 + L, v * 7, 16);
      k.add({ type: 'path', name: 'wing', underlay: true, mat: pal.leather, shade: 'flat', band: 1, d: k.smooth([root, elbow, tip, at(-11 + L, v * 12, 18), trail, at(-4 + L, v * 3, 16)]) }, depth(L, v * 8) + (v > 0 ? -30 : 0));
      k.add({ type: 'tube', name: 'wing-arm', mat: c, shade: 'cyl', pts: [root, elbow, tip], w: 2.2, w1: 1 }, depth(L, v * 8) + (v > 0 ? -29.9 : 0.1));
    }
    // the low heavy barrel
    k.add({ type: 'capsule', name: 'body', underlay: true, mat: c, shade: 'cyl', a: at(-8 + L, 0, 10.5), b: at(6 + L, 0, 11.5), r: 9, r1: 9.5 }, depth(L));
    for (let i = 0; i < 6; i++) k.add({ type: 'poly', name: 'spine', mat: pal.leather, shade: 'flat', band: 0, pts: [at(-9 + i * 3.4 + L, 0, 20), at(-8 + i * 3.4 + L, 0, 23.5), at(-7 + i * 3.4 + L, 0, 20)] }, depth(L) + (k.back ? 0.5 : -0.5));
    const nb = at(7 + L, 0, 15), nm = at(11 + L, 0, 24), hd = at(13 + L * 1.4, 0, 31 - op);
    k.add({ type: 'tube', name: 'neck', underlay: true, mat: c, shade: 'cyl', pts: [nb, nm, hd], w: 8, w1: 6 }, depth(10 + L));
    k.add({ type: 'ellipse', name: 'head', underlay: true, mat: c, shade: 'sphere', cx: hd[0], cy: hd[1], rx: 5, ry: 4 }, depth(12 + L));
    const snout = at(19 + L * 1.4, 0, 29 - op);
    k.add({ type: 'capsule', name: 'snout', underlay: true, mat: c, shade: 'cyl', a: hd, b: snout, r: 3.4, r1: 2.2 }, depth(13 + L));
    if (k.P.open > 0.5) k.add({ type: 'capsule', name: 'jaw', underlay: true, mat: c, shade: 'flat', band: 2, a: at(14 + L * 1.4, 0, 27 - op), b: at(19 + L * 1.4, 0, 23 - op), r: 1.6 }, depth(13 + L) - 0.1);
    for (const v of [-2, 2]) k.add({ type: 'tube', name: 'horn', underlay: true, mat: pal.cloth, shade: 'flat', band: 0, pts: [at(10.5 + L * 1.4, v, 34 - op), at(7 + L * 1.4, v * 1.5, 38), at(4.5 + L * 1.4, v * 1.5, 38)], w: 2, w1: 0.6 }, depth(12 + L, v) + (k.back ? 0.2 : -0.2));
    if (!k.back) { const e = at(15 + L * 1.4, -2.4, 32 - op); k.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 2, h: 1, color: 'accent.0' }, depth(18 + L)); }
  }, { ground: GROUND, shadow: { cx: 32, cy: 80 - GROUND, rx: 16 } });
}
export const anchors = ctx => groundAnchors(ctx, { head: [13, 0, 31], hand: [19, 0, 29] }, { lunge: 14, ground: GROUND });
