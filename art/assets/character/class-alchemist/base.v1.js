// class-alchemist base.v1 (r1) — the Alchemist on the shared player body (art/lib/person.v1.js): wild hair with brass
// goggles pushed up on the brow, a heavy leather apron to the shins over a shirt with rolled sleeves, a bandolier of
// little vials, a round flask raised in the right hand (thrown in the attack) and a sling at the left hip.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-alchemist', pass: 'r1', notes: 'wild hair and goggles, long apron, vial bandolier, raised flask', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.legs(pal.leather, 2.2, 1.5); k.boots(pal.leather);
    k.shape('shirt', pal.cloth, [[0, shoulder - Y(0.5)], [4.6, shoulder], [4.6, shoulder + Y(4)], [4, waist], [4.4, waist + Y(2)], [0, waist + Y(2)]]);
    k.front(() => {
      k.shape('apron', pal.leather, [[0, shoulder + Y(2)], [3, shoulder + Y(2)], [3.4, waist], [4.2, knee + Y(2)], [0, knee + Y(2.5)]]);
      k.add({ type: 'tube', name: 'bandolier', mat: pal.leather, shade: 'flat', band: 2, pts: [[cx - X(4.4), shoulder + Y(0.5)], [cx + X(4), waist - Y(1)]], w: X(1.2) });
      [[-2.6, 1.6], [0, 3.4], [2.4, 5.2]].forEach(([dx, dy]) => k.add({ type: 'rect', name: 'vial', x: cx + X(dx) - 1, y: shoulder + Y(dy), w: X(1.2), h: Y(2), mat: pal.accent, shade: 'flat', band: 0 }));
    });
    k.add({ type: 'path', name: 'wild-hair', underlay: true, mat: pal.hair, shade: 'sphere', d: k.smooth([[cx - X(4.2), headY + Y(1)], [cx - X(5), headY - Y(3)], [cx - X(2.6), headY - Y(6)], [cx + X(0.5), headY - Y(5)], [cx + X(3), headY - Y(6.4)], [cx + X(5), headY - Y(3)], [cx + X(4.4), headY + Y(1.5)]]) });
    k.head(headY, { wide: 3.2, crown: 4.2, jaw: 1.8, chin: 4.2, point: 0.2, eyes: 1.8 });
    k.add({ type: 'capsule', name: 'goggle-strap', a: [cx - X(3.6), headY - Y(3)], b: [cx + X(3.6), headY - Y(3)], r: X(0.6), mat: pal.leather, shade: 'cyl', axis: 'x' });
    k.front(() => [-1.6, 1.6].forEach(e => k.add({ type: 'circle', name: 'goggle', cx: cx + X(e) - 1, cy: headY - Y(3), r: X(1.4), mat: pal.metal, shade: 'sphere' })));
    k.off(() => {
      k.arm(1, pal.cloth, R - X(2), waist + Y(1), { r: 1.3 });
      k.add({ type: 'tube', name: 'sling', mat: pal.leather, shade: 'flat', band: 1, pts: [[R - X(2), waist + Y(1)], [R - X(1), waist + Y(4)], [R - X(2.5), waist + Y(6)]], w: X(0.8) });
    });
    k.main(() => {
      k.arm(-1, pal.cloth, L + X(2), shoulder + Y(1), { r: 1.3 });
      k.add({ type: 'circle', name: 'flask', cx: L + X(1.5), cy: shoulder - Y(2), r: X(2), mat: pal.accent, shade: 'sphere', underlay: true });
      k.add({ type: 'rect', name: 'flask-neck', x: L + X(1), y: shoulder - Y(5.5), w: X(1.2), h: Y(2), mat: pal.metal, shade: 'flat', band: 1 });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.8, hand: L => [L.L + L.X(2), L.shoulder + L.Y(1)] });
