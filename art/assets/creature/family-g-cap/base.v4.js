// family-g-cap base.v4 (x1, from base.v3) — the blind reviewer's point: v3 read as a helmeted dwarf or executioner
// (a bullet head with a visor-like brow band, short legs, a boxy tunic) and the maul's head touched the frame's top.
// The body is redrawn in the asset on the biped layout with giant proportions: a small bare egg head (a heavy brow
// ridge, small eyes, a long beard below the jaw, shaggy tufts at the sides, no band) on a short thick neck; broad
// rounded bare shoulders over a sleeveless tunic that swells at the ribs, nips in at the rope belt and ends in a short
// ragged skirt; long legs (half the height) with leather-wrapped calves; long arms bent at the elbow. The maul is held
// low in the right hand, its head by the foot, and is posed per frame so it never leaves the frame.
// family-g-cap base.v3 (r3) — barrel torso. base.v2 (r2) — tapered tunic, egg head. base.v1 (r1) — giants and titans
// (glyph G, 4.5 m, the tallest family) at the large frame. The tunic is the recoloured ramp (recolour: leather).
import { biped, bipedAnchors, bipedLayout } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-g-cap', pass: 'x1', notes: 'hill giant: long legs, small bald egg head with beard, broad bare shoulders, tunic, low maul', mirror: false, recolour: 'leather' };
const H = 4.5;

// Per state and frame, px from the body centre (x) and absolute y: maul arm elbow, fist, maul head; off arm elbow, fist.
const ARMS = {
  idle: [
    { e: [-17, 38], f: [-16, 50], m: [-21, 72], oe: [17, 38], of: [16, 50] },
    { e: [-17, 39], f: [-16, 51], m: [-21, 72], oe: [17, 39], of: [16, 51] },
  ],
  walk: [
    { e: [-17, 38], f: [-14, 49], m: [-18, 71], oe: [18, 37], of: [18, 48] },
    { e: [-17, 38], f: [-16, 50], m: [-21, 72], oe: [17, 38], of: [16, 50] },
    { e: [-18, 37], f: [-18, 48], m: [-24, 71], oe: [17, 38], of: [14, 49] },
    { e: [-17, 38], f: [-16, 50], m: [-21, 72], oe: [17, 38], of: [16, 50] },
  ],
  attack: [
    { e: [-19, 32], f: [-17, 20], m: [-21, 8], oe: [17, 36], of: [15, 46] },  // anticipation: maul raised high at the side
    { e: [-20, 34], f: [-21, 28], m: [-22, 11], oe: [18, 36], of: [17, 45] }, // swing: over and out
    { e: [-19, 38], f: [-18, 48], m: [-18, 70], oe: [18, 38], of: [19, 48] }, // contact: smashed down beside the feet
    { e: [-17, 39], f: [-17, 50], m: [-22, 72], oe: [17, 38], of: [16, 50] }, // recovery
  ],
};
const armsOf = ctx => { const a = ARMS[ctx.state] ?? ARMS.idle; return a[(ctx.logical ?? ctx.frame) % a.length]; };

export function render(ctx) {
  return biped(ctx, k => {
    const { pal, cx, foot, P, back, smooth } = k, A = armsOf(ctx);
    const up = Math.max(-1, k.shoulder - (foot - k.Y(21)));
    const t = back ? 0 : -2;
    const at = ([dx, y], dy = up) => [cx + dx, y + dy];
    const hx = cx + t, hy = 11 + up;

    const maulArm = () => {
      const sh = at([-13, 26]), e = at(A.e), f = at(A.f), m = [cx + A.m[0], A.m[1] + (A.m[1] > 60 ? 0 : up)];
      const dx = m[0] - f[0], dy = m[1] - f[1], len = Math.hypot(dx, dy), n = [dx / len, dy / len], ang = (Math.atan2(dy, dx) * 180) / Math.PI;
      k.add({ type: 'capsule', name: 'haft', underlay: true, mat: pal.hair, shade: 'cyl', a: [f[0] - n[0] * 3, f[1] - n[1] * 3], b: m, r: 1.3 });
      k.add({ type: 'rect', name: 'maul', underlay: true, x: m[0] - 3.5, y: m[1] - 5.5, w: 7, h: 11, r: 1.6, mat: pal.cloth, shade: 'normal', round: 2, rotate: ang, origin: m });
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: pal.skin, shade: 'cyl', pts: [sh, e, f], w: 6.6, w1: 4.8 });
      k.add({ type: 'ellipse', name: 'fist', underlay: true, cx: f[0], cy: f[1], rx: 3, ry: 2.8, mat: pal.skin, shade: 'sphere' });
    };
    const offArm = () => {
      const sh = at([13, 26]), e = at(A.oe), f = at(A.of);
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: pal.skin, shade: 'cyl', pts: [sh, e, f], w: 6.6, w1: 4.8 });
      k.add({ type: 'ellipse', name: 'fist', underlay: true, cx: f[0], cy: f[1], rx: 3, ry: 2.8, mat: pal.skin, shade: 'sphere' });
    };
    const head = () => {
      k.add({ type: 'capsule', name: 'neck', underlay: true, mat: pal.skin, shade: 'cyl', a: [cx, hy + 3], b: [cx, 21 + up], r: 4 });
      k.add({ type: 'path', name: 'head', underlay: true, mat: pal.skin, shade: 'sphere', d: smooth([[hx, hy - 8], [hx + 4.6, hy - 6], [hx + 5.6, hy - 1], [hx + 5, hy + 3], [hx + 3.4, hy + 5.8], [hx, hy + 6.6], [hx - 3.4, hy + 5.8], [hx - 5, hy + 3], [hx - 5.6, hy - 1], [hx - 4.6, hy - 6]]) });
      // shaggy hair tufts at the sides and the back of the skull; the crown stays bare
      for (const s of [-1, 1]) k.add({ type: 'path', name: 'hair', underlay: true, mat: pal.hair, shade: 'normal', round: 1, d: smooth([[hx + s * 5, hy - 3.4], [hx + s * 6.8, hy - 1.6], [hx + s * 6.6, hy + 1.6], [hx + s * 5.2, hy + 0.6]]) });
      if (back) {
        k.add({ type: 'path', name: 'back-hair', mat: pal.hair, shade: 'normal', round: 1.5, d: smooth([[hx - 5, hy - 2.4], [hx, hy - 3.4], [hx + 5, hy - 2.4], [hx + 5.4, hy + 3], [hx + 2, hy + 7.4], [hx - 2, hy + 7.4], [hx - 5.4, hy + 3]]) });
        return;
      }
      // the heavy brow ridge, lit on top, its shadow over small dark eyes; a broad nose
      k.add({ type: 'rect', name: 'brow-shadow', x: Math.round(hx - 3.5), y: Math.round(hy - 2), w: 7, h: 1, mat: pal.skin, shade: 'flat', band: 2 });
      for (const e of [-2, 2]) k.add({ type: 'rect', name: 'eye', x: Math.round(hx + e - 0.5), y: Math.round(hy - 1), w: 1, h: 1, color: 'outline' });
      k.add({ type: 'rect', name: 'nose', x: Math.round(hx - 0.5), y: Math.round(hy + 0.5), w: 2, h: 2, mat: pal.skin, shade: 'flat', band: 2 });
      // the beard below the jaw line: a long ragged wedge over the neck and the top of the chest
      k.add({ type: 'path', name: 'beard', underlay: true, mat: pal.hair, shade: 'normal', round: 1.5, d: smooth([[hx - 4.4, hy + 3.6], [hx, hy + 5.2], [hx + 4.4, hy + 3.6], [hx + 3.8, hy + 8.6], [hx + 1.4, hy + 12.5], [hx - 0.4, hy + 14], [hx - 2, hy + 12], [hx - 3.8, hy + 8.6]]) });
      k.add({ type: 'rect', name: 'mouth', x: Math.round(hx - 1.5), y: Math.round(hy + 3), w: 3, h: 1, mat: pal.skin, shade: 'flat', band: 2 });
    };

    if (back) { maulArm(); }
    // ---- long legs: bare thighs, leather-wrapped calves, heavy boots
    P.feet.forEach((dy, i) => {
      const s = i ? 1 : -1, lift = dy < 0 ? -2 : 0, fwd = dy > 0 ? 1 : 0;
      const hip = [k.baseCx + s * 5, 45], knee = [k.baseCx + s * 6, 60 + lift / 2], ankle = [k.baseCx + s * (5.5 + fwd), 74 + lift];
      k.add({ type: 'tube', name: 'leg', underlay: true, mat: pal.skin, shade: 'cyl', pts: [hip, knee, ankle], w: 8, w1: 5.6 });
      k.add({ type: 'tube', name: 'wrap', underlay: true, mat: pal.leather, shade: 'cyl', pts: [[knee[0], knee[1] + 2], ankle], w: 6.6, w1: 5.8 });
      for (let y = knee[1] + 4.5; y < ankle[1]; y += 3.5) k.add({ type: 'rect', name: 'wrap-line', x: Math.round((knee[0] + ankle[0]) / 2 - 2.5), y: Math.round(y), w: 5, h: 1, mat: pal.leather, shade: 'flat', band: 2 });
      k.add({ type: 'ellipse', name: 'boot', underlay: true, cx: ankle[0] + s * 0.8, cy: 76 + lift, rx: 4.2, ry: 2.2, mat: pal.leather, shade: 'sphere' });
    });
    if (back) head();
    // ---- broad bare shoulders, then the sleeveless tunic: swelling at the ribs, in at the belt, a short ragged skirt
    for (const s of [-1, 1]) k.add({ type: 'ellipse', name: 'shoulder', underlay: true, cx: cx + s * 13, cy: 26.5 + up, rx: 4.8, ry: 5, mat: pal.skin, shade: 'sphere' });
    k.add({ type: 'path', name: 'tunic', underlay: true, mat: pal.leather, shade: 'normal', round: 4, d: smooth([
      [cx, 22 + up], [cx + 7, 20.5 + up], [cx + 11, 25 + up], [cx + 12.6, 31 + up], [cx + 10.6, 38 + up], [cx + 9.6, 41 + up],
      [cx + 11.4, 49], [cx + 10, 53], [cx + 6, 51.5], [cx + 2, 54], [cx - 2, 52], [cx - 6, 54], [cx - 10, 52.5], [cx - 11.4, 49],
      [cx - 9.6, 41 + up], [cx - 10.6, 38 + up], [cx - 12.6, 31 + up], [cx - 11, 25 + up], [cx - 7, 20.5 + up]]) });
    k.front(() => k.add({ type: 'path', name: 'chest', mat: pal.skin, shade: 'flat', band: 1, d: smooth([[cx - 5.5, 21.5 + up], [cx + 5.5, 21.5 + up], [cx + 0.5, 31 + up]]) }));
    k.add({ type: 'capsule', name: 'rope', a: [cx - 9.8, 41 + up], b: [cx + 9.8, 41 + up], r: 1.3, mat: pal.hair, shade: 'cyl', axis: 'x' });
    if (back) offArm();
    else { head(); offArm(); maulArm(); }
  }, { height: H });
}

export const anchors = ctx => {
  const base = bipedAnchors(ctx, { height: H, headDy: 1, eyes: 1.5, hand: L => [L.cx - L.X(5), L.shoulder - L.Y(1.5)] });
  const Lo = bipedLayout(ctx, H), A = armsOf(ctx), up = Math.max(-1, Lo.shoulder - (Lo.foot - Lo.Y(21))), back = Lo.back;
  const flip = ctx.facing === 'e' || ctx.facing === 'n', fx = x => { const p = Math.round(x); return flip ? Lo.w - 1 - p : p; };
  const t = back ? 0 : -2, hx = Lo.cx + t, hy = 11 + up;
  const out = { ...base, head: [fx(hx), Math.round(hy - 4)], hand: [fx(Lo.cx + A.f[0]), Math.round(A.f[1] + up)] };
  delete out.eye; delete out.eye2; delete out.mouth;
  if (!back) { out.eye = [fx(hx - 2.5), Math.round(hy - 1)]; out.eye2 = [fx(hx + 1.5), Math.round(hy - 1)]; out.mouth = [fx(hx), Math.round(hy + 3)]; }
  return out;
};
