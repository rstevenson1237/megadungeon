// family-k base.v4 (x1, from base.v3): the blind re-score's point - the front view turns three-quarter to the viewer
// (a 5 px muzzle angled down-left below two eyes, instead of a side profile), the pick drops to hip height (hand
// at the waist, its head well under the chin), and the torso is a curved pot-belly with a lighter belly plate.
// family-k base.v3 (r3, from base.v2): the head is redrawn in profile toward the facing (a round skull, a 6 px snout
// with a dark mouth line, one eye, two short swept-back horns), and the shoulder lid-shield blob is dropped.
// family-k base.v2 (r2, from base.v1): the pick is held lower, its hand at shoulder height and its head below the
// chin, so the head clears; the snout is a longer 3-4 px muzzle pointing toward the facing.
// family-k base.v1 (r1) — kobolds (glyph k, 1.0 m): a small dog-headed kobold on the biped rig
// (art/lib/beast.v1.js): a long snout, small horns, a scaly body in a loincloth, a long tail, a rusty pick held up in
// the right hand and a small round lid for a shield. The scales are the recoloured ramp (recolour: skin).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-k', pass: 'x1', notes: 'dog-snouted kobold, little horns, tail, pick', mirror: false, recolour: 'skin' };
const H = 1.0;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    k.worn(() => k.add({ type: 'tube', name: 'tail', underlay: true, mat: pal.skin, shade: 'cyl', pts: [[cx + X(2), waist + Y(1)], [cx + X(8), waist + Y(5)], [cx + X(11), foot - Y(1)]], w: X(3), w1: X(1) }));
    k.legs(pal.skin, 2.4, 1.7); k.boots(pal.skin, 2.3, 1.3);
    // a curved chest and pot-belly, with a lighter scaled belly plate down the middle
    k.shape('body', pal.skin, [[0, shoulder - Y(0.5)], [4, shoulder + Y(0.5)], [4.8, shoulder + Y(4)], [5.4, waist - Y(1)], [4.6, waist + Y(1.5)], [0, waist + Y(2.2)]]);
    if (!k.back) k.add({ type: 'ellipse', name: 'belly', mat: pal.skin, shade: 'flat', band: 0, cx: cx + k.turn * 0.5, cy: waist - Y(2.5), rx: X(2.6), ry: Y(4) });
    k.add({ type: 'rect', name: 'loincloth', x: cx - X(3.5), y: waist, w: X(7), h: Y(4), mat: pal.leather, shade: 'flat', band: 1 });
    k.off(() => k.arm(1, pal.skin, R - X(2), waist - Y(1), { r: 1.4 }));
    // the head in profile toward the facing: a round skull, a 6 px snout tapering forward with a dark mouth line, one
    // eye, two short horns swept back; from behind, the skull and horns, the snout's root showing past it
    // the head: from the front three-quarter to the viewer, a short muzzle angled down toward the facing below two eyes;
    // from behind, the skull and horns, the muzzle's root showing past it
    const hy = headY + Y(1), hx = cx + (k.back ? 0 : k.turn * 0.5);
    const snout = k.back
      ? { type: 'path', name: 'snout', underlay: true, mat: pal.skin, shade: 'normal', round: 1, d: k.smooth([[hx + 0.5, hy - 1.6], [hx - 1.5, hy - 1], [hx - 3, hy], [hx - 3, hy + 1.2], [hx - 1.5, hy + 1.8], [hx + 0.5, hy + 2]]) }
      : { type: 'path', name: 'snout', underlay: true, mat: pal.skin, shade: 'normal', round: 1, d: k.smooth([[hx + 0.5, hy - 0.2], [hx - 2.5, hy + 0.4], [hx - 4.8, hy + 1.8], [hx - 4.6, hy + 3.4], [hx - 1, hy + 3.8], [hx + 1.2, hy + 2.4]]) };
    if (k.back) k.add(snout);
    for (const [dx, band] of (k.back ? [[-1.6, 0], [1.6, 1]] : [[1.8, 1], [-1.4, 0]])) k.add({ type: 'poly', name: 'horn', underlay: true, mat: pal.leather, shade: 'flat', band, pts: [[hx + dx - 1, hy - 1.6], [hx + dx + 2.4, hy - 5], [hx + dx + 2.2, hy - 0.8]] });
    k.add({ type: 'ellipse', name: 'head', underlay: true, mat: pal.skin, shade: 'sphere', cx: hx + 0.6, cy: hy, rx: 2.8, ry: 2.5 });
    k.front(() => {
      k.add(snout);
      k.add({ type: 'rect', name: 'nose', x: Math.round(hx - 4.6), y: Math.round(hy + 1.6), w: 1, h: 1, color: 'outline' });
      k.add({ type: 'line', name: 'mouth', x0: hx - 3.6, y0: hy + 3.2, x1: hx + 0.6, y1: hy + 2.4, w: 1, color: 'outline' });
      for (const ex of [-1.4, 1.6]) k.add({ type: 'rect', name: 'eye', x: Math.round(hx + ex), y: Math.round(hy - 1), w: 1, h: 1, color: 'accent.1' });
    });
    k.main(() => {
      // the hand at the hip, the haft slanting down past the thigh and the pick's head at hip height, well under the chin
      const hx = L + X(3), hy = waist + Y(0.5), py = waist - Y(0.5);
      k.pole(pal.leather, L + X(5), foot - Y(4), L + X(0.5), py, 0.7, 'haft');
      k.arm(-1, pal.skin, hx, hy, { r: 1.4 });
      k.add({ type: 'path', name: 'pick', underlay: true, mat: pal.cloth, shade: 'bevel', d: `M${L - X(4.5)} ${py + Y(1.5)} Q${L} ${py - Y(3.5)} ${L + X(4.5)} ${py + Y(1.5)} Q${L} ${py - Y(1)} ${L - X(4.5)} ${py + Y(1.5)} Z` });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 1.5, hand: L => [L.L + L.X(3), L.waist + L.Y(0.5)] });
