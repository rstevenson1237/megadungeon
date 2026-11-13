// boss-varn-ironmouth base.v5 (r5) — DECORATE from base.v4, whose shape the owner approved: the silhouette (every
// shape's outline, the facings and the maul swing) is unchanged; only what is inside the line changes.
// - Body on the cloth ramp (the family-h recolour ramp): the barrel torso and the sleeves are a padded cloth coat,
//   shaded as a mass ('normal') from the direction's light; legs stay leather trousers, boots and armour metal.
// - A readable face: skin cheeks and nose between the helm's brow and the beard, two dark eyes under the brow, and the
//   "iron mouth": a riveted iron jaw-plate across the top of the rust beard. The beard is shaded and gets braid strands.
// - The maul: a bevelled iron head with a darker banded collar where the haft goes in and dents (decals); a leather
//   grip wrap (stripes) on the haft. Horns shaded as pale horn (hair ramp) with a lit rim; helm and pauldrons get rivets.
// - Back facings: a thick hair braid falls from under the helm down the back, a leather harness crosses the coat.
// - Proc: cast shadows of beard, pauldrons and arms on the coat, AO on the coat, lit-side rim light on the metal.
// (v4: rescale to 2.4 m; shape draft, flat materials.)
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'boss-varn-ironmouth', pass: 'r5', notes: 'decorated: cloth coat body (family-h ramp), iron jaw-plate face, bevelled riveted maul with grip wrap, back braid and harness', mirror: false, recolour: 'cloth' };
const H = 2.4;
export function render(ctx) {
  const marks = {};
  return biped(ctx, k => {
    const { pal, X, Y, cx, baseCx, waist, foot } = k, headY = foot - Y(23.2), fy = n => foot - Y(n);
    const bk = k.back, hl = bk ? 1.25 : 1;
    Object.assign(marks, { cx, X, Y, headY, waist, fy, back: bk });
    // two stout legs with a gap (leather trousers), iron-shod boots set apart
    k.legs(pal.leather, 3.6, 2);
    k.P.feet.forEach((dy, i) => k.add({ type: 'ellipse', name: 'boot', cx: baseCx + (i ? 1 : -1) * X(3.7), cy: foot + Y(0.5) + dy, rx: X(2.2), ry: Y(1.4), mat: pal.metal, shade: 'sphere' }));
    // barrel torso: a padded cloth coat, shaded as one mass from the light
    k.shape('torso', pal.cloth, [[0, fy(20)], [5.4, fy(19)], [4.6, fy(14)], [4.4, waist + Y(1)], [0, waist + Y(1.5)]], { shade: 'normal', round: X(3) });
    k.rear(() => {
      // a leather harness crossing the back of the coat, and a braid of hair from under the helm
      for (const sd of [-1, 1]) k.add({ type: 'capsule', name: 'harness', mat: pal.leather, shade: 'flat', band: 1, a: [cx + sd * X(4), fy(19.5)], b: [cx - sd * X(3.4), waist - Y(0.2)], r: X(0.55) });
      k.add({ type: 'tube', name: 'braid', underlay: true, mat: pal.hair, shade: 'cyl', pts: [[cx, headY + Y(1)], [cx + X(0.4), fy(18)], [cx, fy(15.5)]], w: X(2.2), w1: X(1.2) });
      for (const v of [0.25, 0.5, 0.75]) k.add({ type: 'rect', name: 'braid-tie', x: Math.round(cx - X(0.8)), y: Math.round(headY + Y(1) + (fy(15.5) - headY - Y(1)) * v), w: Math.max(2, Math.round(X(1.6))), h: 1, color: 'hair.2' });
    });
    k.add({ type: 'rect', name: 'belt', x: cx - X(4.8), y: waist - Y(0.5), w: X(9.6), h: Y(1.6), mat: pal.leather, shade: 'cyl', axis: 'x' });
    k.front(() => k.add({ type: 'rect', name: 'buckle', x: Math.round(cx - X(1)), y: Math.round(waist - Y(0.5)), w: Math.round(X(2)), h: Math.round(Y(1.6)), mat: pal.metal, shade: 'bevel' }));
    for (const sd of [-1, 1]) k.add({ type: 'ellipse', name: 'pauldron', underlay: true, cx: cx + sd * X(6.2), cy: fy(19), rx: X(2.8), ry: Y(2.3), mat: pal.metal, shade: 'sphere' });
    k.off(() => k.arm(1, pal.cloth, cx + X(6.4), waist + Y(1), { wide: 6.4, r: 1.8, glove: pal.skin, handR: 1.5 }));
    k.head(headY, { wide: 3.6, crown: 3.4, jaw: 2.6, chin: 3.6, point: 0, eyes: 1.6, hair: pal.metal, nose: 1.4 });
    k.front(() => {
      // cheeks lit on the light's side, then the beard wedge (rust) narrowing to a point on the belt
      k.add({ type: 'path', name: 'beard', underlay: true, mat: pal.accent, shade: 'normal', round: X(1.5), d: k.smooth([[cx - X(3.6), headY + Y(1.5)], [cx + X(3.6), headY + Y(1.5)], [cx + X(2.6), headY + Y(5)], [cx, fy(13)], [cx - X(2.6), headY + Y(5)]]) });
    });
    // horned helm: an iron dome, horns swept out and up (longer, with a rear crest, from behind)
    k.add({ type: 'path', name: 'helm', underlay: true, mat: pal.metal, shade: 'sphere', d: k.smooth([[cx - X(4.2), headY + Y(0.5)], [cx - X(4), headY - Y(3.2)], [cx, headY - Y(5.2)], [cx + X(4), headY - Y(3.2)], [cx + X(4.2), headY + Y(0.5)], [cx, headY - Y(0.8)]]) });
    for (const sd of [-1, 1]) k.add({ type: 'path', name: 'horn', underlay: true, mat: pal.hair, shade: 'normal', round: X(1), d: k.smooth([[cx + sd * X(3.8), headY - Y(1.4)], [cx + sd * X(6 * hl), headY - Y(2.4)], [cx + sd * X(6.6 * hl), headY - Y(6 * hl)], [cx + sd * X(4.8), headY - Y(3.8)], [cx + sd * X(3), headY - Y(3)]]) });
    if (bk) k.add({ type: 'path', name: 'rear-crest', underlay: true, mat: pal.metal, shade: 'cyl', axis: 'x', d: k.smooth([[cx - X(1.4), headY - Y(4.4)], [cx, headY - Y(7.2)], [cx + X(1.4), headY - Y(4.4)]]) });
    k.front(() => {
      // the face under the helm's brow (drawn over the helm's lower rim, inside the line): skin lit on the light's side,
      // two dark eyes, a nose with a shadow under it
      const fx = cx + k.turn;
      k.add({ type: 'ellipse', name: 'face', cx: fx, cy: headY + Y(0.4), rx: X(2.5), ry: Y(1.5), mat: pal.skin, shade: 'sphere' });
      k.add({ type: 'rect', name: 'brow', x: Math.round(fx - X(2.6)), y: Math.round(headY - Y(1.1)), w: Math.round(X(5.2)), h: 1, color: 'metal.2' });
      for (const e of [-1.6, 1.6]) k.add({ type: 'rect', name: 'eye', x: Math.round(fx + X(e)), y: Math.round(headY - Y(0.2)), w: 1, h: 2, color: 'outline' });
      k.add({ type: 'rect', name: 'nose', x: Math.round(fx) , y: Math.round(headY), w: 1, h: 1, color: 'skin.0' });
      // the iron mouth: a riveted jaw-plate across the top of the beard
      k.add({ type: 'rect', name: 'jaw-plate', underlay: true, x: Math.round(cx - X(3)), y: Math.round(headY + Y(1.9)), w: Math.round(X(6)), h: Math.max(2, Math.round(Y(1.5))), mat: pal.metal, shade: 'cyl', axis: 'x' });
      for (const e of [-2.2, 2.2]) k.add({ type: 'rect', name: 'jaw-rivet', x: Math.round(cx + X(e) - 0.5), y: Math.round(headY + Y(2.4)), w: 1, h: 1, color: 'metal.0' });
      k.add({ type: 'rect', name: 'nose-shadow', x: Math.round(fx), y: Math.round(headY + Y(0.8)), w: 1, h: 1, color: 'skin.2' });
    });
    // the maul: a long haft held out to the side, its square head high on a gap of background (swings down on the attack)
    k.main(() => {
      const f = k.frame % 4, atk = k.state === 'attack', dx = atk ? [X(1), X(-2), X(-6), X(-4)][f] : 0, dy = atk ? [-Y(2), Y(2), Y(8), Y(5)][f] : 0, hx = cx - X(14) + dx;
      k.arm(-1, pal.cloth, hx, fy(14.5) + dy, { wide: 6.4, r: 1.8, glove: pal.skin, handR: 1.5 });
      k.pole(pal.leather, hx, fy(9) + dy, hx, fy(22) + dy, 1, 'haft');
      k.add({ type: 'rect', name: 'maul-head', underlay: true, x: hx - X(5.5), y: fy(28.5) + dy, w: X(11), h: Y(7), mat: pal.metal, shade: 'bevel' });
      marks.maul = { hx, dy };
    });
  }, { height: H, proc: (p, k) => {
    const { cx, X, Y, fy, back } = marks, m = marks.maul;
    p = p.add('castShadow', { part: ['beard', 'jaw-plate', 'pauldron', 'upper-arm', 'forearm', 'braid'], dist: 1 })
      .add('ao', { part: ['torso', 'belt'] })
      .add('materialNoise', { part: ['torso'], amount: 0.12, scale: 2 })
      .add('rimLight', { part: ['helm', 'pauldron', 'maul-head', 'horn', 'boot'], side: 'lit' })
      .add('pattern', { part: 'haft', type: 'stripes', period: 2, axis: 'y' })
      .add('pattern', { part: ['pauldron', 'helm'], type: 'rivets', period: 4 });
    // the maul head's banded collar and two dents, carried round the shoulder with the swing
    const at = (x, y) => k.mainAt([m.hx + X(x), fy(y) + m.dy]);
    const quad = (x0, y0, x1, y1) => ({ type: 'poly', pts: [at(x0, y0), at(x1, y0), at(x1, y1), at(x0, y1)] });
    if (!(back && k.state === 'attack')) p = p.add('decal', { name: 'collar', part: 'maul-head', mat: 'metal', band: 2, shape: quad(-1.6, 21.6, 1.6, 28.4) })
      .add('decal', { name: 'dent', part: 'maul-head', mat: 'metal', band: 2, shape: [{ type: 'circle', cx: at(-3.6, 26.2)[0], cy: at(-3.6, 26.2)[1], r: 0.9 }, { type: 'circle', cx: at(3.4, 23.4)[0], cy: at(3.4, 23.4)[1], r: 0.8 }] });
    // braid strands down the beard (front)
    if (!back) p = p.add('decal', { name: 'strands', part: 'beard', mat: 'accent', band: 2, shape: [
      { type: 'poly', pts: [[cx - X(1.3), marks.headY + Y(3.6)], [cx - X(0.6), marks.headY + Y(3.6)], [cx - X(0.2), fy(14)], [cx - X(0.7), fy(14)]] },
      { type: 'poly', pts: [[cx + X(1.2), marks.headY + Y(3.6)], [cx + X(1.9), marks.headY + Y(3.6)], [cx + X(1.1), fy(15.5)], [cx + X(0.6), fy(15.5)]] }] });
    return p;
  } });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: -3, eyes: 1.6, hand: L => [L.cx - L.X(14), L.foot - L.Y(14.5)] });
