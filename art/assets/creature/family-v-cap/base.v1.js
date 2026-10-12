// family-v-cap base.v1 (r1) — vampires (glyph V, 1.8 m): a vampire lord on the biped rig (art/lib/beast.v1.js): a
// tall stiff collar rising behind a pale narrow face with a widow's peak and red eyes, a long cape spread from the
// shoulders like folded wings and falling to the floor, a fitted doublet, one clawed hand raised. The cape is the
// recoloured ramp (recolour: leather).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-v-cap', pass: 'r1', notes: 'high collar, widow peak, spread cape, raised claw', mirror: false, recolour: 'leather' };
const H = 1.8;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    k.add({ type: 'path', name: 'cape', underlay: true, mat: pal.leather, shade: 'normal', round: X(2), d: k.smooth([[cx, shoulder - Y(1)], [cx + X(8), shoulder], [cx + X(10), waist], [cx + X(8), foot - Y(1)], [cx, foot - Y(2)], [cx - X(8), foot - Y(1)], [cx - X(10), waist], [cx - X(8), shoulder]]) });
    k.legs(pal.hair, 2, 1.4); k.boots(pal.hair);
    k.front(() => k.shape('doublet', pal.hair, [[0, shoulder], [4, shoulder + Y(0.5)], [3.4, waist], [3.8, waist + Y(2)], [0, waist + Y(2.5)]]));
    k.add({ type: 'path', name: 'collar', underlay: true, mat: pal.leather, shade: 'bevel', mirrorX: cx, d: `M${cx - X(2.5)} ${shoulder + Y(1)} Q${cx - X(6)} ${shoulder - Y(1)} ${cx - X(6.5)} ${headY - Y(5)} Q${cx - X(4.5)} ${headY} ${cx - X(2.5)} ${shoulder + Y(1)} Z` });
    k.head(headY, { mat: pal.cloth, wide: 2.8, crown: 4.6, jaw: 1.2, chin: 4.8, point: 0.7, eyes: 1.5, eye: 'accent.1', hair: pal.hair });
    k.front(() => k.add({ type: 'path', name: 'peak', mat: pal.hair, shade: 'sphere', d: `M${cx - X(3)} ${headY - Y(1)} Q${cx - X(3)} ${headY - Y(5)} ${cx} ${headY - Y(5)} Q${cx + X(3)} ${headY - Y(5)} ${cx + X(3)} ${headY - Y(1)} L${cx + X(1.5)} ${headY - Y(2.4)} L${cx + k.turn} ${headY - Y(0.5)} L${cx - X(1.5)} ${headY - Y(2.4)} Z` }));
    k.off(() => k.arm(1, pal.hair, R - X(2.5), waist - Y(0.5), { r: 1.3, glove: pal.cloth }));
    k.main(() => {
      k.arm(-1, pal.hair, L + X(0.5), shoulder - Y(2), { r: 1.3, glove: pal.cloth });
      for (const d of [-1, 0, 1]) k.add({ type: 'capsule', name: 'claw', a: [L + X(0.5), shoulder - Y(2)], b: [L - X(1) + X(d), shoulder - Y(5)], r: X(0.4), mat: pal.cloth, shade: 'flat', band: 0 });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, eyes: 1.5, hand: L => [L.L + L.X(0.5), L.shoulder - L.Y(2)] });
