// boss-the-magma-sovereign base.v2 (r2, from base.v1) — DECORATION PASS on the owner-approved base.v1 silhouette (shape
// stage approved): every shape keeps its v1 outline, so the pixels outside the outer line are unchanged. What changed,
// all inside the line: (1) the body moves to the family's recoloured ramp (leather, as family-g-cap's approved finish.v2
// recolours leather), so in game the Sovereign takes the ember row colour; (2) flat bands become lit forms from the
// direction's light: limbs, neck and haft `cyl`, fists, knees, orb, collar and pauldron domes `sphere`, torso, head,
// skirt and crown `normal` with wide rounding (round, tapered masses, no pillow), plus ao, cast shadow and a lit rim;
// (3) decals on their parts: a face on the front facings (heavy brow shadow, ember eyes, nose, a slot mouth and a short
// ash-dark beard on the jaw), back hair over the skull on the back facings, dull lava cracks (accent, dark) across the
// chest or the hump, the belly and the pauldrons, glowing seams in the vent mouths kept dark, a cooled-slag drip pattern
// and stone noise on the skirt, rivets on the belt, wraps on the haft, highlights on the crown spires; (4) the one bright
// accent stays on the signature part: the caged orb is glow lit as a sphere with a white-hot core (glow.0), and the iron
// claws catch a metal highlight. The reviewer's v1 notes that fit inside the line: the ember accent reads at 1x (the
// orb's core), the crown spires get highlights so the crown reads, the jaw gets a beard and shading so the head reads.
// base.v1 (r1) — SHAPE DRAFT (shape gate): silhouette and form only, flat materials, no proc layers.
// The Magma Sovereign, a unique boss of the G family (giants): the fire giant who rules the lava forges, 8 m against the
// player (3.5x), a slow brute, on the shared biped rig (`ctx.lib.rigs.body`). What sets him apart from the plain upright
// hill giant with its bald head, beard, tunic and low maul: he is a HUNCHED mountain of a king — the spine bowed forward
// under a great humped back, the small head thrust forward and low on a thick neck but clear of the shoulders, crowned
// with a tall jagged crown of five spires (the same in every facing); two huge volcanic rock pauldrons, each a dome with
// vent cones, widen the shoulders far past the body; a heavy wedge torso over a pot belly; long thick arms bent at the
// elbow to enormous fists; a wide stance of pillar legs with a knee and broad elephant feet; a flaring skirt of cooled
// slag ending in a long ragged drip-hem at the knees. His signature: a colossal forge-sceptre, a haft taller than his
// chest topped by a caged molten orb (the one bright accent, glow), held planted beside him, raised high and smashed into
// the ground in the attack (wind-up, swing, held hit, recovery). Parts are 3D points on the rig (`pose.at(bone, u, fwd,
// side, up)`) so the body turns in the three-quarter facings and stays deep in profile; sizes scale from the brief's height
// and ctx.dir.scale.metre; colours are role ramps (R11). The skin ramp is the dominant one (recolour: skin -> ember).
export const meta = { brief: 'boss-the-magma-sovereign', pass: 'r2', recolour: 'leather', notes: 'decorated: hunched fire-giant king, spired crown, volcanic pauldrons, humped back, slag skirt, caged molten-orb sceptre' };

// The sceptre arm (right) per state and frame: upper arm and forearm (rig angles: 0 = up, 90 = forward), the haft's angle
// off the forearm, spine lean, how far up the haft the hand grips (0 = butt, 1 = head) and the head's sideways reach.
const CARRY = { up: 160, lo: -70, off: -90, spine: 0, grip: 0.76, side: 0 };
const SWING = [
  { up: 40, lo: -95, off: -55, spine: -8, grip: 0.45, side: 4 },   // wind-up: hauled up and back over the right shoulder
  { up: 40, lo: -20, off: 50, spine: 4, grip: 0.5, side: 4 },     // swing: coming over the top and forward
  { up: 120, lo: -8, off: 18, spine: 16, grip: 0.4, side: -4 },    // the hit (held): the orb smashed into the ground before him
  { up: 152, lo: -52, off: -42, spine: 6, grip: 0.6, side: -2 },   // recovery: pulled back toward the carry
];
const HUNCH = 12; // the bowed spine, degrees forward

function layout(ctx) {
  const [w, h] = ctx.size, metres = ctx.brief?.height ?? 8, ground = Math.round(h * 0.96);
  const H = Math.round(ctx.dir.scale.metre * metres * 0.86), U = H / 66;
  const rig = ctx.lib.rigs.body('biped', ctx, { ground, height: H, proportions: { hip: 0.02, neck: 0.06, head: 0.115, leg_up: 0.19, leg_lo: 0.17, arm_up: 0.21, arm_lo: 0.2, armSep: 0.25, legSep: 0.13, shoulder: 0.86 } });
  const base = rig.pose(ctx.state, ctx.t), A = base.angles;
  const f = ctx.frame ?? Math.floor((ctx.t ?? 0) * 4);
  const walkSwing = ctx.state === 'walk' ? 5 * Math.sin((ctx.t ?? 0) * Math.PI * 2) : 0;
  const arm = ctx.state === 'attack' ? SWING[Math.min(SWING.length - 1, f)] : { ...CARRY, up: CARRY.up + walkSwing };
  // hunched: the spine bows forward, the neck pushes the head further out, the head tilts back up to look ahead;
  // the free left arm hangs long and bent, its fist by the knee
  const ov = { spine: (A.spine ?? 0) + HUNCH + arm.spine, neck: (A.neck ?? 0) + 6, head: (A.head ?? 0) - 16, armR_up: arm.up, armR_lo: arm.lo,
    armL_up: (A.armL_up ?? 180) - HUNCH + 4 + (ctx.state === 'attack' ? -14 : 0), armL_lo: (A.armL_lo ?? 4) + 26 };
  const P = rig.pose(ctx.state, ctx.t, { angles: ov });
  return { w, h, U, H, rig, P, arm, ground, front: rig.front, sx: rig.sx, side: rig.side };
}

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), { U, P, front, sx, arm, ground } = L;
  const skin = pal.leather, rock = pal.stone, slag = pal.stone, iron = pal.metal, haftMat = pal.metal, orbMat = pal.glow;
  const r = n => Math.max(1, n * U), key = (f, z) => f * front + z * sx; // depth toward the viewer
  const at = (b, u, f = 0, z = 0, up = 0) => P.at(b, u, f * U, z * U, up * U);
  const halfW = (W, D) => Math.hypot(W * front, D * sx) * U;
  const M = p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  const curve = (ring, close = true) => {
    const n = ring.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let d = `M${M(mid(ring[n - 1], ring[0]))}`;
    for (let i = 0; i < n; i++) d += ` Q${M(ring[i])} ${M(mid(ring[i], ring[(i + 1) % n]))}`;
    return d + (close ? ' Z' : '');
  };
  const poly = pts => { let d = `M${M(pts[0])}`; for (let i = 1; i < pts.length; i++) d += ` L${M(pts[i])}`; return d + ' Z'; };
  // a smooth closed mass through cross-sections [bone, u, W, D, fwd]
  const mass = rows => {
    const pts = rows.map(([b, u, W, D, f]) => ({ c: at(b, u, f), hw: halfW(W, D) }));
    return curve([...pts.map(p => [p.c[0] - p.hw, p.c[1]]), ...pts.map(p => [p.c[0] + p.hw, p.c[1]]).reverse()]);
  };
  const parts = [];
  // v2: marks are decal layers on their parts, gathered here and added after the shading layers
  const decals = [], mark = (name, part, mat, band, shape) => decals.push({ name, part, mat, band, shape });
  // a thin crack strip of width w px through screen points
  const seam = (pts, w = 1) => pts.slice(1).map((b, i) => { const a = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, n = [-dy / l * w / 2, dx / l * w / 2];
    return { type: 'poly', pts: [[a[0] + n[0], a[1] + n[1]], [b[0] + n[0], b[1] + n[1]], [b[0] - n[0], b[1] - n[1]], [a[0] - n[0], a[1] - n[1]]] }; });
  const facingFront = front > -0.2, profile = Math.abs(front) < 0.6;
  // the attack frame (-1 outside it): in profile the raised arm and the sceptre cover the face and chest in some frames,
  // so marks that would land on nothing are left out there
  const atkF = ctx.state === 'attack' ? Math.min(3, ctx.frame ?? Math.floor((ctx.t ?? 0) * 4)) : -1;
  const put = (k, node) => parts.push({ k, node });

  // ---- legs: a wide stance of thick pillar legs, the knee bent a little and pushed out, tapering to the ankle; broad
  // round elephant feet
  for (const n of ['L', 'R']) {
    const z = n === 'L' ? -1 : 1, hip = at(`leg${n}_up`, 0, 0, z * 1.5), knee = at(`leg${n}_up`, 1, 1.4, z * 4.2), ank = at(`leg${n}_lo`, 1, 0, z * 4.6);
    const toe = at(`leg${n}_lo`, 1, 4.2, z * 5.4, 1), heel = at(`leg${n}_lo`, 1, -1.8, z * 4.6, 1);
    put(key(0, z * 7) - 6, { type: 'group', name: `leg${n}`, underlay: true, children: [
      { type: 'capsule', name: 'thigh', a: hip, b: knee, r: r(7.4), r1: r(5.8), mat: skin, shade: 'cyl' },
      { type: 'capsule', name: 'shin', a: knee, b: ank, r: r(5.6), r1: r(4.2), mat: skin, shade: 'cyl' },
      { type: 'capsule', name: 'foot', a: heel, b: toe, r: r(3.6), r1: r(3), mat: skin, shade: 'sphere' },
    ] });
  }
  // ---- the slag skirt: from the belt, flaring out like a cone to a long ragged drip-hem at the knees; its silhouette is
  // the waist ring's two sides and the near half of the hem ring, so it turns with the body
  {
    const n = 28, drops = [0, 3.4, 0.6, 5, 1.2, 2.6, 0.2, 4.4, 1, 3, 0.4, 5.4, 0.8, 2.2];
    const ringAt = (i, rf, rz, f0, bone, u, up) => { const a = (i / n) * Math.PI * 2; return { a, d: (rf * Math.cos(a) + f0) * front + rz * Math.sin(a) * sx, p: at(bone, u, rf * Math.cos(a) + f0, rz * Math.sin(a), up) }; };
    const hemR = Array.from({ length: n }, (_, i) => ringAt(i, 14, 19.5, 2, 'hip', 0, -5 - drops[i % drops.length] * 0.8));
    const topR = Array.from({ length: n }, (_, i) => ringAt(i, 11, 13.5, 3, 'spine', 0.05, 0));
    let start = 0; for (let i = 0; i < n; i++) if (hemR[i].d >= 0 && hemR[(i + n - 1) % n].d < 0) start = i;
    const arc = []; for (let j = 0; j < n; j++) { const i = (start + j) % n; if (hemR[i].d < 0) break; arc.push(i); }
    const i0 = arc[0], i1 = arc[arc.length - 1];
    const ring = [topR[(i1 + 1) % n].p, ...arc.map(i => hemR[i].p).reverse(), topR[(i0 + n - 1) % n].p];
    put(0.3, { type: 'path', name: 'skirt', underlay: true, mat: slag, shade: 'normal', round: r(6), d: curve(ring.reverse()) });
  }
  // ---- the torso: a heavy wedge, broad at the chest, over a hanging pot belly; the great hump of the back pushes out
  // behind the shoulders (the upper rows are deep and set back, so it shows in profile and fills the back view)
  put(0.5, { type: 'path', name: 'torso', underlay: true, mat: skin, shade: 'normal', round: r(9), d: mass([
    ['spine', 0.99, 9, 9, -2], ['spine', 0.92, 18, 19, -4.6], ['spine', 0.8, 24.5, 21, -4.4], ['spine', 0.64, 18, 18, -1.4],
    ['spine', 0.46, 11.5, 13, 2.2], ['spine', 0.3, 14.5, 14, 4.6], ['spine', 0.14, 14.5, 13.5, 5.4], ['spine', 0.02, 11.5, 11, 3]]) });
  // v2: dull lava cracks across the chest and belly (front) or the great hump (back): a dark seam (accent.2) with a
  // hotter thread (accent.1) inside the longest ones; none of it is glow, which stays the sceptre's
  if (facingFront) {
    const cr = [[[0.84, 8, -10], [0.76, 9.5, -6], [0.7, 10, -7.5], [0.6, 9, -3]], [[0.82, 8, 9], [0.74, 9.5, 5], [0.66, 10, 6.5], [0.58, 9, 2]],
      [[0.36, 13, -6], [0.28, 15, -2], [0.2, 15.5, -4]], [[0.34, 13, 6], [0.24, 15, 3], [0.18, 15.5, 5.5]]];
    for (const c of (atkF === 3 && profile ? cr.slice(0, 2) : cr)) mark('crack', 'torso', 'accent', 2, seam(c.map(([u, f, z]) => at('spine', u, f, z)), r(1.1)));
    if (!(atkF === 1 && profile)) for (const c of cr.slice(0, 2)) mark('crack-hot', 'torso', 'accent', 1, seam(c.slice(1, 3).map(([u, f, z]) => at('spine', u, f, z)), 1));
  } else {
    const cr = [[[0.92, -14, -8], [0.84, -16, -3], [0.76, -15, -6], [0.66, -12, -1]], [[0.9, -14, 9], [0.8, -16, 4], [0.7, -14, 7]]];
    for (const c of cr) mark('crack', 'torso', 'accent', 2, seam(c.map(([u, f, z]) => at('spine', u, f, z)), r(1.1)));
    mark('crack-hot', 'torso', 'accent', 1, seam(cr[0].slice(1, 3).map(([u, f, z]) => at('spine', u, f, z)), 1));
  }
  // the broad belt over the belly's lower curve
  put(0.55, { type: 'path', name: 'belt', underlay: true, mat: iron, shade: 'normal', round: r(2.5), d: mass([['spine', 0.11, 14.6, 12.6, 5], ['spine', 0.03, 14, 12, 4], ['spine', -0.05, 13.6, 11.6, 3]]) });
  // the neck: short and thick, carrying the head out in front of the hump
  put(0.6, { type: 'capsule', name: 'neck', underlay: true, a: at('neck', 0, 0.5), b: at('head', 0.3), r: r(5), r1: r(4.2), mat: skin, shade: 'cyl' });

  // ---- arms: a long heavy upper arm, the elbow bend, a thick forearm to an enormous fist
  const fistR = 5.4;
  for (const n of ['L', 'R']) {
    const z = n === 'L' ? -1 : 1, sh = at('spine', 0.84, 0, z * 17, 0), el = at(`arm${n}_up`, 1, -1.5, z * 11), hd = at(`arm${n}_lo`, 1, 0, z * 8);
    put(key(1.2, z * 20), { type: 'group', name: `arm${n}`, underlay: true, children: [
      { type: 'capsule', name: 'upperarm', a: sh, b: el, r: r(6.4), r1: r(5), mat: skin, shade: 'cyl' },
      { type: 'capsule', name: 'forearm', a: el, b: hd, r: r(5.4), r1: r(4.6), mat: skin, shade: 'cyl' },
      { type: 'circle', name: 'fist', cx: hd[0], cy: hd[1], r: r(fistR), mat: skin, shade: 'sphere' },
    ] });
    // the pauldron: a volcanic rock dome capping the shoulder, three vent cones rising up and out of it; it sits outside
    // the neck and below the eyes, so the head stays clear
    const c = at('spine', 0.85, -0.5, z * 18, 1), rx = halfW(9.5, 9), ry = r(7);
    const out = at('spine', 0.85, -0.5, z * 28, 0)[0] - c[0], so = Math.sign(out) || z; // which way is outward on screen
    const cone = (dx, h, wd, lean) => { const b = [c[0] + dx * rx, c[1] - ry * 0.5 * (1 - Math.abs(dx))]; return [[b[0] - wd * U, b[1] + U], [b[0] + lean * U, b[1] - h * U], [b[0] + wd * U, b[1] + U]]; };
    const reach = Math.abs(out) > 2 * U ? so : 0; // seen edge-on the cones stand straight
    // v2: a dark lava crack across the dome
    if (front > 0.6) mark('dome-crack', 'dome', 'accent', 2, seam([[c[0] - rx * 0.55, c[1] - ry * 0.05], [c[0] - rx * 0.15, c[1] + ry * 0.3], [c[0] + rx * 0.2, c[1] + ry * 0.15], [c[0] + rx * 0.5, c[1] + ry * 0.45]], r(1)));
    put(key(1.2, z * 20) + 0.05, { type: 'group', name: `pauldron${n}`, underlay: true, children: [
      { type: 'ellipse', name: 'dome', cx: c[0], cy: c[1], rx, ry, mat: rock, shade: 'sphere' },
      { type: 'path', name: 'vent', d: poly(cone(reach * 0.55, 9, 2.6, reach * 3.5)), mat: rock, shade: 'normal', round: r(1.5) },
      { type: 'path', name: 'vent', d: poly(cone(reach * 0.1 - 0.2 * so, 6.5, 2.2, reach * 1.6)), mat: rock, shade: 'normal', round: r(1.5) },
      { type: 'path', name: 'vent', d: poly(cone(reach * 0.9, 5, 2, reach * 3.4)), mat: rock, shade: 'normal', round: r(1.5) },
    ] });
  }

  // ---- the forge-sceptre: a long haft along the right fist, topped by a collar and a caged molten orb (three claws
  // curling up around it); the orb is the one bright accent
  {
    const fa = (P.angles.spine ?? 0) + arm.up + arm.lo + arm.off, rad = fa * Math.PI / 180, len = 56;
    const hd = at('armR_lo', 1, 0, 8);
    const along = (t, side = 0) => at('armR_lo', 1, Math.sin(rad) * t, 8 + side * (t / len), Math.cos(rad) * t);
    const tTop = len * (1 - arm.grip), tBot = -len * arm.grip;
    let top = along(tTop, arm.side), bot = along(tBot, arm.side);
    const butt = [bot[0], Math.min(bot[1], ground - 1)];
    const d = [top[0] - butt[0], top[1] - butt[1]], l = Math.hypot(...d) || 1, ax = [d[0] / l, d[1] / l], nx = [-ax[1], ax[0]];
    const orbR = 7.2, Q = (t, m) => [top[0] + ax[0] * t * U + nx[0] * m * U, top[1] + ax[1] * t * U + nx[1] * m * U];
    // keep the orb off the ground line and inside the frame's top
    const oc0 = Q(orbR + 1.5, 0), dy = Math.max(0, oc0[1] + orbR * U - (ground - 1)) - Math.max(0, orbR * U + 1 - oc0[1]);
    const dx = Math.max(0, orbR * U + 1 - oc0[0]) - Math.max(0, oc0[0] + orbR * U + 1 - L.w); // and inside its sides
    const S = p => [p[0] + dx, p[1] - dy];
    const oc = S(oc0);
    const claw = m => [S(Q(0, m * 2)), S(Q(orbR * 0.6, m * (orbR + 2.4))), S(Q(orbR * 1.6, m * (orbR + 1.6))), S(Q(orbR * 2.5, m * orbR * 0.5)), S(Q(orbR * 1.7, m * (orbR - 0.2))), S(Q(orbR * 0.6, m * (orbR - 0.4))), S(Q(0, m * 0.6))];
    const kf = key(Math.sin(rad) * tTop * 0.5 + 2, 22 + arm.side * 0.5) + (ctx.state === 'attack' ? 0 : 3);
    put(kf, { type: 'group', name: 'sceptre', underlay: true, children: [
      { type: 'capsule', name: 'haft', a: butt, b: S(Q(0, 0)), r: r(2.2), r1: r(2), mat: haftMat, shade: 'cyl' },
      { type: 'circle', name: 'orb', cx: oc[0], cy: oc[1], r: r(orbR), mat: orbMat, shade: 'flat', band: 1 },
      { type: 'path', name: 'claw', d: poly(claw(1)), mat: iron, shade: 'normal', round: r(1.2) },
      { type: 'path', name: 'claw', d: poly(claw(-1)), mat: iron, shade: 'normal', round: r(1.2) },
      { type: 'ellipse', name: 'collar', cx: S(Q(0, 0))[0], cy: S(Q(0, 0))[1], rx: r(4.4), ry: r(3), mat: iron, shade: 'sphere' },
    ] });
    // the fist closes over the haft: the right fist again, in front of it
    // v2: the one bright accent: the molten orb is orange (glow.1) with a white-hot core toward the light (glow.0) and a
    // dark rim of cooling slag on its shaded side; leather wraps bind the haft below the collar
    const seen = ctx.state !== 'attack' || kf > 0.6; // in the attack the sceptre may swing behind the body
    if (seen) mark('orb-rim', 'orb', 'accent', 1, { type: 'path', d: `M${M([oc[0] + r(orbR) * 0.2, oc[1] + r(orbR) * 0.98])} A${r(orbR)} ${r(orbR)} 0 0 0 ${M([oc[0] + r(orbR) * 0.98, oc[1] - r(orbR) * 0.2])} L${M([oc[0] + r(orbR) * 0.6, oc[1] + r(orbR) * 0.1])} Z` });
    if (!(atkF === 3 && !facingFront)) mark('orb-core', 'orb', 'glow', 0, { type: 'circle', cx: oc[0] - r(orbR) * 0.22, cy: oc[1] - r(orbR) * 0.22, r: r(orbR) * 0.5 });
    if (atkF < 0) { const g0 = S(Q(0, 0)), along2 = t => [g0[0] - ax[0] * t * U, g0[1] - ax[1] * t * U];
      const t0 = Math.hypot(hd[0] - g0[0], hd[1] - g0[1]) / U + fistR + 1.5; // below the fist
      mark('wrap', 'haft', 'leather', 1, [0, 3, 6].map(t => seam([along2(t0 + t), along2(t0 + t + 1.4)], r(4.2)).pop()));
    }
    put(kf + 0.1, { type: 'circle', name: 'grip-fist', underlay: true, cx: hd[0], cy: hd[1], r: r(fistR), mat: skin, shade: 'sphere' });
  }

  // ---- the head: a small egg with a heavy wide jaw, thrust forward and low; the crown of five jagged spires sits on the
  // brow, the middle one tallest, a band below them; it is drawn from every side, so the head reads the same in each facing
  {
    const hc = at('head', 0.5, 1), topY = at('head', 1.0)[1], jaw = at('head', 0.0, 2.2), hw = halfW(5.6, 6.2), jw = halfW(7.2, 6.8);
    const ring = [[hc[0], topY], [hc[0] + hw * 0.85, topY + 1.2 * U], [hc[0] + hw, hc[1] - 0.4 * U], [hc[0] + jw, hc[1] + 3 * U],
      [hc[0] + jw * 0.72, jaw[1] + 0.6 * U], [hc[0], jaw[1] + 1.4 * U], [hc[0] - jw * 0.72, jaw[1] + 0.6 * U], [hc[0] - jw, hc[1] + 3 * U],
      [hc[0] - hw, hc[1] - 0.4 * U], [hc[0] - hw * 0.85, topY + 1.2 * U]];
    // the crown: a band round the brow and five spires on it; they flare out a little so the crown is wider than the head
    const bandY = at('head', 0.78)[1], bw = hw + 1.4 * U, baseY = bandY - 0.6 * U;
    const spires = [[-1, 7, -1.6], [-0.5, 10.5, -0.8], [0, 12, 0], [0.5, 10.5, 0.8], [1, 7, 1.6]];
    const crown = [[hc[0] - bw, bandY + 2 * U]];
    for (const [px, ht, lean] of spires) {
      const x = hc[0] + px * bw * 0.88;
      crown.push([x - 1.9 * U, baseY], [x + lean * U, baseY - ht * U], [x + 1.9 * U, baseY]);
    }
    crown.push([hc[0] + bw, bandY + 2 * U]);
    const kids = [
      { type: 'path', name: 'head', d: curve(ring), mat: skin, shade: 'sphere' },
      { type: 'path', name: 'crown', d: poly(crown), mat: iron, shade: 'normal', round: r(1) },
    ];
    // two dark eyes under the brow, toward the facing
    // v2: the face on the front facings: a heavy brow shadow, two ember eyes under it, a broad lit nose, a dark slot
    // mouth and a short ash-dark beard over the jaw; on the back facings dark hair falls over the skull below the crown
    if (facingFront && !(profile && (atkF === 0 || atkF === 1))) {
      const bL = at('head', 0.62, 5, -4.2), bR = at('head', 0.62, 5, 4.2);
      if (!profile) mark('brow', 'head', 'leather', 2, seam([bL, at('head', 0.6, 5.6, 0), bR], r(1.4)));
      for (const zz of [-1, 1]) { const e = at('head', 0.5, 5.2, zz * 2.4); if (Math.abs(e[0] - hc[0]) < hw - 1 && (zz * sx >= 0 || front > 0.6)) mark('eye', 'head', 'accent', 1, { type: 'rect', x: Math.round(e[0]) - 1, y: Math.round(e[1]), w: 2, h: 1 }); }
      // the lit cheek and temple toward the light (top left), so the face reads as a round form under the brow
      if (!profile) { const ch = at('head', 0.42, 5, -3.6); mark('cheek', 'head', 'leather', 1, { type: 'ellipse', cx: ch[0], cy: ch[1], rx: r(1.8), ry: r(1.4) }); }
      const n0 = at('head', 0.48, 6, 0), n1 = at('head', 0.32, 6.4, 0);
      mark('nose', 'head', 'leather', 0, seam([n0, n1], r(1.2)));
      const mL = at('head', 0.2, 6, -2.4), mR = at('head', 0.2, 6, 2.4);
      mark('beard', 'head', 'stone', 2, { type: 'poly', pts: [[hc[0] - jw * 0.72, hc[1] + 3 * U], [mL[0], mL[1] + U * 0.6], [mR[0], mR[1] + U * 0.6], [hc[0] + jw * 0.72, hc[1] + 3 * U], [hc[0] + jw * 0.5, jaw[1] + U], [hc[0], jaw[1] + 2 * U], [hc[0] - jw * 0.5, jaw[1] + U]] });
      mark('mouth', 'head', 'leather', 2, seam([mL, mR], 1));
    } else if (!facingFront) {
      // from behind the bowed head sits low under the hump's line, so the skull shows as the nape over the neck: the
      // hair covers it from the crown band down, with three darker locks
      const nk = at('neck', 0, 0.5), hd0 = at('head', 0.3), nw = r(5);
      const hairShape = { type: 'poly', pts: [[hc[0] - jw, bandY], [hc[0] + jw, bandY], [hd0[0] + nw, hd0[1] + U], [nk[0] + nw * 0.7, (hd0[1] + nk[1]) / 2 + 2 * U], [nk[0], (hd0[1] + nk[1]) / 2 + 3.4 * U], [nk[0] - nw * 0.7, (hd0[1] + nk[1]) / 2 + 2 * U], [hd0[0] - nw, hd0[1] + U]] };
      mark('nape-hair', 'neck', 'stone', 2, hairShape);
      mark('hair-lock', 'neck', 'stone', 1, [-0.45, 0.1, 0.55].map(t => seam([[hd0[0] + t * nw, hd0[1] - U], [nk[0] + t * nw * 0.6, (hd0[1] + nk[1]) / 2 + 1.6 * U]], 1)[0]));
    }
    // highlights on the crown's spire edges toward the light
    mark('crown-hi', 'crown', 'metal', 0, spires.map(([px, ht, lean]) => { const x = hc[0] + px * bw * 0.88; return seam([[x - 1.2 * U, baseY - 0.4 * U], [x + lean * U - 0.2 * U, baseY - ht * U + 1.6 * U]], 1)[0]; }));
    put(key(1.6, 0) + 1.5, { type: 'group', name: 'headgroup', underlay: true, children: kids });
  }

  parts.sort((a, b) => a.k - b.k).forEach(p => s.add(p.node));
  let p = ctx.lib.proc(s)
    .add('ao', { part: ['torso', 'skirt', 'belt'] })
    .add('castShadow', { part: ['head', 'crown', 'upperarm', 'forearm', 'fist', 'grip-fist', 'dome', 'neck'], dist: 1 })
    .add('rimLight', { part: ['torso', 'head', 'upperarm', 'forearm', 'thigh', 'shin', 'dome', 'crown', 'claw', 'haft', 'collar'], side: 'lit' })
    .add('materialNoise', { mat: 'stone', amount: 0.35, scale: 2, seed: 3 })
    .add('materialNoise', { part: ['torso', 'thigh', 'shin', 'upperarm', 'forearm'], amount: 0.12, scale: 3, seed: 5 })
    .add('pattern', { part: 'belt', type: 'rivets', period: Math.max(3, Math.round(r(4))) });
  for (const d of decals) p = p.add('decal', d);
  return p.render();
}

// named points per frame: head and hand (the sceptre's grip) follow the rig
export const anchors = ctx => {
  const L = layout(ctx), a = L.rig.anchors(L.P);
  delete a.ground;
  return a;
};
