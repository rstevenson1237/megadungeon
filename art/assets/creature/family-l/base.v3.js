// family-l base.v3 (r3) — from base.v2, one change (the review's next change): the limbs and tail of the front views
// (s/e), so they match the backs. The legs splay: each upper leg runs out sideways from the flank, level, to a bent
// elbow wide of the body, and the lower leg drops from it to a foot planted wide of the body (no more straight pillars
// under the torso); and in s/e the tail is a long tapering curve swept out to the side along the ground instead of a
// stub hidden behind the body (n/w keep v2's tail, which already reads).
// family-l base.v2 (r2) — from base.v1, one change (the review's next change): the pose is rebuilt low. The body
// lies 2-3 px off the floor on elbows-out splayed legs (each upper limb runs out sideways to a raised knee, the lower
// limb drops to the foot), the head is carried low and forward instead of reared, and the tail is as long as the body,
// tapering behind on the ground. One ground-frame drawing serves both views, so n/w is the same low lizard from behind.
// base.v1 (r1) — lizards, frogs and lizardmen (glyph l, 1.0 m): a great cave lizard on the creature rig
// (art/lib/beast.v1.js): a heavy low body on splayed bent legs, a long tapering tail, a spiny crest down the back, a
// blunt wedge head with a hanging dewlap and a flickering tongue in the attack. The scales are the recoloured ramp
// (recolour: grass).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-l', pass: 'r3', notes: 'great lizard: low body on splayed elbows-out legs, long tail, low head', mirror: false, recolour: 'grass' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, c = pal.grass, L = k.P.lunge * 5;
    // the tail: as long as the body, from the hips down to a point trailing on the floor
    // (from the front the heading points at the viewer, so a straight tail hides behind the body: there it curves out
    // to the creature's left and round, along the ground, so its whole tapering length shows beside the flank)
    const tail = k.back ? [at(-4 + L, 0, 4.5), at(-8 + L, 0.8, 3), at(-12 + L, 0, 1.5), at(-15.5 + L, -1.2, 0.8)]
      : [at(-4 + L, 0, 4.5), at(-6.6 + L, -1.4, 3), at(-7.8 + L, -4, 1.4), at(-7 + L, -7, 0.5), at(-5 + L, -9.4, 0.3), at(-2.6 + L, -10.4, 0.3)];
    k.add({ type: 'tube', name: 'tail', underlay: true, mat: c, shade: 'cyl', pts: tail, w: 5, w1: 1 }, k.back ? depth(-6 + L) : depth(-5 + L, -8));
    // splayed legs: hip on the body's flank, knee out to the side and up (elbows out), foot planted wide
    for (const [u, v, ph] of [[3.6, -1, 0], [3.6, 1, 0.5], [-3.4, -1, 0.5], [-3.4, 1, 0]]) {
      const s = step(ph, 2, 1), hip = at(u + L, v * 1.8, 4.2), knee = at(u + L + s.du * 0.5 + Math.sign(u) * 0.6, v * 5.6, 4.4 + s.dh), foot = at(u + L + s.du + Math.sign(u) * 0.8, v * 6.4, s.dh);
      const d = depth(u + L, v * 6.4);
      k.add({ type: 'capsule', name: 'upper-leg', underlay: true, mat: c, shade: 'cyl', a: hip, b: knee, r: 1.7, r1: 1.3 }, d);
      k.add({ type: 'capsule', name: 'lower-leg', underlay: true, mat: c, shade: 'cyl', a: knee, b: foot, r: 1.3, r1: 1 }, d + 0.01);
      k.add({ type: 'ellipse', name: 'foot', mat: c, shade: 'flat', band: 1, cx: foot[0], cy: foot[1], rx: 1.7, ry: 0.9 }, d + 0.02);
    }
    // the body: long and low, its belly about 2-3 px off the floor
    k.add({ type: 'capsule', name: 'body', underlay: true, mat: c, shade: 'cyl', a: at(-5 + L, 0, 5), b: at(4.5 + L, 0, 5), r: 3, r1: 2.8 }, depth(L));
    for (let i = 0; i < 5; i++) k.add({ type: 'poly', name: 'crest', mat: pal.accent, shade: 'flat', band: 1, pts: [at(-5 + i * 2.2 + L, 0, 7.4), at(-4.2 + i * 2.2 + L, 0, 9), at(-3.4 + i * 2.2 + L, 0, 7.6)] }, depth(L) + (k.back ? 1 : -1));
    // the head: a blunt wedge carried low and forward on a short thick neck
    k.add({ type: 'capsule', name: 'neck', underlay: true, mat: c, shade: 'cyl', a: at(4 + L, 0, 5.2), b: at(7 + L, 0, 5.4), r: 2.3, r1: 2.1 }, depth(5 + L));
    k.add({ type: 'capsule', name: 'head', underlay: true, mat: c, shade: 'cyl', a: at(7 + L, 0, 5.8), b: at(11 + L, 0, 4.8), r: 2.1, r1: 1.3 }, depth(8 + L));
    k.add({ type: 'ellipse', name: 'dewlap', underlay: true, mat: pal.accent, shade: 'flat', band: 2, cx: at(6.5 + L, 0, 3.2)[0], cy: at(6.5 + L, 0, 3.2)[1], rx: 1.3, ry: 1 }, depth(6 + L) + 0.1);
    if (k.P.open > 0.8) k.add({ type: 'tube', name: 'tongue', mat: pal.accent, shade: 'flat', band: 1, pts: [at(11.5 + L, 0, 4.6), at(14 + L, 0, 4.2), at(15 + L, 0.6, 4.8)], w: 0.8 }, depth(13 + L));
    if (!k.back) { const e = at(9 + L, -1.2, 6.2); k.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 1, h: 1, color: 'accent.0' }, depth(13 + L)); }
  }, { ground: 7 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [9, 0, 6], hand: [11.5, 0, 4.8] }, { lunge: 5, ground: 7 });
