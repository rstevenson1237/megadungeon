// class-warlock base.v4 (r4) — from base.v3, ONE change (review: the n/w back views still showed a pink face, nose and
// cheeks, under the hood, so facing was lost): from behind, the whole head oval down to the chin is filled with the
// hood's dark cloth (hair ramp, darkest step) with a 1 px rim of the middle step along its lit upper-left edge, so no
// skin shows in the back views.
//
// class-warlock base.v3 (r3) — from base.v2, ONE change (review: the big curled ram horns made two round discs beside
// the head, so the head read as a mouse or goggled face): the horns are halved and curl tight against the temples,
// staying within a pixel or two of the cranium's edge and ending above cheek height.
//
// class-warlock base.v2 (r2) — from base.v1, ONE change (review: the two tall straight horns read as rabbit ears):
// the horns are redrawn as short ram horns that leave the temples, rise at most a pixel or two over the cranium and
// curl outward and down beside the head, ending in a point turned back in at cheek height (metal ramp).
//
// base.v1 (r1) — the Warlock on the shared player body (art/lib/person.v1.js): two curled horns rising
// from a swept-back mane, a gaunt face, a long dark coat with split tails and a chain of sigils across the chest, a
// curved dagger in the right hand and an eldritch flame hovering over the left palm.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-warlock', pass: 'r4', notes: 'small ram horns curled tight to the temples, long split coat, sigil chain, dagger, hovering flame', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, foot, L, R } = k;
    k.legs(pal.leather, 2.1, 1.4); k.boots(pal.leather);
    k.shape('coat', pal.hair, [[0, shoulder - Y(0.5)], [4.8, shoulder], [4.6, waist], [6.2, foot - Y(2)], [3, foot - Y(3.5)], [1.4, knee], [0, knee]]);
    k.front(() => k.add({ type: 'tube', name: 'sigil-chain', mat: pal.metal, shade: 'flat', band: 0, pts: [[cx - X(4), shoulder + Y(1)], [cx, shoulder + Y(4)], [cx + X(4), waist - Y(1)]], w: X(0.8) }));
    k.add({ type: 'path', name: 'mane', underlay: true, mat: pal.hair, shade: 'sphere', d: k.smooth([[cx - X(3.6), headY - Y(3)], [cx, headY - Y(5.4)], [cx + X(4), headY - Y(3.6)], [cx + X(5), headY + Y(3)], [cx + X(3.6), shoulder], [cx - X(3.6), shoulder], [cx - X(5), headY + Y(3)]]) });
    k.head(headY, { wide: 2.8, crown: 4.6, jaw: 1.3, chin: 4.8, point: 0.7, eyes: 1.5 });
    // from behind: the hood's dark cloth over the whole head oval (no skin), with a 1 px lit rim at the upper left
    k.rear(() => {
      const wd = X(3.0), cr = Y(4.8), jw = X(1.5), ch = Y(5), y = headY;
      const oval = r => k.smooth([[cx, y - cr * r], [cx + wd * r, y - cr * 0.85 * r], [cx + wd * 0.97 * r, y + Y(1)], [cx + jw * r, y + ch * 0.85], [cx + jw * 0.25, y + ch], [cx - jw * 0.25, y + ch], [cx - jw * r, y + ch * 0.85], [cx - wd * 0.97 * r, y + Y(1)], [cx - wd * r, y - cr * 0.85 * r]]);
      k.add({ type: 'path', name: 'hood-back', underlay: true, mat: pal.hair, shade: 'flat', band: 2, d: oval(1) });
      k.add({ type: 'arc', name: 'hood-rim', cx: cx + X(0.4), cy: y + Y(0.2), r: X(2.6), w: X(0.9), a0: 190, a1: 260, mat: pal.hair, shade: 'flat', band: 1 });
    });
    for (const s of [-1, 1]) k.add({ type: 'tube', name: 'horn', underlay: true, mat: pal.metal, shade: 'cyl', pts: [[cx + s * X(1.8), headY - Y(3.6)], [cx + s * X(2.9), headY - Y(4.9)], [cx + s * X(3.9), headY - Y(3.9)], [cx + s * X(3.8), headY - Y(2.4)], [cx + s * X(3.1), headY - Y(1.8)]], w: X(1.3), w1: X(0.4) });
    k.main(() => {
      k.arm(-1, pal.hair, L + X(1.5), waist, { r: 1.4 });
      k.add({ type: 'path', name: 'kris', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${L + X(1)} ${waist} Q${L - X(1.5)} ${waist + Y(2)} ${L - X(1)} ${waist + Y(5)} Q${L + X(0.5)} ${waist + Y(2.5)} ${L + X(2.2)} ${waist + Y(0.4)} Z` });
    });
    k.off(() => {
      k.arm(1, pal.hair, R - X(1.5), waist - Y(3), { r: 1.4 });
      k.add({ type: 'path', name: 'flame', mat: pal.accent, shade: 'flat', band: 1, d: k.smooth([[R - X(1.5), waist - Y(4.5)], [R - X(3), waist - Y(7)], [R - X(1.4), waist - Y(11)], [R + X(0.4), waist - Y(8)], [R + X(1.4), waist - Y(6)]]) });
      k.add({ type: 'ellipse', name: 'flame-core', cx: R - X(1.4), cy: waist - Y(6.5), rx: X(0.9), ry: Y(1.6), mat: pal.accent, shade: 'flat', band: 0 });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.5, hand: L => [L.L + L.X(1.5), L.waist] });
