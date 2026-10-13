// family-d-cap base.v1 (r1) — drakes and dragons (glyph D, 4 m): a dragon on the creature rig
// (art/lib/beast.v1.js) at the large frame: a heavy body on four clawed legs, great bat wings half raised, a long
// neck curving up to a horned head with a long jaw that opens in the attack, a spined back and a tail sweeping behind.
// The scales are the recoloured ramp (recolour: accent).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-d-cap', pass: 'r1', notes: 'dragon: four legs, half-raised wings, long neck, horned head, tail', mirror: false, recolour: 'accent' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, c = pal.accent, L = k.P.lunge * 10, flap = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) * 3 : (k.state === 'idle' ? k.frame : 0);
    k.add({ type: 'tube', name: 'tail', underlay: true, mat: c, shade: 'cyl', pts: [at(-10 + L, 0, 16), at(-18 + L, 3, 8), at(-24 + L, -2, 3), at(-27 + L, -7, 2)], w: 8, w1: 1.5 }, depth(-18 + L));
    for (const [u, v, ph] of [[8, -6, 0], [8, 6, 0.5], [-9, -6.5, 0.5], [-9, 6.5, 0]]) {
      const s = step(ph, 4, 2.5);
      k.leg('leg', c, at(u + L, v * 0.7, 16), at(u + L + s.du + 2, v, s.dh), 3.2, 0, { kneeY: u > 0 ? 2 : -3 });
    }
    for (const v of [-1, 1]) {
      const root = at(2 + L, v * 3, 26), elbow = at(-2 + L, v * 14, 40 + flap), tip = at(-12 + L, v * 22, 34 + flap * 1.5), trail = at(-12 + L, v * 10, 22);
      k.add({ type: 'path', name: 'wing', underlay: true, mat: pal.leather, shade: 'flat', band: 1, d: k.smooth([root, elbow, tip, at(-14 + L, v * 16, 24), trail, at(-6 + L, v * 4, 22)]) }, depth(L, v * 8) + (v > 0 ? -30 : 0));
      k.add({ type: 'tube', name: 'wing-arm', mat: c, shade: 'cyl', pts: [root, elbow, tip], w: 2.2, w1: 1 }, depth(L, v * 8) + (v > 0 ? -29.9 : 0.1));
    }
    k.add({ type: 'capsule', name: 'body', underlay: true, mat: c, shade: 'cyl', a: at(-11 + L, 0, 17), b: at(8 + L, 0, 19), r: 9, r1: 10 }, depth(L));
    for (let i = 0; i < 6; i++) k.add({ type: 'poly', name: 'spine', mat: pal.leather, shade: 'flat', band: 0, pts: [at(-12 + i * 4 + L, 0, 26), at(-11 + i * 4 + L, 0, 30), at(-10 + i * 4 + L, 0, 26)] }, depth(L) + (k.back ? 0.5 : -0.5));
    const nb = at(9 + L, 0, 22), nm = at(14 + L, 0, 34), hd = at(16 + L * 1.4, 0, 44 - k.P.open * 4);
    k.add({ type: 'tube', name: 'neck', underlay: true, mat: c, shade: 'cyl', pts: [nb, nm, hd], w: 9, w1: 6 }, depth(12 + L));
    k.add({ type: 'ellipse', name: 'head', underlay: true, mat: c, shade: 'sphere', cx: hd[0], cy: hd[1], rx: 5, ry: 4 }, depth(14 + L));
    const snout = at(23 + L * 1.4, 0, 42 - k.P.open * 4);
    k.add({ type: 'capsule', name: 'snout', underlay: true, mat: c, shade: 'cyl', a: hd, b: snout, r: 3.4, r1: 2.2 }, depth(15 + L));
    if (k.P.open > 0.5) k.add({ type: 'capsule', name: 'jaw', underlay: true, mat: c, shade: 'flat', band: 2, a: at(17 + L * 1.4, 0, 40 - k.P.open * 4), b: at(23 + L * 1.4, 0, 36 - k.P.open * 4), r: 1.6 }, depth(15 + L) - 0.1);
    for (const v of [-2, 2]) k.add({ type: 'tube', name: 'horn', underlay: true, mat: pal.cloth, shade: 'flat', band: 0, pts: [at(13 + L * 1.4, v, 47 - k.P.open * 4), at(9 + L * 1.4, v * 1.5, 52), at(6 + L * 1.4, v * 1.5, 52)], w: 2, w1: 0.6 }, depth(14 + L, v) + (k.back ? 0.2 : -0.2));
    if (!k.back) { const e = at(18 + L * 1.4, -2.4, 45 - k.P.open * 4); k.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 2, h: 1, color: 'accent.0' }, depth(20 + L)); }
  }, { ground: 10 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [16, 0, 44], hand: [23, 0, 42] }, { lunge: 14, ground: 10 });
