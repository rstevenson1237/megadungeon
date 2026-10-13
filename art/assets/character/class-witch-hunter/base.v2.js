// class-witch-hunter base.v2 (r2) — from base.v1, one change (the review's next change): the hat — crown lowered to
// about 5 px, brim widened to 2 px more past the head each side, both drawn flat in the dark cloth ramp (a mid-tone
// edge on the lit left), so the crown loses its white centre stripe.
// base.v1 (r1) — the Witch Hunter on the shared player body (art/lib/person.v1.js): a tall
// flat-topped hat with a buckle and a stiff brim, a long buttoned greatcoat with a short shoulder cape, a hard lean
// face, a loaded crossbow levelled in the right hand and a short sword at the left hip.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-witch-hunter', pass: 'r2', notes: 'capotain hat and buckle, greatcoat and capelet, crossbow levelled', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, knee, L, R } = k;
    k.legs(pal.leather, 2.2, 1.5); k.boots(pal.leather);
    k.shape('greatcoat', pal.leather, [[0, shoulder - Y(0.5)], [4.6, shoulder], [4.6, waist], [6, foot - Y(3)], [5.4, foot - Y(2)], [0, foot - Y(2.5)]]);
    k.front(() => [0, 2, 4, 6].forEach(dy => k.add({ type: 'rect', name: 'button', x: cx - 1, y: shoulder + Y(2 + dy), w: 1, h: 1, mat: pal.metal, shade: 'flat', band: 0 })));
    k.add({ type: 'ellipse', name: 'capelet', cx, cy: shoulder + Y(1.4), rx: X(6.4), ry: Y(3.2), mat: pal.leather, shade: 'sphere', underlay: true });
    k.head(headY, { wide: 3, crown: 4.4, jaw: 1.6, chin: 4.6, point: 0.5, eyes: 1.6 });
    k.add({ type: 'ellipse', name: 'brim', cx, cy: headY - Y(2.8), rx: X(7.4), ry: Y(1.4), mat: pal.cloth, shade: 'flat', band: 2, underlay: true });
    k.add({ type: 'path', name: 'crown', underlay: true, mat: pal.cloth, shade: 'flat', band: 2, d: `M${cx - X(3.4)} ${headY - Y(3)} L${cx - X(2.9)} ${headY - Y(8)} H${cx + X(2.9)} L${cx + X(3.4)} ${headY - Y(3)} Z` });
    k.add({ type: 'rect', name: 'crown-lit', x: Math.round(cx - X(3)), y: headY - Y(7.6), w: 1, h: Y(4.4), mat: pal.cloth, shade: 'flat', band: 1 });
    k.add({ type: 'rect', name: 'hat-band', x: cx - X(3.3), y: headY - Y(4.6), w: X(6.6), h: Y(1.2), mat: pal.leather, shade: 'flat', band: 2 });
    k.front(() => k.add({ type: 'rect', name: 'buckle', x: cx - X(1) - 1, y: headY - Y(4.8), w: X(2), h: Y(1.6), mat: pal.metal, shade: 'flat', band: 1 }));
    k.off(() => {
      k.arm(1, pal.leather, R - X(3), waist - Y(1.5), { r: 1.4, glove: pal.leather });
      k.pole(pal.metal, R - X(1), waist, R + X(1), waist + Y(6), 0.5, 'short-sword');
    });
    k.main(() => {
      k.arm(-1, pal.leather, L + X(2), waist - Y(2), { r: 1.4, glove: pal.leather });
      k.add({ type: 'capsule', name: 'stock', underlay: true, mat: pal.leather, shade: 'cyl', axis: 'x', a: [L - X(4), waist - Y(3)], b: [cx + X(1), waist - Y(2)], r: X(1), r1: X(0.8) });
      k.add({ type: 'arc', name: 'prod', underlay: true, cx: L - X(1), cy: waist - Y(3), r: X(4.4), w: X(1.1), a0: 120, a1: 240, mat: pal.metal, shade: 'flat', band: 1 });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.6, hand: L => [L.L + L.X(2), L.waist - L.Y(2)] });
