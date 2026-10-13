// family-c base.v2 (r2, from base.v1) — ONE change, the reviewer's "s/e is a straight bar, head end ambiguous": in the
// front view (s/e) the segment chain is laid out on screen as a full S (one wave of 3 px across the frame, head at the
// lower left, tail upper right; the ground-frame swing alone stayed flat on screen) and the head
// rises 3.5 px at the leading end, the neck segment with it, carrying its fangs and feelers up. n/w is unchanged.
// base.v1 (r1) — giant centipedes and crayfish (glyph c, 0.3 m): a giant centipede on the creature rig
// (art/lib/beast.v1.js): a long chain of flat plated segments winding in an S across the floor, a pair of legs on each,
// a head raised with long feelers and curved fangs. The plates are the recoloured ramp (recolour: accent).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-c', pass: 'r2', notes: 'centipede: winding plated segments, legs on each, raised head and fangs', mirror: false, recolour: 'accent' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth } = k, c = pal.accent, L = k.P.lunge * 4, wave = k.P.walking ? k.P.phase * Math.PI * 2 : 0;
    const n = 9, front = !k.back, rise = front ? 3.5 : 0;
    // segment i's place in the ground frame: from the back as v1; from the front from a screen-space S (dx, dy from the
    // ground point) turned back into (u, v): dx = -0.894 (u + v), dy = 0.447 (u - v)
    const seg = i => {
      if (!front) return [7 - i * 2.2 + L, Math.sin(i * 0.8 + wave) * 2.4];
      const dx = -7.5 + i * 2.4 - L * 0.894, dy = 1.5 - i * 0.6 + 2 * Math.sin(i * 0.78) + 1.2 * Math.sin(i * 0.78 + wave), a = -dx / 0.894, b = dy / 0.447;
      return [(a + b) / 2, (a - b) / 2];
    };
    for (let i = n - 1; i >= 0; i--) {
      const [u, v] = seg(i), ht = i === 0 ? 3 + k.P.open + rise : 1.6 + (i === 1 ? rise * 0.45 : 0);
      for (const sd of [-1, 1]) {
        const lift = k.P.walking && (i + (sd > 0 ? 1 : 0)) % 2 === Math.round(k.P.phase * 4) % 2 ? 0.8 : 0;
        if (i > 0) k.add({ type: 'tube', name: 'leg', mat: pal.leather, shade: 'flat', band: 1, pts: [at(u, v + sd * 1.4, 1.2), at(u + 0.6, v + sd * 3.2, 1.4 + lift), at(u + 0.4, v + sd * 3.8, lift)], w: 0.8, w1: 0.5 }, depth(u, v + sd * 2));
      }
      k.add({ type: 'ellipse', name: i ? 'segment' : 'head', underlay: true, mat: c, shade: 'sphere', cx: at(u, v, ht)[0], cy: at(u, v, ht)[1], rx: i ? 2.4 : 2.2, ry: i ? 1.7 : 1.9 }, depth(u, v));
    }
    const hd = seg(0);
    for (const sd of [-1, 1]) {
      k.add({ type: 'tube', name: 'feeler', mat: pal.leather, shade: 'flat', band: 0, pts: [at(hd[0] + 1, hd[1] + sd * 0.8, 4 + rise), at(hd[0] + 3, hd[1] + sd * 2.5, 7 + rise), at(hd[0] + 5, hd[1] + sd * 3, 7.5 + rise)], w: 0.7 }, depth(hd[0] + 2, hd[1] + sd));
      k.add({ type: 'path', name: 'fang', mat: pal.leather, shade: 'flat', band: 0, d: k.smooth([at(hd[0] + 1.2, hd[1] + sd * 0.7, 2.6 + rise), at(hd[0] + 3, hd[1] + sd * 1.2, 2.2 + rise), at(hd[0] + 2.6, hd[1] + sd * 0.2, 1.6 + rise)]) }, depth(hd[0] + 3, hd[1]));
    }
  }, { ground: 8 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [7, 0, 5], hand: [10, 0, 4] }, { lunge: 4, ground: 8 });
