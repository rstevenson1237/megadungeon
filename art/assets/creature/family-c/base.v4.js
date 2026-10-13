// family-c base.v4 (x1, from base.v1) — ONE change, the blind reviewer's "s/e flat side profiles while n/w rear up, so
// facings disagree; segments and legs dissolve into noise": the body is redrawn as one straight-ish diagonal chain
// along the heading in every facing (s/e running down-left toward the viewer with the raised head at the near end,
// n/w running up-left with the tail nearest), its plates laid across the body axis in clean alternating bands (lit red
// plate, dark joint), a regular comb of paired leg ticks one pair per plate, and a round head with forcipules and
// feelers. The chain is laid out in screen space (the rig's 2:1 heading read as a flat side view at this size), plates
// and legs as bars across the screen axis. Shading is flat bands (no sphere speckle).
// base.v1 (r1) — giant centipedes and crayfish (glyph c, 0.3 m): a giant centipede on the creature rig
// (art/lib/beast.v1.js): a long chain of flat plated segments winding in an S across the floor, a pair of legs on each,
// a head raised with long feelers and curved fangs. The plates are the recoloured ramp (recolour: accent).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-c', pass: 'x1', notes: 'centipede: a diagonal chain of banded plates, paired leg comb, raised round head with forcipules', mirror: false, recolour: 'accent' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal } = k, c = pal.accent, lg = pal.leather, wave = k.P.walking ? k.P.phase * Math.PI * 2 : 0;
    // the body axis on screen, tail to head: down-left toward the viewer in front, up-left away from it behind
    const A = k.back ? [-0.8, -0.6] : [-0.8, 0.6];
    let N = [-A[1], A[0]]; if (N[1] > 0) N = [-N[0], -N[1]]; // across the body, pointing up the screen (the lit side)
    const C = [k.w / 2, k.back ? 25 : 26], n = 10, gap = 2, L = k.P.lunge * 4, bob = k.P.bob;
    const pt = (a, b = 0, up = 0) => [C[0] + A[0] * a + N[0] * b, C[1] + A[1] * a + N[1] * b - up - bob];
    const plate = i => { const a = 9 - 1.5 - i * gap + (i < 3 ? L * (3 - i) / 3 : 0), b = Math.sin(i * 0.7 - wave) * 0.8; return [a, b]; };
    // a regular comb of legs, a pair per plate, under everything; alternate pairs reach forward in the walk
    for (let i = 0; i < n; i++) {
      const [a, b] = plate(i), wd = 1.9 - i * 0.06;
      for (const sd of [-1, 1]) {
        const step = k.P.walking ? ((i + (sd > 0 ? 1 : 0) + Math.round(k.P.phase * 4)) % 2 ? 0.7 : -0.7) : 0;
        k.add({ type: 'tube', name: 'leg', mat: lg, shade: 'flat', band: sd < 0 ? 0 : 1, pts: [pt(a, b + sd * wd), pt(a - 0.5 + step, b + sd * (wd + 1.6)), pt(a - 0.9 + step, b + sd * (wd + 2.4), -1)], w: 0.7, w1: 0.5 }, 0);
      }
    }
    // the plates across the body: lit red plate, dark joint, alternating; near end drawn last
    const order = [...Array(n).keys()]; if (!k.back) order.reverse();
    const head = () => {
      const a = 9 + L, up = 2.2 + k.P.open * 2, hc = pt(a, 0, up);
      for (const sd of [-1, 1]) {
        k.add({ type: 'tube', name: 'feeler', mat: lg, shade: 'flat', band: 0, pts: [pt(a + 1, sd * 0.8, up + 1), pt(a + 3, sd * 2.6, up + 2.5), pt(a + 4.5, sd * 4, up + 2)], w: 0.7, w1: 0.5 }, 1);
        k.add({ type: 'tube', name: 'forcipule', underlay: true, mat: c, shade: 'flat', band: 2, pts: [pt(a + 0.5, sd * 1.4, up - 0.6), pt(a + 2.2, sd * 1.4, up - 0.8), pt(a + 2.8, sd * 0.4, up - 0.6)], w: 1, w1: 0.6 }, 1);
      }
      k.add({ type: 'ellipse', name: 'head', underlay: true, mat: c, shade: 'flat', band: 1, cx: hc[0], cy: hc[1], rx: 2.3, ry: 2 }, 1);
      k.add({ type: 'ellipse', name: 'head-lit', mat: c, shade: 'flat', band: 0, cx: hc[0] - 0.6, cy: hc[1] - 0.8, rx: 1.1, ry: 0.7 }, 1);
    };
    if (k.back) head();
    for (const i of order) {
      const [a, b] = plate(i), wd = 1.9 - i * 0.06, dark = i % 2 === 1;
      k.add({ type: 'capsule', name: 'segment', underlay: true, mat: c, shade: 'flat', band: dark ? 2 : 1, a: pt(a, b - wd, 1), b: pt(a, b + wd, 1), r: dark ? 0.9 : 1.2 }, 1);
      if (!dark) k.add({ type: 'capsule', name: 'segment-lit', mat: c, shade: 'flat', band: 0, a: pt(a + 0.3, b + wd * 0.9, 1.3), b: pt(a + 0.3, b + wd * 0.1, 1.3), r: 0.45 }, 1);
      if (i === n - 1) for (const sd of [-1, 1]) k.add({ type: 'tube', name: 'cercus', mat: lg, shade: 'flat', band: 0, pts: [pt(a - 0.8, b + sd * 0.6, 1), pt(a - 3.2, b + sd * 1.8, 1.4)], w: 0.7, w1: 0.4 }, 1);
    }
    if (!k.back) head();
  }, { ground: 8, shadow: { cx: ctx.size[0] / 2, cy: ctx.size[1] - 8, rx: 9 } });
}
export const anchors = ctx => groundAnchors(ctx, { head: [8, 0, 3], hand: [10, 0, 2] }, { lunge: 4, ground: 8 });
