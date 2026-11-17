// boss-the-ninefold-eye base.v2 (r2, from base.v1) — the one decorated pass on the owner-approved shape (the silhouette
// of base.v1 is kept pixel for pixel; every change is inside the outer line):
//  - the great eye is larger and set higher on the orb, its lid scowling at rest and lifting at the attack's held hit so
//    the eye glares wide open (the review: "small and low"), with a glint on its glowing iris
//    (the one bright accent, glow ramp) and a dark socket ring and crease folds around it (decals on the body);
//  - materials: the hide on the skin ramp (the family-a-cap recolour ramp) with light material noise, AO where stalks,
//    tendrils and lid overlap the orb, a lit rim on the light side; leather-ramp gums and tongue inside the maw;
//  - decals: wrinkle creases and old scars on the hide (front), a spine of scar furrows and folds on the back facings;
//    tendril suckers along the underside.
// The rest (rig, stalks, tendrils, attack, anchors) is base.v1 unchanged.
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
export const meta = { brief: 'boss-the-ninefold-eye', pass: 'r2', notes: 'decorated: bigger higher great eye with glint, socket and creases, hide noise/AO/rim, leather gums and tongue, scars and back folds', recolour: 'skin' };

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
  const eye3 = onSphere(0, 14, R * 0.94), eye = Q(...eye3), showFace = front > -0.3;
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

  const decals = [], decal = (name, part, mat, band, shape) => decals.push({ name, part, mat, band, shape });
  // a thin crease or scar as a decal polygon (2 px wide at least, the direction's minimum feature)
  const seg = (a, b, wd = 1.6 * U) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l * wd / 2, ny = (b[0] - a[0]) / l * wd / 2; return { type: 'poly', pts: [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]] }; };
  if (showFace) {
    // base.v1's eye and lid, kept as the brow mass behind the new eye: the approved silhouette is body + this mass, so
    // the bigger eye is clipped to it and never changes the outer line
    const v1e = Q(...onSphere(0, 8, R * 0.94)), vrx = 17 * U * squash, vry = 13 * U, vlx = vrx + 2.5 * U, vglare = 0.38 + 0.35 * hit;
    const vcy0 = v1e[1] - vry * 0.15, vedge = v1e[1] - vry + vry * 2 * vglare;
    const v1lid = `M${v1e[0] - vlx} ${vcy0} Q${v1e[0] - vlx} ${v1e[1] - vry - 3.5 * U} ${v1e[0]} ${v1e[1] - vry - 3.5 * U} Q${v1e[0] + vlx} ${v1e[1] - vry - 3.5 * U} ${v1e[0] + vlx} ${vcy0} Q${v1e[0] + vlx * 0.5} ${vedge - 2 * U} ${v1e[0]} ${vedge + 1.5 * U} Q${v1e[0] - vlx * 0.5} ${vedge - 2 * U} ${v1e[0] - vlx} ${vcy0} Z`;
    add(0.9, { type: 'union', name: 'brow', underlay: true, mat: hide, shade: 'sphere', shapes: [{ type: 'ellipse', cx: v1e[0], cy: v1e[1], rx: vrx, ry: vry }, { type: 'path', d: v1lid }] });
    const keep = { type: 'union', shapes: [{ type: 'ellipse', cx: C[0], cy: C[1], rx: R * 1.04, ry: R * 0.96 }, { type: 'ellipse', cx: v1e[0], cy: v1e[1], rx: vrx, ry: vry }, { type: 'path', d: v1lid }] };
    // the great eye, bigger and higher than v1, under its heavy brooding lid; the iris is the one bright accent
    const rx = 19 * U * squash, ry = 15 * U, ex = eye[0], ey = eye[1], ir = 9 * U, glare = 0.4 - 0.22 * hit; // the lid lifts in the attack: the eye glares wide open at the held hit
    const ix = ex + (front < 0.9 ? Math.sign(L.sx) * 1.5 * U : 0), iy = ey + 0.5 * U;
    const lx = rx + 2.5 * U, cy0 = ey - ry * 0.15, edge = ey - ry + ry * 2 * glare;
    const kids = [
      { type: 'ellipse', name: 'eye', underlay: true, mat: pal.cloth, shade: 'flat', band: 0, cx: ex, cy: ey, rx, ry },
      { type: 'ellipse', name: 'iris', mat: pal.glow, shade: 'flat', band: 1, cx: ix, cy: iy, rx: ir * squash * (1 + 0.15 * hit), ry: ir * (1 + 0.15 * hit) },
      { type: 'ellipse', name: 'pupil', color: 'outline', cx: ix, cy: iy, rx: Math.max(0.8, 1.6 * U * squash * (1 - 0.4 * hit)), ry: 5.5 * U },
      // the glint: a hard catch-light on the iris toward the light (upper left)
      { type: 'rect', name: 'glint', color: 'glow.0', x: Math.round(ix - 4 * U * squash), y: Math.round(iy - 5 * U), w: Math.max(2, Math.round(2 * U)), h: Math.max(2, Math.round(2 * U)) },
      // the lid: hide over the eye's top, its edge slanting down toward the middle (a scowl), lower in the attack
      { type: 'path', name: 'lid', underlay: true, mat: hide, shade: 'normal', round: 2 * U, d: `M${ex - lx} ${cy0} Q${ex - lx} ${ey - ry - 3.5 * U} ${ex} ${ey - ry - 3.5 * U} Q${ex + lx} ${ey - ry - 3.5 * U} ${ex + lx} ${cy0} Q${ex + lx * 0.5} ${edge - 2 * U} ${ex} ${edge + 1.5 * U} Q${ex - lx * 0.5} ${edge - 2 * U} ${ex - lx} ${cy0} Z` },
    ];
    add(1, { type: 'group', name: 'face', clip: keep, children: kids });
    // veins on the eye-white from its corners toward the iris (accent, dark band)
    // placed in the part of the eye the lid leaves open (lower in the attack), inside the eye's ellipse
    [[-1, 0.35], [-1, 0.7], [1, 0.4], [1, 0.72]].forEach(([sd, k], i) => {
      const y = Math.max(edge + 2 * U, ey - ry * 0.2) + (ey + ry * 0.8 - Math.max(edge + 2 * U, ey - ry * 0.2)) * k, xm = rx * Math.sqrt(Math.max(0, 1 - ((y - ey) / ry) ** 2));
      const a = [ex + sd * xm * 0.85, y], b = [ex + sd * Math.max(xm * 0.45, ir * squash + U), y + (i % 2 ? 1 : -1) * U];
      decal(`vein${i}`, 'eye', 'accent', 1, seg(a, b, 1.4 * U));
    });
    // the eye-white's shadow: its lower right crescent one band down, away from the upper-left light
    decal('eye-shade', 'eye', 'cloth', 1, { type: 'path', d: `M${ex - rx * 0.9} ${ey + ry * 0.3} Q${ex} ${ey + ry * 0.75} ${ex + rx * 0.75} ${ey - ry * 0.05} L${ex + rx} ${ey + ry * 0.2} Q${ex + rx * 0.6} ${ey + ry} ${ex} ${ey + ry} Q${ex - rx * 0.7} ${ey + ry} ${ex - rx * 0.9} ${ey + ry * 0.3} Z` });
    // the dark socket ring around the eye and crease folds fanning out from it, on the hide
    decal('socket', 'body', 'skin', 2, { type: 'ellipse', cx: ex, cy: ey + 1.5 * U, rx: rx + 3 * U, ry: ry + 2.5 * U });
    if (front > 0.65) [[-1, 0.2, -18], [-1, 0.75, 12], [1, 0.25, -14], [1, 0.8, 14]].forEach(([sd, k, dy], i) => {
      const a = [ex + sd * (rx + 3 * U), ey + k * ry * 0.6], b = [a[0] + sd * 6 * U * squash, a[1] + dy * 0.35 * U];
      decal(`crease${i}`, 'body', 'skin', 2, seg(a, b));
    });
    // an old scar raked across the upper right of the orb (a dark cut)
    const s0 = Q(...onSphere(-48, 32, R * 0.97)), s1 = Q(...onSphere(-66, 6, R * 0.97));
    if (front > 0.3) decal('scar', 'body', 'skin', 2, seg(s0, s1, 1.8 * U));
    // the maw: a wide dark crescent across the lower orb, gaping in the attack, with ragged fangs, leather gums and tongue
    const [mf, ms, mu] = onSphere(0, -32, R * 0.93), mc = Q(mf, ms, mu), hw = 20 * U * squash * (1 + 0.15 * hit);
    const y0 = mc[1] - 3 * U, y1 = mc[1] + (5 + 7 * hit) * U;
    const mawD = `M${mc[0] - hw} ${y0} Q${mc[0]} ${y0 + 3 * U} ${mc[0] + hw} ${y0 - 1 * U} Q${mc[0]} ${2 * y1 - y0} ${mc[0] - hw} ${y0} Z`;
    add(1.4, { type: 'path', name: 'maw', color: 'outline', d: mawD });
    add(1.45, { type: 'group', name: 'mouth', clip: { type: 'path', d: mawD }, children: [
      { type: 'ellipse', name: 'tongue', mat: pal.leather, shade: 'flat', band: 1, cx: mc[0] + 2 * U * squash, cy: y1 + 2.5 * U, rx: hw * 0.45, ry: (3 + 3 * hit) * U },
      { type: 'path', name: 'gum', mat: pal.leather, shade: 'flat', band: 1, d: `M${mc[0] - hw} ${y0} Q${mc[0]} ${y0 + 3 * U} ${mc[0] + hw} ${y0 - 1 * U} L${mc[0] + hw} ${y0 + 1 * U} Q${mc[0]} ${y0 + 5 * U} ${mc[0] - hw} ${y0 + 2 * U} Z` },
    ] });
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
    // the back: deep hide folds curving round the orb either side of the ridge, and old scars
    [[150, 210, 30], [140, 220, 5], [150, 210, -20]].forEach(([a0, a1, el], i) => {
      [[a0, 168], [192, a1]].forEach(([b0, b1], j) => {
        const p0 = Q(...onSphere(b0, el, R)), p1 = Q(...onSphere(b1, el - 6, R));
        if (depth(...onSphere(b0, el, R)) < 0 || depth(...onSphere(b1, el, R)) < 0) decal(`fold${i}${j}`, 'body', 'skin', 2, seg(p0, p1));
      });
    });
    const t0 = Q(...onSphere(200, 45, R)), t1 = Q(...onSphere(225, 10, R));
    decal('scar', 'body', 'skin', 2, seg(t0, t1, 1.8 * U));
  }

  parts.sort((a, b) => a.z - b.z).forEach(p => s.add(p.node));
  let pr = ctx.lib.proc(s)
    .add('ao', { part: ['body', 'brow'] })
    .add('materialNoise', { part: ['body'], amount: 0.1, scale: 3, seed: ctx.variant ?? 0 })
    .add('rimLight', { part: ['body', 'stalk', 'tendril'] });
  for (const d of decals) pr = pr.add('decal', d);
  return pr.add('groundShadow', { cx: ctx.size[0] / 2, cy: L.ground - 1, rx: 26 * U }).render();
}

// named points: ground (the cell centre), head and hand at the great eye (spells leave from it), its eye for the finish
export const anchors = ctx => {
  const L = layout(ctx), e = L.eye.map(Math.round);
  const a = { ground: [Math.round(L.w / 2), L.ground], head: [Math.round(L.C[0]), Math.round(L.C[1] - L.R)], hand: e };
  if (L.showFace) a.eye = e;
  return a;
};
