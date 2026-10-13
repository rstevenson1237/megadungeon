// class-thief base.v2 (r2) — from base.v1, ONE change (review: the boxy torso matched the ranger's and the back showed
// an unexplained olive block): the rectangle vest and the long cape become a short jerkin that narrows hard at the
// waist and flares into a short skirt below the belt, under a shoulder capelet with a hood bunched behind the neck
// (open in a V at the chest from the front, the hood's fold over the shoulders from the back).
//
// base.v1 (r1) — the Thief on the shared player body (art/lib/person.v1.js): a soft cap pulled low and a
// scarf over the mouth, a short cape, a bulging loot sack slung over the left shoulder, a short sword held low and
// forward in the right hand. Crouched a little: knees bent, shoulders forward.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-thief', pass: 'r2', notes: 'waisted jerkin with a hooded capelet replaces the box vest and cape', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.worn(() => k.add({ type: 'path', name: 'sack', underlay: true, mat: pal.cloth, shade: 'sphere', d: k.smooth([[R - X(1), shoulder - Y(3)], [R + X(3), shoulder - Y(1)], [R + X(3.5), waist - Y(2)], [R, waist], [R - X(3), waist - Y(2)], [R - X(3), shoulder]]) }));
    k.legs(pal.leather, 2.6, 1.5); k.boots(pal.leather);
    // the jerkin: broad at the shoulders, pinched at the waist, a short flared skirt below the belt
    k.shape('jerkin', pal.leather, [[0, shoulder - Y(0.5)], [4.6, shoulder + Y(0.3)], [4.4, shoulder + Y(3)], [2.9, waist - Y(1)], [2.7, waist], [3.6, waist + Y(2.6)], [0, waist + Y(3)]]);
    // the capelet over the shoulders, with the hood fallen behind the neck
    if (k.back) {
      k.shape('capelet', pal.hair, [[0, headY + Y(1.5)], [2.8, headY + Y(2.6)], [5.2, shoulder + Y(0.2)], [5.3, shoulder + Y(3.2)], [3.5, shoulder + Y(5.5)], [0, shoulder + Y(6.2)]]);
      k.add({ type: 'path', name: 'hood-fold', mat: pal.hair, shade: 'flat', band: 2, d: k.smooth([[cx - X(2.4), headY + Y(3.2)], [cx, headY + Y(5.5)], [cx + X(2.4), headY + Y(3.2)], [cx, headY + Y(4.4)]]) });
    } else {
      k.add({ type: 'path', name: 'capelet', underlay: true, mat: pal.hair, shade: 'normal', round: X(2),
        d: `M${cx - X(2.2)} ${shoulder - Y(1)} Q${cx - X(6)} ${shoulder - Y(0.8)} ${cx - X(6)} ${shoulder + Y(2.8)} Q${cx - X(5)} ${shoulder + Y(4.4)} ${cx - X(3)} ${shoulder + Y(3.6)} L${cx - X(1.2)} ${shoulder - Y(0.2)} L${cx + X(1.2)} ${shoulder - Y(0.2)} L${cx + X(3)} ${shoulder + Y(3.6)} Q${cx + X(5)} ${shoulder + Y(4.4)} ${cx + X(6)} ${shoulder + Y(2.8)} Q${cx + X(6)} ${shoulder - Y(0.8)} ${cx + X(2.2)} ${shoulder - Y(1)} Z` });
    }
    k.add({ type: 'rect', name: 'belt', x: cx - X(3), y: waist - Y(0.2), w: X(6), h: Y(1.2), mat: pal.leather, shade: 'flat', band: 2 });
    k.head(headY + Y(0.5), { wide: 3.1, crown: 4.4, jaw: 1.5, chin: 4.2, point: 0.5, eyes: 1.7 });
    k.front(() => k.add({ type: 'path', name: 'scarf', mat: pal.hair, shade: 'flat', band: 1, d: k.smooth([[cx - X(3.2), headY + Y(2)], [cx + X(3.2), headY + Y(2)], [cx + X(2), headY + Y(5.2)], [cx, headY + Y(5.8)], [cx - X(2), headY + Y(5.2)]]) }));
    k.add({ type: 'path', name: 'cap', underlay: true, mat: pal.hair, shade: 'sphere', d: k.smooth([[cx - X(3.8), headY - Y(0.2)], [cx - X(3.6), headY - Y(4)], [cx, headY - Y(5)], [cx + X(4), headY - Y(4.5)], [cx + X(6), headY - Y(3)], [cx + X(4), headY - Y(1.2)], [cx + X(3.8), headY - Y(0.2)]]) });
    k.off(() => k.arm(1, pal.leather, R - X(2), shoulder + Y(0.5), { glove: pal.leather }));
    k.main(() => {
      k.arm(-1, pal.leather, L + X(1), waist + Y(1), { glove: pal.leather });
      k.add({ type: 'path', name: 'short-sword', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${L + X(0.5)} ${waist} L${L - X(4.5)} ${waist - Y(4)} L${L - X(5)} ${waist - Y(5)} L${L - X(3.6)} ${waist - Y(4.6)} L${L + X(1.4)} ${waist + Y(0.8)} Z` });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.7, headDy: 0.5, hand: L => [L.L + L.X(1), L.waist + L.Y(1)] });
