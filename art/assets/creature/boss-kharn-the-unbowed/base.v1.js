// boss-kharn-the-unbowed base.v1 (r1) — SHAPE DRAFT (shape gate): silhouette and form only, flat materials, no proc layers.
// Kharn the Unbowed, a unique boss of the O family (ogres): a giant ogre of the old mines, 7 m against the player, on the
// shared biped rig (`ctx.lib.rigs.body`). What sets him apart from the hunched plain ogre with its club: he stands
// UPRIGHT — chest thrown out, chin up, never stooping — on a wide stance of short thick bowed legs; a huge barrel chest
// over a pot belly, sloping trapezius humps into enormous shoulders and long heavy arms; a warrior's topknot rising from
// the crown (the same in every facing); a broken iron collar and broken manacles with chain stubs swinging from both
// wrists (the chains he broke); a flaring hide kilt with a ragged hem; and his signature, a colossal miner's war-pick
// (a haft as tall as his chest, a curved double head wider than his shoulders) held upright beside him, raised high
// overhead and driven down into the ground in the attack (wind-up, swing, held hit, recovery). Parts are 3D points on the
// rig (`pose.at(bone, u, fwd, side, up)`) so the body turns in the three-quarter facings; sizes scale from the brief's
// height and ctx.dir.scale.metre; colours are role ramps (R11). The skin ramp stays the dominant one (recolour: skin).
export const meta = { brief: 'boss-kharn-the-unbowed', pass: 'r1', recolour: 'skin', notes: 'shape draft: upright giant ogre, topknot, broken shackles and chains, flaring hide kilt, colossal war-pick' };

// The pick arm (right) per state and frame: upper arm and forearm (rig angles: 0 = up, 90 = forward), the haft's angle
// off the forearm, spine lean, how far up the haft the hand grips (0 = butt, 1 = head) and the head's sideways reach.
const CARRY = { up: 158, lo: -66, off: -89, spine: -3, grip: 0.5, side: 0 };
const SWING = [
  { up: 50, lo: -100, off: -50, spine: -9, grip: 0.35, side: 11 },  // wind-up: hauled back over the right shoulder, leaning back
  { up: 42, lo: -18, off: 48, spine: 4, grip: 0.5, side: 12 },       // swing: coming over the top and forward
  { up: 118, lo: -8, off: 18, spine: 16, grip: 0.35, side: -9 },     // the hit (held): driven down into the ground before him
  { up: 150, lo: -50, off: -40, spine: 5, grip: 0.4, side: -3 },     // recovery: pulled back up toward the carry
];

function layout(ctx) {
  const [w, h] = ctx.size, metres = ctx.brief?.height ?? 7, ground = Math.round(h * 0.955);
  const H = Math.round(ctx.dir.scale.metre * metres * 0.87), U = H / 66;
  const rig = ctx.lib.rigs.body('biped', ctx, { ground, height: H, proportions: { hip: 0.02, neck: 0.035, head: 0.14, leg_up: 0.16, leg_lo: 0.15, arm_up: 0.2, arm_lo: 0.19, armSep: 0.215, legSep: 0.1, shoulder: 0.88 } });
  const base = rig.pose(ctx.state, ctx.t), A = base.angles;
  const f = ctx.frame ?? Math.floor((ctx.t ?? 0) * 4);
  const walkSwing = ctx.state === 'walk' ? 5 * Math.sin((ctx.t ?? 0) * Math.PI * 2) : 0;
  const arm = ctx.state === 'attack' ? SWING[Math.min(SWING.length - 1, f)] : { ...CARRY, up: CARRY.up + walkSwing };
  // unbowed: the spine leans back a touch, the head is held high; the free left arm hangs bent, fist clenched
  const ov = { spine: (A.spine ?? 0) + arm.spine, neck: (A.neck ?? 0) + 2, head: (A.head ?? 0) - 6, armR_up: arm.up, armR_lo: arm.lo,
    armL_up: (A.armL_up ?? 180) + (ctx.state === 'attack' ? -18 : 0), armL_lo: (A.armL_lo ?? 4) + 34 };
  const P = rig.pose(ctx.state, ctx.t, { angles: ov });
  return { w, h, U, H, rig, P, arm, ground, front: rig.front, sx: rig.sx, side: rig.side };
}

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), { U, P, front, sx, arm, ground } = L;
  const skin = pal.skin, hide = pal.leather, iron = pal.metal, hair = pal.hair, haftMat = pal.leather;
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
  // a smooth closed mass through cross-sections [bone, u, W, D, fwd]
  const mass = rows => {
    const pts = rows.map(([b, u, W, D, f]) => ({ c: at(b, u, f), hw: halfW(W, D) }));
    return curve([...pts.map(p => [p.c[0] - p.hw, p.c[1]]), ...pts.map(p => [p.c[0] + p.hw, p.c[1]]).reverse()]);
  };
  const parts = [];
  const put = (k, node) => parts.push({ k, node });

  // ---- legs: short, thick and bowed (the knee pushed out), tapering to the ankle; broad flat feet
  for (const n of ['L', 'R']) {
    const z = n === 'L' ? -1 : 1, hip = P.start(`leg${n}_up`), knee = at(`leg${n}_up`, 1, 0.6, z * 3.2), ank = P.end(`leg${n}_lo`);
    const toe = at(`leg${n}_lo`, 1, 4.6, z * 1.2, 0.8), heel = at(`leg${n}_lo`, 1, -1.6, 0, 0.8);
    put(key(0, z * 6.6) - 6, { type: 'group', name: `leg${n}`, underlay: true, children: [
      { type: 'capsule', name: 'thigh', a: hip, b: knee, r: r(6.4), r1: r(4.8), mat: skin, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'shin', a: knee, b: ank, r: r(4.6), r1: r(3.2), mat: skin, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'foot', a: heel, b: toe, r: r(2.8), r1: r(2.3), mat: skin, shade: 'flat', band: 1 },
    ] });
  }
  // ---- the hide kilt: from a broad belt, flaring out like a cone to a ragged hem above the knee; its silhouette is the
  // waist ring's two sides and the near half of the hem ring, so it turns with the body
  {
    const n = 24, drops = [0, 2.4, 0.4, 3.2, 1, 2.6, 0.2, 3.4, 0.8, 2.2, 0, 2.8];
    const ringAt = (i, rf, rz, f0, bone, u, up) => { const a = (i / n) * Math.PI * 2; return { a, d: (rf * Math.cos(a) + f0) * front + rz * Math.sin(a) * sx, p: at(bone, u, rf * Math.cos(a) + f0, rz * Math.sin(a), up) }; };
    const hemR = Array.from({ length: n }, (_, i) => ringAt(i, 12, 17.5, 1.5, 'hip', 0, -8 - drops[i % drops.length] * 0.9));
    const topR = Array.from({ length: n }, (_, i) => ringAt(i, 10, 12.5, 2.4, 'spine', 0.04, 0));
    // the near arc of the hem (depth >= 0), walked in order from one side to the other
    let start = 0; for (let i = 0; i < n; i++) if (hemR[i].d >= 0 && hemR[(i + n - 1) % n].d < 0) start = i;
    const arc = []; for (let j = 0; j < n; j++) { const i = (start + j) % n; if (hemR[i].d < 0) break; arc.push(i); }
    const i0 = arc[0], i1 = arc[arc.length - 1];
    const ring = [topR[(i1 + 1) % n].p, ...arc.map(i => hemR[i].p).reverse(), topR[(i0 + n - 1) % n].p];
    put(0.3, { type: 'path', name: 'kilt', underlay: true, mat: hide, shade: 'flat', band: 1, d: curve(ring.reverse()) });
  }
  // ---- the torso: upright barrel chest over a hanging pot belly, sloping trapezius humps up to the thick neck
  put(0.5, { type: 'path', name: 'torso', underlay: true, mat: skin, shade: 'flat', band: 1, d: mass([
    ['spine', 1.08, 7, 7, 0.4], ['spine', 0.98, 15.5, 10, 0.8], ['spine', 0.86, 19.5, 11.5, 2.2], ['spine', 0.68, 16.5, 12, 3.4],
    ['spine', 0.5, 12, 10.5, 3.6], ['spine', 0.3, 13.5, 11.5, 5.4], ['spine', 0.14, 14.5, 11.5, 5.8], ['spine', 0.02, 11, 9, 2.6]]) });
  // the broad belt over the belly's lower curve
  put(0.55, { type: 'path', name: 'belt', underlay: true, mat: hide, shade: 'flat', band: 2, d: mass([['spine', 0.1, 13, 11, 4.2], ['spine', 0.02, 12.6, 10.6, 3.4], ['spine', -0.06, 12.4, 10.4, 2.4]]) });
  // the neck: short and as thick as the head, ringed by the broken iron collar
  put(0.6, { type: 'capsule', name: 'neck', underlay: true, a: P.start('neck'), b: at('head', 0.25), r: r(4.6), r1: r(4), mat: skin, shade: 'flat', band: 1 });
  {
    const c = at('neck', 0.1, 0.6);
    put(0.62, { type: 'ellipse', name: 'collar', underlay: true, cx: c[0], cy: c[1], rx: halfW(7.6, 7), ry: r(2.6), mat: iron, shade: 'flat', band: 1 });
  }

  // ---- arms: shoulder hump, a heavy upper arm, the elbow bend, a thick forearm to a big fist; an iron manacle at the wrist
  // with a broken chain swinging below it
  const chainSway = ctx.state === 'walk' ? 2 * Math.sin((ctx.t ?? 0) * Math.PI * 2) : ctx.state === 'attack' ? -2 : 0;
  for (const n of ['L', 'R']) {
    const z = n === 'L' ? -1 : 1, sh = at('spine', 0.9, 1, z * 13.5, 0), el = at(`arm${n}_up`, 1, -1.5, z * 9), hd = at(`arm${n}_lo`, 1, 0, z * 6.5);
    const wrist = at(`arm${n}_lo`, 0.8, 0, z * 7), k = key(1.2, z * 18);
    const ch1 = [wrist[0] + z * 0.5 * U * front + chainSway, wrist[1] + 5 * U], ch2 = [ch1[0] + z * 1.2 * U * front + chainSway, ch1[1] + 4.5 * U];
    put(k, { type: 'group', name: `arm${n}`, underlay: true, children: [
      { type: 'circle', name: 'shoulder', cx: sh[0], cy: sh[1], r: r(6.6), mat: skin, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'upperarm', a: sh, b: el, r: r(5.8), r1: r(4.4), mat: skin, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'forearm', a: el, b: hd, r: r(4.6), r1: r(3.8), mat: skin, shade: 'flat', band: 1 },
      { type: 'tube', name: 'chain', pts: [wrist, ch1, ch2], w: r(1.7), mat: iron, shade: 'flat', band: 2 },
      { type: 'ellipse', name: 'manacle', cx: wrist[0], cy: wrist[1], rx: r(4.4), ry: r(3), mat: iron, shade: 'flat', band: 1 },
      { type: 'circle', name: 'fist', cx: hd[0], cy: hd[1], r: r(4.2), mat: skin, shade: 'flat', band: 1 },
    ] });
  }

  // ---- the war-pick: a long haft along the right fist, a curved double head (a long pick point toward the facing side, a
  // broad mattock blade behind) drawn across the haft's end so it reads as a T in every facing
  {
    const fa = (P.angles.spine ?? 0) + arm.up + arm.lo + arm.off, rad = fa * Math.PI / 180, len = 58;
    const hd = at('armR_lo', 1, 0, 6.5);
    const along = (t, side = 0) => at('armR_lo', 1, Math.sin(rad) * t, 6.5 + side * (t / len), Math.cos(rad) * t);
    const tTop = len * (1 - arm.grip), tBot = -len * arm.grip;
    const top = along(tTop, arm.side), bot = along(tBot, arm.side);
    // never let the butt sink below the ground line
    const butt = [bot[0], Math.min(bot[1], ground - 1)];
    const d = [top[0] - butt[0], top[1] - butt[1]], l = Math.hypot(...d) || 1, ax = [d[0] / l, d[1] / l], nx = [-ax[1], ax[0]];
    // which way the point faces on screen: toward the facing in profile, outward (the pick side) seen from front or back
    const fwdX = at('spine', 0.5, 10)[0] - at('spine', 0.5, 0)[0], outX = hd[0] - at('spine', 0.5)[0];
    let ps = Math.abs(fwdX) > 4 ? Math.sign(fwdX) : Math.sign(outX) || 1;
    if (nx[0] * ps < 0) { nx[0] = -nx[0]; nx[1] = -nx[1]; }
    // seen from the front or back the pick stands at the frame's edge, so its head is drawn shorter there (it is foreshortened)
    const sz = 0.58 + 0.42 * L.side;
    const Q = (t, m) => [top[0] - ax[0] * t * U + nx[0] * m * sz * U, top[1] - ax[1] * t * U + nx[1] * m * sz * U];
    // the head: socket at the haft's end; the pick point sweeps out 19 U and droops; the mattock blade 12 U behind, flaring
    const head = [Q(-3, 0), Q(-2.4, 8), Q(-0.2, 16), Q(4.6, 24), Q(2, 16), Q(2.2, 8), Q(3.4, 0), Q(3.2, -5), Q(3, -8), Q(6.4, -11),
      Q(-4.6, -11.2), Q(-2, -8), Q(-3, -5)].map(([x, y]) => [x, Math.min(y, ground - 1)]);
    let hp = `M${M(head[0])}`; for (let i = 1; i < head.length; i++) hp += ` L${M(head[i])}`;
    const sock = Q(0.2, 0);
    const kf = key(Math.sin(rad) * tTop * 0.5 + 2, 18 + arm.side * 0.5) + (ctx.state === 'attack' ? 0 : 3);
    put(kf, { type: 'group', name: 'pick', underlay: true, children: [
      { type: 'capsule', name: 'haft', a: butt, b: Q(-1, 0), r: r(2.2), r1: r(1.8), mat: haftMat, shade: 'flat', band: 2 },
      { type: 'path', name: 'pickhead', d: hp + ' Z', mat: iron, shade: 'flat', band: 1 },
      { type: 'ellipse', name: 'socket', cx: sock[0], cy: sock[1], rx: r(3.8), ry: r(3.8), mat: iron, shade: 'flat', band: 2 },
    ] });
    // the fist closes over the haft: the right fist again, in front of it
    put(kf + 0.1, { type: 'circle', name: 'grip-fist', underlay: true, cx: hd[0], cy: hd[1], r: r(4.2), mat: skin, shade: 'flat', band: 1 });
  }

  // ---- the head: a small egg (narrow crown, a heavy wide jaw), held high; tusks; a warrior's topknot from the crown
  {
    const hc = at('head', 0.5, 0.8), topY = at('head', 1.02)[1], jaw = at('head', 0.0, 2), hw = halfW(5.4, 6), jw = halfW(7, 6.6);
    const ring = [[hc[0], topY], [hc[0] + hw * 0.85, topY + 1.2 * U], [hc[0] + hw, hc[1] - 0.4 * U], [hc[0] + jw, hc[1] + 3.2 * U],
      [hc[0] + jw * 0.7, jaw[1] + 0.6 * U], [hc[0], jaw[1] + 1.2 * U], [hc[0] - jw * 0.7, jaw[1] + 0.6 * U], [hc[0] - jw, hc[1] + 3.2 * U],
      [hc[0] - hw, hc[1] - 0.4 * U], [hc[0] - hw * 0.85, topY + 1.2 * U]];
    // the topknot: tied at the crown, standing up and falling back in a thick plume
    const kb = at('head', 1, -0.5, 0, -0.6), k1 = at('head', 1, -0.6, 0, 7.5), k2 = at('head', 1, -4, 0, 11), k3 = at('head', 1, -10, 0, 6), k4 = at('head', 1, -8, 0, 1.5);
    const tw = Math.max(halfW(3, 3), 2.6 * U);
    const knot = curve([[kb[0] - tw, kb[1]], [k1[0] - tw * 1.1, k1[1]], [k2[0], k2[1] - 1.6 * U], [k3[0] + (k3[0] < kb[0] ? -1 : 1) * 1.2 * U, k3[1]], [k4[0], k4[1] + 1.2 * U], [k1[0] + tw * 0.9, k1[1] + 2 * U], [kb[0] + tw, kb[1]]]);
    const tie = at('head', 1, -0.5, 0, 1.6);
    const kids = [
      { type: 'path', name: 'topknot', d: knot, mat: hair, shade: 'flat', band: 1 },
      { type: 'ellipse', name: 'topknot-tie', cx: tie[0], cy: tie[1], rx: tw * 0.95, ry: r(1.4), mat: hide, shade: 'flat', band: 1 },
      { type: 'path', name: 'head', d: curve(ring), mat: skin, shade: 'flat', band: 1 },
    ];
    // tusks jut up from the underbite past the lips, seen from the front and the three-quarter views
    if (front > -0.3) for (const zz of [-1, 1]) {
      const b0 = at('head', 0.08, 5, zz * 3.6), tip = at('head', 0.08, 6.2, zz * 4.6, 4.8), wv = 1.1 * U;
      kids.push({ type: 'poly', name: 'tusk', pts: [[b0[0] - wv, b0[1]], [tip[0], tip[1]], [b0[0] + wv, b0[1]]], mat: hair, shade: 'flat', band: 0 });
    }
    // two dark eyes under the brow, toward the facing
    if (front > -0.2) for (const zz of [-1, 1]) {
      const e = at('head', 0.56, 5, zz * 2.2);
      if (Math.abs(zz * front + 0) < 0.01) continue;
      kids.push({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 1, h: 1, color: 'outline' });
    }
    put(key(1.6, 0) + 1.5, { type: 'group', name: 'headgroup', underlay: true, children: kids });
  }

  parts.sort((a, b) => a.k - b.k).forEach(p => s.add(p.node));
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}

// named points per frame: head and hand (the pick's grip) follow the rig
export const anchors = ctx => {
  const L = layout(ctx), a = L.rig.anchors(L.P);
  delete a.ground;
  return a;
};
