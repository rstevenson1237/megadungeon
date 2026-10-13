// family-d-cap base.v4 (x1, from base.v3) — the blind reviewer's fix, as one revision of the front (s/e) body: v3's
// s/e legs read as a row of 5-6 pale-striped pillars, the head was tiny and blocky, the horns read as pale-blue
// antlers, the wings were flat planes and the attack barely moved. Now: four legs only, each a thick curved thigh
// bent at the knee/hock over a short dark shin and a clawed foot (no splay, no pale cyl stripes); a larger
// wedge head with a hinged lower jaw that opens in the attack while the head lunges ahead of the body; horns swept back
// on the hair (bone) ramp; each wing membrane carries three dark finger struts under a lit leading edge; and in s/e the
// tail curves out round the near hind leg so it shows. The n/w back views keep v3's legs and tail.
// base.v3 (r3, from base.v2) — short sprawled bent legs, feet splayed out with 1px claws, body dropped to the floor.
// base.v2 (r2, from base.v1) — low heavy barrel body on short bent splayed clawed legs, rig pulled inside the frame.
// v1: drakes and dragons (glyph D, 4 m): a dragon on the creature rig (art/lib/beast.v1.js) at the large frame. The
// scales are the recoloured ramp (recolour: accent).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-d-cap', pass: 'x1', notes: 'four legs with haunches, wedge head with opening jaw and head lunge, swept bone horns, strutted wings, visible tail curve in s/e', mirror: false, recolour: 'accent' };
const GROUND = 14;
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, c = pal.accent, L = k.P.lunge * 10, HL = k.P.lunge * 22, op = k.P.open, flap = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) * 3 : (k.state === 'idle' ? k.frame : 0);
    const D0 = depth(L);
    if (k.back) {
      // v3's tail and sprawled legs (the back views are kept)
      k.add({ type: 'tube', name: 'tail', underlay: true, mat: c, shade: 'cyl', pts: [at(-8 + L, 0, 12), at(-14 + L, 3, 6), at(-19 + L, -1, 3), at(-21 + L, -5, 2)], w: 7, w1: 1.5 }, depth(-14 + L));
      for (const [u, v, ph] of [[6, -4, 0], [6, 4, 0.5], [-6, -4.5, 0.5], [-6, 4.5, 0]]) {
        const s = step(ph, 1, 0.6), ox = Math.sign(k.Rt[0] * v), fu = u + L + s.du * 0.6;
        const hip = at(u + L, v, 4.5), g = at(fu, v, s.dh), knee = [hip[0] + ox * 4.5, hip[1] - 0.5 - s.dh], foot = [hip[0] + ox * 6, g[1] - 1], d0 = depth(fu, v);
        k.add({ type: 'capsule', name: 'leg', underlay: true, mat: c, shade: 'cyl', a: hip, b: knee, r: 3, r1: 2.6 }, d0);
        k.add({ type: 'capsule', name: 'leg', underlay: true, mat: c, shade: 'cyl', a: knee, b: foot, r: 2.5, r1: 2 }, d0 + 0.01);
        for (const d of [0, 1, 2]) k.add({ type: 'rect', name: 'claw', x: Math.round(foot[0] + ox * (d * 1.5 - 0.5)), y: Math.round(foot[1] + 1.5 - (d === 1 ? 0 : 0.5)), w: 1, h: 1, color: 'hair.0' }, d0 + 0.02);
      }
    } else {
      // the tail sweeps back and curves round the near (left, v < 0) side, past the hind leg, so it shows in s/e
      k.add({ type: 'tube', name: 'tail', underlay: true, mat: c, shade: 'cyl', pts: [at(-7 + L, 0, 10), at(-12 + L, -3, 6), at(-15 + L, -8, 3), at(-14 + L, -13, 1.5), at(-10 + L, -16, 1)], w: 6.5, w1: 1.2 }, D0 - 0.6);
      // four legs: a thick curved thigh (hind: haunch back to a bent hock; fore: shoulder down to the elbow), a short dark shin, a clawed foot
      for (const [u, v, ph, hind] of [[5, -4.5, 0, 0], [5, 4.5, 0.5, 0], [-5.5, -5, 0.5, 1], [-5.5, 5, 0, 1]]) {
        const near = v < 0, s = step(ph, 1.4, 0.8), fu = u + L + s.du * 0.7;
        const top = at(u + L + (hind ? 1.5 : 0), v, hind ? 9 : 8), knee = at(u + L + (hind ? -2.5 : 0.8) + s.du * 0.3, v * 1.05, 3 + s.dh * 0.5), foot = at(fu + (hind ? 1 : 1.2), v * 1.1, 0.6 + s.dh);
        const dd = near ? D0 + 0.4 + (hind ? 0 : 0.05) : D0 - 0.4;
        k.add({ type: 'capsule', name: 'shin', underlay: true, mat: c, shade: 'flat', band: near ? 1 : 2, a: knee, b: foot, r: hind ? 2 : 1.8, r1: 1.4 }, dd);
        k.add({ type: 'capsule', name: hind ? 'thigh' : 'upper-leg', underlay: true, mat: c, shade: 'normal', round: 2, a: top, b: knee, r: hind ? 4.2 : 3.2, r1: hind ? 2.4 : 2 }, dd + 0.01);
        k.add({ type: 'ellipse', name: 'foot', underlay: true, mat: c, shade: 'flat', band: 2, cx: foot[0] - 0.5, cy: foot[1] + 0.5, rx: 2.2, ry: 1.1 }, dd + 0.02);
        for (const d of [-1, 0, 1]) { const t = at(fu + (hind ? 1 : 0.5) + 2.6, v * 1.1 + d * 1.6, 0); k.add({ type: 'rect', name: 'claw', x: Math.round(t[0]), y: Math.round(t[1]), w: 1, h: 1, color: 'hair.0' }, dd + 0.03); }
      }
    }
    // wings: a membrane on the leather ramp, three dark finger struts from the elbow, a lit leading edge
    for (const v of [-1, 1]) {
      const root = at(2 + L, v * 3, 18), elbow = at(-1 + L, v * 12, 30 + flap), tip = at(-10 + L, v * 17, 26 + flap * 1.5), trail = at(-9 + L, v * 7, 16), mid = at(-11 + L, v * 12, 18);
      const dw = depth(L, v * 8) + (v > 0 ? -30 : 0);
      k.add({ type: 'path', name: 'wing', underlay: true, mat: pal.leather, shade: 'flat', band: 1, d: k.smooth([root, elbow, tip, mid, trail, at(-4 + L, v * 3, 16)]) }, dw);
      for (const [a, b] of [[elbow, at(-10.5 + L, v * 14.5, 21)], [elbow, mid], [elbow, trail]]) k.add({ type: 'tube', name: 'wing-strut', color: 'leather.2', pts: [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.5], b], w: 1.2, w1: 0.8 }, dw + 0.05);
      k.add({ type: 'tube', name: 'wing-arm', mat: c, shade: 'cyl', pts: [root, elbow, tip], w: 2.4, w1: 1 }, dw + 0.1);
      k.add({ type: 'tube', name: 'wing-edge', color: 'accent.0', pts: [[root[0], root[1] - 1], [elbow[0], elbow[1] - 1], [tip[0], tip[1] - 0.6]], w: 0.9, w1: 0.6 }, dw + 0.11);
    }
    // the low heavy barrel
    k.add({ type: 'capsule', name: 'body', underlay: true, mat: c, shade: 'normal', round: 4, a: at(-8 + L, 0, 9), b: at(6 + L, 0, 10), r: 8.5, r1: 9 }, D0);
    for (let i = 0; i < 6; i++) k.add({ type: 'poly', name: 'spine', mat: pal.leather, shade: 'flat', band: 0, pts: [at(-9 + i * 3.4 + L, 0, 20), at(-8 + i * 3.4 + L, 0, 23.5), at(-7 + i * 3.4 + L, 0, 20)] }, D0 + (k.back ? 0.5 : -0.5));
    // neck and a wedge head; the head lunges ahead of the body (HL) and dips as the jaw opens
    const hu = 12 + HL, hh = 30 - op * 3, nb = at(7 + L, 0, 15), nm = at(10 + (L + HL) / 2, 0, 24 - op);
    const H = (du, dh, dv = 0) => at(hu + du, dv, hh + dh);
    k.add({ type: 'tube', name: 'neck', underlay: true, mat: c, shade: 'cyl', pts: [nb, nm, H(-2, -1)], w: 8, w1: 6 }, depth(10 + L));
    // lower jaw: hinged under the skull's back, turned down by the open pose (up to 40 degrees)
    const ang = op * 0.7, J = (du, dh) => { const r = Math.cos(ang), s2 = Math.sin(ang), x = du + 2, y = dh + 1.5; return H(-2 + x * r + y * s2, -1.5 - x * s2 + y * r); };
    const dh0 = depth(13 + L);
    if (op > 0.2) k.add({ type: 'poly', name: 'mouth', color: 'accent.2', pts: [H(-1.5, -1.5), H(9, -1), J(9, -1.5), J(0, -2)] }, dh0 - 0.02);
    k.add({ type: 'path', name: 'jaw', underlay: true, mat: c, shade: 'flat', band: 2, d: k.smooth([J(-3, -1.5), J(4, -1.5), J(9.5, -1.6), J(8.5, -3), J(1, -4.2), J(-3, -3.5)]) }, dh0 - 0.01);
    k.add({ type: 'path', name: 'head', underlay: true, mat: c, shade: 'sphere', d: k.smooth([H(-4.5, 3.5), H(0, 5.5), H(5, 3.5), H(9, 1.5), H(11, 0), H(9.5, -1.5), H(2, -1.8), H(-3.5, -2.5)]) }, dh0);
    if (op > 0.2) for (const t of [3, 6]) { const p = H(t, -2); k.add({ type: 'rect', name: 'tooth', x: Math.round(p[0]), y: Math.round(p[1]), w: 1, h: 1, color: 'hair.0' }, dh0 + 0.02); }
    // horns on the hair (bone) ramp, swept back from the brow and curving down at the tip
    for (const v of [-2, 2]) k.add({ type: 'tube', name: 'horn', underlay: true, mat: pal.hair, shade: 'flat', band: 0, pts: [H(-1, 4, v), H(-5, 6.5, v * 1.3), H(-9, 6, v * 1.5), H(-11, 4, v * 1.5)], w: 2.8, w1: 0.8 }, dh0 + (k.back ? 0.2 : -0.2) + (v < 0 ? 0.05 : -0.05));
    if (!k.back) { const e = H(2.5, 1.8, -1.2); k.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 2, h: 1, color: 'accent.0' }, dh0 + 0.05); }
  }, { ground: GROUND, shadow: { cx: 32, cy: 80 - GROUND, rx: 16 } });
}
export const anchors = ctx => groundAnchors(ctx, { head: [12, 0, 32], hand: [22, 0, 29] }, { lunge: 14, ground: GROUND });
