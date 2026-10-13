// family-e base.v1 (r1) — eels and deep things of the water (glyph e, 0.8 m): a great eel on the creature rig
// (art/lib/beast.v1.js) rising out of a dark ripple on the floor: a long smooth body in an S, a fin running down its
// back, a blunt head with a gaping jaw of needle teeth and a pale eye. The body is the recoloured ramp (recolour: grass).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-e', pass: 'r1', notes: 'great eel rising from a ripple: S body, back fin, gaping jaw', mirror: false, recolour: 'grass' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth } = k, c = pal.grass, L = k.P.lunge * 4, sway = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) : (k.state === 'idle' ? k.frame * 0.6 : 0);
    const base = at(-1, 0, 0);
    k.add({ type: 'ellipse', name: 'ripple', cx: base[0], cy: base[1], rx: 7, ry: 3, mat: pal.grass, shade: 'flat', band: 2 }, -100);
    k.add({ type: 'ring', name: 'ripple-ring', cx: base[0], cy: base[1], r: 5, w: 0.8, mat: pal.grass, shade: 'flat', band: 1, scale: [1, 0.45], origin: base }, -99);
    const spine = [at(-1, 0, 0), at(-2 + sway, 0, 4), at(0 + sway, 0, 8), at(2 + L, 0, 11), at(4 + L * 1.3, 0, 12.5 + k.P.open * 0.5)];
    k.add({ type: 'tube', name: 'fin', mat: c, shade: 'flat', band: 1, pts: spine.slice(0, 4).map(([x, y]) => [x + (k.back ? -1.6 : 1.6), y - 0.4]), w: 1.6, w1: 0.6 }, 0);
    k.add({ type: 'tube', name: 'body', underlay: true, mat: c, shade: 'cyl', pts: spine.slice(0, 4), w: 4.4, w1: 3.6 }, 1);
    const hd = spine[4];
    k.add({ type: 'ellipse', name: 'head', underlay: true, mat: c, shade: 'sphere', cx: hd[0], cy: hd[1], rx: 3.4, ry: 2.4 }, 2);
    if (!k.back) {
      k.add({ type: 'path', name: 'jaw', underlay: true, mat: c, shade: 'flat', band: 1, d: k.smooth([[hd[0] - 3, hd[1] + 0.5], [hd[0] - 4 - k.P.open, hd[1] + 2.5 + k.P.open * 1.5], [hd[0] + 1, hd[1] + 2]]) }, 2.1);
      k.add({ type: 'rect', name: 'teeth', x: Math.round(hd[0] - 3.5), y: Math.round(hd[1] + 1), w: 3, h: 1, mat: pal.cloth, shade: 'flat', band: 0 }, 2.2);
      k.add({ type: 'rect', name: 'eye', x: Math.round(hd[0] - 1), y: Math.round(hd[1] - 1), w: 1, h: 1, color: 'accent.0' }, 2.3);
    }
  }, { ground: 7, shadow: false });
}
export const anchors = ctx => groundAnchors(ctx, { head: [4, 0, 12.5], hand: [2, 0, 12] }, { ground: 7 });
