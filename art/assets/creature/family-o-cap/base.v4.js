// family-o-cap base.v4 (x1, from base.v2) — the blind reviewer's point: v2 read as a golem (capsule limbs, box torso,
// small dome head, a stubby club at contact). The body is redrawn in the asset, still on the biped layout: a soft
// pear torso with hunched trapezius humps, a hanging pot belly over the hide loincloth, the egg head set forward and
// low between the humps (a narrow crown over a wide heavy jaw, tusks up from the underbite), each arm one continuous
// tapering bent limb from shoulder to fist, thick bowed legs on broad feet, and the club posed per frame so the
// contact frame slams it down and out beside the body instead of tucking it vertically in front.
// family-o-cap base.v2 (r2, from base.v1) — face only: 1 px dark eyes under a heavier brow ridge, an underbite jaw.
// family-o-cap base.v1 (r1) — ogres (glyph O, 3.6 m, twice the player) at the large frame. The skin is the recoloured
// ramp (recolour: skin).
import { biped, bipedAnchors, bipedLayout } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-o-cap', pass: 'x1', notes: 'ogre: pear body, pot belly, egg head with heavy jaw sunk forward, bent arms, bowed legs, club', mirror: false, recolour: 'skin' };
const H = 3.6;

// Per state and frame, in pixels from the body centre (x) and absolute y: the club arm (shoulder fixed) as elbow,
// fist and club head; the off arm as elbow and fist. Screen-left arm holds the club (as the biped rig's main hand).
const ARMS = {
  idle: [
    { e: [-17, 50], f: [-16, 61], c: [-24, 77], oe: [17, 50], of: [16, 61] },
    { e: [-17, 51], f: [-16, 62], c: [-24, 77], oe: [17, 51], of: [16, 62] },
  ],
  walk: [
    { e: [-17, 50], f: [-14, 60], c: [-21, 77], oe: [18, 49], of: [18, 59] },
    { e: [-17, 50], f: [-16, 61], c: [-24, 77], oe: [17, 50], of: [16, 61] },
    { e: [-18, 49], f: [-18, 59], c: [-27, 76], oe: [17, 50], of: [14, 60] },
    { e: [-17, 50], f: [-16, 61], c: [-24, 77], oe: [17, 50], of: [16, 61] },
  ],
  attack: [
    { e: [-19, 31], f: [-12, 22], c: [-20, 5], oe: [17, 49], of: [15, 57] },  // anticipation: club raised over the shoulder
    { e: [-20, 35], f: [-24, 29], c: [-27, 11], oe: [18, 48], of: [17, 56] }, // swing: coming over and out
    { e: [-19, 47], f: [-21, 57], c: [-27, 74], oe: [18, 50], of: [19, 59] }, // contact: slammed down beside the feet
    { e: [-18, 49], f: [-18, 60], c: [-24, 76], oe: [17, 50], of: [16, 61] }, // recovery
  ],
};
const armsOf = ctx => { const a = ARMS[ctx.state] ?? ARMS.idle; return a[(ctx.logical ?? ctx.frame) % a.length]; };

export function render(ctx) {
  return biped(ctx, k => {
    const { pal, cx, foot, P, back, smooth } = k, A = armsOf(ctx);
    const up = k.shoulder - (foot - k.Y(21)); // the bob
    const t = back ? 0 : -2;                  // the face turned toward the viewer's left
    const at = ([dx, y], dy = up) => [cx + dx, y + dy];

    // ---- the club arm (screen left) with its club; from behind it goes first, behind the body
    const clubArm = () => {
      const sh = at([-12, 40]), e = at(A.e), f = at(A.f), c = [cx + A.c[0], A.c[1] + (A.c[1] > 70 ? 0 : up)];
      const dir = [c[0] - f[0], c[1] - f[1]], len = Math.hypot(...dir), n = [dir[0] / len, dir[1] / len];
      const butt = [f[0] - n[0] * 3, f[1] - n[1] * 3], mid = [f[0] + n[0] * len * 0.55 - n[1] * 1, f[1] + n[1] * len * 0.55 + n[0] * 1];
      k.add({ type: 'tube', name: 'club', underlay: true, mat: pal.leather, shade: 'cyl', pts: [butt, mid, c], w: 3.2, w1: 6.6 });
      k.add({ type: 'circle', name: 'knot', cx: f[0] + n[0] * len * 0.7 + n[1] * 2.6, cy: f[1] + n[1] * len * 0.7 - n[0] * 2.6, r: 1.6, mat: pal.leather, shade: 'flat', band: 0 });
      k.add({ type: 'circle', name: 'knot', cx: c[0] - n[0] * 3 - n[1] * 2.4, cy: c[1] - n[1] * 3 + n[0] * 2.4, r: 1.4, mat: pal.leather, shade: 'flat', band: 1 });
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: pal.skin, shade: 'cyl', pts: [sh, e, f], w: 7.4, w1: 5 });
      k.add({ type: 'ellipse', name: 'fist', underlay: true, cx: f[0], cy: f[1], rx: 3.4, ry: 3, mat: pal.skin, shade: 'sphere' });
    };
    const offArm = () => {
      const sh = at([12, 40]), e = at(A.oe), f = at(A.of);
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: pal.skin, shade: 'cyl', pts: [sh, e, f], w: 7.4, w1: 5 });
      k.add({ type: 'ellipse', name: 'fist', underlay: true, cx: f[0], cy: f[1], rx: 3.4, ry: 3, mat: pal.skin, shade: 'sphere' });
    };
    // ---- the egg head: a narrow crown over a wide heavy jaw, sunk forward between the shoulder humps
    const head = () => {
      const hx = cx + t, hy = 31 + up;
      k.add({ type: 'path', name: 'head', underlay: true, mat: pal.skin, shade: 'sphere', d: smooth([[hx, hy - 10], [hx + 4.6, hy - 7.6], [hx + 5.8, hy - 2], [hx + 7, hy + 3], [hx + 5.6, hy + 6.4], [hx, hy + 7.4], [hx - 5.6, hy + 6.4], [hx - 7, hy + 3], [hx - 5.8, hy - 2], [hx - 4.6, hy - 7.6]]) });
      if (back) return;
      // brow ridge lit on top, its shadow under it; small dark eyes in the shadow
      k.add({ type: 'path', name: 'brow', mat: pal.skin, shade: 'flat', band: 0, d: smooth([[hx - 5.4, hy - 2], [hx - 4, hy - 4.4], [hx, hy - 3.4], [hx + 4, hy - 4.4], [hx + 5.4, hy - 2], [hx, hy - 2.6]]) });
      k.add({ type: 'rect', name: 'brow-shadow', x: Math.round(hx - 4), y: Math.round(hy - 2), w: 8, h: 1, mat: pal.skin, shade: 'flat', band: 2 });
      for (const e of [-2.5, 2.5]) k.add({ type: 'rect', name: 'eye', x: Math.round(hx + e - 0.5), y: Math.round(hy - 1), w: 1, h: 1, color: 'outline' });
      k.add({ type: 'rect', name: 'nose', x: Math.round(hx - 1), y: Math.round(hy + 0.5), w: 2, h: 1, mat: pal.skin, shade: 'flat', band: 2 });
      // the underbite: a wide mouth line low in the jaw, two ivory tusks jutting up from it
      k.add({ type: 'rect', name: 'mouth', x: Math.round(hx - 4), y: Math.round(hy + 3.5), w: 8, h: 1, mat: pal.skin, shade: 'flat', band: 2 });
      for (const s of [-1, 1]) k.add({ type: 'rect', name: 'tusk', x: Math.round(hx + s * 3.5 - 0.5), y: Math.round(hy + 2), w: 1, h: 2, mat: pal.hair, shade: 'flat', band: 0 });
    };

    // ---- bowed thick legs on broad feet
    P.feet.forEach((dy, i) => {
      const s = i ? 1 : -1, lift = dy < 0 ? -2 : 0, fwd = dy > 0 ? 1 : 0;
      const hip = [k.baseCx + s * 6, 58], knee = [k.baseCx + s * 9, 67 + lift / 2], ankle = [k.baseCx + s * (7 + fwd), 74 + lift];
      k.add({ type: 'tube', name: 'leg', underlay: true, mat: pal.skin, shade: 'cyl', pts: [hip, knee, ankle], w: 9.6, w1: 6 });
      k.add({ type: 'ellipse', name: 'foot', underlay: true, cx: ankle[0] + s * 1.2, cy: 76 + lift, rx: 4.8, ry: 2.2, mat: pal.skin, shade: 'sphere' });
    });
    // ---- hide loincloth, ragged at the hem
    k.add({ type: 'path', name: 'loincloth', underlay: true, mat: pal.leather, shade: 'normal', round: 2, d: smooth([[cx - 9, 55 + up], [cx + 9, 55 + up], [cx + 8, 64], [cx + 4, 66], [cx + 1, 70], [cx - 2, 66], [cx - 6, 67], [cx - 8.5, 63]]) });
    if (back) head();
    // ---- the pear torso: hunched trapezius humps, sloping heavy shoulders, sides widening into the gut
    k.add({ type: 'path', name: 'body', underlay: true, mat: pal.skin, shade: 'normal', round: 4, d: smooth([
      [cx, 29 + up], [cx + 6, 27.5 + up], [cx + 12, 33 + up], [cx + 15.5, 40 + up], [cx + 14, 47 + up], [cx + 13, 53 + up], [cx + 10, 59 + up],
      [cx, 60 + up], [cx - 10, 59 + up], [cx - 13, 53 + up], [cx - 14, 47 + up], [cx - 15.5, 40 + up], [cx - 12, 33 + up], [cx - 6, 27.5 + up]]) });
    if (!back) {
      // the pot belly hanging over the loincloth's belt, a sagging chest line above it
      k.add({ type: 'ellipse', name: 'belly', underlay: true, cx: cx - 0.5, cy: 54 + up, rx: 10.5, ry: 8.5, mat: pal.skin, shade: 'sphere' });
      k.add({ type: 'rect', name: 'navel', x: Math.round(cx - 1), y: Math.round(55 + up), w: 1, h: 1, mat: pal.skin, shade: 'flat', band: 2 });
      head();
      offArm(); clubArm();
    } else {
      // from behind: the spine's groove between the humps
      k.add({ type: 'rect', name: 'spine', x: Math.round(cx), y: Math.round(37 + up), w: 1, h: 8, mat: pal.skin, shade: 'flat', band: 2 });
      clubArm(); offArm();
    }
  }, { height: H });
}

// head and the club fist follow the drawing; eyes and mouth for the finish's face (front only); ground from the rig
export const anchors = ctx => {
  const base = bipedAnchors(ctx, { height: H, headDy: 4, eyes: 1.4, hand: L => [L.L + L.X(1), L.waist + L.Y(1)] });
  const Lo = bipedLayout(ctx, H), A = armsOf(ctx), up = Lo.shoulder - (Lo.foot - Lo.Y(21)), back = Lo.back;
  const flip = ctx.facing === 'e' || ctx.facing === 'n', fx = x => { const p = Math.round(x); return flip ? Lo.w - 1 - p : p; };
  const t = back ? 0 : -2, hx = Lo.cx + t, hy = 31 + up;
  const out = { ...base, head: [fx(hx), Math.round(hy - 6)], hand: [fx(Lo.cx + A.f[0]), Math.round(A.f[1] + up)] };
  delete out.eye; delete out.eye2; delete out.mouth;
  if (!back) { out.eye = [fx(hx - 3), Math.round(hy - 1)]; out.eye2 = [fx(hx + 2), Math.round(hy - 1)]; out.mouth = [fx(hx), Math.round(hy + 3)]; }
  return out;
};
