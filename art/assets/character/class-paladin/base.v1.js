// class-paladin base.v1 (r1) — the Paladin on the shared player body (art/lib/person.v1.js), from the class probe the
// owner approved (art/probes/classes base.v3): boxy plate and a great helm (plate may stay boxy), a tabard, a flanged
// mace in the right hand and a kite shield with a cross on the left arm.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-paladin', pass: 'r1', notes: 'probe paladin: plate, great helm, mace, kite shield', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, knee, L, R, P } = k;
    P.feet.forEach((dy, i) => k.add({ type: 'rect', name: 'greave', underlay: true, mat: pal.metal, shade: 'bevel', x: i ? k.baseCx + X(1) : k.baseCx - X(4), y: waist, w: X(3), h: foot - waist + dy }));
    P.feet.forEach((dy, i) => k.add({ type: 'rect', name: 'sabaton', mat: pal.metal, shade: 'flat', band: 2, x: i ? k.baseCx + X(1) : k.baseCx - X(4.2), y: foot - Y(3) + dy, w: X(3.2), h: Y(3) }));
    k.add({ type: 'path', name: 'plate', underlay: true, mat: pal.metal, shade: 'normal', round: X(2), d: `M${cx - X(6.5)} ${shoulder} H${cx + X(6.5)} L${cx + X(5.5)} ${waist + Y(1)} H${cx - X(5.5)} Z` });
    k.front(() => k.add({ type: 'rect', name: 'tabard', x: cx - X(2), y: shoulder + Y(2), w: X(4), h: knee - shoulder, mat: pal.cloth, shade: 'flat', band: 1 }));
    k.add({ type: 'circle', name: 'pauldron', cx: cx - X(6.5), cy: shoulder + Y(1), r: X(2.6), mat: pal.metal, shade: 'sphere', mirrorX: cx, underlay: true });
    k.add({ type: 'rect', name: 'helm', x: cx - X(4), y: headY - Y(5), w: X(8), h: Y(9), r: X(2), mat: pal.metal, shade: 'cyl', underlay: true });
    k.front(() => k.add({ type: 'rect', name: 'visor', x: cx - X(3) - 1, y: headY, w: X(6), h: 1, color: 'outline' }));
    k.main(() => {
      k.arm(-1, pal.metal, L + X(1), waist - Y(1), { r: 1.6, glove: pal.metal });
      k.pole(pal.leather, L + X(1), waist - Y(1), L - X(2), waist + Y(6), 0.6, 'haft');
      k.add({ type: 'star', name: 'mace', cx: L - X(2.5), cy: waist + Y(7), r: X(3), r2: X(1.8), n: 6, mat: pal.metal, shade: 'sphere', underlay: true });
    });
    k.off(() => {
      k.add({ type: 'path', name: 'shield', underlay: true, mat: pal.cloth, shade: 'normal', round: X(1.5), d: `M${R - X(4.5)} ${shoulder} H${R + X(4)} V${waist} L${R - X(0.25)} ${waist + Y(7)} L${R - X(4.5)} ${waist} Z` });
      k.add({ type: 'rect', name: 'cross', x: R - X(0.75), y: shoulder + Y(2), w: X(1.5), h: Y(10), mat: pal.metal, shade: 'flat', band: 0 });
      k.add({ type: 'rect', name: 'cross', x: R - X(3), y: shoulder + Y(5), w: X(6), h: Y(1.5), mat: pal.metal, shade: 'flat', band: 0 });
    });
  });
}
// the great helm hides the face: no face anchors
export const anchors = ctx => personAnchors(ctx, { face: false, hand: L => [L.L + L.X(1), L.waist - L.Y(1)] });
