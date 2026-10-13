// family-r base.v4 (x1, from base.v3) — the blind reviewer's point: the back views stood on stilts and scattered pink
// patches read as noise. The rat is rebuilt as ONE low teardrop of the hair ramp (round rump, highest behind the
// middle, tapering to a pointed snout at the front tip) in every facing, the legs hidden under it with only the paw
// tips peeking out; pink (skin) is limited to the snout tip, one pair of ears just behind it, the paws and the tail.
// family-r base.v3 (r3) — wedge head, curved tail. base.v1 (r1) — rats (glyph r, 0.25 m) on the creature rig
// (art/lib/beast.v1.js), below the player's knee. The fur is the recoloured ramp (recolour: hair).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-r', pass: 'x1', notes: 'low teardrop rat, pointed snout, pink ears pair, paws and tail', mirror: false, recolour: 'hair' };
// the convex hull of a point cloud (monotone chain), counter-clockwise, thinned so the smooth curve stays round
const hull = pts => {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (hi.length > 1 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  const h = [...lo.slice(0, -1), ...hi.slice(0, -1)], out = [];
  for (const q of h) if (!out.length || Math.hypot(q[0] - out[out.length - 1][0], q[1] - out[out.length - 1][1]) > 1.2) out.push(q);
  return out;
};
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, c = pal.hair, L = k.P.lunge * 4, nv = k.back ? 1.4 : -1.4; // nv: the near side
    const reach = k.P.open * 0.8;
    // the tail: out of the rump, curving round to one side and tapering to a fine tip
    const ts = k.back ? 1 : -1, sw = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) * 0.8 : 0;
    k.add({ type: 'tube', name: 'tail', mat: pal.skin, shade: 'flat', band: 1, pts: [at(-5 + L, 0, 1.6), at(-7 + L, ts * 0.6, 0.8), at(-8.6 + L, ts * (2 + sw), 0.5), at(-9 + L, ts * (3.6 + sw), 0.5), at(-8.2 + L, ts * (4.8 + sw), 1.1)], w: 1.6, w1: 0.4 }, depth(-6 + L) + (k.back ? 3 : 0));
    // paw tips: only the near pair shows under the body's edge
    for (const [u, ph] of [[4, 0], [-3.6, 0.5]]) {
      const s = step(ph, 1, 0);
      const p = at(u + L + s.du, nv * 1.2, 0);
      k.add({ type: 'ellipse', name: 'paw', mat: pal.skin, shade: 'flat', band: 1, cx: p[0], cy: p[1], rx: 1.1, ry: 0.6 }, depth(u + L, nv) - 0.5);
    }
    // the body: one teardrop (round rump, tapering to the snout), its outline the hull of the volume seen from here
    const R = u => (u < -2.4 ? Math.sqrt(Math.max(0, 1 - ((u + 2.4) / 3.6) ** 2)) * 3 : 3 * Math.max(0, 1 - (u + 2.4) / (9 + reach)) ** 1.15);
    const cloud = [];
    for (let u = -6; u <= 6.6 + reach; u += 0.4) {
      const r = R(u), hc = 0.4 + Math.max(r, 0.6) * 0.95;
      for (let a = 0; a < 360; a += 30) cloud.push(at(u + L, Math.cos((a * Math.PI) / 180) * r * 1.1, hc + Math.sin((a * Math.PI) / 180) * Math.max(r, 0.6) * 0.95));
    }
    k.add({ type: 'path', name: 'body', underlay: true, mat: c, shade: 'sphere', gain: 0.8, d: k.smooth(hull(cloud)) }, depth(-1 + L));
    // the snout tip (pink nose) and the red eye just behind it, on the near side
    const hd = depth(-1 + L) + 0.1;
    const n = at(6.2 + reach + L, 0, 1.2);
    k.add({ type: 'rect', name: 'nose', x: Math.round(n[0]) - (k.back ? 0 : 1), y: Math.round(n[1]) - 1, w: 1, h: 1, mat: pal.skin, shade: 'flat', band: 0 }, hd);
    if (!k.back) { const e = at(4.2 + L, nv * 0.5, 2.2); k.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 1, h: 1, color: 'accent.1' }, hd + 0.1); }
    // one pink pair of round ears just behind the snout
    for (const v of [-1.1, 1.1]) {
      const ea = at(2.8 + L, v * 1.1, 3.8);
      const dz = hd + (v * nv > 0 ? 0.3 : 0.2);
      k.add({ type: 'circle', name: 'ear', underlay: true, mat: pal.skin, shade: 'flat', band: 1, cx: ea[0], cy: ea[1], r: 1.2 }, dz);
      if (v * nv > 0) k.add({ type: 'rect', name: 'ear-rim', x: Math.round(ea[0] - 1), y: Math.round(ea[1] - 1), w: 1, h: 1, mat: pal.skin, shade: 'flat', band: 0 }, dz + 0.01);
    }
  }, { ground: 5 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [3, 0, 4], hand: [6.5, 0, 1.6] }, { lunge: 4, ground: 5 });
