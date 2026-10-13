// class-ranger base.v2 (r2, from base.v1) — ONE change, the jerkin: no longer a flat rectangle. It has rounded
// shoulders, tapers in to a narrow waist where a belt with a small buckle cinches it, flares a little below, and has a
// leather-ramp shadow band down its far (right, unlit) side.
// base.v1 (r1) — the Ranger on the shared player body (art/lib/person.v1.js), from the approved class
// probe: a deep hood and a long cloak over a jerkin; the probe's crossbow becomes the class's shortbow (Spec 05 gear),
// held upright in the left hand, a quiver of arrows on the back and a short sword at the right hand.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-ranger', pass: 'r2', notes: 'probe ranger: hood, cloak; shortbow, quiver', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.worn(() => {
      k.add({ type: 'rect', name: 'quiver', x: cx + X(1), y: shoulder - Y(5), w: X(3), h: Y(10), r: X(1), mat: pal.leather, shade: 'cyl', underlay: true, rotate: 20, origin: [cx + X(2.5), shoulder] });
      for (const dx of [1.6, 2.6, 3.6]) k.add({ type: 'rect', name: 'fletch', x: cx + X(dx), y: shoulder - Y(7), w: 1, h: Y(2), color: 'accent.1', rotate: 20, origin: [cx + X(2.5), shoulder] });
    });
    k.shape('cloak', pal.hair, [[0, shoulder - Y(1)], [6, shoulder], [7.5, waist], [8, knee + Y(1)], [5, knee + Y(2.5)], [0, knee + Y(2)]]);
    k.legs(pal.leather, 2.2, 1.5); k.boots(pal.leather);
    k.front(() => {
      k.shape('jerkin', pal.leather, [[0, shoulder - Y(0.4)], [3.4, shoulder], [4.6, shoulder + Y(1.4)], [4.2, shoulder + Y(4)], [2.9, waist - Y(0.6)], [3.6, waist + Y(1.6)], [3.2, waist + Y(2.6)], [0, waist + Y(2.8)]]);
      k.add({ type: 'path', name: 'jerkin-shadow', mat: pal.leather, shade: 'flat', band: 2, d: k.smooth([[cx + X(2.2), shoulder + Y(1.4)], [cx + X(4.2), shoulder + Y(1.6)], [cx + X(3.8), shoulder + Y(4)], [cx + X(2.6), waist - Y(0.6)], [cx + X(3.2), waist + Y(2.2)], [cx + X(2), waist + Y(2.2)], [cx + X(1.6), waist - Y(1)], [cx + X(2.4), shoulder + Y(4)]]) });
      k.add({ type: 'rect', name: 'belt', x: Math.round(cx - X(3)), y: Math.round(waist - Y(0.6)), w: Math.round(X(6)), h: 1, mat: pal.hair, shade: 'flat', band: 2 });
      k.add({ type: 'rect', name: 'buckle', x: Math.round(cx) - 1, y: Math.round(waist - Y(0.6)), w: 1, h: 1, color: 'metal.0' });
    });
    k.head(headY + Y(0.5), { ears: false, hair: pal.hair });
    k.add({ type: 'path', name: 'hood', underlay: true, mat: pal.hair, shade: 'sphere',
      d: k.back ? k.smooth([[cx, headY - Y(7)], [cx + X(5), headY - Y(3)], [cx + X(5), headY + Y(4)], [cx - X(5), headY + Y(4)], [cx - X(5), headY - Y(3)]])
        : `M${cx - X(5)} ${headY + Y(4)} Q${cx - X(5.5)} ${headY - Y(7)} ${cx + X(1)} ${headY - Y(7)} Q${cx + X(5.5)} ${headY - Y(5)} ${cx + X(5)} ${headY + Y(4)} Q${cx + X(3.5)} ${headY + Y(1)} ${cx + X(3)} ${headY - Y(1)} Q${cx} ${headY - Y(3.5)} ${cx - X(3)} ${headY - Y(1)} Q${cx - X(3.5)} ${headY + Y(1)} ${cx - X(5)} ${headY + Y(4)} Z` });
    k.off(() => {
      k.arm(1, pal.leather, R - X(1), waist - Y(2), { glove: pal.leather });
      k.add({ type: 'arc', name: 'bow', underlay: true, cx: R - X(4), cy: waist - Y(3), r: X(9), w: X(1.2), a0: -55, a1: 55, mat: pal.leather, shade: 'flat', band: 0 });
      k.add({ type: 'rect', name: 'string', x: Math.round(R - X(4) + X(9) * Math.cos(55 * Math.PI / 180)) - 1, y: waist - Y(3) - X(9) * Math.sin(55 * Math.PI / 180), w: 1, h: 2 * X(9) * Math.sin(55 * Math.PI / 180), color: 'metal.0' });
    });
    k.main(() => {
      k.arm(-1, pal.leather, L + X(1.5), waist, { glove: pal.leather });
      k.pole(pal.metal, L + X(1.5), waist, L - X(2), waist + Y(6.5), 0.5, 'short-sword');
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { headDy: 0.5, hand: L => [L.L + L.X(1.5), L.waist] });
