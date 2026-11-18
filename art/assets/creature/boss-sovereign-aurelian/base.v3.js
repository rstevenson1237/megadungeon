// boss-sovereign-aurelian base.v3 (r3, from base.v2) — the decorated pass on the owner-approved v2 shape: nothing outside
// the outer line moves (same rig, rings, parts and poses). Inside the line only: every mass is lit from the direction's
// light as a round, tapered form instead of v2's flat fills — the robe and mantle `normal` with a wide rounded edge, the
// sleeves, legs, neck and haft `cyl` along their length, the pauldrons, knees, skull, jaw, hands and the sceptre's disc
// `sphere`, the crown band and rays `bevel`; overlap AO under the skull, pauldrons and mantle; light material noise on
// the robe and mantle (leather, the family's recoloured ramp, so the family colour still leads). Decals: a dark rayed
// sun emblem on the robe's chest and a silver embroidered trim band above the hem (front), the mantle's dark tears and a
// sun sigil between the shoulders (back), a crack across the back of the skull. The face (front facings): two dark
// sockets with a bright glow point each, a nasal notch and a row of separate teeth on the narrow jaw on a bone neck.
// The sceptre: the haft's leather grip above and below the hand, a pale-hot glow core inside the accent disc (the one
// bright accent, read at 1x, with the crown gem). Review note on v2 acted on inside the line: the robe no longer reads as
// one boxy lump (lit as a rounded flaring mass with a trim line), the skeletal neck shows, the crown and core read.
// v2's header follows.
// boss-sovereign-aurelian base.v2 (r2) — SHAPE DRAFT redrawn from base.v1 (flat materials, no proc layers). The one
// change: the owner's shape note on v1 ("reads thin, like a normal robed caster") — the lich-king's mass. Shoulders set
// wider (armSep) under bigger domed pauldrons; a heavy chest tapering to a drawn-in waist; a mantle spread wide from the
// shoulders behind the body (over it in the back views); the robe flares lower and wider to a deeper ragged hem split
// over the armoured legs, knees showing, in a wider stance; a longer visible neck under the skull; the five-ray sun-crown
// and the sceptre's rayed disc drawn larger so they read at 1x, the sceptre core the one bright accent.
// v1's header follows.
// boss-sovereign-aurelian base.v1 (r1) — SHAPE DRAFT, flat materials, no proc layers. Sovereign Aurelian (glyph L, ivory,
// an undead caster of the wizard's sanctum), a unique boss of family-l-cap (the liches) drawn at about 123 px with its
// crown, 3.3x the drawn player, on the shared biped rig (`ctx.lib.rigs.body`). From the family it keeps the bone skull
// with burning eye-points under a spiked crown, the robe hanging to a ragged hem and the staff in the right hand; what
// makes it the boss and a king: real mass — great domed pauldrons on broad shoulders, a barrel chest drawn in at the
// waist, then a heavy robe flaring wide to a tattered hem split at the front over armoured legs (knees, greaves and
// sabatons show below it) — and the signature, exaggerated: a radiant sun-crown of five long rays fanning up off the
// brow (the family's crown is short and jagged) and a great sun-sceptre, taller than the robe, topped with a rayed
// disc around a glowing core (the one bright accent, with the crown's gem). The off hand is raised casting, held clear
// of the body. The attack lifts the sceptre high behind the crown and brings it over and down in an arc to point
// forward (contact frame held). Every mass is built from rings around the rig's bones, so the body turns with the
// facing: drawn facings are three-quarter views, s toward the lower left (front) and w toward the upper left (back);
// e and n are those mirrored. The robe is the recoloured ramp (recolour: leather, as the family), so ivory leads.
export const meta = { brief: 'boss-sovereign-aurelian', pass: 'r3', notes: 'decorated on the approved v2 shape: round lit masses, AO, robe noise, chest sun emblem and hem trim, mantle tears, skull face, sceptre grip and glowing core', mirror: false, recolour: 'leather' };

const YAW = { s: 'sw', w: 'nw', e: 'sw', n: 'nw' }; // e and n are the s and w drawings flipped
const FLIP = { e: true, n: true };
const HEIGHT_M = 6.75; // the rig (sole to skull top); the crown's rays carry it to about 7.7 m

// hand targets per frame (rig side plane, H units: x forward, y down, from the hip); the sceptre's tilt from upright
// toward forward, in degrees
const GRIP = {
  idle: [[0.12, -0.1], [0.12, -0.11]],
  walk: [[0.16, -0.1], [0.12, -0.11], [0.08, -0.1], [0.12, -0.11]],
  attack: [[-0.08, -0.42], [0.06, -0.5], [0.3, -0.26], [0.27, -0.22]],
};
const TILT = { idle: [0, 0], walk: [4, 0, -4, 0], attack: [-32, 12, 62, 56] };
// where the hand holds the haft: the length above the grip (H units); the swing chokes up so the disc stays in frame
const REACH = { idle: 0.46, walk: 0.46, attack: 0.3 };
const OFF = {
  idle: [[0.03, -0.56], [0.03, -0.58]],
  walk: [[0.01, -0.54], [0.03, -0.56], [0.05, -0.54], [0.03, -0.56]],
  attack: [[0.08, -0.5], [0.06, -0.54], [-0.02, -0.46], [0.0, -0.48]],
};
const LEAN = { idle: [0, 0], walk: [-3, -3, -3, -3], attack: [4, 2, -10, -8] };

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, ground = h - 2, H = Math.round(HEIGHT_M * metre);
  const U = v => v * H, flip = !!FLIP[ctx.facing];
  const rig = ctx.lib.rigs.body('biped', ctx, { facing: YAW[ctx.facing] ?? 'sw', ground, height: H,
    proportions: { hip: 0.02, head: 0.15, neck: 0.065, arm_up: 0.17, arm_lo: 0.18, leg_up: 0.19, leg_lo: 0.19, armSep: 0.34, legSep: 0.12 } });
  const state = GRIP[ctx.state] ? ctx.state : 'idle', fr = (ctx.logical ?? ctx.frame) % GRIP[state].length;
  const [gx, gy] = GRIP[state][fr], [ox, oy] = OFF[state][fr % OFF[state].length], tilt = TILT[state][fr % TILT[state].length];
  const base = rig.pose(ctx.state, ctx.t);
  const P = rig.pose(ctx.state, ctx.t, {
    angles: { spine: (base.angles.spine ?? 0) + LEAN[state][fr % LEAN[state].length], neck: base.angles.neck ?? 0, head: base.angles.head ?? 0 },
    ik: { armR_lo: { target: [U(gx), U(gy)], bend: -1 }, armL_lo: { target: [U(ox), U(oy)], bend: -1 } },
  });
  const head = P.at('head', 0.5), fwdX = Math.sign(P.at('hip', 0, U(0.1), 0, 0)[0] - P.at('hip', 0, 0, 0, 0)[0]) || -1;
  // the sceptre reaches far ahead in the swing: the whole figure sits back a little so the disc stays in frame
  const dx = -fwdX * U(0.06);
  return { w, h, H, U, rig, P, flip, state, fr, tilt, front: rig.front, ground, head, fwdX, dx };
}

// a closed smooth path through points (quadratic curves between the midpoints)
const smooth = pts => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let d = `M${m(pts[n - 1], pts[0]).join(' ')}`;
  for (let i = 0; i < n; i++) d += ` Q${pts[i].join(' ')} ${m(pts[i], pts[(i + 1) % n]).join(' ')}`;
  return d + ' Z';
};

// the screen outline of a stack of rings (top first): each ring's leftmost and rightmost projected point, so the mass
// turns with the facing; the last ring's lower half closes the bottom, cut into a ragged hem
function ringOutline(rings, H0, jag) {
  const left = [], right = [], A = 24;
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
  return [[left[0][0], left[0][1]], ...left.slice(1), ...low.slice(1, -1).map((p, i) => [p[0], p[1] + jag[i % jag.length] * H0]), ...right.reverse()];
}

function draw(ctx) {
  const { pal } = ctx.dir, scene = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), kids = [], s = { add: n => kids.push(n) };
  const { U, P, front, head, fwdX, tilt } = L, back = front < 0;
  const robe = pal.leather, iron = pal.metal, bone = [pal.skin[0], pal.skin[0], pal.hair[0]];
  const B = (f, up, z) => P.at('hip', 0, f, z, up), sp = (u, f, z) => P.at('spine', u, f, z, 0), nk = (u, f, z) => P.at('neck', u, f, z, 0);
  const cap = (name, a, b, r, r1, mat, extra = {}) => ({ type: 'capsule', name, underlay: true, a, b, r, r1, mat, shade: 'cyl', ...extra });
  const ring = (fn, cf, rf, rb, rs) => ({ at: (f, z) => fn(U(cf) + f, z), rf: U(rf), rb: U(rb), rs: U(rs) });

  // the body: broad shoulders, a barrel chest drawn in at the waist, the robe flaring wide below the hips to the hem
  const body = ringOutline([
    ring((f, z) => sp(1.0, f, z), 0, 0.07, 0.08, 0.1),
    ring((f, z) => sp(0.9, f, z), -0.01, 0.15, 0.15, 0.22),
    ring((f, z) => sp(0.7, f, z), 0.01, 0.17, 0.15, 0.22),
    ring((f, z) => sp(0.42, f, z), 0.0, 0.13, 0.12, 0.16),
    ring((f, z) => sp(0.15, f, z), 0.0, 0.11, 0.11, 0.135),
    ring((f, z) => B(f, U(0.0), z), 0, 0.14, 0.14, 0.18),
    ring((f, z) => B(f, U(-0.07), z), 0, 0.2, 0.2, 0.25),
    ring((f, z) => B(f, U(-0.14), z), 0, 0.26, 0.26, 0.32),
    ring((f, z) => B(f, U(-0.2), z), 0, 0.3, 0.3, 0.37),
  ], L.H, [0.07, -0.01, 0.1, 0.0, 0.05, -0.02, 0.09, 0.01, 0.06, 0.03]);
  // the mantle: hung from the shoulders, spread wide behind the body, its own ragged lower edge above the hem
  const mantle = ringOutline([
    ring((f, z) => sp(0.94, f, z), -0.05, 0.08, 0.12, 0.3),
    ring((f, z) => sp(0.65, f, z), -0.08, 0.08, 0.15, 0.37),
    ring((f, z) => sp(0.2, f, z), -0.1, 0.08, 0.18, 0.4),
    ring((f, z) => B(f, U(-0.1), z), -0.1, 0.08, 0.2, 0.42),
  ], L.H, [0.09, 0.0, 0.12, -0.01, 0.07, 0.02, 0.11, -0.02, 0.08, 0.01]);

  // legs: armoured, thick and tapered, a knee cop at the bend and a long sabaton on the floor
  const leg = (side, lower = false) => {
    const up = `leg${side}_up`, lo = `leg${side}_lo`, hipP = P.start(up), knee = P.end(up), ankle = P.end(lo);
    const toe = P.at(lo, 1, U(0.07), 0, U(-0.005));
    return { type: 'group', name: `leg-${side}`, underlay: true, children: [
      ...(lower ? [] : [cap('thigh', hipP, knee, U(0.058), U(0.045), iron)]),
      cap('greave', knee, ankle, U(0.045), U(0.03), iron),
      { type: 'circle', name: 'knee', cx: knee[0], cy: knee[1], r: U(0.042), mat: iron, shade: 'sphere' },
      cap('sabaton', [ankle[0] - fwdX * U(0.01), ankle[1]], toe, U(0.03), U(0.018), iron),
    ] };
  };
  const legSides = P.far(['legL_up', 'legR_up']).map(n => n[3]), legs = legSides.map(n => leg(n));

  // arms: heavy sleeves bent at the elbow, flaring to a bell cuff, bony hands, a great domed pauldron on each shoulder
  const arm = side => {
    const up = `arm${side}_up`, lo = `arm${side}_lo`, sh = P.start(up), elbow = P.end(up), hand = P.end(lo);
    const d = [hand[0] - elbow[0], hand[1] - elbow[1]], dl = Math.hypot(...d) || 1, cuff = [hand[0] - d[0] / dl * U(0.03), hand[1] - d[1] / dl * U(0.03)];
    const parts = [cap('sleeve', sh, elbow, U(0.06), U(0.05), robe), cap('sleeve', elbow, cuff, U(0.05), U(0.072), robe),
      { type: 'circle', name: 'hand', cx: hand[0], cy: hand[1], r: U(0.034), mat: bone, shade: 'sphere' }];
    if (side === 'L') {
      // the casting hand: long bony fingers spread up and out
      for (const k of [-1, 0, 1]) {
        const a = (-90 + fwdX * (25 + k * 28)) * Math.PI / 180, tip = [hand[0] + Math.cos(a) * U(0.075), hand[1] + Math.sin(a) * U(0.075)];
        parts.push(cap('finger', hand, tip, U(0.014), U(0.007), bone));
      }
    }
    const pc = P.at(up, 0.05, 0, 0, U(0.045));
    parts.push({ type: 'ellipse', name: 'pauldron', underlay: true, cx: pc[0], cy: pc[1], rx: U(0.135), ry: U(0.1), mat: iron, shade: 'sphere' },
      { type: 'ellipse', name: 'pauldron-lame', underlay: true, cx: pc[0], cy: pc[1] + U(0.075), rx: U(0.125), ry: U(0.045), mat: iron, shade: 'cyl', axis: 'x' });
    return { type: 'group', name: `arm-${side}`, underlay: true, children: parts };
  };

  // the sun-sceptre: a long haft through the right hand, a rayed disc around a glowing core on top
  const sceptre = () => {
    const hand = P.end('armR_lo'), a = tilt * Math.PI / 180, top = U(REACH[L.state]), butt = U(0.9 - REACH[L.state]);
    const tip = P.at('armR_lo', 1, Math.sin(a) * top, 0, Math.cos(a) * top), end = P.at('armR_lo', 1, -Math.sin(a) * butt, 0, -Math.cos(a) * butt);
    const head2 = P.at('armR_lo', 1, Math.sin(a) * (top + U(0.1)), 0, Math.cos(a) * (top + U(0.1)));
    return { type: 'group', name: 'sceptre', underlay: true, children: [
      cap('haft', end, tip, U(0.016), U(0.019), iron),
      { type: 'circle', name: 'collar', cx: tip[0], cy: tip[1], r: U(0.028), mat: iron, shade: 'sphere' },
      { type: 'star', name: 'sun-rays', underlay: true, cx: head2[0], cy: head2[1], r: U(0.165), r2: U(0.09), n: 8, rot: tilt + 22.5, mat: iron, shade: 'bevel' },
      { type: 'circle', name: 'sun-disc', underlay: true, cx: head2[0], cy: head2[1], r: U(0.082), mat: pal.accent, shade: 'sphere' },
      { type: 'circle', name: 'sun-core', cx: head2[0], cy: head2[1], r: U(0.048), mat: pal.glow, shade: 'sphere' },
      { type: 'circle', name: 'pommel', cx: end[0], cy: end[1], r: U(0.024), mat: iron, shade: 'sphere' },
    ] };
  };

  // the head: a bone skull on a neck, a narrow jaw toward the facing, sockets with burning points, the sun-crown
  const headParts = () => {
    const [hx, hy] = head, fx = fwdX * (back ? -1 : 1) * Math.abs(L.rig.sx), rx = U(0.08), ry = U(0.086), parts = [];
    const crownY = hy - ry * 0.62;
    // the five rays fan up off the brow, the middle one tallest
    const rays = [-60, -30, 0, 30, 60].map((deg, i) => {
      const len = U([0.14, 0.19, 0.23, 0.19, 0.14][i]), t = (deg - 90) * Math.PI / 180;
      const bx = hx + Math.cos(t) * rx * 0.7, by = crownY + Math.sin(t) * ry * 0.45, n = [-Math.sin(t), Math.cos(t)], bw = U(0.038);
      return { type: 'poly', name: 'crown-ray', underlay: true, mat: iron, shade: 'bevel',
        pts: [[bx + n[0] * bw, by + n[1] * bw], [bx + Math.cos(t) * len, by + Math.sin(t) * len], [bx - n[0] * bw, by - n[1] * bw]] };
    });
    parts.push(cap('neck', P.start('neck'), P.end('neck'), U(0.04), U(0.034), bone));
    parts.push({ type: 'group', name: 'crown-rays', underlay: true, children: rays });
    parts.push({ type: 'ellipse', name: 'skull', underlay: true, cx: hx, cy: hy - U(0.01), rx, ry, mat: bone, shade: 'sphere' });
    parts.push({ type: 'ellipse', name: 'jaw', underlay: true, cx: hx + fx * rx * 0.3, cy: hy + ry * 0.72, rx: rx * 0.62, ry: ry * 0.38, mat: bone, shade: 'sphere' });
    parts.push({ type: 'path', name: 'crown-band', underlay: true, mat: iron, shade: 'bevel',
      d: smooth([[hx - rx * 1.06, crownY + U(0.004)], [hx, crownY - U(0.022)], [hx + rx * 1.06, crownY + U(0.004)], [hx + rx * 1.0, crownY + U(0.03)], [hx, crownY + U(0.012)], [hx - rx * 1.0, crownY + U(0.03)]]) });
    if (!back) {
      const cxF = hx + fx * rx * 0.35, ey = Math.round(hy + ry * 0.1);
      parts.push({ type: 'circle', name: 'crown-gem', cx: cxF, cy: crownY + U(0.006), r: U(0.016), mat: pal.glow, shade: 'flat', band: 0 });
      // the face: two dark sockets with a burning point each, a nasal notch between and below them, a toothed jaw
      const half = Math.max(2, Math.round(rx * 0.42 * (1 - 0.3 * Math.abs(L.rig.sx))));
      for (const k of [-1, 1]) {
        const ex = Math.round(cxF) + k * half;
        parts.push({ type: 'rect', name: 'socket', x: ex - 1, y: ey - 1, w: 3, h: 3, color: 'outline' });
        parts.push({ type: 'rect', name: 'eye-point', x: ex, y: ey, w: 1, h: 1, color: 'glow.0' });
      }
      parts.push({ type: 'rect', name: 'nasal', x: Math.round(cxF), y: ey + 2, w: 1, h: 2, color: 'outline' });
      const tw = Math.max(3, Math.round(rx * 0.8)), tx = Math.round(cxF - tw / 2), ty = Math.round(hy + ry * 0.66);
      for (let x = tx; x < tx + tw; x += 2) parts.push({ type: 'rect', name: 'tooth-gap', x, y: ty, w: 1, h: 2, color: 'outline' });
    }
    return { type: 'group', name: 'head', underlay: true, children: parts };
  };

  // draw, back to front
  const [farArm, nearArm] = P.far(['armL_up', 'armR_up']).map(n => n[3]);
  const armWith = side => { if (side === 'R') s.add(sceptre()); s.add(arm(side)); };
  const cape = { type: 'path', name: 'mantle', underlay: true, mat: robe, shade: 'normal', round: U(0.08), gain: 0.8, d: smooth(mantle) };
  if (!back) s.add(cape);
  armWith(farArm);
  legs.forEach(g => s.add(g));
  s.add({ type: 'path', name: 'robe', underlay: true, mat: robe, shade: 'normal', round: U(0.12), d: smooth(body) });
  if (back) s.add(cape);
  if (!back) {
    // the robe's front split: its dark lining from the hips to the hem, the armoured legs striding through it
    const t0 = B(U(0.17), U(-0.06), 0), l0 = B(U(0.3), U(-0.24), U(-0.13)), r0 = B(U(0.3), U(-0.24), U(0.13));
    s.add({ type: 'poly', name: 'lining', mat: robe, shade: 'flat', band: 2, pts: [t0, l0, r0] });
    legSides.forEach(n => s.add(leg(n, true)));
  }
  s.add(headParts());
  armWith(nearArm);
  scene.add({ type: 'group', name: 'figure', translate: [L.dx, 0], children: kids });

  // decals: marks on their parts, in frame pixels (the figure's shift added)
  const X = p => [p[0] + L.dx, p[1]], decals = [];
  const starPts = (c, r, r2, n, rot = -90) => Array.from({ length: n * 2 }, (_, i) => {
    const a = (rot + i * 180 / n) * Math.PI / 180, rr = i % 2 ? r2 : r;
    return X([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]);
  });
  const ringPt = (up, rf, rs, a) => B(Math.cos(a) * U(rf), U(up), Math.sin(a) * U(rs));
  if (!back) {
    // a rayed sun worked on the chest, and an embroidered band above the hem across the robe's front
    decals.push({ name: 'chest-sun', part: 'robe', mat: 'metal', band: 1, shape: { type: 'poly', pts: starPts(sp(0.66, U(0.15), 0), U(0.055), U(0.026), 6) } });
    const arc = [];
    for (let i = 0; i <= 12; i++) arc.push(-Math.PI / 2 + (i / 12) * Math.PI);
    const top = arc.map(a => X(ringPt(-0.115, 0.245, 0.3, a))), bot = arc.slice().reverse().map(a => X(ringPt(-0.13, 0.255, 0.315, a)));
    decals.push({ name: 'hem-trim', part: 'robe', mat: 'metal', band: 1, shape: { type: 'poly', pts: [...top, ...bot] } });
  } else {
    // the mantle's tears rising from its ragged edge, a sun sigil between the shoulders, a crack across the skull
    const ys = mantle.map(p => p[1]), maxY = Math.max(...ys);
    const low = mantle.filter(p => p[1] > maxY - U(0.07));
    decals.push({ name: 'mantle-tears', part: 'mantle', mat: 'leather', band: 2, shape: low.filter((_, i) => i % 3 === 1).map((p, i) => ({ type: 'poly',
      pts: [X([p[0] - 1.5, p[1]]), X([p[0] + 1.5, p[1]]), X([p[0] + (i % 2 ? 1 : -1), p[1] - U(0.07 + 0.03 * (i % 2))])] })) });
    decals.push({ name: 'back-sun', part: 'mantle', mat: 'metal', band: 1, shape: { type: 'poly', pts: starPts(sp(0.7, U(-0.2), 0), U(0.06), U(0.028), 6) } });
    const [hx, hy] = head;
    decals.push({ name: 'skull-crack', part: 'skull', mat: 'hair', band: 2, shape: { type: 'poly',
      pts: [X([hx - U(0.03), hy - U(0.05)]), X([hx - U(0.005), hy - U(0.01)]), X([hx - U(0.02), hy + U(0.02)]), X([hx + U(0.01), hy + U(0.05)]), X([hx - U(0.035), hy + U(0.02)]), X([hx - U(0.02), hy - U(0.01)])] } });
  }
  // the sceptre's leather grip: wraps across the haft above and below the hand (front facings; behind the body in back)
  if (!back) {
    const a = tilt * Math.PI / 180, ax = P.at('armR_lo', 1, Math.sin(a), 0, Math.cos(a)), hd = P.end('armR_lo');
    const d = [ax[0] - hd[0], ax[1] - hd[1]], dl = Math.hypot(...d) || 1, u = [d[0] / dl, d[1] / dl], n = [-u[1], u[0]], hw = U(0.02);
    const wraps = [-0.11, -0.08, -0.05, 0.05, 0.08, 0.11].map(o => {
      const c = [hd[0] + u[0] * U(o), hd[1] + u[1] * U(o)];
      return { type: 'poly', pts: [[-hw, -0.8], [hw, -0.8], [hw, 0.8], [-hw, 0.8]].map(([q, r]) => X([c[0] + n[0] * q + u[0] * r, c[1] + n[1] * q + u[1] * r])) };
    });
    decals.push({ name: 'grip', part: 'haft', mat: 'leather', band: 'keep', shape: wraps });
  }
  let pr = ctx.lib.proc(scene)
    .add('ao', { part: ['robe', 'mantle', 'skull', 'neck', 'sleeve'] })
    .add('materialNoise', { part: ['robe', 'mantle'], amount: 0.08, scale: 3, seed: ctx.variant ?? 0 });
  for (const d of decals) pr = pr.add('decal', d);
  return { grid: pr.add('groundShadow', {}).render(), L };
}

export function render(ctx) {
  const { grid, L } = draw(ctx);
  return L.flip ? grid.flip('x') : grid;
}

// head (the skull's centre), hand (the sceptre hand) and cast (the raised off hand), mirrored with the drawing for e and n
export const anchors = ctx => {
  const L = layout(ctx), fx = x => (L.flip ? L.w - 1 - Math.round(x + L.dx) : Math.round(x + L.dx));
  const hand = L.P.end('armR_lo'), cast = L.P.end('armL_lo');
  return { head: [fx(L.head[0]), Math.round(L.head[1])], hand: [fx(hand[0]), Math.round(hand[1])], cast: [fx(cast[0]), Math.round(cast[1])] };
};
