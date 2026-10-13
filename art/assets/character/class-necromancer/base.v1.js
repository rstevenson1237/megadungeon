// class-necromancer base.v1 (r1) — the Necromancer on the shared player body (art/lib/person.v1.js), from the approved
// class probe: a pointed deep hood over a face lost in shadow with two pale eyes, a robe to the ground, a staff with an
// orb in the right hand and an open book in the left.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-necromancer', pass: 'r1', notes: 'probe necromancer: pointed hood, shadow face, orb staff, book', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    k.shape('robe', pal.leather, [[0, shoulder - Y(1)], [5, shoulder], [5.5, waist - Y(2)], [7.5, foot - Y(1.5)], [5, foot], [0, foot - Y(0.5)]]);
    k.add({ type: 'path', name: 'hood', underlay: true, mat: pal.leather, shade: 'sphere',
      d: `M${cx - X(5)} ${shoulder + Y(1)} Q${cx - X(5.5)} ${headY - Y(4)} ${cx + X(2)} ${headY - Y(8)} Q${cx + X(5.5)} ${headY - Y(2)} ${cx + X(5)} ${shoulder + Y(1)} Q${cx} ${shoulder + Y(2)} ${cx - X(5)} ${shoulder + Y(1)} Z` });
    k.front(() => {
      k.add({ type: 'ellipse', name: 'shadow-face', cx: cx - 1, cy: headY + Y(0.8), rx: X(2.6), ry: Y(3.2), color: 'outline' });
      for (const e of [-2, 2]) k.add({ type: 'rect', name: 'eye', x: Math.round(cx + X(e)) - 1, y: Math.round(headY), w: 1, h: 1, color: 'accent.0' });
    });
    k.main(() => {
      k.add({ type: 'tube', name: 'staff', underlay: true, mat: pal.leather, shade: 'cyl', pts: [[L, foot - Y(1)], [L + X(0.5), waist], [L - X(0.5), headY - Y(6)]], w: X(1.3), w1: X(1) });
      k.add({ type: 'circle', name: 'orb', cx: L - X(0.5), cy: headY - Y(8), r: X(1.8), mat: pal.accent, shade: 'sphere' });
      k.arm(-1, pal.leather, L + X(1), waist - Y(3), { r: 1.5 });
    });
    k.off(() => {
      k.add({ type: 'path', name: 'book', underlay: true, mat: pal.leather, shade: 'bevel', d: k.smooth([[R - X(3), waist - Y(6)], [R, waist - Y(5)], [R, waist - Y(0.5)], [R - X(3), waist], [R - X(6), waist - Y(0.5)], [R - X(6), waist - Y(5)]]) });
      k.add({ type: 'path', name: 'page', mat: pal.cloth, shade: 'flat', band: 0, d: k.smooth([[R - X(3), waist - Y(5)], [R - X(0.8), waist - Y(4.4)], [R - X(0.8), waist - Y(1)], [R - X(3), waist - Y(0.8)], [R - X(5.2), waist - Y(1)], [R - X(5.2), waist - Y(4.4)]]) });
      k.arm(1, pal.leather, R - X(4), waist - Y(2), { r: 1.5 });
    });
  });
}
// the face is shadow: the finish paints nothing there
export const anchors = ctx => personAnchors(ctx, { face: false, hand: L => [L.L + L.X(1), L.waist - L.Y(3)] });
