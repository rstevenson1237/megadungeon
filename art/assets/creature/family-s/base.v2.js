// family-s base.v2 (r2, from base.v1) — skull only: on s/e a light bone face (the cloth ramp's light step) over the
// lower front of the skull, with two 2 px dark sockets, a nose notch and a 1 px row of teeth, so the front no longer
// reads as a blank dark ball; n/w keep the plain cranium.
// family-s base.v1 (r1) — skeletons (glyph s, 1.8 m): a crypt skeleton on the biped rig (art/lib/beast.v1.js): a
// skull with dark sockets and a grinning jaw, a ribcage, thin bone limbs with knobbed joints, a spine and a pelvis,
// a rusted sword in the right hand and a broken round shield. The bone is the recoloured ramp (recolour: cloth).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-s', pass: 'r2', notes: 'skull, ribcage, bone limbs, rusted sword, broken shield', mirror: false, recolour: 'cloth' };
const H = 1.8;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, L, R } = k, b = pal.cloth;
    k.legs(b, 2.2, 0.8);
    k.boots(b, 1.6, 1);
    k.add({ type: 'ellipse', name: 'pelvis', cx, cy: waist + Y(0.5), rx: X(3.4), ry: Y(1.6), mat: b, shade: 'sphere', underlay: true });
    k.add({ type: 'capsule', name: 'spine', a: [cx, shoulder], b: [cx, waist], r: X(0.8), mat: b, shade: 'cyl', underlay: true });
    for (let i = 0; i < 4; i++) k.add({ type: 'ellipse', name: 'rib', cx, cy: shoulder + Y(1 + i * 1.6), rx: X(4.4 - i * 0.6), ry: Y(0.8), mat: b, shade: 'cyl', axis: 'x', underlay: true });
    k.off(() => {
      k.arm(1, b, R - X(2), waist - Y(1), { r: 0.8, handR: 1 });
      k.add({ type: 'path', name: 'broken-shield', underlay: true, mat: pal.leather, shade: 'normal', round: X(1), d: k.smooth([[R - X(1), waist - Y(7)], [R + X(3), waist - Y(4)], [R + X(2), waist + Y(1)], [R - X(1), waist - Y(1)], [R - X(2.5), waist - Y(4)]]) });
    });
    k.head(headY, { mat: b, wide: 3.3, crown: 4.6, jaw: 2, chin: 4, point: 0.1, eyes: 1.6, eyeSize: 2, hair: b, nose: false });
    k.front(() => {
      const fx = cx + k.turn, R = Math.round, y0 = R(headY); // pixel offsets: this family is the person's size (1.8 m)
      // the bone face: a light mask over the lower front of the skull, lit top-left
      k.add({ type: 'ellipse', name: 'face', cx: fx - X(0.3), cy: headY + Y(1), rx: X(2.9), ry: Y(3.2), mat: b, shade: 'flat', band: 0 });
      // two sockets, 2 px each
      for (const e of [-1, 1]) k.add({ type: 'rect', name: 'socket', x: R(fx) + (e < 0 ? -2 : 1), y: y0 - 1, w: 2, h: 2, color: 'outline' });
      // the nose notch, and the teeth: a 1 px row of dark gaps between bone teeth
      k.add({ type: 'rect', name: 'nasal', x: R(fx), y: y0 + 1, w: 1, h: 1, color: 'outline' });
      for (let i = -2; i <= 2; i += 2) k.add({ type: 'rect', name: 'teeth', x: R(fx) + i, y: y0 + 2, w: 1, h: 1, color: 'outline' });
    });
    k.main(() => {
      k.arm(-1, b, L + X(1.5), waist - Y(1), { r: 0.8, handR: 1 });
      k.add({ type: 'path', name: 'sword', underlay: true, mat: pal.leather, shade: 'bevel', d: `M${L + X(0.8)} ${waist - Y(1.5)} L${L - X(1)} ${headY - Y(2)} L${L - X(1.2)} ${headY - Y(4)} L${L + X(0.4)} ${headY - Y(2.2)} L${L + X(2)} ${waist - Y(2)} Z` });
    });
  }, { height: H });
}
// the sockets are drawn dark: no face for the finish to paint
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.L + L.X(1.5), L.waist - L.Y(1)] });
