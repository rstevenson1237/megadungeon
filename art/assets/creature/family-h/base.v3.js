// family-h base.v3 (r3, from base.v2): the face gets a dark shadow band under the hood's rim with two pale eye pixels,
// and the tunic front drops from the cloth light step to the mid step, with light only on its lit (left) edge.
// family-h base.v2 (r2, from base.v1): the attack now holds the crossbow levelled at shoulder height, pointing
// toward the facing, with a recoil kick on the contact frame, instead of swinging it overhead like a pick.
// family-h base.v1 (r1) — men and dwarves: acolytes, priests, mages, crossbowmen (glyph h, 1.8 m): a cultist of the
// deep on the biped rig (art/lib/beast.v1.js): a hooded cloak over a long tunic, a gaunt face, a crossbow held
// across the body. The cloak and tunic are the recoloured ramp (recolour: cloth), so a row's colour dresses him.
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-h', pass: 'r3', notes: 'hooded cultist in a long tunic, crossbow across', mirror: false, recolour: 'cloth' };
const H = 1.8;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, knee, L, R } = k;
    k.legs(pal.leather, 2.3, 1.5); k.boots(pal.leather);
    k.shape('cloak', pal.cloth, [[0, shoulder - Y(1)], [5.6, shoulder], [6.6, waist], [7, knee + Y(2)], [0, knee + Y(2.5)]]);
    k.front(() => k.shape('tunic', pal.cloth, [[0, shoulder + Y(1)], [3, shoulder + Y(1)], [3.4, waist], [3.8, knee + Y(1)], [0, knee + Y(1.5)]], { shade: 'flat', band: 1 }));
    k.front(() => k.add({ type: 'capsule', name: 'tunic-lit', a: [cx - X(2.6), shoulder + Y(2)], b: [cx - X(3.2), knee + Y(0.5)], r: X(0.5), color: 'cloth.0' }));
    k.add({ type: 'rect', name: 'belt', x: cx - X(4), y: waist - Y(0.5), w: X(8), h: Y(1.2), mat: pal.leather, shade: 'flat', band: 2 });
    k.head(headY + Y(0.5), { wide: 3, crown: 4.4, jaw: 1.5, chin: 4.4, point: 0.5, eyes: 1.6, hair: pal.cloth });
    k.front(() => {
      // the hood's shadow over the upper face, the eyes glinting in it
      k.add({ type: 'ellipse', name: 'face-shadow', cx: cx + k.turn * 0.5, cy: headY - Y(1.2), rx: X(3), ry: Y(2.2), color: 'cloth.2' });
      for (const ex of [-2, 1]) k.add({ type: 'rect', name: 'eye-glint', x: Math.round(cx + X(ex) + k.turn * 0.5), y: Math.round(headY), w: 1, h: 1, color: 'skin.0' });
    });
    k.add({ type: 'path', name: 'hood', underlay: true, mat: pal.cloth, shade: 'sphere', d: k.back ? k.smooth([[cx, headY - Y(6)], [cx + X(4.8), headY - Y(2)], [cx + X(5), shoulder + Y(1)], [cx - X(5), shoulder + Y(1)], [cx - X(4.8), headY - Y(2)]])
      : `M${cx - X(5)} ${shoulder + Y(1)} Q${cx - X(5.4)} ${headY - Y(6)} ${cx} ${headY - Y(6)} Q${cx + X(5.4)} ${headY - Y(6)} ${cx + X(5)} ${shoulder + Y(1)} L${cx + X(3.4)} ${shoulder} Q${cx + X(3.6)} ${headY - Y(3)} ${cx} ${headY - Y(3.4)} Q${cx - X(3.6)} ${headY - Y(3)} ${cx - X(3.4)} ${shoulder} Z` });
    k.off(() => k.arm(1, pal.cloth, cx + X(4), waist - Y(1.5), { glove: pal.leather }));
    if (k.state === 'attack') {
      // aim: a nested group undoes the rig's swing, so the crossbow stays levelled at the shoulder; contact kicks back
      const f = k.frame % 4, kick = [[0, 4], [0, 0], [X(1.5), -9], [X(0.5), -3]][f], y = shoulder + Y(1.5);
      k.main(() => k.add({ type: 'group', name: 'aim', rotate: -k.P.main + kick[1], origin: k.mainShoulder, translate: [kick[0], 0], children: [
        { type: 'capsule', name: 'upper-arm', underlay: true, mat: pal.cloth, shade: 'cyl', a: [cx - X(4.5), shoulder + Y(1.2)], b: [cx - X(3), y + Y(2.5)], r: X(1.3), r1: X(1.2) },
        { type: 'capsule', name: 'forearm', underlay: true, mat: pal.cloth, shade: 'cyl', a: [cx - X(3), y + Y(2.5)], b: [cx - X(6), y + Y(0.8)], r: X(1.2), r1: X(1) },
        { type: 'capsule', name: 'stock', underlay: true, mat: pal.leather, shade: 'cyl', axis: 'x', a: [cx + X(1), y + Y(0.5)], b: [cx - X(12), y], r: X(1), r1: X(0.8) },
        { type: 'arc', name: 'prod', underlay: true, cx: cx - X(7), cy: y, r: X(4.5), w: X(1.2), a0: 125, a1: 235, mat: pal.leather, shade: 'flat', band: 0 },
        { type: 'circle', name: 'hand', cx: cx - X(6), cy: y + Y(0.8), r: X(1.1), mat: pal.leather, shade: 'sphere' },
      ] }));
    } else k.main(() => {
      k.arm(-1, pal.cloth, cx - X(3), waist - Y(1.5), { glove: pal.leather });
      k.add({ type: 'capsule', name: 'stock', underlay: true, mat: pal.leather, shade: 'cyl', axis: 'x', a: [cx - X(8), waist - Y(2)], b: [cx + X(5), waist - Y(1.5)], r: X(1), r1: X(0.8) });
      k.add({ type: 'arc', name: 'prod', underlay: true, cx: cx - X(5), cy: waist - Y(2), r: X(5), w: X(1.2), a0: 120, a1: 240, mat: pal.leather, shade: 'flat', band: 0 });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 0.5, eyes: 1.6, hand: L => [L.cx - L.X(3), L.waist - L.Y(1.5)] });
