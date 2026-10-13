// family-w-cap base.v4 (x1, from base.v3) — ONE change (the blind reviewer's): the wraith is stretched tall and thin
// so it towers over the player instead of reading short and squat: rig height 2.2 -> 2.7 m with a longer drifting
// body; the big round hood becomes a tall narrow peaked hood (a cowl that rises to a point, a deep void below it);
// the arms are long and thin and hang to well below the hem, ending in long hooked claws; and the hem trails into
// 6 longer tattered strips that thin and turn lighter toward the floor (each strip's lower run is a thin pale wisp),
// lifting off the ground instead of touching it.
// base.v3 (r3, from base.v2) — ONE change: the shroud is reshaped from the shoulders as curved cloth: it
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
export const meta = { brief: 'family-w-cap', pass: 'x1', notes: 'stretched tall and thin: narrow peaked hood, long claw arms below the hem, long tattered strips fading pale toward the floor', mirror: false, recolour: 'grass' };
const H = 2.7;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot } = k, c = pal.grass;
    const hover = Y(k.state === 'idle' ? k.frame * 0.7 : 0), sway = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) : (k.state === 'idle' ? k.frame * 0.6 : 0);
    const hemY = waist + Y(1) - hover;
    // long tattered strips behind the body: a cloth run, then a thin pale wisp that fades out above the floor
    [[-3.4, 4.2, -1.4], [-2.2, 2.2, -0.6], [-0.8, 3.2, -0.2], [0.8, 1.6, 0.3], [2.2, 2.8, 0.8], [3.4, 4.6, 1.5]].forEach(([dx, up, lean], i) => {
      const s = sway * (i % 2 ? 1 : -1) * 0.8, top = [cx + X(dx), hemY - Y(2)], tip = [cx + X(dx + lean) + s, foot - Y(up) - hover];
      const mid = [top[0] + (tip[0] - top[0]) * 0.6, top[1] + (tip[1] - top[1]) * 0.6];
      k.add({ type: 'capsule', name: 'tail', underlay: true, mat: c, shade: 'cyl', a: top, b: mid, r: X(1.3), r1: X(0.6) });
      k.add({ type: 'capsule', name: 'wisp', mat: c, shade: 'flat', band: 1, a: mid, b: tip, r: X(0.45), r1: X(0.2) });
    });
    // curved cloth: off narrow shoulders, slim at the chest, flaring a little to a ragged hem
    const chest = shoulder + (waist - shoulder) * 0.5, side = [[0, shoulder - Y(2)], [3.4, shoulder - Y(0.6)], [4.2, shoulder + Y(1.6)], [3.2, chest], [2.8, waist - Y(1)], [3.8, hemY], [3.4, hemY + Y(3)], [2.4, hemY + Y(1)], [1.6, hemY + Y(3.4)], [0.7, hemY + Y(1.2)]];
    const plus = side.map(([dx, y]) => [cx + X(dx), y]), minus = side.slice(1).reverse().map(([dx, y], i) => [cx - X(dx), y + (i % 2 ? Y(0.5) : -Y(0.3))]);
    k.add({ type: 'path', name: 'shroud', underlay: true, mat: c, shade: 'normal', round: X(2), d: k.smooth([...plus, [cx, hemY + Y(1.4)], ...minus]) });
    // a tall narrow cowl rising to a peak (slightly hooked forward), not a round head
    k.add({ type: 'path', name: 'hood', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[cx - X(4.4), shoulder + Y(1.4)], [cx - X(3.8), headY - Y(1)], [cx - X(3), headY - Y(4.5)], [cx - X(2.6), headY - Y(8)], [cx - X(0.6), headY - Y(6.6)], [cx + X(2.6), headY - Y(4)], [cx + X(3.8), headY - Y(1)], [cx + X(4.4), shoulder + Y(1.4)]]) });
    k.front(() => {
      k.add({ type: 'ellipse', name: 'void', cx: cx + k.turn * 0.5, cy: headY + Y(0.6), rx: X(2), ry: Y(3.4), color: 'outline' });
      [-0.9, 0.9].forEach(e => k.add({ type: 'rect', name: 'eye-point', x: Math.round(cx + X(e) + k.turn * 0.5), y: Math.round(headY), w: 1, h: 1, color: 'grass.0' }));
    });
    // long thin arms hanging well below the hem, ending in long hooked claws
    for (const [side, fn] of [[-1, k.main], [1, k.off]]) fn(() => {
      const hx = cx + side * X(6), hy = hemY + Y(5.5);
      k.arm(side, c, hx, hy, { r: 0.8, wide: 3.8, hand: false });
      k.add({ type: 'circle', name: 'hand', cx: hx, cy: hy, r: X(0.8), mat: c, shade: 'sphere' });
      for (const d of [-1, 0, 1]) k.add({ type: 'tube', name: 'claw', pts: [[hx, hy], [hx + X(d * 0.8 + side * 0.2), hy + Y(2.6 - Math.abs(d) * 0.6)], [hx + X(d * 1 - side * 0.5), hy + Y(3.6 - Math.abs(d) * 0.7)]], w: X(0.7), w1: X(0.3), mat: c, shade: 'flat', band: 0 });
    });
  }, { height: H, shadow: { rx: 6 } });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.cx - L.X(6), L.waist + L.Y(6.5)] });
