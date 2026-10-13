// family-o base.v1 (r1) — orcs (glyph o, 1.9 m): a broad orc raider on the biped rig (art/lib/beast.v1.js): a heavy
// brow, tusks jutting from an underbite, a topknot, hunched massive shoulders with a spiked pauldron, a hide kilt and
// a notched cleaver in the right hand. The skin is the recoloured ramp (recolour: skin).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-o', pass: 'r1', notes: 'broad orc, tusks, topknot, spiked pauldron, cleaver', mirror: false, recolour: 'skin' };
const H = 1.9;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.legs(pal.skin, 2.8, 1.9); k.boots(pal.leather, 2.4, 1.5);
    k.shape('kilt', pal.leather, [[0, waist - Y(1)], [5, waist - Y(1)], [5.8, knee - Y(1)], [0, knee - Y(0.5)]]);
    k.shape('torso', pal.skin, [[0, shoulder - Y(1)], [6.4, shoulder], [6.4, shoulder + Y(3)], [5, waist], [0, waist]]);
    k.add({ type: 'rect', name: 'belt', x: cx - X(5), y: waist - Y(1.4), w: X(10), h: Y(1.8), mat: pal.leather, shade: 'flat', band: 2 });
    k.add({ type: 'ellipse', name: 'pauldron', cx: cx - X(5.6), cy: shoulder, rx: X(3), ry: Y(2.2), mat: pal.cloth, shade: 'sphere', underlay: true });
    for (const d of [-1, 0, 1]) k.add({ type: 'poly', name: 'spike', mat: pal.cloth, shade: 'flat', band: 0, pts: [[cx - X(5.6) + X(d * 1.6) - X(0.6), shoulder - Y(1.6)], [cx - X(5.6) + X(d * 1.6), shoulder - Y(4)], [cx - X(5.6) + X(d * 1.6) + X(0.6), shoulder - Y(1.6)]] });
    k.off(() => k.arm(1, pal.skin, R - X(1), waist, { r: 1.9 }));
    k.head(headY + Y(1.5), { mat: pal.skin, wide: 3.8, crown: 4, jaw: 3.2, chin: 4.2, point: 0, eyes: 1.8, eye: 'accent.1', hair: pal.hair });
    k.front(() => {
      k.add({ type: 'rect', name: 'brow', x: cx - X(3) + k.turn, y: headY + Y(0.6), w: X(6), h: Y(1), mat: pal.skin, shade: 'flat', band: 2 });
      for (const s of [-1, 1]) k.add({ type: 'poly', name: 'tusk', mat: pal.cloth, shade: 'flat', band: 0, pts: [[cx + s * X(1.6) + k.turn, headY + Y(4.4)], [cx + s * X(1.9) + k.turn, headY + Y(2.2)], [cx + s * X(2.6) + k.turn, headY + Y(4.4)]] });
    });
    k.add({ type: 'ellipse', name: 'topknot', cx, cy: headY - Y(3.4), rx: X(1.4), ry: Y(2), mat: pal.hair, shade: 'sphere', underlay: true });
    k.main(() => {
      k.arm(-1, pal.skin, L + X(1.5), waist - Y(1), { r: 1.9 });
      k.pole(pal.leather, L + X(1.5), waist - Y(1), L, shoulder - Y(1), 0.7, 'grip');
      k.add({ type: 'path', name: 'cleaver', underlay: true, mat: pal.cloth, shade: 'bevel', d: `M${L - X(1)} ${shoulder} L${L - X(2)} ${headY - Y(4)} L${L + X(3)} ${headY - Y(2)} L${L + X(2.5)} ${headY + Y(1)} L${L + X(1)} ${headY + Y(2)} L${L + X(1)} ${shoulder} Z` });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 1.5, eyes: 1.8, hand: L => [L.L + L.X(1.5), L.waist - L.Y(1)] });
