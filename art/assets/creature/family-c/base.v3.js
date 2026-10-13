// family-c base.v3 (r3, from base.v1, the best so far) — ONE change, the reviewer's "n/w collapse into a dark mass":
// the back view (n/w) is redrawn as the same segment chain seen from behind (head furthest, up the screen; tail
// nearest), each segment a mid plate with a lit dorsal stripe and a dark-step seam (no per-plate outline), a pair of 1 px light leg ticks per
// segment, the feelers raised past the head, no fangs (they face away). The front view (s/e) is v1's, unchanged.
// family-c base.v1 (r1) — giant centipedes and crayfish (glyph c, 0.3 m): a giant centipede on the creature rig
// (art/lib/beast.v1.js): a long chain of flat plated segments winding in an S across the floor, a pair of legs on each,
// a head raised with long feelers and curved fangs. The plates are the recoloured ramp (recolour: accent).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-c', pass: 'r3', notes: 'centipede: winding plated segments, legs on each, raised head and fangs', mirror: false, recolour: 'accent' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth } = k, c = pal.accent, L = k.P.lunge * 4, wave = k.P.walking ? k.P.phase * Math.PI * 2 : 0;
    const n = 9;
    if (k.back) {
      // seen from behind: tail (nearest) drawn last; each plate lit along its back, a light leg tick on each side
      for (let i = 0; i < n; i++) {
        const u = 7 - i * 2.2 + L, v = Math.sin(i * 0.8 + wave) * 2.4, ht = i === 0 ? 2.4 + k.P.open : 1.4, d = 100 + i;
        if (i > 0) for (const sd of [-1, 1]) {
          const lift = k.P.walking && (i + (sd > 0 ? 1 : 0)) % 2 === Math.round(k.P.phase * 4) % 2 ? 0.8 : 0;
          k.add({ type: 'tube', name: 'leg', mat: pal.leather, shade: 'flat', band: 0, pts: [at(u, v + sd * 2, 1), at(u - 0.3, v + sd * 3.6, lift)], w: 0.6 }, d - 0.5);
        }
        const p = at(u, v, ht), rx = i ? 2.4 - Math.max(0, i - 6) * 0.3 : 2, ry = i ? 1.6 : 1.7;
        // the seam between plates is the ramp's dark step (an outline underlay on every plate would ink the chain black)
        k.add({ type: 'ellipse', name: 'seam', mat: c, shade: 'flat', band: 2, cx: p[0] + 0.3, cy: p[1] + 0.4, rx: rx + 0.4, ry: ry + 0.4 }, d - 0.2);
        k.add({ type: 'ellipse', name: i ? 'segment' : 'head', mat: c, shade: 'flat', band: 1, cx: p[0], cy: p[1], rx, ry }, d);
        k.add({ type: 'ellipse', name: 'plate-lit', mat: c, shade: 'flat', band: 0, cx: p[0] - 0.4, cy: p[1] - 0.6, rx: rx * 0.4, ry: ry * 0.4 }, d + 0.1);
        // the joint to the plate in front (further up the chain): a dark-step band across the body
        if (i > 0) k.add({ type: 'tube', name: 'joint', mat: c, shade: 'flat', band: 2, pts: [at(u + 1.2, v - 1.7, ht), at(u + 1.2, v + 1.7, ht)], w: 0.8 }, d + 0.15);
      }
      const hd = [7 + L, Math.sin(wave) * 2.4];
      for (const sd of [-1, 1]) k.add({ type: 'tube', name: 'feeler', mat: pal.leather, shade: 'flat', band: 0, pts: [at(hd[0] + 0.8, hd[1] + sd * 0.8, 3.2), at(hd[0] + 2.6, hd[1] + sd * 2.4, 6), at(hd[0] + 4.4, hd[1] + sd * 3, 6.5)], w: 0.7 }, 99);
      return;
    }
    for (let i = n - 1; i >= 0; i--) {
      const u = 7 - i * 2.2 + L, v = Math.sin(i * 0.8 + wave) * 2.4, ht = i === 0 ? 3 + k.P.open : 1.6;
      for (const sd of [-1, 1]) {
        const lift = k.P.walking && (i + (sd > 0 ? 1 : 0)) % 2 === Math.round(k.P.phase * 4) % 2 ? 0.8 : 0;
        if (i > 0) k.add({ type: 'tube', name: 'leg', mat: pal.leather, shade: 'flat', band: 1, pts: [at(u, v + sd * 1.4, 1.2), at(u + 0.6, v + sd * 3.2, 1.4 + lift), at(u + 0.4, v + sd * 3.8, lift)], w: 0.8, w1: 0.5 }, depth(u, v + sd * 2));
      }
      k.add({ type: 'ellipse', name: i ? 'segment' : 'head', underlay: true, mat: c, shade: 'sphere', cx: at(u, v, ht)[0], cy: at(u, v, ht)[1], rx: i ? 2.4 : 2.2, ry: i ? 1.7 : 1.9 }, depth(u, v));
    }
    const hd = [7 + L, Math.sin(wave) * 2.4];
    for (const sd of [-1, 1]) {
      k.add({ type: 'tube', name: 'feeler', mat: pal.leather, shade: 'flat', band: 0, pts: [at(hd[0] + 1, hd[1] + sd * 0.8, 4), at(hd[0] + 3, hd[1] + sd * 2.5, 7), at(hd[0] + 5, hd[1] + sd * 3, 7.5)], w: 0.7 }, depth(hd[0] + 2, hd[1] + sd));
      k.add({ type: 'path', name: 'fang', mat: pal.leather, shade: 'flat', band: 0, d: k.smooth([at(hd[0] + 1.2, hd[1] + sd * 0.7, 2.6), at(hd[0] + 3, hd[1] + sd * 1.2, 2.2), at(hd[0] + 2.6, hd[1] + sd * 0.2, 1.6)]) }, depth(hd[0] + 3, hd[1]));
    }
  }, { ground: 8 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [7, 0, 3], hand: [10, 0, 2] }, { lunge: 4, ground: 8 });
