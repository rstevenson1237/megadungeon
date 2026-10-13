// class-beastmaster base.v1 (r1) — the Beastmaster on the shared player body (art/lib/person.v1.js): a wolf-pelt
// mantle over the shoulders, braided hair and a painted stripe across the eyes, a fringed leather tunic, a spear held
// upright in the right hand, a heavy gauntlet raised on the left arm with a hawk perched on it, wings half open, and a
// shortbow slung on the back.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-beastmaster', pass: 'r1', notes: 'wolf mantle, braids, spear, hawk on a raised gauntlet, bow on the back', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, foot, L, R } = k;
    k.worn(() => k.add({ type: 'arc', name: 'slung-bow', underlay: true, cx: cx - X(4), cy: shoulder + Y(2), r: X(8), w: X(1.1), a0: -60, a1: 40, mat: pal.leather, shade: 'flat', band: 0 }));
    k.legs(pal.leather, 2.4, 1.6); k.boots(pal.hair);
    k.shape('tunic', pal.leather, [[0, shoulder - Y(0.5)], [4.8, shoulder], [4.8, shoulder + Y(4)], [4.4, waist], [5.6, knee - Y(1)], [0, knee - Y(0.5)]]);
    k.add({ type: 'path', name: 'mantle', underlay: true, mat: pal.hair, shade: 'sphere', d: k.smooth([[cx - X(7), shoulder + Y(3)], [cx - X(6), shoulder - Y(1.5)], [cx, shoulder - Y(2)], [cx + X(6), shoulder - Y(1.5)], [cx + X(7), shoulder + Y(3)], [cx, shoulder + Y(2)]]) });
    k.head(headY, { wide: 3.3, crown: 4.4, jaw: 2, chin: 4.2, point: 0.2, eyes: 1.8 });
    k.add({ type: 'path', name: 'hair', underlay: true, mat: pal.hair, shade: 'sphere', d: k.smooth([[cx - X(3.6), headY + Y(0.5)], [cx - X(3.6), headY - Y(3.6)], [cx, headY - Y(5)], [cx + X(3.6), headY - Y(3.6)], [cx + X(3.6), headY + Y(0.5)], [cx, headY - Y(3)]]) });
    for (const s of [-1, 1]) k.add({ type: 'capsule', name: 'braid', a: [cx + s * X(3.4), headY], b: [cx + s * X(3.6), shoulder + Y(2)], r: X(0.8), mat: pal.hair, shade: 'cyl' });
    k.front(() => k.add({ type: 'rect', name: 'warpaint', x: cx - X(3) - 1, y: headY - Y(0.6), w: X(6), h: 1, mat: pal.accent, shade: 'flat', band: 1 }));
    k.off(() => {
      k.arm(1, pal.leather, R - X(1), shoulder - Y(1), { r: 1.6, glove: pal.leather });
      k.add({ type: 'ellipse', name: 'hawk', cx: R - X(0.5), cy: shoulder - Y(4), rx: X(1.8), ry: Y(2.6), mat: pal.hair, shade: 'sphere', underlay: true });
      k.add({ type: 'path', name: 'wing', underlay: true, mat: pal.hair, shade: 'flat', band: 1, d: k.smooth([[R - X(1), shoulder - Y(4.5)], [R + X(3.5), shoulder - Y(8)], [R + X(4.5), shoulder - Y(5)], [R + X(1), shoulder - Y(2.5)]]) });
      k.add({ type: 'circle', name: 'hawk-head', cx: R - X(1), cy: shoulder - Y(7), r: X(1.2), mat: pal.cloth, shade: 'sphere', underlay: true });
      k.add({ type: 'rect', name: 'beak', x: R - X(2.6), y: shoulder - Y(7), w: 1, h: 1, mat: pal.accent, shade: 'flat', band: 0 });
    });
    k.main(() => {
      k.pole(pal.leather, L, foot - Y(2), L - X(1), headY - Y(5), 0.6, 'spear');
      k.add({ type: 'path', name: 'spear-head', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${L - X(2.2)} ${headY - Y(4.5)} L${L - X(1.2)} ${headY - Y(10)} L${L} ${headY - Y(4.5)} Z` });
      k.arm(-1, pal.leather, L + X(0.5), waist - Y(2), { r: 1.4, glove: pal.leather });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.8, hand: L => [L.L + L.X(0.5), L.waist - L.Y(2)] });
