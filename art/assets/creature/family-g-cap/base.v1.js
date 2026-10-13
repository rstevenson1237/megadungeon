// family-g-cap base.v1 (r1) — giants and titans (glyph G, 4.5 m, the tallest family): a hill giant on the biped rig
// (art/lib/beast.v1.js) filling the large frame: a broad bearded head with a heavy brow under a band of beaten metal,
// a rough tunic belted with rope, bare massive arms, wrapped legs, and a great stone-headed maul over the right
// shoulder. The tunic is the recoloured ramp (recolour: leather).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-g-cap', pass: 'r1', notes: 'hill giant: bearded, brow band, rough tunic, stone maul on the shoulder', mirror: false, recolour: 'leather' };
const H = 4.5;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.legs(pal.cloth, 2.6, 1.9); k.boots(pal.leather, 2.4, 1.3);
    k.shape('tunic', pal.leather, [[0, shoulder - Y(0.5)], [5.6, shoulder], [5.8, shoulder + Y(4)], [4.8, waist], [5.6, knee - Y(1)], [0, knee - Y(0.5)]]);
    k.add({ type: 'capsule', name: 'rope', a: [cx - X(4.8), waist], b: [cx + X(4.8), waist], r: X(0.6), mat: pal.hair, shade: 'cyl', axis: 'x' });
    k.off(() => k.arm(1, pal.skin, R - X(1), waist + Y(1), { r: 1.8, wide: 5.4 }));
    k.head(headY, { wide: 3.4, crown: 4.2, jaw: 2.6, chin: 4.4, point: 0, eyes: 1.6 });
    k.front(() => k.add({ type: 'path', name: 'beard', mat: pal.hair, shade: 'sphere', d: k.smooth([[cx - X(3.2) + k.turn, headY + Y(1.6)], [cx + X(3.2) + k.turn, headY + Y(1.6)], [cx + X(2.4) + k.turn, headY + Y(5.5)], [cx + k.turn, headY + Y(7)], [cx - X(2.4) + k.turn, headY + Y(5.5)]]) }));
    k.add({ type: 'rect', name: 'brow-band', x: cx - X(3.4), y: headY - Y(2.4), w: X(6.8), h: Y(1.2), mat: pal.cloth, shade: 'flat', band: 0 });
    k.main(() => {
      k.arm(-1, pal.skin, cx - X(5), shoulder - Y(1.5), { r: 1.8, wide: 5.4 });
      k.pole(pal.leather, cx - X(5), shoulder - Y(1.5), cx - X(11), headY - Y(1), 0.8, 'haft');
      k.add({ type: 'rect', name: 'maul', x: cx - X(14), y: headY - Y(5), w: X(6.4), h: Y(5), r: X(1.4), mat: pal.cloth, shade: 'normal', round: X(1.5), underlay: true, rotate: -20, origin: [cx - X(11), headY - Y(2.5)] });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, eyes: 1.6, hand: L => [L.cx - L.X(5), L.shoulder - L.Y(1.5)] });
