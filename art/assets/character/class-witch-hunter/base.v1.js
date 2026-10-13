// class-witch-hunter base.v1 (r1) — the Witch Hunter on the shared player body (art/lib/person.v1.js): a tall
// flat-topped hat with a buckle and a stiff brim, a long buttoned greatcoat with a short shoulder cape, a hard lean
// face, a loaded crossbow levelled in the right hand and a short sword at the left hip.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-witch-hunter', pass: 'r1', notes: 'capotain hat and buckle, greatcoat and capelet, crossbow levelled', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, knee, L, R } = k;
    k.legs(pal.leather, 2.2, 1.5); k.boots(pal.leather);
    k.shape('greatcoat', pal.leather, [[0, shoulder - Y(0.5)], [4.6, shoulder], [4.6, waist], [6, foot - Y(3)], [5.4, foot - Y(2)], [0, foot - Y(2.5)]]);
    k.front(() => [0, 2, 4, 6].forEach(dy => k.add({ type: 'rect', name: 'button', x: cx - 1, y: shoulder + Y(2 + dy), w: 1, h: 1, mat: pal.metal, shade: 'flat', band: 0 })));
    k.add({ type: 'ellipse', name: 'capelet', cx, cy: shoulder + Y(1.4), rx: X(6.4), ry: Y(3.2), mat: pal.leather, shade: 'sphere', underlay: true });
    k.head(headY, { wide: 3, crown: 4.4, jaw: 1.6, chin: 4.6, point: 0.5, eyes: 1.6 });
    k.add({ type: 'ellipse', name: 'brim', cx, cy: headY - Y(2.8), rx: X(6.4), ry: Y(1.4), mat: pal.hair, shade: 'normal', round: X(1), underlay: true });
    k.add({ type: 'path', name: 'crown', underlay: true, mat: pal.hair, shade: 'cyl', d: `M${cx - X(3.4)} ${headY - Y(3)} L${cx - X(2.8)} ${headY - Y(10)} H${cx + X(2.8)} L${cx + X(3.4)} ${headY - Y(3)} Z` });
    k.add({ type: 'rect', name: 'hat-band', x: cx - X(3.3), y: headY - Y(5), w: X(6.6), h: Y(1.4), mat: pal.leather, shade: 'flat', band: 2 });
    k.front(() => k.add({ type: 'rect', name: 'buckle', x: cx - X(1) - 1, y: headY - Y(5.2), w: X(2), h: Y(1.8), mat: pal.metal, shade: 'flat', band: 0 }));
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
