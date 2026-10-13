// family-k base.v1 (r1) — kobolds (glyph k, 1.0 m): a small dog-headed kobold on the biped rig
// (art/lib/beast.v1.js): a long snout, small horns, a scaly body in a loincloth, a long tail, a rusty pick held up in
// the right hand and a small round lid for a shield. The scales are the recoloured ramp (recolour: skin).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-k', pass: 'r1', notes: 'dog-snouted kobold, little horns, tail, pick, lid shield', mirror: false, recolour: 'skin' };
const H = 1.0;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    k.worn(() => k.add({ type: 'tube', name: 'tail', underlay: true, mat: pal.skin, shade: 'cyl', pts: [[cx + X(2), waist + Y(1)], [cx + X(8), waist + Y(5)], [cx + X(11), foot - Y(1)]], w: X(3), w1: X(1) }));
    k.legs(pal.skin, 2.4, 1.7); k.boots(pal.skin, 2.3, 1.3);
    k.shape('body', pal.skin, [[0, shoulder], [4.6, shoulder + Y(1)], [4.4, waist], [4, waist + Y(2)], [0, waist + Y(2)]]);
    k.add({ type: 'rect', name: 'loincloth', x: cx - X(3.5), y: waist, w: X(7), h: Y(4), mat: pal.leather, shade: 'flat', band: 1 });
    k.off(() => {
      k.arm(1, pal.skin, R - X(2), waist - Y(1), { r: 1.4 });
      k.add({ type: 'circle', name: 'lid', cx: R - X(1.5), cy: waist - Y(1.5), r: X(3.4), mat: pal.cloth, shade: 'sphere', underlay: true });
    });
    k.head(headY + Y(1.5), { mat: pal.skin, wide: 3.8, crown: 4.4, jaw: 2.6, chin: 3, point: 0, eyes: 2, eyeSize: 1.2, eye: 'accent.1', hair: pal.skin, nose: false });
    for (const s of [-1, 1]) k.add({ type: 'poly', name: 'horn', underlay: true, mat: pal.leather, shade: 'flat', band: 0, pts: [[cx + s * X(1.5), headY - Y(2)], [cx + s * X(3.4), headY - Y(6)], [cx + s * X(3), headY - Y(2)]] });
    k.front(() => k.add({ type: 'capsule', name: 'snout', underlay: true, mat: pal.skin, shade: 'cyl', a: [cx + k.turn, headY + Y(2.5)], b: [cx + k.turn - X(4), headY + Y(4.5)], r: X(2), r1: X(1.4) }));
    k.main(() => {
      k.arm(-1, pal.skin, L + X(1.5), waist - Y(2), { r: 1.4 });
      k.pole(pal.leather, L + X(1.5), waist - Y(1), L, headY - Y(1), 0.7, 'haft');
      k.add({ type: 'path', name: 'pick', underlay: true, mat: pal.cloth, shade: 'bevel', d: `M${L - X(5)} ${headY + Y(1)} Q${L} ${headY - Y(4)} ${L + X(5)} ${headY + Y(1)} Q${L} ${headY - Y(1.5)} ${L - X(5)} ${headY + Y(1)} Z` });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 1.5, hand: L => [L.L + L.X(1.5), L.waist - L.Y(2)] });
