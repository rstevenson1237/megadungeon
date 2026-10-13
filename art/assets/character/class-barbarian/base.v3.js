// class-barbarian base.v3 (r3) — from base.v2 (best so far), the review's next change: a fur pelt (leather ramp) slung over
// the left shoulder across the chest with a ragged curved lower edge, and the axe's 3px blob head becomes a ~6px
// crescent blade (convex cutting edge, horned tips, a narrow neck on the haft).
// class-barbarian base.v2 (r2) — from base.v1, the review's one next change: the great axe is carried low at the right
// hip (head below the waist, clear of the helm and face) instead of over the shoulder, and the boxy chest tapers into a
// V from broad shoulders to a narrow belted waist (belt and kilt top narrowed to match).
// base.v1: the Barbarian on the shared player body (art/lib/person.v1.js): bare broad shoulders
// and chest with a fur mantle, a horned helm over a mane of wild hair and a heavy jaw, a fur kilt, bare arms, and a
// great axe held two-handed over the right shoulder, its blade standing above the head.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-barbarian', pass: 'r3', notes: 'V-tapered bare chest, fur mantle, horned helm, great axe low at the hip', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.legs(pal.skin, 2.6, 1.8); k.boots(pal.hair);
    k.shape('kilt', pal.hair, [[0, waist - Y(1)], [3.8, waist - Y(1)], [5.8, knee - Y(1.5)], [0, knee - Y(0.5)]]);
    k.add({ type: 'ellipse', name: 'mane', cx, cy: headY + Y(1), rx: X(4.6), ry: Y(5.5), mat: pal.hair, shade: 'sphere', underlay: true });
    k.shape('chest', pal.skin, [[0, shoulder - Y(0.5)], [6.2, shoulder], [6, shoulder + Y(2.2)], [3.4, waist], [0, waist]]);
    k.add({ type: 'rect', name: 'belt', x: cx - X(3.8), y: waist - Y(1.4), w: X(7.6), h: Y(1.6), mat: pal.leather, shade: 'flat', band: 2 });
    k.add({ type: 'ellipse', name: 'mantle', cx, cy: shoulder + Y(0.4), rx: X(7), ry: Y(2.2), mat: pal.hair, shade: 'sphere', underlay: true });
    // the fur pelt over the left shoulder (the viewer's right), draped across the chest to the right hip, its lower edge
    // a ragged curve of tufts
    k.add({ type: 'path', name: 'pelt', underlay: true, mat: pal.leather, shade: 'normal', d: `M${cx + X(2)} ${shoulder - Y(1.4)} Q${cx + X(7.4)} ${shoulder - Y(1)} ${cx + X(6.2)} ${shoulder + Y(3)} L${cx + X(5)} ${shoulder + Y(3.4)} L${cx + X(4.6)} ${shoulder + Y(5)} L${cx + X(3.2)} ${shoulder + Y(4.6)} L${cx + X(2)} ${waist - Y(1.4)} L${cx + X(0.6)} ${waist - Y(2.6)} L${cx - X(1)} ${waist - Y(1.6)} L${cx - X(2.2)} ${waist - Y(2.8)} Q${cx - X(2.6)} ${shoulder + Y(3.2)} ${cx - X(0.8)} ${shoulder + Y(1.6)} Q${cx + X(0.4)} ${shoulder - Y(0.4)} ${cx + X(2)} ${shoulder - Y(1.4)} Z` });
    k.head(headY, { wide: 3.4, crown: 4.4, jaw: 2.6, chin: 4.4, point: 0, eyes: 1.9 });
    k.add({ type: 'path', name: 'helm', underlay: true, mat: pal.metal, shade: 'sphere', d: k.smooth([[cx, headY - Y(5.2)], [cx + X(3.6), headY - Y(3.6)], [cx + X(3.6), headY - Y(1.4)], [cx - X(3.6), headY - Y(1.4)], [cx - X(3.6), headY - Y(3.6)]]) });
    for (const s of [-1, 1]) k.add({ type: 'tube', name: 'horn', underlay: true, mat: pal.cloth, shade: 'cyl', pts: [[cx + s * X(3), headY - Y(3)], [cx + s * X(6), headY - Y(5)], [cx + s * X(6.5), headY - Y(8.5)]], w: X(2), w1: X(0.6) });
    k.off(() => k.arm(1, pal.skin, cx + X(1), shoulder + Y(0.5), { r: 1.7 }));
    k.main(() => {
      // the great axe carried low at the right hip: gripped below the head, the haft slanting down, the head by the knee
      k.pole(pal.leather, L + X(2.6), waist - Y(3), L + X(0.4), knee + Y(2), 0.7, 'haft');
      k.add({ type: 'path', name: 'axe-blade', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${L + X(0.9)} ${knee - Y(1.6)} Q${L - X(0.8)} ${knee - Y(2)} ${L - X(2.2)} ${knee - Y(3.9)} Q${L - X(5)} ${knee - Y(0.7)} ${L - X(2.4)} ${knee + Y(2.4)} Q${L - X(0.9)} ${knee + Y(0.6)} ${L + X(0.6)} ${knee + Y(0.3)} Z` });
      k.arm(-1, pal.skin, L + X(2), waist - Y(1), { r: 1.7 });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.9, hand: L => [L.L + L.X(2), L.waist - L.Y(1)] });
