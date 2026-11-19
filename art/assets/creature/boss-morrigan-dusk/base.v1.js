// boss-morrigan-dusk base.v1 (r1) — SHAPE DRAFT, flat materials, no proc layers. Morrigan Dusk: the violet ghost caster
// of the void halls, a unique boss of family-w-cap (the wraiths) drawn at 7.3 m on the shared biped rig
// (`ctx.lib.rigs.body`). From the family it keeps the deep empty hood with two points of light, the legless shroud that
// thins into ragged tails above the floor and the long clawed arms. What makes it the boss (mass, not a scaled wraith):
// a vast raven mantle spread from the shoulders like folded crow wings, peaked above the shoulders and falling to the
// floor in feathered points (the silhouette is wider than half its height), a tall crescent-moon crown of two curved
// horns rising off the hood, wide bell sleeves on bent arms, and a staff as tall as the figure crowned by a crescent
// holding a glowing orb (the one bright accent, glow). The body is a pear of rings on the spine (narrow chest, wide
// shoulders, a pinched waist, flaring to an uneven hem) that turns with the rig: drawn facings are three-quarter views,
// s toward the lower left (front) and w toward the upper left (back); e and n are those mirrored. The attack raises the
// staff back over the crown and sweeps it down and forward in an arc to point the orb at the target (contact held),
// the off hand clawing up in a cast. The shroud is the recoloured ramp (recolour: grass, as the family).
export const meta = { brief: 'boss-morrigan-dusk', pass: 'r1', notes: 'shape draft: raven-mantle wraith queen, crescent horn crown, bell sleeves, tall crescent staff with orb', mirror: false, recolour: 'grass' };

const YAW = { s: 'sw', w: 'nw', e: 'sw', n: 'nw' }; // e and n are the s and w drawings flipped
const FLIP = { e: true, n: true };
const HEIGHT_M = 7.3, RIG_K = 0.82; // the rig's head top; the crown's horns rise above it to the brief's height

// the staff grip (rig side plane: forward, down from the hip, in H) and its angle (180 = straight up, + forward)
const GRIP = {
  idle: [[0.2, -0.3, 172], [0.2, -0.29, 172]],
  walk: [[0.21, -0.3, 170], [0.19, -0.29, 174], [0.21, -0.3, 170], [0.19, -0.29, 174]],
  attack: [[-0.02, -0.58, 205], [0.12, -0.6, 160], [0.2, -0.44, 100], [0.18, -0.38, 140]],
};
// the off hand (claw): low and reaching at rest, raised in the cast
const OFF = { idle: [[0.2, -0.12], [0.2, -0.11]], walk: [[0.22, -0.13], [0.18, -0.11], [0.16, -0.13], [0.18, -0.11]], attack: [[0.16, -0.3], [0.22, -0.42], [0.3, -0.5], [0.24, -0.36]] };

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, ground = h - 3, H = Math.round(HEIGHT_M * metre * RIG_K);
  const U = v => v * H, flip = !!FLIP[ctx.facing];
  const rig = ctx.lib.rigs.body('biped', ctx, { facing: YAW[ctx.facing] ?? 'sw', ground, height: H,
    proportions: { head: 0.12, neck: 0.05, arm_up: 0.19, arm_lo: 0.19, leg_up: 0.1, leg_lo: 0.1, armSep: 0.24, legSep: 0.08 } });
  const state = GRIP[ctx.state] ? ctx.state : 'idle', fr = (ctx.logical ?? ctx.frame) % GRIP[state].length;
  const [gx, gy, theta] = GRIP[state][fr], [ox, oy] = OFF[state][fr % OFF[state].length];
  const P = rig.pose(ctx.state, ctx.t, { ik: { armR_lo: { target: [U(gx), U(gy)], bend: -1 }, armL_lo: { target: [U(ox), U(oy)], bend: -1 } } });
  const zR = U(0.05);
  const B = (f, up, z) => P.at('hip', 0, f, z, up); // a body point: forward, up from the hip, to the right
  const t3 = [Math.sin(theta * Math.PI / 180), -Math.cos(theta * Math.PI / 180)];
  const G3 = [U(gx), -U(gy)], at3 = k => [G3[0] + t3[0] * U(k), G3[1] + t3[1] * U(k)];
  const grip = B(...at3(0), zR), tip = B(...at3(0.5), zR), butt = B(...at3(-0.36), zR);
  // the crescent at the staff head: two horns curling up around the orb
  const n3 = [t3[1], -t3[0]]; // perpendicular in the side plane
  const pt = (k, m) => { const a = at3(k); return B(a[0] + n3[0] * U(m), a[1] + n3[1] * U(m), zR); };
  const orb = pt(0.6, 0), hornA = [pt(0.5, 0.0), pt(0.53, 0.08), pt(0.64, 0.1), pt(0.7, 0.06)], hornB = [pt(0.5, 0.0), pt(0.53, -0.08), pt(0.64, -0.1), pt(0.7, -0.06)];
  return { w, h, H, U, rig, P, B, flip, theta, front: rig.front, ground, zR, grip, tip, butt, orb, hornA, hornB };
}

const smooth = pts => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let d = `M${m(pts[n - 1], pts[0]).join(' ')}`;
  for (let i = 0; i < n; i++) d += ` Q${pts[i].join(' ')} ${m(pts[i], pts[(i + 1) % n]).join(' ')}`;
  return d + ' Z';
};

// the screen outline of a stack of rings (top first): each ring's extreme left and right points, so the mass turns with
// the facing; `jag` adds a ragged lower edge to the last ring
function ringOutline(rings, jag = []) {
  const left = [], right = [], A = 20;
  let low = [];
  rings.forEach((ring, ri) => {
    const pts = [];
    for (let i = 0; i < A; i++) {
      const a = (i / A) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      pts.push(ring.at(c * (c > 0 ? ring.rf : ring.rb), sn * ring.rs));
    }
    const l = pts.reduce((p, q) => (q[0] < p[0] ? q : p)), r = pts.reduce((p, q) => (q[0] > p[0] ? q : p));
    left.push(l); right.push(r);
    if (ri === rings.length - 1) low = pts.filter(p => p[1] >= (l[1] + r[1]) / 2 - 0.5).sort((p, q) => p[0] - q[0]);
  });
  const bottom = low.map((p, i) => [p[0], p[1] + (jag[i % jag.length] ?? 0)]);
  return [...left, ...bottom.slice(1, -1), ...right.reverse()];
}

function draw(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), { U, P, B, front, ground } = L;
  const body = pal.grass, back = front < 0;
  const sp = (u, f, z) => P.at('spine', u, f, z, 0), hd = (u, f, z) => P.at('head', u, f, z, 0), nk = (u, f, z) => P.at('neck', u, f, z, 0);
  const cap = (name, a, b, r, r1, mat = body, band = 1) => ({ type: 'capsule', name, underlay: true, a, b, r, r1, mat, shade: 'flat', band });
  const ring = (fn, rf, rb, rs) => ({ at: (f, z) => fn(f, z), rf: U(rf), rb: U(rb), rs: U(rs) });
  const hipAt = up => (f, z) => B(f, U(up), z);
  const sway = P.walking ? Math.sin((ctx.t ?? 0) * Math.PI * 2) : 0, bob = ctx.state === 'idle' ? (ctx.logical ?? ctx.frame) % 2 : 0;

  // the raven mantle: one wing-like fall of cloth per shoulder, peaked above it and spreading out to feathered points
  // (forward, up from the hip, out to the side — all in H); the far wing is foreshortened by the turn
  const WING = [[-0.02, 0.6, 0.06], [-0.05, 0.66, 0.13], [-0.07, 0.88, 0.3], [-0.08, 0.7, 0.36], [-0.1, 0.57, 0.5], [-0.09, 0.5, 0.37],
    [-0.1, 0.37, 0.51], [-0.09, 0.32, 0.37], [-0.09, 0.17, 0.47], [-0.08, 0.13, 0.33], [-0.08, -0.02, 0.4], [-0.07, -0.03, 0.27],
    [-0.06, -0.16, 0.28], [-0.05, -0.08, 0.17], [-0.04, 0.2, 0.08]];
  // the mantle spreads in screen space from the shoulders (a cloak opened wide reads the same turned), a little longer
  // on the back side of the three-quarter view, so its feathered edge frames the figure in every facing
  const neck0 = sp(0.97, 0, 0), hip0 = B(0, 0, 0);
  const wing = sg => { const k = sg < 0 ? 0.86 : 1; return smooth(WING.map(([f, up, z], i) => [neck0[0] + sg * k * U(z + (i > 4 ? 0.012 * sway * sg : 0)) + U(f) * 0.3 * (front < 0 ? -1 : 1), hip0[1] - U(up + (i > 3 && i % 2 === 0 ? -0.006 * bob : 0))])); };
  const mantle = band => ({ type: 'group', name: 'mantle', children: [-1, 1].map(sg => ({ type: 'path', name: 'wing', underlay: true, mat: body, shade: 'flat', band, d: wing(sg) })) });

  // the shroud: broad shoulders, a pinched waist, flaring to a wide ragged hem just above the floor
  const shroud = ringOutline([
    ring((f, z) => nk(0.4, f, z), 0.04, 0.05, 0.05),
    ring((f, z) => sp(0.97, f, z), 0.08, 0.1, 0.14),
    ring((f, z) => sp(0.82, f, z), 0.11, 0.12, 0.17),
    ring((f, z) => sp(0.6, f, z), 0.085, 0.09, 0.11),
    ring((f, z) => sp(0.35, f, z), 0.07, 0.08, 0.085),
    ring((f, z) => sp(0.08, f, z), 0.09, 0.1, 0.12),
    ring(hipAt(-0.03), 0.14, 0.15, 0.19),
    ring(hipAt(-0.1), 0.17, 0.18, 0.24),
  ], [U(0.03), -U(0.005), U(0.045), U(0.01), U(0.035), -U(0.01), U(0.05), U(0.015), U(0.025), U(0.0)]);

  // ragged tails from the hem toward the floor, stepping with the rig's legs
  const tails = [['legL_lo', -0.08, -0.12, -0.04, -0.05, 0.035], ['legL_lo', 0.06, -0.04, 0.03, 0.0, 0.04], ['legR_lo', 0.05, 0.07, 0.0, 0.02, 0.04], ['legR_lo', -0.1, 0.15, -0.06, 0.06, 0.035]]
    .map(([leg, f0, z0, ft, zt, r]) => {
      const zl = leg === 'legL_lo' ? -U(0.08) : U(0.08), a = B(U(f0), U(-0.12), U(z0)), e = P.at(leg, 1, U(ft), U(zt) - zl, 0);
      return cap('tail', a, [e[0], Math.min(ground - 1, e[1])], U(r), U(0.006));
    });

  // the hood: a deep cowl, and the crescent crown of two horns sweeping out and up from its temples
  const hood = ringOutline([
    ring((f, z) => hd(1.14, f, z), 0.015, 0.03, 0.02),
    ring((f, z) => hd(0.95, f, z), 0.04, 0.06, 0.045),
    ring((f, z) => hd(0.65, f, z), 0.1, 0.12, 0.11),
    ring((f, z) => hd(0.2, f, z), 0.1, 0.12, 0.11),
    ring((f, z) => nk(0.2, f, z), 0.09, 0.13, 0.15),
  ]);
  const crown = [-1, 1].map(sg => {
    const pts = [hd(0.75, 0, sg * U(0.07)), hd(1.2, -U(0.01), sg * U(0.17)), hd(1.75, -U(0.02), sg * U(0.2)), hd(2.25, -U(0.02), sg * U(0.12))];
    return { type: 'group', name: 'crown-horn', underlay: true, children: [cap('horn', pts[0], pts[1], U(0.034), U(0.027), pal.metal, 1), cap('horn', pts[1], pts[2], U(0.027), U(0.018), pal.metal, 1), cap('horn', pts[2], pts[3], U(0.018), U(0.008), pal.metal, 1)] };
  });
  const circlet = cap('circlet', hd(0.8, U(0.05), -U(0.08)), hd(0.8, U(0.05), U(0.08)), U(0.022), U(0.022), pal.metal, 1);

  // arms: far one behind the shroud, near one in front; bent at the elbow, bell sleeves flaring to the wrist, claws
  const arm = side => {
    const up = `arm${side}_up`, lo = `arm${side}_lo`, hand = P.end(lo), elbow = P.end(up), sh = P.start(up);
    const dx = hand[0] - elbow[0], dy = hand[1] - elbow[1], l = Math.hypot(dx, dy) || 1, d = [dx / l, dy / l], n = [-d[1], d[0]];
    const cuff = [hand[0] - d[0] * U(0.03), hand[1] - d[1] * U(0.03)], sr = U(0.055);
    const parts = [cap('upper-arm', sh, elbow, U(0.048), U(0.036)),
      { type: 'path', name: 'sleeve', underlay: true, mat: body, shade: 'flat', band: 1, d: smooth([[elbow[0] + n[0] * U(0.035), elbow[1] + n[1] * U(0.035)], [cuff[0] + n[0] * sr, cuff[1] + n[1] * sr + U(0.02)], [cuff[0] + d[0] * U(0.02), cuff[1] + d[1] * U(0.02) + U(0.03)], [cuff[0] - n[0] * sr, cuff[1] - n[1] * sr + U(0.02)], [elbow[0] - n[0] * U(0.035), elbow[1] - n[1] * U(0.035)]]) }];
    if (side === 'L') {
      for (const k of [-1, 0, 1]) parts.push(cap('claw', hand, [hand[0] + d[0] * U(0.08) + n[0] * k * U(0.035), hand[1] + d[1] * U(0.08) + n[1] * k * U(0.035) + U(0.012)], U(0.013), U(0.004), body, 0));
    } else parts.push({ type: 'circle', name: 'fist', cx: hand[0], cy: hand[1], r: U(0.03), mat: body, shade: 'flat', band: 0 });
    return { type: 'group', name: `arm-${side}`, children: parts };
  };
  const [farArm, nearArm] = P.far(['armL_up', 'armR_up']).map(n => n[3]);

  // the staff: a long shaft, a crescent at its head cupping the glowing orb
  const staff = () => {
    s.add({ type: 'group', name: 'staff', underlay: true, children: [
      cap('shaft', L.butt, L.tip, U(0.016), U(0.014), pal.leather, 1),
      ...[L.hornA, L.hornB].flatMap(hn => [cap('crescent', hn[0], hn[1], U(0.02), U(0.017), pal.metal, 1), cap('crescent', hn[1], hn[2], U(0.017), U(0.012), pal.metal, 1), cap('crescent', hn[2], hn[3], U(0.013), U(0.008), pal.metal, 1)]),
    ] });
    s.add({ type: 'circle', name: 'orb', underlay: true, cx: L.orb[0], cy: L.orb[1], r: U(0.042), mat: pal.glow, shade: 'flat', band: 0 });
  };

  const behind = back || L.theta >= 190;
  if (!back) s.add(mantle(2)); // the mantle's inside, behind her, seen from the front
  if (behind) staff();
  s.add(arm(farArm));
  for (const t of tails) s.add(t);
  s.add({ type: 'path', name: 'shroud', underlay: true, mat: body, shade: 'flat', band: 1, d: smooth(shroud) });
  if (back) s.add(mantle(2)); // from behind the mantle's outside covers the back
  for (const c of crown) s.add(c);
  s.add({ type: 'path', name: 'hood', underlay: true, mat: body, shade: 'flat', band: 1, d: smooth(hood) });
  if (!back) s.add(circlet);
  if (!back) {
    const v = hd(0.45, U(0.07), 0);
    s.add({ type: 'ellipse', name: 'void', cx: v[0], cy: v[1], rx: U(0.05), ry: U(0.065), color: 'outline' });
    for (const e of [-1, 1]) { const p = hd(0.52, U(0.1), e * U(0.03)); s.add({ type: 'rect', name: 'eye-point', x: Math.round(p[0]), y: Math.round(p[1]), w: 2, h: 1, color: 'glow.0' }); }
  }
  s.add(arm(nearArm));
  if (!behind) staff();
  if (!back && farArm === 'R') s.add({ type: 'circle', name: 'grip', underlay: true, cx: L.grip[0], cy: L.grip[1], r: U(0.03), mat: body, shade: 'flat', band: 0 });
  return { grid: s.render(), L };
}

export function render(ctx) {
  const { grid, L } = draw(ctx);
  return L.flip ? grid.flip('x') : grid;
}

// head, hand (the staff's grip) and orb (where spells leave), mirrored with the drawing for e and n
export const anchors = ctx => {
  const L = layout(ctx), fx = x => (L.flip ? L.w - 1 - Math.round(x) : Math.round(x));
  const head = L.P.at('head', 0.5, 0, 0, 0);
  return { head: [fx(head[0]), Math.round(head[1])], hand: [fx(L.grip[0]), Math.round(L.grip[1])], orb: [fx(L.orb[0]), Math.round(L.orb[1])] };
};
