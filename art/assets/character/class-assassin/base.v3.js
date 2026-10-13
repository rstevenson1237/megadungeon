// class-assassin base.v3 (r3) — from base.v2 (best so far), one change to the silhouette: the wrapped torso tapers from
// broad shoulders to a narrow waist under the sash (sash narrowed to match), and both blades are 2px longer and angled
// out from the hips so they break the outline at 1x.
// class-assassin base.v2 (r2) — from base.v1, one change: the front of the cowl gets a dark face opening (a 4 x 3 shadow
// with a 1-px skin strip across the eyes) in the s/e facings, so the front no longer reads as the blank back of the hood.
// base.v1: the Assassin on the shared player body (art/lib/person.v1.js): a close cowl and a
// wrap that leaves only a slit for the eyes, a lean wrapped body with a long sash whose ends trail behind, crossed
// sheaths on the back, and two blades held reversed and low: a short sword in the right hand, a dagger in the left.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-assassin', pass: 'r3', notes: 'cowl and face wrap, lean wraps, sash tails, two reversed blades', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.worn(() => {
      k.pole(pal.leather, cx - X(4), shoulder - Y(3), cx + X(4), waist + Y(1), 0.7, 'sheath');
      k.pole(pal.leather, cx + X(4), shoulder - Y(3), cx - X(4), waist + Y(1), 0.7, 'sheath');
    });
    k.legs(pal.hair, 2.3, 1.4); k.boots(pal.leather);
    k.shape('wraps', pal.hair, [[0, shoulder - Y(0.5)], [4.8, shoulder], [4, shoulder + Y(3.5)], [2.7, waist], [3.6, waist + Y(2)], [0, waist + Y(2.5)]]);
    k.add({ type: 'rect', name: 'sash', x: cx - X(3), y: waist - Y(0.8), w: X(6), h: Y(1.6), mat: pal.accent, shade: 'flat', band: 1 });
    k.add({ type: 'tube', name: 'sash-tail', mat: pal.accent, shade: 'flat', band: 2, pts: [[cx + X(3), waist], [cx + X(6), waist + Y(3)], [cx + X(7), knee]], w: X(1.4), w1: X(0.8) });
    k.head(headY + Y(0.5), { wide: 3, crown: 4.4, jaw: 1.6, chin: 4.4, point: 0.4, eyes: 1.6, hair: pal.hair });
    k.add({ type: 'path', name: 'cowl', underlay: true, mat: pal.hair, shade: 'sphere', d: k.back ? k.smooth([[cx, headY - Y(4.4)], [cx + X(4), headY - Y(2)], [cx + X(4), headY + Y(4.5)], [cx - X(4), headY + Y(4.5)], [cx - X(4), headY - Y(2)]])
      : `M${cx - X(4)} ${headY + Y(4.5)} Q${cx - X(4.6)} ${headY - Y(4.6)} ${cx} ${headY - Y(4.6)} Q${cx + X(4.6)} ${headY - Y(4.6)} ${cx + X(4)} ${headY + Y(4.5)} Q${cx} ${headY + Y(6)} ${cx - X(4)} ${headY + Y(4.5)} Z M${cx - X(3) - 1} ${headY - Y(1)} H${cx + X(3) - 1} V${headY + Y(1.2)} H${cx - X(3) - 1} Z` });
    // the face opening: a 4 x 3 shadow cut into the front of the hood, a 1-px strip of lit skin across the eyes
    k.front(() => {
      const fx = Math.round(cx) - 3, fy = Math.round(headY + Y(0.5)) - 1;
      k.add({ type: 'rect', name: 'face-opening', x: fx, y: fy, w: 4, h: 3, color: 'outline' });
      k.add({ type: 'rect', name: 'face-strip', x: fx, y: fy + 1, w: 4, h: 1, color: 'skin.1' });
      k.add({ type: 'rect', name: 'face-strip-lit', x: fx + 1, y: fy + 1, w: 2, h: 1, color: 'skin.0' });
    });
    k.main(() => {
      k.arm(-1, pal.hair, L + X(1.5), waist + Y(0.5), { r: 1.3, glove: pal.leather });
      k.add({ type: 'path', name: 'short-sword', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${L + X(0.6)} ${waist} L${L - X(1.8)} ${waist + Y(8.6)} L${L - X(0.8)} ${waist + Y(9.2)} L${L + X(2)} ${waist + Y(0.2)} Z` });
    });
    k.off(() => {
      k.arm(1, pal.hair, R - X(1.5), waist + Y(0.5), { r: 1.3, glove: pal.leather });
      k.add({ type: 'path', name: 'dagger', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${R - X(2)} ${waist + Y(0.6)} L${R + X(1.2)} ${waist + Y(6.8)} L${R - X(0.6)} ${waist + Y(0.2)} Z` });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { headDy: 0.5, eyes: 1.6, hand: L => [L.L + L.X(1.5), L.waist + L.Y(0.5)] });
