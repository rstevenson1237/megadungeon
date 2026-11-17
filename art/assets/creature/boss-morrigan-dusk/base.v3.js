// boss-morrigan-dusk base.v3 (r3) — DECORATE from base.v2 (the owner approved v2's shape; the silhouette is kept pixel
// for pixel). One change, the inside of the line: materials lit as round, tapered masses from the direction's light
// (the light is mirrored for the flipped e and n drawings so every facing is lit from the same side on screen), the
// shroud, hood and mantle on `normal`, arms, tails, horns and shaft on `cyl`, the orb a sphere; a pale gaunt face with
// dark sockets, glowing eyes and a narrow jaw on a thin neck inside the hood's shadowed opening (front facings); the
// back of the hood carries a seam and the mantle's back its feather folds (back facings); decals: feather veins on the
// mantle, a metal crescent brooch at the throat, hem rags darkened; the staff's crescent metal lit and the orb the
// one bright accent (glow). Proc: ao on the shroud, light material noise on the cloth.
//
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
export const meta = { brief: 'boss-morrigan-dusk', pass: 'r3', notes: 'decorate: round lit masses, face on a neck in the hood, back seam and folds, decals, lit staff and orb accent', mirror: false, recolour: 'grass' };

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
  const { pal } = ctx.dir, L0 = ctx.dir.camera.light, L = layout(ctx)
  // flipped facings are drawn mirrored, so their light comes from the other side before the flip
  const s = ctx.lib.t2.scene(...ctx.size, { light: L.flip ? [-L0[0], L0[1], L0[2]] : L0 }), { U, P, B, front, ground } = L;
  const body = pal.grass, back = front < 0;
  const sp = (u, f, z) => P.at('spine', u, f, z, 0), hd = (u, f, z) => P.at('head', u, f, z, 0), nk = (u, f, z) => P.at('neck', u, f, z, 0);
  const cap = (name, a, b, r, r1, mat = body, band = 1) => ({ type: 'capsule', name, underlay: true, a, b, r, r1, mat, shade: band === 0 ? 'flat' : 'cyl', band });
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
  const mantle = band => ({ type: 'group', name: 'mantle', children: [-1, 1].map(sg => ({ type: 'path', name: 'wing', underlay: true, mat: body, shade: 'normal', round: U(0.05), gain: band > 1 ? 0.7 : 1, d: poly(wing(sg)) })) });

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
  const neck = cap('neck', sp(0.95, 0, 0), hd(0.1, 0, 0), U(0.032), U(0.03), pal.cloth, 1); // pale like the face
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
      { type: 'path', name: 'sleeve', underlay: true, mat: body, shade: 'normal', round: U(0.025), d: smooth([[elbow[0] + n[0] * U(0.035), elbow[1] + n[1] * U(0.035)], [cuff[0] + n[0] * sr, cuff[1] + n[1] * sr + U(0.02)], [cuff[0] + d[0] * U(0.02), cuff[1] + d[1] * U(0.02) + U(0.03)], [cuff[0] - n[0] * sr, cuff[1] - n[1] * sr + U(0.02)], [elbow[0] - n[0] * U(0.035), elbow[1] - n[1] * U(0.035)]]) }];
    if (side === 'L') {
      for (const k of [-1, 0, 1]) parts.push(cap('claw', hand, [hand[0] + d[0] * U(0.08) + n[0] * k * U(0.035), hand[1] + d[1] * U(0.08) + n[1] * k * U(0.035) + U(0.012)], U(0.013), U(0.004), body, 0));
    } else parts.push({ type: 'circle', name: 'fist', cx: hand[0], cy: hand[1], r: U(0.03), mat: pal.cloth, shade: 'sphere' });
    return { type: 'group', name: `arm-${side}`, children: parts };
  };
  const [farArm, nearArm] = P.far(['armL_up', 'armR_up']).map(n => n[3]);

  // the staff: a long shaft, a crescent at its head cupping the glowing orb
  const staff = () => {
    s.add({ type: 'group', name: 'staff', underlay: true, children: [
      cap('shaft', L.butt, L.tip, U(0.016), U(0.014), pal.leather, 1),
      ...[L.hornA, L.hornB].flatMap(hn => [cap('crescent', hn[0], hn[1], U(0.02), U(0.017), pal.metal, 1), cap('crescent', hn[1], hn[2], U(0.017), U(0.012), pal.metal, 1), cap('crescent', hn[2], hn[3], U(0.013), U(0.008), pal.metal, 1)]),
    ] });
    s.add({ type: 'circle', name: 'orb', underlay: true, cx: L.orb[0], cy: L.orb[1], r: U(0.042), mat: pal.glow, shade: 'sphere' });
  };

  const behind = back || L.theta >= 190;
  s.add(mantle(2)); // the mantle's inside behind her from the front; from behind it spreads out under the staff
  if (behind) staff();
  s.add(arm(farArm));
  for (const t of tails) s.add(t);
  s.add({ type: 'path', name: 'shroud', underlay: true, mat: body, shade: 'normal', round: U(0.07), d: smooth(shroud) });
  for (const c of crown) s.add(c);
  s.add(neck);
  s.add({ type: 'path', name: 'hood', underlay: true, mat: body, shade: 'normal', round: U(0.06), d: smooth(hood) });
  if (!back) s.add(circlet);
  if (!back) {
    const v = hd(0.45, U(0.07), 0);
    // the hood's opening in deep shadow, and in it a pale gaunt face on a thin neck: domed brow, sunken sockets with
    // the family's two points of light, hollow cheeks narrowing to a pointed jaw, a thin mouth
    s.add({ type: 'ellipse', name: 'void', cx: v[0], cy: v[1], rx: U(0.056), ry: U(0.07), mat: body, shade: 'flat', band: 2 });
    const fc = [v[0] + 0.5, v[1] - U(0.008)], fw = U(0.042), top = v[1] - U(0.058), chin = v[1] + U(0.05);
    const eyes = [-1, 1].map(e => [fc[0] + e * U(0.019) - 1, fc[1] - U(0.006)]);
    s.add({ type: 'rect', name: 'face-neck', x: Math.round(fc[0] - U(0.012)), y: Math.round(chin - 2), w: Math.max(2, Math.round(U(0.024))), h: Math.round(v[1] + U(0.064) - chin + 2), mat: pal.cloth, shade: 'flat', band: 1 });
    const facePath = `M${fc[0] - fw} ${fc[1] - U(0.005)} Q${fc[0] - fw} ${top} ${fc[0]} ${top} Q${fc[0] + fw} ${top} ${fc[0] + fw} ${fc[1] - U(0.005)} Q${fc[0] + fw * 0.8} ${fc[1] + U(0.03)} ${fc[0]} ${chin} Q${fc[0] - fw * 0.8} ${fc[1] + U(0.03)} ${fc[0] - fw} ${fc[1] - U(0.005)} Z`;
    s.add({ type: 'path', name: 'face', mat: pal.cloth, shade: 'flat', band: 0, d: facePath });
    const away = L.flip ? -1 : 1; // the side away from the light, in the unflipped drawing
    s.add({ type: 'group', name: 'face-shade', clip: { type: 'path', d: facePath }, children: [{ type: 'rect', name: 'cheek', x: away > 0 ? fc[0] + fw * 0.5 : fc[0] - fw - 1, y: top, w: fw * 0.5 + 1, h: chin - top + 1, mat: pal.cloth, shade: 'flat', band: 1 }] });
    for (const p of eyes) s.add({ type: 'ellipse', name: 'socket', cx: p[0] + 1, cy: p[1] + 0.5, rx: U(0.014), ry: U(0.011), mat: pal.cloth, shade: 'flat', band: 2 });
    for (const p of eyes) s.add({ type: 'rect', name: 'eye-point', x: Math.round(p[0]), y: Math.round(p[1]), w: 2, h: 1, color: 'glow.0' });
    s.add({ type: 'rect', name: 'mouth', x: Math.round(fc[0] - U(0.012)), y: Math.round(chin - U(0.016)), w: Math.max(2, Math.round(U(0.024))), h: 1, mat: pal.cloth, shade: 'flat', band: 2 });
    s.add({ type: 'rect', name: 'brow', x: Math.round(fc[0] - fw * 0.75), y: Math.round(eyes[0][1] - U(0.016)), w: Math.round(fw * 1.5), h: 1, mat: pal.cloth, shade: 'flat', band: 1 });
  }
  s.add(arm(nearArm));
  if (!behind) staff();
  if (!back && farArm === 'R') s.add({ type: 'circle', name: 'grip', underlay: true, cx: L.grip[0], cy: L.grip[1], r: U(0.03), mat: pal.cloth, shade: 'sphere' });
  // the procedural pass: ambient occlusion under the mantle and hood, a faint weave on the cloth, and the decals
  const vein = (o, t, w) => { const dx = t[0] - o[0], dy = t[1] - o[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * w, ny = dx / l * w;
    return { type: 'poly', pts: [[o[0] + nx, o[1] + ny], [t[0], t[1]], [o[0] - nx, o[1] - ny]] }; };
  const veins = [-1, 1].flatMap(sg => { const pts = wing(sg), o = pts[0]; return [2, 4, 6, 8, 10, 12].map(i => { const t = pts[i], m = [o[0] + (t[0] - o[0]) * 0.85, o[1] + (t[1] - o[1]) * 0.85]; return vein([o[0] + (t[0] - o[0]) * 0.4, o[1] + (t[1] - o[1]) * 0.4], m, 0.9); }); });
  let pr = ctx.lib.proc(s)
    .add('ao', { part: ['shroud', 'hood'] })
    .add('materialNoise', { part: ['shroud', 'wing'], amount: 0.06, scale: 3, seed: ctx.variant ?? 0 })
    .add('decal', { name: 'feather-veins', part: 'wing', mat: 'grass', band: 2, shape: veins });
  if (back) {
    // the back of the hood: a centre seam from the crown and the cowl's fold where it drapes onto the shoulders
    const seam = [hd(1.0, -U(0.02), U(0.005)), hd(0.25, -U(0.03), 0)], fold = [hd(0.85, -U(0.02), U(0.05)), hd(0.3, -U(0.03), U(0.065))], nape = hd(0.1, -U(0.02), 0);
    pr = pr.add('decal', { name: 'hood-seam', part: 'hood', mat: 'grass', band: 2, shape: [vein(seam[0], seam[1], 1.1), vein(fold[0], fold[1], 0.9),
      { type: 'ellipse', cx: nape[0], cy: nape[1], rx: U(0.065), ry: U(0.02) }] });
  } else {
    const b = sp(0.9, U(0.09), 0);
    pr = pr.add('decal', { name: 'brooch', part: 'shroud', mat: 'metal', band: 1, shape: { type: 'circle', cx: b[0] + 1, cy: b[1], r: U(0.022) } });
  }
  return { grid: pr.render(), L };
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
