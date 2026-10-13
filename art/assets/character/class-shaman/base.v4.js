// class-shaman base.v4 (r4, from base.v3) — ONE change: the mask is carved bone, not a skin face. In front views it is
// flat on the hair ramp's pale step (bone) with a hair.1 shadow crescent along the jaw, two 2x2 dark eye-holes and a
// carved brow ridge line above them; from behind the head is dark hair (hair.2) crossed by the mask's leather strap,
// so the olive patch that read as a second face is gone.
// class-shaman base.v3 (r3, from base.v2) — ONE change: the flat orange apron disc on the belly is gone; a hanging pelt
// (leather ramp, tapered to a ragged tail) on a fetish cord with two small charms hangs there instead, and the free
// (left) arm bends at the elbow — upper arm down and out, forearm up — ending in a small hand under the flame.
// class-shaman base.v2 (r2, from base.v1) — ONE change: the face and chest no longer read as near-black holes. The
// mask face is on the skin ramp (was leather) with 2 px eyes and a skin-shadow jaw edge, and the fur collar over the
// chest is on the leather ramp (was hair, whose dark step read as outline-black).
// base.v1 (r1) — the Shaman on the shared player body (art/lib/person.v1.js), from the approved class
// probe: a carved oval mask under a fan of feathers, fur shoulders, a tunic and apron, a totem staff in the right hand
// (the class's spear: a blade under the totem head) and a flame in the open left hand.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-shaman', pass: 'r4', notes: 'probe shaman: mask, feathers, totem spear, flame', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    k.legs(pal.leather, 2.4, 1.6); k.boots(pal.leather);
    k.shape('tunic', pal.cloth, [[0, shoulder - Y(0.5)], [4.6, shoulder], [4.8, shoulder + Y(4)], [4.4, waist], [6, waist + Y(2.5)], [0, waist + Y(3)]]);
    k.front(() => {
      // the fetish cord across the hips, a pelt hanging from it (ragged tail) and two small charms
      k.add({ type: 'capsule', name: 'cord', mat: pal.leather, shade: 'flat', band: 2, a: [cx - X(4.4), waist - Y(0.5)], b: [cx + X(4.4), waist + Y(0.5)], r: X(0.45) });
      k.add({ type: 'path', name: 'pelt', underlay: true, mat: pal.leather, shade: 'normal', d: k.smooth([[cx - X(2.2), waist], [cx + X(1.6), waist + Y(0.3)], [cx + X(1.9), waist + Y(3)], [cx + X(1.2), waist + Y(5.5)], [cx + X(0.3), waist + Y(4.6)], [cx - X(0.4), waist + Y(6.6)], [cx - X(1.2), waist + Y(4.8)], [cx - X(2), waist + Y(5.6)], [cx - X(2.4), waist + Y(2.5)]]) });
      k.add({ type: 'capsule', name: 'charm-cord', mat: pal.leather, shade: 'flat', band: 2, a: [cx + X(3), waist + Y(0.3)], b: [cx + X(3.2), waist + Y(3.2)], r: X(0.35) });
      k.add({ type: 'circle', name: 'charm', cx: cx + X(3.2), cy: waist + Y(3.6), r: X(0.7), mat: pal.metal, shade: 'sphere' });
      k.add({ type: 'circle', name: 'charm2', cx: cx - X(3.4), cy: waist + Y(1.8), r: X(0.6), mat: pal.accent, shade: 'flat', band: 1 });
    });
    k.add({ type: 'ellipse', name: 'furs', cx, cy: shoulder + Y(0.5), rx: X(7), ry: Y(2.5), mat: pal.leather, shade: 'cyl', axis: 'y', underlay: true });
    k.add({ type: 'star', name: 'feathers', cx, cy: headY - Y(4), r: X(7), r2: X(3), n: 7, rot: -90, mat: pal.accent, shade: 'flat', band: 1, underlay: true });
    if (k.back) {
      // the back of the head: dark hair, crossed by the mask's strap
      k.add({ type: 'ellipse', name: 'back-hair', cx, cy: headY + Y(0.5), rx: X(3.6), ry: Y(4.8), mat: pal.hair, shade: 'flat', band: 2, underlay: true });
      k.add({ type: 'rect', name: 'strap', x: Math.round(cx - X(3.6)), y: Math.round(headY - Y(0.4)), w: Math.round(X(7.2)), h: 1, color: 'leather.1' });
    } else {
      // the bone mask: pale and flat, a shadow crescent along the jaw, a carved brow, 2x2 eye-holes and a mouth slit
      k.add({ type: 'ellipse', name: 'mask', cx, cy: headY + Y(0.5), rx: X(3.6), ry: Y(4.8), mat: pal.hair, shade: 'flat', band: 0, underlay: true });
      k.add({ type: 'path', name: 'jaw', color: 'hair.1', d: `M${cx - X(3.2) - 1} ${headY + Y(1.8)} Q${cx - 1} ${headY + Y(6.2)} ${cx + X(3.2) - 1} ${headY + Y(1.8)} Q${cx - 1} ${headY + Y(5)} ${cx - X(3.2) - 1} ${headY + Y(1.8)} Z` });
      k.add({ type: 'rect', name: 'brow', x: Math.round(cx - X(2.8) - 1), y: Math.round(headY - Y(3.2)), w: Math.round(X(6)), h: 1, color: 'hair.1' });
      for (const e of [-1.8, 1.4]) k.add({ type: 'rect', name: 'mask-eye', x: Math.round(cx + X(e) - 1), y: Math.round(headY - Y(1.2)), w: 2, h: 2, color: 'outline' });
      k.add({ type: 'path', name: 'mask-mouth', color: 'outline', d: `M${cx - X(1.8) - 1} ${headY + Y(2.5)} Q${cx - 1} ${headY + Y(3.8)} ${cx + X(1.8) - 1} ${headY + Y(2.5)} Q${cx - 1} ${headY + Y(3)} ${cx - X(1.8) - 1} ${headY + Y(2.5)} Z` });
    }
    k.main(() => {
      k.add({ type: 'tube', name: 'totem', underlay: true, mat: pal.leather, shade: 'cyl', pts: [[L, foot - Y(1)], [L + X(0.4), waist], [L, headY - Y(6)]], w: X(1.4), w1: X(1.2) });
      k.add({ type: 'path', name: 'spear-head', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${L - X(1.2)} ${headY - Y(9.5)} L${L} ${headY - Y(14)} L${L + X(1.2)} ${headY - Y(9.5)} Z` });
      k.add({ type: 'ellipse', name: 'totem-head', cx: L, cy: headY - Y(7.5), rx: X(1.9), ry: Y(2.4), mat: pal.leather, shade: 'sphere' });
      k.arm(-1, pal.skin, L + X(1), waist - Y(4));
    });
    k.off(() => {
      // the free arm bent at the elbow: the upper arm down and out to the elbow, the forearm up to a small open hand
      const sh = [cx + X(5), shoulder + Y(1.2)], el = [cx + X(7.6), waist - Y(1)], hd = [cx + X(7.4), waist - Y(5.6)];
      k.add({ type: 'capsule', name: 'upper-arm', underlay: true, mat: pal.skin, shade: 'cyl', a: sh, b: el, r: X(1.2), r1: X(1.05) });
      k.add({ type: 'capsule', name: 'forearm', underlay: true, mat: pal.skin, shade: 'cyl', a: el, b: hd, r: X(1), r1: X(0.85) });
      k.add({ type: 'ellipse', name: 'hand', cx: hd[0], cy: hd[1] - Y(0.4), rx: X(0.9), ry: Y(0.8), mat: pal.skin, shade: 'sphere' });
      k.add({ type: 'path', name: 'flame', mat: pal.accent, shade: 'flat', band: 0, d: `M${hd[0] - X(1.3)} ${hd[1] - Y(1)} Q${hd[0] - X(0.6)} ${hd[1] - Y(4.5)} ${hd[0] + X(0.4)} ${hd[1] - Y(6)} Q${hd[0] + X(1)} ${hd[1] - Y(3.5)} ${hd[0] + X(1.1)} ${hd[1] - Y(1)} Z` });
    });
  });
}
// the mask is the face: no face anchors
export const anchors = ctx => personAnchors(ctx, { face: false, hand: L => [L.L + L.X(1), L.waist - L.Y(4)] });
