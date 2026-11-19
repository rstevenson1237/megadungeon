// boss-ulgrim-deepwarden base.v2 (r2) — owner rejected v1 (a twin of Varn Ironmouth, the horned-helm dwarf with a square maul). SHAPE DRAFT, flat
// materials, no proc layers. Ulgrim Deepwarden now differs at 1x: a crested full helm with a visor slit (no horns), a tall tower
// shield on one arm and a war-pick (haft with a long curved beak) in the other, narrow shoulders, the head lifted clear on a
// visible neck, wide-set legs and a long thin beard hanging past the belt. Arms stay on the rig, so the attack swings the pick.
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'boss-ulgrim-deepwarden', pass: 'r2', notes: 'shape draft: crested full-helm dwarf warden, tower shield and war-pick, narrow shoulders, long beard', mirror: false };
const H = 2.8, HS = 0.72;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, foot, knee } = k, headY = k.headY - Y(2.5);
    const flat = { shade: 'flat', band: 1 };
    k.legs(pal.leather, 4.8, 2); k.boots(pal.metal, 3, 1.6);
    // slim torso, narrow shoulders
    k.shape('torso', pal.metal, [[0, shoulder - Y(1)], [3.6, shoulder], [3.4, waist - Y(2)], [3.8, waist + Y(1.5)], [0, waist + Y(2)]], flat);
    k.add({ type: 'rect', name: 'belt', x: cx - X(3.8), y: waist - Y(0.5), w: X(7.6), h: Y(1.4), mat: pal.accent, shade: 'flat', band: 1 });
    for (const sd of [-1, 1]) k.add({ type: 'ellipse', name: 'pauldron', underlay: true, cx: cx + sd * X(4.2), cy: shoulder + Y(0.5), rx: X(2.2), ry: Y(2), mat: pal.metal, shade: 'sphere' });
    k.neck(pal.leather);
    // tower shield on the off arm: a tall slab down the whole side, held out clear of the body
    k.off(() => {
      k.arm(1, pal.metal, cx + X(8), waist - Y(3), { wide: 4.4, r: 1.5, glove: pal.leather, handR: 1.4 });
      k.add({ type: 'path', name: 'tower-shield', underlay: true, mat: pal.metal, shade: 'flat', band: 1, d: k.smooth([[cx + X(6), shoulder - Y(6)], [cx + X(12), shoulder - Y(6)], [cx + X(12.4), waist + Y(2)], [cx + X(9), foot - Y(2)], [cx + X(5.8), waist + Y(2)]]) });
      k.add({ type: 'rect', name: 'shield-boss', mat: pal.accent, shade: 'flat', band: 0, x: cx + X(7.4), y: waist - Y(5), w: X(3.2), h: Y(3.2) });
    });
    k.head(headY + Y(1), { wide: 3.2, crown: 3.4, jaw: 2.6, chin: 3.6, point: 0, eyes: 1.5, hair: pal.metal, nose: false, mat: pal.metal });
    k.front(() => {
      // long thin beard, past the belt but narrow so the legs show either side
      k.add({ type: 'path', name: 'beard', underlay: true, mat: pal.accent, shade: 'flat', band: 1, d: k.smooth([[cx - X(2.8), headY + Y(3.5)], [cx + X(2.8), headY + Y(3.5)], [cx + X(2), headY + Y(11)], [cx, headY + Y(17)], [cx - X(2), headY + Y(11)]]) });
    });
    // crested full helm: a dome, a tall fore-and-aft crest fin, no horns
    k.add({ type: 'path', name: 'helm', underlay: true, mat: pal.metal, shade: 'sphere', d: k.smooth([[cx - X(3.8), headY + Y(3.6)], [cx - X(3.8), headY - Y(2.4)], [cx, headY - Y(4.6)], [cx + X(3.8), headY - Y(2.4)], [cx + X(3.8), headY + Y(3.6)], [cx, headY + Y(4.2)]]) });
    k.add({ type: 'path', name: 'crest', underlay: true, mat: pal.accent, shade: 'flat', band: 1, d: k.smooth([[cx - X(1.2), headY - Y(3.5)], [cx - X(0.8), headY - Y(8)], [cx + X(0.5), headY - Y(10)], [cx + X(1.4), headY - Y(6)], [cx + X(1.2), headY - Y(3.5)]]) });
    k.front(() => k.add({ type: 'rect', name: 'visor', x: cx - X(3) + k.turn, y: headY - Y(0.6), w: X(6), h: Y(1.1), mat: pal.leather, shade: 'flat', band: 0 }));
    // the war-pick: haft with a long curved beak, held out to the side; swung on the attack
    k.main(() => {
      const f = k.frame % 4, atk = k.state === 'attack', dx = atk ? [X(1), X(-3), X(-8), X(-5)][f] : 0, dy = atk ? [-Y(2), Y(2), Y(9), Y(5)][f] : 0;
      k.arm(-1, pal.metal, cx - X(10) + dx, waist - Y(2) + dy, { wide: 4.4, r: 1.5, glove: pal.leather, handR: 1.4 });
      k.pole(pal.leather, cx - X(10) + dx, waist + Y(9) + dy, cx - X(11) + dx, shoulder - Y(6) + dy, 0.9, 'haft');
      k.add({ type: 'path', name: 'pick-beak', underlay: true, mat: pal.metal, shade: 'flat', band: 1, d: k.smooth([[cx - X(11) + dx, shoulder - Y(7) + dy], [cx - X(15) + dx, shoulder - Y(6) + dy], [cx - X(20) + dx, shoulder - Y(1) + dy], [cx - X(15) + dx, shoulder - Y(4.5) + dy], [cx - X(10.5) + dx, shoulder - Y(4) + dy]]) });
      k.add({ type: 'rect', name: 'pick-cap', underlay: true, mat: pal.metal, shade: 'flat', band: 1, x: cx - X(10) + dx, y: shoulder - Y(9) + dy, w: X(2.4), h: Y(4) });
    });
  }, { height: H * HS });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H * HS, headDy: -1.5, eyes: 1.5, hand: L => [L.cx - L.X(10), L.waist - L.Y(2)] });
