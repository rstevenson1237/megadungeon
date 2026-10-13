// family-r base.v3 (r3, from base.v1) — head and tail: the blunt capsule head becomes a pointed wedge (broad skull
// tapering to the nose) with one round ear on the crown and the eye at the front of the wedge, and the straight stick
// tail now leaves the rump and curves to the side, tapering to a fine tip. Body, paws and colours are v1's.
// family-r base.v1 (r1) — rats (glyph r, 0.25 m): a big cave rat on the creature rig (art/lib/beast.v1.js): a
// hunched pear-shaped body, a pointed snout with whiskers, round ears, beady eyes and a long bare tail curling behind.
// Below the player's knee. The fur is the recoloured ramp (recolour: hair).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-r', pass: 'r3', notes: 'hunched rat, pointed snout, round ears, long bare tail', mirror: false, recolour: 'hair' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, c = pal.hair, L = k.P.lunge * 4;
    // the tail: out of the rump, curving round to one side and tapering to a fine tip
    const sw = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) * 0.8 : 0;
    k.add({ type: 'tube', name: 'tail', mat: pal.skin, shade: 'flat', band: 1, pts: [at(-4.5 + L, 0, 2), at(-6.5 + L, -0.6, 1), at(-8 + L, -2 + sw, 0.5), at(-8.4 + L, -3.6 + sw, 0.5), at(-7.6 + L, -4.8 + sw, 1.2)], w: 1.6, w1: 0.4 }, depth(-6 + L));
    for (const [u, v, ph] of [[2, -1.6, 0], [2, 1.6, 0.5], [-2.5, -1.8, 0.5], [-2.5, 1.8, 0]]) {
      const s = step(ph, 1, 0.6);
      k.add({ type: 'capsule', name: 'paw', mat: pal.skin, shade: 'flat', band: 1, a: at(u + L, v, 1.5), b: at(u + L + s.du, v, s.dh), r: 0.7 }, depth(u + L, v));
    }
    k.add({ type: 'ellipse', name: 'body', underlay: true, mat: c, shade: 'sphere', cx: at(-1 + L, 0, 3)[0], cy: at(-1 + L, 0, 3)[1], rx: 5, ry: 3 }, depth(-1 + L));
    // the head: a pointed wedge in screen space along the snout, broad at the skull, tapering to the nose
    const hc = at(3 + L, 0, 3.6), sn = at(6.8 + L + k.P.open, 0, 2.2), dx = sn[0] - hc[0], dy = sn[1] - hc[1], dl = Math.hypot(dx, dy), d = [dx / dl, dy / dl], p = [-d[1], d[0]];
    const Q = (a, b) => [hc[0] + d[0] * a + p[0] * b, hc[1] + d[1] * a + p[1] * b];
    const hd = depth(4 + L) + (k.back ? -1 : 0);
    k.add({ type: 'path', name: 'head', underlay: true, mat: c, shade: 'flat', band: 1, d: k.smooth([Q(-1.8, 0), Q(-0.8, -2.2), Q(1.5, -1.6), Q(dl + 0.4, 0), Q(1.5, 1.6), Q(-0.8, 2.2)]) }, hd);
    k.add({ type: 'path', name: 'head-lit', mat: c, shade: 'flat', band: 0, d: k.smooth([Q(-1, -0.6), Q(0, -1.6), Q(2, -1), Q(1, -0.2)]) }, hd + 0.01);
    // one round ear on the crown (the near one; the far ear hides behind the skull)
    const ea = k.back ? at(2.4 + L, 0, 5.2) : at(2.4 + L, -0.8, 5.2);
    k.add({ type: 'circle', name: 'ear', underlay: true, mat: pal.skin, shade: 'flat', band: 1, cx: ea[0], cy: ea[1], r: 1.4 }, hd + (k.back ? 0.5 : 0.1));
    k.add({ type: 'rect', name: 'ear-rim', x: Math.round(ea[0] - 1), y: Math.round(ea[1] - 1), w: 1, h: 1, mat: pal.skin, shade: 'flat', band: 0 }, hd + (k.back ? 0.51 : 0.11));
    if (!k.back) {
      const e = Q(dl * 0.45, -0.7);
      k.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 1, h: 1, color: 'accent.1' }, hd + 0.2);
      const n = Q(dl - 0.3, 0);
      k.add({ type: 'rect', name: 'nose', x: Math.round(n[0]), y: Math.round(n[1]), w: 1, h: 1, mat: pal.skin, shade: 'flat', band: 0 }, hd + 0.2);
    }
  }, { ground: 5 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [3, 0, 4], hand: [6.5, 0, 2.4] }, { lunge: 4, ground: 5 });
