// family-n base.v4 (x1, from base.v3) — the blind reviewer's change: mass and size. The whole figure is scaled up 25%
// toward the size table (2.2 m), the rising spine is one thick tapering column (about 5 px down to 4) instead of a chain
// of small dark beads, with a lit bone ridge along its top edge, and the tail coil is a thick tapering tube with the same
// lit ridge, so the serpent body reads as bone, not slate, and anchors the figure.
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
export const meta = { brief: 'family-n', pass: 'x1', notes: 'scaled 25%, thick lit spine and tail tube; open tapering tail curl instead of the closed floor ring, S-bent forward-leaning spine; long forward-leaning S-curve spine to ~35px, attack throws skull and torso 8px forward', mirror: false, recolour: 'cloth' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal } = k, b = pal.cloth, L = k.P.lunge * 8, sw = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) * 2 : (k.state === 'idle' ? k.frame : 0);
    // everything is drawn 25% larger than v3: `at` takes v3's measures and scales them
    const S = 1.25, at = (u, v = 0, h = 0) => k.at(u * S, v * S, h * S), depth = (u, v = 0) => k.depth(u * S, v * S);
    // the tail: open, running back from the spine's foot and curling once behind it, tapering to a point: one tube, lit along its top
    const N = 16, tail = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = t * Math.PI * 1.7, R = 10 - t * 5, u = -5 + Math.cos(a) * R, v = Math.sin(a) * R * 0.85 + sw * 0.2 * t;
      tail.push({ p: at(u, v, 2.5 - t * 1.5), d: depth(u, v), t });
    }
    // split the tail in runs sorted by depth so the coil passes behind and in front of itself
    for (let i = 0; i < N; i += 2) {
      const seg = tail.slice(i, i + 3), w0 = (7 - seg[0].t * 5) * 1, w1 = 7 - seg[seg.length - 1].t * 5;
      const dd = Math.max(...seg.map(q => q.d));
      k.add({ type: 'tube', name: 'tail', underlay: true, mat: b, shade: 'cyl', pts: seg.map(q => q.p), w: w0, w1 }, dd);
      k.add({ type: 'tube', name: 'tail-ridge', color: 'cloth.0', pts: seg.map(q => [q.p[0], q.p[1] - w0 * 0.3]), w: 1 }, dd + 0.001);
    }
    // the rising spine: a cubic in (u ahead, rise on screen), bowed back low and forward high; the attack throws the top forward
    const strike = k.state === 'attack' ? [-2, 5, 8, 2][k.frame % 4] : 0, sway = sw * 0.6;
    const C = [[4, 3], [-7, 12], [17 + strike * 0.6 + sway, 21], [8 + strike + sway, 31]]; // an S: back low, forward high
    const bez = t => { const m = 1 - t, a = m * m * m, b2 = 3 * m * m * t, c2 = 3 * m * t * t, d = t * t * t; return [a * C[0][0] + b2 * C[1][0] + c2 * C[2][0] + d * C[3][0], a * C[0][1] + b2 * C[1][1] + c2 * C[2][1] + d * C[3][1]]; };
    const scr = ([u, rise]) => at(u, 0, rise + k.F[1] * u);
    const col = Array.from({ length: 13 }, (_, i) => scr(bez(i / 12)));
    k.add({ type: 'tube', name: 'spine', underlay: true, mat: b, shade: 'cyl', pts: col, w: 5.5, w1: 4 }, depth(8));
    k.add({ type: 'tube', name: 'spine-ridge', color: 'cloth.0', pts: col.map(([x, y]) => [x - 1.4, y]), w: 1 }, depth(8) + 0.001);
    // vertebra notches across the column
    for (let i = 1; i < 12; i += 2) { const p = col[i]; k.add({ type: 'rect', name: 'notch', x: Math.round(p[0] - 1), y: Math.round(p[1]), w: 3, h: 1, color: 'cloth.2' }, depth(8) + 0.002); }
    const ch = scr(bez(1));
    for (let i = 0; i < 4; i++) { const p = scr(bez(0.97 - i * 0.075)); k.add({ type: 'ellipse', name: 'rib', underlay: true, mat: b, shade: 'cyl', axis: 'x', cx: p[0], cy: ch[1] + (2 + i * 2.2) * S, rx: (6 - i * 0.8) * S, ry: 1.2 }, depth(8) + 0.1 + i * 0.01); }
    for (const sd of [-1, 1]) {
      const sh = [ch[0] + sd * 6 * S, ch[1] + S], hand = [ch[0] + (sd * 10 - Math.max(0, strike) * (sd < 0 ? 0.5 : 0.1)) * S, ch[1] + (8 - (sd < 0 ? k.P.open * 6 : 0)) * S];
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: b, shade: 'cyl', pts: [sh, [sh[0] + sd * 3 * S, sh[1] + 5 * S], hand], w: 2, w1: 1.5 }, depth(8) + (sd < 0 ? 0.3 : 0.05));
      for (const d of [-1, 0, 1]) k.add({ type: 'capsule', name: 'claw', a: hand, b: [hand[0] + sd * 2.5, hand[1] + 2 + d * 1.2], r: 0.5, mat: b, shade: 'flat', band: 0 }, depth(8) + (sd < 0 ? 0.31 : 0.06));
    }
    const hd = [ch[0] - 1.5 + (k.back ? 0 : -1), ch[1] - 5 * S];
    k.add({ type: 'ellipse', name: 'skull', underlay: true, mat: b, shade: 'sphere', cx: hd[0], cy: hd[1], rx: 4 * S, ry: 4.4 * S }, depth(8) + 0.4);
    for (const sd of [-1, 1]) k.add({ type: 'tube', name: 'horn', underlay: true, mat: pal.hair, shade: 'cyl', pts: [[hd[0] + sd * 3.6, hd[1] - 2.5], [hd[0] + sd * 7.5, hd[1] - 6], [hd[0] + sd * 7.5, hd[1] - 11]], w: 2.5, w1: 0.7 }, depth(8) + 0.39);
    if (!k.back) {
      for (const dx of [-3.2, 0.8]) k.add({ type: 'rect', name: 'socket', x: Math.round(hd[0] + dx), y: Math.round(hd[1] - 0.5), w: 2, h: 2, color: 'outline' }, depth(8) + 0.5);
      for (const dx of [-2.6, 1.4]) k.add({ type: 'rect', name: 'eye-point', x: Math.round(hd[0] + dx), y: Math.round(hd[1]), w: 1, h: 1, color: 'accent.0' }, depth(8) + 0.51);
      k.add({ type: 'rect', name: 'teeth', x: Math.round(hd[0] - 2.5), y: Math.round(hd[1] + 3.4), w: 5, h: 1, color: 'outline' }, depth(8) + 0.5);
    }
  }, { ground: 12 });
}
const backF = ctx => ctx.facing === 'n' || ctx.facing === 'w';
export const anchors = ctx => groundAnchors(ctx, { head: [7.5 * 1.25, 0, (backF(ctx) ? 36 - 3.4 : 36 + 3.4) * 1.25], hand: [6 * 1.25, -10 * 1.25, (backF(ctx) ? 26 - 2.7 : 26 + 2.7) * 1.25] }, { lunge: 26 * 1.25, ground: 12 });
