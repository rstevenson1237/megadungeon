// boss-ulgrim-deepwarden base.v3 (r3, from base.v2) — the decorated pass on the owner-approved shape (silhouette kept):
// the body takes the family's recoloured ramp (recolour: cloth, as family-h): a cloth surcoat over the mail torso and
// cloth legs, lit linearly from the direction's light (no pillow); the review's notes: the shield face is a plain steel
// tower shield (the pale boss square that read as an eye is gone) with a rivet border and one accent emblem decal (a
// lozenge); the war-pick head is clear steel (linear light, a lit top edge, a dark socket band on the haft); the beard is
// the pale hair step and the legs the dark cloth step, so they separate by value at 1x. Face: a dark visor slit with two
// pale eye glints and a nose guard; from behind, a braid of hair down the surcoat and the emblem on the back. AO on the
// overlaps, light material noise on the surcoat.
// boss-ulgrim-deepwarden base.v2 (r2) — owner rejected v1 (a twin of Varn Ironmouth, the horned-helm dwarf with a square maul). SHAPE DRAFT, flat
// materials, no proc layers. Ulgrim Deepwarden now differs at 1x: a crested full helm with a visor slit (no horns), a tall tower
// shield on one arm and a war-pick (haft with a long curved beak) in the other, narrow shoulders, the head lifted clear on a
// visible neck, wide-set legs and a long thin beard hanging past the belt. Arms stay on the rig, so the attack swings the pick.
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'boss-ulgrim-deepwarden', pass: 'r3', notes: 'decorated: cloth surcoat (recolour), plain riveted steel tower shield with one emblem, steel pick head, pale beard over dark legs', mirror: false, recolour: 'cloth' };
const H = 2.8, HS = 0.72;
const rotP = ([x, y], [ox, oy], deg) => { const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); return [ox + (x - ox) * c - (y - oy) * s, oy + (x - ox) * s + (y - oy) * c]; };
export function render(ctx) {
  const decals = [];
  const proc = p => {
    p = p.add('ao', { part: ['torso', 'leg', 'pauldron', 'beard'] })
      .add('materialNoise', { part: ['torso'], amount: 0.06, scale: 3, seed: ctx.variant ?? 0 })
      .add('pattern', { part: 'shield-rivets', type: 'rivets', period: 4 });
    for (const d of decals) p = p.add('decal', d);
    return p;
  };
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, foot, knee } = k, headY = k.headY - Y(2.5);
    const flat = { shade: 'flat', band: 1 };
    k.legs(pal.cloth, 4.8, 2); k.boots(pal.metal, 3, 1.6);
    // slim torso, narrow shoulders
    k.shape('torso', pal.cloth, [[0, shoulder - Y(1)], [3.6, shoulder], [3.4, waist - Y(2)], [3.8, waist + Y(1.5)], [0, waist + Y(2)]], { shade: 'linear', gain: 1 });
    // mail showing at the collar, a steel gorget band
    k.add({ type: 'rect', name: 'gorget', x: cx - X(3), y: shoulder - Y(0.6), w: X(6), h: Y(1.4), mat: pal.metal, shade: 'flat', band: 1 });
    k.rear(() => {
      // from behind: a braid of hair down the surcoat, and the warden's lozenge on the back
      k.add({ type: 'capsule', name: 'braid', underlay: true, mat: pal.hair, shade: 'cyl', a: [cx, headY + Y(3)], b: [cx, waist - Y(2.5)], r: X(0.9), r1: X(0.6) });
      decals.push({ name: 'back-emblem', part: 'torso', mat: 'accent', band: 1, shape: { type: 'poly', pts: [[cx + X(2), waist - Y(5)], [cx + X(3.1), waist - Y(3)], [cx + X(2), waist - Y(1)], [cx + X(0.9), waist - Y(3)]] } });
    });
    k.add({ type: 'rect', name: 'belt', x: cx - X(3.8), y: waist - Y(0.5), w: X(7.6), h: Y(1.4), mat: pal.leather, shade: 'flat', band: 2 });
    k.add({ type: 'rect', name: 'buckle', x: Math.round(cx - X(0.6)) + k.turn, y: Math.round(waist - Y(0.5)), w: Math.max(2, Math.round(X(1.2))), h: Math.max(1, Math.round(Y(1.4))), mat: pal.metal, shade: 'flat', band: 0 });
    for (const sd of [-1, 1]) k.add({ type: 'ellipse', name: 'pauldron', underlay: true, cx: cx + sd * X(4.2), cy: shoulder + Y(0.5), rx: X(2.2), ry: Y(2), mat: pal.metal, shade: 'linear', gain: 1 });
    k.neck(pal.leather);
    // tower shield on the off arm: a tall slab down the whole side, held out clear of the body
    k.off(() => {
      k.arm(1, pal.metal, cx + X(8), waist - Y(3), { wide: 4.4, r: 1.5, glove: pal.leather, handR: 1.4 });
      const sp = [[cx + X(6), shoulder - Y(6)], [cx + X(12), shoulder - Y(6)], [cx + X(12.4), waist + Y(2)], [cx + X(9), foot - Y(2)], [cx + X(5.8), waist + Y(2)]];
      k.add({ type: 'path', name: 'tower-shield', underlay: true, mat: pal.metal, shade: 'linear', gain: 0.9, d: k.smooth(sp) });
      // a plain steel face: rivets round an inset border, one lozenge emblem (decal, laid in frame pixels after the off-hand turn)
      const inset = sp.map(([x, y]) => [x + (x < cx + X(9) ? X(1.3) : -X(1.3)), y + (y < shoulder ? Y(1.3) : y > foot - Y(4) ? -Y(1.6) : 0)]);
      k.add({ type: 'path', name: 'shield-rivets', mat: pal.metal, shade: 'flat', band: 1, d: k.smooth(inset) });
      k.add({ type: 'path', name: 'shield-face', mat: pal.metal, shade: 'linear', gain: 0.8, d: k.smooth(inset.map(([x, y]) => [x + (x < cx + X(9) ? X(1) : -X(1)), y + (y < shoulder ? Y(1) : y > foot - Y(5) ? -Y(1.2) : 0)])) });
      const em = [[cx + X(9.1), waist - Y(6.5)], [cx + X(10.5), waist - Y(3.5)], [cx + X(9.1), waist - Y(0.5)], [cx + X(7.7), waist - Y(3.5)]].map(p => rotP(p, k.offShoulder, k.P.off));
      decals.push({ name: 'emblem', part: 'shield-face', mat: 'accent', band: 1, shape: { type: 'poly', pts: em } });
    });
    k.head(headY + Y(1), { wide: 3.2, crown: 3.4, jaw: 2.6, chin: 3.6, point: 0, eyes: 1.5, hair: pal.metal, nose: false, mat: pal.metal });
    k.front(() => {
      // long thin beard, past the belt but narrow so the legs show either side
      k.add({ type: 'path', name: 'beard', underlay: true, mat: pal.hair, shade: 'linear', gain: 0.6, d: k.smooth([[cx - X(2.8), headY + Y(3.5)], [cx + X(2.8), headY + Y(3.5)], [cx + X(2), headY + Y(11)], [cx, headY + Y(17)], [cx - X(2), headY + Y(11)]]) });
    });
    // crested full helm: a dome, a tall fore-and-aft crest fin, no horns
    k.add({ type: 'path', name: 'helm', underlay: true, mat: pal.metal, shade: 'linear', gain: 1, d: k.smooth([[cx - X(3.8), headY + Y(3.6)], [cx - X(3.8), headY - Y(2.4)], [cx, headY - Y(4.6)], [cx + X(3.8), headY - Y(2.4)], [cx + X(3.8), headY + Y(3.6)], [cx, headY + Y(4.2)]]) });
    k.add({ type: 'path', name: 'crest', underlay: true, mat: pal.accent, shade: 'flat', band: 1, d: k.smooth([[cx - X(1.2), headY - Y(3.5)], [cx - X(0.8), headY - Y(8)], [cx + X(0.5), headY - Y(10)], [cx + X(1.4), headY - Y(6)], [cx + X(1.2), headY - Y(3.5)]]) });
    k.front(() => {
      // the face: a dark visor slit, two pale eye glints in it, a steel nose guard between them
      const vy = Math.round(headY - Y(0.6));
      k.add({ type: 'rect', name: 'visor', x: Math.round(cx - X(3) + k.turn), y: vy, w: Math.round(X(6)), h: Math.max(2, Math.round(Y(1.6))), color: 'leather.2' });
      for (const ex of [-1.8, 1.2]) k.add({ type: 'rect', name: 'eye-glint', x: Math.round(cx + X(ex) + k.turn), y: vy + 1, w: 1, h: 1, color: 'metal.0' });
      k.add({ type: 'rect', name: 'nose-guard', x: Math.round(cx + k.turn - X(0.3)), y: Math.round(headY - Y(2.5)), w: 1, h: Math.round(Y(4.5)), color: 'metal.1' });
    });
    // the war-pick: haft with a long curved beak, held out to the side; swung on the attack
    k.main(() => {
      const f = k.frame % 4, atk = k.state === 'attack', dx = atk ? [X(1), X(-3), X(-8), X(-5)][f] : 0, dy = atk ? [-Y(2), Y(2), Y(9), Y(5)][f] : 0;
      k.arm(-1, pal.metal, cx - X(10) + dx, waist - Y(2) + dy, { wide: 4.4, r: 1.5, glove: pal.leather, handR: 1.4 });
      k.pole(pal.leather, cx - X(10) + dx, waist + Y(9) + dy, cx - X(11) + dx, shoulder - Y(6) + dy, 0.9, 'haft');
      k.add({ type: 'path', name: 'pick-beak', underlay: true, mat: pal.metal, shade: 'linear', gain: 1.2, d: k.smooth([[cx - X(11) + dx, shoulder - Y(7) + dy], [cx - X(15) + dx, shoulder - Y(6) + dy], [cx - X(20) + dx, shoulder - Y(1) + dy], [cx - X(15) + dx, shoulder - Y(4.5) + dy], [cx - X(10.5) + dx, shoulder - Y(4) + dy]]) });
      k.add({ type: 'rect', name: 'pick-cap', underlay: true, mat: pal.metal, shade: 'linear', gain: 1, x: cx - X(10) + dx, y: shoulder - Y(9) + dy, w: X(2.4), h: Y(4) });
      // a dark binding where the haft meets the head: a decal on the haft, so it stays inside the line
      const sk = [[-12.5, -3.6], [-9.2, -3.6], [-9.2, -2.2], [-12.5, -2.2]].map(([x, y]) => k.mainAt([cx + X(x) + dx, shoulder + Y(y) + dy]));
      // (hidden behind the body on the back-facing wind-up, so not laid there)
      if (!(k.back && atk && f === 0)) decals.push({ name: 'binding', part: 'haft', mat: 'leather', band: 2, shape: { type: 'poly', pts: sk } });
    });
  }, { height: H * HS, proc });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H * HS, headDy: -1.5, eyes: 1.5, hand: L => [L.cx - L.X(10), L.waist - L.Y(2)] });
