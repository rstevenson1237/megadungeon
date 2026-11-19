// boss-the-magma-sovereign base.v1 (r1) — SHAPE DRAFT (shape gate): silhouette and form only, flat materials, no proc layers.
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
export const meta = { brief: 'boss-the-magma-sovereign', pass: 'r1', recolour: 'skin', notes: 'shape draft: hunched fire-giant king, spired crown, volcanic pauldrons, humped back, slag skirt, caged molten-orb sceptre' };

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
  const skin = pal.skin, rock = pal.stone, slag = pal.stone, iron = pal.metal, haftMat = pal.metal, orbMat = pal.glow;
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
  const put = (k, node) => parts.push({ k, node });

  // ---- legs: a wide stance of thick pillar legs, the knee bent a little and pushed out, tapering to the ankle; broad
  // round elephant feet
  for (const n of ['L', 'R']) {
    const z = n === 'L' ? -1 : 1, hip = at(`leg${n}_up`, 0, 0, z * 1.5), knee = at(`leg${n}_up`, 1, 1.4, z * 4.2), ank = at(`leg${n}_lo`, 1, 0, z * 4.6);
    const toe = at(`leg${n}_lo`, 1, 4.2, z * 5.4, 1), heel = at(`leg${n}_lo`, 1, -1.8, z * 4.6, 1);
    put(key(0, z * 7) - 6, { type: 'group', name: `leg${n}`, underlay: true, children: [
      { type: 'capsule', name: 'thigh', a: hip, b: knee, r: r(7.4), r1: r(5.8), mat: skin, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'shin', a: knee, b: ank, r: r(5.6), r1: r(4.2), mat: skin, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'foot', a: heel, b: toe, r: r(3.6), r1: r(3), mat: skin, shade: 'flat', band: 1 },
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
    put(0.3, { type: 'path', name: 'skirt', underlay: true, mat: slag, shade: 'flat', band: 2, d: curve(ring.reverse()) });
  }
  // ---- the torso: a heavy wedge, broad at the chest, over a hanging pot belly; the great hump of the back pushes out
  // behind the shoulders (the upper rows are deep and set back, so it shows in profile and fills the back view)
  put(0.5, { type: 'path', name: 'torso', underlay: true, mat: skin, shade: 'flat', band: 1, d: mass([
    ['spine', 0.99, 9, 9, -2], ['spine', 0.92, 18, 19, -4.6], ['spine', 0.8, 24.5, 21, -4.4], ['spine', 0.64, 18, 18, -1.4],
    ['spine', 0.46, 11.5, 13, 2.2], ['spine', 0.3, 14.5, 14, 4.6], ['spine', 0.14, 14.5, 13.5, 5.4], ['spine', 0.02, 11.5, 11, 3]]) });
  // the broad belt over the belly's lower curve
  put(0.55, { type: 'path', name: 'belt', underlay: true, mat: iron, shade: 'flat', band: 2, d: mass([['spine', 0.11, 14.6, 12.6, 5], ['spine', 0.03, 14, 12, 4], ['spine', -0.05, 13.6, 11.6, 3]]) });
  // the neck: short and thick, carrying the head out in front of the hump
  put(0.6, { type: 'capsule', name: 'neck', underlay: true, a: at('neck', 0, 0.5), b: at('head', 0.3), r: r(5), r1: r(4.2), mat: skin, shade: 'flat', band: 1 });

  // ---- arms: a long heavy upper arm, the elbow bend, a thick forearm to an enormous fist
  const fistR = 5.4;
  for (const n of ['L', 'R']) {
    const z = n === 'L' ? -1 : 1, sh = at('spine', 0.84, 0, z * 17, 0), el = at(`arm${n}_up`, 1, -1.5, z * 11), hd = at(`arm${n}_lo`, 1, 0, z * 8);
    put(key(1.2, z * 20), { type: 'group', name: `arm${n}`, underlay: true, children: [
      { type: 'capsule', name: 'upperarm', a: sh, b: el, r: r(6.4), r1: r(5), mat: skin, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'forearm', a: el, b: hd, r: r(5.4), r1: r(4.6), mat: skin, shade: 'flat', band: 1 },
      { type: 'circle', name: 'fist', cx: hd[0], cy: hd[1], r: r(fistR), mat: skin, shade: 'flat', band: 1 },
    ] });
    // the pauldron: a volcanic rock dome capping the shoulder, three vent cones rising up and out of it; it sits outside
    // the neck and below the eyes, so the head stays clear
    const c = at('spine', 0.85, -0.5, z * 18, 1), rx = halfW(9.5, 9), ry = r(7);
    const out = at('spine', 0.85, -0.5, z * 28, 0)[0] - c[0], so = Math.sign(out) || z; // which way is outward on screen
    const cone = (dx, h, wd, lean) => { const b = [c[0] + dx * rx, c[1] - ry * 0.5 * (1 - Math.abs(dx))]; return [[b[0] - wd * U, b[1] + U], [b[0] + lean * U, b[1] - h * U], [b[0] + wd * U, b[1] + U]]; };
    const reach = Math.abs(out) > 2 * U ? so : 0; // seen edge-on the cones stand straight
    put(key(1.2, z * 20) + 0.05, { type: 'group', name: `pauldron${n}`, underlay: true, children: [
      { type: 'ellipse', name: 'dome', cx: c[0], cy: c[1], rx, ry, mat: rock, shade: 'flat', band: 1 },
      { type: 'path', name: 'vent', d: poly(cone(reach * 0.55, 9, 2.6, reach * 3.5)), mat: rock, shade: 'flat', band: 1 },
      { type: 'path', name: 'vent', d: poly(cone(reach * 0.1 - 0.2 * so, 6.5, 2.2, reach * 1.6)), mat: rock, shade: 'flat', band: 2 },
      { type: 'path', name: 'vent', d: poly(cone(reach * 0.9, 5, 2, reach * 3.4)), mat: rock, shade: 'flat', band: 2 },
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
      { type: 'capsule', name: 'haft', a: butt, b: S(Q(0, 0)), r: r(2.2), r1: r(2), mat: haftMat, shade: 'flat', band: 2 },
      { type: 'circle', name: 'orb', cx: oc[0], cy: oc[1], r: r(orbR), mat: orbMat, shade: 'flat', band: 1 },
      { type: 'path', name: 'claw', d: poly(claw(1)), mat: iron, shade: 'flat', band: 1 },
      { type: 'path', name: 'claw', d: poly(claw(-1)), mat: iron, shade: 'flat', band: 1 },
      { type: 'ellipse', name: 'collar', cx: S(Q(0, 0))[0], cy: S(Q(0, 0))[1], rx: r(4.4), ry: r(3), mat: iron, shade: 'flat', band: 2 },
    ] });
    // the fist closes over the haft: the right fist again, in front of it
    put(kf + 0.1, { type: 'circle', name: 'grip-fist', underlay: true, cx: hd[0], cy: hd[1], r: r(fistR), mat: skin, shade: 'flat', band: 1 });
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
      { type: 'path', name: 'head', d: curve(ring), mat: skin, shade: 'flat', band: 1 },
      { type: 'path', name: 'crown', d: poly(crown), mat: iron, shade: 'flat', band: 1 },
    ];
    // two dark eyes under the brow, toward the facing
    if (front > -0.2) for (const zz of [-1, 1]) {
      const e = at('head', 0.5, 5.2, zz * 2.4);
      kids.push({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 1, h: 1, color: 'outline' });
    }
    put(key(1.6, 0) + 1.5, { type: 'group', name: 'headgroup', underlay: true, children: kids });
  }

  parts.sort((a, b) => a.k - b.k).forEach(p => s.add(p.node));
  return ctx.lib.proc(s).render();
}

// named points per frame: head and hand (the sceptre's grip) follow the rig
export const anchors = ctx => {
  const L = layout(ctx), a = L.rig.anchors(L.P);
  delete a.ground;
  return a;
};
