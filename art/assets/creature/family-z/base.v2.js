// family-z base.v2 (r2, from base.v1) — ONE change: the posture. The upper body (torso, rags, shoulders and arms) is
// hunched forward ~18 degrees about the waist, and the head is dropped 2 px onto the left shoulder (the viewer's
// right) and tilted off-axis, instead of v1's upright, tidy villager stance. The head and arms are drawn here (copied
// from art/lib/beast.v1.js's biped kit) so they can follow the hunch; legs, boots and layout still come from the rig.
// v1: ghouls and zombies (glyph z, 1.7 m): a shambling corpse on the biped rig: head lolled to one side, sunken eyes,
// torn rags to the knee, one arm reaching forward with clawed fingers, the other hanging, knees bent. The flesh is the
// recoloured ramp (recolour: skin).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-z', pass: 'r2', notes: 'hunched forward about the waist, head dropped 2px onto a shoulder and tilted', mirror: false, recolour: 'skin' };
const H = 1.7, HUNCH = -18, LOLL = 28;
const rotP = ([x, y], [ox, oy], deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [ox + (x - ox) * c - (y - oy) * s, oy + (x - ox) * s + (y - oy) * c];
};
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R, P, back, smooth } = k, piv = [cx, waist], h = p => rotP(p, piv, HUNCH);
    const node = (name, mat, side) => ({ type: 'path', name, underlay: true, mat, shade: 'normal', round: X(2), d: k.sym(side) });
    const arm = (side, hx, hy, claws) => {
      const [sx, sy] = h([cx + side * X(5), shoulder + Y(1.2)]), ex = (sx + hx) / 2 + side * X(1.5), ey = (sy + hy) / 2 + Y(0.5), r = X(1.2);
      const kids = [
        { type: 'capsule', name: 'upper-arm', underlay: true, mat: pal.skin, shade: 'cyl', a: [sx, sy], b: [ex, ey], r, r1: r * 0.9 },
        { type: 'capsule', name: 'forearm', underlay: true, mat: pal.skin, shade: 'cyl', a: [ex, ey], b: [hx, hy], r: r * 0.9, r1: r * 0.8 },
        { type: 'circle', name: 'hand', cx: hx, cy: hy, r: X(1.1), mat: pal.skin, shade: 'sphere' },
      ];
      if (claws) for (const d of [-1, 0, 1]) kids.push({ type: 'capsule', name: 'claw', a: [hx, hy], b: [hx - X(2), hy + Y(d * 1.2)], r: X(0.45), mat: pal.skin, shade: 'flat', band: 0 });
      return { type: 'group', name: side < 0 ? 'main-hand' : 'off-hand', rotate: side < 0 ? P.main : P.off, origin: [sx, sy], children: kids };
    };
    // the head: placed on the hunched neck, dropped 2 px toward the left shoulder (viewer's right) and tilted off-axis
    const hc0 = h([cx, headY + Y(1.5)]), hc = [hc0[0] + X(1.6), hc0[1] + 2], y = hc[1], hx = hc[0];
    const wd = X(3.1), cr = Y(4.2), jw = X(1.8), ch = Y(4.4), pt = 0.2;
    const head = [{ type: 'path', name: 'head', underlay: true, mat: pal.skin, shade: 'sphere', d: smooth([[hx, y - cr], [hx + wd, y - cr * 0.85], [hx + wd * 0.97, y + Y(1)], [hx + jw, y + ch * 0.85], [hx + jw * (1 - pt) * 0.6, y + ch], [hx - jw * (1 - pt) * 0.6, y + ch], [hx - jw, y + ch * 0.85], [hx - wd * 0.97, y + Y(1)], [hx - wd, y - cr * 0.85]]) }];
    if (back) head.push({ type: 'path', name: 'back-hair', mat: pal.hair, shade: 'sphere', d: smooth([[hx, y - cr], [hx + wd, y - cr * 0.85], [hx + wd * 0.97, y + Y(1)], [hx + jw, y + ch * 0.7], [hx - jw, y + ch * 0.7], [hx - wd * 0.97, y + Y(1)], [hx - wd, y - cr * 0.85]]) });
    else {
      for (const e of [-X(1.7), X(1.7)]) head.push({ type: 'rect', name: 'eye', x: Math.round(hx + e + k.turn), y: Math.round(y), w: 1, h: 1, color: 'accent.0' });
      head.push({ type: 'rect', name: 'nose', x: Math.round(hx + k.turn), y: Math.round(y + Y(1.5)), w: 1, h: 1, mat: pal.skin, shade: 'flat', band: 2 });
      const hy0 = y - Y(1.5);
      head.push({ type: 'path', name: 'lank-hair', mat: pal.hair, shade: 'flat', band: 1, d: smooth([[hx - X(3.4), hy0 + Y(3)], [hx - X(3.2), hy0 - Y(3)], [hx + X(1), hy0 - Y(3.2)], [hx + X(3.4), hy0 - Y(1)], [hx + X(1), hy0 - Y(1.6)], [hx - X(2), hy0 - Y(1)]]) });
    }
    const headG = { type: 'group', name: 'lolled-head', rotate: LOLL, origin: [hx, y + ch], children: head };
    const torso = { type: 'group', name: 'hunched-torso', rotate: HUNCH, origin: piv, children: [
      node('body', pal.skin, [[0, shoulder - Y(0.5)], [4.6, shoulder + Y(0.5)], [4, waist], [0, waist]]),
      node('rags', pal.leather, [[0, shoulder + Y(2)], [4.8, shoulder + Y(2.5)], [5, waist + Y(2)], [4, knee], [2.5, knee - Y(2)], [1, knee + Y(1)], [0, knee - Y(1)]]),
    ] };
    const reach = h([L - X(2), shoulder + Y(1)]);
    const mainArm = arm(-1, reach[0], reach[1], true), offArm = arm(1, R - X(1.5), knee - Y(1), false);
    if (back) { k.add(mainArm); k.add(offArm); }
    k.legs(pal.skin, 2.6, 1.4); k.boots(pal.skin, 2, 1.2);
    k.add(torso);
    if (!back) k.add(offArm);
    k.add(headG);
    if (!back) k.add(mainArm);
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 3, eyes: 1.7, hand: L => [L.L - L.X(1), L.shoulder + L.Y(3)] });
