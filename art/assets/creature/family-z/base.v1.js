// family-z base.v1 (r1) — ghouls and zombies (glyph z, 1.7 m): a shambling corpse on the biped rig
// (art/lib/beast.v1.js): head lolled to one side, sunken eyes, torn rags to the knee, one arm reaching forward with
// clawed fingers, the other hanging, knees bent. The flesh is the recoloured ramp (recolour: skin).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-z', pass: 'r1', notes: 'shambling corpse, lolled head, rags, one arm reaching', mirror: false, recolour: 'skin' };
const H = 1.7;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.legs(pal.skin, 2.6, 1.4); k.boots(pal.skin, 2, 1.2);
    k.shape('body', pal.skin, [[0, shoulder - Y(0.5)], [4.6, shoulder + Y(0.5)], [4, waist], [0, waist]]);
    k.shape('rags', pal.leather, [[0, shoulder + Y(2)], [4.8, shoulder + Y(2.5)], [5, waist + Y(2)], [4, knee], [2.5, knee - Y(2)], [1, knee + Y(1)], [0, knee - Y(1)]]);
    k.off(() => k.arm(1, pal.skin, R - X(1.5), knee - Y(1), { r: 1.2 }));
    k.head(headY + Y(1.5), { mat: pal.skin, wide: 3.1, crown: 4.2, jaw: 1.8, chin: 4.4, point: 0.2, eyes: 1.7, eye: 'accent.0', hair: pal.hair });
    k.add({ type: 'path', name: 'lank-hair', mat: pal.hair, shade: 'flat', band: 1, d: k.smooth([[cx - X(3.4), headY + Y(3)], [cx - X(3.2), headY - Y(3)], [cx + X(1), headY - Y(3.2)], [cx + X(3.4), headY - Y(1)], [cx + X(1), headY - Y(1.6)], [cx - X(2), headY - Y(1)]]) });
    k.main(() => {
      k.arm(-1, pal.skin, L - X(2), shoulder + Y(1), { r: 1.2 });
      for (const d of [-1, 0, 1]) k.add({ type: 'capsule', name: 'claw', a: [L - X(2), shoulder + Y(1)], b: [L - X(4), shoulder + Y(1 + d * 1.2)], r: X(0.45), mat: pal.skin, shade: 'flat', band: 0 });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 1.5, eyes: 1.7, hand: L => [L.L - L.X(2), L.shoulder + L.Y(1)] });
