// family-g base.v2 (r2, from base.v1) — changed: long drooping ears, drawn here as broad skin-ramp blades whose points
// stick out ~4 px past both sides of the head and hang below the eyes, so the head reads goblin at 1x.
// family-g base.v1 (r1) — goblins with slings, bows and war-chants (glyph g, 1.1 m): a hunched goblin on the biped
// rig (art/lib/beast.v1.js): a big head with long drooping ears and a hooked nose, a pot belly in a ragged tunic, thin
// bowed legs, a sling whirled in the right hand. The skin is the recoloured ramp (recolour: skin).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-g', pass: 'r2', notes: 'hunched goblin, long ears, pot belly, sling', mirror: false, recolour: 'skin' };
const H = 1.1;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, L, R } = k;
    k.legs(pal.skin, 2.6, 1.5); k.boots(pal.skin, 2.2, 1.3);
    k.shape('tunic', pal.leather, [[0, shoulder], [4.4, shoulder + Y(1)], [5.6, waist - Y(2)], [5, waist + Y(2.5)], [2.5, waist + Y(3.5)], [0, waist + Y(3)]]);
    k.off(() => k.arm(1, pal.skin, R - X(2), waist + Y(1), { r: 1.4 }));
    k.head(headY + Y(2.5), { mat: pal.skin, wide: 4.6, crown: 5, jaw: 2.4, chin: 4.4, point: 0.5, eyes: 2, eyeSize: 1.2, eye: 'accent.1', hair: pal.skin, nose: 2.5 });
    const hy = headY + Y(2.5), wd = X(4.6);
    k.add({ type: 'poly', name: 'ear', underlay: true, mat: pal.skin, shade: 'flat', band: 1, mirrorX: cx, pts: [[cx - wd * 0.8, hy - Y(2.5)], [cx - wd - 1.5, hy - Y(1.2)], [cx - wd - 4.5, hy + Y(3)], [cx - wd - 1, hy + Y(1.8)], [cx - wd * 0.85, hy + Y(1.5)]] });
    k.main(() => {
      k.arm(-1, pal.skin, L + X(1), shoulder - Y(1), { r: 1.4 });
      k.add({ type: 'tube', name: 'sling', mat: pal.leather, shade: 'flat', band: 1, pts: [[L + X(1), shoulder - Y(1)], [L - X(2), shoulder - Y(6)], [L + X(2), shoulder - Y(8)]], w: X(0.9) });
      k.add({ type: 'circle', name: 'stone', cx: L + X(2.5), cy: shoulder - Y(8.5), r: X(1.3), mat: pal.cloth, shade: 'sphere' });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 2.5, hand: L => [L.L + L.X(1), L.shoulder - L.Y(1)] });
