// boss-the-throne-warden base.v1 (r1) — SHAPE DRAFT (shape gate): silhouette and form only, flat materials, no proc layers.
// The Throne Warden (glyph C, slate, a slow construct brute of the void halls), a unique boss of the golem family
// (family-c-cap: a slate-stone golem with a small head sunk low and glowing slit eyes), 8.4 m against the player (about
// 134 px), on the shared biped rig (`ctx.lib.rigs.body`). What sets it apart from the plain block golem: it is the
// crowned sentinel that guards the throne. A huge inverted-pear stone chest over a narrow waist, two great domed
// pauldrons that set its shoulders wider than half its height, a small helmed head on a thick neck between them, crowned
// by a tall five-spiked iron crown (the same in every facing); a short flaring fauld skirt with an uneven hem over a wide
// stance of thick tapered legs with knee plates; heavy arms bent at the elbow with big gauntlet fists; and its signature,
// an oversized greatsword planted point-down beside its right foot, hauled back over the shoulder, swung in a high arc and
// driven down in a held hit in the attack. One bright accent is planned: the glowing eye slits (glow ramp), later the
// sword's fuller. Parts are 3D points on the rig (`pose.at(bone, u, fwd, side, up)`) so the body turns in the
// three-quarter facings; sizes scale from the brief's height and ctx.dir.scale.metre; colours are role ramps (R11).
// The body stays in the cloth ramp (the family's recoloured ramp: recolour cloth).
export const meta = { brief: 'boss-the-throne-warden', pass: 'r1', recolour: 'cloth', notes: 'shape draft: crowned stone sentinel, domed pauldrons, pear chest, flaring faulds, wide stance, planted greatsword' };

export const params = {};

// The sword arm (right) per state and frame: upper arm and forearm (rig angles: 0 = up, 90 = forward), the blade's world
// angle in the body's side plane (fa), spine lean, and the blade's tilt out of that plane (deg, + outward, - across the body).
const CARRY = { up: 170, lo: -26, fa: 180, spine: 0, tilt: 9 };
const SWING = [
  { up: 60, lo: -96, fa: -150, spine: -8, tilt: 28 },  // wind-up: hauled back over the right shoulder, blade hanging behind
  { up: 70, lo: -70, fa: 60, spine: 2, tilt: -55 },    // swing: sweeping across the body at head height
  { up: 112, lo: -6, fa: 150, spine: 14, tilt: -18 },  // the hit (held): driven down before it
  { up: 150, lo: -30, fa: 172, spine: 5, tilt: 4 },   // recovery: back toward the planted carry
];

function layout(ctx) {
  const [w, h] = ctx.size, metres = ctx.brief?.height ?? 8.4, ground = Math.round(h * 0.955);
  const H = Math.round(ctx.dir.scale.metre * metres * 0.92), U = H / 66;
  const rig = ctx.lib.rigs.body('biped', ctx, { ground, height: H, proportions: { hip: 0.02, neck: 0.05, head: 0.1, leg_up: 0.17, leg_lo: 0.16, arm_up: 0.19, arm_lo: 0.17, armSep: 0.23, legSep: 0.11, shoulder: 0.87 } });
  const base = rig.pose(ctx.state, ctx.t), A = base.angles;
  const f = ctx.frame ?? Math.floor((ctx.t ?? 0) * 4);
  const walkSwing = ctx.state === 'walk' ? 4 * Math.sin((ctx.t ?? 0) * Math.PI * 2) : 0;
  const arm = ctx.state === 'attack' ? SWING[Math.min(SWING.length - 1, f)] : { ...CARRY, up: CARRY.up + walkSwing };
  // a sentinel's bearing: upright, head level; the free left arm hangs bent, fist clenched, a little out from the body
  const ov = { spine: (A.spine ?? 0) + arm.spine, neck: (A.neck ?? 0), head: (A.head ?? 0) - 2, armR_up: arm.up, armR_lo: arm.lo,
    armL_up: (A.armL_up ?? 180) + (ctx.state === 'attack' ? -14 : 0), armL_lo: (A.armL_lo ?? 4) + 26 };
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

  // ---- legs: a wide stance of thick thighs over a round knee plate, shins tapering to the ankle, a heavy rounded foot
  for (const n of ['L', 'R']) {
    const z = n === 'L' ? -1 : 1, hip = P.start(`leg${n}_up`), knee = at(`leg${n}_up`, 1, 1.2, z * 1.6), ank = P.end(`leg${n}_lo`);
    const toe = at(`leg${n}_lo`, 1, 5, z * 1.4, 1), heel = at(`leg${n}_lo`, 1, -2, 0, 1), kp = at(`leg${n}_up`, 1, 3.4, z * 1.6, 0.4);
    put(key(0, z * 7) - 6, { type: 'group', name: `leg${n}`, underlay: true, children: [
      { type: 'capsule', name: 'thigh', a: hip, b: knee, r: r(7.4), r1: r(5.6), mat: stone, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'shin', a: knee, b: ank, r: r(5.6), r1: r(3.8), mat: stone, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'foot', a: heel, b: toe, r: r(3.4), r1: r(2.8), mat: stone, shade: 'flat', band: 1 },
      { type: 'circle', name: 'knee', cx: kp[0], cy: kp[1], r: r(4.6), mat: stone, shade: 'flat', band: 0 },
    ] });
  }
  // ---- the faulds: a stone skirt from the belt flaring out to an uneven hem at mid-thigh; its outline is the waist ring's
  // sides and the near half of the hem ring, so it turns with the body
  {
    const n = 24, drops = [0, 2.6, 0.6, 3.6, 1.2, 2.2, 0, 3.2, 0.8, 2.8, 0.2, 3.4];
    const ringAt = (i, rf, rz, f0, bone, u, up) => { const a = (i / n) * Math.PI * 2; return { d: (rf * Math.cos(a) + f0) * front + rz * Math.sin(a) * sx, p: at(bone, u, rf * Math.cos(a) + f0, rz * Math.sin(a), up) }; };
    const hemR = Array.from({ length: n }, (_, i) => ringAt(i, 14, 20, 1, 'hip', 0, -6.5 - 1.3 * drops[i % drops.length]));
    const topR = Array.from({ length: n }, (_, i) => ringAt(i, 9.5, 13, 1.4, 'spine', 0.05, 0));
    let start = 0; for (let i = 0; i < n; i++) if (hemR[i].d >= 0 && hemR[(i + n - 1) % n].d < 0) start = i;
    const arc = []; for (let j = 0; j < n; j++) { const i = (start + j) % n; if (hemR[i].d < 0) break; arc.push(i); }
    const i0 = arc[0], i1 = arc[arc.length - 1];
    const ring = [topR[(i1 + 1) % n].p, ...arc.map(i => hemR[i].p).reverse(), topR[(i0 + n - 1) % n].p];
    put(0.3, { type: 'path', name: 'faulds', underlay: true, mat: stone, shade: 'flat', band: 2, d: curve(ring.reverse()) });
  }
  // ---- the torso: a great inverted pear, a deep swelling chest narrowing to a waist over the belt; sloping up to the neck
  put(0.5, { type: 'path', name: 'torso', underlay: true, mat: stone, shade: 'flat', band: 1, d: mass([
    ['spine', 1.06, 8, 10, 0.4], ['spine', 0.97, 17, 17, 1.6], ['spine', 0.84, 20.5, 20, 4], ['spine', 0.66, 18, 18.5, 4.6],
    ['spine', 0.46, 12.5, 14, 3], ['spine', 0.26, 10, 11, 1.6], ['spine', 0.1, 11, 11, 1.4], ['spine', 0.0, 10.5, 10.5, 1]]) });
  put(0.55, { type: 'path', name: 'belt', underlay: true, mat: stone, shade: 'flat', band: 2, d: mass([['spine', 0.14, 11.4, 11.6, 1.8], ['spine', 0.06, 11.6, 11.8, 1.6], ['spine', -0.02, 11.4, 11.6, 1.4]]) });
  // ---- the neck: a thick stone column between the pauldrons
  put(0.6, { type: 'capsule', name: 'neck', underlay: true, a: at('spine', 0.96), b: at('head', 0.2), r: r(4), r1: r(3.4), mat: stone, shade: 'flat', band: 2 });

  // ---- arms: a domed pauldron over the shoulder, a heavy upper arm, the elbow bend, a forearm flaring to a gauntlet cuff
  // and a big fist
  for (const n of ['L', 'R']) {
    const z = n === 'L' ? -1 : 1, sh = at('spine', 0.9, 0.5, z * 14.5, 0), el = at(`arm${n}_up`, 1, -1.5, z * 10), hd = at(`arm${n}_lo`, 1, 0, z * 8);
    const cuff = at(`arm${n}_lo`, 0.72, 0, z * 8.6), pd = at('spine', 0.9, 0.5, z * 16.5, -0.5);
    put(key(1, z * 18), { type: 'group', name: `arm${n}`, underlay: true, children: [
      { type: 'capsule', name: 'upperarm', a: sh, b: el, r: r(6.2), r1: r(5), mat: stone, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'forearm', a: el, b: cuff, r: r(4.6), r1: r(5.6), mat: stone, shade: 'flat', band: 1 },
      { type: 'circle', name: 'fist', cx: hd[0], cy: hd[1], r: r(5), mat: stone, shade: 'flat', band: 1 },
    ] });
    // the pauldron: a broad dome whose rim overhangs the upper arm, with a second smaller plate under it
    const pr = halfW(10, 9.5), lip = at('spine', 0.86, 0.5, z * 19, -3.5);
    put(key(1, z * 18) + 0.2, { type: 'group', name: `pauldron${n}`, underlay: true, children: [
      { type: 'ellipse', name: 'lame', cx: lip[0], cy: lip[1], rx: Math.max(r(6), pr * 0.62), ry: r(4.2), mat: stone, shade: 'flat', band: 2 },
      { type: 'path', name: 'pauldron', mat: stone, shade: 'flat', band: 0, d: curve([
        [pd[0] - pr, pd[1] + r(3.2)], [pd[0] - pr * 0.95, pd[1] - r(3.6)], [pd[0], pd[1] - r(6.6)], [pd[0] + pr * 0.95, pd[1] - r(3.6)], [pd[0] + pr, pd[1] + r(3.2)], [pd[0], pd[1] + r(4.4)]]) },
    ] });
  }

  // ---- the greatsword: a long tapering blade from the right fist, a wide crossguard across it, a grip and a round
  // pommel above; the tip never sinks below the ground line
  {
    const rad = arm.fa * Math.PI / 180, hd = at('armR_lo', 1, 0, 8), bladeLen = 33, gripLen = 6;
    const tr = arm.tilt * Math.PI / 180, dir = [Math.sin(rad) * Math.cos(tr), Math.sin(tr), Math.cos(rad) * Math.cos(tr)];
    const along = t => at('armR_lo', 1, dir[0] * t, 8 + dir[1] * t, dir[2] * t);
    const clampG = p => [p[0], Math.min(p[1], ground - 1)];
    const tip = clampG(along(bladeLen)), guard = along(2.6), pom = along(-gripLen);
    const d = [tip[0] - guard[0], tip[1] - guard[1]], l = Math.hypot(...d) || 1, ax = [d[0] / l, d[1] / l], nx = [-ax[1], ax[0]];
    const Q = (k, m) => clampG([guard[0] + ax[0] * k + nx[0] * m * U, guard[1] + ax[1] * k + nx[1] * m * U]);
    const bw = 2.8;
    const blade = [Q(0, -bw), Q(l * 0.55, -bw * 0.92), Q(l * 0.86, -bw * 0.7), Q(l, 0), Q(l * 0.86, bw * 0.7), Q(l * 0.55, bw * 0.92), Q(0, bw)];
    let bp = `M${M(blade[0])}`; for (let i = 1; i < blade.length; i++) bp += ` L${M(blade[i])}`;
    const gw = 8.5, gt = 1.5;
    const cross = [Q(-gt, -gw), Q(gt * 0.6, -gw - 0.6), Q(gt, 0), Q(gt * 0.6, gw + 0.6), Q(-gt, gw), Q(-gt * 1.6, 0)];
    let cp = `M${M(cross[0])}`; for (let i = 1; i < cross.length; i++) cp += ` L${M(cross[i])}`;
    const kf = key(dir[0] * bladeLen * 0.3 + 2, 18 + dir[1] * bladeLen * 0.3) + (ctx.state === 'attack' ? 0 : 3);
    put(kf, { type: 'group', name: 'sword', underlay: true, children: [
      { type: 'path', name: 'blade', d: bp + ' Z', mat: iron, shade: 'flat', band: 0 },
      { type: 'capsule', name: 'grip', a: guard, b: pom, r: r(1.6), mat: grip, shade: 'flat', band: 1 },
      { type: 'path', name: 'crossguard', d: cp + ' Z', mat: iron, shade: 'flat', band: 1 },
      { type: 'circle', name: 'pommel', cx: pom[0], cy: pom[1], r: r(2.4), mat: iron, shade: 'flat', band: 1 },
    ] });
    // the gauntlet closes over the grip: the right fist again, in front of it
    put(kf + 0.1, { type: 'circle', name: 'grip-fist', underlay: true, cx: hd[0], cy: hd[1], r: r(5), mat: stone, shade: 'flat', band: 1 });
  }

  // ---- the head: a small rounded helm with a jutting visor jaw on the neck, the family's glowing slits; crowned by a tall
  // five-spiked iron crown, wider than the helm, the same in every facing
  {
    const hc = at('head', 0.5, 0.6), topY = at('head', 1.0)[1], jaw = at('head', 0.0, 1.8), hw = halfW(5.2, 5.8), jw = halfW(5.6, 6.4);
    const ring = [[hc[0], topY], [hc[0] + hw * 0.9, topY + 1.4 * U], [hc[0] + hw, hc[1]], [hc[0] + jw, hc[1] + 2.6 * U],
      [hc[0] + jw * 0.6, jaw[1] + 0.4 * U], [hc[0], jaw[1] + 0.8 * U], [hc[0] - jw * 0.6, jaw[1] + 0.4 * U], [hc[0] - jw, hc[1] + 2.6 * U],
      [hc[0] - hw, hc[1]], [hc[0] - hw * 0.9, topY + 1.4 * U]];
    const kids = [{ type: 'path', name: 'helm', d: curve(ring), mat: stone, shade: 'flat', band: 1 }];
    // the crown: a band round the brow and five spikes, the middle one tallest
    const cb = at('head', 0.86, 0.4), cw = Math.max(halfW(6.6, 6.6), 6.4 * U), by = cb[1], bh = 2.4 * U;
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
    // two glowing slits under the crown band, toward the facing
    if (front > -0.2) for (const zz of [-1, 1]) {
      if (L.side > 0.9 && zz * sx < 0) continue;
      const e = at('head', 0.46, 5, zz * 2.2);
      kids.push({ type: 'rect', name: 'slit', x: Math.round(e[0] - (L.side > 0.9 ? 0.5 : 1)), y: Math.round(e[1]), w: L.side > 0.9 ? 2 : 3, h: 1, color: 'glow.0' });
    }
    put(front < -0.2 ? key(1.6, 0) + 1.5 : 40, { type: 'group', name: 'headgroup', underlay: true, children: kids });
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
