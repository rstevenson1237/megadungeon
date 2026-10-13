// class-monk base.v1 (r1) — the Monk on the shared player body (art/lib/person.v1.js), from the approved class probe:
// a bare broad round skull, a wrapped robe with a sash, wrapped shins, and a long quarterstaff held across the body in
// both hands (it turns with the right hand).
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-monk', pass: 'r1', notes: 'probe monk: bare skull, robe and sash, staff across', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, knee, L, R, P } = k;
    k.legs(pal.accent, 2.2, 1.7);
    P.feet.forEach((dy, i) => k.add({ type: 'ellipse', name: 'wraps', cx: k.baseCx + (i ? 1 : -1) * X(2.6), cy: foot - Y(3.5) + dy, rx: X(1.8), ry: Y(1.6), mat: pal.cloth, shade: 'sphere' }));
    k.boots(pal.leather);
    k.neck();
    k.shape('robe', pal.accent, [[0, shoulder - Y(0.5)], [4.6, shoulder], [5, shoulder + Y(4)], [4.2, waist], [6, knee - Y(1)], [0, knee]]);
    k.add({ type: 'ellipse', name: 'sash', cx, cy: waist, rx: X(5), ry: Y(1.2), mat: pal.leather, shade: 'cyl', axis: 'x' });
    k.head(headY, { wide: 4, crown: 5.2, jaw: 2.6, chin: 3.6, point: 0, eyes: 2.2, hair: pal.skin });
    k.off(() => k.arm(1, pal.skin, cx + X(5), shoulder + Y(2)));
    k.main(() => {
      k.pole(pal.leather, L - X(4), foot - Y(4), R + X(5), shoulder - Y(9), 0.75, 'staff');
      k.arm(-1, pal.skin, cx - X(3), waist - Y(3));
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 2.2, hand: L => [L.cx - L.X(3), L.waist - L.Y(3)] });
