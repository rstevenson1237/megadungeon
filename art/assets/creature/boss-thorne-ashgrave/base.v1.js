// boss-thorne-ashgrave base.v1 (r1) — SHAPE DRAFT (shape gate): silhouette and form only, flat materials, no proc layers.
// Thorne Ashgrave, a unique boss of the K family (death knights and dread lords): an ash-grey undead brute knight on the
// shared biped rig (`ctx.lib.rigs.body`), drawn 4.7 m against the player. What sets him apart from the plain family knight
// (horned helm, greatsword point-down): a hunched, top-heavy wedge of plate with huge round pauldrons, an egg-shaped great
// helm ringed by a CROWN OF THORNS (long iron spikes fanning out of the brow band, the same in every facing), a tattered
// cloak that flares to a ragged hem, and a huge serrated grave-cleaver carried on his right shoulder, swung overhead and
// chopped down across the body in the attack (wind-up, held hit, follow-through). Every part is built from 3D points on
// the rig (`pose.at(bone, u, fwd, side, up)`) so the body turns in the three-quarter facings; every size scales from the
// brief's height and ctx.dir.scale.metre, every colour is a role ramp (R11).
export const meta = { brief: 'boss-thorne-ashgrave', pass: 'r1', recolour: 'stone', notes: 'shape draft: hunched ash knight, crown of thorns, ragged cloak, shoulder-borne grave-cleaver' };

// right arm (holds the cleaver) per state and frame: upper arm, forearm (rig angles, 0 = up, 90 = forward), spine lean,
// the blade's angle off the forearm and its tip's sideways reach (in body units)
const CARRY = { up: 162, lo: -118, off: -70, tipSide: 13, spine: 0 };
const SWING = [
  { up: 120, lo: -70, off: -50, tipSide: 8, spine: 2 },     // gathers the cleaver off the shoulder
  { up: -14, lo: -34, off: -6, tipSide: 10, spine: -8 },    // wind-up: high over the head, leaning back
  { up: 96, lo: -6, off: 8, tipSide: -10, spine: 14 },      // the hit (held): chopped forward and across the body
  { up: 140, lo: -10, off: 14, tipSide: -15, spine: 9 },    // follow-through, low across the far side
];

function layout(ctx) {
  const [w, h] = ctx.size, metres = ctx.brief?.height ?? 4.7, ground = Math.round(h * 0.95);
  const H = Math.round(ctx.dir.scale.metre * metres * 0.88), U = H / 66;
  const rig = ctx.lib.rigs.body('biped', ctx, { ground, height: H, proportions: { head: 0.16, neck: 0.035, hip: 0.02, leg_up: 0.2, leg_lo: 0.2, arm_up: 0.19, arm_lo: 0.18, armSep: 0.24, legSep: 0.085 } });
  const base = rig.pose(ctx.state, ctx.t), A = base.angles;
  const arm = ctx.state === 'attack' ? SWING[Math.min(SWING.length - 1, ctx.frame ?? Math.floor(ctx.t * 4))] : CARRY;
  // the brute's hunch: the spine leans forward and the head juts; the free left arm hangs with a bent elbow
  const ov = { spine: (A.spine ?? 0) + 14 + arm.spine, neck: (A.neck ?? 0) + 6, head: (A.head ?? 0) - 12, armR_up: arm.up, armR_lo: arm.lo, armL_up: (A.armL_up ?? 180) - 6, armL_lo: (A.armL_lo ?? 4) - 22 };
  const P = rig.pose(ctx.state, ctx.t, { angles: ov });
  return { w, h, U, H, rig, P, arm, ground, front: rig.front, sx: rig.sx, side: rig.side };
}

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), { U, P, front, sx, arm } = L;
  const armour = pal.stone, steel = pal.metal, iron = pal.hair, cloak = pal.leather;
  const r = n => Math.max(1, n * U), key = (f, z) => f * front + z * sx; // depth toward the viewer
  const at = (b, u, f = 0, z = 0, up = 0) => P.at(b, u, f * U, z * U, up * U);
  // an elliptic cross-section's screen half-width seen at this yaw, so masses narrow and deepen as the body turns
  const halfW = (W, D) => Math.hypot(W * front, D * sx) * U;
  const M = p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  // a smooth closed mass through cross-sections [bone, u, W, D, fwd]: left side down, right side up
  const mass = rows => {
    const pts = rows.map(([b, u, W, D, f]) => { const c = at(b, u, f); return { c, hw: halfW(W, D) }; });
    const left = pts.map(p => [p.c[0] - p.hw, p.c[1]]), right = pts.map(p => [p.c[0] + p.hw, p.c[1]]).reverse();
    const ring = [...left, ...right];
    let d = `M${M(ring[0])}`;
    for (let i = 1; i < ring.length; i++) { const a = ring[i - 1], b = ring[i]; d += ` Q${M(a)} ${M([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2])}`; }
    return d + ` L${M(ring[ring.length - 1])} Z`;
  };
  const parts = [];
  const put = (k, node) => parts.push({ k, node });

  // the ragged cloak: from behind the shoulders, flaring back and out to an uneven hem at the shins
  {
    const top = [-9.5, 9.5].map(z => at('spine', 0.92, -7, z)), hem = [];
    const n = 9, hemZ = 14, cut = [0, 5, 1, 7, 2, 6, 0, 8, 3];
    for (let i = 0; i <= n - 1; i++) { const u = i / (n - 1), z = hemZ - 2 * hemZ * u, low = (i % 2 ? -1 : 1) * 0.5 + cut[i] * 0.6; hem.push(at('hip', 0, -15 - 12 * Math.sin(u * Math.PI), z, -24 + low)); }
    const sideL = at('spine', 0.4, -12, 12.5), sideR = at('spine', 0.4, -12, -12.5);
    const ring = [top[1], sideL, ...hem, sideR, top[0]];
    let d = `M${M(ring[0])}`; for (let i = 1; i < ring.length; i++) d += ` L${M(ring[i])}`;
    // its fall seen side-on: from the shoulder blades down the back and trailing behind to the ragged hem
    const drape = [at('spine', 0.95, -6, 3), at('spine', 0.5, -12, 3), at('hip', 0, -20, 3, -14), at('hip', 0, -27, 3, -23), at('hip', 0, -23, 1, -21), at('hip', 0, -20, 0, -25), at('hip', 0, -16, -1, -22), at('hip', 0, -12, -2, -25.5), at('hip', 0, -8, -3, -21), at('hip', 0, -5, -3, 0)];
    let dd = `M${M(drape[0])}`; for (let i = 1; i < drape.length; i++) dd += ` L${M(drape[i])}`;
    put(front < -0.3 ? key(-9, 0) : -40, { type: 'group', name: 'cloak', underlay: true, mat: cloak, shade: 'flat', band: 1, children: [
      { type: 'path', name: 'cloak', d: d + ' Z', mat: cloak, shade: 'flat', band: 1 },
      { type: 'path', name: 'cloakfall', d: dd + ' Z', mat: cloak, shade: 'flat', band: 1 },
    ] });
  }
  // legs: tapered thigh and shin with a knee cop, a pointed sabaton
  for (const n of ['L', 'R']) {
    const z = n === 'L' ? -1 : 1, kneeA = P.end(`leg${n}_up`), foot = P.end(`leg${n}_lo`), toe = at(`leg${n}_lo`, 1, 4.2, 0, 0.6);
    put(key(0.5, z * 5.6) - 3, { type: 'group', name: `leg${n}`, underlay: true, mat: armour, shade: 'flat', band: 1, children: [
      { type: 'capsule', name: 'thigh', a: P.start(`leg${n}_up`), b: kneeA, r: r(4.2), r1: r(3.1), mat: armour, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'shin', a: kneeA, b: foot, r: r(3.2), r1: r(2.2), mat: armour, shade: 'flat', band: 1 },
      { type: 'ellipse', name: 'knee', cx: kneeA[0], cy: kneeA[1], rx: r(3.1), ry: r(2.6), mat: armour, shade: 'flat', band: 2 },
      { type: 'capsule', name: 'sabaton', a: foot, b: toe, r: r(2.3), r1: r(1.1), mat: iron, shade: 'flat', band: 1 },
    ] });
  }
  // the plated skirt: flares from the waist to an uneven, curved hem at mid-thigh
  put(0.2, { type: 'path', name: 'tassets', underlay: true, mat: armour, shade: 'flat', band: 1, d: mass([['spine', 0.06, 7, 5.5, 0.5], ['hip', 0, 9, 6.5, 0.8], ['hip', 0, 10.5, 7, 1, ], ['leg' + (sx >= 0 ? 'R' : 'L') + '_up', 0.55, 11, 7.5, 1.2]]) });
  // the torso: a top-heavy wedge, a broad barrel chest over a narrow waist, pushed forward by the hunch
  put(0.5, { type: 'path', name: 'torso', underlay: true, mat: armour, shade: 'flat', band: 1, d: mass([['spine', 1.02, 9, 8, 0.5], ['spine', 0.84, 13, 10, 2.4], ['spine', 0.58, 11.5, 9.5, 2.8], ['spine', 0.3, 8, 7.5, 1.4], ['spine', 0.04, 6, 6, 0.4]]) });
  // the gorget: a short neck collar between the pauldrons
  put(0.6, { type: 'capsule', name: 'gorget', a: P.start('neck'), b: P.end('neck'), r: r(4.2), r1: r(3.6), mat: armour, shade: 'flat', band: 2, underlay: true });

  // arms: upper arm and forearm tapered with an elbow, a big gauntlet; huge round pauldrons on top
  for (const n of ['L', 'R']) {
    const z = n === 'L' ? -1 : 1, sh = P.start(`arm${n}_up`), el = at(`arm${n}_up`, 1, -0.5, z * 3), hd = at(`arm${n}_lo`, 1, 0, z * (n === 'R' && ctx.state !== 'attack' ? 0 : 1.2));
    const k = key(1.2, z * 15.8);
    put(k, { type: 'group', name: `arm${n}`, underlay: true, children: [
      { type: 'capsule', name: 'upperarm', a: sh, b: el, r: r(3.3), r1: r(2.7), mat: armour, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'forearm', a: el, b: hd, r: r(2.9), r1: r(2.3), mat: armour, shade: 'flat', band: 1 },
      { type: 'circle', name: 'elbow', cx: el[0], cy: el[1], r: r(2.8), mat: armour, shade: 'flat', band: 2 },
      { type: 'circle', name: 'gauntlet', cx: hd[0], cy: hd[1], r: r(2.8), mat: iron, shade: 'flat', band: 1 },
    ] });
    const pc = at('spine', 0.97, 0.5, z * 13.8, 1.2);
    put(k + 0.4, { type: 'ellipse', name: `pauldron${n}`, cx: pc[0], cy: pc[1], rx: halfW(6.4, 6), ry: r(5.4), mat: armour, shade: 'flat', band: 1, underlay: true });
  }

  // the grave-cleaver: a broad blade with a serrated (thorned) back, a crossguard and a long grip, along the forearm
  {
    const fa = (P.angles.spine ?? 0) + arm.up + arm.lo + arm.off, rad = fa * Math.PI / 180, len = 28, gripL = 5;
    const hand = at('armR_lo', 1), hand3 = (t, sideOff = 0, wid = 0) => at('armR_lo', 1, Math.sin(rad) * t + 0.55 * Math.cos(rad) * wid, sideOff * (t / len) + 0.85 * wid, Math.cos(rad) * t - 0.55 * Math.sin(rad) * wid);
    // points along the blade (t from the hand), its width to the edge side (+) and back side (-)
    const pt = (t, wid) => hand3(t, arm.tipSide, wid);
    const edge = [[gripL, 4], [gripL + 8, 5.8], [gripL + 17, 6.8], [len, 6.4], [len + 2, 1]];
    const back = [[len, -2.4], [len - 3, -4.2], [len - 6, -2.4], [len - 9, -4.2], [len - 12, -2.4], [len - 15, -4.2], [len - 18, -2.4], [gripL, -2.4]];
    let d = `M${M(pt(gripL, 0))}`; for (const [t, wd] of [...edge, ...back]) d += ` L${M(pt(t, wd))}`;
    const gA = pt(gripL, -5.2), gB = pt(gripL, 6), pommel = pt(-gripL, 0);
    const mid = len * 0.5, kf = Math.sin(rad) * mid * front + (15.8 + arm.tipSide * 0.5) * sx;
    put(kf + (ctx.state === 'attack' ? 0 : 4), { type: 'group', name: 'cleaver', underlay: true, children: [
      { type: 'capsule', name: 'grip', a: pommel, b: pt(gripL, 0), r: r(1.2), mat: cloak, shade: 'flat', band: 2 },
      { type: 'path', name: 'blade', d: d + ' Z', mat: steel, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'guard', a: gA, b: gB, r: r(1.3), mat: iron, shade: 'flat', band: 1 },
      { type: 'circle', name: 'pommel', cx: pommel[0], cy: pommel[1], r: r(1.6), mat: iron, shade: 'flat', band: 1 },
    ] });
    void hand;
  }

  // the head: an egg-shaped great helm (round crown, narrower jaw) on the gorget, ringed by a crown of thorns
  {
    const hc = at('head', 0.5, 0.6), top = at('head', 1.05), jaw = at('head', 0.02, 1.2), hw = halfW(5.2, 5.8);
    const helm = `M${M([hc[0] - hw, hc[1] - 0.5 * U])} Q${M([hc[0] - hw, top[1]])} ${M([hc[0], top[1]])} Q${M([hc[0] + hw, top[1]])} ${M([hc[0] + hw, hc[1] - 0.5 * U])} Q${M([hc[0] + hw * 0.92, jaw[1]])} ${M([jaw[0], jaw[1] + 0.5 * U])} Q${M([hc[0] - hw * 0.92, jaw[1]])} ${M([hc[0] - hw, hc[1] - 0.5 * U])} Z`;
    const brow = at('head', 0.68), spikes = [];
    // seven thorns fanned around the brow band; the band is a ring, so the fan reads the same from every side
    const fan = [[-1, 0.72, 6.4], [-0.66, 0.9, 9.4], [-0.33, 1, 7.4], [0, 1, 11.5], [0.33, 1, 7.8], [0.66, 0.9, 9.8], [1, 0.72, 6.8]];
    for (const [k2, lift, l] of fan) {
      const bx = brow[0] + k2 * hw * 1.02, by = brow[1] - lift * 1.2 * U, ang = k2 * 0.95, tx = bx + Math.sin(ang) * l * U, ty = by - Math.cos(ang) * l * U, nx = Math.cos(ang) * 1.5 * U, ny = Math.sin(ang) * 1.5 * U;
      spikes.push({ type: 'poly', name: 'thorn', pts: [[bx - nx, by - ny], [tx, ty], [bx + nx, by + ny]], mat: iron, shade: 'flat', band: 1 });
    }
    const kids = [
      ...spikes,
      { type: 'path', name: 'helm', d: helm, mat: armour, shade: 'flat', band: 1 },
      { type: 'ellipse', name: 'crownband', cx: brow[0], cy: brow[1], rx: hw + 0.6 * U, ry: r(1.6), mat: iron, shade: 'flat', band: 1 },
    ];
    // the visor's burning slit: seen from the front and the three-quarter views, gone from behind
    if (front > -0.2) {
      const ex = at('head', 0.5, 5.6)[0], ey = Math.round(hc[1] + 0.4 * U), sw = Math.max(2, Math.round(hw * (profileW(front, sx)) * 1.2));
      kids.push({ type: 'rect', name: 'slit', x: Math.round(ex - sw / 2), y: ey, w: sw, h: Math.max(1, Math.round(U)), color: 'accent.1' });
    }
    put(key(1.6, 0) + 1.5, { type: 'group', name: 'head', underlay: true, children: kids });
  }

  parts.sort((a, b) => a.k - b.k).forEach(p => s.add(p.node));
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}
// the slit narrows as the helm turns away into profile
function profileW(front, sx) { return 0.35 + 0.55 * Math.max(0, front) + 0.2 * Math.abs(sx) * (front > 0 ? 0 : 1); }

// named points per frame: head and hand (the cleaver's grip) follow the rig
export const anchors = ctx => {
  const L = layout(ctx), a = L.rig.anchors(L.P);
  delete a.ground;
  return a;
};
