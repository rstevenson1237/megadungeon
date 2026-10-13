// class-druid base.v1 (r1) — the Druid on the shared player body (art/lib/person.v1.js), from the approved class probe:
// a bear-head hood and a pelt to the ground, a square bearded jaw, and a gnarled staff topped by a crystal.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-druid', pass: 'r1', notes: 'probe druid: bear-head hood, pelt, gnarled staff', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L } = k;
    k.boots(pal.leather);
    k.shape('pelt', pal.hair, [[0, shoulder - Y(1)], [6, shoulder], [7, shoulder + Y(6)], [7.5, foot - Y(3)], [6, foot - Y(0.5)], [0, foot]]);
    k.front(() => k.shape('leaf-wrap', pal.leather, [[0, shoulder + Y(2)], [2.5, shoulder + Y(2)], [2, waist], [0, waist + Y(3)]]));
    k.head(headY + Y(1), { ears: false, wide: 3.4, jaw: 2.8, chin: 3.8, point: 0, eyes: 1.8 });
    k.front(() => k.add({ type: 'path', name: 'beard', mat: pal.leather, shade: 'sphere', d: k.smooth([[cx - 1, headY + Y(2.5)], [cx + X(3) - 1, headY + Y(2)], [cx + X(2.5) - 1, headY + Y(6)], [cx - 1, headY + Y(8)], [cx - X(2.5) - 1, headY + Y(6)], [cx - X(3) - 1, headY + Y(2)]]) }));
    k.add({ type: 'path', name: 'bear-head', underlay: true, mat: pal.hair, shade: 'sphere',
      d: `M${cx - X(5.5)} ${headY + Y(3)} Q${cx - X(6)} ${headY - Y(7)} ${cx} ${headY - Y(7)} Q${cx + X(6)} ${headY - Y(7)} ${cx + X(5.5)} ${headY + Y(3)} Q${cx + X(4)} ${headY - Y(1)} ${cx + X(3)} ${headY - Y(1)} Q${cx} ${headY - Y(2.5)} ${cx - X(3)} ${headY - Y(1)} Q${cx - X(4)} ${headY - Y(1)} ${cx - X(5.5)} ${headY + Y(3)} Z` });
    k.add({ type: 'circle', name: 'ear', cx: cx - X(4.5), cy: headY - Y(7), r: X(1.6), mat: pal.hair, shade: 'sphere', mirrorX: cx, underlay: true });
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
