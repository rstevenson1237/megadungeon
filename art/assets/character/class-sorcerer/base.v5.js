// class-sorcerer base.v5 (x1) — from base.v3 (best so far), the blind reviewer's change: a crown and pose of its own,
// so the Sorcerer stops copying the Illusionist. The hair/beard mass and fringe go: a bare, lit egg scalp with the face
// on the skin mid step and two eyes; the spiked collar becomes one clean standing curve behind the head; the robe's
// flared skirt becomes a straight column (darker: the accent ramp from its mid step, light only on the lit edge) so the
// orb is the brightest thing; the low dagger and raised orb become a tall staff held upright in the right hand with the
// fire orb at its head, and the left hand open at the chest, casting.
// class-sorcerer base.v3 (r3, from base.v2) — ONE change, the reviewer's "face is a dark muddy mass": the front face
// is lifted to the skin mid step with a light forehead and cheek, a narrower jaw, 2 outline eye px and a skin-shadow
// nose; the hair/beard mass stays only round and below it (the dark cheek pixels are gone).
// class-sorcerer base.v2 (r2, from base.v1) — ONE change, the reviewer's "straight trapezoid, flat back slab": the robe's
// hem is rounded and flares out at the feet (a curved, wider skirt), and three curved fold lines in the accent shadow
// step run down the back of the robe in the n/w view.
// base.v1 (r1) — the Sorcerer on the shared player body (art/lib/person.v1.js), from the approved class
// probe: a long flared robe with a high spiked collar, loose hair round a narrow high-cheeked face, a dagger low in the
// right hand and an orb raised in the open left hand.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-sorcerer', pass: 'x1', notes: 'bare scalp, one-curve collar, straight dark column robe, staff with fire orb', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    const robe = pal.accent.slice(1); // the robe a step darker than the orb
    k.shape('robe', robe, [[0, shoulder - Y(0.5)], [4.4, shoulder], [4.6, waist], [4.8, foot - Y(4)], [4.6, foot + Y(0.2)], [0, foot + Y(0.4)]]);
    k.rear(() => {
      for (const x0 of [-2, 0.4, 2.6]) k.add({ type: 'rect', name: 'fold', x: Math.round(cx + X(x0)), y: Math.round(waist), w: 1, h: Math.round(foot - waist - Y(1)), color: 'accent.2' });
    });
    k.front(() => k.shape('under-robe', pal.cloth, [[0, shoulder + Y(3)], [1.4, shoulder + Y(3)], [1.8, foot - Y(1)], [0, foot - Y(0.5)]], { shade: 'flat', band: 1 }));
    // one clean standing collar: a half-disc behind the head
    k.add({ type: 'path', name: 'collar', underlay: true, mat: robe, shade: 'sphere', d: `M${cx - X(5)} ${shoulder + Y(0.5)} Q${cx - X(5.6)} ${headY - Y(4)} ${cx} ${headY - Y(4.6)} Q${cx + X(5.6)} ${headY - Y(4)} ${cx + X(5)} ${shoulder + Y(0.5)} Z` });
    k.neck();
    // a bare egg scalp, lit from the upper left, the face on the skin mid step
    k.head(headY, { wide: 2.8, crown: 5, jaw: 1.2, chin: 4.4, point: 0.5, eyes: 1.4, hair: pal.skin });
    k.front(() => {
      const fx = cx - 1;
      k.add({ type: 'path', name: 'face', color: 'skin.1', d: k.smooth([[fx, headY - Y(2.4)], [fx + X(2.3), headY - Y(1.4)], [fx + X(2.2), headY + Y(1)], [fx + X(1), headY + Y(3.4)], [fx, headY + Y(4)], [fx - X(1), headY + Y(3.4)], [fx - X(2.2), headY + Y(1)], [fx - X(2.3), headY - Y(1.4)]]) });
      k.add({ type: 'rect', name: 'cheek-light', x: Math.round(fx - X(1.6)), y: Math.round(headY + Y(1.2)), w: 1, h: 1, color: 'skin.0' });
      k.add({ type: 'ellipse', name: 'scalp-light', cx: fx - X(0.8), cy: headY - Y(3), rx: X(1.3), ry: Y(1), color: 'skin.0' });
      k.add({ type: 'rect', name: 'brow', x: Math.round(fx - X(2)), y: Math.round(headY - Y(1)), w: Math.round(X(4)), h: 1, color: 'skin.2' });
      for (const e of [-1.4, 1.4]) k.add({ type: 'rect', name: 'eye', x: Math.round(fx + X(e)), y: Math.round(headY), w: 1, h: 1, color: 'outline' });
      k.add({ type: 'rect', name: 'nose', x: Math.round(fx), y: Math.round(headY + Y(1.3)), w: 1, h: 1, color: 'skin.2' });
    });
    k.rear(() => k.add({ type: 'ellipse', name: 'scalp-light', cx: cx - X(1), cy: headY - Y(3), rx: X(1.3), ry: Y(1), color: 'skin.0' }));
    k.main(() => {
      // a tall staff upright in the right hand, the fire orb at its head
      const hx = L + X(1.5), hy = waist - Y(1);
      k.arm(-1, robe, hx, hy, { r: 1.6 });
      k.pole(pal.leather, hx, foot - Y(0.5), hx, headY - Y(4), 0.55, 'staff');
      k.add({ type: 'circle', name: 'orb', cx: hx, cy: headY - Y(6.2), r: X(2.6), mat: pal.accent, shade: 'sphere' });
      k.add({ type: 'rect', name: 'orb-spark', x: Math.round(hx - X(1)), y: Math.round(headY - Y(7.2)), w: 1, h: 1, color: 'accent.0' });
    });
    k.off(() => {
      // the left hand open at the chest, palm out, casting
      k.arm(1, robe, cx + X(3), shoulder + Y(3), { r: 1.6 });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.4, hand: L => [L.L + L.X(1.5), L.waist - L.Y(1)] });
