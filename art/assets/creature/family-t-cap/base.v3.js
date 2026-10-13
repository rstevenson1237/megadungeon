// family-t-cap base.v3 (r3) — from base.v2, ONE change (review: the head was a smooth featureless ball and the back
// views showed a dark olive oval disc, so it read as a diving helmet): the head. It is redrawn as a long low head under
// a heavy brow ridge (light step) with the eyes sunk beneath it, a jutting underbite jaw with two tusks rising from it,
// and a hooked nose hanging from the brow past the jaw; the mane disc behind the head is gone, and from the back
// (n/w) ragged mane strands of uneven length hang from the crown over the head instead of the oval.
//
// family-t-cap base.v2 (r2) — from base.v1, ONE change (review: read as a stiff robot or diver — straight tube limbs,
// upright posture, helmet-like head, no stoop): the troll stoops. The torso leans forward from the hips, its shoulders
// about 4 px ahead (toward the heading, the viewer's left) under a rounded hump of back; the head is thrust low and
// ahead of the shoulders, its crown below the hump; the arms hang from the forward shoulders, bent at an elbow
// thrown out and back, with the hands down at the knees. The head and arms are drawn here (the rig's head and arm
// are tied to the upright shoulder line); legs, rag, warts, mane, nose and claws are base.v1's.
//
// base.v1 (r1) — trolls (glyph T, 3 m): a troll on the biped rig (art/lib/beast.v1.js) at the large
// frame: stooped, with very long arms whose knuckles near the floor, a long hooked nose and a lank mane, warty hide,
// a shallow chest, a rag at the hips and bare clawed feet. The hide is the recoloured ramp (recolour: grass).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-t-cap', pass: 'r3', notes: 'long low head: brow ridge, hooked nose, underbite tusks; ragged mane strands from behind', mirror: false, recolour: 'grass' };
const H = 3;
const FX = -2.4, HEAD_DY = 4.2; // the shoulders' lead (probe units, ~4 px) and how far the head drops
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, back } = k, c = pal.grass, dn = Y(2);
    const sx = cx + X(FX), sy = shoulder + dn; // the stooped shoulder line's centre
    k.legs(c, 2.8, 1.8); k.boots(c, 2.6, 1.2);
    k.shape('rag', pal.leather, [[0, waist], [4.6, waist], [4, knee - Y(1.5)], [2, knee - Y(3)], [0, knee - Y(1)]]);
    // the stooped torso: hips over the feet, shoulders forward, a hump of back rising behind the head
    k.add({ type: 'path', name: 'body', underlay: true, mat: c, shade: 'normal', round: X(2), d: k.smooth([
      [cx - X(4.4), waist + Y(0.5)], [cx + X(4.4), waist + Y(0.5)], [cx + X(4.8), sy + Y(3.5)], [sx + X(6.4), sy + Y(0.5)],
      [sx + X(4.5), sy - Y(1.8)], [sx + X(1), sy - Y(2.6)], [sx - X(3.5), sy - Y(1.8)], [sx - X(6.2), sy + Y(0.8)], [cx - X(5.6), sy + Y(3.8)]]) });
    for (const [dx, dy] of [[-2.6, 2.4], [1.8, 4.4], [-3.8, 6.6], [0.4, 8.2]]) k.add({ type: 'circle', name: 'wart', cx: cx + X(dx) + X(FX) * (1 - dy / 9), cy: sy + Y(dy), r: X(0.6), mat: c, shade: 'flat', band: 0 });
    // the head: low and ahead of the shoulders (the rig's egg head, drawn at its own centre)
    const hx = sx - X(1.2), hy = headY + dn + Y(1 + HEAD_DY), wd = X(3), cr = Y(4), jw = X(1.6), ch = Y(4.6), pt = 0.5;
    const hy2 = hy - Y(1);
    const t = back ? 0 : k.turn;
    // a few lank strands hang behind the head's sides from the front
    if (!back) for (const s of [-1, 1]) k.add({ type: 'tube', name: 'mane', underlay: true, mat: pal.hair, shade: 'cyl', pts: [[hx + s * X(3.25), hy2 - Y(3)], [hx + s * X(5.5), hy2 + Y(0.62)], [hx + s * X(5.75), hy2 + Y(5.25)]], w: X(1.75), w1: X(0.5) });
    // the long low head: wide and flat-crowned, the jaw broad
    k.add({ type: 'path', name: 'head', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[hx, hy2 - Y(4)], [hx + X(4.25), hy2 - Y(3.25)], [hx + X(5.25), hy2 + Y(0.5)], [hx + X(4.5), hy2 + Y(3.25)], [hx + X(1.88), hy2 + Y(4.5)], [hx - X(1.88), hy2 + Y(4.5)], [hx - X(4.5), hy2 + Y(3.25)], [hx - X(5.25), hy2 + Y(0.5)], [hx - X(4.25), hy2 - Y(3.25)]]) });
    if (back) {
      // ragged mane strands of uneven length hanging from the crown
      const len = [4.4, 6.2, 3.6, 5.6, 4, 6.6, 3.8];
      k.add({ type: 'path', name: 'mane-crown', mat: pal.hair, shade: 'sphere', d: k.smooth([[hx, hy2 - Y(4.25)], [hx + X(4.25), hy2 - Y(3.25)], [hx + X(4.75), hy2 - Y(0.75)], [hx - X(4.75), hy2 - Y(0.75)], [hx - X(4.25), hy2 - Y(3.25)]]) });
      for (let i = -3; i <= 3; i++) k.add({ type: 'tube', name: 'mane', underlay: true, mat: pal.hair, shade: 'cyl', pts: [[hx + X(i * 1.4), hy2 - Y(3.25) + Y(Math.abs(i) * 0.4)], [hx + X(i * 1.6), hy2 + Y(0.75)], [hx + X(i * 1.8 + (i % 2 ? 0.5 : -0.5)), hy2 + Y(len[i + 3] * 1.25)]], w: X(1.62), w1: X(0.38) });
    } else {
      const F = (pts) => k.smooth(pts.map(([x, y]) => [hx + t + X(x), hy2 + Y(y)]));
      // the heavy brow ridge (light step) over sunken sockets (dark step) with the eyes deep in them
      k.add({ type: 'path', name: 'socket', mat: c, shade: 'flat', band: 2, d: F([[-3.6, -1], [3.6, -1], [3.1, 1], [-3.1, 1]]) });
      k.add({ type: 'path', name: 'brow', mat: c, shade: 'flat', band: 0, d: F([[-4.8, -1.4], [-2, -3.1], [0, -2.3], [2, -3.1], [4.8, -1.4], [2, -0.7], [0, -1.1], [-2, -0.7]]) });
      for (const e of [-1.7, 1.7]) k.add({ type: 'rect', name: 'eye', x: Math.round(hx + X(e) + t), y: Math.round(hy2), w: 1, h: 1, color: 'accent.0' });
      // the underbite: a lower jaw thrust out wider than the face, two tusks rising from it
      k.add({ type: 'ellipse', name: 'jaw', underlay: true, cx: hx + t, cy: hy2 + Y(3.6), rx: X(4.4), ry: Y(1.8), mat: c, shade: 'sphere' });
      for (const e of [-2.9, 2.9]) k.add({ type: 'path', name: 'tusk', underlay: true, mat: pal.cloth, shade: 'flat', band: 0, d: F([[e - 0.8, 3.2], [e + 0.8, 3.2], [e + (e > 0 ? 0.7 : -0.7), 0.2]]) });
      // the hooked nose, hanging from the brow past the jaw
      k.add({ type: 'path', name: 'nose', underlay: true, mat: c, shade: 'flat', band: 1, d: F([[-0.7, -1.2], [0.9, -0.9], [1.1, 3], [0.3, 6.2], [-1.3, 5.6], [-1.1, 2.4]]) });
    }
    // the arms hang from the forward shoulders, elbows out and back, hands at the knees
    for (const side of [-1, 1]) {
      const draw = () => {
        const ax = sx + side * X(5.6), ay = sy + Y(1), hxx = cx + X(FX * 0.4) + side * X(7.6), hyy = knee + Y(1.5);
        const ex = (ax + hxx) / 2 + side * X(2.6), ey = (ay + hyy) / 2 - Y(0.5), r = X(1.6);
        k.add({ type: 'capsule', name: 'upper-arm', underlay: true, mat: c, shade: 'cyl', a: [ax, ay], b: [ex, ey], r, r1: r * 0.85 });
        k.add({ type: 'capsule', name: 'forearm', underlay: true, mat: c, shade: 'cyl', a: [ex, ey], b: [hxx, hyy], r: r * 0.9, r1: r * 0.75 });
        k.add({ type: 'circle', name: 'hand', cx: hxx, cy: hyy, r: X(1.6), mat: c, shade: 'sphere' });
        for (const d of [-1, 0, 1]) k.add({ type: 'capsule', name: 'claw', a: [hxx, hyy + Y(0.5)], b: [hxx + X(d), hyy + Y(2.5)], r: X(0.45), mat: pal.cloth, shade: 'flat', band: 0 });
      };
      side < 0 ? k.main(draw) : k.off(draw);
    }
  }, { height: H });
}
// the head and face anchors follow the head forward (toward the heading: screen left in s/w, right in e/n)
export const anchors = ctx => {
  const a = bipedAnchors(ctx, { height: H, headDy: 3 + HEAD_DY, eyes: 1.5, hand: L => [L.cx + L.X(FX * 0.4) - L.X(7.6), L.knee + L.Y(1.5)] });
  const u = (H * 16) / 28.8, flip = ctx.facing === 'e' || ctx.facing === 'n', dx = Math.round((FX - 1.2) * u) * (flip ? -1 : 1);
  for (const n of ['head', 'eye', 'eye2', 'mouth']) if (a[n]) a[n] = [a[n][0] + dx, a[n][1]];
  return a;
};
