// class-beastmaster base.v5 (x1) — from base.v4, the blind re-score's point, the body and the hawk: the dress-like
// tunic is split into a hip-length leather vest (belted, fringed hem) over dark cloth trousers, the wolf mantle gets
// a ragged fur fringe of pale tufts along its edge, and the hawk is redrawn as a clear upright perched silhouette on
// the raised fist (an inked teardrop body with a dark folded wing and pale breast, a round head with a hooked pale
// beak turned outward and a dark eye, a tail hanging below the fist).
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
export const meta = { brief: 'class-beastmaster', pass: 'x1', notes: 'wolf mantle, braids, spear, hawk on a raised gauntlet, bow on the back', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, foot, L, R } = k;
    k.worn(() => k.add({ type: 'arc', name: 'slung-bow', underlay: true, cx: cx - X(4), cy: shoulder + Y(2), r: X(8), w: X(1.1), a0: -60, a1: 40, mat: pal.leather, shade: 'flat', band: 0 }));
    k.legs(pal.cloth, 2.4, 1.6); k.boots(pal.hair);
    // a hip-length leather vest, belted, with a fringed hem, over the trousers
    k.shape('vest', pal.leather, [[0, shoulder - Y(0.5)], [3.4, shoulder - Y(0.3)], [5.2, shoulder + Y(1.6)], [4.7, shoulder + Y(4.5)], [3.6, waist], [4.4, waist + Y(2.6)], [0, waist + Y(3)]]);
    k.add({ type: 'rect', name: 'belt', x: Math.round(cx - X(3.6)), y: Math.round(waist - Y(0.6)), w: Math.round(X(7.2)), h: 1, color: 'leather.2' });
    for (const fx of [-3, -1, 1, 3]) k.add({ type: 'rect', name: 'fringe', x: Math.round(cx + X(fx) - 0.5), y: Math.round(waist + Y(3)), w: 1, h: 1, mat: pal.leather, shade: 'flat', band: 1 });
    k.add({ type: 'path', name: 'mantle', underlay: true, mat: pal.hair, shade: 'sphere', d: k.smooth([[cx - X(7), shoulder + Y(3)], [cx - X(6), shoulder - Y(1.5)], [cx, shoulder - Y(2)], [cx + X(6), shoulder - Y(1.5)], [cx + X(7), shoulder + Y(3)], [cx, shoulder + Y(2)]]) });
    // the pelt's ragged fur fringe along the mantle's edge
    for (const [fx, band] of [[-6.4, 0], [-4.4, 1], [-2.2, 0], [2.2, 0], [4.4, 1], [6.4, 0]]) k.add({ type: 'poly', name: 'fur', mat: pal.hair, shade: 'flat', band, pts: [[cx + X(fx - 1), shoulder + Y(Math.abs(fx) > 5 ? 2.6 : 1.6)], [cx + X(fx + 0.2), shoulder + Y(Math.abs(fx) > 5 ? 4.6 : 3.6)], [cx + X(fx + 1), shoulder + Y(Math.abs(fx) > 5 ? 2.6 : 1.6)]] });
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
      const hx = R + X(0.5), hy = shoulder - Y(1);
      k.arm(1, pal.leather, hx, hy, { r: 1.6, glove: pal.leather });
      // the hawk, perched upright on the fist: tail below, an inked teardrop body with a pale breast and a dark folded
      // wing, a round head with a hooked pale beak turned outward and a dark eye
      k.add({ type: 'poly', name: 'hawk-tail', underlay: true, mat: pal.leather, shade: 'flat', band: 2, pts: [[hx + X(0.4), hy - Y(0.5)], [hx + X(2.6), hy + Y(3.4)], [hx + X(1), hy + Y(3.8)]] });
      k.add({ type: 'path', name: 'hawk', underlay: true, mat: pal.leather, shade: 'flat', band: 1, d: k.smooth([[hx + X(0.8), hy - Y(7)], [hx + X(3.4), hy - Y(3.6)], [hx + X(1.4), hy + Y(0.6)], [hx - X(1.6), hy - Y(3.2)]]) });
      k.add({ type: 'ellipse', name: 'breast', cx: hx - X(0.3), cy: hy - Y(3.4), rx: X(0.8), ry: Y(1.8), color: 'hair.0' });
      k.add({ type: 'path', name: 'wing', mat: pal.leather, shade: 'flat', band: 2, d: k.smooth([[hx + X(1.4), hy - Y(5.6)], [hx + X(3.4), hy - Y(3.4)], [hx + X(1.8), hy + Y(0.2)], [hx + X(0.9), hy - Y(2.6)]]) });
      k.add({ type: 'circle', name: 'hawk-head', underlay: true, cx: hx + X(0.8), cy: hy - Y(8.4), r: X(2), mat: pal.leather, shade: 'flat', band: 1 });
      k.add({ type: 'rect', name: 'beak', x: Math.round(hx + X(2.6)), y: Math.round(hy - Y(8.6)), w: 2, h: 1, color: 'hair.0' });
      k.add({ type: 'rect', name: 'beak-hook', x: Math.round(hx + X(2.6)) + 1, y: Math.round(hy - Y(8.6)) + 1, w: 1, h: 1, color: 'hair.0' });
      k.add({ type: 'rect', name: 'hawk-eye', x: Math.round(hx + X(1.4)), y: Math.round(hy - Y(9)), w: 1, h: 1, color: 'outline' });
    });
    k.main(() => {
      k.pole(pal.leather, L, foot - Y(2), L - X(1), headY - Y(5), 0.6, 'spear');
      k.add({ type: 'path', name: 'spear-head', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${L - X(2.2)} ${headY - Y(4.5)} L${L - X(1.2)} ${headY - Y(10)} L${L} ${headY - Y(4.5)} Z` });
      k.arm(-1, pal.leather, L + X(0.5), waist - Y(2), { r: 1.4, glove: pal.leather });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.8, hand: L => [L.L + L.X(0.5), L.waist - L.Y(2)] });
