// boss-morrigan-dusk base.v2 (r2) — SHAPE REDRAW from base.v1 (the user rejected v1's shape; the note: a cloak blob
// with a columnar robe, facings alike). One change, the silhouette: a larger horned head on a visible neck, a torso
// tapered from wide shoulders to a pinched waist before the skirt flares to an uneven hem, the raven mantle cut into
// sharp feather points flaring out from the shoulders (foreshortened on the leading side, so each facing turns), and
// the crescent staff held out clear of the body with its orb the one bright accent. Still flat materials, no proc.
// Pivot fix: the hem tails now reach the frame's pivot row (v1 stood 3 px above it).
//
// base.v1 (r1) — SHAPE DRAFT, flat materials, no proc layers. Morrigan Dusk: the violet ghost caster
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
export const meta = { brief: 'boss-morrigan-dusk', pass: 'r2', notes: 'shape redraw: larger horned head on a neck, tapered torso, feather-pointed mantle, staff held clear', mirror: false, recolour: 'grass' };

const YAW = { s: 'sw', w: 'nw', e: 'sw', n: 'nw' }; // e and n are the s and w drawings flipped
const FLIP = { e: true, n: true };
const HEIGHT_M = 7.3, RIG_K = 0.82; // the rig's head top; the crown's horns rise above it to the brief's height

// the staff grip (rig side plane: forward, down from the hip, in H) and its angle (180 = straight up, + forward)
const GRIP = {
  idle: [[0.3, -0.26, 168], [0.3, -0.25, 168]],
  walk: [[0.31, -0.26, 166], [0.29, -0.25, 170], [0.31, -0.26, 166], [0.29, -0.25, 170]],
  attack: [[-0.02, -0.58, 205], [0.12, -0.6, 160], [0.2, -0.44, 100], [0.18, -0.38, 140]],
};
// the off hand (claw): low and reaching at rest, raised in the cast
const OFF = { idle: [[0.24, -0.16], [0.24, -0.15]], walk: [[0.25, -0.17], [0.22, -0.15], [0.2, -0.17], [0.22, -0.15]], attack: [[0.16, -0.3], [0.22, -0.42], [0.3, -0.5], [0.24, -0.36]] };

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, ground = h - 1, H = Math.round(HEIGHT_M * metre * RIG_K);
  const U = v => v * H, flip = !!FLIP[ctx.facing];
  const rig = ctx.lib.rigs.body('biped', ctx, { facing: YAW[ctx.facing] ?? 'sw', ground, height: H,
    proportions: { head: 0.15, neck: 0.07, arm_up: 0.19, arm_lo: 0.19, leg_up: 0.1, leg_lo: 0.1, armSep: 0.24, legSep: 0.08 } });
  const state = GRIP[ctx.state] ? ctx.state : 'idle', fr = (ctx.logical ?? ctx.frame) % GRIP[state].length;
  const [gx, gy, theta] = GRIP[state][fr], [ox, oy] = OFF[state][fr % OFF[state].length];
  const P = rig.pose(ctx.state, ctx.t, { ik: { armR_lo: { target: [U(gx), U(gy)], bend: -1 }, armL_lo: { target: [U(ox), U(oy)], bend: -1 } } });
  const zR = U(0.1); // the staff hand held out to the side, clear of the body
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
  // outer edge, from the shoulder near the neck, up to a peaked wing tip and down in sharp feather points (out to the
  // side, up from the hip, in H), back in along the body; straight segments keep the points sharp
  const WING = [[0.05, 0.6], [0.13, 0.72], [0.3, 0.9], [0.25, 0.72], [0.42, 0.7], [0.31, 0.6], [0.46, 0.52], [0.33, 0.45],
    [0.44, 0.33], [0.31, 0.29], [0.38, 0.14], [0.26, 0.13], [0.29, -0.03], [0.19, 0.03], [0.18, -0.15], [0.1, 0.05], [0.05, 0.4]];
  // spread in screen space from the shoulders; the wing on the side she turns toward is foreshortened, the other
  // flares wide, and the whole mantle sits a little behind her, so each facing reads turned
  const neck0 = sp(0.97, 0, 0), hip0 = B(0, 0, 0), lead = front < 0 ? 1 : -1;
  const wing = sg => { const k = sg === lead ? 0.7 : 1.08; return WING.map(([z, up], i) => [neck0[0] + sg * k * U(z + (i > 3 && i < 15 ? 0.012 * sway * sg : 0)) - lead * U(0.03), hip0[1] - U(up + (i > 3 && i % 2 === 0 ? -0.006 * bob : 0))]); };
  const poly = pts => `M${pts.map(p => p.map(v => v.toFixed(2)).join(' ')).join(' L')} Z`;
  const mantle = band => ({ type: 'group', name: 'mantle', children: [-1, 1].map(sg => ({ type: 'path', name: 'wing', underlay: true, mat: body, shade: 'flat', band, d: poly(wing(sg)) })) });

  // the shroud: broad shoulders, a pinched waist, flaring to a wide ragged hem just above the floor
  const shroud = ringOutline([
    ring((f, z) => sp(1.0, f, z), 0.05, 0.06, 0.08),
    ring((f, z) => sp(0.92, f, z), 0.08, 0.09, 0.16),
    ring((f, z) => sp(0.78, f, z), 0.09, 0.09, 0.13),
    ring((f, z) => sp(0.5, f, z), 0.06, 0.065, 0.07),
    ring((f, z) => sp(0.25, f, z), 0.065, 0.07, 0.075),
    ring((f, z) => sp(0.02, f, z), 0.09, 0.1, 0.11),
    ring(hipAt(-0.08), 0.13, 0.14, 0.17),
    ring(hipAt(-0.15), 0.17, 0.18, 0.23),
  ], [U(0.03), -U(0.005), U(0.045), U(0.01), U(0.035), -U(0.01), U(0.05), U(0.015), U(0.025), U(0.0)]);

  // ragged tails from the hem toward the floor, stepping with the rig's legs
  const tails = [['legL_lo', -0.08, -0.12, -0.04, -0.05, 0.035], ['legL_lo', 0.06, -0.04, 0.03, 0.0, 0.04], ['legR_lo', 0.05, 0.07, 0.0, 0.02, 0.04], ['legR_lo', -0.1, 0.15, -0.06, 0.06, 0.035]]
    .map(([leg, f0, z0, ft, zt, r]) => {
      const zl = leg === 'legL_lo' ? -U(0.08) : U(0.08), a = B(U(f0), U(-0.12), U(z0)), e = P.at(leg, 1, U(ft), U(zt) - zl, 0);
      return cap('tail', a, [e[0], ground - 1], U(r), U(0.006));
    });

  // the hood: a deep cowl, and the crescent crown of two horns sweeping out and up from its temples
  const hood = ringOutline([
    ring((f, z) => hd(1.1, f, z), 0.02, 0.03, 0.025),
    ring((f, z) => hd(0.9, f, z), 0.07, 0.08, 0.075),
    ring((f, z) => hd(0.6, f, z), 0.095, 0.1, 0.09),
    ring((f, z) => hd(0.28, f, z), 0.08, 0.09, 0.075),
    ring((f, z) => hd(0.02, f, z), 0.045, 0.06, 0.045),
  ]);
  const neck = cap('neck', sp(0.95, 0, 0), hd(0.1, 0, 0), U(0.032), U(0.03));
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
  s.add(mantle(2)); // the mantle's inside behind her from the front; from behind it spreads out under the staff
  if (behind) staff();
  s.add(arm(farArm));
  for (const t of tails) s.add(t);
  s.add({ type: 'path', name: 'shroud', underlay: true, mat: body, shade: 'flat', band: 1, d: smooth(shroud) });
  for (const c of crown) s.add(c);
  s.add(neck);
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
