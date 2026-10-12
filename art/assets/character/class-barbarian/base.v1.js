// class-barbarian base.v1 (r1) — the Barbarian on the shared player body (art/lib/person.v1.js): bare broad shoulders
// and chest with a fur mantle, a horned helm over a mane of wild hair and a heavy jaw, a fur kilt, bare arms, and a
// great axe held two-handed over the right shoulder, its blade standing above the head.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-barbarian', pass: 'r1', notes: 'bare chest, fur mantle, horned helm, great axe over the shoulder', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.legs(pal.skin, 2.6, 1.8); k.boots(pal.hair);
    k.shape('kilt', pal.hair, [[0, waist - Y(1)], [5, waist - Y(1)], [6, knee - Y(1.5)], [0, knee - Y(0.5)]]);
    k.add({ type: 'ellipse', name: 'mane', cx, cy: headY + Y(1), rx: X(4.6), ry: Y(5.5), mat: pal.hair, shade: 'sphere', underlay: true });
    k.shape('chest', pal.skin, [[0, shoulder - Y(0.5)], [5.6, shoulder], [5.8, shoulder + Y(3)], [4.6, waist], [0, waist]]);
    k.add({ type: 'rect', name: 'belt', x: cx - X(4.8), y: waist - Y(1.4), w: X(9.6), h: Y(1.6), mat: pal.leather, shade: 'flat', band: 2 });
    k.add({ type: 'ellipse', name: 'mantle', cx, cy: shoulder + Y(0.4), rx: X(7), ry: Y(2.2), mat: pal.hair, shade: 'sphere', underlay: true });
    k.head(headY, { wide: 3.4, crown: 4.4, jaw: 2.6, chin: 4.4, point: 0, eyes: 1.9 });
    k.add({ type: 'path', name: 'helm', underlay: true, mat: pal.metal, shade: 'sphere', d: k.smooth([[cx, headY - Y(5.2)], [cx + X(3.6), headY - Y(3.6)], [cx + X(3.6), headY - Y(1.4)], [cx - X(3.6), headY - Y(1.4)], [cx - X(3.6), headY - Y(3.6)]]) });
    for (const s of [-1, 1]) k.add({ type: 'tube', name: 'horn', underlay: true, mat: pal.cloth, shade: 'cyl', pts: [[cx + s * X(3), headY - Y(3)], [cx + s * X(6), headY - Y(5)], [cx + s * X(6.5), headY - Y(8.5)]], w: X(2), w1: X(0.6) });
    k.off(() => k.arm(1, pal.skin, cx + X(1), shoulder + Y(0.5), { r: 1.7 }));
    k.main(() => {
      k.pole(pal.leather, L + X(2), waist + Y(1), cx + X(2), headY - Y(5), 0.7, 'haft');
      k.add({ type: 'path', name: 'axe-blade', underlay: true, mat: pal.metal, shade: 'bevel', d: k.smooth([[cx - X(0.5), headY - Y(3)], [cx - X(4), headY - Y(9)], [cx + X(0.5), headY - Y(8)], [cx + X(1.6), headY - Y(5.2)]]) });
      k.arm(-1, pal.skin, L + X(2), waist - Y(1), { r: 1.7 });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.9, hand: L => [L.L + L.X(2), L.waist - L.Y(1)] });
