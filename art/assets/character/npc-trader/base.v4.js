// npc-trader base.v4 (x1, from base.v3) — ONE change, the blind reviewer's: the pack and what sits on it. The two
// bundles that poked above the shoulders like ear muffs are gone; a rolled felt blanket lies across the pack's top at
// shoulder height (below the head) and shows as two short ends beside the shoulders from the front. The pack is a
// rounded sack (curved top and belly) with two shoulder straps, a top flap and a fold, not a flat slab. And the hat
// brim sits higher and narrower over a slightly larger egg-shaped head, so the face shows clearly under it.
// npc-trader base.v3 (r3, from base.v1, the best so far) — ONE change, the s/e head and what frames it: the head is the
// shared egg (rounder cranium, 3.2 half-width, a jaw 2 px narrower, slightly pointed chin) on a neck, and from the
// front the frame pack's poles no longer rise beside the face: above the shoulders the pack narrows to sit hidden
// behind the head and hat, widening out only behind the shoulders (the back view keeps the full pack).
// npc-trader base.v1 (r1) — a travelling trader on the shared person body (art/lib/person.v1.js): a huge frame pack
// piled with bundles and a hanging pot on the back, a broad round felt hat, a plump face, a long padded coat with
// pouches at the belt, and a tall walking stick in the right hand. Walks only (no attack).
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'npc-trader', pass: 'x1', notes: 'frame pack with bundles, round felt hat, coat and pouches, walking stick', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, knee, L, R } = k;
    k.worn(() => {
      // a rounded sack, its top below the head: full from behind, from the front only its sides beside the shoulders
      const top = shoulder - Y(2), bot = waist + Y(5);
      k.add({ type: 'path', name: 'pack', mat: pal.leather, shade: 'normal', round: X(2.5), underlay: true, d: k.smooth([[cx - X(4), top], [cx + X(4), top], [cx + X(6.6), top + Y(3)], [cx + X(7.2), waist], [cx + X(6), bot], [cx - X(6), bot], [cx - X(7.2), waist], [cx - X(6.6), top + Y(3)]]) });
      if (k.back) {
        k.add({ type: 'path', name: 'flap', mat: pal.leather, shade: 'flat', band: 1, underlay: true, d: k.smooth([[cx - X(5), top + Y(1)], [cx + X(5), top + Y(1)], [cx + X(4.5), top + Y(5)], [cx, top + Y(6)], [cx - X(4.5), top + Y(5)]]) });
        for (const dx of [-3.4, 3.4]) k.add({ type: 'rect', name: 'strap', x: cx + X(dx) - X(0.6), y: top + Y(5), w: X(1.2), h: bot - top - Y(6), mat: pal.leather, shade: 'flat', band: 3 });
        k.add({ type: 'rect', name: 'fold', x: cx - X(5), y: waist + Y(0.5), w: X(10), h: Y(0.6), mat: pal.leather, shade: 'flat', band: 3 });
      }
      // the rolled blanket across the pack's top, at shoulder height
      k.add({ type: 'capsule', name: 'bedroll', a: [cx - X(6.8), top + Y(1.2)], b: [cx + X(6.8), top + Y(1.2)], r: X(1.6), mat: pal.hair, shade: 'cyl', axis: 'x', underlay: true });
      k.add({ type: 'circle', name: 'pot', cx: cx + X(7), cy: waist - Y(1), r: X(1.8), mat: pal.metal, shade: 'sphere', underlay: true });
    });
    k.legs(pal.leather, 2.4, 1.7); k.boots(pal.leather);
    k.shape('coat', pal.cloth, [[0, shoulder - Y(0.5)], [5.2, shoulder], [5.6, waist], [6, knee + Y(1)], [0, knee + Y(1.5)]]);
    k.add({ type: 'rect', name: 'belt', x: cx - X(5.4), y: waist - Y(0.4), w: X(10.8), h: Y(1.2), mat: pal.leather, shade: 'flat', band: 2 });
    k.front(() => [-3, 2.4].forEach(dx => k.add({ type: 'ellipse', name: 'pouch', cx: cx + X(dx), cy: waist + Y(2), rx: X(1.4), ry: Y(1.6), mat: pal.leather, shade: 'sphere', underlay: true })));
    k.neck();
    k.head(headY + Y(0.5), { wide: 3.5, crown: 4.6, jaw: 1.8, chin: 4.6, point: 0.35, eyes: 1.8 });
    k.add({ type: 'ellipse', name: 'hat-brim', cx, cy: headY - Y(3.2), rx: X(5), ry: Y(1.4), mat: pal.hair, shade: 'normal', round: X(1), underlay: true });
    k.add({ type: 'ellipse', name: 'hat-crown', cx, cy: headY - Y(4.8), rx: X(3.3), ry: Y(2.2), mat: pal.hair, shade: 'sphere', underlay: true });
    k.off(() => k.arm(1, pal.cloth, R - X(2.5), shoulder + Y(1.5), { r: 1.5 }));
    k.main(() => {
      k.arm(-1, pal.cloth, L + X(1), waist - Y(2), { r: 1.5 });
      k.pole(pal.leather, L, foot - Y(0.5), L - X(0.5), headY - Y(4), 0.6, 'stick');
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.8, headDy: 0.5, hand: L => [L.L + L.X(1), L.waist - L.Y(2)] });
