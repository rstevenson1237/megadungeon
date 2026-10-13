// npc-bandit base.v1 (r1) — a bandit on the shared person body (art/lib/person.v1.js): a cloth tied over the lower
// face and a ragged hood thrown back over unkempt hair, a patched jerkin with one bare arm, a rope belt with a knife,
// and a short hand axe raised in the right hand. Walks only (no attack).
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'npc-bandit', pass: 'r1', notes: 'face cloth, thrown-back ragged hood, patched jerkin, raised hand axe', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.legs(pal.cloth, 2.5, 1.6); k.boots(pal.leather);
    k.shape('jerkin', pal.leather, [[0, shoulder - Y(0.5)], [5, shoulder], [5.2, shoulder + Y(4)], [4.4, waist], [5.6, waist + Y(3)], [3, waist + Y(4.5)], [1.6, waist + Y(3)], [0, waist + Y(3.5)]]);
    k.front(() => k.add({ type: 'rect', name: 'patch', x: cx + X(1), y: shoulder + Y(2), w: X(2.4), h: Y(2.4), mat: pal.cloth, shade: 'flat', band: 1 }));
    k.add({ type: 'capsule', name: 'rope', a: [cx - X(4.6), waist], b: [cx + X(4.6), waist], r: X(0.6), mat: pal.cloth, shade: 'cyl', axis: 'x' });
    k.add({ type: 'path', name: 'hood-back', underlay: true, mat: pal.hair, shade: 'sphere', d: k.smooth([[cx - X(5), shoulder + Y(1)], [cx - X(4.6), headY + Y(2)], [cx, headY + Y(4)], [cx + X(4.6), headY + Y(2)], [cx + X(5), shoulder + Y(1)]]) });
    k.add({ type: 'ellipse', name: 'mop', cx, cy: headY - Y(1.5), rx: X(4.2), ry: Y(4.5), mat: pal.hair, shade: 'sphere', underlay: true });
    k.head(headY + Y(0.5), { wide: 3.2, crown: 4, jaw: 2, chin: 4.2, point: 0.2, eyes: 1.8 });
    k.add({ type: 'path', name: 'mop-fringe', mat: pal.hair, shade: 'sphere', d: k.smooth([[cx - X(3.6), headY], [cx - X(3.4), headY - Y(3.6)], [cx + X(3.4), headY - Y(3.6)], [cx + X(3.6), headY], [cx + X(1), headY - Y(1.6)], [cx - X(1.4), headY - Y(1)]]) });
    k.front(() => k.add({ type: 'path', name: 'face-cloth', mat: pal.accent, shade: 'flat', band: 1, d: k.smooth([[cx - X(3.4) - 1, headY + Y(1.8)], [cx + X(3.4) - 1, headY + Y(1.8)], [cx + X(2) - 1, headY + Y(5)], [cx - 1, headY + Y(5.8)], [cx - X(2) - 1, headY + Y(5)]]) }));
    k.off(() => {
      k.arm(1, pal.skin, R - X(2), waist + Y(0.5), { r: 1.4 });
      k.pole(pal.metal, R - X(2.5), waist + Y(0.5), R - X(3.5), waist + Y(3.5), 0.45, 'knife');
    });
    k.main(() => {
      k.arm(-1, pal.leather, L + X(1.5), shoulder + Y(1.5), { r: 1.5 });
      k.pole(pal.leather, L + X(1.5), shoulder + Y(2.5), L + X(0.5), headY - Y(4), 0.6, 'haft');
      k.add({ type: 'path', name: 'axe-head', underlay: true, mat: pal.metal, shade: 'bevel', d: k.smooth([[L + X(1), headY - Y(2)], [L - X(3), headY - Y(3)], [L - X(3.4), headY - Y(6.4)], [L + X(0.6), headY - Y(5)]]) });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { face: false, headDy: 0.5, hand: L => [L.L + L.X(1.5), L.shoulder + L.Y(1.5)] });
