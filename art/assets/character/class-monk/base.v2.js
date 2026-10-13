// class-monk base.v2 (r2) — from base.v1, one change: the quarterstaff is no longer held across the chest; it stands
// upright in the right hand beside the body (one ramp, flat, with a 1-px light edge), so the robe and sash read clean.
// base.v1 header: the Monk on the shared player body (art/lib/person.v1.js), from the approved class probe:
// a bare broad round skull, a wrapped robe with a sash, wrapped shins, and a long quarterstaff held across the body in
// both hands (it turns with the right hand).
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-monk', pass: 'r2', notes: 'probe monk: bare skull, robe and sash, staff upright in the right hand', mirror: false };

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
      k.add({ type: 'capsule', name: 'staff', underlay: true, mat: pal.leather, shade: 'flat', band: 2, a: [L, foot - Y(1)], b: [L, headY - Y(7)], r: X(0.75) });
      k.add({ type: 'rect', name: 'staff-edge', x: Math.round(L - X(0.75)), y: Math.round(headY - Y(6.5)), w: 1, h: Math.round(foot - Y(1.5) - (headY - Y(6.5))), color: 'leather.0' });
      k.arm(-1, pal.skin, L + X(0.6), waist - Y(3));
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 2.2, hand: L => [L.L + L.X(0.6), L.waist - L.Y(3)] });
