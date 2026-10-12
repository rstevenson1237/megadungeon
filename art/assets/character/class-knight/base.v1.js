// class-knight base.v1 (r1) — the Knight on the shared player body (art/lib/person.v1.js): a mail hauberk to the knee
// under a long surcoat, a rounded sallet helm with an open face and a tall plume, a long sword held point-down before
// the right side and a round shield with a bold stripe on the left arm. Mail and surcoat (not the paladin's plate).
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-knight', pass: 'r1', notes: 'mail and surcoat, plumed sallet, sword point down, striped shield', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.legs(pal.metal, 2.4, 1.6); k.boots(pal.leather);
    k.shape('hauberk', pal.metal, [[0, shoulder - Y(0.5)], [5, shoulder], [5.2, shoulder + Y(4)], [4.6, waist], [5.4, knee], [0, knee + Y(0.5)]]);
    k.front(() => k.shape('surcoat', pal.cloth, [[0, shoulder + Y(1)], [3.2, shoulder + Y(1)], [3.4, waist], [4, knee + Y(1)], [0, knee + Y(1.5)]], { shade: 'flat', band: 1 }));
    k.add({ type: 'rect', name: 'belt', x: cx - X(4.6), y: waist - Y(0.6), w: X(9.2), h: Y(1.2), mat: pal.leather, shade: 'flat', band: 2 });
    k.head(headY, { wide: 3.1, crown: 4.4, jaw: 1.8, chin: 4.2, point: 0.3, eyes: 1.7 });
    k.add({ type: 'path', name: 'sallet', underlay: true, mat: pal.metal, shade: 'sphere', d: k.smooth([[cx, headY - Y(5.4)], [cx + X(4), headY - Y(3.4)], [cx + X(4.6), headY + Y(1.5)], [cx + X(3), headY - Y(1)], [cx - X(3), headY - Y(1)], [cx - X(4.6), headY + Y(1.5)], [cx - X(4), headY - Y(3.4)]]) });
    k.add({ type: 'tube', name: 'plume', underlay: true, mat: pal.accent, shade: 'flat', band: 1, pts: [[cx, headY - Y(5)], [cx + X(1), headY - Y(9)], [cx + X(4.5), headY - Y(10.5)], [cx + X(6.5), headY - Y(8)]], w: X(2.2), w1: X(0.8) });
    k.off(() => {
      k.arm(1, pal.metal, R - X(2), waist - Y(2), { glove: pal.leather });
      k.add({ type: 'circle', name: 'shield', cx: R - X(0.5), cy: waist - Y(2.5), r: X(4.4), mat: pal.cloth, shade: 'sphere', underlay: true });
      k.add({ type: 'rect', name: 'stripe', x: R - X(1.5), y: waist - Y(6.5), w: X(2), h: Y(8), mat: pal.accent, shade: 'flat', band: 1 });
    });
    k.main(() => {
      k.arm(-1, pal.metal, L + X(1.5), waist - Y(1), { glove: pal.leather });
      k.add({ type: 'path', name: 'blade', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${L + X(0.7)} ${waist} L${L + X(0.5)} ${knee + Y(4)} L${L + X(1.5)} ${knee + Y(5.5)} L${L + X(2.5)} ${knee + Y(4)} L${L + X(2.3)} ${waist} Z` });
      k.add({ type: 'capsule', name: 'guard', a: [L - X(1), waist - Y(0.2)], b: [L + X(4), waist - Y(0.2)], r: X(0.6), mat: pal.metal, shade: 'cyl', axis: 'x' });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.7, hand: L => [L.L + L.X(1.5), L.waist - L.Y(1)] });
