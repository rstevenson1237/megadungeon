// family-n base.v3 (r3, from base.v2) — ONE change (the serpent body's shape): the closed floor ring of beads (read as a
// spring/donut) is replaced by an open tail that runs back from the spine's foot, curls once behind and tapers to a
// point, and the rising spine is bent into a clear S (back low, forward high) leaning forward toward the heading.
// base.v2 (r2, from base.v1) — ONE change: the rising spine. It is now a long forward-leaning S-curve (a
// cubic through the ground frame, set by its rise on screen so every facing matches) that carries the skull's top
// ~35 px above the floor (v1 stood ~26 px), and the attack throws the skull and torso forward along the heading
// (-2, +5, +8, +2 px over the four frames; v1 barely moved).
// v1: bone nagas (glyph n, 2.2 m): a bone naga on the creature rig (art/lib/beast.v1.js) at
// the large frame: a long serpent spine of vertebrae coiled on the floor rising into a skeletal upper body, a ribcage,
// two thin arms with claws, and a horned skull with burning eye-points. It sways and strikes forward. The bone is the
// recoloured ramp (recolour: cloth).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-n', pass: 'r3', notes: 'open tapering tail curl instead of the closed floor ring, S-bent forward-leaning spine; long forward-leaning S-curve spine to ~35px, attack throws skull and torso 8px forward', mirror: false, recolour: 'cloth' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth } = k, b = pal.cloth, L = k.P.lunge * 8, sw = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) * 2 : (k.state === 'idle' ? k.frame : 0);
    // the tail: open, running back from the spine's foot and curling once behind it, tapering to a point
    const N = 12;
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = t * Math.PI * 1.7, R = 10 - t * 5, u = -5 + Math.cos(a) * R, v = Math.sin(a) * R * 0.85 + sw * 0.2 * t, p = at(u, v, 2.5 - t * 1.5);
      k.add({ type: 'ellipse', name: 'vertebra', underlay: true, mat: b, shade: 'sphere', cx: p[0], cy: p[1], rx: 3.2 - t * 2.4, ry: 2.3 - t * 1.6 }, depth(u, v));
    }
    // the rising spine: a cubic in (u ahead, rise on screen), bowed back low and forward high; the attack throws the top forward
    const strike = k.state === 'attack' ? [-2, 5, 8, 2][k.frame % 4] : 0, sway = sw * 0.6;
    const C = [[4, 3], [-7, 12], [17 + strike * 0.6 + sway, 21], [8 + strike + sway, 31]]; // an S: back low, forward high
    const bez = t => { const m = 1 - t, a = m * m * m, b2 = 3 * m * m * t, c2 = 3 * m * t * t, d = t * t * t; return [a * C[0][0] + b2 * C[1][0] + c2 * C[2][0] + d * C[3][0], a * C[0][1] + b2 * C[1][1] + c2 * C[2][1] + d * C[3][1]]; };
    const scr = ([u, rise]) => at(u, 0, rise + k.F[1] * u);
    for (let i = 0; i <= 15; i++) { const p = scr(bez(i / 15)); k.add({ type: 'circle', name: 'spine', underlay: true, mat: b, shade: 'sphere', cx: p[0], cy: p[1], r: 2.4 - i * 0.03 }, depth(8) + i * 0.005); }
    const ch = scr(bez(1));
    for (let i = 0; i < 4; i++) { const p = scr(bez(0.97 - i * 0.075)); k.add({ type: 'ellipse', name: 'rib', underlay: true, mat: b, shade: 'cyl', axis: 'x', cx: p[0], cy: ch[1] + 2 + i * 2.2, rx: 6 - i * 0.8, ry: 1 }, depth(8) + 0.1 + i * 0.01); }
    for (const sd of [-1, 1]) {
      const sh = [ch[0] + sd * 6, ch[1] + 1], hand = [ch[0] + sd * 10 - Math.max(0, strike) * (sd < 0 ? 0.5 : 0.1), ch[1] + 8 - (sd < 0 ? k.P.open * 6 : 0)];
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: b, shade: 'cyl', pts: [sh, [sh[0] + sd * 3, sh[1] + 5], hand], w: 1.6, w1: 1.2 }, depth(8) + (sd < 0 ? 0.3 : 0.05));
      for (const d of [-1, 0, 1]) k.add({ type: 'capsule', name: 'claw', a: hand, b: [hand[0] + sd * 2, hand[1] + 1.5 + d], r: 0.4, mat: b, shade: 'flat', band: 0 }, depth(8) + (sd < 0 ? 0.31 : 0.06));
    }
    const hd = [ch[0] - 1.5 + (k.back ? 0 : -1), ch[1] - 5];
    k.add({ type: 'ellipse', name: 'skull', underlay: true, mat: b, shade: 'sphere', cx: hd[0], cy: hd[1], rx: 4, ry: 4.4 }, depth(8) + 0.4);
    for (const sd of [-1, 1]) k.add({ type: 'tube', name: 'horn', underlay: true, mat: pal.hair, shade: 'cyl', pts: [[hd[0] + sd * 3, hd[1] - 2], [hd[0] + sd * 6, hd[1] - 5], [hd[0] + sd * 6, hd[1] - 9]], w: 2, w1: 0.6 }, depth(8) + 0.39);
    if (!k.back) {
      for (const dx of [-2.6, 0.6]) k.add({ type: 'rect', name: 'socket', x: Math.round(hd[0] + dx), y: Math.round(hd[1] - 0.5), w: 2, h: 2, color: 'outline' }, depth(8) + 0.5);
      for (const dx of [-2, 1]) k.add({ type: 'rect', name: 'eye-point', x: Math.round(hd[0] + dx), y: Math.round(hd[1]), w: 1, h: 1, color: 'accent.0' }, depth(8) + 0.51);
      k.add({ type: 'rect', name: 'teeth', x: Math.round(hd[0] - 2), y: Math.round(hd[1] + 2.6), w: 4, h: 1, color: 'outline' }, depth(8) + 0.5);
    }
  }, { ground: 12 });
}
const backF = ctx => ctx.facing === 'n' || ctx.facing === 'w';
export const anchors = ctx => groundAnchors(ctx, { head: [7.5, 0, backF(ctx) ? 36 - 3.4 : 36 + 3.4], hand: [6, -10, backF(ctx) ? 26 - 2.7 : 26 + 2.7] }, { lunge: 26, ground: 12 });
