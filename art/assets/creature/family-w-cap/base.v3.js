// family-w-cap base.v3 (r3, from base.v2) — ONE change: the shroud is reshaped from the shoulders as curved cloth: it
// slopes off the shoulders, narrows at the chest and flares out to a wide ragged hem (no straight vertical sides), so
// it reads as a drifting shroud, not v2's rigid rectangular block.
// base.v2 (r2, from base.v1) — ONE change: rescaled to a tall grim shroud (~38 px hood to tail tips, v1
// read ~20 px and cute): the hem now falls into 4 long thinning tails that nearly brush the floor, and the arms hang
// long and down (hands at the knees, claws pointing at the floor) instead of v1's stubby T-arms.
// v1: wraiths and shades (glyph W, 2 m): a wraith on the biped rig (art/lib/beast.v1.js) at the large frame, floating
// with no legs: a deep empty hood with two cold points of light, a body of tattered shroud that thins to ragged tails
// above the floor, long thin arms ending in reaching claw-hands. It hovers (a bob in idle) and has a faint shadow. The
// shroud is the recoloured ramp (recolour: grass).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-w-cap', pass: 'r3', notes: 'curved shroud: narrow chest, flared ragged hem; wraith rescaled tall: long thinning hem tails, long hanging arms', mirror: false, recolour: 'grass' };
const H = 2.2;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, foot } = k, c = pal.grass;
    const hover = Y(k.state === 'idle' ? k.frame : 0), sway = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) : (k.state === 'idle' ? k.frame * 0.6 : 0);
    const hemY = waist + Y(2) - hover;
    // long thinning tails, behind the shroud's body
    [[-3.2, 3.4, -1.2], [-1.1, 1.2, -0.2], [1.2, 2, 0.3], [3.3, 3.8, 1.3]].forEach(([dx, up, lean], i) => {
      const s = sway * (i % 2 ? 1 : -1) * 0.8;
      k.add({ type: 'capsule', name: 'tail', underlay: true, mat: c, shade: 'cyl', a: [cx + X(dx), hemY - Y(1)], b: [cx + X(dx + lean) + s, foot - Y(up) - hover], r: X(1.5), r1: X(0.3) });
    });
    // curved cloth: off the shoulders, narrowing at the chest, flaring to a ragged hem
    const chest = shoulder + (waist - shoulder) * 0.55, side = [[0, shoulder - Y(2)], [3.8, shoulder - Y(0.4)], [4.4, shoulder + Y(1.4)], [2.6, chest], [3.6, waist - Y(0.5)], [6.6, hemY], [5.6, hemY + Y(2.4)], [4, hemY + Y(0.6)], [2.4, hemY + Y(2.6)], [1, hemY + Y(0.8)]];
    const plus = side.map(([dx, y]) => [cx + X(dx), y]), minus = side.slice(1).reverse().map(([dx, y], i) => [cx - X(dx), y + (i % 2 ? Y(0.5) : -Y(0.3))]);
    k.add({ type: 'path', name: 'shroud', underlay: true, mat: c, shade: 'normal', round: X(2), d: k.smooth([...plus, [cx, hemY + Y(1.2)], ...minus]) });
    k.add({ type: 'path', name: 'hood', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[cx - X(4.6), shoulder + Y(1)], [cx - X(5), headY - Y(3)], [cx, headY - Y(6)], [cx + X(5), headY - Y(3)], [cx + X(4.6), shoulder + Y(1)]]) });
    k.front(() => {
      k.add({ type: 'ellipse', name: 'void', cx: cx + k.turn, cy: headY + Y(1), rx: X(2.8), ry: Y(3.4), color: 'outline' });
      [-1.3, 1.3].forEach(e => k.add({ type: 'rect', name: 'eye-point', x: Math.round(cx + X(e) + k.turn), y: Math.round(headY + Y(0.5)), w: 1, h: 1, color: 'grass.0' }));
    });
    // long arms hanging down at the sides, the claws pointing at the floor
    for (const [side, fn] of [[-1, k.main], [1, k.off]]) fn(() => {
      const hx = cx + side * X(7), hy = knee - Y(0.5);
      k.arm(side, c, hx, hy, { r: 1, wide: 4.8, hand: false });
      for (const d of [-1, 0, 1]) k.add({ type: 'capsule', name: 'finger', a: [hx, hy], b: [hx + X(d * 0.9 + side * 0.4), hy + Y(2.6 - Math.abs(d) * 0.5)], r: X(0.4), mat: c, shade: 'flat', band: 0 });
    });
  }, { height: H, shadow: { rx: 6 } });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.cx - L.X(7), L.knee + L.Y(2)] });
