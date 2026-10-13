// family-t-cap base.v1 (r1) — trolls (glyph T, 3 m): a troll on the biped rig (art/lib/beast.v1.js) at the large
// frame: stooped, with very long arms whose knuckles near the floor, a long hooked nose and a lank mane, warty hide,
// a shallow chest, a rag at the hips and bare clawed feet. The hide is the recoloured ramp (recolour: grass).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-t-cap', pass: 'r1', notes: 'troll: stooped, very long arms, hooked nose, lank mane', mirror: false, recolour: 'grass' };
const H = 3;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, foot, L, R } = k, c = pal.grass, dn = Y(2);
    k.legs(c, 2.8, 1.8); k.boots(c, 2.6, 1.2);
    k.shape('rag', pal.leather, [[0, waist], [4.6, waist], [4, knee - Y(1.5)], [2, knee - Y(3)], [0, knee - Y(1)]]);
    k.shape('body', c, [[0, shoulder + dn - Y(1)], [6, shoulder + dn], [6, shoulder + dn + Y(3)], [4.4, waist], [0, waist + Y(0.5)]]);
    for (const [dx, dy] of [[-2, 3], [2.6, 5], [-3.4, 7], [1, 8.5]]) k.add({ type: 'circle', name: 'wart', cx: cx + X(dx), cy: shoulder + dn + Y(dy), r: X(0.6), mat: c, shade: 'flat', band: 0 });
    k.add({ type: 'ellipse', name: 'mane', cx, cy: headY + dn + Y(1), rx: X(4.4), ry: Y(5.4), mat: pal.hair, shade: 'sphere', underlay: true });
    k.head(headY + dn + Y(1), { mat: c, wide: 3, crown: 4, jaw: 1.6, chin: 4.6, point: 0.5, eyes: 1.5, eye: 'accent.0', hair: pal.hair, nose: false });
    k.front(() => k.add({ type: 'path', name: 'nose', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[cx + k.turn - X(0.6), headY + dn + Y(1)], [cx + k.turn - X(3), headY + dn + Y(4)], [cx + k.turn - X(2.4), headY + dn + Y(5)], [cx + k.turn + X(0.6), headY + dn + Y(3)]]) }));
    for (const side of [-1, 1]) {
      const draw = () => {
        k.arm(side, c, cx + side * X(8), knee + Y(2), { r: 1.6, wide: 5.6, handR: 1.6 });
        for (const d of [-1, 0, 1]) k.add({ type: 'capsule', name: 'claw', a: [cx + side * X(8), knee + Y(2.5)], b: [cx + side * X(8) + X(d), knee + Y(4.5)], r: X(0.45), mat: pal.cloth, shade: 'flat', band: 0 });
      };
      side < 0 ? k.main(draw) : k.off(draw);
    }
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 3, eyes: 1.5, hand: L => [L.cx - L.X(8), L.knee + L.Y(2)] });
