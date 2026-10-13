// family-k base.v3 (r3, from base.v2): the head is redrawn in profile toward the facing (a round skull, a 6 px snout
// with a dark mouth line, one eye, two short swept-back horns), and the shoulder lid-shield blob is dropped.
// family-k base.v2 (r2, from base.v1): the pick is held lower, its hand at shoulder height and its head below the
// chin, so the head clears; the snout is a longer 3-4 px muzzle pointing toward the facing.
// family-k base.v1 (r1) — kobolds (glyph k, 1.0 m): a small dog-headed kobold on the biped rig
// (art/lib/beast.v1.js): a long snout, small horns, a scaly body in a loincloth, a long tail, a rusty pick held up in
// the right hand and a small round lid for a shield. The scales are the recoloured ramp (recolour: skin).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-k', pass: 'r3', notes: 'dog-snouted kobold, little horns, tail, pick', mirror: false, recolour: 'skin' };
const H = 1.0;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    k.worn(() => k.add({ type: 'tube', name: 'tail', underlay: true, mat: pal.skin, shade: 'cyl', pts: [[cx + X(2), waist + Y(1)], [cx + X(8), waist + Y(5)], [cx + X(11), foot - Y(1)]], w: X(3), w1: X(1) }));
    k.legs(pal.skin, 2.4, 1.7); k.boots(pal.skin, 2.3, 1.3);
    k.shape('body', pal.skin, [[0, shoulder], [4.6, shoulder + Y(1)], [4.4, waist], [4, waist + Y(2)], [0, waist + Y(2)]]);
    k.add({ type: 'rect', name: 'loincloth', x: cx - X(3.5), y: waist, w: X(7), h: Y(4), mat: pal.leather, shade: 'flat', band: 1 });
    k.off(() => k.arm(1, pal.skin, R - X(2), waist - Y(1), { r: 1.4 }));
    // the head in profile toward the facing: a round skull, a 6 px snout tapering forward with a dark mouth line, one
    // eye, two short horns swept back; from behind, the skull and horns, the snout's root showing past it
    const hy = headY + Y(1), hx = cx + (k.back ? 0 : k.turn * 0.5), sn = k.back ? 3 : 6.5;
    const snout = { type: 'path', name: 'snout', underlay: true, mat: pal.skin, shade: 'normal', round: 1, d: k.smooth([[hx + 0.5, hy - 1.6], [hx - sn * 0.5, hy - 1], [hx - sn, hy], [hx - sn, hy + 1.2], [hx - sn * 0.5, hy + 1.8], [hx + 0.5, hy + 2]]) };
    if (k.back) k.add(snout);
    for (const [dx, band] of (k.back ? [[-1.6, 0], [1.6, 1]] : [[1.8, 1], [-0.6, 0]])) k.add({ type: 'poly', name: 'horn', underlay: true, mat: pal.leather, shade: 'flat', band, pts: [[hx + dx - 1, hy - 1.6], [hx + dx + 3, hy - 5], [hx + dx + 2.2, hy - 0.8]] });
    k.add({ type: 'ellipse', name: 'head', underlay: true, mat: pal.skin, shade: 'sphere', cx: hx + 0.8, cy: hy, rx: 2.6, ry: 2.4 });
    k.front(() => {
      k.add(snout);
      k.add({ type: 'line', name: 'mouth', x0: hx - sn + 0.5, y0: hy + 1.2, x1: hx + 0.5, y1: hy + 1.4, w: 1, color: 'outline' });
      k.add({ type: 'rect', name: 'eye', x: Math.round(hx), y: Math.round(hy - 1), w: 1, h: 1, color: 'accent.1' });
    });
    k.main(() => {
      // the hand at shoulder height, the haft running down past the hip and the pick's head just under the chin
      const hx = L + X(2.5), hy = shoulder + Y(1.5), py = shoulder + Y(3);
      k.pole(pal.leather, L + X(4.5), waist + Y(3), L + X(0.5), py - Y(1), 0.7, 'haft');
      k.arm(-1, pal.skin, hx, hy, { r: 1.4 });
      k.add({ type: 'path', name: 'pick', underlay: true, mat: pal.cloth, shade: 'bevel', d: `M${L - X(5)} ${py + Y(1)} Q${L} ${py - Y(4)} ${L + X(5)} ${py + Y(1)} Q${L} ${py - Y(1.5)} ${L - X(5)} ${py + Y(1)} Z` });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 1.5, hand: L => [L.L + L.X(2.5), L.shoulder + L.Y(1.5)] });
