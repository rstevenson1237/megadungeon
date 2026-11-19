// boss-the-ninefold-eye base.v1 (r1) — SHAPE DRAFT (shape gate): silhouette and form only, flat materials, no texture,
// no decals, no finish. The Ninefold Eye, the unique boss of the eye tyrants (family-a-cap, glyph A, ochre, a slow
// caster), 6.3 m (~100 px) in a 96 x 128 frame. Built on the shared flyer rig (`ctx.lib.rigs.body('flyer')`): the rig
// gives the turn (yaw), the hover bob and the attack's lunge; every bone length is fixed for the asset.
// What makes it read as this boss and not the plain family orb:
//  - a colossal hovering orb (about 56 px across), slightly egg-shaped, one hide ramp (skin: the recolour ramp, so the
//    row's ochre stays dominant), set very high over its ground shadow;
//  - EIGHT long writhing eye-stalks that, with the great eye, make nine eyes: the side stalks sweep far out sideways
//    and the front ones rise high, so the crown fans the silhouette to ~90 px wide (the family has five short stalks);
//  - the signature: an oversized central eye under a heavy brooding lid, its iris the one bright accent (glow ramp);
//  - a wide fanged maw under it, and a ragged skirt of thick tapering tendrils hanging from the underside, flaring
//    out toward an uneven hem: mass below the orb, like a caster's robe.
// Attack: the stalks whip forward in an arc over the anticipation and swing frames, hold at the contact frame (frame 2,
// the longest) with the maw gaping and the great eye glaring, then recover; the rig lunges the orb forward.
// Facings: the body is a sphere seen from any yaw, so every part is placed on it in 3D and projected for the facing:
// the eye and maw slide toward the facing side and narrow in the three-quarter and profile views and are hidden from
// behind, while the crown of stalks keeps its shape. Colours are ramps and tokens only (R11).
export const meta = { brief: 'boss-the-ninefold-eye', pass: 'r1', notes: 'shape draft: colossal hovering orb, eight wide-fanned eye-stalks + great glaring eye (nine), fanged maw, ragged tendril skirt', recolour: 'skin' };

// stalks: azimuth around the orb (0 = the heading), how far out and up the tip reaches, and a writhe phase
const STALKS = [
  { az: -158, out: 13, up: 26, ph: 0.1 }, { az: -118, out: 20, up: 20, ph: 0.7 }, { az: -74, out: 25, up: 12, ph: 1.9 },
  { az: -32, out: 9, up: 30, ph: 2.6 }, { az: 32, out: 9, up: 29, ph: 3.4 }, { az: 74, out: 25, up: 13, ph: 4.1 },
  { az: 118, out: 20, up: 19, ph: 4.9 }, { az: 158, out: 13, up: 25, ph: 5.6 },
];
// tendrils under the orb: azimuth and length (uneven, so the hem is ragged)
const TENDRILS = [[-160, 15], [-125, 20], [-92, 16], [-60, 22], [-28, 15], [5, 19], [36, 14], [66, 21], [96, 16], [128, 19], [162, 14]];
const OPEN = { attack: [0.3, 0.6, 1, 0.3] }; // the attack's build: 1 at the held contact frame
const D = Math.PI / 180;

function layout(ctx) {
  const [w, h] = ctx.size, U = w / 96, ground = h - 2, tilt = 0.32;
  const rig = ctx.lib.rigs.body('flyer', ctx, { ground, height: Math.round(24 * U), tilt });
  const P = rig.pose(ctx.state, ctx.t), P0 = rig.pose('idle', 0), b = P.at('body', 0.5), b0 = P0.at('body', 0.5);
  const { sx, front } = rig;
  // the orb's centre: the rig's body point (bob, lunge) moved so the idle orb hangs at the same place in every facing
  const C = [b[0] + (w / 2 - b0[0]), b[1] + (Math.round(h * 0.58) - b0[1])];
  const R = 27 * U, frames = ctx.brief?.anims?.[ctx.state]?.frames ?? 4, f = ctx.frame % frames;
  const hit = OPEN[ctx.state]?.[f] ?? 0, walking = ctx.state === 'walk', phase = walking ? f / frames : 0;
  // the tendril hem trails down to the floor over the shadow, so the mass reads as standing on its cell
  // a point in the orb's frame: fwd along the heading, side to its right, up; screen point and depth (toward the viewer)
  const Q = (fw, sd, up) => [C[0] + fw * sx - sd * front, C[1] - up + tilt * (fw * front + sd * sx)];
  const depth = (fw, sd) => fw * front + sd * sx;
  const onSphere = (az, el, r = R) => [r * Math.cos(el * D) * Math.cos(az * D), r * Math.cos(el * D) * Math.sin(az * D), r * Math.sin(el * D)];
  const eye3 = onSphere(0, 8, R * 0.94), eye = Q(...eye3), showFace = front > -0.3;
  const squash = Math.max(0.45, 0.45 + 0.55 * Math.max(0, front));
  return { w, h, U, rig, P, sx, front, ground, tilt, C, R, hit, walking, phase, idleF: ctx.state === 'idle' ? f : 0, Q, depth, onSphere, eye, showFace, squash };
}

export function render(ctx) {
  const { pal } = ctx.dir, L = layout(ctx), s = ctx.lib.t2.scene(...ctx.size);
  const { U, C, R, Q, depth, onSphere, hit, phase, walking, squash, showFace, eye, front } = L, hide = pal.skin;
  const parts = [], add = (z, node) => parts.push({ z, node });
  const wig = i => (walking ? Math.sin(phase * Math.PI * 2 + i) * 2 : L.idleF * Math.sin(i) * 1.2) * U;

  // the orb itself, slightly wider than tall
  add(0, { type: 'ellipse', name: 'body', underlay: true, mat: hide, shade: 'sphere', cx: C[0], cy: C[1], rx: R * 1.04, ry: R * 0.96 });

  // the tendril skirt: thick at the root, tapering, flaring out toward a ragged hem, swaying as it moves
  TENDRILS.forEach(([az, len], i) => {
    const [f0, s0, u0] = onSphere(az, -52, R * 0.97), ca = Math.cos(az * D), sa = Math.sin(az * D), sway = wig(i + 3);
    const flare = (7 + len * 0.25) * U, ln = (len + 4) * U * (1 - 0.15 * hit);
    const a = Q(f0, s0, u0), m = Q(f0 + ca * flare * 0.4, s0 + sa * flare * 0.4, u0 - ln * 0.5), t = Q(f0 + ca * flare, s0 + sa * flare, u0 - ln);
    add(depth(f0, s0) * 0.01 - (depth(f0, s0) < 0 ? 1 : -1), { type: 'tube', name: 'tendril', underlay: true, mat: hide, shade: 'cyl', pts: [a, [m[0] + sway * 0.5, m[1]], [t[0] + sway, t[1]]], w: 8.5 * U, w1: 1.8 * U });
  });

  // eight eye-stalks: rooted on the upper half, a writhing S toward a tip far out and up; in the attack they whip forward
  STALKS.forEach(({ az, out, up, ph }, i) => {
    const [f0, s0, u0] = onSphere(az, 42, R * 0.9), ca = Math.cos(az * D), sa = Math.sin(az * D), wg = wig(ph);
    const whip = hit * 14 * U, o = out * U, v = up * U;
    const tip3 = [f0 + ca * o + whip, s0 + sa * o, u0 + v - hit * 6 * U], mid3 = [f0 + ca * o * 0.45 + whip * 0.35, s0 + sa * o * 0.45, u0 + v * 0.55];
    const a = Q(f0, s0, u0), m = Q(...mid3), t = Q(...tip3), z = depth(f0, s0) < 0 ? -2 + i * 0.01 : 2 + i * 0.01;
    const bend = (i % 2 ? 1 : -1) * 3 * U;
    add(z, { type: 'tube', name: 'stalk', underlay: true, mat: hide, shade: 'cyl', pts: [a, [m[0] + bend + wg, m[1]], [t[0] + wg, t[1]]], w: 4.4 * U, w1: 2.4 * U });
    const tz = depth(tip3[0], tip3[1]);
    add(z + 0.005, { type: 'circle', name: 'stalk-eye', underlay: true, mat: pal.cloth, shade: 'sphere', cx: t[0] + wg, cy: t[1], r: 3.6 * U });
    if (tz > -6 * U) add(z + 0.006, { type: 'circle', name: 'stalk-iris', mat: pal.glow, shade: 'flat', band: 1, cx: t[0] + wg + Math.sign(t[0] - C[0]) * 0.6 * U, cy: t[1] + 0.6 * U, r: 1.7 * U });
  });

  if (showFace) {
    // the great eye under its heavy brooding lid; the iris is the one bright accent
    const rx = 17 * U * squash, ry = 13 * U, ex = eye[0], ey = eye[1], ir = 8 * U, glare = 0.38 + 0.35 * hit;
    add(1, { type: 'ellipse', name: 'eye', underlay: true, mat: pal.cloth, shade: 'sphere', cx: ex, cy: ey, rx, ry });
    add(1.1, { type: 'ellipse', name: 'iris', mat: pal.glow, shade: 'sphere', cx: ex + (front < 0.9 ? Math.sign(L.sx) * 1.5 * U : 0), cy: ey + 0.5 * U, rx: ir * squash * (1 + 0.15 * hit), ry: ir * (1 + 0.15 * hit) });
    add(1.2, { type: 'ellipse', name: 'pupil', color: 'outline', cx: ex + (front < 0.9 ? Math.sign(L.sx) * 1.5 * U : 0), cy: ey + 0.5 * U, rx: Math.max(0.8, 1.4 * U * squash * (1 - 0.4 * hit)), ry: 5 * U });
    // the lid: hide over the eye's top, its edge slanting down toward the middle (a scowl), lower in the attack
    // a crescent hugging the eye: over the eye's top from corner to corner, its lower edge dipping to the middle
    const lx = rx + 2.5 * U, cy0 = ey - ry * 0.15, edge = ey - ry + ry * 2 * glare;
    add(1.3, { type: 'path', name: 'lid', underlay: true, mat: hide, shade: 'normal', round: 2 * U, d: `M${ex - lx} ${cy0} Q${ex - lx} ${ey - ry - 3.5 * U} ${ex} ${ey - ry - 3.5 * U} Q${ex + lx} ${ey - ry - 3.5 * U} ${ex + lx} ${cy0} Q${ex + lx * 0.5} ${edge - 2 * U} ${ex} ${edge + 1.5 * U} Q${ex - lx * 0.5} ${edge - 2 * U} ${ex - lx} ${cy0} Z` });
    // the maw: a wide dark crescent across the lower orb, gaping in the attack, with ragged fangs
    const [mf, ms, mu] = onSphere(0, -32, R * 0.93), mc = Q(mf, ms, mu), hw = 20 * U * squash * (1 + 0.15 * hit);
    const y0 = mc[1] - 3 * U, y1 = mc[1] + (5 + 7 * hit) * U;
    add(1.4, { type: 'path', name: 'maw', color: 'outline', d: `M${mc[0] - hw} ${y0} Q${mc[0]} ${y0 + 3 * U} ${mc[0] + hw} ${y0 - 1 * U} Q${mc[0]} ${2 * y1 - y0} ${mc[0] - hw} ${y0} Z` });
    [[-0.78, 4], [-0.5, 6], [-0.22, 4.5], [0.08, 6.5], [0.38, 4], [0.66, 5.5]].forEach(([k, len]) => {
      const fx = mc[0] + k * hw, fy = y0 + 1 * U + Math.abs(k) * -1.2 * U;
      add(1.5, { type: 'poly', name: 'fang', mat: pal.cloth, shade: 'flat', band: 0, pts: [[fx - 1.4 * U, fy], [fx, fy + (len + 2 * hit) * U], [fx + 1.4 * U, fy]] });
    });
    [[-0.35, 4], [0.25, 5]].forEach(([k, len]) => {
      const fx = mc[0] + k * hw, fy = y0 + (5 + 7 * hit) * U * 1.6;
      add(1.5, { type: 'poly', name: 'fang', mat: pal.cloth, shade: 'flat', band: 0, pts: [[fx - 1.3 * U, fy], [fx, fy - len * U], [fx + 1.3 * U, fy]] });
    });
  } else {
    // from behind: a ridge of horny knuckles down the back of the orb keeps the back from reading as a bare ball
    [[38, 4.5], [18, 5.5], [-2, 5], [-22, 4]].forEach(([el, r]) => {
      const [f0, s0, u0] = onSphere(180, el, R * 0.98), p = Q(f0, s0, u0);
      add(1, { type: 'ellipse', name: 'ridge', underlay: true, mat: hide, shade: 'sphere', cx: p[0], cy: p[1], rx: r * U * (0.5 + 0.5 * Math.abs(front)), ry: r * U * 0.7 });
    });
  }

  parts.sort((a, b) => a.z - b.z).forEach(p => s.add(p.node));
  return ctx.lib.proc(s).add('groundShadow', { cx: ctx.size[0] / 2, cy: L.ground - 1, rx: 26 * U }).render();
}

// named points: ground (the cell centre), head and hand at the great eye (spells leave from it), its eye for the finish
export const anchors = ctx => {
  const L = layout(ctx), e = L.eye.map(Math.round);
  const a = { ground: [Math.round(L.w / 2), L.ground], head: [Math.round(L.C[0]), Math.round(L.C[1] - L.R)], hand: e };
  if (L.showFace) a.eye = e;
  return a;
};
