// class-beastmaster base.v4 (r4) — from base.v3 (R12), one change, the hawk: redrawn on the raised gauntlet at the
// right shoulder in light ramps of its own (leather.0 body and head, hair.0 wing, each with its own ink underlay) so it
// parts from the olive pelt hood, with a 1 px grey hooked beak and a 1 px dark eye; its head sits a pixel further out.
// base.v3 header (r3) — from base.v2 (R12), one change, the head: the face is relit (a mid-skin face
// patch with light-skin nose and cheekbones under dark eyes) and the pelt cap is reshaped as a wolf-head hood: two ear
// points on top and a snout with a dark nose tip jutting over the brow (front views only).
// base.v2 header: from base.v1, one change: the tunic is reshaped from a straight-sided block into
// curved shoulders, a cinched waist and a flared, scalloped hem.
// base.v1 header: the Beastmaster on the shared player body (art/lib/person.v1.js): a wolf-pelt
// mantle over the shoulders, braided hair and a painted stripe across the eyes, a fringed leather tunic, a spear held
// upright in the right hand, a heavy gauntlet raised on the left arm with a hawk perched on it, wings half open, and a
// shortbow slung on the back.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-beastmaster', pass: 'r4', notes: 'wolf mantle, braids, spear, hawk on a raised gauntlet, bow on the back', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, foot, L, R } = k;
    k.worn(() => k.add({ type: 'arc', name: 'slung-bow', underlay: true, cx: cx - X(4), cy: shoulder + Y(2), r: X(8), w: X(1.1), a0: -60, a1: 40, mat: pal.leather, shade: 'flat', band: 0 }));
    k.legs(pal.leather, 2.4, 1.6); k.boots(pal.hair);
    k.shape('tunic', pal.leather, [[0, shoulder - Y(0.5)], [3.4, shoulder - Y(0.3)], [5.2, shoulder + Y(1.6)], [4.7, shoulder + Y(4.5)], [3.1, waist], [4.2, waist + Y(2)], [6.4, knee - Y(0.4)], [3.4, knee + Y(0.6)], [1.6, knee - Y(0.3)], [0, knee + Y(0.2)]]);
    k.add({ type: 'path', name: 'mantle', underlay: true, mat: pal.hair, shade: 'sphere', d: k.smooth([[cx - X(7), shoulder + Y(3)], [cx - X(6), shoulder - Y(1.5)], [cx, shoulder - Y(2)], [cx + X(6), shoulder - Y(1.5)], [cx + X(7), shoulder + Y(3)], [cx, shoulder + Y(2)]]) });
    // wolf-head hood: the ears stand up behind the head, the hood's back behind it, cap and snout over the brow
    for (const e of [-1, 1]) k.add({ type: 'path', name: 'hood-ear', underlay: true, mat: pal.hair, shade: 'flat', band: 1, d: `M${cx + e * X(1.2)} ${headY - Y(4.4)} L${cx + e * X(3)} ${headY - Y(8.4)} L${cx + e * X(4)} ${headY - Y(3.4)} Z` });
    k.add({ type: 'path', name: 'hood', underlay: true, mat: pal.hair, shade: 'flat', band: 1, d: k.smooth([[cx, headY - Y(5.6)], [cx + X(4.2), headY - Y(4)], [cx + X(4.4), headY + Y(2.5)], [cx + X(2.5), shoulder], [cx - X(2.5), shoulder], [cx - X(4.4), headY + Y(2.5)], [cx - X(4.2), headY - Y(4)]]) });
    k.head(headY, { wide: 3.3, crown: 4.4, jaw: 2, chin: 4.2, point: 0.2, eyes: 1.8, hair: pal.hair });
    k.front(() => {
      // the face relit: a mid-skin patch, light-skin nose ridge and cheekbones, dark eyes
      k.add({ type: 'ellipse', name: 'face', cx: cx - 1, cy: headY + Y(1.4), rx: X(2.3), ry: Y(2.8), mat: pal.skin, shade: 'flat', band: 1 });
      for (const e of [-1, 1]) {
        k.add({ type: 'rect', name: 'eye', x: Math.round(cx - 1 + e * X(1.8)), y: Math.round(headY), w: 1, h: 1, color: 'outline' });
        k.add({ type: 'rect', name: 'cheek', x: Math.round(cx - 1 + e * X(1.8)), y: Math.round(headY + Y(1.4)), w: 1, h: 1, color: 'skin.0' });
      }
      k.add({ type: 'rect', name: 'nose', x: Math.round(cx - 1), y: Math.round(headY), w: 1, h: Math.round(Y(2)), color: 'skin.0' });
      k.add({ type: 'rect', name: 'mouth', x: Math.round(cx - 2), y: Math.round(headY + Y(3)), w: 3, h: 1, color: 'skin.2' });
    });
    // the hood's cap over the crown, edged down to the brow
    k.add({ type: 'path', name: 'hood-cap', underlay: true, mat: pal.hair, shade: 'normal', round: X(2), d: k.smooth([[cx, headY - Y(5.6)], [cx + X(4.1), headY - Y(3.8)], [cx + X(4.3), headY + Y(1.5)], [cx + X(2.8), headY - Y(1.4)], [cx, headY - Y(2)], [cx - X(2.8), headY - Y(1.4)], [cx - X(4.3), headY + Y(1.5)], [cx - X(4.1), headY - Y(3.8)]]) });
    k.front(() => {
      k.add({ type: 'ellipse', name: 'snout', underlay: true, cx: cx - 1, cy: headY - Y(2.4), rx: X(1.7), ry: Y(1.4), mat: pal.hair, shade: 'flat', band: 0 });
      k.add({ type: 'rect', name: 'snout-nose', x: Math.round(cx - 2), y: Math.round(headY - Y(1.5)), w: 2, h: 1, color: 'outline' });
      for (const e of [-1, 1]) k.add({ type: 'rect', name: 'wolf-eye', x: Math.round(cx - 1 + e * X(2.4)), y: Math.round(headY - Y(3.2)), w: 1, h: 1, color: 'hair.0' });
    });
    for (const s of [-1, 1]) k.add({ type: 'capsule', name: 'braid', a: [cx + s * X(3.4), headY], b: [cx + s * X(3.6), shoulder + Y(2)], r: X(0.8), mat: pal.hair, shade: 'cyl' });
    k.front(() => k.add({ type: 'rect', name: 'warpaint', x: cx - X(3) - 1, y: headY - Y(0.6), w: X(6), h: 1, mat: pal.accent, shade: 'flat', band: 1 }));
    k.off(() => {
      k.arm(1, pal.leather, R - X(1), shoulder - Y(1), { r: 1.6, glove: pal.leather });
      // the hawk in light ramps of its own, so it parts from the olive hood: pale body, light wing, beak and eye
      k.add({ type: 'ellipse', name: 'hawk', cx: R - X(0.3), cy: shoulder - Y(4), rx: X(1.8), ry: Y(2.6), mat: pal.leather, shade: 'flat', band: 0, underlay: true });
      k.add({ type: 'path', name: 'wing', underlay: true, mat: pal.hair, shade: 'flat', band: 0, d: k.smooth([[R - X(0.6), shoulder - Y(4.5)], [R + X(3.5), shoulder - Y(8)], [R + X(4.5), shoulder - Y(5)], [R + X(1.2), shoulder - Y(2.5)]]) });
      k.add({ type: 'rect', name: 'wing-bar', x: Math.round(R + X(1.6)), y: Math.round(shoulder - Y(5.6)), w: 2, h: 1, color: 'hair.1' });
      k.add({ type: 'circle', name: 'hawk-head', cx: R - X(0.2), cy: shoulder - Y(7), r: X(1.3), mat: pal.leather, shade: 'flat', band: 0, underlay: true });
      k.add({ type: 'rect', name: 'hawk-eye', x: Math.round(R - X(0.6)), y: Math.round(shoulder - Y(7.4)), w: 1, h: 1, color: 'outline' });
      k.add({ type: 'rect', name: 'beak', x: Math.round(R - X(1.7)), y: Math.round(shoulder - Y(7)), w: 1, h: 1, color: 'metal.1' });
    });
    k.main(() => {
      k.pole(pal.leather, L, foot - Y(2), L - X(1), headY - Y(5), 0.6, 'spear');
      k.add({ type: 'path', name: 'spear-head', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${L - X(2.2)} ${headY - Y(4.5)} L${L - X(1.2)} ${headY - Y(10)} L${L} ${headY - Y(4.5)} Z` });
      k.arm(-1, pal.leather, L + X(0.5), waist - Y(2), { r: 1.4, glove: pal.leather });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.8, hand: L => [L.L + L.X(0.5), L.waist - L.Y(2)] });
