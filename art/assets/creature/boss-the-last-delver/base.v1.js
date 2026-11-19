// boss-the-last-delver base.v1 (r1) — SHAPE DRAFT (shape gate): silhouette and form only, flat materials, no proc layers.
// The Last Delver, a unique boss of the h family (men and dwarves): the one delver who never came back up, a stooped,
// heavy old human skirmisher drawn 8.2 m against the player on the shared biped rig (`ctx.lib.rigs.body`). What sets him
// apart from the plain hooded cultist of the family: an ENORMOUS DELVING PACK on his back (a round rucksack with a
// bedroll lashed across its top that juts out past both shoulders, so the pack widens the front view and deepens the
// side view), a wide-brimmed miner's helm with a glowing headlamp (the one bright accent), a broad grey beard over a
// barrel chest, a long field coat in the family's cloth ramp (recolour: cloth, so his row's ivory dresses him) that
// flares to a ragged hem at the knee with the legs showing below, thick bent limbs with heavy boots, and an oversized
// two-headed delving pick held upright at his side, swung overhead and brought down forward in the attack (gather,
// wind-up, held hit, follow-through). Every part is a 3D point on the rig (`pose.at(bone, u, fwd, side, up)`) so the
// body turns in the three-quarter facings; sizes come from the brief's height and ctx.dir.scale.metre, colours are
// role ramps (R11).
export const meta = { brief: 'boss-the-last-delver', pass: 'r1', recolour: 'cloth', notes: 'shape draft: stooped old delver under a huge pack, brimmed headlamp helm, beard, field coat, giant delving pick' };

// right arm (holds the pick) per state and frame: upper arm, forearm (rig angles, 0 = up, 90 = forward), spine lean,
// the haft's absolute angle (0 = straight up, 90 = forward) and the pick head's sideways reach (in body units)
const CARRY = { up: 166, lo: -72, haft: 14, side: 8, spine: 0 };
const SWING = [
  { up: 160, lo: -84, haft: -8, side: 10, spine: -2 },   // gathers the pick, tipping it back
  { up: 112, lo: -104, haft: -68, side: 16, spine: -8 },    // wind-up: cocked back over the shoulder, leaning back
  { up: 96, lo: -8, haft: 118, side: -18, spine: 16 },    // the hit (held): brought down forward and across the body
  { up: 122, lo: -12, haft: 112, side: -22, spine: 10 },   // follow-through, low and across
];

function layout(ctx) {
  const [w, h] = ctx.size, metres = ctx.brief?.height ?? 8.2, ground = Math.round(h * 0.95) + 7;
  const H = Math.round(ctx.dir.scale.metre * metres * 0.86), U = H / 66;
  const rig = ctx.lib.rigs.body('biped', ctx, { ground, height: H, proportions: { head: 0.16, neck: 0.045, hip: 0.02, leg_up: 0.2, leg_lo: 0.19, arm_up: 0.19, arm_lo: 0.18, armSep: 0.26, legSep: 0.1 } });
  const base = rig.pose(ctx.state, ctx.t), A = base.angles;
  const arm = ctx.state === 'attack' ? SWING[((ctx.logical ?? ctx.frame ?? Math.floor(ctx.t * 4)) % SWING.length + SWING.length) % SWING.length] : CARRY;
  // the stoop under the pack: the spine leans forward, the head lifts back to look ahead; the free arm hangs bent
  const ov = { spine: (A.spine ?? 0) + 13 + arm.spine, neck: (A.neck ?? 0) + 4, head: (A.head ?? 0) - 14, armR_up: arm.up, armR_lo: arm.lo, armL_up: (A.armL_up ?? 180) - 10, armL_lo: (A.armL_lo ?? 4) - 28 };
  const P = rig.pose(ctx.state, ctx.t, { angles: ov });
  return { w, h, U, H, rig, P, arm, ground, front: rig.front, sx: rig.sx, side: rig.side };
}

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), { U, P, front, sx, arm } = L;
  const coat = pal.cloth, pack = pal.leather, roll = pal.hair, iron = pal.metal, beard = pal.stone, skin = pal.skin;
  const r = n => Math.max(1, n * U), key = (f, z) => f * front + z * sx; // depth toward the viewer
  const at = (b, u, f = 0, z = 0, up = 0) => P.at(b, u, f * U, z * U, up * U);
  const halfW = (W, D) => Math.hypot(W * front, D * sx) * U;
  const M = p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  const flat = (band = 1) => ({ shade: 'flat', band });
  // a smooth closed mass through cross-sections [bone, u, W, D, fwd, up]
  const mass = rows => {
    const pts = rows.map(([b, u, W, D, f, up]) => ({ c: at(b, u, f, 0, up ?? 0), hw: halfW(W, D) }));
    const ring = [...pts.map(p => [p.c[0] - p.hw, p.c[1]]), ...pts.map(p => [p.c[0] + p.hw, p.c[1]]).reverse()];
    let d = `M${M(ring[0])}`;
    for (let i = 1; i < ring.length; i++) { const a = ring[i - 1], b = ring[i]; d += ` Q${M(a)} ${M([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2])}`; }
    return d + ` L${M(ring[ring.length - 1])} Z`;
  };
  const parts = [], put = (k, node) => parts.push({ k, node });

  // the coat skirt: from the waist it flares out to a wide, ragged hem below the knee; behind and beside the legs a
  // full skirt, in front two flaps split up to the hip, so the legs show between them and below the hem in every facing
  {
    const R = th => 15 - 1.2 * Math.cos(th), rag = [0, 2, 1, 3, 0, 4, 1, 3, 0, 2, 4, 1, 0, 3, 1, 2, 0];
    const hemAt = (deg, i) => { const th = deg * Math.PI / 180; return at('hip', 0, R(th) * Math.cos(th) + 1, R(th) * Math.sin(th), -7.5 - rag[i % rag.length] * 0.8); };
    const waistAt = deg => { const th = deg * Math.PI / 180; return at('spine', 0.12, 8 * Math.cos(th) + 2, 8.6 * Math.sin(th)); };
    const poly = pts => { let d = `M${M(pts[0])}`; for (let i = 1; i < pts.length; i++) d += ` L${M(pts[i])}`; return d + ' Z'; };
    const back = [waistAt(-90)]; for (let i = 0; i <= 12; i++) back.push(hemAt(-90 - 180 * i / 12, i)); back.push(waistAt(90), waistAt(180));
    put(front < -0.3 ? 0.3 : -8, { type: 'path', name: 'coatskirt', underlay: true, d: poly(back), mat: coat, ...flat(1), round: r(2) });
    for (const z of [-1, 1]) {
      const flap = [waistAt(z * 30), at('hip', 0, 9, z * 3, 1)]; for (let i = 0; i <= 4; i++) flap.push(hemAt(z * (46 + 44 * i / 4), i + (z > 0 ? 5 : 9))); flap.push(waistAt(z * 90));
      put(front < -0.3 ? -8 : 0.3, { type: 'path', name: 'coatflap', underlay: true, d: poly(flap), mat: coat, ...flat(1), round: r(2) });
    }
  }
  // legs: thick tapered thigh and shin with a knee, a heavy rounded boot
  for (const n of ['L', 'R']) {
    const z = n === 'L' ? -1 : 1, knee = P.end(`leg${n}_up`), foot = P.end(`leg${n}_lo`), toe = at(`leg${n}_lo`, 1, 4.6, 0, 0.8);
    put(key(0.5, z * 6) - 3, { type: 'group', name: `leg${n}`, underlay: true, children: [
      { type: 'capsule', name: 'thigh', a: P.start(`leg${n}_up`), b: knee, r: r(4.4), r1: r(3.3), mat: pack, ...flat(1) },
      { type: 'capsule', name: 'shin', a: knee, b: at(`leg${n}_lo`, 0.7), r: r(3.3), r1: r(2.6), mat: pack, ...flat(1) },
      { type: 'capsule', name: 'boot', a: at(`leg${n}_lo`, 0.62), b: foot, r: r(3.3), r1: r(3), mat: roll, ...flat(2) },
      { type: 'capsule', name: 'toe', a: foot, b: toe, r: r(2.8), r1: r(2), mat: roll, ...flat(2) },
    ] });
  }
  // the delving pack: a big round rucksack riding high on the back, the bedroll lashed across its top past both shoulders
  {
    const packK = front < -0.3 ? 2 : -20;
    put(packK, { type: 'path', name: 'pack', underlay: true, mat: pack, ...flat(1), round: r(5), d: mass([['spine', 1.12, 10, 5, -11], ['spine', 0.9, 14, 8, -14], ['spine', 0.55, 15, 9, -15], ['spine', 0.25, 12, 7, -12]]) });
    const a = at('spine', 1.06, -11, -21), b = at('spine', 1.06, -11, 21);
    put(packK + 0.5, { type: 'capsule', name: 'bedroll', underlay: true, a, b, r: r(4.4), mat: roll, ...flat(1) });
  }
  // the torso: a barrel chest over a thick belly, pushed forward by the stoop, in the long coat
  put(0.5, { type: 'path', name: 'torso', underlay: true, mat: coat, ...flat(1), round: r(5), d: mass([['spine', 1.02, 8.5, 7.5, 0.5], ['spine', 0.82, 13, 10, 2], ['spine', 0.52, 14.5, 11, 3.2], ['spine', 0.26, 12.5, 9.8, 2.6], ['spine', 0.04, 8.8, 7.6, 1.4]]) });
  put(0.55, { type: 'path', name: 'belt', underlay: true, mat: pack, ...flat(2), d: mass([['spine', 0.14, 10.6, 8.6, 2.2], ['spine', 0.05, 9.4, 7.9, 1.6]]) });

  // arms: thick upper arm and forearm with an elbow, a big gloved fist; rounded coat shoulders on top
  for (const n of ['L', 'R']) {
    const z = n === 'L' ? -1 : 1, sh = P.start(`arm${n}_up`), el = at(`arm${n}_up`, 1, -0.5, z * 2.5), hd = at(`arm${n}_lo`, 1, 0, z * 1);
    const k = key(1.2, z * 15.8);
    put(k, { type: 'group', name: `arm${n}`, underlay: true, children: [
      { type: 'capsule', name: 'upperarm', a: sh, b: el, r: r(3.8), r1: r(3.1), mat: coat, ...flat(1) },
      { type: 'capsule', name: 'forearm', a: el, b: hd, r: r(3.2), r1: r(2.6), mat: coat, ...flat(1) },
      { type: 'circle', name: 'fist', cx: hd[0], cy: hd[1], r: r(3), mat: pack, ...flat(1) },
    ] });
    const pc = at('spine', 0.96, 0.3, z * 12.5, 0.8);
    put(k + 0.4, { type: 'ellipse', name: `shoulder${n}`, cx: pc[0], cy: pc[1], rx: halfW(5.6, 5.4), ry: r(4.6), mat: coat, ...flat(1), underlay: true });
  }

  // the delving pick: a long haft with a heavy two-sided head (a long spike forward, a broad adze behind), at his side
  {
    const rad = arm.haft * Math.PI / 180, len = 40, butt = 9;
    // a point t along the haft from the fist, wid across it (the head's axis), drifting sideways toward the head
    const pt = (t, wid) => at('armR_lo', 1, Math.sin(rad) * t + 0.6 * Math.cos(rad) * wid, arm.side * (t / len) + 0.8 * wid, Math.cos(rad) * t - 0.6 * Math.sin(rad) * wid);
    const head = [[len + 2.2, -14], [len + 3, -6], [len + 4.4, 0], [len + 3, 8], [len + 4.4, 13], [len - 1.6, 11], [len - 2.4, 4], [len - 2.2, -2], [len - 1, -7]];
    let d = `M${M(pt(...head[0]))}`; for (const p of head.slice(1)) d += ` L${M(pt(...p))}`;
    const mid = len * 0.5, kf = Math.sin(rad) * mid * front + (15.8 + arm.side * 0.5) * sx;
    put(kf + (ctx.state === 'attack' ? 0 : 3), { type: 'group', name: 'pick', underlay: true, children: [
      { type: 'capsule', name: 'haft', a: pt(-butt, 0), b: pt(len, 0), r: r(1.3), mat: pack, ...flat(1) },
      { type: 'path', name: 'pickhead', d: d + ' Z', mat: iron, ...flat(1) },
      { type: 'circle', name: 'collar', cx: pt(len, 0)[0], cy: pt(len, 0)[1], r: r(2.2), mat: iron, ...flat(2) },
    ] });
  }

  // the head: an egg-shaped old face on the neck, a broad grey beard over the chest, a domed helm with a wide brim and
  // a headlamp at its brow (the same head in every facing; the face, beard and lamp hide from behind)
  {
    const hc = at('head', 0.45, 0.8), jaw = at('head', 0.0, 1.6), hw = halfW(5.8, 6.2);
    const face = `M${M([hc[0] - hw, hc[1] - 2 * U])} Q${M([hc[0] - hw, jaw[1]])} ${M([jaw[0], jaw[1] + U])} Q${M([hc[0] + hw, jaw[1]])} ${M([hc[0] + hw, hc[1] - 2 * U])} Z`;
    const kids = [{ type: 'path', name: 'face', d: face, mat: front > -0.3 ? skin : roll, ...flat(1) }];
    if (front > -0.3) {
      const b0 = at('head', 0.35, 3.2), bw = halfW(5.6, 3.4), tip = at('neck', 0, 7.5, 0, -9);
      kids.push({ type: 'path', name: 'beard', mat: beard, ...flat(0), d: `M${M([b0[0] - bw, b0[1]])} Q${M([b0[0] - bw * 1.2, tip[1] - 4 * U])} ${M([tip[0] - bw * 0.35, tip[1]])} L${M([tip[0], tip[1] + 1.5 * U])} L${M([tip[0] + bw * 0.35, tip[1]])} Q${M([b0[0] + bw * 1.2, tip[1] - 4 * U])} ${M([b0[0] + bw, b0[1]])} Q${M([b0[0], b0[1] + 2 * U])} ${M([b0[0] - bw, b0[1]])} Z` });
    }
    const dome = at('head', 0.7, 0.2), top = at('head', 1.12), dw = halfW(6.4, 6.8);
    kids.push({ type: 'path', name: 'helm', mat: iron, ...flat(1), d: `M${M([dome[0] - dw, dome[1]])} Q${M([dome[0] - dw, top[1]])} ${M([top[0], top[1]])} Q${M([dome[0] + dw, top[1]])} ${M([dome[0] + dw, dome[1]])} Z` });
    const brim = at('head', 0.66, 0.6);
    kids.push({ type: 'ellipse', name: 'brim', cx: brim[0], cy: brim[1], rx: halfW(10.5, 10.5), ry: Math.max(r(2), r(3.4) * (1 - Math.abs(front) * 0.45)), mat: iron, ...flat(2) });
    if (front > -0.25) {
      const lamp = at('head', 0.84, 6.4);
      kids.push({ type: 'circle', name: 'lampcase', cx: lamp[0], cy: lamp[1], r: r(2.6), mat: iron, ...flat(2) });
      kids.push({ type: 'circle', name: 'lamp', cx: lamp[0], cy: lamp[1], r: r(1.7), mat: pal.glow, ...flat(0) });
    }
    put(key(1.6, 0) + 1.5, { type: 'group', name: 'head', underlay: true, children: kids });
  }

  parts.sort((a, b) => a.k - b.k).forEach(p => s.add(p.node));
  return s.render();
}

// named points per frame: head and hand (the pick's grip) follow the rig
export const anchors = ctx => {
  const L = layout(ctx), a = L.rig.anchors(L.P);
  delete a.ground;
  return a;
};
