// npc-hermit base.v2 (r2, from base.v1) — ONE change, the robe: no longer a hard rectangle in one flat fill. Its sides
// curve (in at the waist, out to the hem), the hem flares 2 px wider than the shoulders each side with a rounded
// bottom, and it is shaded in three leather bands lit from the top left: light on the left, mid in the middle, dark
// down the right.
// base.v1 (r1) — a hermit on the shared person body (art/lib/person.v1.js), bent with age: the head and
// shoulders sunk forward and down, a long grey beard to the waist under a ragged hood, a patched robe to the ground,
// a bead string at the neck and a crooked staff taller than he is. Walks only (no attack).
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'npc-hermit', pass: 'r2', notes: 'stooped, long beard, ragged hood and robe, crooked staff', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    const dn = Y(2.5), hx = cx - X(1.2); // stoop: head and shoulders sunk and forward
    const sh = shoulder + dn;
    k.add({ type: 'path', name: 'robe', underlay: true, mat: pal.leather, shade: 'flat', band: 1, d: k.smooth([[hx, sh - Y(1.5)], [cx + X(5.4), sh], [cx + X(4.6), waist - Y(1)], [cx + X(5.6), waist + Y(4)], [cx + X(7.6), foot - Y(1.6)], [cx + X(6.4), foot - Y(0.2)], [cx, foot + Y(0.6)], [cx - X(6.6), foot - Y(0.2)], [cx - X(7.8), foot - Y(1.6)], [cx - X(5.8), waist + Y(4)], [cx - X(4.8), waist - Y(1)], [hx - X(5), sh]]) });
    // the lit band down the left (top-left light) and the shadow band down the right, both following the curves
    k.add({ type: 'path', name: 'robe-light', mat: pal.leather, shade: 'flat', band: 0, d: k.smooth([[hx - X(4.4), sh - Y(0.4)], [cx - X(2.4), sh], [cx - X(3), waist - Y(1)], [cx - X(4), waist + Y(4)], [cx - X(5.6), foot - Y(1.8)], [cx - X(7), foot - Y(1.8)], [cx - X(5.2), waist + Y(4)], [cx - X(4.2), waist - Y(1)]]) });
    k.add({ type: 'path', name: 'robe-shadow', mat: pal.leather, shade: 'flat', band: 2, d: k.smooth([[cx + X(3.4), sh + Y(1)], [cx + X(4.8), sh + Y(0.5)], [cx + X(4), waist - Y(1)], [cx + X(5), waist + Y(4)], [cx + X(7), foot - Y(1.6)], [cx + X(5.6), foot - Y(0.4)], [cx + X(3.6), foot - Y(0.2)], [cx + X(4.4), foot - Y(2)], [cx + X(3.4), waist + Y(4)], [cx + X(2.8), waist - Y(1)]]) });
    k.front(() => [[-3, waist + Y(3)], [2.5, waist + Y(7)]].forEach(([dx, y]) => k.add({ type: 'rect', name: 'patch', x: cx + X(dx), y, w: X(2.2), h: Y(2), mat: pal.cloth, shade: 'flat', band: 2 })));
    k.head(headY + dn, { wide: 3.2, crown: 4.2, jaw: 1.8, chin: 4.2, point: 0.3, eyes: 1.7 });
    k.front(() => k.add({ type: 'path', name: 'beard', mat: pal.metal, shade: 'sphere', d: k.smooth([[cx - X(2.8) - 1, headY + dn + Y(1.4)], [cx + X(2.8) - 1, headY + dn + Y(1.4)], [cx + X(2) - 1, waist], [cx - 1, waist + Y(3)], [cx - X(2) - 1, waist]]) }));
    k.add({ type: 'path', name: 'hood', underlay: true, mat: pal.hair, shade: 'sphere', d: k.back ? k.smooth([[cx, headY + dn - Y(5.4)], [cx + X(4.6), headY + dn - Y(2)], [cx + X(5), shoulder + dn + Y(1)], [cx - X(5), shoulder + dn + Y(1)], [cx - X(4.6), headY + dn - Y(2)]])
      : `M${cx - X(5)} ${shoulder + dn + Y(1)} Q${cx - X(5.4)} ${headY + dn - Y(5.4)} ${cx} ${headY + dn - Y(5.4)} Q${cx + X(5.4)} ${headY + dn - Y(5.4)} ${cx + X(5)} ${shoulder + dn + Y(1)} L${cx + X(3.4)} ${shoulder + dn} Q${cx + X(3.6)} ${headY + dn - Y(2.6)} ${cx} ${headY + dn - Y(3)} Q${cx - X(3.6)} ${headY + dn - Y(2.6)} ${cx - X(3.4)} ${shoulder + dn} Z` });
    k.off(() => k.arm(1, pal.leather, R - X(3), waist, { r: 1.4 }));
    k.main(() => {
      k.add({ type: 'tube', name: 'staff', underlay: true, mat: pal.leather, shade: 'cyl', pts: [[L - X(1), foot - Y(0.5)], [L, waist], [L - X(1), headY - Y(2)], [L + X(1.5), headY - Y(5)], [L + X(3), headY - Y(3.5)]], w: X(1.4), w1: X(1) });
      k.arm(-1, pal.leather, L + X(0.5), shoulder + dn + Y(1), { r: 1.4 });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.7, headDy: 2.5, hand: L => [L.L + L.X(0.5), L.shoulder + L.Y(3.5)] });
