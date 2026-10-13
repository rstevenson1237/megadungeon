// family-k-cap base.v1 (r1) — death knights and dread lords (glyph K, 2 m): a death knight on the biped rig
// (art/lib/beast.v1.js) at the large frame: blackened plate (boxy, as plate may be) with spiked pauldrons, a horned
// great helm with a burning slit, a tattered cape, and a two-handed greatsword held point down before him. The armour
// is the recoloured ramp (recolour: cloth).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-k-cap', pass: 'r1', notes: 'death knight: spiked plate, horned helm with burning slit, greatsword', mirror: false, recolour: 'cloth' };
const H = 2;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, foot, L, R, P } = k, m = pal.cloth;
    k.worn(() => k.add({ type: 'path', name: 'cape', underlay: true, mat: pal.leather, shade: 'normal', round: X(1.5), d: `M${cx - X(6)} ${shoulder} H${cx + X(6)} L${cx + X(7)} ${foot - Y(2)} L${cx + X(4)} ${foot - Y(4)} L${cx + X(1)} ${foot - Y(1.5)} L${cx - X(2)} ${foot - Y(4)} L${cx - X(5)} ${foot - Y(2)} L${cx - X(7)} ${foot - Y(3)} Z` }));
    P.feet.forEach((dy, i) => k.add({ type: 'rect', name: 'greave', underlay: true, mat: m, shade: 'bevel', x: i ? k.baseCx + X(1) : k.baseCx - X(4.2), y: waist, w: X(3.2), h: foot - waist + dy }));
    k.add({ type: 'path', name: 'plate', underlay: true, mat: m, shade: 'normal', round: X(1.5), d: `M${cx - X(6)} ${shoulder} H${cx + X(6)} L${cx + X(5)} ${waist + Y(2)} H${cx - X(5)} Z` });
    k.add({ type: 'rect', name: 'faulds', x: cx - X(5), y: waist + Y(1), w: X(10), h: Y(3), mat: m, shade: 'flat', band: 1 });
    for (const s of [-1, 1]) {
      k.add({ type: 'circle', name: 'pauldron', cx: cx + s * X(6.2), cy: shoulder + Y(0.5), r: X(2.8), mat: m, shade: 'sphere', underlay: true });
      k.add({ type: 'poly', name: 'spike', mat: m, shade: 'flat', band: 0, pts: [[cx + s * X(5.4), shoulder - Y(1.6)], [cx + s * X(7), shoulder - Y(5)], [cx + s * X(7.4), shoulder - Y(1.2)]] });
    }
    k.add({ type: 'rect', name: 'helm', x: cx - X(3.8), y: headY - Y(5), w: X(7.6), h: Y(9), r: X(1.5), mat: m, shade: 'cyl', underlay: true });
    for (const s of [-1, 1]) k.add({ type: 'tube', name: 'horn', underlay: true, mat: pal.hair, shade: 'cyl', pts: [[cx + s * X(3.4), headY - Y(3)], [cx + s * X(6), headY - Y(5)], [cx + s * X(6.4), headY - Y(9)]], w: X(1.8), w1: X(0.6) });
    k.front(() => k.add({ type: 'rect', name: 'slit', x: cx - X(2.8) + k.turn, y: headY, w: X(5.6), h: 1, color: 'accent.1' }));
    k.main(() => {
      k.arm(-1, m, cx - X(1.5), waist - Y(1), { r: 1.6, wide: 5.5 });
      k.arm(1, m, cx + X(1.5), waist - Y(1), { r: 1.6, wide: 5.5 });
      k.add({ type: 'path', name: 'greatsword', underlay: true, mat: pal.cloth, shade: 'bevel', d: `M${cx - X(1)} ${waist} L${cx - X(1.2)} ${foot - Y(2)} L${cx} ${foot} L${cx + X(1.2)} ${foot - Y(2)} L${cx + X(1)} ${waist} Z` });
      k.add({ type: 'capsule', name: 'crossguard', a: [cx - X(4), waist - Y(0.2)], b: [cx + X(4), waist - Y(0.2)], r: X(0.7), mat: pal.hair, shade: 'cyl', axis: 'x' });
      k.pole(pal.leather, cx, waist - Y(1), cx, waist - Y(4), 0.6, 'grip');
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.cx - L.X(1.5), L.waist - L.Y(1)] });
