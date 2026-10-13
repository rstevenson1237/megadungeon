// family-l base.v1 (r1) — lizards, frogs and lizardmen (glyph l, 1.0 m): a great cave lizard on the creature rig
// (art/lib/beast.v1.js), its head reared to a metre: a heavy low body on splayed bent legs, a long tapering tail, a
// spiny crest down the back, a blunt wedge head with a hanging dewlap and a flickering tongue in the attack. The
// scales are the recoloured ramp (recolour: grass).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-l', pass: 'r1', notes: 'great lizard: low heavy body, splayed legs, crest, reared wedge head', mirror: false, recolour: 'grass' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, c = pal.grass, L = k.P.lunge * 5;
    k.add({ type: 'tube', name: 'tail', underlay: true, mat: c, shade: 'cyl', pts: [at(-5 + L, 0, 4), at(-9 + L, 1.5, 2), at(-12 + L, 0, 1), at(-13 + L, -2, 1)], w: 4, w1: 1 }, depth(-10 + L));
    for (const [u, v, ph] of [[4, -2.6, 0], [4, 2.6, 0.5], [-4, -2.8, 0.5], [-4, 2.8, 0]]) {
      const s = step(ph, 2, 1);
      k.leg('leg', c, at(u + L, v * 0.8, 4.5), at(u + L + s.du, v * 1.9, s.dh), 1.4, 0, { kneeY: -2 });
    }
    k.add({ type: 'capsule', name: 'body', underlay: true, mat: c, shade: 'cyl', a: at(-5 + L, 0, 5), b: at(4 + L, 0, 6.5), r: 3.8, r1: 4 }, depth(L));
    for (let i = 0; i < 5; i++) k.add({ type: 'poly', name: 'crest', mat: pal.accent, shade: 'flat', band: 1, pts: [at(-5 + i * 2.4 + L, 0, 8.8), at(-4 + i * 2.4 + L, 0, 11), at(-3 + i * 2.4 + L, 0, 9.4)] }, depth(L) + (k.back ? 1 : -1));
    k.add({ type: 'capsule', name: 'neck', underlay: true, mat: c, shade: 'cyl', a: at(4 + L, 0, 7), b: at(8 + L, 0, 12), r: 2.8, r1: 2.4 }, depth(6 + L));
    const hd = at(9 + L, 0, 13.5);
    k.add({ type: 'path', name: 'head', underlay: true, mat: c, shade: 'sphere', d: k.smooth([at(7 + L, 0, 16), at(10.5 + L, 0, 15), at(13 + L, 0, 13), at(12 + L, 0, 11.6), at(8 + L, 0, 11)]) }, depth(9 + L));
    k.add({ type: 'ellipse', name: 'dewlap', underlay: true, mat: pal.accent, shade: 'sphere', cx: at(9 + L, 0, 10.4)[0], cy: at(9 + L, 0, 10.4)[1], rx: 1.8, ry: 1.4 }, depth(9 + L) + 0.1);
    if (k.P.open > 0.8) k.add({ type: 'tube', name: 'tongue', mat: pal.accent, shade: 'flat', band: 1, pts: [at(13 + L, 0, 12), at(16 + L, 0, 11), at(17 + L, 0.6, 12)], w: 0.8 }, depth(13 + L));
    if (!k.back) { const e = at(10.5 + L, -1.4, 14.4); k.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 1, h: 1, color: 'accent.0' }, depth(13 + L)); }
  }, { ground: 7 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [9, 0, 13.5], hand: [13, 0, 12] }, { lunge: 5, ground: 7 });
