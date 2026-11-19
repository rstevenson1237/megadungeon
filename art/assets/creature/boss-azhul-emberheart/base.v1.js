// boss-azhul-emberheart base.v1 (r1) SHAPE DRAFT: Azhul Emberheart, the ember fiend-caster of the lava forges (family
// p, a demon/fire/caster boss drawn 6.1 m tall, 2.6x the player). Silhouette and form only, flat materials, no proc
// layers. The family-p pit fiend (bat wings, ram horns, horned skull, goat legs, barbed tail) made his own and made
// massive: a great hunched hump of shoulders that the low-set head juts forward from, a barrel chest split open on a
// glowing ember heart, huge ram horns curling out past the shoulders, wide half-raised bat wings swept back (so they
// still widen the profile), a tattered flaring loin-skirt over thick digitigrade goat legs on hooves, and a tall
// blackened staff whose pronged head cages a big ember (the bright accent). The attack swings the staff in an arc:
// raised up and back, overhead, chopped forward and across (held contact frame), then back upright.
// The hide is the accent ramp (recolour: accent), the dominant ramp, so the row's ember token stays his main hue.
// From the template iso humanoid walker on the shared biped rig (`ctx.lib.rigs.body`): facings s, se, e, ne, n are
// drawn here and the engine mirrors the west ones; parts are placed as 3D points on the rig, so they turn with it.
export const meta = { brief: 'boss-azhul-emberheart', pass: 'r1', notes: 'shape draft: hunched ember fiend, heart-glow chest, ram horns, wide bat wings, goat legs, caged-ember staff', recolour: 'accent' };

export const params = {};

const HM = 6.1; // metres, from the brief
// the staff swing, per attack frame: arm angles (relative to the spine), spine lean, and the staff's 3D direction
// (forward, side, up; side + is his right hand's side)
const SWING = [
  { spine: 8, armR_up: 35, armR_lo: 25, dir: [-0.6, 0.75, 0.35] },    // wind-up: raised up and back
  { spine: 0, armR_up: -20, armR_lo: 10, dir: [0.25, 0.85, 0.45] },     // overhead
  { spine: -16, armR_up: 228, armR_lo: -8, dir: [0.55, -0.8, -0.2] }, // contact: chopped forward and across, held
  { spine: -8, armR_up: 205, armR_lo: 25, dir: [0.35, 0.45, 0.85] }, // recovery: back upright
];

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, ground = h - 1;
  // the rig's height runs to the crown; horns and wings add a little above it
  const H = Math.round(HM * metre * 0.9), U = H / 100;
  // heavy proportions: a long barrel torso, a small low head on a short neck, broad shoulders, thick legs set wide
  const rig = ctx.lib.rigs.body('biped', ctx, { ground, height: H, proportions: { hip: 0.02, spine: 0.37, neck: 0.03, head: 0.12, leg_up: 0.23, leg_lo: 0.23, arm_up: 0.2, arm_lo: 0.2, shoulder: 0.86, armSep: 0.27, legSep: 0.1 } });
  const frame = (ctx.logical ?? ctx.frame ?? 0) % 4, attack = ctx.state === 'attack';
  const base = rig.pose(ctx.state, ctx.t), angles = { neck: -22, head: 16 };
  if (attack) { const k = SWING[frame]; Object.assign(angles, { spine: k.spine - 4, armR_up: k.armR_up, armR_lo: k.armR_lo, armL_up: 196, armL_lo: 70 }); }
  else Object.assign(angles, { spine: (base.angles.spine ?? 0) - 4, armL_up: 192 + (base.angles.armL_up ?? 180) - 180, armL_lo: 58, armR_up: (base.angles.armR_up ?? 180) + 12, armR_lo: (base.angles.armR_lo ?? 0) + 30 });
  const P = rig.pose(ctx.state, ctx.t, { angles });
  const { sx, front, side } = rig, headH = 15 * U, headW = 14 * U * (1 - 0.12 * side);
  const profile = side > 0.9, hc = P.at('head', 0.45, 2 * U), top = hc[1] - headH * 0.5;
  const showFace = front > -0.3;
  const dir = attack ? SWING[frame].dir : [0.05, 0.3, 1], dl = Math.hypot(...dir), d = dir.map(v => v / dl);
  // at rest the staff leans out to his right, clear of the head
  const lt = (attack ? 34 : 50) * U, lb = (attack ? 30 : 42) * U; // the grip slides down the shaft for the swing
  // the ember stays inside the frame at the top of the swing: the grip slides up the shaft instead
  let tl = lt, staffTip = P.at('armR_lo', 1, d[0] * tl, d[1] * tl, d[2] * tl);
  while (tl > 16 * U && (staffTip[1] < 15 * U || staffTip[0] < 15 * U || staffTip[0] > w - 15 * U)) { tl -= U; staffTip = P.at('armR_lo', 1, d[0] * tl, d[1] * tl, d[2] * tl); }
  const staffButt = P.at('armR_lo', 1, -d[0] * lb, -d[1] * lb, -d[2] * lb);
  if (staffButt[1] > ground - 1) staffButt[1] = ground - 1;
  return { w, h, U, rig, P, sx, front, side, ground, headH, headW, profile, hc, top, showFace, staffTip, staffButt, frame, attack };
}

// a closed curve through the points (quadratic midpoint spline); `sharp` indices stay corners
const smooth = (pts, sharp = []) => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let dd = '';
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    if (i === 0) dd += sharp.includes(0) ? `M${p.join(' ')}` : `M${m(pts[n - 1], p).join(' ')} Q${p.join(' ')} ${m(p, q).join(' ')}`;
    else dd += sharp.includes(i) ? ` L${p.join(' ')}` : ` Q${p.join(' ')} ${m(p, q).join(' ')}`;
  }
  return dd + ' Z';
};

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx);
  const { U, P: pose, sx, front, side, ground: G, headH, headW, profile, hc, top, showFace, staffTip, staffButt } = L;
  const hide = pal.accent, af = Math.abs(front), back = front < -0.2;
  const sway = ctx.state === 'walk' ? Math.sin(ctx.t * Math.PI * 4) * 1.2 * U : 0;
  // a 3D point on the body (forward, his right side, up; in U) from a bone, projected by the rig
  const Q = (f, sd, up, bone = 'spine', u = 0) => pose.at(bone, u, f * U, sd * U, up * U);
  // a horizontal slice through an elliptic body (half-width a across, half-depth b front to back, centre pushed
  // forward by o): its two screen edges at this turn
  const slice = (bone, u, up, a, b, o = 0) => { const c = Q(o, 0, up, bone, u), hw = Math.hypot(a * front, b * sx) * U; return [[c[0] - hw, c[1]], [c[0] + hw, c[1]]]; };
  const body = levels => { const L2 = levels.map(l => slice(...l)); return [...L2.map(p => p[1]), ...L2.slice().reverse().map(p => p[0])]; };

  // ---- the wings: half-raised bat wings, swept back so they widen the profile as well as the front
  const wing = sd => {
    const W = (f, x, up) => Q(f, sd * x, up, 'spine', 0.85);
    const root = W(-7, 9, 2), wrist = W(-18, 25, 24), tip = W(-34, 50, 10), ends = [W(-32, 47, -12), W(-26, 38, -25), W(-18, 25, -33)], root2 = W(-9, 11, -24);
    const j = p => p.join(' '), edge = [tip, ...ends, root2];
    let dd = `M${j(root)} Q${j(W(-9, 14, 20))} ${j(wrist)} Q${j(W(-20, 40, 25))} ${j(tip)}`;
    for (let i = 1; i < edge.length; i++) {
      const a = edge[i - 1], b = edge[i], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], c = [m[0] + (wrist[0] - m[0]) * 0.32, m[1] + (wrist[1] - m[1]) * 0.32];
      dd += ` Q${j(c)} ${j(b)}`;
    }
    s.add({ type: 'group', name: 'wing', underlay: true, children: [
      { type: 'path', name: 'wing-membrane', d: dd + ' Z', mat: pal.leather, shade: 'flat', band: 1 },
      ...ends.map(e => ({ type: 'tube', name: 'wing-rib', pts: [wrist, e], w: 1.4 * U, w1: 0.8 * U, mat: pal.leather, shade: 'flat', band: 0 })),
      { type: 'tube', name: 'wing-spar', pts: [root, W(-10, 15, 17), wrist, W(-20, 38, 22), tip], w: 3.2 * U, w1: 1 * U, mat: pal.leather, shade: 'cyl' },
      { type: 'poly', name: 'wing-claw', pts: [W(-14, 23, 23), W(-14, 24, 30), W(-14, 28, 23)], mat: pal.hair, shade: 'flat', band: 0 },
    ] });
  };
  const wings = () => { const order = sx >= 0 ? [-1, 1] : [1, -1]; for (const sd of order) wing(sd); };

  // ---- the barbed tail, swinging out behind toward his right
  const tail = () => {
    const sw = sway * 0.6 / U;
    s.add({ type: 'group', name: 'tail', underlay: true, children: [
      { type: 'tube', name: 'tail-whip', pts: [Q(-6, 3, -2), Q(-16, 10 + sw, -14), Q(-14, 20 + sw, -30), Q(-6, 27 + sw, -36)], w: 4 * U, w1: 1.4 * U, mat: hide, shade: 'cyl' },
      { type: 'poly', name: 'barb', pts: [Q(-7, 25 + sw, -37), Q(-2, 33 + sw, -37), Q(-6, 28 + sw, -32)], mat: hide, shade: 'flat', band: 2 },
    ] });
  };

  // ---- goat legs: a thick thigh to the knee, the shin back to a high hock, a cannon down to a cloven hoof
  const legs = () => {
    for (const n of pose.far(['legL_up', 'legR_up'])) {
      const lo = n.replace('_up', '_lo'), hip = pose.start(n), knee = pose.at(n, 1, 3 * U), hoof = pose.end(lo);
      const hock = pose.at(lo, 0.6, -8 * U), hoofC = [hoof[0] + sx * 1.2 * U, G - 1.8 * U];
      s.add({ type: 'group', name: 'leg', underlay: true, children: [
        { type: 'capsule', name: 'thigh', a: hip, b: knee, r: 8.5 * U, r1: 6.2 * U, mat: hide, shade: 'cyl' },
        { type: 'capsule', name: 'shin', a: knee, b: hock, r: 6 * U, r1: 3.8 * U, mat: hide, shade: 'cyl' },
        { type: 'capsule', name: 'cannon', a: hock, b: [hoofC[0], hoofC[1] - 1.5 * U], r: 3.4 * U, r1: 2.8 * U, mat: hide, shade: 'cyl' },
      ] });
      s.add({ type: 'ellipse', name: 'hoof', underlay: true, cx: hoofC[0], cy: hoofC[1], rx: (3.6 - 0.6 * af) * U, ry: 2.4 * U, mat: pal.hair, shade: 'sphere' });
    }
  };

  // ---- arms: thick, bent at the elbow, ending in big clawed hands
  const arm = n => {
    // the elbow bows out from the body and the forearm comes back in, so the bend reads from the front as well
    const k = n === 'R' ? 1 : -1, a = pose.start(`arm${n}_up`), e = pose.at(`arm${n}_up`, 1, 0, k * 4 * U), hnd = pose.end(`arm${n}_lo`);
    return { type: 'group', name: `arm${n}`, underlay: true, children: [
      { type: 'capsule', name: 'upper-arm', a, b: e, r: 5.8 * U, r1: 4.6 * U, mat: hide, shade: 'cyl' },
      { type: 'capsule', name: 'forearm', a: e, b: hnd, r: 4.6 * U, r1: 3.6 * U, mat: hide, shade: 'cyl' },
      { type: 'circle', name: 'hand', cx: hnd[0], cy: hnd[1], r: 3.9 * U, mat: hide, shade: 'sphere' },
      ...[-1, 0, 1].map(k => ({ type: 'poly', name: 'claw', pts: [[hnd[0] + (k * 2.6 - 1) * U, hnd[1] + 2.4 * U], [hnd[0] + (k * 3.6) * U, hnd[1] + 6 * U], [hnd[0] + (k * 2.6 + 1) * U, hnd[1] + 2.6 * U]], mat: pal.hair, shade: 'flat', band: 0 })),
    ] };
  };

  // ---- the staff: a long blackened shaft, its head three curved prongs caging a big ember
  const staff = () => {
    const [tx, ty] = staffTip, [bx, by] = staffButt, ang = Math.atan2(tx - bx, by - ty) * 180 / Math.PI;
    const ember = L.attack && L.frame === 2 ? 6.6 : 5.6;
    s.add({ type: 'group', name: 'staff', underlay: true, children: [
      { type: 'capsule', name: 'shaft', a: [bx, by], b: [tx, ty], r: 1.6 * U, r1: 1.4 * U, mat: pal.hair, shade: 'cyl' },
      { type: 'group', name: 'staff-head', rotate: ang, origin: [tx, ty], children: [
        { type: 'circle', name: 'ember', cx: tx, cy: ty - 7 * U, r: ember * U, mat: pal.glow, shade: 'flat', band: 1 },
        { type: 'tube', name: 'prong', pts: [[tx, ty + U], [tx - 6 * U, ty - 4 * U], [tx - 6.5 * U, ty - 11 * U], [tx - 2.5 * U, ty - 16 * U]], w: 2.2 * U, w1: 0.8 * U, mat: pal.hair, shade: 'flat', band: 1 },
        { type: 'tube', name: 'prong', pts: [[tx, ty + U], [tx + 6 * U, ty - 4 * U], [tx + 6.5 * U, ty - 11 * U], [tx + 2.5 * U, ty - 16 * U]], w: 2.2 * U, w1: 0.8 * U, mat: pal.hair, shade: 'flat', band: 1 },
        { type: 'tube', name: 'prong', pts: [[tx, ty], [tx, ty - 2 * U]], w: 2.4 * U, w1: 2 * U, mat: pal.hair, shade: 'flat', band: 1 },
      ] },
    ] });
  };

  // ---- the torso: a barrel chest under a great hump of shoulders, narrowing to the waist (never a box)
  const torso = () => {
    const pts = body([
      ['spine', 0, 1, 7.5, 7, 0], ['spine', 0.28, 0, 9.5, 9, 2], ['spine', 0.52, 0, 14.5, 12, 3], ['spine', 0.72, 0, 20.5, 13, 2],
      ['spine', 0.88, 0, 25, 13, -1], ['spine', 1.0, 0, 18, 12, -4], ['spine', 1.1, 0, 9, 9, -6],
    ]);
    s.add({ type: 'path', name: 'torso', underlay: true, d: smooth(pts), mat: hide, shade: 'normal', round: 5 * U });
    // the shoulder hump: a rounded mound rising behind the low head, the same in every facing
    const hp = Q(-6, 0, 2, 'spine', 1);
    s.add({ type: 'ellipse', name: 'hump', underlay: true, cx: hp[0], cy: hp[1], rx: Math.hypot(15 * front, 9 * sx) * U, ry: 9 * U, mat: hide, shade: 'sphere' });
  };

  // ---- the loin-skirt: tattered hide flaring from the waist to a dagged, uneven hem over the thighs
  const skirt = () => {
    const lv = [['spine', 0, 3, 11, 9, 0], ['spine', 0, -5, 14, 10, 0], ['spine', 0, -10, 18, 12, -1]];
    const [l0, l1, l2] = lv.map(l => slice(...l)), hem = slice('spine', 0, -16, 23, 14, -1);
    const hemL = [hem[0][0] + sway, hem[0][1]], hemR = [hem[1][0] + sway, hem[1][1]], dags = [];
    for (let i = 1; i < 8; i++) { const u = i / 8; dags.push([hemR[0] + (hemL[0] - hemR[0]) * u, hemR[1] + (hemL[1] - hemR[1]) * u + (i % 2 ? -3.4 : 1.2) * U + (i === 4 ? -1.5 * U : 0)]); }
    const pts = [l0[1], l1[1], l2[1], hemR, ...dags, hemL, l2[0], l1[0], l0[0]];
    s.add({ type: 'path', name: 'skirt', underlay: true, d: smooth(pts, [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), mat: pal.hair, shade: 'linear' });
    // a heavy belt cinching it, curving round the waist
    const b0 = slice('spine', 0, 4, 11.5, 9.5, 0), b1 = slice('spine', 0, 0, 12.5, 10, 0), dip = 1.5 * U * af;
    s.add({ type: 'path', name: 'belt', underlay: true, d: `M${b0[0][0]} ${b0[0][1]} Q${(b0[0][0] + b0[1][0]) / 2} ${b0[0][1] + dip} ${b0[1][0]} ${b0[1][1]} L${b1[1][0]} ${b1[1][1]} Q${(b1[0][0] + b1[1][0]) / 2} ${b1[0][1] + dip} ${b1[0][0]} ${b1[0][1]} Z`, mat: pal.leather, shade: 'flat', band: 2 });
  };

  // ---- the ember heart: the chest split open on a glowing core (front and turned views)
  const heart = () => {
    if (!showFace) return;
    const c = Q(Math.hypot(12, 0) * 0.92, 0, 0, 'spine', 0.62), k = 1 - 0.45 * side;
    s.add({ type: 'ellipse', name: 'heart-rim', underlay: true, cx: c[0], cy: c[1], rx: 6.2 * U * k, ry: 7.4 * U, mat: hide, shade: 'flat', band: 2 });
    s.add({ type: 'ellipse', name: 'heart', cx: c[0], cy: c[1] + 0.4 * U, rx: 3.8 * U * k, ry: 5 * U, mat: pal.glow, shade: 'flat', band: 1 });
  };

  // ---- the head: a horned fiend skull set low on a thick neck, jutting forward from the hump
  const head = () => {
    const [cx, cy] = hc, hw = headW / 2, jut = sx * 2.2 * U;
    s.add({ type: 'capsule', name: 'neck', underlay: true, a: Q(-1, 0, 0, 'spine', 1), b: [cx, cy + 2 * U], r: 6.5 * U, r1: 5 * U, mat: hide, shade: 'cyl' });
    const skull = [[cx, top], [cx + hw * 0.95, top + headH * 0.12], [cx + hw * 1.05, top + headH * 0.45], [cx + hw * 0.8 + jut, top + headH * 0.78], [cx + hw * 0.5 + jut * 1.4, top + headH * 1.02], [cx - hw * 0.5 + jut * 1.4, top + headH * 1.02], [cx - hw * 0.8 + jut, top + headH * 0.78], [cx - hw * 1.05, top + headH * 0.45], [cx - hw * 0.95, top + headH * 0.12]];
    s.add({ type: 'path', name: 'head', underlay: true, d: smooth(skull), mat: hide, shade: 'sphere' });
    if (showFace) {
      const fx = sx * hw * 0.35, by = top + headH * 0.42;
      // a heavy brow ridge with its shadow, glowing eyes under it, a dark fanged mouth line on the squared jaw
      s.add({ type: 'path', name: 'brow', d: smooth([[cx + fx - hw * 0.9, by + U], [cx + fx - hw * 0.5, by - 2.2 * U], [cx + fx, by - 1 * U], [cx + fx + hw * 0.5, by - 2.2 * U], [cx + fx + hw * 0.9, by + U], [cx + fx, by + 0.4 * U]]), mat: hide, shade: 'flat', band: 0 });
      const ey = Math.round(by + 1.2 * U), eyes = profile ? [cx + fx + hw * 0.45] : [cx + fx - hw * 0.42, cx + fx + hw * 0.42];
      for (const ex of eyes) s.add({ type: 'rect', name: 'eye', x: Math.round(ex) - 1, y: ey, w: 2, h: 1, mat: pal.glow, shade: 'flat', band: 0 });
      const my = Math.round(top + headH * 0.8), mw = profile ? hw * 0.6 : hw * 1.1, mx = cx + fx * 1.3 + jut;
      s.add({ type: 'rect', name: 'mouth', x: Math.round(mx - mw / 2), y: my, w: Math.max(2, Math.round(mw)), h: 1, color: 'outline' });
      for (const k of profile ? [0.25] : [-0.3, 0.3]) s.add({ type: 'rect', name: 'fang', x: Math.round(mx + k * mw), y: my, w: 1, h: 2, mat: pal.hair, shade: 'flat', band: 0 });
    }
    // great ram horns from the crown, curling out past the head and round forward (3D, so they turn with him)
    for (const sd of [-1, 1]) {
      const H3 = (f, x, up) => Q(f, sd * x, up, 'head', 0.45);
      s.add({ type: 'tube', name: 'horn', underlay: true, pts: [H3(0, 4, 5), H3(-2, 11, 12), H3(-4, 19, 11), H3(-3, 23, 3), H3(1, 21, -4), H3(5, 16, -5)], w: 6 * U, w1: 1.4 * U, mat: pal.hair, shade: 'flat', band: 0 });
    }
  };

  // ---- draw order: back to front for the facing
  const arms = pose.far(['armL_up', 'armR_up']).map(n => n[3]); // far first
  if (!back) { wings(); tail(); }
  if (back) { staff(); }
  legs();
  if (side > 0.5) { s.add(arm(arms[0])); if (arms[0] === 'R' && !back) staff(); }
  torso();
  skirt();
  heart();
  if (back) { head(); tail(); wings(); s.add(arm(arms[0])); s.add(arm(arms[1])); }
  else {
    head();
    if (side > 0.5) { s.add(arm(arms[1])); if (arms[1] === 'R') staff(); }
    else { staff(); s.add(arm(arms[0])); s.add(arm(arms[1])); }
  }
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}

// Named points per frame: eye/eye2/mouth where the face is seen; `hand` is the staff hand; `staff` is the ember.
export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: [Math.round(L.hc[0]), Math.round(L.hc[1])], staff: L.staffTip.map(Math.round), heart: L.P.at('spine', 0.62).map(Math.round) };
  delete a.ground;
  if (L.showFace) {
    const hw = L.headW / 2, fx = L.sx * hw * 0.35, ey = Math.round(L.top + L.headH * 0.42 + 1.2 * L.U);
    if (L.profile) a.eye = [Math.round(L.hc[0] + fx + hw * 0.45), ey];
    else { a.eye = [Math.round(L.hc[0] + fx - hw * 0.42), ey]; a.eye2 = [Math.round(L.hc[0] + fx + hw * 0.42), ey]; }
    a.mouth = [Math.round(L.hc[0] + fx * 1.3 + L.sx * 2.2 * L.U), Math.round(L.top + L.headH * 0.8)];
  }
  return a;
};
