// boss-thorne-ashgrave base.v2 (r2) — DECORATION PASS on the approved base.v1 shape (stage shape approved 2026-11-13).
// What changed vs v1:
//  - the whole figure moves 4 px down (ground row +4) so the sabatons sit on the pivot row (v1 failed shape-pivot);
//    that translation is the only change to the outline, as the approval note asked;
//  - the plate moves from stone to the cloth ramp, the family K body ramp (family-k-cap recolours cloth), so the
//    boss takes his row colour (ash) in game; meta.recolour follows;
//  - flat fills become lit forms under the direction's light (upper left): cylinders for limbs, gorget, grip and
//    straps, round 'normal' masses for torso, tassets, helm and spheres for pauldrons, knees, elbows, gauntlets;
//  - a readable face inside the helm: two burning eye points and a nasal bar in front and three-quarter views, a
//    dark breathing grille below; from behind the helm shows its back seam and the cloak's fold creases instead;
//  - procedural layers: ao in the joints, rim light on the away side, low material noise on the cloak, a thorn
//    sigil decal on the breastplate, ash smears on the tassets, notches on the cleaver's edge, and a lit fuller
//    down the blade so the steel reads apart from the cloth plate.
export const meta = { brief: 'boss-thorne-ashgrave', pass: 'r2', recolour: 'cloth', notes: 'decorated: lit plate on the family cloth ramp, burning eyes, thorn sigil, notched cleaver' };

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
  const [w, h] = ctx.size, metres = ctx.brief?.height ?? 4.7, ground = Math.round(h * 0.95) + 4;
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
  const armour = pal.cloth, steel = pal.metal, iron = pal.hair, cloak = pal.leather;
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
  const parts = [], decals = [];
  const poly = pts => ({ type: 'poly', pts: pts.map(q => [Math.round(q[0] * 2) / 2, Math.round(q[1] * 2) / 2]) });
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
      { type: 'path', name: 'cloak', d: d + ' Z', mat: cloak, shade: 'normal', round: r(4) },
      { type: 'path', name: 'cloakfall', d: dd + ' Z', mat: cloak, shade: 'cyl', axis: 'y' },
    ] });
  }
  // legs: tapered thigh and shin with a knee cop, a pointed sabaton
  for (const n of ['L', 'R']) {
    const z = n === 'L' ? -1 : 1, kneeA = P.end(`leg${n}_up`), foot = P.end(`leg${n}_lo`), toe = at(`leg${n}_lo`, 1, 4.2, 0, 0.6);
    put(key(0.5, z * 5.6) - 3, { type: 'group', name: `leg${n}`, underlay: true, mat: armour, shade: 'flat', band: 1, children: [
      { type: 'capsule', name: 'thigh', a: P.start(`leg${n}_up`), b: kneeA, r: r(4.2), r1: r(3.1), mat: armour, shade: 'cyl' },
      { type: 'capsule', name: 'shin', a: kneeA, b: foot, r: r(3.2), r1: r(2.2), mat: armour, shade: 'cyl' },
      { type: 'ellipse', name: 'knee', cx: kneeA[0], cy: kneeA[1], rx: r(3.1), ry: r(2.6), mat: armour, shade: 'sphere' },
      { type: 'capsule', name: 'sabaton', a: foot, b: toe, r: r(2.3), r1: r(1.1), mat: iron, shade: 'cyl' },
    ] });
  }
  // the plated skirt: flares from the waist to an uneven, curved hem at mid-thigh
  put(0.2, { type: 'path', name: 'tassets', underlay: true, mat: armour, shade: 'normal', round: r(3), d: mass([['spine', 0.06, 7, 5.5, 0.5], ['hip', 0, 9, 6.5, 0.8], ['hip', 0, 10.5, 7, 1, ], ['leg' + (sx >= 0 ? 'R' : 'L') + '_up', 0.55, 11, 7.5, 1.2]]) });
  // the torso: a top-heavy wedge, a broad barrel chest over a narrow waist, pushed forward by the hunch
  put(0.5, { type: 'path', name: 'torso', underlay: true, mat: armour, shade: 'normal', round: r(5), d: mass([['spine', 1.02, 9, 8, 0.5], ['spine', 0.84, 13, 10, 2.4], ['spine', 0.58, 11.5, 9.5, 2.8], ['spine', 0.3, 8, 7.5, 1.4], ['spine', 0.04, 6, 6, 0.4]]) });
  // the thorn sigil on the breastplate (front and three-quarter views) and ash smeared on the plated skirt
  if (front > 0.15) {
    const c = at('spine', 0.7, 3.2), a = U * 2.2;
    decals.push({ name: 'sigil', part: 'torso', mat: 'accent', band: 1, shape: [poly([[c[0], c[1] - 2.2 * a], [c[0] + 0.7 * a, c[1]], [c[0], c[1] + 1.4 * a], [c[0] - 0.7 * a, c[1]]]), poly([[c[0] - 1.6 * a, c[1] - 0.3 * a], [c[0] + 1.6 * a, c[1] - 0.3 * a], [c[0], c[1] + 0.4 * a]])] });
    const t = at('hip', 0, 1.2, -sx * 3, -2);
    decals.push({ name: 'ash', part: 'tassets', mat: 'stone', band: 0, shape: { type: 'ellipse', cx: t[0], cy: t[1], rx: r(2.4), ry: r(1) } });
  }
  // the gorget: a short neck collar between the pauldrons
  put(0.6, { type: 'capsule', name: 'gorget', a: P.start('neck'), b: P.end('neck'), r: r(4.2), r1: r(3.6), mat: armour, shade: 'cyl', underlay: true });

  // arms: upper arm and forearm tapered with an elbow, a big gauntlet; huge round pauldrons on top
  for (const n of ['L', 'R']) {
    const z = n === 'L' ? -1 : 1, sh = P.start(`arm${n}_up`), el = at(`arm${n}_up`, 1, -0.5, z * 3), hd = at(`arm${n}_lo`, 1, 0, z * (n === 'R' && ctx.state !== 'attack' ? 0 : 1.2));
    const k = key(1.2, z * 15.8);
    put(k, { type: 'group', name: `arm${n}`, underlay: true, children: [
      { type: 'capsule', name: 'upperarm', a: sh, b: el, r: r(3.3), r1: r(2.7), mat: armour, shade: 'cyl' },
      { type: 'capsule', name: 'forearm', a: el, b: hd, r: r(2.9), r1: r(2.3), mat: armour, shade: 'cyl' },
      { type: 'circle', name: 'elbow', cx: el[0], cy: el[1], r: r(2.8), mat: armour, shade: 'sphere' },
      { type: 'circle', name: 'gauntlet', cx: hd[0], cy: hd[1], r: r(2.8), mat: iron, shade: 'sphere' },
    ] });
    const pc = at('spine', 0.97, 0.5, z * 13.8, 1.2);
    put(k + 0.4, { type: 'ellipse', name: `pauldron${n}`, cx: pc[0], cy: pc[1], rx: halfW(6.4, 6), ry: r(5.4), mat: armour, shade: 'sphere', underlay: true });
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
      { type: 'capsule', name: 'grip', a: pommel, b: pt(gripL, 0), r: r(1.2), mat: cloak, shade: 'cyl' },
      { type: 'path', name: 'blade', d: d + ' Z', mat: steel, shade: 'bevel' },
      { type: 'capsule', name: 'guard', a: gA, b: gB, r: r(1.3), mat: iron, shade: 'cyl' },
      { type: 'circle', name: 'pommel', cx: pommel[0], cy: pommel[1], r: r(1.6), mat: iron, shade: 'sphere' },
    ] });
    void hand;
    // a lit fuller down the blade's middle and two notches hacked out of the edge (not when the swing hides it behind
    // the back in the rear views)
    if (!(ctx.state === 'attack' && front < -0.3)) {
    decals.push({ name: 'fuller', part: 'blade', mat: 'metal', band: 0, shape: poly([pt(gripL + 1.5, 0.6), pt(len - 3, 1.2), pt(len - 3, 2.6), pt(gripL + 1.5, 2.2)]) });
    decals.push({ name: 'notch', part: 'blade', mat: 'metal', band: 2, shape: [poly([pt(gripL + 9, 5.6), pt(gripL + 10.5, 3.6), pt(gripL + 12, 6)]), poly([pt(gripL + 18, 6.6), pt(gripL + 19.2, 4.8), pt(gripL + 20.4, 6.6)])] });
    }
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
      spikes.push({ type: 'poly', name: 'thorn', pts: [[bx - nx, by - ny], [tx, ty], [bx + nx, by + ny]], mat: iron, shade: 'bevel' });
    }
    const kids = [
      ...spikes,
      { type: 'path', name: 'helm', d: helm, mat: armour, shade: 'normal', round: r(3) },
      { type: 'ellipse', name: 'crownband', cx: brow[0], cy: brow[1], rx: hw + 0.6 * U, ry: r(1.6), mat: iron, shade: 'cyl', axis: 'x' },
    ];
    // the face: a dark visor slit with two burning eyes over a nasal bar and a breathing grille, seen from the front
    // and three-quarter views; from behind the helm shows its back seam instead
    if (front > -0.2) {
      const ex = at('head', 0.5, 5.6)[0], ey = Math.round(hc[1] + 0.4 * U), sw = Math.max(3, Math.round(hw * (profileW(front, sx)) * 1.3)), eh = Math.max(1, Math.round(U));
      const x0 = Math.round(ex - sw / 2);
      kids.push({ type: 'rect', name: 'slit', x: x0, y: ey, w: sw, h: eh + 1, color: 'hair.2' });
      const eyes = front > 0.5 ? [0.22, 0.78] : [sx > 0 ? 0.68 : 0.32];
      for (const e of eyes) kids.push({ type: 'rect', name: 'eye', x: Math.round(x0 + e * sw - 0.5), y: ey, w: 1, h: eh, color: 'glow.1' });
      if (front > 0.5) kids.push({ type: 'rect', name: 'eyecore', x: Math.round(x0 + 0.22 * sw - 0.5), y: ey, w: 1, h: 1, color: 'glow.0' });
      const nx = Math.round(x0 + (front > 0.5 ? 0.5 : (sx > 0 ? 0.5 : 0.5)) * sw - 0.5);
      kids.push({ type: 'rect', name: 'nasal', x: nx, y: ey - Math.round(2 * U), w: 1, h: Math.round(5 * U), color: 'cloth.0' });
      const gy = Math.round(jaw[1] - 1.4 * U);
      for (let i = 0; i < 2; i++) kids.push({ type: 'rect', name: 'grille', x: Math.round(ex - sw * 0.25), y: gy + i * 2, w: Math.max(2, Math.round(sw * 0.5)), h: 1, color: 'cloth.2' });
    } else {
      kids.push({ type: 'rect', name: 'seam', x: Math.round(hc[0]), y: Math.round(top[1] + 2 * U), w: 1, h: Math.round(jaw[1] - top[1] - 3 * U), color: 'cloth.2' });
    }
    put(key(1.6, 0) + 1.5, { type: 'group', name: 'head', underlay: true, children: kids });
  }

  parts.sort((a, b) => a.k - b.k).forEach(p => s.add(p.node));
  // from behind: three fold creases down the cape, stopping above the ragged hem
  if (front < -0.3) for (const z of [-6, 0, 6]) {
    const a = at('spine', 0.75, -8, z), b = at('hip', 0, -14, z * 1.4, -18);
    decals.push({ name: 'fold', part: 'cloak', mat: 'leather', band: 2, shape: poly([[a[0] - 0.5, a[1]], [a[0] + 0.5, a[1]], [b[0] + 0.5, b[1]], [b[0] - 0.5, b[1]]]) });
  }
  let p = ctx.lib.proc(s)
    .add('ao', { part: ['torso', 'gorget', 'tassets', 'thigh', 'upperarm', 'helm'] })
    .add('materialNoise', { part: ['cloak', 'cloakfall'], amount: 0.1, scale: 3, seed: ctx.variant ?? 0 })
    .add('rimLight', { part: ['torso', 'helm', 'pauldronL', 'pauldronR', 'tassets'], side: 'away' });
  for (const d of decals) p = p.add('decal', d);
  return p.add('groundShadow', {}).render();
}
// the slit narrows as the helm turns away into profile
function profileW(front, sx) { return 0.35 + 0.55 * Math.max(0, front) + 0.2 * Math.abs(sx) * (front > 0 ? 0 : 1); }

// named points per frame: head and hand (the cleaver's grip) follow the rig
export const anchors = ctx => {
  const L = layout(ctx), a = L.rig.anchors(L.P);
  delete a.ground;
  return a;
};
