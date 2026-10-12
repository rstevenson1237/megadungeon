// family-h-cap base.v1 (r1) — many-headed beasts (glyph H, 3 m): a hydra on the creature rig
// (art/lib/beast.v1.js) at the large frame: a squat heavy body on four short clawed legs, a thick tail, and five long
// necks rising from the shoulders in a fan, each ending in a serpent head; the heads weave in idle and walk and strike
// together in the attack. The scales are the recoloured ramp (recolour: grass).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-h-cap', pass: 'r1', notes: 'hydra: squat body, short legs, five weaving necks in a fan', mirror: false, recolour: 'grass' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, c = pal.grass, L = k.P.lunge * 8;
    k.add({ type: 'tube', name: 'tail', underlay: true, mat: c, shade: 'cyl', pts: [at(-9 + L, 0, 10), at(-16 + L, 3, 5), at(-21 + L, -1, 2)], w: 8, w1: 2 }, depth(-15 + L));
    for (const [u, v, ph] of [[6, -6, 0], [6, 6, 0.5], [-7, -6, 0.5], [-7, 6, 0]]) {
      const s = step(ph, 3, 2);
      k.leg('leg', c, at(u + L, v * 0.7, 10), at(u + L + s.du, v, s.dh), 3, 0, { kneeY: 1 });
    }
    k.add({ type: 'ellipse', name: 'body', underlay: true, mat: c, shade: 'sphere', cx: at(L, 0, 14)[0], cy: at(L, 0, 14)[1], rx: 14, ry: 10 }, depth(L));
    const heads = [-2, -1, 0, 1, 2];
    heads.forEach((i, n) => {
      const w = (k.P.walking ? Math.sin(k.P.phase * Math.PI * 2 + n * 1.3) : (k.state === 'idle' ? (k.frame ? 0.6 : -0.6) * (n % 2 ? 1 : -1) : 0)) * 2;
      const v = i * 5, root = at(6 + L, v * 0.6, 18), mid = at(9 + L + w, v * 1.2, 30 - Math.abs(i) * 3), hd = at(13 + L * 1.6 + w, v * 1.5, 40 - Math.abs(i) * 5 - k.P.open * 6);
      const d = depth(10 + L, v) + (k.back ? -10 : 10) + n * 0.01 * (k.back ? -1 : 1);
      k.add({ type: 'tube', name: 'neck', underlay: true, mat: c, shade: 'cyl', pts: [root, mid, hd], w: 4.4, w1: 3 }, d);
      k.add({ type: 'ellipse', name: 'head', underlay: true, mat: c, shade: 'sphere', cx: hd[0] - 1, cy: hd[1], rx: 3.4, ry: 2.6 }, d + 0.001);
      if (!k.back) {
        k.add({ type: 'rect', name: 'eye', x: Math.round(hd[0] - 2), y: Math.round(hd[1] - 1), w: 1, h: 1, color: 'accent.0' }, d + 0.002);
        if (k.P.open > 0.5) k.add({ type: 'rect', name: 'mouth', x: Math.round(hd[0] - 4), y: Math.round(hd[1] + 1), w: 3, h: 1, color: 'outline' }, d + 0.002);
      }
    });
  }, { ground: 10 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [13, 0, 40], hand: [13, 0, 38] }, { lunge: 12.8, ground: 10 });
