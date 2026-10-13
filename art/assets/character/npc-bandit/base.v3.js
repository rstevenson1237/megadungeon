// npc-bandit base.v3 (r3) — from base.v2, one change (the review's next change): the hood's
// shading. Its body is the cloth ramp's mid step (front and back), with a highlight band (light step) along its
// up-left edge; the darkest step is kept only for the rim of the face opening, so the hood no longer merges with the
// outline into a black mass, worst in the n/w backs.
// npc-bandit base.v2 (r2) — from base.v1, one change (the review's next change): the head — the boxy hair mop and
// fringe are gone; an egg-shaped head sits under a dark cloth-ramp hood (open at the face, falling to the shoulders),
// and the face mask is dark leather instead of the bright accent.
// base.v1 (r1) — a bandit on the shared person body (art/lib/person.v1.js): a cloth tied over the lower
// face and a ragged hood thrown back over unkempt hair, a patched jerkin with one bare arm, a rope belt with a knife,
// and a short hand axe raised in the right hand. Walks only (no attack).
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'npc-bandit', pass: 'r3', notes: 'face cloth, thrown-back ragged hood, patched jerkin, raised hand axe', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.legs(pal.cloth, 2.5, 1.6); k.boots(pal.leather);
    k.shape('jerkin', pal.leather, [[0, shoulder - Y(0.5)], [5, shoulder], [5.2, shoulder + Y(4)], [4.4, waist], [5.6, waist + Y(3)], [3, waist + Y(4.5)], [1.6, waist + Y(3)], [0, waist + Y(3.5)]]);
    k.front(() => k.add({ type: 'rect', name: 'patch', x: cx + X(1), y: shoulder + Y(2), w: X(2.4), h: Y(2.4), mat: pal.cloth, shade: 'flat', band: 1 }));
    k.add({ type: 'capsule', name: 'rope', a: [cx - X(4.6), waist], b: [cx + X(4.6), waist], r: X(0.6), mat: pal.cloth, shade: 'cyl', axis: 'x' });
    const hy = headY + Y(0.5);
    // hood: a dark cloth cowl, egg-shaped over the head and widening to the shoulders, open at the face
    const hoodOuter = k.smooth([[cx, hy - Y(6)], [cx + X(3.8), hy - Y(4.6)], [cx + X(4.5), hy], [cx + X(5.4), shoulder + Y(1.5)], [cx - X(5.4), shoulder + Y(1.5)], [cx - X(4.5), hy], [cx - X(3.8), hy - Y(4.6)]]);
    k.add({ type: 'path', name: 'hood', underlay: true, mat: pal.cloth, shade: 'flat', band: 1, d: hoodOuter });
    k.add({ type: 'path', name: 'hood-lit', mat: pal.cloth, shade: 'flat', band: 0, d: k.smooth([[cx - X(1), hy - Y(5.6)], [cx - X(3.4), hy - Y(4.2)], [cx - X(4.1), hy - Y(0.5)], [cx - X(3.4), hy - Y(2.5)], [cx - X(1.6), hy - Y(4.6)]]) });
    // the egg-shaped head inside the hood's opening; from behind the hood covers it
    k.head(hy, { wide: 2.9, crown: 4, jaw: 1.7, chin: 4.2, point: 0.35, eyes: 1.4, ears: false, hair: pal.cloth });
    k.front(() => k.add({ type: 'path', name: 'hood-rim', mat: pal.cloth, shade: 'flat', band: 2, d: k.smooth([[cx - X(3.6), hy - Y(0.6)], [cx - X(3.2), hy - Y(3.8)], [cx, hy - Y(5)], [cx + X(3.2), hy - Y(3.8)], [cx + X(3.6), hy - Y(0.6)], [cx + X(2.8), hy - Y(2.4)], [cx, hy - Y(3.2)], [cx - X(2.8), hy - Y(2.4)]]) }));
    k.rear(() => {
      k.add({ type: 'path', name: 'hood-crown', mat: pal.cloth, shade: 'flat', band: 1, d: k.smooth([[cx, hy - Y(5.4)], [cx + X(3.4), hy - Y(4)], [cx + X(3.6), hy + Y(3.6)], [cx + X(2.4), hy + Y(5)], [cx - X(2.4), hy + Y(5)], [cx - X(3.6), hy + Y(3.6)], [cx - X(3.4), hy - Y(4)]]) });
      k.add({ type: 'path', name: 'hood-crown-lit', mat: pal.cloth, shade: 'flat', band: 0, d: k.smooth([[cx - X(0.6), hy - Y(5.6)], [cx - X(3.4), hy - Y(4.2)], [cx - X(4.1), hy + Y(0.5)], [cx - X(3.2), hy - Y(1.5)], [cx - X(1.4), hy - Y(4.4)]]) });
      // a fold down the back of the hood, one step darker than its body
      k.add({ type: 'rect', name: 'hood-fold', x: Math.round(cx + X(1)), y: Math.round(hy - Y(2)), w: 1, h: Y(5), mat: pal.cloth, shade: 'flat', band: 2 });
    });
    // the face mask: dark leather tied over the nose and mouth
    k.front(() => k.add({ type: 'path', name: 'face-cloth', mat: pal.leather, shade: 'flat', band: 2, d: k.smooth([[cx - X(3) - 1, hy + Y(1.6)], [cx + X(3) - 1, hy + Y(1.6)], [cx + X(1.8) - 1, hy + Y(4.4)], [cx - 1, hy + Y(5)], [cx - X(1.8) - 1, hy + Y(4.4)]]) }));
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
export const anchors = ctx => personAnchors(ctx, { face: false, eyes: 1.4, headDy: 0.5, hand: L => [L.L + L.X(1.5), L.shoulder + L.Y(1.5)] });
