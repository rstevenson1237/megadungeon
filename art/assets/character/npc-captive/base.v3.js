// npc-captive base.v3 (r3) — from base.v2, one change (the review's next change): the back view (n/w) and the shift's
// shape. From behind, the head is hair all round (hair ramp mid, lit along its up-left edge) over a short neck, with no
// dark sphere-shaded face/beard patch; and the shift's sides curve in at the waist instead of falling as a straight
// boxy slab (front and back).
// npc-captive base.v2 (r2) — from base.v1, one change (the review's next change): the face — filled flat with the
// skin ramp's mid tone, shadowed (dark skin) only on its right third, with two dark eye pixels just under the fringe.
// base.v1 (r1) — a captive on the shared person body (art/lib/person.v1.js): head bowed, bare feet, a
// torn shift to the knee, wrists bound together in front with rope and a length of rope trailing to the floor, and
// tangled hair over the face. Walks only (no attack); the hands stay bound in every pose.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'npc-captive', pass: 'r3', notes: 'bowed head, torn shift, bare feet, bound wrists and trailing rope', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, knee, L, R } = k;
    const dn = Y(1.2);
    k.legs(pal.skin, 2.1, 1.4); k.boots(pal.skin);
    k.shape('shift', pal.cloth, [[0, shoulder - Y(0.5)], [4.6, shoulder], [4.4, shoulder + Y(2.5)], [2.8, waist], [4, waist + Y(2.5)], [5.4, knee], [3, knee + Y(1.5)], [1.5, knee], [0, knee + Y(1)]]);
    k.add({ type: 'ellipse', name: 'hair', cx, cy: headY + dn, rx: X(4), ry: Y(5), mat: pal.hair, shade: 'sphere', underlay: true });
    k.head(headY + dn, { wide: 3, crown: 4.2, jaw: 1.6, chin: 4.2, point: 0.4, eyes: 1.6 });
    // from behind: a short neck, then the head as hair all round (mid step, lit along its up-left edge), no face
    k.rear(() => {
      const hy = headY + dn;
      k.add({ type: 'capsule', name: 'neck', underlay: true, mat: pal.skin, shade: 'flat', band: 1, a: [cx, hy + Y(2)], b: [cx, shoulder + Y(0.5)], r: X(1.3) });
      const hd = k.smooth([[cx, hy - Y(5)], [cx + X(3.8), hy - Y(3.6)], [cx + X(3.9), hy + Y(1)], [cx + X(2.4), hy + Y(3.2)], [cx, hy + Y(3.6)], [cx - X(2.4), hy + Y(3.2)], [cx - X(3.9), hy + Y(1)], [cx - X(3.8), hy - Y(3.6)]]);
      k.add({ type: 'path', name: 'back-hair-mass', underlay: true, mat: pal.hair, shade: 'flat', band: 1, d: hd });
      k.add({ type: 'group', name: 'back-hair-lit', clip: { type: 'path', d: hd }, children: [
        { type: 'path', name: 'back-hair-light', mat: pal.hair, shade: 'flat', band: 0, d: k.smooth([[cx - X(0.5), hy - Y(5.5)], [cx - X(4.5), hy - Y(4)], [cx - X(4.5), hy + Y(0.5)], [cx - X(2.6), hy - Y(1.5)], [cx - X(1.2), hy - Y(3.6)]]) },
      ] });
      // a few strands one step darker, so the mass reads as hair
      for (const dx of [-0.5, 1.6]) k.add({ type: 'rect', name: 'strand', x: Math.round(cx + X(dx)), y: Math.round(hy), w: 1, h: Y(2.4), mat: pal.hair, shade: 'flat', band: 2 });
    });
    // the face: a flat mid-tone skin fill, the right third in shadow, two dark eyes under the hair line
    k.front(() => {
      const hy = headY + dn, fd = k.smooth([[cx - X(2.9), hy - Y(2.4)], [cx + X(2.9), hy - Y(2.4)], [cx + X(2.8), hy + Y(1)], [cx + X(1.5), hy + Y(3.6)], [cx, hy + Y(4.1)], [cx - X(1.5), hy + Y(3.6)], [cx - X(2.8), hy + Y(1)]]);
      k.add({ type: 'path', name: 'face', mat: pal.skin, shade: 'flat', band: 1, d: fd });
      k.add({ type: 'group', name: 'face-shadow', clip: { type: 'path', d: fd }, children: [{ type: 'rect', name: 'face-shade', x: Math.round(cx + X(1)), y: hy - Y(3), w: X(3), h: Y(8), mat: pal.skin, shade: 'flat', band: 2 }] });
      for (const ex of [-1, 1]) k.add({ type: 'rect', name: 'eye', x: Math.round(cx) + ex - 1, y: Math.round(hy + Y(0.8)), w: 1, h: 1, color: 'outline' });
    });
    k.front(() => k.add({ type: 'path', name: 'fringe', mat: pal.hair, shade: 'sphere', d: k.smooth([[cx - X(3.4), headY + dn + Y(1.6)], [cx - X(3.2), headY + dn - Y(3.6)], [cx + X(3.2), headY + dn - Y(3.6)], [cx + X(3.4), headY + dn + Y(1)], [cx + X(1.4), headY + dn - Y(1.2)], [cx - X(0.6), headY + dn + Y(0.5)]]) }));
    // both arms meet at the bound wrists; they swing as one with the right hand's group
    k.main(() => {
      k.arm(-1, pal.skin, cx - X(0.8), waist + Y(1), { r: 1.3 });
      k.arm(1, pal.skin, cx + X(0.8), waist + Y(1), { r: 1.3 });
      k.add({ type: 'rect', name: 'binding', x: cx - X(2), y: waist + Y(0.4), w: X(4), h: Y(1.4), mat: pal.leather, shade: 'flat', band: 1 });
      k.add({ type: 'tube', name: 'rope', mat: pal.leather, shade: 'flat', band: 1, pts: [[cx, waist + Y(1.6)], [cx - X(1.5), knee], [cx - X(4), foot - Y(1)], [cx - X(7), foot - Y(0.5)]], w: X(0.9) });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.6, headDy: 1.2, hand: L => [L.cx - L.X(0.8), L.waist + L.Y(1)] });
