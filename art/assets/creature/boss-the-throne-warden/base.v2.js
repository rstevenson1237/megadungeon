// boss-the-throne-warden base.v2 (r2) — SHAPE DRAFT again, from base.v1, ONE change: the shape is redrawn (the owner
// rejected v1's outline: "reads as a plain armoured knight with a small head and a thin sword, not a stone construct").
// The knight parts go (domed pauldrons, pear chest, fauld skirt, thin sword); he is rebuilt as a stone-and-iron
// construct guardian:
// - a massive slab-block body: a broad stone chest block with rounded corners tapering to a waist, an iron belt band and
//   a heavy stone pelvis block, as deep in the side views as it is wide in front;
// - rising behind the shoulders, a throne-back slab: a thick squared stone slab with two stepped pillars capped by
//   square stones flanking a low middle where the head sits, so the crowned head shows in every facing (unlike the Seat
//   Itself's arched wingback crest with spires and its red panel: this one is plain squared stone, the throne's back
//   worn as a shield-wall), with real depth in the side facings;
// - boulder shoulder blocks raised above the jaw, the small head sunk between them on a thick neck under the iron crown;
// - thick tapered arms with an elbow ending in huge stone fists; thick tapered legs with knee stones, a wide planted
//   stance;
// - the signature: a tower-sized greatblade, broad as his forearm and longer than his legs, planted point-down beside
//   his right foot, hauled back over the shoulder, swung, and driven down in a held hit in the attack;
// - one bright accent planned: a glowing rune slot in the chest (glow), the eye slits dimmer.
// Silhouette and form only, flat materials: no proc layers but the ground shadow, no texture, no decals.
// Parts are 3D points on the rig (`pose.at(bone, u, fwd, side, up)`) so the body turns; sizes scale from the brief's
// height and ctx.dir.scale.metre; colours are role ramps (R11). The stone is the cloth ramp (the family's recoloured
// ramp: recolour cloth), iron the metal ramp, the grip leather.
export const meta = { brief: 'boss-the-throne-warden', pass: 'r2', recolour: 'cloth', notes: 'shape redraw: stone-and-iron construct, slab-block body, throne-back slab with two pillars, sunk crowned head, huge fists, tower greatblade, rune-slot core' };

export const params = {};

// The sword arm (right) per state and frame: upper arm and forearm (rig angles: 0 = up, 90 = forward), the blade's world
// angle in the body's side plane (fa), spine lean, and the blade's tilt out of that plane (deg, + outward, - across the body).
const CARRY = { up: 158, lo: -40, fa: 180, spine: 0, tilt: 12 };
const SWING = [
  { up: 40, lo: -100, fa: -140, spine: -8, tilt: 30 },  // wind-up: hauled back over the right shoulder, blade behind
  { up: 70, lo: -70, fa: 60, spine: 2, tilt: -55 },     // swing: sweeping across the body at head height
  { up: 112, lo: -6, fa: 150, spine: 14, tilt: -18 },   // the hit (held): driven down before it
  { up: 150, lo: -34, fa: 172, spine: 5, tilt: 6 },     // recovery: back toward the planted carry
];

function layout(ctx) {
  const [w, h] = ctx.size, metres = ctx.brief?.height ?? 8.4, ground = Math.round(h * 0.955);
  const H = Math.round(ctx.dir.scale.metre * metres * 0.92), U = H / 66;
  const rig = ctx.lib.rigs.body('biped', ctx, { ground, height: H, proportions: { hip: 0.02, neck: 0.04, head: 0.09, leg_up: 0.16, leg_lo: 0.15, arm_up: 0.19, arm_lo: 0.17, armSep: 0.22, legSep: 0.13, shoulder: 0.84 } });
  const base = rig.pose(ctx.state, ctx.t), A = base.angles;
  const f = ctx.frame ?? Math.floor((ctx.t ?? 0) * 4);
  const walkSwing = ctx.state === 'walk' ? 4 * Math.sin((ctx.t ?? 0) * Math.PI * 2) : 0;
  const arm = ctx.state === 'attack' ? SWING[Math.min(SWING.length - 1, f)] : { ...CARRY, up: CARRY.up + walkSwing };
  // a guardian's bearing: upright, head level; the free left arm hangs bent, fist clenched, out from the body
  const ov = { spine: (A.spine ?? 0) + arm.spine, neck: (A.neck ?? 0), head: (A.head ?? 0) - 2, armR_up: arm.up, armR_lo: arm.lo,
    armL_up: (A.armL_up ?? 180) + (ctx.state === 'attack' ? -14 : 0), armL_lo: (A.armL_lo ?? 4) + 30 };
  const P = rig.pose(ctx.state, ctx.t, { angles: ov });
  return { w, h, U, H, rig, P, arm, ground, front: rig.front, sx: rig.sx, side: rig.side };
}

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), { U, P, front, sx, arm, ground } = L;
  const stone = pal.cloth, iron = pal.metal, grip = pal.leather;
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

  // ---- the throne-back slab behind the shoulders: a squared stone profile in the side plane (z, up), swept through its
  // depth so the side facings show a thick slab; two stepped pillars with cap stones flank a low middle for the head
  {
    const prof = [[-23, 0], [-23, 20], [-25, 20], [-25, 24], [-18, 24], [-18, 30], [-10, 30], [-10, 24], [-7, 15],
      [7, 15], [10, 24], [10, 30], [18, 30], [18, 24], [25, 24], [25, 20], [23, 20], [23, 0]];
    // the rig's iso tilt (0.3) would sink the slab below the shoulders from behind and lift it from the front: it is cancelled
    // for the slab, so the throne back stands at the same height over the shoulders in every facing
    const F0 = -14, F1 = -22, face = f => prof.map(([z, up]) => at('spine', 0.42, f, z, up + (up > 0 ? 4 : 0) + 0.3 * f * front)), fa = face(F0), fb = face(F1);
    // the extruded solid: every edge of the profile swept through the slab's depth, then the face toward the viewer
    const kids = prof.map((_, i) => { const j = (i + 1) % prof.length; return { type: 'poly', name: `slabside${i}`, pts: [fa[i], fa[j], fb[j], fb[i]], mat: stone, shade: 'flat', band: 2 }; })
      .filter(k => Math.abs((k.pts[1][0] - k.pts[0][0]) * (k.pts[3][1] - k.pts[0][1]) - (k.pts[1][1] - k.pts[0][1]) * (k.pts[3][0] - k.pts[0][0])) > 1);
    if (Math.abs(front) > 0.15) kids.push({ type: 'poly', name: 'slabface', pts: front >= 0 ? fa : fb, mat: stone, shade: 'flat', band: 1 });
    put(key(-18, 0), { type: 'group', name: 'throneback', underlay: true, children: kids });
  }

  // ---- legs: a wide planted stance of thick thighs over a knee stone, shins tapering to the ankle, a broad heavy foot
  for (const n of ['L', 'R']) {
    const z = n === 'L' ? -1 : 1, hip = P.start(`leg${n}_up`), knee = at(`leg${n}_up`, 1, 1.2, z * 2.4), ank = P.end(`leg${n}_lo`);
    const toe = at(`leg${n}_lo`, 1, 5.5, z * 2.2, 1.2), heel = at(`leg${n}_lo`, 1, -2.5, 0, 1.2), kp = at(`leg${n}_up`, 1, 3.6, z * 2.4, 0.4);
    put(key(0, z * 7) - 6, { type: 'group', name: `leg${n}`, underlay: true, children: [
      { type: 'capsule', name: 'thigh', a: hip, b: knee, r: r(8.6), r1: r(6.4), mat: stone, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'shin', a: knee, b: ank, r: r(6.4), r1: r(4.4), mat: stone, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'foot', a: heel, b: toe, r: r(4), r1: r(3.4), mat: stone, shade: 'flat', band: 1 },
      { type: 'circle', name: 'knee', cx: kp[0], cy: kp[1], r: r(5.2), mat: stone, shade: 'flat', band: 0 },
    ] });
  }
  // ---- the pelvis block: a heavy rounded stone block over the thighs, its lower edge uneven
  put(0.3, { type: 'path', name: 'pelvis', underlay: true, mat: stone, shade: 'flat', band: 1, d: mass([
    ['spine', 0.12, 11, 11, 1.4], ['spine', 0.0, 13, 13, 1.2], ['hip', 0, 13.5, 13.5, 1], ['leg' + (sx >= 0 ? 'R' : 'L') + '_up', 0.2, 11.5, 12, 1]]) });
  // ---- the body: a massive slab block with rounded corners, broad flat shoulders, tapering to a waist; as deep as wide
  put(0.5, { type: 'path', name: 'torso', underlay: true, mat: stone, shade: 'flat', band: 1, d: mass([
    ['spine', 1.04, 9, 9, 0.6], ['spine', 0.98, 16, 15.5, 1.4], ['spine', 0.9, 17.5, 17, 2.4], ['spine', 0.72, 17, 16.5, 3],
    ['spine', 0.52, 14, 14, 2.4], ['spine', 0.34, 10.5, 11, 1.6], ['spine', 0.2, 9.5, 10, 1.4], ['spine', 0.12, 10, 10, 1.4]]) });
  // the iron belt band across the waist
  put(0.55, { type: 'path', name: 'belt', underlay: true, mat: iron, shade: 'flat', band: 1, d: mass([['spine', 0.22, 10.6, 11, 1.6], ['spine', 0.15, 11, 11.2, 1.5], ['spine', 0.08, 10.8, 11, 1.4]]) });
  // the rune slot: a glowing vertical slot in the chest block, the one bright accent (shown while the chest faces us)
  if (front > 0.2) {
    const c0 = at('spine', 0.8, 3 + 16 * front, 0), c1 = at('spine', 0.6, 2.4 + 14 * front, 0);
    put(0.56, { type: 'group', name: 'core', children: [
      { type: 'rect', name: 'slot', x: Math.round(c0[0] - 2.5), y: Math.round(c0[1]) - 1, w: 5, h: Math.max(4, Math.round(c1[1] - c0[1])) + 2, mat: iron, shade: 'flat', band: 2 },
      { type: 'rect', name: 'rune', x: Math.round(c0[0] - 1), y: Math.round(c0[1]), w: 2, h: Math.max(3, Math.round(c1[1] - c0[1])), color: 'glow.0' },
    ] });
  }
  // ---- the neck: a short thick stone column
  put(0.6, { type: 'capsule', name: 'neck', underlay: true, a: at('spine', 0.95), b: at('head', 0.2), r: r(5), r1: r(4.4), mat: stone, shade: 'flat', band: 2 });

  // ---- arms: a boulder shoulder block raised above the jaw, a thick upper arm, the elbow bend, a forearm swelling to a
  // huge stone fist
  for (const n of ['L', 'R']) {
    const z = n === 'L' ? -1 : 1, sh = at('spine', 0.88, 0.5, z * 14, 0), el = at(`arm${n}_up`, 1, -1.5, z * 9.5), hd = at(`arm${n}_lo`, 1, 0, z * 7);
    const cuff = at(`arm${n}_lo`, 0.7, 0, z * 7.6), bc = at('spine', 0.92, 0.8, z * 14.5, 1.5);
    put(key(1, z * 19), { type: 'group', name: `arm${n}`, underlay: true, children: [
      { type: 'capsule', name: 'upperarm', a: sh, b: el, r: r(7.2), r1: r(5.8), mat: stone, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'forearm', a: el, b: cuff, r: r(5.6), r1: r(7), mat: stone, shade: 'flat', band: 1 },
      { type: 'circle', name: 'fist', cx: hd[0], cy: hd[1], r: r(7.4), mat: stone, shade: 'flat', band: 1 },
    ] });
    // the shoulder block: a rounded boulder, flat-topped, wider than it is tall
    const bw = Math.max(r(7), halfW(8.5, 8.5)), bh = r(6.8);
    put(key(1, z * 19) + 0.2, { type: 'path', name: `shoulder${n}`, underlay: true, mat: stone, shade: 'flat', band: 0, d: curve([
      [bc[0] - bw, bc[1] - bh * 0.7], [bc[0], bc[1] - bh * 1.05], [bc[0] + bw, bc[1] - bh * 0.7],
      [bc[0] + bw * 1.05, bc[1] + bh * 0.5], [bc[0], bc[1] + bh], [bc[0] - bw * 1.05, bc[1] + bh * 0.5]]) });
  }

  // ---- the tower greatblade: a broad slab of a blade tapering only near its point, a heavy squared crossguard, a long
  // grip and a block pommel; the point sinks into the ground line when planted
  {
    const rad = arm.fa * Math.PI / 180, hd = at('armR_lo', 1, 0, 7), bladeLen = 50, gripLen = 9;
    const tr = arm.tilt * Math.PI / 180, dir = [Math.sin(rad) * Math.cos(tr), Math.sin(tr), Math.cos(rad) * Math.cos(tr)];
    const along = t => at('armR_lo', 1, dir[0] * t, 7 + dir[1] * t, dir[2] * t);
    const clampG = p => [p[0], Math.min(p[1], ground)];
    const tip = along(bladeLen), guard = along(3.2), pom = along(-gripLen);
    const d = [tip[0] - guard[0], tip[1] - guard[1]], l = Math.hypot(...d) || 1, ax = [d[0] / l, d[1] / l], nx = [-ax[1], ax[0]];
    const Q = (k, m) => clampG([guard[0] + ax[0] * k + nx[0] * m * U, guard[1] + ax[1] * k + nx[1] * m * U]);
    const bw = 5.2;
    const blade = [Q(0, -bw), Q(l * 0.8, -bw), Q(l, -bw * 0.15), Q(l, bw * 0.15), Q(l * 0.8, bw), Q(0, bw)];
    let bp = `M${M(blade[0])}`; for (let i = 1; i < blade.length; i++) bp += ` L${M(blade[i])}`;
    const gw = 11, gt = 2.2;
    const cross = [Q(-gt, -gw), Q(gt, -gw), Q(gt, gw), Q(-gt, gw)];
    let cp = `M${M(cross[0])}`; for (let i = 1; i < cross.length; i++) cp += ` L${M(cross[i])}`;
    const pm = [Q(-gripLen * U - 3 * U, -3), Q(-gripLen * U + 1.5 * U, -3), Q(-gripLen * U + 1.5 * U, 3), Q(-gripLen * U - 3 * U, 3)];
    let pp = `M${M(pm[0])}`; for (let i = 1; i < pm.length; i++) pp += ` L${M(pm[i])}`;
    const kf = key(dir[0] * bladeLen * 0.3 + 2, 21 + dir[1] * bladeLen * 0.3) + (ctx.state === 'attack' ? 0 : 3);
    put(kf, { type: 'group', name: 'sword', underlay: true, children: [
      { type: 'path', name: 'blade', d: bp + ' Z', mat: iron, shade: 'flat', band: 0 },
      { type: 'capsule', name: 'grip', a: guard, b: pom, r: r(1.9), mat: grip, shade: 'flat', band: 1 },
      { type: 'path', name: 'crossguard', d: cp + ' Z', mat: iron, shade: 'flat', band: 1 },
      { type: 'path', name: 'pommel', d: pp + ' Z', mat: iron, shade: 'flat', band: 1 },
    ] });
    // the stone fist closes over the grip, in front of it
    put(kf + 0.1, { type: 'circle', name: 'grip-fist', underlay: true, cx: hd[0], cy: hd[1], r: r(7.4), mat: stone, shade: 'flat', band: 1 });
  }

  // ---- the head: a small squared stone head with a heavy jaw, sunk on the neck between the shoulder blocks, the dim
  // slit eyes; crowned by the five-spiked iron crown, wider than the head, the same in every facing
  {
    const hc = at('head', 0.5, 0.6), topY = at('head', 1.0)[1], jaw = at('head', 0.0, 1.8), hw = halfW(4.8, 5.4), jw = halfW(5.4, 6);
    const ring = [[hc[0], topY], [hc[0] + hw, topY + 0.8 * U], [hc[0] + hw, hc[1]], [hc[0] + jw, hc[1] + 2.6 * U],
      [hc[0] + jw * 0.75, jaw[1] + 0.6 * U], [hc[0], jaw[1] + 0.8 * U], [hc[0] - jw * 0.75, jaw[1] + 0.6 * U], [hc[0] - jw, hc[1] + 2.6 * U],
      [hc[0] - hw, hc[1]], [hc[0] - hw, topY + 0.8 * U]];
    const kids = [{ type: 'path', name: 'head', d: curve(ring), mat: stone, shade: 'flat', band: 1 }];
    const cb = at('head', 0.86, 0.4), cw = Math.max(halfW(6.4, 6.4), 6.2 * U), by = cb[1], bh = 2.4 * U;
    const spikes = [[-1, 4.6], [-0.5, 7], [0, 9.4], [0.5, 7], [1, 4.6]];
    const pts = [[cb[0] - cw, by + bh]];
    spikes.forEach(([fx, ht], i) => {
      const x = cb[0] + fx * cw, dx = cw * 0.17;
      if (i) pts.push([x - dx, by]);
      pts.push([x, by - ht * U]);
      if (i < spikes.length - 1) pts.push([x + dx, by]);
    });
    pts.push([cb[0] + cw, by + bh]);
    kids.push({ type: 'poly', name: 'crown', pts, mat: iron, shade: 'flat', band: 1 });
    if (front > -0.2) for (const zz of [-1, 1]) {
      if (L.side > 0.9 && zz * sx < 0) continue;
      const e = at('head', 0.46, 5, zz * 2.2);
      kids.push({ type: 'rect', name: 'slit', x: Math.round(e[0] - (L.side > 0.9 ? 0.5 : 1)), y: Math.round(e[1]), w: L.side > 0.9 ? 2 : 3, h: 1, color: 'glow.1' });
    }
    put(front < -0.2 ? key(-18, 0) + 0.5 : 40, { type: 'group', name: 'headgroup', underlay: true, children: kids });
  }

  parts.sort((a, b) => a.k - b.k).forEach(p => s.add(p.node));
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}

// named points per frame: head and hand (the sword's grip) follow the rig
export const anchors = ctx => {
  const L = layout(ctx), a = L.rig.anchors(L.P);
  delete a.ground;
  return a;
};
