// boss-the-hollow-abbot base.v4 (r4, rescale) — from base.v3. The owner now measures boss sizes against the drawn player
// (about 37 px): the brief's height is 2.7 m, 43 px at 16 px a metre, in the 64 x 80 large frame. The rig height goes from
// 1.85 to 2.25 so the whole figure (robe, mantle, cowl, arms, censer, crook, every X()/Y() proportion) is redrawn about
// 1.16x taller, not upscaled; the single-pixel details (eye points, wrap lines, cross) now grow with the rig so the face
// and marks read clearer at the bigger size. One cheap fix from the blind note: the flat red hem band read as a stray
// ground line, so the hem is now a dark trim shaded on the body (cloth) ramp. Design, colours, facings and animation unchanged.
// boss-the-hollow-abbot base.v3 (r3, decoration) — from base.v2, whose shape the owner approved; the silhouette is kept and
// the one detailed pass decorates it inside the line (review: "reads as a generic wizard"). It now reads as a mummy-abbot:
//  - front: the cowl opens on a face wound in pale linen (cloth light step, dark band lines), a hollow dark face inside
//    the wraps and two pale eye points (glow.0) in it;
//  - bandaged hands: both hands in the light linen step with a dark wrap line, and the trailing sleeve wraps lifted to
//    pale linen with a dark band line so they read as bandages, not sleeve;
//  - censer and crook read as metal: the censer gets a lid band, pierced holes and a glowing coal; the crook a dark
//    inner curl so it reads as a hook, not a ball;
//  - back facing: the cowl gets a dark centre seam and a pale linen strip trails from under the cowl down the back;
//  - proc: ambient occlusion and a faint material noise on the robe, and a worn accent
//    decal (a faded abbot's cross) on the robe's chest, front only.
// The body stays on the cloth ramp (the family's recolour ramp, as family-m-cap); no colour literals (R11).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'boss-the-hollow-abbot', pass: 'r4', notes: 'rescale to 2.7 m (43 px, 1.2x the drawn player): rig height 2.25, pixel details scale with the rig; hem on the cloth ramp instead of a red band', mirror: false };
const H = 2.25; // rig scale: the pointed cowl and crook add to the 2.7 m total (43 px drawn)
export function render(ctx) {
  const decals = [];
  const proc = p => {
    p = p.add('ao', { part: ['robe', 'mantle', 'cowl', 'cowl-back'] })
      .add('materialNoise', { part: ['robe'], amount: 0.06, scale: 3, seed: ctx.variant ?? 0 })
      ;
    for (const d of decals) p = p.add('decal', d);
    return p;
  };
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R, back, turn } = k, c = pal.cloth;
    const linen = [c[0], c[0], c[1]]; // bandage linen: the cloth ramp's light steps
    const sway = k.P.walking ? (k.P.feet[0] > 0 ? 1 : k.P.feet[0] < 0 ? -1 : 0) : 0;
    const hand = (hx, hy) => {
      k.add({ type: 'circle', name: 'hand', cx: hx, cy: hy, r: X(1.1), mat: linen, shade: 'sphere' });
      k.add({ type: 'rect', name: 'hand-wrap', x: Math.round(hx - X(1)), y: Math.round(hy), w: Math.max(1, Math.round(X(2))), h: 1, color: 'cloth.1' });
    };
    const wrap = pts => {
      k.add({ type: 'tube', name: 'wrap', mat: linen, shade: 'flat', band: 0, pts, w: X(1.3), w1: X(0.6) });
      const m = pts[1];
      k.add({ type: 'rect', name: 'wrap-line', x: Math.round(m[0] - X(0.5)), y: Math.round(m[1]), w: 1, h: 1, color: 'cloth.1' });
    };
    // the robe: solid, from the broad shoulders to the floor
    k.shape('robe', c, [[0, shoulder - Y(1)], [5.6, shoulder], [5.8, shoulder + Y(4)], [4.8, waist], [6.4, waist + Y(4)], [7.6, foot + Y(1)], [0, foot + Y(1)]]);
    k.add({ type: 'rect', name: 'hem', x: cx - X(7.6) + sway, y: foot - Y(0.5), w: X(15.2), h: Math.max(1, Y(1.3)), mat: c, shade: 'flat', band: 3 });
    k.add({ type: 'rect', name: 'sash', x: cx - X(4.8), y: waist - Y(1), w: X(9.6), h: Math.max(1, Y(1.2)), mat: pal.leather, shade: 'flat', band: 2 });
    // from behind: a pale linen strip trailing from under the cowl down the back
    k.rear(() => k.add({ type: 'tube', name: 'back-wrap', mat: linen, shade: 'flat', band: 0, pts: [[cx + X(0.5), shoulder], [cx - X(0.5), waist - Y(3)], [cx + X(1), waist + Y(6)]], w: X(1.4), w1: X(0.8) }));
    // the front: a faded abbot's cross on the chest, as a worn decal on the robe
    if (!back) decals.push({ name: 'cross', part: 'robe', mat: 'accent', band: 2, opacity: 0.75, shape: [
      { type: 'rect', x: Math.round(cx + turn), y: Math.round(shoulder + Y(3.5)), w: 1, h: Math.max(3, Math.round(Y(4.5))) },
      { type: 'rect', x: Math.round(cx + turn - X(1.2)), y: Math.round(shoulder + Y(4.6)), w: Math.max(3, Math.round(X(2.4)) + 1), h: 1 },
    ] });
    // the mantle: wide shoulders
    k.add({ type: 'ellipse', name: 'mantle', cx, cy: shoulder + Y(1), rx: X(7), ry: Y(2.6), mat: c, shade: 'cyl', axis: 'x', underlay: true });
    // the off arm: held out to the side with a censer on a chain, and a ragged wrap trailing
    k.off(() => {
      k.arm(1, c, R + X(1), shoulder + Y(4), { r: 1.7, wide: 6, hand: false });
      hand(R + X(1), shoulder + Y(4));
      wrap([[R - X(1), shoulder + Y(5)], [R, waist - Y(2)], [R - X(1.5), waist + Y(4)]]);
      k.add({ type: 'tube', name: 'chain', mat: pal.metal, shade: 'flat', band: 1, pts: [[R + X(1), shoulder + Y(5)], [R + X(1), shoulder + Y(9)]], w: X(0.5), w1: X(0.5) });
      const ccx = R + X(1), ccy = shoulder + Y(11);
      k.add({ type: 'circle', name: 'censer', cx: ccx, cy: ccy, r: X(2.2), mat: pal.metal, shade: 'sphere', underlay: true });
      k.add({ type: 'rect', name: 'censer-lid', x: Math.round(ccx - X(1.8)), y: Math.round(ccy - Y(0.6)), w: Math.max(3, Math.round(X(3.6))), h: 1, color: 'metal.2' });
      k.add({ type: 'rect', name: 'censer-coal', x: Math.round(ccx - X(0.5)), y: Math.round(ccy + Y(0.6)), w: 1, h: 1, color: 'glow.1' });
      k.add({ type: 'rect', name: 'censer-coal', x: Math.round(ccx + X(0.8)), y: Math.round(ccy + Y(0.6)), w: 1, h: 1, color: 'glow.0' });
    });
    // the pointed cowl
    k.head(headY, { mat: linen, wide: 3, crown: 4.2, jaw: 1.8, chin: 4.2, point: 0.35, eyes: 1.5, hair: c, nose: false, eye: 'cloth.2' });
    k.front(() => {
      const cowl = k.smooth([[cx, headY - Y(7.5)], [cx + X(2.4), headY - Y(3.5)], [cx + X(4.4), headY + Y(3)], [cx + X(2), headY + Y(5)], [cx - X(2), headY + Y(5)], [cx - X(4.4), headY + Y(3)], [cx - X(2.4), headY - Y(3.5)]]);
      k.add({ type: 'path', name: 'cowl', underlay: true, mat: c, shade: 'sphere', d: cowl });
      // the opening: a face wound in linen, hollow and dark inside, two pale eye points
      const fx = cx + turn, fy = headY + Y(0.8);
      // clipped to the cowl, so the opening never changes the approved silhouette
      k.add({ type: 'group', name: 'face', clip: { type: 'path', d: cowl }, children: [{ type: 'ellipse', name: 'face-wraps', cx: fx, cy: fy, rx: X(2.9), ry: Y(3.5), mat: linen, shade: 'flat', band: 0 }] });
      k.add({ type: 'rect', name: 'face-wrap-line', x: Math.round(fx - X(2.4)), y: Math.round(fy - Y(2.4)), w: Math.round(X(5)), h: 1, color: 'cloth.1' });
      k.add({ type: 'rect', name: 'face-wrap-line', x: Math.round(fx - X(1.8)), y: Math.round(fy + Y(2.4)), w: Math.round(X(3.6)), h: 1, color: 'cloth.1' });
      k.add({ type: 'ellipse', name: 'hollow', cx: fx, cy: fy, rx: X(2), ry: Y(1.7), color: 'cloth.2' });
      for (const e of [-1, 1]) k.add({ type: 'rect', name: 'eye-point', x: Math.round(fx + e * X(0.9)) - (e < 0 ? 1 : 0), y: Math.round(fy - Y(0.5)), w: 1, h: Math.max(1, Math.round(Y(0.8))), color: 'glow.0' });
    });
    k.rear(() => {
      k.add({ type: 'path', name: 'cowl-back', mat: c, shade: 'sphere', d: k.smooth([[cx, headY - Y(7.5)], [cx + X(2.6), headY - Y(3.5)], [cx + X(4.6), headY + Y(3)], [cx + X(2.6), headY + Y(6)], [cx - X(2.6), headY + Y(6)], [cx - X(4.6), headY + Y(3)], [cx - X(2.6), headY - Y(3.5)]]) });
      k.add({ type: 'rect', name: 'cowl-seam', x: Math.round(cx), y: Math.round(headY - Y(5)), w: 1, h: Math.round(Y(10)), color: 'cloth.1' });
    });
    // the crook staff, held out clear of the body
    k.main(() => {
      const sx = L - X(3);
      k.arm(-1, c, sx, shoulder + Y(4), { r: 1.7, wide: 6, hand: false });
      wrap([[L + X(1), shoulder + Y(5)], [L, waist - Y(2)], [L + X(1), waist + Y(5)]]);
      k.pole(pal.leather, sx, foot - Y(0.5), sx, headY - Y(4), 0.9, 'staff');
      hand(sx, shoulder + Y(4));
      const kx = sx + X(2), ky = headY - Y(4);
      k.add({ type: 'ellipse', name: 'crook', cx: kx, cy: ky, rx: X(2.4), ry: Y(2.4), mat: pal.metal, shade: 'cyl', axis: 'x', underlay: true });
      k.add({ type: 'ellipse', name: 'crook-curl', cx: kx + X(0.2), cy: ky + Y(0.4), rx: X(1), ry: Y(1), color: 'metal.2' });
    });
  }, { height: H, proc });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.L - L.X(3), L.shoulder + L.Y(4)] });
