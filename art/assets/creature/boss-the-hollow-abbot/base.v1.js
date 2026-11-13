// boss-the-hollow-abbot base.v1 (r1, shape draft) — The Hollow Abbot, a slow undead caster (ivory), 1.8 m, on the biped rig
// (art/lib/beast.v1.js). Silhouette only, flat materials, no proc layers: a tall pointed cowl, a long bell-shaped monastic
// robe that hides the legs and flares to the floor, wide hanging sleeves, a gaunt hollow face, and a tall crook staff in the
// main hand topped by a hanging lantern ring. The figure reads taller and narrower than the plain mummy, with a pointed
// head and a vertical staff that rises above it.
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'boss-the-hollow-abbot', pass: 'r1', notes: 'shape draft: pointed cowl, bell robe, wide sleeves, tall crook staff', mirror: false };
const H = 1.8;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k, c = pal.cloth;
    // the robe: a bell from the shoulders to the floor, the feet only peeping out; it sways a pixel with the stride
    const sway = k.P.walking ? (k.P.feet[0] > 0 ? 1 : k.P.feet[0] < 0 ? -1 : 0) : 0;
    k.shape('robe', c, [[0, shoulder - Y(1)], [4.4, shoulder], [4.8, shoulder + Y(4)], [4.4, waist], [6, waist + Y(4)], [7.4, foot - Y(0.5)], [0, foot - Y(0.5)]]);
    k.add({ type: 'rect', name: 'hem', x: cx - X(7.4) + sway, y: foot - Y(1.8), w: X(14.8), h: Math.max(1, Y(1.3)), mat: pal.accent, shade: 'flat', band: 2 });
    k.add({ type: 'rect', name: 'sash', x: cx - X(4.6), y: waist - Y(1), w: X(9.2), h: Math.max(1, Y(1.2)), mat: pal.leather, shade: 'flat', band: 2 });
    // the off arm hangs in a wide bell sleeve
    k.off(() => {
      k.arm(1, c, R - X(2), waist + Y(1), { r: 1.7, hand: false });
      k.add({ type: 'path', name: 'sleeve', underlay: true, mat: c, shade: 'cyl', d: k.smooth([[R - X(5), shoulder + Y(2)], [R - X(0.5), waist - Y(1)], [R + X(0.5), waist + Y(5)], [R - X(4.5), waist + Y(5)], [R - X(5.5), shoulder + Y(5)]]) });
    });
    // the pointed cowl: a tall hood over a gaunt, dark-hollowed face
    k.head(headY, { mat: pal.skin, wide: 3, crown: 4.2, jaw: 1.8, chin: 4.2, point: 0.35, eyes: 1.5, hair: c, nose: false, eye: 'outline' });
    k.front(() => k.add({ type: 'path', name: 'cowl', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[cx, headY - Y(3)], [cx + X(3.6), headY - Y(2.5)], [cx + X(4.2), headY + Y(3)], [cx + X(2), headY + Y(5)], [cx - X(2), headY + Y(5)], [cx - X(4.2), headY + Y(3)], [cx - X(3.6), headY - Y(2.5)]]) }));
    k.rear(() => k.add({ type: 'path', name: 'cowl-back', mat: c, shade: 'sphere', d: k.smooth([[cx, headY - Y(3)], [cx + X(3.8), headY - Y(2.5)], [cx + X(4.4), headY + Y(3)], [cx + X(2.4), headY + Y(6)], [cx - X(2.4), headY + Y(6)], [cx - X(4.4), headY + Y(3)], [cx - X(3.8), headY - Y(2.5)]]) }));
    // the tall crook staff, rising to the cowl with a hanging lantern ring
    k.main(() => {
      k.arm(-1, c, L - X(1), shoulder + Y(3), { r: 1.7 });
      k.pole(pal.leather, L - X(1), foot - Y(0.5), L - X(1), headY - Y(1.5), 0.8, 'staff');
      k.add({ type: 'ellipse', name: 'crook', cx: L - X(1) + X(1.8), cy: headY - Y(1.5), rx: X(2.2), ry: Y(2.2), mat: pal.metal, shade: 'cyl', axis: 'x', underlay: true });
      k.add({ type: 'circle', name: 'lantern', cx: L - X(1) + X(3.6), cy: headY - Y(1), r: X(1.5), mat: pal.glow, shade: 'sphere', underlay: true });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.L, L.shoulder + L.Y(3)] });
