// family-n base.v1 (r1) — bone nagas (glyph n, 2.2 m): a bone naga on the creature rig (art/lib/beast.v1.js) at
// the large frame: a long serpent spine of vertebrae coiled on the floor rising into a skeletal upper body, a ribcage,
// two thin arms with claws, and a horned skull with burning eye-points. It sways and strikes forward. The bone is the
// recoloured ramp (recolour: cloth).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-n', pass: 'r1', notes: 'bone naga: vertebrae coil, skeletal torso and arms, horned skull', mirror: false, recolour: 'cloth' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth } = k, b = pal.cloth, L = k.P.lunge * 8, sw = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) * 2 : (k.state === 'idle' ? k.frame : 0);
    for (let i = 0; i <= 18; i++) {
      const a = i / 18 * Math.PI * 2.4, u = Math.cos(a) * (12 - i * 0.35) - 4, v = Math.sin(a) * (9 - i * 0.25), p = at(u, v + sw * 0.2, 2.5);
      k.add({ type: 'ellipse', name: 'vertebra', underlay: true, mat: b, shade: 'sphere', cx: p[0], cy: p[1], rx: 3 - i * 0.05, ry: 2.2 - i * 0.04 }, depth(u, v));
    }
    const spine = [at(4, 0, 4), at(5 + L * 0.4 + sw, 0, 14), at(5 + L * 0.8 + sw, 0, 26)];
    for (let i = 0; i < 7; i++) { const t = i / 6, p = [spine[0][0] + (spine[2][0] - spine[0][0]) * t, spine[0][1] + (spine[2][1] - spine[0][1]) * t]; k.add({ type: 'circle', name: 'spine', underlay: true, mat: b, shade: 'sphere', cx: p[0], cy: p[1], r: 2.2 }, depth(8) + i * 0.01); }
    const ch = spine[2];
    for (let i = 0; i < 4; i++) k.add({ type: 'ellipse', name: 'rib', underlay: true, mat: b, shade: 'cyl', axis: 'x', cx: ch[0], cy: ch[1] + 2 + i * 2.2, rx: 6 - i * 0.8, ry: 1 }, depth(8) + 0.1 + i * 0.01);
    for (const sd of [-1, 1]) {
      const sh = [ch[0] + sd * 6, ch[1] + 1], hand = [ch[0] + sd * 10 - L * (sd < 0 ? 1 : 0.3), ch[1] + 8 - (sd < 0 ? k.P.open * 6 : 0)];
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: b, shade: 'cyl', pts: [sh, [sh[0] + sd * 3, sh[1] + 5], hand], w: 1.6, w1: 1.2 }, depth(8) + (sd < 0 ? 0.3 : 0.05));
      for (const d of [-1, 0, 1]) k.add({ type: 'capsule', name: 'claw', a: hand, b: [hand[0] + sd * 2, hand[1] + 1.5 + d], r: 0.4, mat: b, shade: 'flat', band: 0 }, depth(8) + (sd < 0 ? 0.31 : 0.06));
    }
    const hd = [ch[0] + (k.back ? 0 : -1), ch[1] - 5];
    k.add({ type: 'ellipse', name: 'skull', underlay: true, mat: b, shade: 'sphere', cx: hd[0], cy: hd[1], rx: 4, ry: 4.4 }, depth(8) + 0.4);
    for (const sd of [-1, 1]) k.add({ type: 'tube', name: 'horn', underlay: true, mat: pal.hair, shade: 'cyl', pts: [[hd[0] + sd * 3, hd[1] - 2], [hd[0] + sd * 6, hd[1] - 5], [hd[0] + sd * 6, hd[1] - 9]], w: 2, w1: 0.6 }, depth(8) + 0.39);
    if (!k.back) {
      for (const dx of [-2.6, 0.6]) k.add({ type: 'rect', name: 'socket', x: Math.round(hd[0] + dx), y: Math.round(hd[1] - 0.5), w: 2, h: 2, color: 'outline' }, depth(8) + 0.5);
      for (const dx of [-2, 1]) k.add({ type: 'rect', name: 'eye-point', x: Math.round(hd[0] + dx), y: Math.round(hd[1]), w: 1, h: 1, color: 'accent.0' }, depth(8) + 0.51);
      k.add({ type: 'rect', name: 'teeth', x: Math.round(hd[0] - 2), y: Math.round(hd[1] + 2.6), w: 4, h: 1, color: 'outline' }, depth(8) + 0.5);
    }
  }, { ground: 12 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [5, 0, 31], hand: [5, -10, 22] }, { lunge: 8, ground: 12 });
