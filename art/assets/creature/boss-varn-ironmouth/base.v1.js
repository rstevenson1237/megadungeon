// boss-varn-ironmouth base.v1 (r1) — SHAPE DRAFT, flat materials, no proc layers. Varn Ironmouth: a squat, barrel-chested dwarf
// brute of family-h: broad pauldrons, a flared horned helm, a big forked beard with an iron jaw-plate, and a two-handed
// maul carried over the shoulder (swung down on the attack). Same biped rig as family-h (art/lib/beast.v1.js).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'boss-varn-ironmouth', pass: 'r1', notes: 'shape draft: horned-helm dwarf brute with forked beard and shoulder maul', mirror: false };
const H = 1.8;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, foot, knee } = k, headY = k.headY + Y(2.5);
    const flat = { shade: 'flat', band: 1 };
    k.legs(pal.leather, 3.2, 2.2); k.boots(pal.metal, 2.8, 1.6);
    // wide barrel torso with a short skirt of mail
    k.shape('torso', pal.leather, [[0, shoulder - Y(1)], [7.2, shoulder], [8, waist - Y(2)], [7, waist + Y(3)], [0, waist + Y(3.5)]], flat);
    k.shape('skirt', pal.metal, [[0, waist + Y(2)], [7, waist + Y(2.5)], [7.8, knee - Y(1)], [0, knee]], flat);
    k.add({ type: 'rect', name: 'belt', x: cx - X(7.5), y: waist - Y(0.5), w: X(15), h: Y(1.6), mat: pal.accent, shade: 'flat', band: 1 });
    // pauldrons: big iron discs on both shoulders
    for (const sd of [-1, 1]) k.add({ type: 'ellipse', name: 'pauldron', underlay: true, cx: cx + sd * X(7.6), cy: shoulder + Y(0.5), rx: X(3.4), ry: Y(2.6), mat: pal.metal, shade: 'sphere' });
    k.off(() => k.arm(1, pal.leather, cx + X(7.5), waist + Y(1), { wide: 7.6, r: 1.9, glove: pal.skin, handR: 1.6 }));
    k.head(headY + Y(1), { wide: 3.8, crown: 3.6, jaw: 3, chin: 4, point: 0, eyes: 1.7, hair: pal.metal, nose: 1.6 });
    k.front(() => {
      // forked beard spilling over the chest, an iron plate across the mouth
      k.add({ type: 'path', name: 'beard', underlay: true, mat: pal.accent, shade: 'flat', band: 1, d: k.smooth([[cx - X(4.4), headY + Y(1)], [cx + X(4.4), headY + Y(1)], [cx + X(5), headY + Y(8)], [cx + X(2), headY + Y(12)], [cx, headY + Y(8)], [cx - X(2), headY + Y(12)], [cx - X(5), headY + Y(8)]]) });
      k.add({ type: 'rect', name: 'jaw-plate', x: cx - X(3.2) + k.turn, y: headY + Y(2.4), w: X(6.4), h: Y(2.6), mat: pal.metal, shade: 'flat', band: 0 });
    });
    // helm: a flared iron dome with two curved horns
    k.add({ type: 'path', name: 'helm', underlay: true, mat: pal.metal, shade: 'sphere', d: k.smooth([[cx - X(4.4), headY + Y(0.5)], [cx - X(4.2), headY - Y(3.5)], [cx, headY - Y(6.2)], [cx + X(4.2), headY - Y(3.5)], [cx + X(4.4), headY + Y(0.5)], [cx, headY - Y(0.8)]]) });
    for (const sd of [-1, 1]) k.add({ type: 'path', name: 'horn', underlay: true, mat: pal.stone, shade: 'flat', band: 0, d: k.smooth([[cx + sd * X(4), headY - Y(2)], [cx + sd * X(7.5), headY - Y(3)], [cx + sd * X(8.6), headY - Y(6.5)], [cx + sd * X(6), headY - Y(5)], [cx + sd * X(3.4), headY - Y(3.4)]]) });
    // the maul: a long haft with a huge square head; held up over the shoulder, slammed forward on the attack
    k.main(() => {
      const f = k.frame % 4, atk = k.state === 'attack', dx = atk ? [X(1), X(-3), X(-8), X(-5)][f] : 0, dy = atk ? [-Y(2), Y(2), Y(9), Y(5)][f] : 0;
      k.arm(-1, pal.leather, cx - X(5.5) + dx, waist - Y(2) + dy, { wide: 7.6, r: 1.9, glove: pal.skin, handR: 1.6 });
      k.pole(pal.leather, cx - X(5.5) + dx, waist + Y(3) + dy, cx - X(9) + dx, shoulder - Y(5) + dy, 1, 'haft');
      k.add({ type: 'rect', name: 'maul-head', underlay: true, x: cx - X(14) + dx, y: shoulder - Y(8) + dy, w: X(10), h: Y(6), mat: pal.metal, shade: 'flat', band: 1 });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 1, eyes: 1.7, hand: L => [L.cx - L.X(5.5), L.waist - L.Y(2)] });
