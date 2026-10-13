// family-g base.v3 (r3, from base.v2) — changed: the head is redrawn as a plain egg (no nose stripe) set over the ear
// roots with two dark 1 px eyes between the ears on the front facings, and the sling is replaced by a clear 1 px bow
// arc held in the right hand on the viewer's left, with a 1 px string.
// family-g base.v2 (r2, from base.v1) — changed: long drooping ears, drawn here as broad skin-ramp blades whose points
// stick out ~4 px past both sides of the head and hang below the eyes, so the head reads goblin at 1x.
// family-g base.v1 (r1) — goblins with slings, bows and war-chants (glyph g, 1.1 m): a hunched goblin on the biped
// rig (art/lib/beast.v1.js): a big head with long drooping ears and a hooked nose, a pot belly in a ragged tunic, thin
// bowed legs, a sling whirled in the right hand. The skin is the recoloured ramp (recolour: skin).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-g', pass: 'r3', notes: 'hunched goblin, long ears, egg head, pot belly, bow', mirror: false, recolour: 'skin' };
const H = 1.1;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, L, R } = k;
    k.legs(pal.skin, 2.6, 1.5); k.boots(pal.skin, 2.2, 1.3);
    k.shape('tunic', pal.leather, [[0, shoulder], [4.4, shoulder + Y(1)], [5.6, waist - Y(2)], [5, waist + Y(2.5)], [2.5, waist + Y(3.5)], [0, waist + Y(3)]]);
    k.off(() => k.arm(1, pal.skin, R - X(2), waist + Y(1), { r: 1.4 }));
    const hy = headY + Y(2.5), wd = X(5.4);
    k.add({ type: 'poly', name: 'ear', underlay: true, mat: pal.skin, shade: 'flat', band: 1, mirrorX: cx, pts: [[cx - wd * 0.8, hy - Y(2.5)], [cx - wd - 1.5, hy - Y(1.2)], [cx - wd - 4.5, hy + Y(3)], [cx - wd - 1, hy + Y(1.8)], [cx - wd * 0.85, hy + Y(1.5)]] });
    // an egg of a head over the ear roots, broad crown, narrow chin; two dark eyes between the ears from the front
    k.add({ type: 'path', name: 'head', underlay: true, mat: pal.skin, shade: 'sphere', d: k.smooth([[cx, hy - Y(5.6)], [cx + X(4.6), hy - Y(4.2)], [cx + X(5.6), hy + Y(0.5)], [cx + X(3.4), hy + Y(4)], [cx, hy + Y(4.8)], [cx - X(3.4), hy + Y(4)], [cx - X(5.6), hy + Y(0.5)], [cx - X(4.6), hy - Y(4.2)]]) });
    k.front(() => [-1.4, 2].forEach(e => k.add({ type: 'rect', name: 'eye', x: Math.round(cx + X(e) + k.turn), y: Math.round(hy), w: 1, h: 1, color: 'outline' })));
    k.main(() => {
      k.arm(-1, pal.skin, L - X(1), shoulder - Y(1), { r: 1.4 });
      // a short bow held upright in the fist: a 1 px arc bowed out to the left and its 1 px string
      const bx = L - X(1), by = shoulder - Y(1), r = 6;
      k.add({ type: 'arc', name: 'bow', cx: bx + r - 1.5, cy: by, r, w: 1.2, a0: 130, a1: 230, color: 'cloth.0' });
      k.add({ type: 'rect', name: 'string', x: Math.round(bx + r - 1.5 + r * Math.cos(130 * Math.PI / 180)), y: Math.round(by - r * Math.sin(130 * Math.PI / 180)), w: 1, h: Math.round(2 * r * Math.sin(130 * Math.PI / 180)), color: 'leather.1' });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 2.5, eyes: 1.7, hand: L => [L.L - L.X(1), L.shoulder - L.Y(1)] });
