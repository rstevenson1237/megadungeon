// family-r base.v2 (r2, from base.v1) — body only: v1's sphere-shaded ellipse (mostly the near-black hair step) is
// one solid pear of the hair ramp in three flat bands, a light cap top-left over the mid tone with the dark step only
// under the belly, and the head joins it without its own ink ring, so fewer interior outline pixels.
// family-r base.v1 (r1) — rats (glyph r, 0.25 m): a big cave rat on the creature rig (art/lib/beast.v1.js): a
// hunched pear-shaped body, a pointed snout with whiskers, round ears, beady eyes and a long bare tail curling behind.
// Below the player's knee. The fur is the recoloured ramp (recolour: hair).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-r', pass: 'r2', notes: 'hunched rat, pointed snout, round ears, long bare tail', mirror: false, recolour: 'hair' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, c = pal.hair, L = k.P.lunge * 4;
    k.add({ type: 'tube', name: 'tail', mat: pal.skin, shade: 'cyl', pts: [at(-4 + L, 0, 1.5), at(-8 + L, 1, 0.5), at(-10 + L, -1, 0.5), at(-11 + L, -2.5, 1)], w: 1.4, w1: 0.6 }, depth(-9 + L));
    for (const [u, v, ph] of [[2, -1.6, 0], [2, 1.6, 0.5], [-2.5, -1.8, 0.5], [-2.5, 1.8, 0]]) {
      const s = step(ph, 1, 0.6);
      k.add({ type: 'capsule', name: 'paw', mat: pal.skin, shade: 'flat', band: 1, a: at(u + L, v, 1.5), b: at(u + L + s.du, v, s.dh), r: 0.7 }, depth(u + L, v));
    }
    // the pear: a broad rump tapering into the head, one ink ring round the whole
    const rump = at(-1.5 + L, 0, 3), fore = at(2 + L, 0, 2.8), snout = at(6 + L + k.P.open, 0, 2.4);
    const pear = { type: 'union', shapes: [
      { type: 'ellipse', cx: rump[0], cy: rump[1], rx: 4.6, ry: 3.2 },
      { type: 'ellipse', cx: fore[0], cy: fore[1], rx: 3, ry: 2.4 },
      { type: 'capsule', a: at(2.5 + L, 0, 3.2), b: snout, r: 2, r1: 0.9 },
    ] };
    k.add({ type: 'group', name: 'body', children: [
      { ...pear, name: 'body', underlay: true, mat: c, shade: 'flat', band: 1 },
      // the dark step under the belly, and the lit cap top-left
      { type: 'ellipse', name: 'belly', cx: rump[0] + 0.5, cy: rump[1] + 2.6, rx: 5, ry: 1.4, mat: c, shade: 'flat', band: 2 },
      { type: 'ellipse', name: 'body-light', cx: rump[0] - 1.2, cy: rump[1] - 1.6, rx: 3, ry: 1.5, mat: c, shade: 'flat', band: 0 },
    ], clip: pear }, depth(-1 + L));
    for (const v of [-1.3, 1.3]) k.add({ type: 'circle', name: 'ear', underlay: true, mat: pal.skin, shade: 'flat', band: 1, cx: at(2.6 + L, v, 5.4)[0], cy: at(2.6 + L, v, 5.4)[1], r: 1.2 }, depth(2.6 + L, v) + (k.back ? 0 : 1));
    if (!k.back) {
      const e = at(4.2 + L, -1, 3.8);
      k.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 1, h: 1, color: 'accent.1' }, depth(8 + L));
      const n = at(6.6 + L + k.P.open, 0, 2.4);
      k.add({ type: 'rect', name: 'nose', x: Math.round(n[0]), y: Math.round(n[1]), w: 1, h: 1, mat: pal.skin, shade: 'flat', band: 0 }, depth(8 + L));
    }
  }, { ground: 5 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [3, 0, 4], hand: [6.5, 0, 2.4] }, { lunge: 4, ground: 5 });
