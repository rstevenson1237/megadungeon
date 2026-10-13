// family-h-cap base.v3 (r3, from base.v2): each head is redrawn as a tapered serpent head toward the heading (a
// rounded skull narrowing to the snout, a dark eye), the centre head with its jaw open on a dark red mouth.
// family-h-cap base.v2 (r2, from base.v1): each neck bends in an S-curve rising from the shoulders, and the heads
// are ~6x4 px wedge snouts with an open jaw (wider in the attack) instead of 3x2 px pins on straight rods.
// family-h-cap base.v1 (r1) — many-headed beasts (glyph H, 3 m): a hydra on the creature rig
// (art/lib/beast.v1.js) at the large frame: a squat heavy body on four short clawed legs, a thick tail, and five long
// necks rising from the shoulders in a fan, each ending in a serpent head; the heads weave in idle and walk and strike
// together in the attack. The scales are the recoloured ramp (recolour: grass).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-h-cap', pass: 'r3', notes: 'hydra: squat body, short legs, five weaving necks in a fan', mirror: false, recolour: 'grass' };
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
      // an S-curve: the neck swings to one side, then the other, between the shoulder and the head
      const pts = [];
      for (let j = 0; j <= 8; j++) {
        const t = j / 8, bx = (1 - t) * (1 - t) * root[0] + 2 * t * (1 - t) * mid[0] + t * t * hd[0], by = (1 - t) * (1 - t) * root[1] + 2 * t * (1 - t) * mid[1] + t * t * hd[1];
        pts.push([bx + 2.6 * Math.sin(t * Math.PI * 2) * (n % 2 ? 1 : -1) * (1 - 0.4 * t), by]);
      }
      k.add({ type: 'tube', name: 'neck', underlay: true, mat: c, shade: 'cyl', pts, w: 4.4, w1: 3.2 }, d);
      // the head: a tapered serpent head toward the heading, a rounded skull narrowing to the snout; the centre head's
      // jaw hangs open (wider as it strikes), showing a dark red mouth; a dark eye on the skull
      const [hx, hy] = hd, S = 1.25, open = i === 0 || k.state === 'attack', gape = i === 0 ? 1 + k.P.open * 2 : k.P.open * 2;
      if (open) {
        k.add({ type: 'path', name: 'jaw', underlay: true, mat: c, shade: 'flat', band: 1, d: k.smooth([[hx + S * 1.2, hy + S * 0.6], [hx - S * 2, hy + S * (1 + gape * 0.5)], [hx - S * 4.6, hy + S * (1.2 + gape)], [hx - S * 4.4, hy + S * (2 + gape)], [hx - S * 1.5, hy + S * (2 + gape * 0.4)], [hx + S * 1.5, hy + S * 1.8]]) }, d + 0.001);
        k.add({ type: 'poly', name: 'mouth', pts: [[hx + S * 0.5, hy + S * 0.9], [hx - S * 4.6, hy + S * 0.6], [hx - S * 4.2, hy + S * (1.1 + gape)]], color: 'accent.2' }, d + 0.0015);
      }
      k.add({ type: 'union', name: 'head', underlay: true, mat: c, shade: 'sphere', shapes: [
        { type: 'ellipse', cx: hx + S * 1.2, cy: hy - S * 0.3, rx: S * 2.6, ry: S * 2.1 },
        { type: 'path', d: k.smooth([[hx + S * 0.8, hy - S * 1.9], [hx - S * 3, hy - S * 1.1], [hx - S * 5.6, hy - S * 0.1], [hx - S * 5.6, hy + S * 0.6], [hx - S * 3, hy + S * 0.9], [hx + S * 0.8, hy + S * 1.3]]) },
      ] }, d + 0.002);
      if (!k.back) k.add({ type: 'rect', name: 'eye', x: Math.round(hx), y: Math.round(hy - S * 1.1), w: 1, h: 1, color: 'outline' }, d + 0.003);
    });
  }, { ground: 10 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [13, 0, 40], hand: [13, 0, 38] }, { lunge: 12.8, ground: 10 });
