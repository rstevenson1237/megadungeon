// family-o-cap base.v1 (r1) — ogres (glyph O, 3.6 m, twice the player): an ogre on the biped rig
// (art/lib/beast.v1.js) at the large frame: a small head sunk between huge sloping shoulders, a heavy underbite with
// two stub tusks, a great hanging belly over a hide loincloth, thick short legs, and a knotted tree-limb club dragged in
// the right hand. The skin is the recoloured ramp (recolour: skin).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-o-cap', pass: 'r1', notes: 'ogre: small sunk head, huge shoulders, belly, tree-limb club', mirror: false, recolour: 'skin' };
const H = 3.6;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.legs(pal.skin, 3, 2.4); k.boots(pal.skin, 2.6, 1.4);
    k.shape('loincloth', pal.leather, [[0, waist], [5.4, waist], [5, knee - Y(1)], [0, knee]]);
    k.shape('body', pal.skin, [[0, shoulder - Y(2)], [6, shoulder - Y(1)], [7.4, shoulder + Y(2)], [6.6, waist - Y(2)], [5.4, waist + Y(1)], [0, waist + Y(1.5)]]);
    k.front(() => k.add({ type: 'ellipse', name: 'belly', cx: cx - X(0.5), cy: waist - Y(2), rx: X(4.4), ry: Y(4), mat: pal.skin, shade: 'sphere' }));
    k.add({ type: 'rect', name: 'rope', x: cx - X(5.4), y: waist + Y(0.2), w: X(10.8), h: Y(1), mat: pal.leather, shade: 'flat', band: 2 });
    k.off(() => k.arm(1, pal.skin, R, waist + Y(1), { r: 2.3, wide: 6.4, handR: 1.6 }));
    k.head(headY + Y(4), { mat: pal.skin, wide: 3, crown: 3.4, jaw: 2.6, chin: 3.8, point: 0, eyes: 1.4, eye: 'outline', hair: pal.skin });
    k.front(() => {
      k.add({ type: 'rect', name: 'brow', x: cx - X(2.6) + k.turn, y: headY + Y(3.4), w: X(5.2), h: Y(0.9), mat: pal.skin, shade: 'flat', band: 2 });
      for (const s of [-1, 1]) k.add({ type: 'rect', name: 'tusk', x: Math.round(cx + s * X(1.4) + k.turn), y: Math.round(headY + Y(6.2)), w: Math.round(X(0.8)), h: Math.round(Y(1.4)), mat: pal.cloth, shade: 'flat', band: 0 });
    });
    k.main(() => {
      k.arm(-1, pal.skin, L + X(1), waist + Y(1), { r: 2.3, wide: 6.4, handR: 1.6 });
      k.add({ type: 'tube', name: 'club', underlay: true, mat: pal.leather, shade: 'cyl', pts: [[L + X(1.5), waist], [L - X(1), knee], [L - X(3), k.foot - Y(1)]], w: X(1.8), w1: X(3.6) });
      for (const [dx, dy] of [[-2.4, -3], [-3.6, -1.4]]) k.add({ type: 'circle', name: 'knot', cx: L + X(dx), cy: k.foot + Y(dy), r: X(0.9), mat: pal.leather, shade: 'flat', band: 0 });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 4, eyes: 1.4, hand: L => [L.L + L.X(1), L.waist + L.Y(1)] });
