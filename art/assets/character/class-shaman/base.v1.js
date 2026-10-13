// class-shaman base.v1 (r1) — the Shaman on the shared player body (art/lib/person.v1.js), from the approved class
// probe: a carved oval mask under a fan of feathers, fur shoulders, a tunic and apron, a totem staff in the right hand
// (the class's spear: a blade under the totem head) and a flame in the open left hand.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-shaman', pass: 'r1', notes: 'probe shaman: mask, feathers, totem spear, flame', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    k.legs(pal.leather, 2.4, 1.6); k.boots(pal.leather);
    k.shape('tunic', pal.cloth, [[0, shoulder - Y(0.5)], [4.6, shoulder], [4.8, shoulder + Y(4)], [4.4, waist], [6, waist + Y(2.5)], [0, waist + Y(3)]]);
    k.front(() => k.shape('apron', pal.accent, [[0, waist], [3, waist], [2.5, waist + Y(5)], [0, waist + Y(6.5)]], { shade: 'flat', band: 1 }));
    k.add({ type: 'ellipse', name: 'furs', cx, cy: shoulder + Y(0.5), rx: X(7), ry: Y(2.5), mat: pal.hair, shade: 'sphere', underlay: true });
    k.add({ type: 'star', name: 'feathers', cx, cy: headY - Y(4), r: X(7), r2: X(3), n: 7, rot: -90, mat: pal.accent, shade: 'flat', band: 1, underlay: true });
    k.add({ type: 'ellipse', name: 'mask', cx, cy: headY + Y(0.5), rx: X(3.6), ry: Y(4.8), mat: k.back ? pal.hair : pal.leather, shade: 'sphere', underlay: true });
    k.front(() => {
      for (const e of [-1.6, 1.6]) k.add({ type: 'ellipse', name: 'mask-eye', cx: cx + X(e) - 1, cy: headY - Y(0.5), rx: X(0.9), ry: Y(0.7), color: 'outline' });
      k.add({ type: 'path', name: 'mask-mouth', color: 'outline', d: `M${cx - X(1.8) - 1} ${headY + Y(2.5)} Q${cx - 1} ${headY + Y(3.8)} ${cx + X(1.8) - 1} ${headY + Y(2.5)} Q${cx - 1} ${headY + Y(3)} ${cx - X(1.8) - 1} ${headY + Y(2.5)} Z` });
    });
    k.main(() => {
      k.add({ type: 'tube', name: 'totem', underlay: true, mat: pal.leather, shade: 'cyl', pts: [[L, foot - Y(1)], [L + X(0.4), waist], [L, headY - Y(6)]], w: X(1.4), w1: X(1.2) });
      k.add({ type: 'path', name: 'spear-head', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${L - X(1.2)} ${headY - Y(9.5)} L${L} ${headY - Y(14)} L${L + X(1.2)} ${headY - Y(9.5)} Z` });
      k.add({ type: 'ellipse', name: 'totem-head', cx: L, cy: headY - Y(7.5), rx: X(1.9), ry: Y(2.4), mat: pal.leather, shade: 'sphere' });
      k.arm(-1, pal.skin, L + X(1), waist - Y(4));
    });
    k.off(() => {
      k.arm(1, pal.skin, R - X(1), waist - Y(3));
      k.add({ type: 'path', name: 'flame', mat: pal.accent, shade: 'flat', band: 0, d: `M${R - X(2.5)} ${waist - Y(5)} Q${R - X(1)} ${waist - Y(10)} ${R + X(0.5)} ${waist - Y(12)} Q${R + X(1)} ${waist - Y(8)} ${R + X(0.5)} ${waist - Y(5)} Z` });
    });
  });
}
// the mask is the face: no face anchors
export const anchors = ctx => personAnchors(ctx, { face: false, hand: L => [L.L + L.X(1), L.waist - L.Y(4)] });
