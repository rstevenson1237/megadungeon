// class-mage base.v1 (r1) — the Mage on the shared player body (art/lib/person.v1.js): a tall pointed hat with a
// drooping tip and a narrow brim, a long plain robe with wide sleeves and a rope belt, a white beard on a lean face, a
// quarterstaff with a knotted head in the right hand and the left hand open, a spark over the palm.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-mage', pass: 'r1', notes: 'tall pointed hat, wide-sleeved robe, beard, knotted staff', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    k.shape('robe', pal.cloth, [[0, shoulder - Y(0.5)], [4.4, shoulder], [4.8, waist], [6.5, foot - Y(1.5)], [6, foot - Y(0.3)], [0, foot]]);
    k.add({ type: 'capsule', name: 'rope-belt', a: [cx - X(4.6), waist], b: [cx + X(4.6), waist], r: X(0.6), mat: pal.leather, shade: 'cyl', axis: 'x' });
    k.head(headY, { wide: 3, crown: 4.6, jaw: 1.4, chin: 4.6, point: 0.4, eyes: 1.6, hair: pal.cloth });
    k.front(() => k.add({ type: 'path', name: 'beard', mat: pal.metal, shade: 'sphere', d: k.smooth([[cx - X(2.6) - 1, headY + Y(1.6)], [cx + X(2.6) - 1, headY + Y(1.6)], [cx + X(1.8) - 1, headY + Y(6)], [cx - 1, headY + Y(8.5)], [cx - X(1.8) - 1, headY + Y(6)]]) }));
    k.add({ type: 'ellipse', name: 'brim', cx, cy: headY - Y(2.8), rx: X(5.4), ry: Y(1.4), mat: pal.cloth, shade: 'normal', round: X(1), underlay: true });
    k.add({ type: 'path', name: 'hat', underlay: true, mat: pal.cloth, shade: 'normal', round: X(1.5), d: `M${cx - X(3.6)} ${headY - Y(3)} Q${cx - X(2)} ${headY - Y(9)} ${cx + X(1)} ${headY - Y(12.5)} Q${cx + X(4)} ${headY - Y(13)} ${cx + X(5)} ${headY - Y(10.5)} Q${cx + X(2.4)} ${headY - Y(10.5)} ${cx + X(2.2)} ${headY - Y(8)} Q${cx + X(3)} ${headY - Y(5)} ${cx + X(3.6)} ${headY - Y(3)} Z` });
    k.add({ type: 'rect', name: 'hat-band', x: cx - X(3.4), y: headY - Y(4.4), w: X(6.8), h: Y(1.2), mat: pal.accent, shade: 'flat', band: 1 });
    k.main(() => {
      k.pole(pal.leather, L, foot - Y(1), L - X(0.5), headY - Y(5), 0.7, 'staff');
      k.add({ type: 'circle', name: 'knot', cx: L - X(0.5), cy: headY - Y(6), r: X(1.7), mat: pal.leather, shade: 'sphere', underlay: true });
      k.add({ type: 'capsule', name: 'sleeve', underlay: true, mat: pal.cloth, shade: 'cyl', a: [cx - X(4.4), shoulder + Y(1.2)], b: [L + X(1.6), waist - Y(3)], r: X(1.7), r1: X(2.3) });
      k.add({ type: 'circle', name: 'hand', cx: L + X(0.6), cy: waist - Y(3), r: X(1.1), mat: pal.skin, shade: 'sphere' });
    });
    k.off(() => {
      k.add({ type: 'capsule', name: 'sleeve', underlay: true, mat: pal.cloth, shade: 'cyl', a: [cx + X(4.4), shoulder + Y(1.2)], b: [R - X(1.5), waist - Y(2)], r: X(1.7), r1: X(2.3) });
      k.add({ type: 'circle', name: 'hand', cx: R - X(0.6), cy: waist - Y(2.6), r: X(1.1), mat: pal.skin, shade: 'sphere' });
      k.add({ type: 'star', name: 'spark', cx: R - X(0.4), cy: waist - Y(6), r: X(1.8), r2: X(0.6), n: 4, mat: pal.accent, shade: 'flat', band: 0 });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.6, hand: L => [L.L + L.X(0.6), L.waist - L.Y(3)] });
