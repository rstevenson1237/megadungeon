// boss-the-crystal-warden base.v1 (r1, SHAPE DRAFT) — The Crystal Warden, a unique brute boss of the elemental family
// (glyph E, azure, slow, fungal caverns), 6.4 m (about 102 px, 2.8x the drawn player) in the 96 x 128 frame, on the
// shared biped rig (`ctx.lib.rigs.body`, from the iso walker template; bone lengths set once for the asset: short thick
// legs, a long heavy trunk, long gorilla arms, a small head sunk low between the shoulders). Silhouette and form only, in
// flat materials: no proc layers but the ground shadow, no texture, no decals.
// What tells it from the plain family elemental (a jagged shard column with shard fists): it walks on two thick tapered
// legs with knees and broad rock feet; a wedge-shaped trunk, wide at the chest and narrow at the waist, girded by a skirt
// of downward shards with an uneven hem; great crystal spires growing up and out of both shoulders and the upper back
// (a crystal hump that makes it about 60 px wide from the front); a small rock head on a jutting jaw, crowned by a ring
// of crystal spikes (the family's crown, taller); huge fists; and its signature, a crystal warden's maul (a dark stone
// haft and a big cluster of crystal prisms around a glowing core, the planned bright accent) rested head-down on the
// floor in idle, dragged in the walk and swung overhead in an arc on the attack, held on the contact frame.
// Every part is placed with pose.at(bone, u, fwd, side, up) so the body turns with the rig's yaw; colours are ramps from
// ctx.dir (R11): the body and crystals the cloth ramp (azure, the row's colour), rock parts stone, the core glow.
export const meta = { brief: 'boss-the-crystal-warden', pass: 'r1', notes: 'shape draft: crystal spires on shoulders and back, crowned rock head, wedge trunk, shard skirt, crystal maul' };

export const params = {};

const HM = 6.4, CROWN = 0.15; // the crown's tallest spike above the head, a share of the rig height

// attack keys (absolute arm and maul angles, rig convention: 0 up, 90 forward, 180 down): the wind-up with the maul
// hanging behind the back, the swing over the top, the contact held low in front, the recovery
const ATTACK = [
  { spine: -6, up: 30, lo: -60, w: -120 },
  { spine: 3, up: 50, lo: 20, w: 50 },
  { spine: 6, up: 95, lo: 135, w: 150 },
  { spine: 3, up: 128, lo: 160, w: 170 },
];
const CARRY = 172; // idle and walk: the maul hangs head-down from the right fist, its head at the knee, a little ahead

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, ground = h - 3;
  const H = Math.round((HM * metre) / (1 + CROWN)); // the rig to the top of the head; the crown adds the rest
  const rig = ctx.lib.rigs.body('biped', ctx, {
    ground, height: H,
    proportions: { hip: 0.02, neck: 0.03, head: 0.13, leg_up: 0.16, leg_lo: 0.15, arm_up: 0.17, arm_lo: 0.17, shoulder: 0.88, legSep: 0.1, armSep: 0.235 },
  });
  const P0 = rig.pose(ctx.state, ctx.t), A = P0.angles;
  let over = { neck: (A.neck ?? 0) + 14, head: (A.head ?? 0) - 6, armL_lo: (A.armL_lo ?? 0) + 14 }, wAng = CARRY;
  if (ctx.state === 'attack') {
    const k = ATTACK[Math.min(3, Math.floor((ctx.t ?? 0) * 4 + 1e-6))];
    over = { ...over, spine: k.spine, armR_up: k.up - k.spine, armR_lo: k.lo - k.up, armL_up: 160, armL_lo: 30 };
    wAng = k.w;
  }
  const P = rig.pose(ctx.state, ctx.t, { angles: over });
  const { sx, front, side } = rig, profile = side > 0.9;
  // the maul's reach from the hand to the centre of its head, fixed for the asset
  const reach = H * 0.27;
  return { w, h, H, rig, P, sx, front, side, profile, ground, reach, wAng };
}

// convex hull (monotone chain) of screen points
function hull(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const f2 = p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
const smooth = pts => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let d = `M${f2(m(pts[n - 1], pts[0]))}`;
  for (let i = 0; i < n; i++) d += ` Q${f2(pts[i])} ${f2(m(pts[i], pts[(i + 1) % n]))}`;
  return d + ' Z';
};

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx);
  const { H, P, sx, front, reach, wAng } = L, U = v => v * H;
  const items = [], put = (depth, node) => { items.push({ depth, node, i: items.length }); return node; };
  const at = (n, u, f = 0, sd = 0, up = 0) => P.at(n, u, U(f), U(sd), U(up));
  const dep = (n, f = 0, sd = 0) => P.depth(n) + U(f) * front + U(sd) * sx;
  const crystalMat = pal.cloth, bodyMat = pal.cloth, rock = pal.stone;
  // a rounded mass: the hull of horizontal elliptical rings (fwd semi-axis a, side semi-axis b) around bone points
  const blob = (name, rings, mat, band = 1) => {
    const pts = [];
    for (const [n, u, f, sd, up, a, b] of rings) for (let i = 0; i < 16; i++) { const t = (i / 16) * Math.PI * 2; pts.push(at(n, u, f + a * Math.cos(t), sd + b * Math.sin(t), up)); }
    return { type: 'path', name, underlay: true, mat, shade: 'flat', band, d: smooth(hull(pts)) };
  };
  // a crystal prism: from a base point to a tip, half-width hw px, its shoulders at 70 % of the length
  const prism = (name, b, t, hw, band = 0, mat = crystalMat) => {
    const dx = t[0] - b[0], dy = t[1] - b[1], l = Math.hypot(dx, dy) || 1, d = [dx / l, dy / l], nn = [-d[1], d[0]];
    const q = (k, m) => [b[0] + d[0] * k + nn[0] * m, b[1] + d[1] * k + nn[1] * m];
    return { type: 'poly', name, underlay: true, mat, shade: 'flat', band, pts: [q(0, -hw), q(l * 0.7, -hw), t, q(l * 0.7, hw), q(0, hw)] };
  };
  const tube = (name, a, b, r, r1, mat, band = 1) => ({ type: 'capsule', name, underlay: true, mat, shade: 'flat', band, a, b, r, r1 });

  // ---- legs: thick tapered thighs and shins, a knee, broad rock feet
  for (const sd of ['L', 'R']) {
    const up = `leg${sd}_up`, lo = `leg${sd}_lo`, d = P.depth(up);
    put(d, tube('thigh', P.start(up), P.end(up), U(0.085), U(0.068), bodyMat));
    put(d + 0.01, tube('shin', P.start(lo), at(lo, 0.86), U(0.066), U(0.05), bodyMat));
    put(d + 0.02, blob('knee', [[up, 1, 0.025, 0, 0, 0.045, 0.05]], rock));
    put(d + 0.03, blob('foot', [[lo, 1, 0.03, 0, 0, 0.08, 0.06], [lo, 1, 0.0, 0, 0.045, 0.05, 0.045]], rock));
  }
  // ---- the shard skirt: downward shards round the hips, uneven hem; the front ones over the legs, the back ones behind
  const hem = [0.11, 0.15, 0.09, 0.14, 0.1, 0.16, 0.08, 0.13];
  hem.forEach((len, i) => {
    const t = (i / hem.length) * Math.PI * 2 + 0.2, c = Math.cos(t), sn = Math.sin(t);
    const b = at('spine', 0.06, 0.1 * c, 0.15 * sn), tip = at('spine', 0.06, 0.13 * c, 0.19 * sn, -len - 0.03);
    put(dep('spine', 0.1 * c, 0.15 * sn), prism('shard', b, tip, U(0.05), 1));
  });
  // ---- the trunk: a wedge, wide at the chest and narrow at the waist, with rounded shoulders
  put(0, blob('torso', [
    ['spine', 0.08, 0, 0, 0, 0.08, 0.07],
    ['spine', 0.3, 0.02, 0, 0, 0.12, 0.12],
    ['spine', 0.62, 0.04, 0, 0, 0.17, 0.2],
    ['spine', 0.82, 0.03, 0, 0, 0.17, 0.235],
    ['spine', 1, -0.01, 0, 0.03, 0.1, 0.12],
  ], bodyMat));
  // the chest core (form only, flat): a geode set in the chest, sliding with the turn and hidden from behind
  if (front > -0.2) put(U(0.2), blob('core', [['spine', 0.66, 0.15, 0, 0, 0.01, 0.06], ['spine', 0.66, 0.15, 0, 0.06, 0.01, 0.04], ['spine', 0.66, 0.15, 0, -0.05, 0.01, 0.035]], crystalMat, 0));

  // ---- the crystal hump: great spires out of the upper back, fanning up and outward
  for (const [sd, up, len, hw, band] of [[-0.09, 0.95, 0.24, 0.05, 0], [0.09, 0.95, 0.27, 0.055, 0], [-0.17, 0.82, 0.2, 0.045, 1], [0.17, 0.82, 0.18, 0.045, 1], [0, 0.88, 0.2, 0.05, 1]]) {
    const b = at('spine', up, -0.12, sd), t = at('spine', up, -0.26, sd * 1.9 + Math.sign(sd) * 0.03, len);
    put(dep('spine', -0.14, sd), prism('back-spire', b, t, U(hw), band));
  }

  // ---- the head: a small rock egg on a jutting jaw, sunk low between the spires, crowned by a ring of crystal spikes
  const hd = dep('head', 0.03);
  const crown = [];
  for (let i = 0; i < 8; i++) {
    const t = (i / 8) * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t), tall = [CROWN, 0.11, 0.08, 0.11, CROWN - 0.02, 0.11, 0.08, 0.11][i];
    const b = at('head', 0.78, 0.01 + 0.045 * c, 0.05 * sn), tip = at('head', 1, 0.01 + 0.1 * c, 0.1 * sn, tall);
    crown.push([dep('head', 0.05 * c, 0.05 * sn), prism('crown', b, tip, U(0.03), c > 0 ? 0 : 1)]);
  }
  crown.filter(([d]) => d < hd).forEach(([d, n]) => put(d, n));
  put(hd, blob('head', [['head', 0.1, 0.03, 0, 0, 0.065, 0.075], ['head', 0.55, 0.02, 0, 0, 0.085, 0.09], ['head', 0.95, 0.0, 0, 0, 0.055, 0.06]], rock, 1));
  put(hd + 0.01, blob('jaw', [['head', 0.0, 0.07, 0, 0, 0.045, 0.08], ['head', 0.3, 0.075, 0, 0, 0.035, 0.065]], rock, 0));
  if (front > -0.2) for (const e of [-1, 1]) {
    const p = at('head', 0.55, 0.085, 0.04 * e);
    if (P.depth('head') + U(0.075) * front + U(0.035 * e) * sx > P.depth('head') - 0.5) put(hd + 0.02, { type: 'rect', name: 'eye', x: Math.round(p[0] - 1), y: Math.round(p[1]), w: 2, h: 1, color: 'outline' });
  }
  crown.filter(([d]) => d >= hd).forEach(([d, n]) => put(d, n));

  // ---- arms: thick, bent at the elbow, huge fists; a spire on each shoulder over the arm
  for (const sd of ['L', 'R']) {
    const up = `arm${sd}_up`, lo = `arm${sd}_lo`, d = P.depth(up) + 0.5, k = sd === 'L' ? -1 : 1;
    put(d, tube('upper-arm', P.start(up), P.end(up), U(0.075), U(0.06), bodyMat));
    put(d + 0.01, tube('forearm', P.start(lo), at(lo, 0.85), U(0.06), U(0.07), bodyMat));
    put(d + 0.02, blob('fist', [[lo, 1, 0, 0, 0, 0.06, 0.065], [lo, 0.9, 0, 0, 0, 0.055, 0.06]], rock));
    put(d + 0.03, blob('pauldron', [[up, 0.05, 0, 0.02 * k, 0.03, 0.08, 0.08], [up, 0.3, 0, 0.02 * k, 0, 0.07, 0.07]], bodyMat));
    for (const [f, out, upv, len, hw] of [[0.03, 0.2, 0.17, 1, 0.055], [-0.05, 0.14, 0.22, 1, 0.045]]) {
      const b = at(up, 0, f, 0.04 * k, 0.04), t = at(up, 0, f * 2, out * k * len, upv * len);
      put(d + 0.04, prism('shoulder-spire', b, t, U(hw), f > 0 ? 0 : 1));
    }
  }

  // ---- the warden's maul: a stone haft through the right fist, a cluster of crystal prisms round a glowing core
  const hand = P.end('armR_lo'), hdR = P.depth('armR_lo') + 0.6;
  // the maul at its own angle in the rig's side plane (wAng), turned with the body like every part
  const wr = (wAng * Math.PI) / 180, wf = Math.sin(wr), wu = Math.cos(wr);
  const headC = P.at('armR_lo', 1, reach * wf, 0, reach * wu), pommel = P.at('armR_lo', 1, -U(0.1) * wf, 0, -U(0.1) * wu);
  let axis3 = [headC[0] - hand[0], headC[1] - hand[1]];
  if (Math.hypot(...axis3) < 2) axis3 = [0, -1];
  const al = Math.hypot(...axis3) || 1, ax = [axis3[0] / al, axis3[1] / al], nx = [-ax[1], ax[0]];
  const headDepth = hdR + reach * wf * front;
  put(hdR, tube('haft', pommel, headC, U(0.03), U(0.03), rock, 1));
  const C = (k, m) => [headC[0] + ax[0] * U(k) + nx[0] * U(m), headC[1] + ax[1] * U(k) + nx[1] * U(m)];
  put(headDepth, { type: 'path', name: 'maul-head', underlay: true, mat: crystalMat, shade: 'flat', band: 1, d: smooth(hull([C(-0.09, -0.12), C(-0.09, 0.12), C(0.07, 0.16), C(0.12, 0), C(0.07, -0.16)])) });
  for (const [k0, m0, k1, m1, hw, band] of [[0, -0.1, 0.02, -0.27, 0.05, 0], [0, 0.1, 0.03, 0.26, 0.05, 1], [0.04, -0.03, 0.21, -0.08, 0.055, 0], [0.04, 0.04, 0.19, 0.12, 0.05, 1], [-0.05, 0, -0.17, -0.04, 0.04, 0]]) put(headDepth + 0.01, prism('maul-prism', C(k0, m0), C(k1, m1), U(hw), band));
  put(headDepth + 0.02, { type: 'circle', name: 'maul-core', cx: headC[0], cy: headC[1], r: U(0.045), mat: pal.glow, shade: 'flat', band: 0 });

  items.sort((a, b) => a.depth - b.depth || a.i - b.i).forEach(it => s.add(it.node));
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}

// Named points per frame: head, hand (the right fist, where the maul is held) from the rig; `ground` comes from the frame.
export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P) };
  delete a.ground;
  return a;
};
