// boss-nethys-the-forgotten base.v2 (r2, from base.v1) - the decoration pass on the owner-approved v1 shape: silhouette
// kept, changes inside the line only. Forms lit as round masses from the direction's light (up-left): torso normal,
// head, shoulders and hands sphere, limbs, tail, horns, wing spars and the waist-cloth cyl, the wing membrane linear (no
// flat slabs). The hide stays on the accent ramp (recolour: accent), as family-p-cap's does. Materials: horns, claws and
// hooves blackened horn (hair), the waist-cloth and its panel dark void cloth on the ramp's two dark steps (was hair, so the hide and goat legs read
// apart from it), the belt leather. The void orb - the one bright accent - is sphere-lit on the glow ramp with a dark
// void slit at its heart, white-hot (glow.0) with its shadow side on the orange step, echoed only by the glowing eyes. Decals: a void sigil on the sternum (front), a ridge of dark
// spine plates down the back and a dark mane over the back of the skull (back facings), a belt buckle. Proc: AO on the
// body masses, light material noise on the waist-cloth and wings, a rim light on the shadow side of the body.
// boss-nethys-the-forgotten base.v1 (r1) SHAPE DRAFT: Nethys the Forgotten, the void demon-sorcerer of the void halls
// (family p, a demon/caster boss drawn 7.8 m tall, 3.4x the player). Silhouette and form only, flat materials, no proc
// layers. The family-p pit fiend (bat wings, horned skull, goat legs, barbed tail) made his own: he stands tall and
// upright where Azhul hunches, a broad wedge chest on a narrow waist, FOUR arms (the upper left raised high in a
// clawed casting hand beside the head, the upper right holding a big void orb, the lower pair bent forward with open
// talons), a crown of seven straight horns fanning from the skull like a broken halo, and his ruined bat wings hanging
// from the shoulders as a torn mantle that flares wide to a tattered edge at the knees (so the legs show below it),
// a dagged waist-cloth with a long front panel over thick digitigrade goat legs on hooves, and a long barbed tail.
// The bright accent is the void orb (glow ramp). The attack swings the orb hand in an arc: raised up and back,
// overhead, slammed forward and down (held contact frame, the orb swollen), then back.
// The hide is the accent ramp (recolour: accent), the dominant ramp, so the row's violet token stays his main hue.
// From the template iso humanoid walker on the shared biped rig (`ctx.lib.rigs.body`): facings s, se, e, ne, n are
// drawn here and the engine mirrors the west ones; parts are placed as 3D points on the rig, so they turn with it.
export const meta = { brief: 'boss-nethys-the-forgotten', pass: 'r2', notes: 'decorated: upright four-armed void fiend, horn-fan crown, void orb, ruined-wing mantle, goat legs', recolour: 'accent' };

export const params = {};

const HM = 7.8; // metres, from the brief
// the orb swing, per attack frame: spine lean and the orb hand's point (forward, his right side, up; in U from the top
// of the spine)
const SWING = [
  { spine: 8, hand: [-12, 27, 22] },   // wind-up: raised up and back
  { spine: 0, hand: [2, 16, 34] },     // overhead
  { spine: -14, hand: [28, 6, -12] },  // contact: slammed forward and down, held
  { spine: -6, hand: [18, 30, -4] },   // recovery
];
const REST = [16, 30, -16]; // the orb held out at his right side, palm up

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, ground = h - 1;
  // the rig's height runs to the crown of the skull; the horn fan adds the rest above it
  const H = Math.round(HM * metre * 0.86), U = H / 100;
  // tall upright proportions: long goat legs, a long wedge torso, a neck, a smallish skull, broad shoulders
  const rig = ctx.lib.rigs.body('biped', ctx, { ground, height: H, proportions: { hip: 0.02, spine: 0.35, neck: 0.05, head: 0.11, leg_up: 0.235, leg_lo: 0.235, arm_up: 0.19, arm_lo: 0.19, shoulder: 0.9, armSep: 0.26, legSep: 0.1 } });
  const frame = (ctx.logical ?? ctx.frame ?? 0) % 4, attack = ctx.state === 'attack';
  const base = rig.pose(ctx.state, ctx.t), angles = { neck: 0, head: 0, spine: attack ? SWING[frame].spine : (base.angles.spine ?? 0) };
  const P = rig.pose(ctx.state, ctx.t, { angles });
  const { sx, front, side } = rig, headH = 14 * U, headW = 13 * U * (1 - 0.12 * side);
  const profile = side > 0.9, hc = P.at('head', 0.5, 1 * U), top = hc[1] - headH * 0.5;
  const showFace = front > -0.3;
  const sway = ctx.state === 'walk' ? Math.sin(ctx.t * Math.PI * 4) : 0;
  const orbHand = attack ? SWING[frame].hand : [REST[0] + 2 * sway, REST[1], REST[2]];
  const orbR = (attack && frame === 2 ? 8 : 6.5);
  return { w, h, U, rig, P, sx, front, side, ground, headH, headW, profile, hc, top, showFace, frame, attack, sway, orbHand, orbR };
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

// two-bone reach in body space: the elbow between shoulder s and hand t, bent toward `hint`; the hand is pulled in
// when it is out of reach, so the arm's segments keep their lengths
const reach = (s, t, a, b, hint) => {
  let d = t.map((v, i) => v - s[i]), l = Math.hypot(...d);
  if (l > a + b - 0.5) { const k = (a + b - 0.5) / l; d = d.map(v => v * k); l = a + b - 0.5; }
  const u = d.map(v => v / l), x = (a * a - b * b + l * l) / (2 * l), y = Math.sqrt(Math.max(0, a * a - x * x));
  const hd = hint.reduce((n, v, i) => n + v * u[i], 0), p = hint.map((v, i) => v - hd * u[i]), pl = Math.hypot(...p) || 1;
  return { elbow: s.map((v, i) => v + u[i] * x + (p[i] / pl) * y), hand: s.map((v, i) => v + d[i]) };
};

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx);
  const { U, P: pose, sx, front, side, ground: G, headH, headW, profile, hc, top, showFace, sway, orbHand, orbR } = L;
  const hide = pal.accent, af = Math.abs(front), back = front < -0.2, decals = [];
  // a 3D point on the body (forward, his right side, up; in U) from a bone, projected by the rig
  const Q = (f, sd, up, bone = 'spine', u = 0) => pose.at(bone, u, f * U, sd * U, up * U);
  const T = p => Q(p[0], p[1], p[2], 'spine', 1); // body space at the top of the spine
  const slice = (bone, u, up, a, b, o = 0) => { const c = Q(o, 0, up, bone, u), hw = Math.hypot(a * front, b * sx) * U; return [[c[0] - hw, c[1]], [c[0] + hw, c[1]]]; };
  const body = levels => { const L2 = levels.map(l => slice(...l)); return [...L2.map(p => p[1]), ...L2.slice().reverse().map(p => p[0])]; };

  // ---- the ruined wings: hung from the shoulders as a torn mantle, the wrist spikes rising beside the head, the
  // membrane flaring wide and back to a tattered edge at the knees
  const wing = sd => {
    const W = (f, x, up) => T([f, sd * x, up]);
    const root = W(-8, 10, -2), wrist = W(-14, 27, 15), ends = [W(-28, 44, -20), W(-38, 42, -42), W(-44, 35, -58), W(-40, 25, -66), W(-28, 16, -58)], root2 = W(-12, 12, -40);
    const j = p => p.join(' '), edge = [...ends, root2];
    let dd = `M${j(root)} Q${j(W(-10, 18, 16))} ${j(wrist)} Q${j(W(-24, 40, 2))} ${j(ends[0])}`;
    for (let i = 1; i < edge.length; i++) {
      const a = edge[i - 1], b = edge[i], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], c = [m[0] + (wrist[0] - m[0]) * 0.22, m[1] + (wrist[1] - m[1]) * 0.22];
      dd += ` Q${j(c)} ${j(b)}`;
    }
    s.add({ type: 'group', name: 'wing', underlay: true, children: [
      { type: 'path', name: 'wing-membrane', d: dd + ' Z', mat: pal.leather, shade: 'linear' },
      ...ends.slice(0, 4).map(e => ({ type: 'tube', name: 'wing-rib', pts: [wrist, e], w: 1.6 * U, w1: 0.8 * U, mat: pal.leather, shade: 'cyl' })),
      { type: 'tube', name: 'wing-spar', pts: [root, W(-10, 18, 12), wrist], w: 3.4 * U, w1: 2 * U, mat: pal.leather, shade: 'cyl' },
      { type: 'poly', name: 'wing-claw', pts: [W(-14, 25, 14), W(-16, 29, 26), W(-14, 30, 14)], mat: pal.hair, shade: 'linear' },
    ] });
  };
  const wings = () => { const order = sx >= 0 ? [-1, 1] : [1, -1]; for (const sd of order) wing(sd); };

  // ---- the long barbed tail, curling out behind toward his left
  const tail = () => {
    const sw = sway * 1.2;
    s.add({ type: 'group', name: 'tail', underlay: true, children: [
      { type: 'tube', name: 'tail-whip', pts: [Q(-7, -2, -2), Q(-18, -10 + sw, -16), Q(-20, -24 + sw, -34), Q(-12, -36 + sw, -42)], w: 4.2 * U, w1: 1.4 * U, mat: hide, shade: 'cyl' },
      { type: 'poly', name: 'barb', pts: [Q(-13, -34 + sw, -43), Q(-8, -43 + sw, -44), Q(-12, -38 + sw, -38)], mat: hide, shade: 'linear' },
    ] });
  };

  // ---- goat legs: a thick thigh to the knee, the shin back to a high hock, a cannon down to a cloven hoof
  const legs = () => {
    for (const n of pose.far(['legL_up', 'legR_up'])) {
      const lo = n.replace('_up', '_lo'), hip = pose.start(n), knee = pose.at(n, 1, 3 * U), hoof = pose.end(lo);
      const hock = pose.at(lo, 0.6, -7 * U), hoofC = [hoof[0] + sx * 1.2 * U, G - 1.8 * U];
      s.add({ type: 'group', name: 'leg', underlay: true, children: [
        { type: 'capsule', name: 'thigh', a: hip, b: knee, r: 7.6 * U, r1: 5.4 * U, mat: hide, shade: 'cyl' },
        { type: 'capsule', name: 'shin', a: knee, b: hock, r: 5.2 * U, r1: 3.4 * U, mat: hide, shade: 'cyl' },
        { type: 'capsule', name: 'cannon', a: hock, b: [hoofC[0], hoofC[1] - 1.5 * U], r: 3 * U, r1: 2.5 * U, mat: hide, shade: 'cyl' },
      ] });
      s.add({ type: 'ellipse', name: 'hoof', underlay: true, cx: hoofC[0], cy: hoofC[1], rx: (3.4 - 0.6 * af) * U, ry: 2.2 * U, mat: pal.hair, shade: 'sphere' });
    }
  };

  // ---- the four arms: each a shoulder, a bent elbow and a clawed hand, posed in body space
  const ARM = {
    // upper left: raised high beside the head, the casting hand open with its talons up
    UL: () => ({ s: [0, -23, -3], t: [12 - 2 * sway, -31, 25], hint: [0, -1, -0.4], a: 19, b: 18, r: 5.4, up: true }),
    // upper right: the orb hand
    UR: () => ({ s: [0, 23, -3], t: orbHand, hint: L.attack ? [-0.3, 1, -0.6] : [-0.4, 1, -0.2], a: 19, b: 18, r: 5.4, orb: true }),
    // the lower pair, from the lower ribs, bent forward with open talons
    LL: () => ({ s: [1, -15, -20], t: [15 + 2 * sway, -24, -34], hint: [-0.5, -1, -0.3], a: 14, b: 14, r: 4.2 }),
    LR: () => ({ s: [1, 15, -20], t: [15 - 2 * sway, 24, -34], hint: [-0.5, 1, -0.3], a: 14, b: 14, r: 4.2 }),
  };
  // which side each arm is on, for the draw order: + is his right
  const armSide = n => n.endsWith('R') ? 1 : -1;
  const arm = n => {
    const A = ARM[n](), { elbow, hand } = reach(A.s, A.t, A.a, A.b, A.hint), sp = T(A.s), e = T(elbow), hd = T(hand), r = A.r;
    const kids = [
      { type: 'circle', name: 'shoulder', cx: sp[0], cy: sp[1], r: r * 1.25 * U, mat: hide, shade: 'sphere' },
      { type: 'capsule', name: 'upper-arm', a: sp, b: e, r: r * U, r1: r * 0.8 * U, mat: hide, shade: 'cyl' },
      { type: 'capsule', name: 'forearm', a: e, b: hd, r: r * 0.8 * U, r1: r * 0.6 * U, mat: hide, shade: 'cyl' },
      { type: 'circle', name: 'hand', cx: hd[0], cy: hd[1], r: r * 0.7 * U, mat: hide, shade: 'sphere' },
    ];
    // long talons: up from the raised hand, down and forward from the others (the orb hand's cup up under the orb)
    const dirY = A.up || A.orb ? -1 : 1;
    for (const k of [-1, 0, 1]) kids.push({ type: 'poly', name: 'claw', pts: [[hd[0] + (k * 2.2 - 0.9) * U, hd[1] + dirY * 2 * U], [hd[0] + k * 3.4 * U, hd[1] + dirY * 6.5 * U], [hd[0] + (k * 2.2 + 0.9) * U, hd[1] + dirY * 2 * U]], mat: pal.hair, shade: 'linear' });
    s.add({ type: 'group', name: `arm${n}`, underlay: true, children: kids });
    if (A.orb) {
      // the void orb, floating just over the palm: the one bright accent
      const o = T([hand[0], hand[1], hand[2] + 8.5]);
      s.add({ type: 'circle', name: 'orb', underlay: true, cx: o[0], cy: o[1], r: orbR * U, mat: pal.glow, shade: 'flat', band: 0 });
      // white-hot (glow.0) with its shadow side, lower right, on the orange step, so it stands off the red hide
      const gr = orbR * U;
      if (!back) decals.push({ name: 'glint', part: 'orb', mat: 'glow', band: 1, shape: { type: 'path', d: `M${o[0] + gr * 0.95} ${o[1] - gr * 0.2} Q${o[0] + gr * 0.9} ${o[1] + gr * 0.9} ${o[0] - gr * 0.2} ${o[1] + gr * 0.95} Q${o[0] + gr * 0.45} ${o[1] + gr * 0.45} ${o[0] + gr * 0.95} ${o[1] - gr * 0.2} Z` } });
      // the void at its heart: a dark slit, so it reads as a void orb and not a fireball
      const vr = Math.max(1, Math.round(orbR * 0.2 * U)), vx = Math.round(o[0] + 0.6 * U), vy = Math.round(o[1] + 0.6 * U);
      if (!back) decals.push({ name: 'void', part: 'orb', mat: 'cloth', band: 2, shape: { type: 'poly', pts: [[vx, vy - vr * 2], [vx + vr, vy], [vx, vy + vr * 2], [vx - vr, vy]] } });
      L.orbAt = o;
    }
    if (n === 'UR') L.handAt = hd;
  };

  // ---- the torso: a broad wedge chest on round shoulders, tapering to a narrow waist (never a box)
  const torso = () => {
    const pts = body([
      ['spine', 0, 2, 10, 9, 0], ['spine', 0.25, 0, 9, 9.5, 1], ['spine', 0.5, 0, 12.5, 13, 3], ['spine', 0.7, 0, 20, 15, 4],
      ['spine', 0.85, 0, 24, 14, 2], ['spine', 0.95, 0, 17, 12, 0], ['spine', 1.02, 0, 10, 9, -1], ['spine', 1.08, 0, 6, 6, -1],
    ]);
    s.add({ type: 'path', name: 'torso', underlay: true, d: smooth(pts), mat: hide, shade: 'normal', round: 5 * U });
    if (front > 0.5 && !(L.attack && L.frame === 2)) {
      // a void sigil cut into the sternum: a diamond with a bar through it
      const c = Q(12, 0, 0, 'spine', 0.78).map(Math.round), r = Math.max(2, Math.round(3 * U));
      decals.push({ name: 'sigil', part: 'torso', mat: 'cloth', band: 2, shape: [
        { type: 'poly', pts: [[c[0], c[1] - r], [c[0] + r * 0.7, c[1]], [c[0], c[1] + r], [c[0] - r * 0.7, c[1]]] },
        { type: 'rect', x: c[0] - r, y: c[1], w: r * 2 + 1, h: 1 } ] });
    }
    if (front < -0.4) {
      // a ridge of dark spine plates down the back
      [0.32, 0.47, 0.62, 0.78].forEach((u, i) => {
        const c = Q(-12, 0, 0, 'spine', u).map(Math.round), r = Math.max(1.5, (1.4 + 0.25 * i) * U);
        decals.push({ name: `plate${i}`, part: 'torso', mat: 'hair', band: 1, shape: { type: 'poly', pts: [[c[0], c[1] - r], [c[0] + r, c[1]], [c[0], c[1] + r + 1], [c[0] - r, c[1]]] } });
      });
    }
  };

  // ---- the waist-cloth: dagged hide flaring from the hips to above the knee, a long panel hanging between the legs
  const skirt = () => {
    const lv = [['spine', 0, 3, 11, 9, 0], ['spine', 0, -5, 14, 10, 0], ['spine', 0, -11, 18, 12, -1]];
    const [l0, l1, l2] = lv.map(l => slice(...l)), hem = slice('spine', 0, -17, 22, 14, -1), sw = sway * U;
    const hemL = [hem[0][0] + sw, hem[0][1]], hemR = [hem[1][0] + sw, hem[1][1]], dags = [];
    for (let i = 1; i < 7; i++) { const u = i / 7; dags.push([hemR[0] + (hemL[0] - hemR[0]) * u, hemR[1] + (hemL[1] - hemR[1]) * u + (i % 2 ? -3.2 : 1) * U]); }
    const pts = [l0[1], l1[1], l2[1], hemR, ...dags, hemL, l2[0], l1[0], l0[0]];
    s.add({ type: 'path', name: 'skirt', underlay: true, d: smooth(pts, [3, 4, 5, 6, 7, 8, 9, 10]), mat: [pal.cloth[1], pal.cloth[2]], shade: 'cyl' });
    // the long panel, front and back alike, narrowing to a forked tip at mid-shin
    const pf = back ? -9 : 9, c0 = Q(pf, 0, 1), c1 = Q(pf + 1, 0, -38), k = 1 - 0.5 * side, pw = 6 * U * k + 1.5 * U * side;
    s.add({ type: 'path', name: 'panel', underlay: true, d: smooth([[c0[0] - pw, c0[1]], [c0[0] + pw, c0[1]], [c1[0] + pw * 0.75 + sw, c1[1]], [c1[0] + sw, c1[1] - 3 * U], [c1[0] - pw * 0.75 + sw, c1[1]]], [0, 1, 2, 3, 4]), mat: [pal.cloth[1], pal.cloth[2]], shade: 'linear' });
    // a belt cinching it
    const b0 = slice('spine', 0, 4, 11.5, 9.5, 0), b1 = slice('spine', 0, 0, 12.5, 10, 0), dip = 1.5 * U * af;
    s.add({ type: 'path', name: 'belt', underlay: true, d: `M${b0[0][0]} ${b0[0][1]} Q${(b0[0][0] + b0[1][0]) / 2} ${b0[0][1] + dip} ${b0[1][0]} ${b0[1][1]} L${b1[1][0]} ${b1[1][1]} Q${(b1[0][0] + b1[1][0]) / 2} ${b1[0][1] + dip} ${b1[0][0]} ${b1[0][1]} Z`, mat: pal.leather, shade: 'cyl' });
    if (front > 0.5) { const bc = [(b0[0][0] + b0[1][0] + b1[0][0] + b1[1][0]) / 4, (b0[0][1] + b1[0][1]) / 2 + dip].map(Math.round); decals.push({ name: 'buckle', part: 'belt', mat: 'hair', band: 0, shape: { type: 'rect', x: bc[0] - 1, y: bc[1] - 1, w: 3, h: 2 } }); }
  };

  // ---- the head: an upright horned fiend skull on a neck, crowned with a fan of seven straight horns
  const head = () => {
    const [cx, cy] = hc, hw = headW / 2;
    s.add({ type: 'capsule', name: 'neck', underlay: true, a: Q(0, 0, -1, 'spine', 1), b: [cx, cy + 2 * U], r: 5.2 * U, r1: 4.2 * U, mat: hide, shade: 'cyl' });
    // the horn fan, from behind the crown, so the skull sits in front of its roots (3D, so it turns with him)
    // the roots ring the back half of the crown, so the fan spreads sideways from the front and backwards in profile
    const horns = [];
    for (const i of [-3, -2, -1, 0, 1, 2, 3]) {
      const Hn = (f, x, up) => Q(f, x, up, 'head', 0.5), a = Math.abs(i), ph = i * Math.PI / 6.4;
      const of = -Math.cos(ph), os = Math.sin(ph), rise = 22 - a * 3.6, out = 6 + a * 3;
      const b0 = [of * 3, os * 5.5, 4];
      horns.push({ type: 'tube', name: 'horn', pts: [Hn(...b0), Hn(b0[0] + of * out * 0.4, b0[1] + os * out * 0.4, 4 + rise * 0.55), Hn(b0[0] + of * out, b0[1] + os * out, 4 + rise)], w: 3.4 * U, w1: 1 * U, mat: pal.hair, shade: 'cyl' });
    }
    // one group, one outline round the whole crown, so crossing horns in the turned views don't weave a checker
    s.add({ type: 'group', name: 'crown', underlay: true, children: horns });
    const skull = [[cx, top], [cx + hw * 0.95, top + headH * 0.14], [cx + hw * 1.02, top + headH * 0.45], [cx + hw * 0.75, top + headH * 0.78], [cx + hw * 0.42 + sx * 1.2 * U, top + headH * 1.02], [cx - hw * 0.42 + sx * 1.2 * U, top + headH * 1.02], [cx - hw * 0.75, top + headH * 0.78], [cx - hw * 1.02, top + headH * 0.45], [cx - hw * 0.95, top + headH * 0.14]];
    s.add({ type: 'path', name: 'head', underlay: true, d: smooth(skull), mat: hide, shade: 'sphere' });
    if (back) {
      // from behind: a dark mane over the back of the skull
      decals.push({ name: 'mane', part: 'head', mat: 'hair', band: 1, shape: { type: 'path', d: smooth([[cx, top + 1], [cx + hw * 0.85, top + headH * 0.25], [cx + hw * 0.7, top + headH * 0.75], [cx, top + headH * 0.92], [cx - hw * 0.7, top + headH * 0.75], [cx - hw * 0.85, top + headH * 0.25]]) } });
    }
    if (showFace) {
      const fx = sx * hw * 0.35, by = top + headH * 0.42;
      s.add({ type: 'path', name: 'brow', d: smooth([[cx + fx - hw * 0.9, by + U], [cx + fx - hw * 0.5, by - 2 * U], [cx + fx, by - 0.8 * U], [cx + fx + hw * 0.5, by - 2 * U], [cx + fx + hw * 0.9, by + U], [cx + fx, by + 0.4 * U]]), mat: hide, shade: 'flat', band: 0 });
      const ey = Math.round(by + 1.2 * U), eyes = profile ? [cx + fx + hw * 0.45] : [cx + fx - hw * 0.42, cx + fx + hw * 0.42];
      for (const ex of eyes) s.add({ type: 'rect', name: 'eye', x: Math.round(ex) - 1, y: ey, w: 2, h: 1, mat: pal.glow, shade: 'flat', band: 0 });
      const my = Math.round(top + headH * 0.8), mw = profile ? hw * 0.55 : hw * 0.95, mx = cx + fx * 1.3 + sx * 1.2 * U;
      s.add({ type: 'rect', name: 'mouth', x: Math.round(mx - mw / 2), y: my, w: Math.max(2, Math.round(mw)), h: 1, color: 'outline' });
      for (const k of profile ? [0.25] : [-0.3, 0.3]) s.add({ type: 'rect', name: 'fang', x: Math.round(mx + k * mw), y: my, w: 1, h: 2, mat: pal.hair, shade: 'flat', band: 0 });
    }
  };

  // ---- draw order: back to front for the facing. Arms on the far side go behind the torso in the turned views.
  const names = ['UL', 'UR', 'LL', 'LR'];
  const farSide = sx >= 0 ? -1 : 1; // turned to his right (east), his left side is away from the viewer
  const farArms = side > 0.3 ? names.filter(n => armSide(n) === farSide) : [];
  const nearArms = names.filter(n => !farArms.includes(n));
  if (back) {
    // from behind every arm is in front of him (away from the viewer): drawn first, the wings and tail over the back
    for (const n of names) arm(n);
    legs(); skirt(); torso(); head(); wings(); tail();
  } else {
    wings(); tail(); legs();
    for (const n of farArms) arm(n);
    torso(); skirt(); head();
    // lower arms under the upper ones
    for (const n of nearArms.filter(n => n[0] === 'L')) arm(n);
    for (const n of nearArms.filter(n => n[0] === 'U')) arm(n);
  }
  let pr = ctx.lib.proc(s)
    .add('ao', { part: ['torso', 'skirt', 'head'] })
    .add('materialNoise', { part: ['skirt', 'wing-membrane'], amount: 0.1, scale: 2, seed: ctx.variant ?? 0 })
    .add('rimLight', { part: ['torso', 'head', 'thigh', 'upper-arm'], side: 'away' });
  for (const d of decals) pr = pr.add('decal', d);
  return pr.add('groundShadow', {}).render();
}

// Named points per frame: eye/eye2/mouth where the face is seen; `hand` is the orb hand; `orb` is the void orb.
export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: [Math.round(L.hc[0]), Math.round(L.hc[1])] };
  delete a.ground;
  const U = L.U, Tp = p => L.P.at('spine', 1, p[0] * U, p[1] * U, p[2] * U);
  const hand = reach([0, 23, -3], L.orbHand, 19, 18, [0, 1, 0]).hand;
  a.hand = Tp(hand).map(Math.round);
  a.orb = Tp([hand[0], hand[1], hand[2] + 8.5]).map(Math.round);
  if (L.showFace) {
    const hw = L.headW / 2, fx = L.sx * hw * 0.35, ey = Math.round(L.top + L.headH * 0.42 + 1.2 * U);
    if (L.profile) a.eye = [Math.round(L.hc[0] + fx + hw * 0.45), ey];
    else { a.eye = [Math.round(L.hc[0] + fx - hw * 0.42), ey]; a.eye2 = [Math.round(L.hc[0] + fx + hw * 0.42), ey]; }
    a.mouth = [Math.round(L.hc[0] + fx * 1.3 + L.sx * 1.2 * U), Math.round(L.top + L.headH * 0.8)];
  }
  return a;
};
