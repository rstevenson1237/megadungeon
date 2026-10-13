// class-illusionist base.v4 (r4) — from base.v3 (best so far), one change: the robe flares — below a slightly nipped
// waist its lower third widens about 2px each side in a curve down to a wider hem band (hem trim widened to match), so
// the coat is a bell, not a straight-sided rectangle.
// class-illusionist base.v3 (r3) — from base.v2 (best so far), one change: the robe body, cowl and sleeves move off the
// saturated accent red onto the muted leather ramp; accent red stays only for the prism mote, its spark and a thin trim
// along the coat's hem and the cowl's face edge.
// class-illusionist base.v2 (r2) — from base.v1, the review's one next change: the head's slate turban and white
// half-mask (read as a bowl helm and goggle band) become a soft red cowl in the coat's ramp, open on a lit skin face with
// its jaw, and the coat's straight trapezoid hem flares out in a curve.
// base.v1: the Illusionist on the shared player body (art/lib/person.v1.js): a wrapped
// turban with a jewel and a trailing tail, a half-mask over the eyes, a long coat flaring at the hem with wide cuffs, a
// dagger in the right hand and, in the raised left, a floating prism throwing small sparks.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-illusionist', pass: 'r4', notes: 'soft cowl over a lit face, curved flared coat, floating prism', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, knee, L, R } = k;
    k.legs(pal.leather, 2, 1.4); k.boots(pal.leather);
    k.shape('coat', pal.leather, [[0, shoulder - Y(0.5)], [4.4, shoulder], [3.6, waist - Y(1)], [4.4, waist + Y(2.5)], [6.6, knee + Y(0.5)], [10.4, knee + Y(3.6)], [8.4, knee + Y(4.6)], [3, knee + Y(3)], [0, knee + Y(4)]]);
    // the accent trim along the hem (both sides of the curved flare)
    k.add({ type: 'tube', name: 'hem-trim', mat: pal.accent, shade: 'flat', band: 1, pts: [[cx - X(9.6), knee + Y(3.7)], [cx - X(8.2), knee + Y(4.3)], [cx - X(3), knee + Y(2.9)], [cx, knee + Y(3.8)], [cx + X(3), knee + Y(2.9)], [cx + X(8.2), knee + Y(4.3)], [cx + X(9.6), knee + Y(3.7)]], w: 1 });
    k.front(() => k.shape('shirt', pal.cloth, [[0, shoulder + Y(1)], [1.6, shoulder + Y(1)], [2.4, knee], [0, knee + Y(1)]], { shade: 'flat', band: 1 }));
    k.head(headY + Y(0.5), { wide: 3, crown: 4.4, jaw: 1.5, chin: 4.6, point: 0.6, eyes: 1.6, hair: pal.leather });
    // the soft cowl: a drooping peak and folds to the shoulders, cut open on the face from the brow to the chin
    const cowl = { type: 'path', d: k.smooth([[cx + X(0.8), headY - Y(7.4)], [cx + X(4.2), headY - Y(4.4)], [cx + X(4.8), headY + Y(1.5)], [cx + X(5.4), shoulder + Y(1.2)], [cx, shoulder + Y(0.4)], [cx - X(5.4), shoulder + Y(1.2)], [cx - X(4.8), headY + Y(1.5)], [cx - X(3.8), headY - Y(4.6)]]) };
    const face = { type: 'ellipse', cx: cx - 1, cy: headY + Y(2), rx: X(2.8), ry: Y(4.2) };
    k.add({ type: 'subtract', name: 'cowl', underlay: true, mat: pal.leather, shade: 'sphere', shapes: k.back ? [cowl] : [cowl, face] });
    // the accent trim on the cowl's face edge (front only)
    k.front(() => k.add({ type: 'subtract', name: 'cowl-trim', mat: pal.accent, shade: 'flat', band: 1, shapes: [{ type: 'ellipse', cx: cx - 1, cy: headY + Y(2), rx: X(2.8) + 1, ry: Y(4.2) + 1 }, face, { type: 'rect', x: cx - X(5), y: headY + Y(2.5), w: X(10), h: Y(6) }] }));
    k.main(() => {
      k.arm(-1, pal.leather, L + X(1.5), waist, { r: 1.5 });
      k.pole(pal.metal, L + X(1.5), waist, L - X(0.5), waist + Y(4), 0.45, 'dagger');
    });
    k.off(() => {
      k.arm(1, pal.leather, R - X(1), shoulder + Y(1), { r: 1.5 });
      k.add({ type: 'poly', name: 'prism', underlay: true, mat: pal.accent, shade: 'bevel', pts: [[R, shoulder - Y(8)], [R + X(2.6), shoulder - Y(4)], [R, shoulder - Y(1.6)], [R - X(2.6), shoulder - Y(4)]] });
      k.add({ type: 'star', name: 'spark', cx: R + X(3.5), cy: shoulder - Y(8), r: X(1.4), r2: X(0.5), n: 4, mat: pal.accent, shade: 'flat', band: 0 });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { face: false, hand: L => [L.L + L.X(1.5), L.waist] });
