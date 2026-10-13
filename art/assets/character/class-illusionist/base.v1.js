// class-illusionist base.v1 (r1) — the Illusionist on the shared player body (art/lib/person.v1.js): a wrapped
// turban with a jewel and a trailing tail, a half-mask over the eyes, a long coat flaring at the hem with wide cuffs, a
// dagger in the right hand and, in the raised left, a floating prism throwing small sparks.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-illusionist', pass: 'r1', notes: 'turban and jewel, half-mask, flared coat, floating prism', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, knee, L, R } = k;
    k.legs(pal.leather, 2, 1.4); k.boots(pal.leather);
    k.shape('coat', pal.accent, [[0, shoulder - Y(0.5)], [4.4, shoulder], [4.4, waist - Y(1)], [7, knee + Y(2)], [6, knee + Y(3.5)], [0, knee + Y(2)]]);
    k.front(() => k.shape('shirt', pal.cloth, [[0, shoulder + Y(1)], [1.6, shoulder + Y(1)], [2.4, knee], [0, knee + Y(1)]], { shade: 'flat', band: 1 }));
    k.add({ type: 'tube', name: 'turban-tail', underlay: true, mat: pal.cloth, shade: 'flat', band: 1, pts: [[cx + X(3), headY - Y(2)], [cx + X(5.5), headY + Y(1)], [cx + X(6), shoulder + Y(3)]], w: X(1.8), w1: X(1) });
    k.head(headY + Y(0.5), { wide: 3, crown: 4.4, jaw: 1.5, chin: 4.6, point: 0.6, eyes: 1.6, hair: pal.cloth });
    k.front(() => k.add({ type: 'path', name: 'half-mask', mat: pal.metal, shade: 'flat', band: 0, d: k.smooth([[cx - X(3.4) - 1, headY - Y(0.4)], [cx - 1, headY - Y(1)], [cx + X(3.4) - 1, headY - Y(0.4)], [cx + X(2.6) - 1, headY + Y(1.8)], [cx - 1, headY + Y(1.2)], [cx - X(2.6) - 1, headY + Y(1.8)]]) }));
    k.front(() => [-1.6, 1.6].forEach(e => k.add({ type: 'rect', name: 'eye', x: Math.round(cx + X(e)) - 1, y: Math.round(headY + Y(0.5)), w: 1, h: 1, color: 'outline' })));
    k.add({ type: 'path', name: 'turban', underlay: true, mat: pal.cloth, shade: 'sphere', d: k.smooth([[cx - X(4), headY - Y(1)], [cx - X(4.4), headY - Y(5)], [cx - X(1), headY - Y(8)], [cx + X(2), headY - Y(7.6)], [cx + X(4.4), headY - Y(5)], [cx + X(4), headY - Y(1)]]) });
    k.front(() => k.add({ type: 'circle', name: 'jewel', cx: cx - 1, cy: headY - Y(4.4), r: X(1.1), mat: pal.accent, shade: 'sphere' }));
    k.main(() => {
      k.arm(-1, pal.accent, L + X(1.5), waist, { r: 1.5 });
      k.pole(pal.metal, L + X(1.5), waist, L - X(0.5), waist + Y(4), 0.45, 'dagger');
    });
    k.off(() => {
      k.arm(1, pal.accent, R - X(1), shoulder + Y(1), { r: 1.5 });
      k.add({ type: 'poly', name: 'prism', underlay: true, mat: pal.accent, shade: 'bevel', pts: [[R, shoulder - Y(8)], [R + X(2.6), shoulder - Y(4)], [R, shoulder - Y(1.6)], [R - X(2.6), shoulder - Y(4)]] });
      k.add({ type: 'star', name: 'spark', cx: R + X(3.5), cy: shoulder - Y(8), r: X(1.4), r2: X(0.5), n: 4, mat: pal.accent, shade: 'flat', band: 0 });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { face: false, hand: L => [L.L + L.X(1.5), L.waist] });
