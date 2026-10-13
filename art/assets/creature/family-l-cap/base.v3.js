// family-l-cap base.v3 (r3, from base.v2) — ONE change, the reviewer's "robe is a straight boxy rectangle": the robe is
// tapered — narrow bony shoulders (half-width 5 -> 3.6, the arms set in to match), drawn in at the waist, then a
// curved flare to a ragged, uneven hem of tattered points about 2-3 px wider each side than v2's.
// family-l-cap base.v2 (r2, from base.v1) — ONE change, the reviewer's "reads as a helmeted knight, not a skull": the
// head is redrawn as a pale bone egg skull (a bone ramp built from the direction's own steps:
// skin lit for lit and mid, hair lit for shadow; the crown sits 1 px higher to bare more cranium) with a lit cranium,
// a narrow jaw, dark sockets each holding a 1 px burning point, and a clenched tooth line;
// both hands are bone too (were cloth gloves). The robe stays the dominant recoloured ramp.
// base.v1 (r1) — liches (glyph L, 1.9 m): a lich on the biped rig (art/lib/beast.v1.js): a skull with
// burning eye-points under a tall jagged crown, a tattered robe hanging off bony shoulders to the floor, a rib-cage
// glimpsed at the open front, a staff topped by a horned skull in the right hand and a bony hand raised casting. The
// robe is the recoloured ramp (recolour: leather).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-l-cap', pass: 'r3', notes: 'crowned skull, tattered robe, skull staff, casting hand', mirror: false, recolour: 'leather' };
const H = 1.9;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    const bone = [pal.skin[0], pal.skin[0], pal.hair[0]]; // ivory lit and mid, yellowed in shadow
    // the robe: narrow shoulders, drawn in at the waist, a curved flare to a ragged uneven hem (tattered points)
    const robe = [[0, shoulder - Y(1)], [3.6, shoulder], [4.2, shoulder + Y(4)], [4.1, waist], [5.2, waist + Y(5)], [7.4, foot - Y(3)], [9.4, foot - Y(0.2)],
      [7.6, foot - Y(1.9)], [6.2, foot + Y(0.3)], [4.4, foot - Y(1.6)], [2.4, foot + Y(0.1)], [0.6, foot - Y(1.3)], [-1.6, foot + Y(0.2)], [-3.4, foot - Y(1.8)],
      [-5.4, foot + Y(0.3)], [-6.8, foot - Y(1.4)], [-8.8, foot - Y(0.1)], [-7, foot - Y(3.2)], [-5, waist + Y(5)], [-4.1, waist], [-4.2, shoulder + Y(4)], [-3.6, shoulder]];
    k.add({ type: 'path', name: 'robe', underlay: true, mat: pal.leather, shade: 'normal', round: X(1), d: k.smooth(robe.map(([dx, y]) => [cx + X(dx), y])) });
    k.front(() => {
      k.add({ type: 'ellipse', name: 'chest-gap', cx: cx - 1, cy: shoulder + Y(4), rx: X(2), ry: Y(3.5), color: 'outline' });
      for (let i = 0; i < 3; i++) k.add({ type: 'rect', name: 'rib', x: cx - X(1.5) - 1, y: shoulder + Y(2 + i * 1.6), w: X(3), h: 1, mat: pal.cloth, shade: 'flat', band: 0 });
    });
    k.head(headY, { mat: bone, wide: 3.1, crown: 4.8, jaw: 1.2, chin: 4.2, point: 0.35, eyes: 1.6, eyeSize: 1.6, eye: 'outline', hair: bone, nose: false });
    k.front(() => {
      [-1.6, 1.6].forEach(e => k.add({ type: 'rect', name: 'eye-point', x: Math.round(cx + X(e) + k.turn), y: Math.round(headY), w: 1, h: 1, color: 'accent.0' }));
      k.add({ type: 'rect', name: 'nasal', x: Math.round(cx + k.turn), y: Math.round(headY + Y(1.8)), w: 1, h: 1, color: 'hair.1' });
      k.add({ type: 'rect', name: 'teeth', x: Math.round(cx - X(1.2) + k.turn), y: Math.round(headY + Y(3)), w: Math.round(X(2.4)), h: 1, color: 'hair.1' });
    });
    k.add({ type: 'path', name: 'crown', underlay: true, mat: pal.accent, shade: 'flat', band: 1, d: `M${cx - X(3.2)} ${headY - Y(4)} L${cx - X(3.6)} ${headY - Y(9)} L${cx - X(1.8)} ${headY - Y(6.4)} L${cx} ${headY - Y(10)} L${cx + X(1.8)} ${headY - Y(6.4)} L${cx + X(3.6)} ${headY - Y(9)} L${cx + X(3.2)} ${headY - Y(4)} Z` });
    k.off(() => {
      k.arm(1, pal.leather, R - X(1), shoulder - Y(1), { r: 1.4, glove: bone, wide: 3.8 });
      k.add({ type: 'star', name: 'cast', cx: R - X(0.5), cy: shoulder - Y(4.5), r: X(2.2), r2: X(0.8), n: 5, mat: pal.accent, shade: 'flat', band: 0 });
    });
    k.main(() => {
      k.pole(pal.leather, L, foot - Y(1), L - X(0.5), headY - Y(4), 0.7, 'staff');
      k.add({ type: 'circle', name: 'staff-skull', cx: L - X(0.5), cy: headY - Y(6), r: X(2), mat: pal.cloth, shade: 'sphere', underlay: true });
      for (const s of [-1, 1]) k.add({ type: 'tube', name: 'staff-horn', mat: pal.cloth, shade: 'flat', band: 1, pts: [[L - X(0.5) + s * X(1.5), headY - Y(7)], [L - X(0.5) + s * X(3.4), headY - Y(9)], [L - X(0.5) + s * X(3), headY - Y(11)]], w: X(1.2), w1: X(0.4) });
      k.arm(-1, pal.leather, L + X(0.5), waist - Y(3), { r: 1.4, glove: bone, wide: 3.8 });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.L + L.X(0.5), L.waist - L.Y(3)] });
