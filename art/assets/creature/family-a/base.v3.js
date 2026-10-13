// family-a base.v3 (r3, from base.v2) — ONE change, the body and claws' fill: the four overlapping segment ellipses
// (each inking the last, so the body read as near-black outline) are one tapering shell filled with the leather ramp's
// mid step, a lit leather-light band along its top and thin dark segment seams, so the recolour ramp dominates and the
// outline is only on the edge; the pincers are larger (a 3 px light palm, thicker fingers) so both read in every facing.
// family-a base.v2 (r2, from base.v1) — ONE change, the scorpion's read: the tail is rebuilt as five separate shell
// segments (each its own leather-ramp bead with its own ink, lit on the top edge) arching up and forward to a hooked
// sting, and the two pincers reach out past the head as open claws (two fingers each, a gap between them).
// base.v1 (r1) — giant insects and scorpions (glyph a, 0.3 m): a giant scorpion on the creature rig
// (art/lib/beast.v1.js): a flat segmented body, two big pincers held forward, four legs a side, and the segmented
// tail arched high over the back with its sting pointing forward (it strikes in the attack). Below the knee, the tail
// higher. The shell is the recoloured ramp (recolour: leather).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-a', pass: 'r3', notes: 'scorpion: segmented body, forward pincers, arched sting', mirror: false, recolour: 'leather' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, c = pal.leather, L = k.P.lunge * 3, sting = k.P.open;
    for (let i = 0; i < 4; i++) for (const v of [-1, 1]) {
      const u = 2 - i * 2, s = step(i % 2 ? 0 : 0.5, 0.8, 0.6);
      k.add({ type: 'tube', name: 'leg', mat: c, shade: 'flat', band: 1, pts: [at(u + L, v * 2, 2), at(u + L + 0.5, v * 4.5, 3), at(u + L + 1 + s.du, v * 6, s.dh)], w: 1, w1: 0.6 }, depth(u + L, v * 4));
    }
    // the shell: one tapering mass (ink only on its edge), mid leather, a lit band along the top, dark seams between segments
    const bd = depth(L);
    k.add({ type: 'tube', name: 'shell', underlay: true, mat: c, shade: 'flat', band: 1, pts: [at(4.6 + L, 0, 2.6), at(1 + L, 0, 2.8), at(-2.6 + L, 0, 2.6), at(-5.6 + L, 0, 2.4)], w: 5, w1: 3.4 }, bd);
    k.add({ type: 'tube', name: 'shell-light', mat: c, shade: 'flat', band: 0, pts: [at(4 + L, 0, 3.6), at(1 + L, 0, 3.9), at(-2.6 + L, 0, 3.6), at(-5 + L, 0, 3.2)], w: 1.6, w1: 1 }, bd + 0.001);
    for (const u of [2, -0.4, -2.8]) k.add({ type: 'tube', name: 'seam', mat: c, shade: 'flat', band: 2, pts: [at(u + L, -1.4, 2.4), at(u + L, 0, 3.6), at(u + L, 1.4, 2.4)], w: 0.7 }, bd + 0.002);
    for (const v of [-1, 1]) {
      const gap = 0.6 + sting * 0.8; // the claw opens wider as it strikes
      k.add({ type: 'capsule', name: 'arm', mat: c, shade: 'flat', band: 1, a: at(3.5 + L, v * 1.8, 2.6), b: at(7 + L, v * 3.8, 3), r: 1.1 }, depth(6 + L, v * 3));
      k.add({ type: 'ellipse', name: 'claw-palm', underlay: true, mat: c, shade: 'flat', band: 0, cx: at(8 + L, v * 3.8, 3)[0], cy: at(8 + L, v * 3.8, 3)[1], rx: 2.2, ry: 1.7 }, depth(8 + L, v * 3) + 0.2);
      k.add({ type: 'tube', name: 'claw-finger', mat: c, shade: 'flat', band: 0, pts: [at(8.6 + L, v * 3.6, 3.6), at(10.4 + L, v * 3.2, 3.6 + gap), at(11.6 + L, v * 2.6, 3.2 + gap)], w: 1.8, w1: 0.9 }, depth(8 + L, v * 3) + 0.3);
      k.add({ type: 'tube', name: 'claw-finger', mat: c, shade: 'flat', band: 1, pts: [at(8.6 + L, v * 4, 2.4), at(10.4 + L, v * 4, 2.4 - gap), at(11.4 + L, v * 3.4, 2.6 - gap)], w: 1.6, w1: 0.8 }, depth(8 + L, v * 3) + 0.3);
    }
    // the tail: five beads arching up over the back and forward, then the hooked sting
    const segs = [[-5.6, 3.4, 2.1], [-8, 6, 1.95], [-8.6, 9.2, 1.8], [-6.6, 11.6, 1.65], [-3.8 + sting * 3, 12 - sting * 2, 1.5]];
    segs.forEach(([u, ht, r], i) => {
      const p = at(u + L + (i === 4 ? 0 : sting * i * 0.5), 0, ht);
      const dz = depth(-6 + L) + (k.back ? 20 : 0) + i * 0.01;
      k.add({ type: 'ellipse', name: 'tail-seg', underlay: true, mat: c, shade: 'flat', band: 1, cx: p[0], cy: p[1], rx: r, ry: r * 0.85 }, dz);
      k.add({ type: 'ellipse', name: 'tail-light', mat: c, shade: 'flat', band: 0, cx: p[0] - 0.4, cy: p[1] - r * 0.35, rx: r * 0.65, ry: r * 0.4 }, dz + 0.001);
    });
    const tip = segs[4], tu = tip[0] + L;
    k.add({ type: 'tube', name: 'sting', underlay: true, mat: pal.accent, shade: 'flat', band: 1, pts: [at(tu + 0.8, 0, tip[1] - 0.2), at(tu + 2, 0, tip[1] - 1), at(tu + 2.2, 0, tip[1] - 2.4), at(tu + 1.4, 0, tip[1] - 3)], w: 1.2, w1: 0.4 }, depth(-6 + L) + (k.back ? 20.1 : 0.1));
    if (!k.back) for (const v of [-0.8, 0.8]) { const e = at(3.6 + L, v, 3.8); k.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 1, h: 1, color: 'accent.0' }, depth(9 + L)); }
  }, { ground: 6 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [3, 0, 3], hand: [9, -3, 3.5] }, { lunge: 3 });
