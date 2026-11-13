// boss-the-hollow-abbot base.v2 (r2, shape draft) — from base.v1, redrawn after the owner rejected the shape ("an odd column
// with holes") and at the new boss height 2.1 m. A solid robed silhouette: broad mantle shoulders, a robe flaring to the floor
// with no gaps, a tall pointed cowl, ragged wraps trailing from both sleeves, a crook staff held out to the side clear of the
// body and a censer on a short chain held out on the other side. Flat materials, no proc layers.
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'boss-the-hollow-abbot', pass: 'r2', notes: 'shape draft v2: broad mantle, solid robe, pointed cowl, trailing wraps, staff and censer held clear, 2.1 m', mirror: false };
const H = 1.85; // rig scale: the pointed cowl and crook add to the 2.1 m total
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k, c = pal.cloth;
    const sway = k.P.walking ? (k.P.feet[0] > 0 ? 1 : k.P.feet[0] < 0 ? -1 : 0) : 0;
    // the robe: solid, from the broad shoulders to the floor
    k.shape('robe', c, [[0, shoulder - Y(1)], [5.6, shoulder], [5.8, shoulder + Y(4)], [4.8, waist], [6.4, waist + Y(4)], [7.6, foot + Y(1)], [0, foot + Y(1)]]);
    k.add({ type: 'rect', name: 'hem', x: cx - X(7.6) + sway, y: foot - Y(0.5), w: X(15.2), h: Math.max(1, Y(1.3)), mat: pal.accent, shade: 'flat', band: 2 });
    k.add({ type: 'rect', name: 'sash', x: cx - X(4.8), y: waist - Y(1), w: X(9.6), h: Math.max(1, Y(1.2)), mat: pal.leather, shade: 'flat', band: 2 });
    // the mantle: wide shoulders
    k.add({ type: 'ellipse', name: 'mantle', cx, cy: shoulder + Y(1), rx: X(7), ry: Y(2.6), mat: c, shade: 'cyl', axis: 'x', underlay: true });
    // the off arm: held out to the side with a censer on a chain, and a ragged wrap trailing
    k.off(() => {
      k.arm(1, c, R + X(1), shoulder + Y(4), { r: 1.7, wide: 6 });
      k.add({ type: 'tube', name: 'wrap', mat: c, shade: 'flat', band: 1, pts: [[R - X(1), shoulder + Y(5)], [R, waist - Y(2)], [R - X(1.5), waist + Y(4)]], w: X(1.3), w1: X(0.6) });
      k.add({ type: 'tube', name: 'chain', mat: pal.metal, shade: 'flat', band: 1, pts: [[R + X(1), shoulder + Y(5)], [R + X(1), shoulder + Y(9)]], w: X(0.5), w1: X(0.5) });
      k.add({ type: 'circle', name: 'censer', cx: R + X(1), cy: shoulder + Y(11), r: X(2.2), mat: pal.metal, shade: 'sphere', underlay: true });
    });
    // the pointed cowl over a gaunt face
    k.head(headY, { mat: pal.skin, wide: 3, crown: 4.2, jaw: 1.8, chin: 4.2, point: 0.35, eyes: 1.5, hair: c, nose: false, eye: 'outline' });
    k.front(() => k.add({ type: 'path', name: 'cowl', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[cx, headY - Y(7.5)], [cx + X(2.4), headY - Y(3.5)], [cx + X(4.4), headY + Y(3)], [cx + X(2), headY + Y(5)], [cx - X(2), headY + Y(5)], [cx - X(4.4), headY + Y(3)], [cx - X(2.4), headY - Y(3.5)]]) }));
    k.rear(() => k.add({ type: 'path', name: 'cowl-back', mat: c, shade: 'sphere', d: k.smooth([[cx, headY - Y(7.5)], [cx + X(2.6), headY - Y(3.5)], [cx + X(4.6), headY + Y(3)], [cx + X(2.6), headY + Y(6)], [cx - X(2.6), headY + Y(6)], [cx - X(4.6), headY + Y(3)], [cx - X(2.6), headY - Y(3.5)]]) }));
    // the crook staff, held out clear of the body
    k.main(() => {
      const sx = L - X(3);
      k.arm(-1, c, sx, shoulder + Y(4), { r: 1.7, wide: 6 });
      k.add({ type: 'tube', name: 'wrap', mat: c, shade: 'flat', band: 1, pts: [[L + X(1), shoulder + Y(5)], [L, waist - Y(2)], [L + X(1), waist + Y(5)]], w: X(1.3), w1: X(0.6) });
      k.pole(pal.leather, sx, foot - Y(0.5), sx, headY - Y(4), 0.9, 'staff');
      k.add({ type: 'ellipse', name: 'crook', cx: sx + X(2), cy: headY - Y(4), rx: X(2.4), ry: Y(2.4), mat: pal.metal, shade: 'cyl', axis: 'x', underlay: true });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.L - L.X(3), L.shoulder + L.Y(4)] });
