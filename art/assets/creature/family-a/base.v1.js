// family-a base.v1 (r1) — giant insects and scorpions (glyph a, 0.3 m): a giant scorpion on the creature rig
// (art/lib/beast.v1.js): a flat segmented body, two big pincers held forward, four legs a side, and the segmented
// tail arched high over the back with its sting pointing forward (it strikes in the attack). Below the knee, the tail
// higher. The shell is the recoloured ramp (recolour: leather).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-a', pass: 'r1', notes: 'scorpion: segmented body, forward pincers, arched sting', mirror: false, recolour: 'leather' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, c = pal.leather, L = k.P.lunge * 3, sting = k.P.open;
    for (let i = 0; i < 4; i++) for (const v of [-1, 1]) {
      const u = 2 - i * 2, s = step(i % 2 ? 0 : 0.5, 0.8, 0.6);
      k.add({ type: 'tube', name: 'leg', mat: c, shade: 'flat', band: 1, pts: [at(u + L, v * 2, 2), at(u + L + 0.5, v * 4.5, 3), at(u + L + 1 + s.du, v * 6, s.dh)], w: 1, w1: 0.6 }, depth(u + L, v * 4));
    }
    for (let i = 0; i < 4; i++) k.add({ type: 'ellipse', name: 'segment', underlay: true, mat: c, shade: 'sphere', cx: at(2 - i * 2.2 + L, 0, 2.6)[0], cy: at(2 - i * 2.2 + L, 0, 2.6)[1], rx: 3.4 - i * 0.3, ry: 2.2 }, depth(2 - i * 2.2 + L));
    for (const v of [-1, 1]) {
      k.add({ type: 'capsule', name: 'arm', underlay: true, mat: c, shade: 'cyl', a: at(3.5 + L, v * 1.6, 2.6), b: at(6 + L, v * 3.4, 3), r: 0.9 }, depth(6 + L, v * 3));
      k.add({ type: 'path', name: 'pincer', underlay: true, mat: c, shade: 'sphere', d: k.smooth([at(6 + L, v * 3.6, 3.6), at(9 + L, v * 3, 4), at(10 + L, v * 2.4, 3), at(8 + L, v * 3.4, 2)]) }, depth(8 + L, v * 3) + 0.2);
    }
    const tail = [at(-6 + L, 0, 3), at(-8.5 + L, 0, 6), at(-7 + L, 0, 9), at(-4 + L + sting * 4, 0, 9.5 - sting * 2), at(-2 + L + sting * 6, 0, 8 - sting * 3)];
    k.add({ type: 'tube', name: 'tail', underlay: true, mat: c, shade: 'cyl', pts: tail.slice(0, 4), w: 2.6, w1: 1.6 }, depth(-6 + L) + (k.back ? 20 : 0));
    k.add({ type: 'poly', name: 'sting', underlay: true, mat: pal.accent, shade: 'flat', band: 1, pts: [tail[3], tail[4], [tail[3][0] + 1.5, tail[3][1] + 1]] }, depth(-6 + L) + (k.back ? 20.1 : 0.1));
    if (!k.back) for (const v of [-0.8, 0.8]) { const e = at(3.6 + L, v, 3.8); k.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 1, h: 1, color: 'accent.0' }, depth(9 + L)); }
  }, { ground: 6 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [3, 0, 3], hand: [9, -3, 3.5] }, { lunge: 3 });
