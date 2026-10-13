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
export const meta = { brief: 'npc-rival', pass: 'r3', notes: 'breastplate, half-cape, cropped scarred head, sabre ready', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.legs(pal.leather, 2.4, 1.6); k.boots(pal.leather);
    k.shape('coat', pal.cloth, [[0, shoulder - Y(0.5)], [4.8, shoulder], [4.8, waist], [5.4, knee - Y(1)], [0, knee - Y(0.5)]]);
    k.add({ type: 'path', name: 'breastplate', underlay: true, mat: pal.metal, shade: 'normal', round: X(2), d: k.sym([[0, shoulder], [4.2, shoulder + Y(0.5)], [4, waist - Y(1)], [0, waist + Y(0.5)]]) });
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
