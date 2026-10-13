// class-mage base.v2 (r2) — from base.v1, one change: the robe tapers at the waist and flares to a curved hem with
// three vertical fold highlights, and the staff is a thin 1-px pole (no underlay) so it stays a clean line when swung.
// base.v1 header: the Mage on the shared player body (art/lib/person.v1.js): a tall pointed hat with a
// drooping tip and a narrow brim, a long plain robe with wide sleeves and a rope belt, a white beard on a lean face, a
// quarterstaff with a knotted head in the right hand and the left hand open, a spark over the palm.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-mage', pass: 'r2', notes: 'tall pointed hat, waisted robe with flared hem and folds, beard, thin knotted staff', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    k.shape('robe', pal.cloth, [[0, shoulder - Y(0.5)], [4.4, shoulder], [4.6, shoulder + Y(3)], [3.4, waist], [4.4, waist + Y(4)], [6.4, foot - Y(2.5)], [7.2, foot - Y(0.6)], [3.5, foot + Y(0.3)], [0, foot - Y(0.4)]]);
    for (const [dx, top, bot] of [[-2.6, 2.5, 1.2], [0.4, 2, 0.8], [3.2, 3, 1.4]]) k.add({ type: 'rect', name: 'fold', x: Math.round(cx + X(dx)), y: Math.round(waist + Y(top)), w: 1, h: Math.round(foot - Y(bot) - (waist + Y(top))), color: 'cloth.0' });
    k.add({ type: 'capsule', name: 'rope-belt', a: [cx - X(4.6), waist], b: [cx + X(4.6), waist], r: X(0.6), mat: pal.leather, shade: 'cyl', axis: 'x' });
    k.head(headY, { wide: 3, crown: 4.6, jaw: 1.4, chin: 4.6, point: 0.4, eyes: 1.6, hair: pal.cloth });
    k.front(() => k.add({ type: 'path', name: 'beard', mat: pal.metal, shade: 'sphere', d: k.smooth([[cx - X(2.6) - 1, headY + Y(1.6)], [cx + X(2.6) - 1, headY + Y(1.6)], [cx + X(1.8) - 1, headY + Y(6)], [cx - 1, headY + Y(8.5)], [cx - X(1.8) - 1, headY + Y(6)]]) }));
    k.add({ type: 'ellipse', name: 'brim', cx, cy: headY - Y(2.8), rx: X(5.4), ry: Y(1.4), mat: pal.cloth, shade: 'normal', round: X(1), underlay: true });
    k.add({ type: 'path', name: 'hat', underlay: true, mat: pal.cloth, shade: 'normal', round: X(1.5), d: `M${cx - X(3.6)} ${headY - Y(3)} Q${cx - X(2)} ${headY - Y(9)} ${cx + X(1)} ${headY - Y(12.5)} Q${cx + X(4)} ${headY - Y(13)} ${cx + X(5)} ${headY - Y(10.5)} Q${cx + X(2.4)} ${headY - Y(10.5)} ${cx + X(2.2)} ${headY - Y(8)} Q${cx + X(3)} ${headY - Y(5)} ${cx + X(3.6)} ${headY - Y(3)} Z` });
    k.add({ type: 'rect', name: 'hat-band', x: cx - X(3.4), y: headY - Y(4.4), w: X(6.8), h: Y(1.2), mat: pal.accent, shade: 'flat', band: 1 });
    k.main(() => {
      k.add({ type: 'capsule', name: 'staff', mat: pal.leather, shade: 'flat', band: 1, a: [L, foot - Y(1)], b: [L - X(0.5), headY - Y(5)], r: X(0.5) });
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
