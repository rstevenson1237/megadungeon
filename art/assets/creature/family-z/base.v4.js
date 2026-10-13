// family-z base.v4 (x1, from base.v3) — ONE change (the blind reviewer's): the torso and head get their anatomy.
// The rags are now a torn shroud slung from the left shoulder (viewer's) across to the other hip with a ragged diagonal edge, so
// the bare chest shows on one side with two dark ribs on mid flesh and a dark wound; the head is a narrower egg cranium
// (higher crown, thin jaw) with a light brow row over two sunken dark sockets, a dark jaw line, and only a few lank
// strands instead of a hair cap; the back of the head is smaller, bare skin lit with a top highlight and a thin hair
// fringe low on the nape (no longer v3's oversized flat dark lump).
// family-z base.v3 (r3, from base.v2) — ONE change: the hunch made visible. v2's 18-degree turn about the waist read
// bolt upright, so the torso, rags and shoulders are now sheared 3 px forward (toward the heading) from the hips up,
// the head hangs 2 px forward of the torso's front and 2 px lower, under the shoulder line, and its eyes are two
// 1 px dark sockets instead of pale points (v2's face read as a blank pink blob).
// base.v2 (r2, from base.v1) — ONE change: the posture. The upper body (torso, rags, shoulders and arms) is
// hunched forward ~18 degrees about the waist, and the head is dropped 2 px onto the left shoulder (the viewer's
// right) and tilted off-axis, instead of v1's upright, tidy villager stance. The head and arms are drawn here (copied
// from art/lib/beast.v1.js's biped kit) so they can follow the hunch; legs, boots and layout still come from the rig.
// v1: ghouls and zombies (glyph z, 1.7 m): a shambling corpse on the biped rig: head lolled to one side, sunken eyes,
// torn rags to the knee, one arm reaching forward with clawed fingers, the other hanging, knees bent. The flesh is the
// recoloured ramp (recolour: skin).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-z', pass: 'x1', notes: 'torn diagonal shroud with bare ribs and wound, egg cranium with brow, sockets and jaw, small lit back of head; torso sheared 3px forward from the hips, head 2px forward and below the shoulder line, dark eye sockets; hunched forward about the waist, head dropped 2px onto a shoulder and tilted', mirror: false, recolour: 'skin' };
const H = 1.7, HUNCH = -18, LOLL = 28;
const rotP = ([x, y], [ox, oy], deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [ox + (x - ox) * c - (y - oy) * s, oy + (x - ox) * s + (y - oy) * c];
};
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R, P, back, smooth } = k, piv = [cx, waist], h = ([x, y]) => [x - 3 * Math.max(0, Math.min(1.2, (waist - y) / (waist - shoulder))), y];
    const shear = side => [...side.map(([dx, y]) => h([cx + X(dx), y])), ...side.slice().reverse().map(([dx, y]) => h([cx - X(dx), y]))];
    const node = (name, mat, side) => ({ type: 'path', name, underlay: true, mat, shade: 'normal', round: X(2), d: smooth(shear(side)) });
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
    // the head: hung 2 px forward of the sheared torso and 2 px lower, under the shoulder line, tilted off-axis
    const hc0 = h([cx, headY + Y(1.5)]), hc = [hc0[0] - 2, hc0[1] + 2 + Y(1)], y = hc[1], hx = hc[0];
    const wd = X(back ? 2.6 : 2.8), cr = Y(back ? 4 : 4.8), jw = X(1.4), ch = Y(back ? 3.6 : 4.2), pt = 0.3;
    const head = [{ type: 'path', name: 'head', underlay: true, mat: pal.skin, shade: 'sphere', d: smooth([[hx, y - cr], [hx + wd, y - cr * 0.85], [hx + wd * 0.97, y + Y(1)], [hx + jw, y + ch * 0.85], [hx + jw * (1 - pt) * 0.6, y + ch], [hx - jw * (1 - pt) * 0.6, y + ch], [hx - jw, y + ch * 0.85], [hx - wd * 0.97, y + Y(1)], [hx - wd, y - cr * 0.85]]) }];
    if (back) {
      // bare scalp lit on top, a thin hair fringe low on the nape
      head.push({ type: 'ellipse', name: 'scalp-light', cx: hx - X(0.6), cy: y - cr * 0.62, rx: X(1.4), ry: Y(0.8), color: 'skin.0' });
      head.push({ type: 'path', name: 'nape-hair', mat: pal.hair, shade: 'flat', band: 1, d: smooth([[hx - wd * 0.9, y + Y(0.4)], [hx, y + Y(1.2)], [hx + wd * 0.9, y + Y(0.4)], [hx + jw, y + ch * 0.7], [hx - jw, y + ch * 0.7]]) });
    }
    else {
      // a light brow over the sockets, a dark jaw line, and a few lank strands down one side (the cranium stays bare)
      head.push({ type: 'rect', name: 'brow', x: Math.round(hx + k.turn - X(1.6)), y: Math.round(y - Y(2)), w: 4, h: 1, color: 'skin.0' });
      head.push({ type: 'rect', name: 'jaw', x: Math.round(hx + k.turn - X(0.8)), y: Math.round(y + Y(2.6)), w: 2, h: 1, color: 'skin.2' });
      head.push({ type: 'capsule', name: 'lank-hair', a: [hx + wd * 0.8, y - cr * 0.6], b: [hx + wd * 1.05, y + Y(2.5)], r: X(0.6), mat: pal.hair, shade: 'flat', band: 1 });
      head.push({ type: 'capsule', name: 'lank-hair', a: [hx - wd * 0.85, y - cr * 0.5], b: [hx - wd * 1.05, y + Y(1)], r: X(0.5), mat: pal.hair, shade: 'flat', band: 1 });
    }
    const headG = { type: 'group', name: 'lolled-head', rotate: LOLL, origin: [hx, y + ch], children: head };
    // two 1 px dark eye sockets, placed where the lolled head turns them (outside the group so they stay whole pixels)
    const fc = rotP([hx + k.turn, y - 0.6], [hx, y + ch], LOLL); // the face's centre on the lolled head
    const sockets = back ? [] : [[-0.6, 0], [1.6, 0]].flatMap(([dx, dy]) => [
      { type: 'rect', name: 'socket', x: Math.round(fc[0] + dx - 0.5), y: Math.round(fc[1] - 0.5) + dy + 1, w: 1, h: 1, color: 'skin.2' },
      { type: 'rect', name: 'eye', x: Math.round(fc[0] + dx - 0.5), y: Math.round(fc[1] - 0.5) + dy, w: 1, h: 1, color: 'outline' }]);
    const torso = { type: 'group', name: 'hunched-torso', children: [
      { ...node('body', pal.skin, [[0, shoulder - Y(0.5)], [4.6, shoulder + Y(0.5)], [4, waist], [0, waist]]), shade: 'flat', band: 1 }, // mid flesh, so the dark ribs read
      // a torn shroud slung from one shoulder to the other hip: a ragged diagonal top edge, a tattered hem
      { type: 'path', name: 'rags', underlay: true, mat: pal.leather, shade: 'normal', round: X(1.5), d: smooth([
        h([cx - X(4.8), shoulder + Y(2)]), h([cx - X(2.4), shoulder + Y(3.4)]), h([cx - X(0.6), shoulder + Y(6)]), h([cx + X(1), shoulder + Y(6.6)]), h([cx + X(2.6), waist + Y(0.6)]), h([cx + X(4.4), waist + Y(1.4)]),
        h([cx + X(4.8), waist + Y(2)]), [cx + X(4), knee - Y(0.5)], [cx + X(2.6), knee - Y(2)], [cx + X(1.2), knee + Y(0.8)], [cx - X(0.2), knee - Y(1.6)], [cx - X(1.8), knee + Y(1)], [cx - X(3), knee - Y(1.4)], [cx - X(4.2), knee],
        h([cx - X(5), waist + Y(1)]), h([cx - X(5.2), shoulder + Y(3)])]) },
      // bare chest: two dark ribs and a wound
      ...(back ? [] : [[0.4, 2.2, 3], [0.8, 4.4, 2]].map(([dx, dy, w]) => { const p = h([cx + X(dx), shoulder + Y(dy)]); return { type: 'rect', name: 'rib', x: Math.round(p[0]), y: Math.round(p[1]), w, h: 1, color: 'skin.2' }; })),
      ...(back ? [] : [(p => ({ type: 'rect', name: 'wound', x: Math.round(p[0]), y: Math.round(p[1]), w: 1, h: 1, color: 'outline' }))(h([cx + X(2.6), shoulder + Y(5.6)]))]),
    ] };
    const reach = h([L - X(2), shoulder + Y(1)]);
    const mainArm = arm(-1, reach[0], reach[1], true), offArm = arm(1, R - X(1.5), knee - Y(1), false);
    if (back) { k.add(mainArm); k.add(offArm); }
    k.legs(pal.skin, 2.6, 1.4); k.boots(pal.skin, 2, 1.2);
    k.add(torso);
    if (!back) k.add(offArm);
    if (!back) k.add(mainArm); // the lowered head now hangs in front of the reaching arm's shoulder
    k.add(headG);
    sockets.forEach(n => k.add(n));
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 3, eyes: 1.7, hand: L => [L.L - L.X(1), L.shoulder + L.Y(3)] });
