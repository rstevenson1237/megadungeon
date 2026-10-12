// family-m-cap base.v1 (r1) — mummies (glyph M, 1.8 m): a mummy on the biped rig (art/lib/beast.v1.js): wrapped from
// head to foot in bands of linen, loose strips trailing from the arms, one eye glowing through a gap in the wrappings,
// a broad collar of the old kings, both arms reaching forward. The linen is the recoloured ramp (recolour: cloth).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-m-cap', pass: 'r1', notes: 'banded linen wraps, trailing strips, one glowing eye, reaching arms', mirror: false, recolour: 'cloth' };
const H = 1.8;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k, c = pal.cloth;
    k.legs(c, 2.3, 1.7); k.boots(c, 2, 1.2);
    k.shape('body', c, [[0, shoulder - Y(0.5)], [4.6, shoulder], [4.6, shoulder + Y(4)], [4, waist], [4.2, waist + Y(2)], [0, waist + Y(2)]]);
    for (let i = 0; i < 6; i++) k.add({ type: 'rect', name: 'band', x: cx - X(4.4), y: shoulder + Y(1 + i * 2.2), w: X(8.8), h: 1, mat: c, shade: 'flat', band: 2, rotate: i % 2 ? 6 : -6, origin: [cx, shoulder + Y(1 + i * 2.2)] });
    k.add({ type: 'ellipse', name: 'collar', cx, cy: shoulder + Y(0.5), rx: X(5.4), ry: Y(2), mat: pal.accent, shade: 'cyl', axis: 'x', underlay: true });
    k.off(() => {
      k.arm(1, c, R - X(3), shoulder + Y(1.5), { r: 1.5 });
      k.add({ type: 'tube', name: 'strip', mat: c, shade: 'flat', band: 1, pts: [[R - X(4), shoulder + Y(2.5)], [R - X(3.5), waist], [R - X(2), waist + Y(4)]], w: X(1), w1: X(0.5) });
    });
    k.head(headY, { mat: c, wide: 3.2, crown: 4.6, jaw: 2, chin: 4.2, point: 0.2, eyes: 1.6, hair: c, nose: false, eye: 'outline' });
    k.front(() => {
      for (let i = 0; i < 3; i++) k.add({ type: 'rect', name: 'head-band', x: cx - X(3.2), y: headY - Y(3.5) + Y(i * 2.6), w: X(6.4), h: 1, mat: c, shade: 'flat', band: 2 });
      k.add({ type: 'rect', name: 'glow-eye', x: Math.round(cx - X(1.6) + k.turn), y: Math.round(headY), w: 1, h: 1, color: 'accent.0' });
    });
    k.main(() => {
      k.arm(-1, c, L, shoulder + Y(1.5), { r: 1.5 });
      k.add({ type: 'tube', name: 'strip', mat: c, shade: 'flat', band: 1, pts: [[L + X(1), shoulder + Y(2.5)], [L + X(1.5), waist], [L, waist + Y(5)]], w: X(1), w1: X(0.5) });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.L, L.shoulder + L.Y(1.5)] });
