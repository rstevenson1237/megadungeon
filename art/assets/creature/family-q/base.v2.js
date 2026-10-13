// family-q base.v2 (r2, from base.v1) — head only: in the front views (s/e) the head is raised 6 px so it stands
// clear above the chest, level with the neck of the back views, on a longer tapered muzzle with taller pricked ears;
// the back views (n/w) are unchanged.
// family-q base.v1 (r1) — wolves, boars and hounds (glyph q, 1.0 m at the head): a lean wolf on the creature rig
// (art/lib/beast.v1.js): a deep chest and narrow waist, a long muzzle, pricked ears, a brush tail, four legs in a
// diagonal trot. The whole body is the grass ramp, a cold grey (recolour: grass), so a row's colour token becomes the coat.
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-q', pass: 'r2', notes: 'lean wolf, long muzzle, pricked ears, brush tail', mirror: false, recolour: 'grass' };

// the head's lift and the muzzle's reach in the front views (s/e), where the heading points down the screen
const HEAD_UP = 6, REACH = 1;
const lay = k => {
  const L = k.P.lunge * 9, up = k.back ? 0 : HEAD_UP, r = k.back ? 0 : REACH * (1 - k.P.open); // drawn back in as the jaws open, to stay inside the frame
  return { L, up, r, chest: [5 + L, 0, 9.5], rump: [-7 + L, 0, 9], head: [10 + L, 0, 12.5 + up], snout: [14 + r + L + k.P.open * 0.5, 0, 11 + up] };
};

export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, c = pal.grass, o = lay(k), L = o.L, up = o.up, r = o.r;
    const legs = [[5, -2.2, 0], [5, 2.2, 0.5], [-7, -2.2, 0.5], [-7, 2.2, 0]];
    for (const [u, v, ph] of legs) {
      const s = step(ph, 2.5, 1.5);
      k.leg('leg', c, at(u + L, v, 7.5), at(u + L + s.du, v, s.dh), 1.4, 0, { kneeY: u > 0 ? -0.5 : 1 });
    }
    k.add({ type: 'tube', name: 'tail', underlay: true, mat: c, shade: 'cyl', pts: [at(-8 + L, 0, 9.5), at(-12 + L, 0, 8), at(-14 + L, 0, 5)], w: 3, w1: 1.4 }, depth(-12 + L));
    k.add({ type: 'capsule', name: 'body', underlay: true, mat: c, shade: 'cyl', a: at(...o.rump), b: at(...o.chest), r: 3.4, r1: 4.4 }, depth(-1 + L));
    k.add({ type: 'capsule', name: 'neck', underlay: true, mat: c, shade: 'cyl', a: at(6 + L, 0, 10.5), b: at(...o.head), r: 2.8, r1: 2.4 }, depth(8 + L));
    k.add({ type: 'ellipse', name: 'head', underlay: true, mat: c, shade: 'sphere', cx: at(...o.head)[0], cy: at(...o.head)[1], rx: 3.2, ry: 2.8 }, depth(10 + L));
    k.add({ type: 'capsule', name: 'muzzle', underlay: true, mat: c, shade: 'cyl', a: at(11 + L, 0, 12 + up), b: at(...o.snout), r: 1.9, r1: k.back ? 1.2 : 0.8 }, depth(12 + L));
    if (k.P.open > 0.5) k.add({ type: 'capsule', name: 'jaw', underlay: true, mat: pal.accent, shade: 'flat', band: 2, a: at(11 + L, 0, 10.5 + up), b: at(14 + r + L, 0, 8.5 + up), r: 0.9 }, depth(12 + L) - 0.01);
    for (const v of [-1.4, 1.4]) k.add({ type: 'poly', name: 'ear', underlay: true, mat: c, shade: 'flat', band: 1, pts: [at(9 + L, v - 0.8, 14 + up), at(8.5 + L, v, 17.5 + up * 1.15), at(9.5 + L, v + 0.8, 14 + up)] }, depth(9 + L, v) + (k.back ? 0 : 0.1));
    if (!k.back) {
      const e = at(11.6 + L, -1.3, 13.2 + up);
      k.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 1, h: 1, color: 'accent.0' }, depth(13 + L));
      const n = at(o.snout[0] + 0.8, 0, o.snout[2] + 0.4);
      k.add({ type: 'rect', name: 'nose', x: Math.round(n[0]), y: Math.round(n[1]), w: 1, h: 1, color: 'outline' }, depth(14 + L));
    }
  });
}
export const anchors = ctx => {
  const up = ctx.facing === 's' || ctx.facing === 'e' ? HEAD_UP : 0, r = up ? REACH : 0;
  return groundAnchors(ctx, { head: [10, 0, 12.5 + up], hand: [14 + r, 0, 11 + up] }, { lunge: 9 });
};
