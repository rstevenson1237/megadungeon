// family-t-cap base.v4 (x1, from base.v3) — the blind reviewer's change: size, head and arms. The troll is drawn on a
// 3.4 m rig so the stooped figure stands about 48 px (3 m at full height, the size table); the head is rebuilt as a
// forward-jutting egg carried ahead of and above the shoulder line (no longer sunk into them), with the brow ridge,
// sunken eyes, hooked nose, underbite and tusks, and a mane crown with strands at its sides seen from the front too, so
// s/e and n/w are one creature; the arms taper from a thick upper arm to a thin wrist, bend at a thrown-out elbow and end
// in big clawed hands.
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
export const meta = { brief: 'family-t-cap', pass: 'x1', notes: 'taller (3.4 m rig), forward egg head with mane from the front, tapered bent arms, big hands; long low head: brow ridge, hooked nose, underbite tusks; ragged mane strands from behind', mirror: false, recolour: 'grass' };
const H = 3.4;
const FX = -2.4, HX = 2.2, HY = 1.6; // the shoulders' lead (probe units) and the head's lead and lift from the shoulder line
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
    // the arms hang from the forward shoulders, tapering to the wrist, elbows thrown out, big clawed hands at the knees
    for (const side of [-1, 1]) {
      const draw = () => {
        const ax = sx + side * X(5.4), ay = sy + Y(1), hxx = cx + X(FX * 0.4) + side * X(7.6), hyy = knee + Y(1.5);
        const ex = (ax + hxx) / 2 + side * X(3.4), ey = (ay + hyy) / 2 - Y(1.5);
        k.add({ type: 'capsule', name: 'upper-arm', underlay: true, mat: c, shade: 'cyl', a: [ax, ay], b: [ex, ey], r: X(2), r1: X(1.4) });
        k.add({ type: 'capsule', name: 'forearm', underlay: true, mat: c, shade: 'cyl', a: [ex, ey], b: [hxx, hyy], r: X(1.4), r1: X(0.9) });
        k.add({ type: 'ellipse', name: 'hand', cx: hxx, cy: hyy + Y(0.6), rx: X(1.9), ry: X(2.1), mat: c, shade: 'sphere', underlay: true });
        for (const d of [-1.2, 0, 1.2]) k.add({ type: 'capsule', name: 'claw', a: [hxx + X(d), hyy + Y(1.8)], b: [hxx + X(d * 1.3), hyy + Y(3.4)], r: X(0.4), mat: pal.cloth, shade: 'flat', band: 0 });
      };
      side < 0 ? k.main(draw) : k.off(draw);
    }
    // the head: an egg thrust forward of the shoulders and above their line, jaw low
    const hx = sx - X(HX), hy2 = sy - Y(HY);
    const t = back ? 0 : k.turn;
    const egg = [[0, -4.6], [3.4, -3.6], [4.2, 0.2], [3.4, 3], [1.6, 4.6], [-1.6, 4.6], [-3.4, 3], [-4.2, 0.2], [-3.4, -3.6]];
    k.add({ type: 'path', name: 'head', underlay: true, mat: c, shade: 'sphere', d: k.smooth(egg.map(([x, y]) => [hx + X(x), hy2 + Y(y)])) });
    const len = [4.4, 6.2, 3.6, 5.6, 4, 6.6, 3.8];
    if (back) {
      // ragged mane strands of uneven length hanging from the crown
      k.add({ type: 'path', name: 'mane-crown', mat: pal.hair, shade: 'sphere', d: k.smooth([[hx, hy2 - Y(4.8)], [hx + X(3.6), hy2 - Y(3.8)], [hx + X(4.2), hy2 - Y(0.6)], [hx - X(4.2), hy2 - Y(0.6)], [hx - X(3.6), hy2 - Y(3.8)]]) });
      for (let i = -3; i <= 3; i++) k.add({ type: 'tube', name: 'mane', underlay: true, mat: pal.hair, shade: 'cyl', pts: [[hx + X(i * 1.2), hy2 - Y(3.6) + Y(Math.abs(i) * 0.4)], [hx + X(i * 1.4), hy2 + Y(0.75)], [hx + X(i * 1.6 + (i % 2 ? 0.5 : -0.5)), hy2 + Y(len[i + 3] * 1.1)]], w: X(1.5), w1: X(0.38) });
    } else {
      const F = (pts) => k.smooth(pts.map(([x, y]) => [hx + t + X(x), hy2 + Y(y)]));
      // the mane from the front: a crown cap over the skull and strands hanging past the cheeks
      k.add({ type: 'path', name: 'mane-crown', mat: pal.hair, shade: 'sphere', d: F([[0, -4.9], [3.6, -3.9], [4.3, -1.2], [2, -2.6], [0, -2.9], [-2, -2.6], [-4.3, -1.2], [-3.6, -3.9]]) });
      for (const [x0, l] of [[-3.8, 6.2], [-2.8, 4], [2.8, 4.4], [3.8, 6.6]]) k.add({ type: 'tube', name: 'mane', underlay: true, mat: pal.hair, shade: 'cyl', pts: [[hx + t + X(x0), hy2 - Y(2.8)], [hx + t + X(x0 * 1.2), hy2 + Y(0.5)], [hx + t + X(x0 * 1.25), hy2 + Y(l)]], w: X(1.2), w1: X(0.35) });
      // the heavy brow ridge (light step) over sunken sockets (dark step) with the eyes deep in them
      k.add({ type: 'path', name: 'socket', mat: c, shade: 'flat', band: 2, d: F([[-2.8, -1], [2.8, -1], [2.4, 0.9], [-2.4, 0.9]]) });
      k.add({ type: 'path', name: 'brow', mat: c, shade: 'flat', band: 0, d: F([[-3.6, -1.4], [-1.6, -2.6], [0, -2], [1.6, -2.6], [3.6, -1.4], [1.6, -0.6], [0, -1], [-1.6, -0.6]]) });
      for (const e of [-1.5, 1.5]) k.add({ type: 'rect', name: 'eye', x: Math.round(hx + X(e) + t), y: Math.round(hy2), w: 2, h: 1, color: 'accent.0' });
      // the underbite: a lower jaw thrust out, two tusks rising from it
      k.add({ type: 'ellipse', name: 'jaw', cx: hx + t, cy: hy2 + Y(3.4), rx: X(3.4), ry: Y(1.6), mat: c, shade: 'flat', band: 1 });
      k.add({ type: 'rect', name: 'mouth', x: Math.round(hx + t - X(1.8)), y: Math.round(hy2 + Y(2.6)), w: Math.round(X(3.6)), h: 1, color: 'outline' });
      for (const e of [-2.2, 2.2]) k.add({ type: 'path', name: 'tusk', mat: pal.cloth, shade: 'flat', band: 0, d: F([[e - 0.7, 3.2], [e + 0.7, 3.2], [e + (e > 0 ? 0.5 : -0.5), 0.6]]) });
      // the hooked nose, hanging from the brow onto the jaw
      k.add({ type: 'path', name: 'nose', mat: c, shade: 'flat', band: 1, d: F([[-0.6, -1.1], [0.8, -0.8], [1, 2.4], [0.3, 4.4], [-1.1, 4], [-1, 1.8]]) });
    }
  }, { height: H });
}
// the head and face anchors follow the head forward (toward the heading: screen left in s/w, right in e/n)
export const anchors = ctx => {
  const a = bipedAnchors(ctx, { height: H, headDy: 5.5 + 2 - HY, eyes: 1.5, hand: L => [L.cx + L.X(FX * 0.4) - L.X(7.6), L.knee + L.Y(1.5)] });
  const u = (H * 16) / 28.8, flip = ctx.facing === 'e' || ctx.facing === 'n', dx = Math.round((FX - HX) * u) * (flip ? -1 : 1);
  for (const n of ['head', 'eye', 'eye2', 'mouth']) if (a[n]) a[n] = [a[n][0] + dx, a[n][1]];
  return a;
};
