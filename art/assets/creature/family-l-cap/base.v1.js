// family-l-cap base.v1 (r1) — liches (glyph L, 1.9 m): a lich on the biped rig (art/lib/beast.v1.js): a skull with
// burning eye-points under a tall jagged crown, a tattered robe hanging off bony shoulders to the floor, a rib-cage
// glimpsed at the open front, a staff topped by a horned skull in the right hand and a bony hand raised casting. The
// robe is the recoloured ramp (recolour: leather).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-l-cap', pass: 'r1', notes: 'crowned skull, tattered robe, skull staff, casting hand', mirror: false, recolour: 'leather' };
const H = 1.9;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    k.add({ type: 'path', name: 'robe', underlay: true, mat: pal.leather, shade: 'normal', round: X(2), d: k.smooth([[cx, shoulder - Y(1)], [cx + X(5), shoulder], [cx + X(5.4), waist], [cx + X(7), foot - Y(0.5)], [cx + X(4), foot - Y(2)], [cx + X(2), foot], [cx - X(1), foot - Y(1.5)], [cx - X(4), foot], [cx - X(7), foot - Y(1)], [cx - X(5.4), waist], [cx - X(5), shoulder]]) });
    k.front(() => {
      k.add({ type: 'ellipse', name: 'chest-gap', cx: cx - 1, cy: shoulder + Y(4), rx: X(2), ry: Y(3.5), color: 'outline' });
      for (let i = 0; i < 3; i++) k.add({ type: 'rect', name: 'rib', x: cx - X(1.5) - 1, y: shoulder + Y(2 + i * 1.6), w: X(3), h: 1, mat: pal.cloth, shade: 'flat', band: 0 });
    });
    k.head(headY, { mat: pal.cloth, wide: 3, crown: 4.4, jaw: 1.6, chin: 3.8, point: 0.1, eyes: 1.5, eyeSize: 1.6, eye: 'outline', hair: pal.cloth, nose: false });
    k.front(() => [-1.5, 1.5].forEach(e => k.add({ type: 'rect', name: 'eye-point', x: Math.round(cx + X(e) + k.turn), y: Math.round(headY), w: 1, h: 1, color: 'accent.0' })));
    k.add({ type: 'path', name: 'crown', underlay: true, mat: pal.accent, shade: 'flat', band: 1, d: `M${cx - X(3.2)} ${headY - Y(3)} L${cx - X(3.6)} ${headY - Y(8)} L${cx - X(1.8)} ${headY - Y(5.4)} L${cx} ${headY - Y(9)} L${cx + X(1.8)} ${headY - Y(5.4)} L${cx + X(3.6)} ${headY - Y(8)} L${cx + X(3.2)} ${headY - Y(3)} Z` });
    k.off(() => {
      k.arm(1, pal.leather, R - X(1), shoulder - Y(1), { r: 1.4, glove: pal.cloth });
      k.add({ type: 'star', name: 'cast', cx: R - X(0.5), cy: shoulder - Y(4.5), r: X(2.2), r2: X(0.8), n: 5, mat: pal.accent, shade: 'flat', band: 0 });
    });
    k.main(() => {
      k.pole(pal.leather, L, foot - Y(1), L - X(0.5), headY - Y(4), 0.7, 'staff');
      k.add({ type: 'circle', name: 'staff-skull', cx: L - X(0.5), cy: headY - Y(6), r: X(2), mat: pal.cloth, shade: 'sphere', underlay: true });
      for (const s of [-1, 1]) k.add({ type: 'tube', name: 'staff-horn', mat: pal.cloth, shade: 'flat', band: 1, pts: [[L - X(0.5) + s * X(1.5), headY - Y(7)], [L - X(0.5) + s * X(3.4), headY - Y(9)], [L - X(0.5) + s * X(3), headY - Y(11)]], w: X(1.2), w1: X(0.4) });
      k.arm(-1, pal.leather, L + X(0.5), waist - Y(3), { r: 1.4, glove: pal.cloth });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.L + L.X(0.5), L.waist - L.Y(3)] });
