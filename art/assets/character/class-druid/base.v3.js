// class-druid base.v3 (r3) — from base.v2 (R12), one change, the cloak's shape: it gets rounded shoulders, narrows
// to a waist about 2 px in on each side below them, flares out to the hem, and the hem now stops above the ground so
// both boots show under it (drawn over the hem's edge).
// base.v2 header: from base.v1, one change: the hood's two round ear nubs are replaced by thin branching
// antlers (leather ramp, about 5 px tall, each with a beam and two tines) rising from the hood.
// base.v1 header: the Druid on the shared player body (art/lib/person.v1.js), from the approved class probe:
// a bear-head hood and a pelt to the ground, a square bearded jaw, and a gnarled staff topped by a crystal.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-druid', pass: 'r3', notes: 'probe druid: antlered hood, pelt, gnarled staff', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L } = k;
    k.legs(pal.leather, 2.4, 1.5);
    k.shape('pelt', pal.hair, [[0, shoulder - Y(1)], [5.4, shoulder - Y(0.4)], [6.6, shoulder + Y(1.8)], [5.4, shoulder + Y(4.4)], [4.4, waist], [5.6, waist + Y(4)], [7.2, foot - Y(3.6)], [7.4, foot - Y(2.6)], [3.6, foot - Y(2.2)], [0, foot - Y(2.6)]]);
    k.boots(pal.leather);
    k.front(() => k.shape('leaf-wrap', pal.leather, [[0, shoulder + Y(2)], [2.5, shoulder + Y(2)], [2, waist], [0, waist + Y(3)]]));
    k.head(headY + Y(1), { ears: false, wide: 3.4, jaw: 2.8, chin: 3.8, point: 0, eyes: 1.8 });
    k.front(() => k.add({ type: 'path', name: 'beard', mat: pal.leather, shade: 'sphere', d: k.smooth([[cx - 1, headY + Y(2.5)], [cx + X(3) - 1, headY + Y(2)], [cx + X(2.5) - 1, headY + Y(6)], [cx - 1, headY + Y(8)], [cx - X(2.5) - 1, headY + Y(6)], [cx - X(3) - 1, headY + Y(2)]]) }));
    k.add({ type: 'path', name: 'bear-head', underlay: true, mat: pal.hair, shade: 'sphere',
      d: `M${cx - X(5.5)} ${headY + Y(3)} Q${cx - X(6)} ${headY - Y(7)} ${cx} ${headY - Y(7)} Q${cx + X(6)} ${headY - Y(7)} ${cx + X(5.5)} ${headY + Y(3)} Q${cx + X(4)} ${headY - Y(1)} ${cx + X(3)} ${headY - Y(1)} Q${cx} ${headY - Y(2.5)} ${cx - X(3)} ${headY - Y(1)} Q${cx - X(4)} ${headY - Y(1)} ${cx - X(5.5)} ${headY + Y(3)} Z` });
    for (const sd of [-1, 1]) {
      const bx = cx + sd * X(3.2), by = headY - Y(6.2), tx = cx + sd * X(5.6), ty = headY - Y(11.2);
      const ant = (a, b) => k.add({ type: 'capsule', name: 'antler', underlay: true, mat: pal.leather, shade: 'flat', band: 1, a, b, r: X(0.5) });
      ant([bx, by], [tx, ty]);                                                            // the beam, out and up
      ant([cx + sd * X(4.2), headY - Y(8.2)], [cx + sd * X(3.4), headY - Y(10.6)]);       // inner tine
      ant([cx + sd * X(5), headY - Y(9.8)], [cx + sd * X(7), headY - Y(10.4)]);           // outer tine
    }
    k.front(() => {
      k.add({ type: 'ellipse', name: 'snout', cx: cx - 1, cy: headY - Y(3.5), rx: X(2), ry: Y(1.2), mat: pal.hair, shade: 'sphere' });
      k.add({ type: 'rect', name: 'bear-eye', x: Math.round(cx - X(3)) - 1, y: Math.round(headY - Y(5)), w: 1, h: 1, color: 'outline' });
      k.add({ type: 'rect', name: 'bear-eye', x: Math.round(cx + X(3)) - 1, y: Math.round(headY - Y(5)), w: 1, h: 1, color: 'outline' });
    });
    k.rear(() => k.add({ type: 'ellipse', name: 'pelt-back', cx, cy: headY - Y(2), rx: X(4.5), ry: Y(4.5), mat: pal.hair, shade: 'sphere' }));
    k.main(() => {
      k.add({ type: 'tube', name: 'staff', underlay: true, mat: pal.leather, shade: 'cyl', pts: [[L, foot - Y(1)], [L + X(0.8), waist], [L - X(0.8), shoulder], [L - X(1), headY - Y(8)]], w: X(1.5), w1: X(1.1) });
      k.add({ type: 'star', name: 'crystal', cx: L - X(1), cy: headY - Y(10), r: X(2.4), r2: X(1.2), n: 4, mat: pal.accent, shade: 'sphere' });
      k.arm(-1, pal.hair, L + X(0.6), waist - Y(4), { r: 1.6 });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.8, headDy: 1, hand: L => [L.L + L.X(0.6), L.waist - L.Y(4)] });
