// npc-trader base.v1 (r1) — a travelling trader on the shared person body (art/lib/person.v1.js): a huge frame pack
// piled with bundles and a hanging pot on the back, a broad round felt hat, a plump face, a long padded coat with
// pouches at the belt, and a tall walking stick in the right hand. Walks only (no attack).
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'npc-trader', pass: 'r1', notes: 'frame pack with bundles, round felt hat, coat and pouches, walking stick', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, knee, L, R } = k;
    k.worn(() => {
      k.add({ type: 'rect', name: 'pack', x: cx - X(6.5), y: headY - Y(7), w: X(13), h: Y(16), r: X(2.5), mat: pal.leather, shade: 'normal', round: X(2), underlay: true });
      k.add({ type: 'ellipse', name: 'bundle', cx: cx - X(3), cy: headY - Y(8), rx: X(3.4), ry: Y(2.4), mat: pal.cloth, shade: 'sphere', underlay: true });
      k.add({ type: 'ellipse', name: 'bundle', cx: cx + X(3.5), cy: headY - Y(7.5), rx: X(3), ry: Y(2.6), mat: pal.accent, shade: 'sphere', underlay: true });
      k.add({ type: 'circle', name: 'pot', cx: cx + X(7), cy: shoulder + Y(2), r: X(2), mat: pal.metal, shade: 'sphere', underlay: true });
    });
    k.legs(pal.leather, 2.4, 1.7); k.boots(pal.leather);
    k.shape('coat', pal.cloth, [[0, shoulder - Y(0.5)], [5.2, shoulder], [5.6, waist], [6, knee + Y(1)], [0, knee + Y(1.5)]]);
    k.add({ type: 'rect', name: 'belt', x: cx - X(5.4), y: waist - Y(0.4), w: X(10.8), h: Y(1.2), mat: pal.leather, shade: 'flat', band: 2 });
    k.front(() => [-3, 2.4].forEach(dx => k.add({ type: 'ellipse', name: 'pouch', cx: cx + X(dx), cy: waist + Y(2), rx: X(1.4), ry: Y(1.6), mat: pal.leather, shade: 'sphere', underlay: true })));
    k.head(headY + Y(0.5), { wide: 3.6, crown: 4.2, jaw: 2.6, chin: 4, point: 0, eyes: 1.9 });
    k.add({ type: 'ellipse', name: 'hat-brim', cx, cy: headY - Y(2.6), rx: X(5.6), ry: Y(1.6), mat: pal.hair, shade: 'normal', round: X(1), underlay: true });
    k.add({ type: 'ellipse', name: 'hat-crown', cx, cy: headY - Y(4.2), rx: X(3.4), ry: Y(2.4), mat: pal.hair, shade: 'sphere', underlay: true });
    k.off(() => k.arm(1, pal.cloth, R - X(2.5), shoulder + Y(1.5), { r: 1.5 }));
    k.main(() => {
      k.arm(-1, pal.cloth, L + X(1), waist - Y(2), { r: 1.5 });
      k.pole(pal.leather, L, foot - Y(0.5), L - X(0.5), headY - Y(4), 0.6, 'stick');
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.9, headDy: 0.5, hand: L => [L.L + L.X(1), L.waist - L.Y(2)] });
