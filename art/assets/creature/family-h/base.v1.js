// family-h base.v1 (r1) — men and dwarves: acolytes, priests, mages, crossbowmen (glyph h, 1.8 m): a cultist of the
// deep on the biped rig (art/lib/beast.v1.js): a hooded cloak over a long tunic, a gaunt face, a crossbow held
// across the body. The cloak and tunic are the recoloured ramp (recolour: cloth), so a row's colour dresses him.
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-h', pass: 'r1', notes: 'hooded cultist in a long tunic, crossbow across', mirror: false, recolour: 'cloth' };
const H = 1.8;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, knee, L, R } = k;
    k.legs(pal.leather, 2.3, 1.5); k.boots(pal.leather);
    k.shape('cloak', pal.cloth, [[0, shoulder - Y(1)], [5.6, shoulder], [6.6, waist], [7, knee + Y(2)], [0, knee + Y(2.5)]]);
    k.front(() => k.shape('tunic', pal.cloth, [[0, shoulder + Y(1)], [3, shoulder + Y(1)], [3.4, waist], [3.8, knee + Y(1)], [0, knee + Y(1.5)]], { shade: 'flat', band: 0 }));
    k.add({ type: 'rect', name: 'belt', x: cx - X(4), y: waist - Y(0.5), w: X(8), h: Y(1.2), mat: pal.leather, shade: 'flat', band: 2 });
    k.head(headY + Y(0.5), { wide: 3, crown: 4.4, jaw: 1.5, chin: 4.4, point: 0.5, eyes: 1.6, hair: pal.cloth });
    k.add({ type: 'path', name: 'hood', underlay: true, mat: pal.cloth, shade: 'sphere', d: k.back ? k.smooth([[cx, headY - Y(6)], [cx + X(4.8), headY - Y(2)], [cx + X(5), shoulder + Y(1)], [cx - X(5), shoulder + Y(1)], [cx - X(4.8), headY - Y(2)]])
      : `M${cx - X(5)} ${shoulder + Y(1)} Q${cx - X(5.4)} ${headY - Y(6)} ${cx} ${headY - Y(6)} Q${cx + X(5.4)} ${headY - Y(6)} ${cx + X(5)} ${shoulder + Y(1)} L${cx + X(3.4)} ${shoulder} Q${cx + X(3.6)} ${headY - Y(3)} ${cx} ${headY - Y(3.4)} Q${cx - X(3.6)} ${headY - Y(3)} ${cx - X(3.4)} ${shoulder} Z` });
    k.off(() => k.arm(1, pal.cloth, cx + X(4), waist - Y(1.5), { glove: pal.leather }));
    k.main(() => {
      k.arm(-1, pal.cloth, cx - X(3), waist - Y(1.5), { glove: pal.leather });
      k.add({ type: 'capsule', name: 'stock', underlay: true, mat: pal.leather, shade: 'cyl', axis: 'x', a: [cx - X(8), waist - Y(2)], b: [cx + X(5), waist - Y(1.5)], r: X(1), r1: X(0.8) });
      k.add({ type: 'arc', name: 'prod', underlay: true, cx: cx - X(5), cy: waist - Y(2), r: X(5), w: X(1.2), a0: 120, a1: 240, mat: pal.leather, shade: 'flat', band: 0 });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 0.5, eyes: 1.6, hand: L => [L.cx - L.X(3), L.waist - L.Y(1.5)] });
