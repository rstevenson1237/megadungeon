// class-illusionist base.v5 (x1) — from base.v4 (best so far), the blind reviewer's change: the face and headgear and
// the held props, so the Illusionist stops reading as a cyclops mask and stops copying the Sorcerer. The accent ring
// round the face is gone: a readable skin face (two eyes, brow, nose) sits in a rounded cowl whose sides drape out onto
// the shoulders as a short mantle (no tall bullet peak from the back), and a cloth veil covers the face below the nose.
// The raised prism and the low dagger go: the left hand holds a hand mirror out at chest height, the right hand is open
// low at the side with three illusion motes drifting off its fingers.
// class-illusionist base.v4 (r4) — from base.v3 (best so far), one change: the robe flares — below a slightly nipped
// waist its lower third widens about 2px each side in a curve down to a wider hem band (hem trim widened to match), so
// the coat is a bell, not a straight-sided rectangle.
// class-illusionist base.v3 (r3) — from base.v2 (best so far), one change: the robe body, cowl and sleeves move off the
// saturated accent red onto the muted leather ramp; accent red stays only for the prism mote, its spark and a thin trim
// along the coat's hem and the cowl's face edge.
// class-illusionist base.v2 (r2) — from base.v1, the review's one next change: the head's slate turban and white
// half-mask (read as a bowl helm and goggle band) become a soft red cowl in the coat's ramp, open on a lit skin face with
// its jaw, and the coat's straight trapezoid hem flares out in a curve.
// base.v1: the Illusionist on the shared player body (art/lib/person.v1.js).
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-illusionist', pass: 'x1', notes: 'draped cowl-mantle, veiled readable face, hand mirror, open hand with motes', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.legs(pal.leather, 2, 1.4); k.boots(pal.leather);
    k.shape('coat', pal.leather, [[0, shoulder - Y(0.5)], [4.4, shoulder], [3.6, waist - Y(1)], [4.4, waist + Y(2.5)], [6.6, knee + Y(0.5)], [10.4, knee + Y(3.6)], [8.4, knee + Y(4.6)], [3, knee + Y(3)], [0, knee + Y(4)]]);
    k.add({ type: 'tube', name: 'hem-trim', mat: pal.accent, shade: 'flat', band: 1, pts: [[cx - X(9.6), knee + Y(3.7)], [cx - X(8.2), knee + Y(4.3)], [cx - X(3), knee + Y(2.9)], [cx, knee + Y(3.8)], [cx + X(3), knee + Y(2.9)], [cx + X(8.2), knee + Y(4.3)], [cx + X(9.6), knee + Y(3.7)]], w: 1 });
    k.front(() => k.shape('shirt', pal.cloth, [[0, shoulder + Y(1)], [1.6, shoulder + Y(1)], [2.4, knee], [0, knee + Y(1)]], { shade: 'flat', band: 1 }));
    const hy = headY + Y(0.5);
    k.head(hy, { wide: 3, crown: 4.4, jaw: 1.5, chin: 4.6, point: 0.6, eyes: 1.6, hair: pal.leather });
    // the cowl: a round crown close over the head, its sides falling out onto the shoulders as a short draped mantle
    const cowl = { type: 'path', d: k.smooth([[cx, headY - Y(5)], [cx + X(4.4), headY - Y(4.4)], [cx + X(4.8), headY + Y(1)], [cx + X(6.4), shoulder - Y(0.4)], [cx + X(8.4), shoulder + Y(3)], [cx + X(3), shoulder + Y(3.8)], [cx, shoulder + Y(3)], [cx - X(3), shoulder + Y(3.8)], [cx - X(8.4), shoulder + Y(3)], [cx - X(6.4), shoulder - Y(0.4)], [cx - X(4.8), headY + Y(1)], [cx - X(4.4), headY - Y(4.4)]]) };
    const face = { type: 'ellipse', cx: cx - 1, cy: headY + Y(1.6), rx: X(3), ry: Y(4) };
    k.add({ type: 'subtract', name: 'cowl', underlay: true, mat: pal.leather, shade: 'sphere', shapes: k.back ? [cowl] : [cowl, face] });
    k.front(() => {
      // the face inside the cowl: an egg of skin drawn over the hood's shadowed opening, the brow lit, two eyes, a nose
      const fx = cx - 1, fy = headY + Y(0.6);
      k.add({ type: 'path', name: 'face', mat: pal.skin, shade: 'sphere', d: k.smooth([[fx, fy - Y(3)], [fx + X(2.4), fy - Y(2)], [fx + X(2.3), fy + Y(1.4)], [fx + X(1), fy + Y(3.6)], [fx - X(1), fy + Y(3.6)], [fx - X(2.3), fy + Y(1.4)], [fx - X(2.4), fy - Y(2)]]) });
      k.add({ type: 'rect', name: 'brow-light', x: Math.round(fx - X(1.5)), y: Math.round(fy - Y(2)), w: 2, h: 1, color: 'skin.0' });
      for (const e of [-1.4, 1.4]) k.add({ type: 'rect', name: 'eye', x: Math.round(fx + X(e)), y: Math.round(fy), w: 1, h: 1, color: 'outline' });
      k.add({ type: 'rect', name: 'nose', x: Math.round(fx), y: Math.round(fy + Y(1)), w: 1, h: 1, color: 'skin.2' });
      // the veil: cloth hung from under the nose to below the chin, its lower edge a soft point
      k.add({ type: 'path', name: 'veil', underlay: true, mat: pal.cloth, shade: 'flat', band: 1, d: k.smooth([[fx - X(2.6), fy + Y(1.9)], [fx + X(2.6), fy + Y(1.9)], [fx + X(2.2), fy + Y(4.2)], [fx, fy + Y(5.6)], [fx - X(2.2), fy + Y(4.2)]]) });
    });
    k.main(() => {
      // the right hand open, low at the side, illusion motes drifting off the fingers
      k.arm(-1, pal.leather, L + X(1.5), waist + Y(1), { r: 1.5 });
      for (const [dx, dy] of [[-1.6, 2.6], [-0.4, 4.4], [-2.4, 5.4]]) k.add({ type: 'rect', name: 'mote', x: Math.round(L + X(1.5) + X(dx)), y: Math.round(waist + Y(1) + Y(dy)), w: 1, h: 1, color: 'accent.0' });
    });
    k.off(() => {
      // the left hand holds a hand mirror out at chest height, its glass toward the viewer
      const hx = R - X(0.5), hy2 = waist - Y(2.6);
      k.arm(1, pal.leather, hx, hy2, { r: 1.5 });
      k.pole(pal.leather, hx, hy2, hx + X(0.8), hy2 - Y(2.4), 0.45, 'mirror-handle');
      k.add({ type: 'ellipse', name: 'mirror-frame', underlay: true, cx: hx + X(1.2), cy: hy2 - Y(4.8), rx: X(1.9), ry: Y(2.4), mat: pal.accent, shade: 'flat', band: 1 });
      k.add({ type: 'ellipse', name: 'mirror-glass', cx: hx + X(1.2), cy: hy2 - Y(4.8), rx: X(1.2), ry: Y(1.7), mat: pal.metal, shade: 'sphere' });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.4, headDy: 0.6, hand: L => [L.L + L.X(1.5), L.waist + L.Y(1)] });
