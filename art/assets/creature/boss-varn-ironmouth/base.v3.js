// boss-varn-ironmouth base.v3 (r3) — owner rejected v2 (still a squat lump): a stout dwarf redrawn to read at 1x: head sunk
// between pauldrons under a horned helm, a beard wedge on the chest, two stout legs with a clear gap, and the maul held
// well out to the side with a long visible haft and its head on a gap of background. Back view: bigger swept horns and a
// rear crest, no beard, so front, back and side outlines differ. SHAPE DRAFT, flat materials, no proc layers.
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'boss-varn-ironmouth', pass: 'r3', notes: 'shape draft: stout horned-helm dwarf, beard wedge, legs with a gap, maul held clear to the side', mirror: false };
const H = 1.9;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, baseCx, waist, shoulder, foot } = k, headY = foot - Y(23.2), fy = n => foot - Y(n);
    const flat = { shade: 'flat', band: 1 };
    // two stout legs with a gap, boots set apart
    k.legs(pal.leather, 3.6, 2);
    k.P.feet.forEach((dy, i) => k.add({ type: 'ellipse', name: 'boot', cx: baseCx + (i ? 1 : -1) * X(3.7), cy: foot + Y(0.5) + dy, rx: X(2.2), ry: Y(1.4), mat: pal.metal, shade: 'sphere' }));
    // barrel torso, wide at the chest, tucked at the belt
    k.shape('torso', pal.leather, [[0, fy(20)], [5.4, fy(19)], [4.6, fy(14)], [4.4, waist + Y(1)], [0, waist + Y(1.5)]], flat);
    k.add({ type: 'rect', name: 'belt', x: cx - X(4.8), y: waist - Y(0.5), w: X(9.6), h: Y(1.6), mat: pal.accent, shade: 'flat', band: 1 });
    for (const sd of [-1, 1]) k.add({ type: 'ellipse', name: 'pauldron', underlay: true, cx: cx + sd * X(6.2), cy: fy(19), rx: X(2.8), ry: Y(2.3), mat: pal.metal, shade: 'sphere' });
    k.off(() => k.arm(1, pal.leather, cx + X(6.4), waist + Y(1), { wide: 6.4, r: 1.8, glove: pal.skin, handR: 1.5 }));
    k.head(headY, { wide: 3.6, crown: 3.4, jaw: 2.6, chin: 3.6, point: 0, eyes: 1.6, hair: pal.metal, nose: 1.4 });
    k.front(() => {
      // beard wedge: a broad collar of beard narrowing to a point on the belt
      k.add({ type: 'path', name: 'beard', underlay: true, mat: pal.accent, shade: 'flat', band: 1, d: k.smooth([[cx - X(3.6), headY + Y(1.5)], [cx + X(3.6), headY + Y(1.5)], [cx + X(2.6), headY + Y(5)], [cx, fy(13)], [cx - X(2.6), headY + Y(5)]]) });
    });
    // horned helm: an iron dome, horns swept out and up (longer, with a rear crest, from behind)
    const bk = k.back, hl = bk ? 1.25 : 1;
    k.add({ type: 'path', name: 'helm', underlay: true, mat: pal.metal, shade: 'sphere', d: k.smooth([[cx - X(4.2), headY + Y(0.5)], [cx - X(4), headY - Y(3.2)], [cx, headY - Y(5.2)], [cx + X(4), headY - Y(3.2)], [cx + X(4.2), headY + Y(0.5)], [cx, headY - Y(0.8)]]) });
    for (const sd of [-1, 1]) k.add({ type: 'path', name: 'horn', underlay: true, mat: pal.stone, shade: 'flat', band: 0, d: k.smooth([[cx + sd * X(3.8), headY - Y(1.4)], [cx + sd * X(6 * hl), headY - Y(2.4)], [cx + sd * X(6.6 * hl), headY - Y(6 * hl)], [cx + sd * X(4.8), headY - Y(3.8)], [cx + sd * X(3), headY - Y(3)]]) });
    if (bk) k.add({ type: 'path', name: 'rear-crest', underlay: true, mat: pal.metal, shade: 'flat', band: 1, d: k.smooth([[cx - X(1.4), headY - Y(4.4)], [cx, headY - Y(7.2)], [cx + X(1.4), headY - Y(4.4)]]) });
    // the maul: a long haft held out to the side, its square head high on a gap of background (swings down on the attack)
    k.main(() => {
      const f = k.frame % 4, atk = k.state === 'attack', dx = atk ? [X(1), X(-2), X(-6), X(-4)][f] : 0, dy = atk ? [-Y(2), Y(2), Y(8), Y(5)][f] : 0, hx = cx - X(14) + dx;
      k.arm(-1, pal.leather, hx, fy(14.5) + dy, { wide: 6.4, r: 1.8, glove: pal.skin, handR: 1.5 });
      k.pole(pal.leather, hx, fy(9) + dy, hx, fy(22) + dy, 1, 'haft');
      k.add({ type: 'rect', name: 'maul-head', underlay: true, x: hx - X(5.5), y: fy(28.5) + dy, w: X(11), h: Y(7), mat: pal.metal, shade: 'flat', band: 1 });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: -3, eyes: 1.6, hand: L => [L.cx - L.X(14), L.foot - L.Y(14.5)] });
