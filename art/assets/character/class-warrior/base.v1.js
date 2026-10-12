// class-warrior base.v1 (r1) — the Warrior on the shared player body (art/lib/person.v1.js): a conical nasal helm
// over a short beard, a leather jerkin with one iron pauldron and a mail skirt, a long sword held up in the right hand
// and a round shield with an iron boss on the left arm. Silhouette: the helm's point, the raised blade, the disc.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-warrior', pass: 'r1', notes: 'nasal helm, jerkin and pauldron, long sword, round shield', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, knee, L, R } = k;
    k.legs(pal.cloth, 2.4, 1.6); k.boots(pal.leather);
    k.shape('mail-skirt', pal.metal, [[0, waist - Y(1)], [4.6, waist - Y(1)], [5.2, knee - Y(1)], [0, knee - Y(0.5)]], { shade: 'flat', band: 1 });
    k.neck();
    k.shape('jerkin', pal.leather, [[0, shoulder - Y(0.5)], [5, shoulder], [5.2, shoulder + Y(4)], [4.4, waist], [4.8, waist + Y(1.5)], [0, waist + Y(2)]]);
    k.add({ type: 'rect', name: 'belt', x: cx - X(4.6), y: waist - Y(0.5), w: X(9.2), h: Y(1.3), mat: pal.leather, shade: 'flat', band: 2 });
    k.head(headY, { wide: 3.2, crown: 4.4, jaw: 2, chin: 4.2, point: 0.2 });
    k.front(() => k.add({ type: 'path', name: 'beard', mat: pal.hair, shade: 'sphere', d: k.smooth([[cx - X(2.6), headY + Y(1.5)], [cx + X(2.6), headY + Y(1.5)], [cx + X(1.6), headY + Y(4.6)], [cx, headY + Y(5.2)], [cx - X(1.6), headY + Y(4.6)]]) }));
    k.add({ type: 'path', name: 'helm', underlay: true, mat: pal.metal, shade: 'sphere', d: k.smooth([[cx, headY - Y(8)], [cx + X(2), headY - Y(5)], [cx + X(3.8), headY - Y(1.5)], [cx + X(3.6), headY - Y(0.4)], [cx - X(3.6), headY - Y(0.4)], [cx - X(3.8), headY - Y(1.5)], [cx - X(2), headY - Y(5)]]) });
    k.front(() => k.add({ type: 'rect', name: 'nasal', x: Math.round(cx - 1), y: headY - Y(1), w: 1, h: Y(2.6), mat: pal.metal, shade: 'flat', band: 0 }));
    k.add({ type: 'ellipse', name: 'pauldron', cx: cx - X(5.4), cy: shoulder + Y(0.8), rx: X(2.6), ry: Y(2), mat: pal.metal, shade: 'sphere', underlay: true });
    k.off(() => {
      k.arm(1, pal.leather, R - X(2), waist - Y(2), { glove: pal.leather });
      k.add({ type: 'circle', name: 'shield', cx: R - X(1), cy: waist - Y(3), r: X(4.6), mat: pal.leather, shade: 'sphere', underlay: true });
      k.add({ type: 'ring', name: 'shield-rim', cx: R - X(1), cy: waist - Y(3), r: X(4.2), w: X(0.8), mat: pal.metal, shade: 'flat', band: 1 });
      k.add({ type: 'circle', name: 'boss', cx: R - X(1), cy: waist - Y(3), r: X(1.3), mat: pal.metal, shade: 'sphere' });
    });
    k.main(() => {
      k.arm(-1, pal.leather, L + X(1.5), waist - Y(1), { glove: pal.leather });
      k.add({ type: 'path', name: 'blade', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${L + X(0.6)} ${waist - Y(2)} L${L - X(1.2)} ${headY - Y(3)} L${L - X(1.6)} ${headY - Y(5.5)} L${L - X(0.2)} ${headY - Y(3.2)} L${L + X(2)} ${waist - Y(2.4)} Z` });
      k.add({ type: 'capsule', name: 'guard', a: [L - X(1.2), waist - Y(1.4)], b: [L + X(3.6), waist - Y(2.8)], r: X(0.7), mat: pal.leather, shade: 'cyl' });
    });
  });
}

export const anchors = ctx => personAnchors(ctx, { hand: L => [L.L + X(L, 1.5), L.waist - L.Y(1)] });
const X = (L, v) => L.X(v);
