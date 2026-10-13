// npc-rival base.v4 (x1, from base.v3) — ONE change, the blind reviewer's (facing and the bare legs): from behind
// (n/w) the bright breastplate oval is replaced by a darker backplate (metal, shaded a band down) crossed by two
// leather shoulder straps and mostly covered by a small rounded leather pack with a flap, so the back reads as a back;
// and the legs are trousers in the cloth ramp, with metal greaves over the shins, instead of skin-pink leather.
// npc-rival base.v3 (r3, from base.v2) — ONE change, the sabre: no longer held across the chest (where it read as
// crossed arms), it hangs from the right hand (the viewer's left) with a small guard, its curved blade angled down and
// out past the hip, outside the body's outline, so it breaks the silhouette.
// npc-rival base.v2 (r2, from base.v1) — ONE change, the diagonal that crossed the face: the sabre held ready across
// the body now ends at the left shoulder below the neck (it no longer rises past the head), so the face is clear skin
// with eyes; and the half-cape that read as glow-orange slabs from behind is drawn in the leather ramp.
// base.v1 (r1) — a rival delver on the shared person body (art/lib/person.v1.js): a dark lacquered
// breastplate over a padded coat, a half-cape over one shoulder, a scarred, close-cropped head with a hard jaw, and a
// curved sabre held ready across the body. Drawn on a ring in its role colour by the game, not by the sprite.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'npc-rival', pass: 'x1', notes: 'breastplate, half-cape, cropped scarred head, sabre ready', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.legs(pal.cloth, 2.4, 1.6);
    // greaves over the shins
    k.P.feet.forEach((dy, i) => k.add({ type: 'capsule', name: 'greave', underlay: true, mat: pal.metal, shade: 'cyl', a: [k.baseCx + (i ? 1 : -1) * X(2.3), knee + Y(0.5)], b: [k.baseCx + (i ? 1 : -1) * X(2.4), k.foot - Y(2.2) + dy], r: X(1.35), r1: X(1.2) }));
    k.boots(pal.leather);
    k.shape('coat', pal.cloth, [[0, shoulder - Y(0.5)], [4.8, shoulder], [4.8, waist], [5.4, knee - Y(1)], [0, knee - Y(0.5)]]);
    const plate = k.sym([[0, shoulder], [4.2, shoulder + Y(0.5)], [4, waist - Y(1)], [0, waist + Y(0.5)]]);
    k.front(() => k.add({ type: 'path', name: 'breastplate', underlay: true, mat: pal.metal, shade: 'normal', round: X(2), d: plate }));
    k.rear(() => {
      // from behind: a darker backplate, two shoulder straps and a small rounded pack over most of it
      k.add({ type: 'path', name: 'backplate', underlay: true, mat: pal.metal, shade: 'flat', band: 2, d: plate });
      for (const sd of [-1, 1]) k.add({ type: 'poly', name: 'strap', mat: pal.leather, shade: 'flat', band: 2, pts: [[cx + sd * X(3.4), shoulder], [cx + sd * X(2.2), shoulder], [cx + sd * X(1.4), waist], [cx + sd * X(2.6), waist]] });
      k.add({ type: 'path', name: 'pack', underlay: true, mat: pal.leather, shade: 'normal', round: X(1.5), d: k.smooth([[cx - X(3.2), shoulder + Y(1.8)], [cx + X(3.2), shoulder + Y(1.8)], [cx + X(3.8), waist - Y(1)], [cx + X(3), waist + Y(1)], [cx - X(3), waist + Y(1)], [cx - X(3.8), waist - Y(1)]]) });
      k.add({ type: 'path', name: 'pack-flap', underlay: true, mat: pal.leather, shade: 'flat', band: 1, d: k.smooth([[cx - X(3.2), shoulder + Y(1.8)], [cx + X(3.2), shoulder + Y(1.8)], [cx + X(2.6), shoulder + Y(4.4)], [cx - X(2.6), shoulder + Y(4.4)]]) });
    });
    k.add({ type: 'path', name: 'half-cape', underlay: true, mat: pal.leather, shade: 'normal', round: X(1.5), d: k.smooth([[cx + X(1), shoulder - Y(1)], [cx + X(6.4), shoulder], [cx + X(7), waist + Y(2)], [cx + X(4.5), waist + Y(3)], [cx + X(3.5), shoulder + Y(3)]]) });
    k.neck();
    k.head(headY, { wide: 3.2, crown: 4.4, jaw: 2.2, chin: 4.2, point: 0, eyes: 1.8 });
    k.add({ type: 'path', name: 'cropped-hair', mat: pal.hair, shade: 'sphere', d: k.smooth([[cx - X(3.2), headY - Y(1.4)], [cx - X(3), headY - Y(4)], [cx, headY - Y(4.8)], [cx + X(3), headY - Y(4)], [cx + X(3.2), headY - Y(1.4)], [cx, headY - Y(2.6)]]) });
    k.front(() => k.add({ type: 'rect', name: 'scar', x: Math.round(cx - X(2)) - 1, y: Math.round(headY - Y(1.4)), w: 1, h: Y(3), mat: pal.skin, shade: 'flat', band: 0 }));
    k.off(() => k.arm(1, pal.cloth, R - X(2), waist - Y(0.5), { glove: pal.leather }));
    k.main(() => {
      k.arm(-1, pal.cloth, L + X(1.5), waist - Y(1), { glove: pal.leather });
      // the sabre held low and out: a guard at the fist, the curved blade sweeping down and away past the hip
      const hx = L + X(1.5), hy = waist - Y(1);
      k.add({ type: 'path', name: 'sabre', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${hx - X(0.6)} ${hy + Y(0.6)} Q${L - X(3)} ${waist + Y(2)} ${L - X(4)} ${knee + Y(3)} Q${L - X(0.8)} ${waist + Y(3.6)} ${hx + X(0.8)} ${hy + Y(1.2)} Z` });
      k.add({ type: 'rect', name: 'guard', x: Math.round(hx - X(1.4)), y: Math.round(hy + Y(0.8)), w: Math.round(X(2.6)), h: 1, mat: pal.accent, shade: 'flat', band: 1 });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.8, hand: L => [L.L + L.X(1.5), L.waist - L.Y(1)] });
