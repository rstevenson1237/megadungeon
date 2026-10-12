// family-w-cap base.v1 (r1) — wraiths and shades (glyph W, 2 m): a wraith on the biped rig (art/lib/beast.v1.js) at
// the large frame, floating with no legs: a deep empty hood with two cold points of light, a body of tattered shroud
// that thins to ragged tails above the floor, long thin arms ending in reaching claw-hands. It hovers (a bob in idle)
// and has a faint shadow. The shroud is the recoloured ramp (recolour: grass).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-w-cap', pass: 'r1', notes: 'wraith: empty hood, cold eye-points, shroud thinning to tails, floats', mirror: false, recolour: 'grass' };
const H = 2;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, foot, L, R } = k, c = pal.grass, lift = Y(3 + (k.state === 'idle' ? k.frame : 0));
    k.add({ type: 'path', name: 'shroud', underlay: true, mat: c, shade: 'normal', round: X(2), d: k.smooth([[cx, shoulder - Y(2)], [cx + X(5.5), shoulder], [cx + X(6), waist], [cx + X(4.6), knee - lift], [cx + X(5), foot - lift], [cx + X(2.4), knee + Y(1) - lift], [cx + X(0.5), foot - lift + Y(1)], [cx - X(2), knee - lift], [cx - X(4), foot - lift - Y(1)], [cx - X(4.6), knee - Y(2) - lift], [cx - X(6), waist], [cx - X(5.5), shoulder]]) });
    k.add({ type: 'path', name: 'hood', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[cx - X(4.6), shoulder + Y(1)], [cx - X(5), headY - Y(3)], [cx, headY - Y(6)], [cx + X(5), headY - Y(3)], [cx + X(4.6), shoulder + Y(1)]]) });
    k.front(() => {
      k.add({ type: 'ellipse', name: 'void', cx: cx + k.turn, cy: headY + Y(1), rx: X(2.8), ry: Y(3.4), color: 'outline' });
      [-1.3, 1.3].forEach(e => k.add({ type: 'rect', name: 'eye-point', x: Math.round(cx + X(e) + k.turn), y: Math.round(headY + Y(0.5)), w: 1, h: 1, color: 'grass.0' }));
    });
    for (const [side, fn] of [[-1, k.main], [1, k.off]]) fn(() => {
      k.arm(side, c, cx + side * X(9), waist - Y(3), { r: 1, wide: 4.8, hand: false });
      for (const d of [-1, 0, 1]) k.add({ type: 'capsule', name: 'finger', a: [cx + side * X(9), waist - Y(3)], b: [cx + side * X(11), waist - Y(3) + X(d * 1.4)], r: X(0.4), mat: c, shade: 'flat', band: 0 });
    });
  }, { height: H, shadow: { rx: 6 } });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.cx - L.X(9), L.waist - L.Y(3)] });
