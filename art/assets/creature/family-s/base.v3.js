// family-s base.v3 (r3, from base.v2) — legs and pelvis: the rig's thick solid leg columns are replaced by thin bones
// per leg (a femur and a shin, each a narrow capsule, with a round knee knob between them) set apart so the floor
// shows between the legs, and the dark pelvis block becomes a lit bone pelvis (two hip wings over a notch) with the
// floor showing below it between the thighs.
// family-s base.v2 (r2, from base.v1) — skull only: on s/e a light bone face (the cloth ramp's light step) over the
// lower front of the skull, with two 2 px dark sockets, a nose notch and a 1 px row of teeth, so the front no longer
// reads as a blank dark ball; n/w keep the plain cranium.
// family-s base.v1 (r1) — skeletons (glyph s, 1.8 m): a crypt skeleton on the biped rig (art/lib/beast.v1.js): a
// skull with dark sockets and a grinning jaw, a ribcage, thin bone limbs with knobbed joints, a spine and a pelvis,
// a rusted sword in the right hand and a broken round shield. The bone is the recoloured ramp (recolour: cloth).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-s', pass: 'r3', notes: 'skull, ribcage, bone limbs, rusted sword, broken shield', mirror: false, recolour: 'cloth' };
const H = 1.8;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, L, R } = k, b = pal.cloth;
    // thin leg bones: femur, knee knob, shin, foot; apart, so the floor shows between them
    k.P.feet.forEach((dy, i) => {
      const s = i ? 1 : -1, d = dy * Math.max(1, Math.round(k.u));
      const hip = [cx + s * X(2.2), waist + Y(1.4)], kn = [k.baseCx + s * X(2.9), k.knee], ank = [k.baseCx + s * X(2.8), k.foot - Y(1.4) + d];
      const lit = { shade: 'flat', band: i ? 1 : 0 }; // the near-left leg catches the light
      k.add({ type: 'capsule', name: 'femur', underlay: true, mat: b, ...lit, a: hip, b: kn, r: X(0.7), r1: X(0.55) });
      k.add({ type: 'capsule', name: 'shin', underlay: true, mat: b, ...lit, a: kn, b: ank, r: X(0.6), r1: X(0.5) });
      k.add({ type: 'circle', name: 'knee', underlay: true, cx: kn[0], cy: kn[1], r: X(0.85), mat: b, shade: 'sphere' });
    });
    k.boots(b, 1.4, 0.8);
    // the pelvis: two lit hip wings over a notch, the floor showing beneath it between the thighs
    k.add({ type: 'path', name: 'pelvis', underlay: true, mat: b, shade: 'flat', band: 0, d: k.smooth([[cx - X(3.2), waist - Y(0.4)], [cx, waist + Y(0.2)], [cx + X(3.2), waist - Y(0.4)], [cx + X(2.6), waist + Y(1.6)], [cx + X(0.8), waist + Y(1.2)], [cx, waist + Y(2)], [cx - X(0.8), waist + Y(1.2)], [cx - X(2.6), waist + Y(1.6)]]) });
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
