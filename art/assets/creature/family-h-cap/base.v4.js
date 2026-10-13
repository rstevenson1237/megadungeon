// family-h-cap base.v4 (x1, from base.v2 — the best so far) — changed (blind re-score, one body revision): three
// necks instead of five, each a separately inked S-arc fanning out from the shoulders (left, up, right) to its own
// outlined wedge head with clear gaps between them; legs are bent at a knee (hocks on the hind legs) and end in three
// claws; the body's big pale sphere dome is replaced by a flat mid tone with a thin lit upper-left rim and a shadowed
// belly.
// family-h-cap base.v2 (r2, from base.v1): each neck bends in an S-curve rising from the shoulders, and the heads
// are ~6x4 px wedge snouts with an open jaw (wider in the attack) instead of 3x2 px pins on straight rods.
// family-h-cap base.v1 (r1) — many-headed beasts (glyph H, 3 m): a hydra on the creature rig
// (art/lib/beast.v1.js) at the large frame: a squat heavy body on four short clawed legs, a thick tail, and five long
// necks rising from the shoulders in a fan, each ending in a serpent head; the heads weave in idle and walk and strike
// together in the attack. The scales are the recoloured ramp (recolour: grass).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-h-cap', pass: 'x1', notes: 'hydra: squat body, short legs, three necks fanned in clear arcs, bent clawed legs', mirror: false, recolour: 'grass' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, c = pal.grass, L = k.P.lunge * 8;
    k.add({ type: 'tube', name: 'tail', underlay: true, mat: c, shade: 'cyl', pts: [at(-9 + L, 0, 10), at(-16 + L, 3, 5), at(-21 + L, -1, 2)], w: 8, w1: 2 }, depth(-15 + L));
    // legs bent at a knee (front) or hock (hind), each ending in a foot with three claws toward the heading
    for (const [u, v, ph] of [[6, -6, 0], [6, 6, 0.5], [-7, -6, 0.5], [-7, 6, 0]]) {
      const st = step(ph, 3, 2), fu = u + L + st.du, kn = u > 0 ? 2.5 : -2.5;
      const hip = at(u + L, v * 0.7, 11), knee = at(u + L + kn + st.du * 0.5, v * 1.15, 6 + st.dh), foot = at(fu, v, st.dh + 1);
      const dl = depth(fu, v);
      k.add({ type: 'capsule', name: 'thigh', underlay: true, mat: c, shade: 'cyl', a: hip, b: knee, r: 3.2, r1: 2.4 }, dl);
      k.add({ type: 'capsule', name: 'shin', underlay: true, mat: c, shade: 'cyl', a: knee, b: foot, r: 2.2, r1: 1.7 }, dl + 0.01);
      for (const cv of [-1.6, 0, 1.6]) {
        const b0 = at(fu + 0.5, v + cv, st.dh + 0.5), tip = at(fu + 3.2, v + cv * 1.5, st.dh);
        k.add({ type: 'poly', name: 'claw', underlay: true, mat: c, shade: 'flat', band: 0, pts: [[b0[0], b0[1] - 1], tip, [b0[0], b0[1] + 1]] }, dl + 0.02);
      }
    }
    // the body: a flat mid tone, a thin lit rim on its upper left and a shadowed belly (no big pale dome)
    const bc = at(L, 0, 14), body = { type: 'ellipse', cx: bc[0], cy: bc[1], rx: 14, ry: 10 };
    k.add({ ...body, name: 'body', underlay: true, mat: c, shade: 'flat', band: 1 }, depth(L));
    k.add({ type: 'group', name: 'body-shade', clip: body, children: [
      { ...body, name: 'body-lit', mat: c, shade: 'flat', band: 0 },
      { type: 'ellipse', name: 'body-mid', cx: bc[0] + 1.5, cy: bc[1] + 1.5, rx: 14, ry: 10, mat: c, shade: 'flat', band: 1 },
      { type: 'ellipse', name: 'belly', cx: bc[0] + 3, cy: bc[1] + 10, rx: 15, ry: 6, mat: c, shade: 'flat', band: 2 },
    ] }, depth(L) + 0.001);
    // three necks fanned in screen space from the shoulders: out to the left, straight up, out to the right; each an
    // S-arc of its own with its own ink, ending in an outlined wedge head pointing ahead (screen left before the flip)
    const sh = at(5 + L, 0, 20);
    const fan = [[-5, -17, -12, -3], [0, -5, -26, -8], [5, 12, -18, 3]];
    fan.forEach(([rx0, hx0, hy0, bow], n) => {
      const w = (k.P.walking ? Math.sin(k.P.phase * Math.PI * 2 + n * 2.1) : (k.state === 'idle' ? (k.frame ? 0.6 : -0.6) * (n % 2 ? 1 : -1) : 0)) * 1.5;
      const root = [sh[0] + rx0, sh[1] + 2], hd = [sh[0] + hx0 - L * 0.6 + w, sh[1] + hy0 + k.P.open * 3 + Math.abs(w) * 0.3];
      const d = (k.back ? depth(L) - 10 : depth(L) + 10) + (k.back ? -n : n) * 0.1;
      // an S-arc: straight up out of the shoulder, then curling over into the back of the skull from above-behind
      const end = [hd[0] + 2.5, hd[1] + 0.5], c1 = [root[0] + bow * 0.4, root[1] - (root[1] - end[1]) * 0.7], c2 = [end[0] + 7, end[1] - 3];
      const pts = [];
      for (let j = 0; j <= 12; j++) { const t = j / 12, a0 = (1 - t) ** 3, a1 = 3 * t * (1 - t) ** 2, a2 = 3 * t * t * (1 - t), a3 = t ** 3; pts.push([a0 * root[0] + a1 * c1[0] + a2 * c2[0] + a3 * end[0], a0 * root[1] + a1 * c1[1] + a2 * c2[1] + a3 * end[1]]); }
      k.add({ type: 'tube', name: 'neck', underlay: true, mat: c, shade: 'cyl', pts, w: 5, w1: 3.4 }, d);
      // the wedge head: a broad skull behind tapering to a pointed snout, the lower jaw dropped open (wider as it strikes)
      const [hx, hy] = hd, gape = 0.8 + k.P.open * 2;
      if (!k.back) {
        k.add({ type: 'poly', name: 'jaw', underlay: true, mat: c, shade: 'flat', band: 2, pts: [[hx + 2, hy + 0.5], [hx - 6.5, hy + 1 + gape], [hx - 5.5, hy + 2.2 + gape], [hx + 2.5, hy + 2.5]] }, d + 0.01);
        k.add({ type: 'poly', name: 'head', underlay: true, mat: c, shade: 'flat', band: 1, pts: [[hx + 3.5, hy - 2.8], [hx - 1, hy - 3.2], [hx - 7.5, hy + 0.2], [hx - 7, hy + 1], [hx + 3.5, hy + 1.6]] }, d + 0.02);
        k.add({ type: 'poly', name: 'head-lit', mat: c, shade: 'flat', band: 0, pts: [[hx + 2.5, hy - 2.4], [hx - 1, hy - 2.6], [hx - 5.5, hy - 0.3], [hx - 1, hy - 1.4]] }, d + 0.03);
        k.add({ type: 'rect', name: 'eye', x: Math.round(hx - 1), y: Math.round(hy - 1.5), w: 1, h: 1, color: 'accent.0' }, d + 0.04);
      } else {
        // from behind: the back of the wedge, tapering away up-left, no face
        k.add({ type: 'poly', name: 'head', underlay: true, mat: c, shade: 'flat', band: 1, pts: [[hx + 3.2, hy + 1.6], [hx + 3, hy - 1.6], [hx - 2, hy - 3.6], [hx - 6.5, hy - 4.6], [hx - 4, hy - 1.2], [hx - 0.5, hy + 1.8]] }, d + 0.02);
        k.add({ type: 'poly', name: 'head-lit', mat: c, shade: 'flat', band: 0, pts: [[hx + 2, hy - 1.2], [hx - 2, hy - 3], [hx - 5.2, hy - 3.8], [hx - 1.5, hy - 1.4]] }, d + 0.03);
      }
    });
  }, { ground: 10 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [13, 0, 40], hand: [13, 0, 38] }, { lunge: 12.8, ground: 10 });
