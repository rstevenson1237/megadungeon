// family-o-cap base.v3 (r3, from base.v2) — face only: a heavier brow ridge (wider, ~1 px taller, a deeper shadow
// band under it) and the underbite jaw 2-3 px wider each side and 1 px deeper, so the face reads at 1x.
// family-o-cap base.v2 (r2, from base.v1) — face only: the 2 px eyes become 1 px dark eyes under a heavier brow
// ridge, and the jaw widens into an underbite with two 2 px cloth-ramp tusks jutting up from it (v1's tusks sat at
// eye height and read as pale blue eye squares).
// family-o-cap base.v1 (r1) — ogres (glyph O, 3.6 m, twice the player): an ogre on the biped rig
// (art/lib/beast.v1.js) at the large frame: a small head sunk between huge sloping shoulders, a heavy underbite with
// two stub tusks, a great hanging belly over a hide loincloth, thick short legs, and a knotted tree-limb club dragged in
// the right hand. The skin is the recoloured ramp (recolour: skin).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-o-cap', pass: 'r3', notes: 'ogre: small sunk head, huge shoulders, belly, tree-limb club', mirror: false, recolour: 'skin' };
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
    const hy = headY + Y(4), py = Y(0.5); // py: one pixel at this scale
    k.head(hy - py, { mat: pal.skin, wide: 3, crown: 3, jaw: 2.6, chin: 4.2, point: 0, eyes: 1.5, eyeSize: 0.5, eye: 'outline', hair: pal.skin });
    k.front(() => {
      const t = k.turn, ex = X(1.5);
      // a heavy brow ridge (lit on top) overhanging the eyes, with its shadow band at eye level
      k.add({ type: 'path', name: 'brow', mat: pal.skin, shade: 'flat', band: 0, d: k.smooth([[cx - X(3.9) + t, hy - py * 0.6], [cx - X(3) + t, hy - py * 4.4], [cx + t, hy - py * 3.4], [cx + X(3) + t, hy - py * 4.4], [cx + X(3.9) + t, hy - py * 0.6], [cx + t, hy - py * 1.2]]) });
      k.add({ type: 'rect', name: 'brow-shadow', x: Math.round(cx - X(3.2) + t), y: Math.round(hy - py), w: Math.round(X(6.4)), h: 1, mat: pal.skin, shade: 'flat', band: 2 });
      for (const e of [-ex, ex]) k.add({ type: 'rect', name: 'eye', x: Math.round(cx + e + t), y: Math.round(hy - py), w: 1, h: 1, color: 'outline' });
      // the underbite: a lower jaw wider than the face, jutting forward; its ink edge is the mouth
      k.add({ type: 'path', name: 'jaw', underlay: true, mat: pal.skin, shade: 'normal', round: X(1), d: k.smooth([[cx - X(4.6) + t, hy + py * 3.2], [cx + X(4.6) + t, hy + py * 3.2], [cx + X(4.2) + t, hy + py * 8], [cx + t, hy + py * 9.4], [cx - X(4.2) + t, hy + py * 8]]) });
      // two tusks from the lower jaw, jutting up past the lip
      for (const s of [-1, 1]) {
        const x = Math.round(cx + s * X(2.6) + t) - 1, y = Math.round(hy + py * 2);
        k.add({ type: 'rect', name: 'tusk', x, y, w: 2, h: 2, mat: pal.cloth, shade: 'flat', band: 0 });
        k.add({ type: 'rect', name: 'tusk', x: s < 0 ? x : x + 1, y: y - 1, w: 1, h: 1, mat: pal.cloth, shade: 'flat', band: 0 });
      }
    });
    k.main(() => {
      k.arm(-1, pal.skin, L + X(1), waist + Y(1), { r: 2.3, wide: 6.4, handR: 1.6 });
      k.add({ type: 'tube', name: 'club', underlay: true, mat: pal.leather, shade: 'cyl', pts: [[L + X(1.5), waist], [L - X(1), knee], [L - X(3), k.foot - Y(1)]], w: X(1.8), w1: X(3.6) });
      for (const [dx, dy] of [[-2.4, -3], [-3.6, -1.4]]) k.add({ type: 'circle', name: 'knot', cx: L + X(dx), cy: k.foot + Y(dy), r: X(0.9), mat: pal.leather, shade: 'flat', band: 0 });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 4, eyes: 1.4, hand: L => [L.L + L.X(1), L.waist + L.Y(1)] });
