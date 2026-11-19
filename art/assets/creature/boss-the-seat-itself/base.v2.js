// boss-the-seat-itself base.v2 (r2, from base.v1) — the DECORATION pass on the owner-approved v1 shape (stage shape
// approved 2026-11-18): every shape keeps its v1 outline and depth order, so the pixels outside the outer line are
// unchanged. What changed, all inside the line:
// - the body moves to the family's recoloured ramp (cloth, as family-c-cap: meta.recolour 'cloth'), so the boss takes
//   its row colour in game; the panel and cushion stay accent, the gem and eyes glow;
// - light from the direction (up-left): the torso, seat, throne back and head lit as round masses (normal, wide round),
//   the limbs, neck and spires as tapered cylinders, knees, elbows, fists and armrest scrolls as spheres; ao where parts
//   overlap and a faint stone grain;
// - the spires and claws are metal (dark iron, the crest spire's lit edge), the crest gem a lit sphere with a
//   white-hot core (the one bright accent, on the signature throne back);
// - decals: dressed-stone courses and an arch border carved into the throne back; on the back face a carved crown rune
//   and a stone spine down the slab (so the back facing differs from the front); tufted buttons on the ember cushion;
//   iron studs round the maroon panel; chest courses and a crack; a carved groove on the seat's apron;
// - a readable face: a dark brow shelf over the ember slit eyes, a lit nose ridge and a dark mouth seam on the jaw.
//
// boss-the-seat-itself base.v1 (r1, SHAPE DRAFT) — The Seat Itself, the final boss (glyph C, ember, a slow construct
// brute of the Abyssal Throne, level 100): a unique boss of the golem family (family-c-cap: a stone golem with a small
// head sunk low between great shoulders and glowing slit eyes), drawn 9.3 m (148 px, 4x the drawn player) in the
// 128 x 160 frame on the shared biped rig (`ctx.lib.rigs.body`, from the iso walker template; bone lengths set once for
// the asset). The throne risen and walking: a black stone golem whose body IS a throne.
// - the signature: a towering wingback throne back (its wings swept forward round the head) rising from its shoulders high above the head, flaring to an arched crest
//   with three spires, an ember gem at its crown (the one bright accent: glow); its front face is a maroon panel, so
//   the stone head reads against it;
// - the seat: a broad stone shelf jutting forward at the hips with its ember cushion on top and a stone apron hanging
//   under its front edge, so the hips flare wider than the chest and the side facings carry a deep ledge;
// - a hunched barrel chest tapering to a narrow waist under the seat; great armrest shoulders, thick tapered arms with
//   an elbow, block fists, the right one oversized with three stone claws;
// - short thick throne legs with a knee, splayed, ending in broad feet;
// - the golem's small heavy head pushed forward and low on a thick neck, ember slit eyes.
// The attack is an overhead hammer-fist slam, its contact held low in front.
// Silhouette and form only, in flat materials: no proc layers but the ground shadow, no texture, no decals.
// Every part is placed with pose.at(bone, u, fwd, side, up) so the body turns with the rig's yaw; colours are ramps
// from ctx.dir (R11): stone for the body, accent for the ember cushion and panel, glow for the gem and eyes.
export const meta = { brief: 'boss-the-seat-itself', pass: 'r2', recolour: 'cloth', notes: 'decoration on the approved shape: round lit masses on the family cloth ramp, iron spires and claws, glowing crest gem, carved courses and rune decals, face; shape draft was: walking throne golem, towering arched throne back with spires and ember gem, jutting seat shelf, armrest shoulders, oversized clawed right fist, squat throne legs' };

export const params = {};

const HM = 9.3, CROWN = 0.28; // the throne back's crest above the head's top (a share of the rig height), with its lean in the iso view

// attack keys (absolute right-arm angles, rig convention: 0 up, 90 forward, 180 down): the wind-up with the fist raised
// behind the head, over the top, the slam, the contact held low in front
const ATTACK = [
  { spine: -8, up: 25, lo: -35 },
  { spine: 2, up: 45, lo: 30 },
  { spine: 4, up: 105, lo: 140 },
  { spine: 4, up: 128, lo: 162 },
];

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, ground = h - 3;
  const H = Math.round((HM * metre) / (1 + CROWN)); // the rig to the top of the head; the throne back adds the rest
  const rig = ctx.lib.rigs.body('biped', ctx, {
    ground, height: H,
    proportions: { hip: 0.02, neck: 0.05, head: 0.12, leg_up: 0.15, leg_lo: 0.15, arm_up: 0.19, arm_lo: 0.17, shoulder: 0.86, legSep: 0.12, armSep: 0.25 },
  });
  const P0 = rig.pose(ctx.state, ctx.t), A = P0.angles;
  let over = { neck: (A.neck ?? 0) + 30, head: (A.head ?? 0) - 18, armL_up: (A.armL_up ?? 180) - 14, armR_up: (A.armR_up ?? 180) - 14, armL_lo: (A.armL_lo ?? 0) + 22, armR_lo: (A.armR_lo ?? 0) + 22 };
  if (ctx.state === 'attack') {
    const k = ATTACK[Math.min(3, Math.floor((ctx.t ?? 0) * 4 + 1e-6))];
    over = { ...over, spine: k.spine, armR_up: k.up - k.spine, armR_lo: k.lo - k.up, armL_up: 160, armL_lo: 30 };
  }
  const P = rig.pose(ctx.state, ctx.t, { angles: over });
  const { sx, front, side } = rig;
  return { w, h, H, rig, P, sx, front, side, ground };
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
  const { H, P, sx, front } = L, U = v => v * H;
  const items = [], put = (depth, node) => { items.push({ depth, node, i: items.length }); return node; };
  const at = (n, u, f = 0, sd = 0, up = 0) => P.at(n, u, U(f), U(sd), U(up));
  const dep = (n, f = 0, sd = 0) => P.depth(n) + U(f) * front + U(sd) * sx;
  const rock = pal.cloth, ember = pal.accent, iron = pal.metal;
  const marks = [], mark = (name, part, mat, band, shape) => marks.push({ name, part, mat, band, shape });
  const strip = (pts, wd) => {
    const A = [], B = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l * wd / 2, ny = dx / l * wd / 2;
      A.push([p[0] + nx, p[1] + ny]); B.push([p[0] - nx, p[1] - ny]);
    });
    return { type: 'poly', pts: [...A, ...B.reverse()] };
  };
  const dot = (p, r) => ({ type: 'circle', cx: p[0], cy: p[1], r });
  // a mass round bone points: the smoothed hull of horizontal elliptical rings (fwd semi-axis a, side semi-axis b)
  const blob = (name, rings, mat, band = 1, shade = 'normal', round = 0.06) => {
    const pts = [];
    for (const [n, u, f, sd, up, a, b] of rings) for (let i = 0; i < 16; i++) { const t = (i / 16) * Math.PI * 2; pts.push(at(n, u, f + a * Math.cos(t), sd + b * Math.sin(t), up)); }
    return { type: 'path', name, underlay: true, mat, shade, round: U(round), band, d: smooth(hull(pts)) };
  };
  // a spire or claw: from a base point to a tip, half-width hw px, tapering to the point
  const spike = (name, b, t, hw, band = 1, mat = rock, shade = 'cyl') => {
    const dx = t[0] - b[0], dy = t[1] - b[1], l = Math.hypot(dx, dy) || 1, d = [dx / l, dy / l], nn = [-d[1], d[0]];
    const q = (k, m) => [b[0] + d[0] * k + nn[0] * m, b[1] + d[1] * k + nn[1] * m];
    return { type: 'path', name, underlay: true, mat, shade, axis: Math.abs(dx) > Math.abs(dy) ? 'y' : 'x', band, d: `M${f2(q(0, -hw))} Q${f2(q(l * 0.55, -hw * 0.9))} ${f2(t)} Q${f2(q(l * 0.55, hw * 0.9))} ${f2(q(0, hw))} Z` };
  };
  const tube = (name, a, b, r, r1, mat, band = 1) => ({ type: 'capsule', name, underlay: true, mat, shade: 'cyl', band, a, b, r, r1 });

  // ---- the throne back: an arched wingback slab rising from the shoulders high above the head, leaning back a little;
  // its wings sweep forward round the head, so the side facings keep a deep mass; outline in rig shares
  // [side, up from the spine's top, fwd of the slab's front face]
  const backOutline = [[-0.15, -0.42, 0], [-0.2, -0.12, 0.02], [-0.23, 0.04, 0.1], [-0.25, 0.18, 0.08], [-0.2, 0.28, 0.02], [-0.1, 0.33, 0], [0, 0.35, 0], [0.1, 0.33, 0], [0.2, 0.28, 0.02], [0.25, 0.18, 0.08], [0.23, 0.04, 0.1], [0.2, -0.12, 0.02], [0.15, -0.42, 0]];
  const lean = up => -0.12 - 0.05 * Math.max(0, up + 0.42) / 0.77;
  const backPts = [];
  for (const [sd, up, wf] of backOutline) { backPts.push(at('spine', 1, lean(up) + wf, sd, up)); backPts.push(at('spine', 1, lean(up) - 0.13, sd, up)); }
  const bd = dep('spine', -0.2);
  put(bd, { type: 'path', name: 'throne-back', underlay: true, mat: rock, shade: 'normal', round: U(0.12), d: smooth(hull(backPts)) });
  // the spires: three up out of the crest and one out of each shoulder of the arch, leaning back with the slab
  const spires = [[0, 0.33, 0.43, 0.045, 0], [-0.16, 0.28, 0.4, 0.04, 1], [0.16, 0.28, 0.4, 0.04, 1], [-0.25, 0.16, 0.36, 0.035, 2], [0.25, 0.16, 0.36, 0.035, 2]];
  for (const [sd, up, tip, hw, band] of spires) {
    const top = sd === 0 ? 0.43 : tip;
    put(bd - 0.01, spike('spire', at('spine', 1, lean(up) - 0.065, sd, up - 0.04), at('spine', 1, lean(top) - 0.065, sd * 1.12, top), U(hw), band, iron));
  }
  // its front face, seen from the front: a maroon panel inset in the arch, so the stone head reads against it
  if (front > 0.3) {
    const inset = backOutline.slice(1, -1).map(([sd, up]) => at('spine', 1, lean(up) + 0.005, sd * 0.72, up * 0.88 + 0.01));
    put(bd + 0.01, { type: 'path', name: 'back-panel', mat: [ember[1], ember[2], ember[2]], shade: 'normal', round: U(0.1), d: smooth(inset) });
    // iron studs round the panel
    for (const [sd, up] of backOutline.slice(2, -2)) mark('stud', 'back-panel', 'metal', 0, dot(at('spine', 1, lean(up) + 0.006, sd * 0.66, up * 0.82 + 0.01), U(0.009)));
  }
  // the ember gem at the crest: the bright accent, on both faces of the slab
  if (Math.abs(front) > 0.3) {
    const g = at('spine', 1, lean(0.3) + (front > 0 ? 0.01 : -0.14), 0, 0.29), r = U(0.035);
    put(front > 0 ? bd + 0.02 : bd + U(0.5), { type: 'path', name: 'crest-gem', underlay: true, mat: pal.glow, shade: 'sphere', d: smooth([[g[0], g[1] - r * 1.4], [g[0] + r, g[1]], [g[0], g[1] + r * 1.2], [g[0] - r, g[1]]]) });
  }

  // ---- legs: short thick throne legs, a knee, splayed, broad feet
  for (const sd of ['L', 'R']) {
    const up = `leg${sd}_up`, lo = `leg${sd}_lo`, d = P.depth(up), k = sd === 'L' ? -1 : 1;
    put(d, tube('thigh', at(up, 0, 0, 0), at(up, 1, 0.01, 0.03 * k), U(0.1), U(0.08), rock));
    put(d + 0.01, tube('shin', at(lo, 0, 0.01, 0.03 * k), at(lo, 0.85, 0, 0.05 * k), U(0.08), U(0.06), rock, 2));
    put(d + 0.02, blob('knee', [[up, 1, 0.04, 0.03 * k, 0, 0.055, 0.06]], rock, 1, 'sphere'));
    put(d + 0.03, blob('foot', [[lo, 1, 0.05, 0.05 * k, 0, 0.1, 0.08], [lo, 1, 0.0, 0.05 * k, 0.05, 0.06, 0.06]], rock, 1, 'normal', 0.04));
  }

  // ---- the trunk: a hunched barrel chest tapering to a narrow waist, deep front to back
  put(0.01, blob('torso', [
    ['spine', 0.12, 0, 0, 0, 0.1, 0.12],
    ['spine', 0.4, 0.03, 0, 0, 0.14, 0.17],
    ['spine', 0.68, 0.06, 0, 0, 0.19, 0.24],
    ['spine', 0.9, 0.04, 0, 0, 0.17, 0.25],
    ['spine', 1, 0.0, 0, 0.02, 0.1, 0.16],
  ], rock, 1, 'normal', 0.14));

  // ---- the seat: a broad stone shelf jutting forward at the hips, the ember cushion on top
  const seatF = 0.1;
  put(dep('spine', seatF), blob('seat', [['spine', 0.06, seatF, 0, 0.02, 0.2, 0.29], ['spine', 0.06, seatF, 0, -0.04, 0.19, 0.27], ['spine', 0.06, seatF - 0.02, 0, -0.1, 0.17, 0.24], ['spine', 0.06, seatF - 0.04, 0, -0.15, 0.13, 0.19]], rock, 2, 'normal', 0.1));
  put(dep('spine', seatF) + 0.01, blob('seat-edge', [['spine', 0.06, seatF, 0, 0.02, 0.2, 0.29], ['spine', 0.06, seatF, 0, 0.0, 0.2, 0.29]], rock, 0, 'flat'));
  if (front > -0.6) put(dep('spine', seatF) + 0.02, blob('cushion', [['spine', 0.06, seatF - 0.01, 0, 0.03, 0.17, 0.26]], ember, 1, 'normal', 0.08));

  // ---- the head: the golem's small heavy stone head pushed forward and low on a thick neck, ember slit eyes
  const hd = dep('head', 0.04);
  put(hd - 0.02, tube('neck', at('neck', 0, 0), at('neck', 1, 0.01), U(0.085), U(0.07), rock, 2));
  put(hd, blob('head', [['head', 0.1, 0.02, 0, 0, 0.075, 0.08], ['head', 0.6, 0.0, 0, 0, 0.08, 0.085], ['head', 1, -0.015, 0, 0, 0.055, 0.065]], rock, 0, 'normal', 0.06));
  put(hd + 0.01, blob('brow', [['head', 0.62, 0.06, 0, 0, 0.04, 0.09]], rock, 2, 'flat'));
  put(hd + 0.01, blob('jaw', [['head', 0.0, 0.07, 0, 0, 0.05, 0.08], ['head', 0.25, 0.08, 0, 0, 0.04, 0.07]], rock, 1, 'normal', 0.03));
  if (front > -0.2) for (const e of [-1, 1]) {
    const p = at('head', 0.47, 0.085, 0.035 * e);
    if (U(0.035 * e) * sx + U(0.085) * front > -U(0.03)) put(hd + 0.02, { type: 'rect', name: 'eye', x: Math.round(p[0] - 1.5), y: Math.round(p[1]), w: 3, h: 1, color: 'glow.1' });
  }

  // ---- arms: armrest shoulders, thick tapered arms with an elbow, block fists; the right fist oversized and clawed
  for (const sd of ['L', 'R']) {
    const up = `arm${sd}_up`, lo = `arm${sd}_lo`, d = P.depth(up) + 0.5, k = sd === 'L' ? -1 : 1, big = sd === 'R';
    const sh = at(up, 0, 0, 0.02 * k), el = at(up, 1, 0, 0.06 * k), wr = at(lo, 0.85, 0, 0.08 * k);
    put(d, tube('upper-arm', sh, el, U(0.09), U(0.07), rock));
    put(d + 0.01, blob('elbow', [[up, 1, -0.01, 0.06 * k, 0, 0.06, 0.06]], rock, 2, 'sphere'));
    put(d + 0.02, tube('forearm', el, wr, U(0.07), U(big ? 0.085 : 0.075), rock));
    const fr = big ? 0.12 : 0.085;
    put(d + 0.03, blob('fist', [[lo, 1.02, 0.01, 0.08 * k, 0, fr, fr], [lo, 0.86, 0.0, 0.08 * k, 0, fr * 0.8, fr * 0.85]], rock, 1, 'sphere'));
    if (big) for (const [f0, s0] of [[0.06, -0.05], [0.08, 0.01], [0.05, 0.07]]) {
      put(d + 0.04, spike('claw', at(lo, 1.08, f0, 0.08 * k + s0 * k), at(lo, 1.3, f0 * 1.6, 0.08 * k + s0 * k * 1.4), U(0.03), 0, iron));
    }
    // the armrest: a great rolled shoulder block, its scroll end out over the arm
    put(d + 0.05, blob('shoulder', [[up, 0.02, 0.02, 0.03 * k, 0.04, 0.13, 0.1], [up, 0.25, 0.04, 0.05 * k, 0, 0.1, 0.09]], rock, 0, 'sphere'));
  }


  // ---- marks inside the line, kept as decal layers on their parts
  const faceF = lean(0) + 0.004, faceB = lean(0) - 0.134, onFront = front > 0.3, onBack = front < -0.3;
  // dressed-stone courses across the throne back (both faces; the panel covers their middle in front)
  for (const up of [-0.3, -0.16, -0.02, 0.12]) {
    const f = onBack ? -0.134 : 0.004;
    // in front the panel covers the middle: only the frame's two sides carry the course there
    for (const [a, b] of onFront ? [[-0.25, -0.15], [0.15, 0.25]] : [[-0.25, 0.25]]) {
      const pts = []; for (let i = 0; i <= 6; i++) pts.push(at('spine', 1, lean(up) + f, a + (b - a) * i / 6, up));
      mark('course', 'throne-back', 'cloth', 2, strip(pts, 1));
    }
    // the joints between stones, offset course by course
    const off = Math.round((up + 0.3) / 0.14) % 2 ? 0.05 : 0;
    for (const sd of [-0.17, -0.07, 0.03, 0.13].map(v => v + off).filter(v => !onFront || Math.abs(v) > 0.15)) mark('joint', 'throne-back', 'cloth', 2, strip([at('spine', 1, lean(up) + f, sd, up), at('spine', 1, lean(up + 0.13) + f, sd, up + 0.13)], 1));
  }
  // a carved arch border just inside the slab's rim, on the facing side (its lit lower lip under the groove)
  if (onFront || onBack) {
    const f = onBack ? -0.134 : 0.004;
    const rim = backOutline.slice(1, -1).map(([sd, up]) => at('spine', 1, lean(up) + f, sd * 0.88, up * 0.94 + 0.005));
    mark('arch-groove', 'throne-back', 'cloth', 2, strip(rim, 1));
    mark('arch-lip', 'throne-back', 'cloth', 0, strip(rim.map(([x, y]) => [x + 1, y + 1]), 1));
  }
  // the back face: a stone spine down the slab and a carved crown rune under the crest
  if (onBack) {
    mark('spine-ridge', 'throne-back', 'cloth', 0, strip([at('spine', 1, faceB, -0.01, 0.2), at('spine', 1, faceB, -0.01, -0.38)], 2));
    mark('spine-shade', 'throne-back', 'cloth', 2, strip([at('spine', 1, faceB, 0.02, 0.2), at('spine', 1, faceB, 0.02, -0.38)], 1));
    const c = (sd, up) => at('spine', 1, lean(up) - 0.134, sd, up);
    mark('rune', 'throne-back', 'accent', 2, strip([c(-0.08, 0.14), c(-0.08, 0.24), c(-0.04, 0.19), c(0, 0.25), c(0.04, 0.19), c(0.08, 0.24), c(0.08, 0.14), c(-0.08, 0.14)], 2));
  }
  // the cushion: tufted buttons in two rows, its top edge lit
  if (front > -0.6) for (const [f, sd] of [[0.06, -0.12], [0.06, 0], [0.06, 0.12], [-0.04, -0.06], [-0.04, 0.06], [0.12, -0.06], [0.12, 0.06]]) {
    mark('tuft', 'cushion', 'accent', 2, dot(at('spine', 0.06, seatF - 0.01 + f, sd, 0.03), U(0.01)));
  }
  // the seat's apron: a carved groove under its front edge
  if (front > -0.3) { const pts = []; for (let i = 0; i <= 10; i++) { const t = Math.PI * (0.05 + 0.9 * i / 10); pts.push(at('spine', 0.06, seatF - 0.02 + 0.16 * Math.sin(t), 0.23 * Math.cos(t), -0.07)); }
    mark('apron-groove', 'seat', 'cloth', 2, strip(pts, 1)); }
  // the chest: two courses and a crack (front), the shoulder-blade seam and a spine ridge (back)
  if (front > 0) {
    for (const u of [0.45, 0.72]) { const pts = []; for (let i = 0; i <= 8; i++) { const t = Math.PI * (0.15 + 0.7 * i / 8); pts.push(at('spine', u, 0.04 + 0.16 * Math.sin(t), 0.2 * Math.cos(t))); } mark('chest-course', 'torso', 'cloth', 2, strip(pts, 1)); }
    mark('crack', 'torso', 'cloth', 2, strip([at('spine', 0.86, 0.2, -0.06), at('spine', 0.78, 0.21, -0.03), at('spine', 0.7, 0.22, -0.05), at('spine', 0.6, 0.2, -0.01)], 1));
  } else mark('back-ridge', 'torso', 'cloth', 2, strip([at('spine', 0.9, -0.17, 0), at('spine', 0.2, -0.1, 0)], 1));
  // the face: a dark brow shelf under the brow, a lit nose ridge, a mouth seam on the jaw
  // (not while the slam fist is in front of the face, frames 1 to 3)
  const fistOverFace = ctx.state === 'attack' && Math.floor((ctx.t ?? 0) * 4 + 1e-6) >= 1 && front > 0.8;
  if (front > 0.3 && !fistOverFace) {
    mark('nose', ['jaw', 'head', 'neck'], 'cloth', 0, strip([at('head', 0.3, 0.09, 0), at('head', 0.2, 0.095, 0)], 1.4));
    mark('mouth', ['jaw', 'head', 'neck'], 'cloth', 2, strip([at('head', 0.12, 0.1, -0.035), at('head', 0.12, 0.1, 0.035)], 1));
  }
  // the crest gem's white-hot core
  if (Math.abs(front) > 0.3) { const g = at('spine', 1, lean(0.3) + (front > 0 ? 0.01 : -0.14), 0, 0.295); mark('gem-core', 'crest-gem', 'glow', 0, dot([g[0] - 0.5, g[1] - 0.5], U(0.012))); }
  // the iron spires: a lit edge on the light side
  if (Math.abs(front) > 0.3) for (const [sd, up, tip] of spires) mark('spire-edge', 'spire', 'metal', 0, strip([at('spine', 1, lean(up) - 0.065, sd - 0.012, up), at('spine', 1, lean(tip) - 0.065, sd * 1.12 - 0.004, tip - 0.02)], 1));

  items.sort((a, b) => a.depth - b.depth || a.i - b.i).forEach(it => s.add(it.node));
  let pr = ctx.lib.proc(s)
    .add('ao', { strength: 1 })
    .add('materialNoise', { part: ['throne-back', 'torso', 'seat'], amount: 0.06, scale: 3, seed: ctx.variant ?? 0 });
  // one decal layer per part, ramp and band (its marks as a shape list), so a mark hidden in one facing never stands alone
  const groups = new Map();
  for (const m of marks) {
    const k = `${m.part}-${m.mat}${m.band}`;
    if (!groups.has(k)) groups.set(k, { name: k, part: m.part, mat: m.mat, band: m.band, shape: [] });
    groups.get(k).shape.push(m.shape);
  }
  for (const g of groups.values()) pr = pr.add('decal', g);
  return pr.add('groundShadow', {}).render();
}

// Named points per frame: head, hand (the right fist) from the rig; `ground` comes from the frame.
export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P) };
  delete a.ground;
  return a;
};
