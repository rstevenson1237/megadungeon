// class-warrior base.v4 (r4) — from base.v3, one change (base.v3's review): the head is repainted. Front (s/e): the
// face under the helm is a skin egg in two flat steps (mid skin, the up-left half lit), a 1-px eye either side of the
// nasal on one row, and the beard cut back to a short dark jaw beard below the mouth, so the face no longer reads as an
// olive smear. Back (n/w): the head below the helm is the hair ramp's dark step with a mid-step lit up-left edge,
// so it reads as hair, not an olive blob.
// class-warrior base.v3 (r3) — from base.v2, one change (the review's next change): the back views (n/w) and the
// jerkin. From behind, the head under the helm is a mass of hair (hair ramp mid, a lit up-left edge, no sphere
// shading's dark face mask or olive highlight speckle) over the neck; and the jerkin is filled with the leather ramp's
// mid step, with a light band at the up-left shoulder and the dark step kept to a thin right edge and below the belt,
// so it is no longer a near-black slab.
// class-warrior base.v2 (r2) — from base.v1, one change (the review's next change): the jerkin tapers 2 px each side
// to the waist and is shaded in three flat leather bands (light top-left, mid, dark right and below); belt kept.
// base.v1 (r1) — the Warrior on the shared player body (art/lib/person.v1.js): a conical nasal helm
// over a short beard, a leather jerkin with one iron pauldron and a mail skirt, a long sword held up in the right hand
// and a round shield with an iron boss on the left arm. Silhouette: the helm's point, the raised blade, the disc.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-warrior', pass: 'r4', notes: 'nasal helm, jerkin and pauldron, long sword, round shield', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, knee, L, R } = k;
    k.legs(pal.cloth, 2.4, 1.6); k.boots(pal.leather);
    k.shape('mail-skirt', pal.metal, [[0, waist - Y(1)], [4.6, waist - Y(1)], [5.2, knee - Y(1)], [0, knee - Y(0.5)]], { shade: 'flat', band: 1 });
    k.neck();
    // jerkin: broad at the shoulders, tapered 2 px each side to the waist, flaring a little below the belt
    const jd = k.sym([[0, shoulder - Y(0.5)], [5, shoulder], [5.2, shoulder + Y(3)], [2.6, waist - Y(0.5)], [3.4, waist + Y(1.5)], [0, waist + Y(2)]]);
    k.add({ type: 'path', name: 'jerkin', underlay: true, mat: pal.leather, shade: 'flat', band: 1, d: jd });
    k.add({ type: 'group', name: 'jerkin-bands', clip: { type: 'path', d: jd }, children: [
      { type: 'poly', name: 'jerkin-light', pts: [[cx - X(7), shoulder - Y(1)], [cx + X(1.5), shoulder - Y(1)], [cx + X(1.5), shoulder + Y(0.6)], [cx - X(2.5), shoulder + Y(2.2)], [cx - X(3.2), waist - Y(1)], [cx - X(7), waist - Y(1)]], mat: pal.leather, shade: 'flat', band: 0 },
      { type: 'poly', name: 'jerkin-dark', pts: [[cx + X(4.2), shoulder + Y(1)], [cx + X(8), shoulder + Y(1)], [cx + X(8), waist + Y(3)], [cx - X(6), waist + Y(3)], [cx - X(6), waist + Y(0.8)], [cx + X(2), waist - Y(0.5)]], mat: pal.leather, shade: 'flat', band: 2 },
    ] });
    k.add({ type: 'rect', name: 'belt', x: cx - X(3), y: waist - Y(0.5), w: X(6), h: Y(1.3), mat: pal.leather, shade: 'flat', band: 2 });
    k.head(headY, { wide: 3.2, crown: 4.4, jaw: 2, chin: 4.2, point: 0.2 });
    // from behind: the back of the head is hair (mid step, lit along its up-left edge) down to the nape, no face
    k.rear(() => {
      const hd = k.smooth([[cx - X(3.3), headY - Y(1)], [cx + X(3.3), headY - Y(1)], [cx + X(3), headY + Y(2)], [cx + X(1.6), headY + Y(3.6)], [cx - X(1.6), headY + Y(3.6)], [cx - X(3), headY + Y(2)]]);
      k.add({ type: 'path', name: 'back-hair-mass', underlay: true, mat: pal.hair, shade: 'flat', band: 2, d: hd });
      k.add({ type: 'group', name: 'back-hair-lit', clip: { type: 'path', d: hd }, children: [
        { type: 'rect', name: 'back-hair-light', x: cx - X(4), y: headY - Y(1), w: X(1.8), h: Y(3), mat: pal.hair, shade: 'flat', band: 1 },
      ] });
    });
    // from the front: the face, a skin egg in two flat steps, eyes either side of the nasal
    k.front(() => {
      const fd = k.smooth([[cx - X(3.1), headY - Y(1)], [cx + X(3.1), headY - Y(1)], [cx + X(3), headY + Y(1.5)], [cx + X(1.8), headY + Y(4)], [cx - X(0.5), headY + Y(4.6)], [cx - X(2.4), headY + Y(3.6)], [cx - X(3), headY + Y(1.5)]]);
      k.add({ type: 'path', name: 'face', underlay: true, mat: pal.skin, shade: 'flat', band: 1, d: fd });
      k.add({ type: 'group', name: 'face-lit', clip: { type: 'path', d: fd }, children: [
        { type: 'poly', name: 'face-light', pts: [[cx - X(4), headY - Y(1)], [cx - X(1), headY - Y(1)], [cx - X(1), headY + Y(1)], [cx - X(2), headY + Y(3)], [cx - X(4), headY + Y(3)]], mat: pal.skin, shade: 'flat', band: 0 },
      ] });
      for (const ex of [cx - 3, cx + 1]) k.add({ type: 'rect', name: 'eye', x: Math.round(ex), y: Math.round(headY + Y(1)), w: 1, h: 1, color: 'outline' });
    });
    k.front(() => k.add({ type: 'path', name: 'beard', mat: pal.hair, shade: 'flat', band: 2, d: k.smooth([[cx - X(2.4), headY + Y(3)], [cx + X(2.2), headY + Y(3)], [cx + X(1.4), headY + Y(5)], [cx - X(0.4), headY + Y(5.6)], [cx - X(1.8), headY + Y(4.8)]]) }));
    k.add({ type: 'path', name: 'helm', underlay: true, mat: pal.metal, shade: 'sphere', d: k.smooth([[cx, headY - Y(8)], [cx + X(2), headY - Y(5)], [cx + X(3.8), headY - Y(1.5)], [cx + X(3.6), headY - Y(0.4)], [cx - X(3.6), headY - Y(0.4)], [cx - X(3.8), headY - Y(1.5)], [cx - X(2), headY - Y(5)]]) });
    k.front(() => k.add({ type: 'rect', name: 'nasal', x: Math.round(cx - 1), y: headY - Y(1), w: 1, h: Y(2.6), mat: pal.metal, shade: 'flat', band: 0 }));
    k.add({ type: 'ellipse', name: 'pauldron', cx: cx - X(5.4), cy: shoulder + Y(0.8), rx: X(2.6), ry: Y(2), mat: pal.metal, shade: 'sphere', underlay: true });
    k.off(() => {
      k.arm(1, pal.leather, R - X(2), waist - Y(2), { glove: pal.leather });
      k.add({ type: 'circle', name: 'shield', cx: R - X(1), cy: waist - Y(3), r: X(4.6), mat: pal.leather, shade: 'sphere', underlay: true });
      k.add({ type: 'ring', name: 'shield-rim', cx: R - X(1), cy: waist - Y(3), r: X(4.2), w: X(0.8), mat: pal.metal, shade: 'flat', band: 1 });
      k.add({ type: 'circle', name: 'boss', cx: R - X(1), cy: waist - Y(3), r: X(1.3), mat: pal.metal, shade: 'sphere' });
    });
    k.main(() => {
      k.arm(-1, pal.leather, L + X(1.5), waist - Y(1), { glove: pal.leather });
      k.add({ type: 'path', name: 'blade', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${L + X(0.6)} ${waist - Y(2)} L${L - X(1.2)} ${headY - Y(3)} L${L - X(1.6)} ${headY - Y(5.5)} L${L - X(0.2)} ${headY - Y(3.2)} L${L + X(2)} ${waist - Y(2.4)} Z` });
      k.add({ type: 'capsule', name: 'guard', a: [L - X(1.2), waist - Y(1.4)], b: [L + X(3.6), waist - Y(2.8)], r: X(0.7), mat: pal.leather, shade: 'cyl' });
    });
  });
}

export const anchors = ctx => personAnchors(ctx, { hand: L => [L.L + X(L, 1.5), L.waist - L.Y(1)] });
const X = (L, v) => L.X(v);
