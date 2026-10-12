// family-c-cap base.v1 (r1) — golems and constructs (glyph C, 3 m): a stone golem on the biped rig
// (art/lib/beast.v1.js) at the large frame: built of stacked dressed blocks (a construct may be boxy), a small
// square head with two glowing slits sunk between great shoulder blocks, a carved rune on the chest, columnar legs and
// arms of fitted stones ending in heavy block fists. The stone is the recoloured ramp (recolour: cloth).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-c-cap', pass: 'r1', notes: 'stone golem: stacked blocks, sunk head, glowing slits, chest rune', mirror: false, recolour: 'cloth' };
const H = 3;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, foot, L, R, P } = k, c = pal.cloth;
    P.feet.forEach((dy, i) => {
      const x = i ? k.baseCx + X(1.4) : k.baseCx - X(5);
      k.add({ type: 'rect', name: 'leg', underlay: true, mat: c, shade: 'bevel', x, y: waist + Y(1), w: X(3.6), h: knee - waist, r: X(0.6) });
      k.add({ type: 'rect', name: 'shin', underlay: true, mat: c, shade: 'bevel', x: x - X(0.3), y: knee + Y(0.5), w: X(4.2), h: foot - knee - Y(0.5) + dy, r: X(0.6) });
    });
    k.add({ type: 'rect', name: 'chest', underlay: true, mat: c, shade: 'normal', round: X(1), x: cx - X(6), y: shoulder - Y(1), w: X(12), h: waist - shoulder + Y(2), r: X(1) });
    k.add({ type: 'rect', name: 'seam', x: cx - X(6), y: shoulder + Y(4), w: X(12), h: 1, color: 'outline' });
    k.front(() => {
      k.add({ type: 'rect', name: 'rune', x: cx - X(0.6) + k.turn, y: shoulder + Y(0.6), w: X(1.2), h: Y(3), mat: pal.accent, shade: 'flat', band: 1 });
      k.add({ type: 'rect', name: 'rune', x: cx - X(1.8) + k.turn, y: shoulder + Y(1.4), w: X(3.6), h: Y(0.9), mat: pal.accent, shade: 'flat', band: 1 });
    });
    k.add({ type: 'rect', name: 'head', underlay: true, mat: c, shade: 'normal', round: X(1), x: cx - X(2.8), y: headY - Y(2.5), w: X(5.6), h: Y(5), r: X(0.8) });
    k.front(() => [-1.4, 1.4].forEach(e => k.add({ type: 'rect', name: 'slit', x: Math.round(cx + X(e) - X(0.6) + k.turn), y: Math.round(headY), w: Math.round(X(1.2)), h: 1, color: 'accent.0' })));
    for (const [side, fn] of [[-1, k.main], [1, k.off]]) fn(() => {
      const sx = cx + side * X(7.5);
      k.add({ type: 'rect', name: 'shoulder', underlay: true, mat: c, shade: 'bevel', x: sx - X(2.5), y: shoulder - Y(2), w: X(5), h: Y(4), r: X(0.6) });
      k.add({ type: 'rect', name: 'arm', underlay: true, mat: c, shade: 'bevel', x: sx - X(1.6), y: shoulder + Y(2), w: X(3.2), h: Y(7), r: X(0.6) });
      k.add({ type: 'rect', name: 'fist', underlay: true, mat: c, shade: 'bevel', x: sx - X(2.2), y: waist + Y(1), w: X(4.4), h: Y(3.6), r: X(0.8) });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.cx - L.X(7.5), L.waist + L.Y(2.5)] });
