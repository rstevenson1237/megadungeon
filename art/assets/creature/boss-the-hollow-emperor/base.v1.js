// boss-the-hollow-emperor base.v1 (r1) SHAPE DRAFT — The Hollow Emperor, a slate undead brute of the catacombs and a
// unique boss of family k (the death knights), 8.7 m (about 140 px, 3.8x the drawn player) in the 128 x 160 frame.
// Silhouette and form only, flat materials, no proc layers. What tells him apart from the plain family sprite and from
// the Weeping Knight: an empty imperial armour — a great hooded helm open on a hollow void where the face should be,
// two ember eyes floating in it — crowned with an enormous five-pointed crown (his signature, nearly as tall as the
// helm, set clear above the shoulders in every facing). Broad smooth domed pauldrons (no spikes), a heavy barrel
// cuirass tapered to a belted waist, a long imperial coat split at the front so the armoured legs stride through it,
// and a wide train that flares to its widest at the calf with a ragged hem the sabatons step out below. He carries a
// huge flanged sceptre-mace, swung two-handed in an arc on the attack (hauled back over the shoulder, swept over, a
// held low hit, recovery). The one bright accent is planned on the crown: its central gem and the ember eyes (glow).
// s and n are three-quarter turns of the rig, e a profile the engine mirrors for w. Built on the template's shared biped
// rig (`ctx.lib.rigs.body`); bones are never resized. Colours are role ramps, sizes relative to the brief's height (R11).
export const meta = { brief: 'boss-the-hollow-emperor', pass: 'r1', notes: 'shape draft: empty imperial armour, hollow hooded helm with ember eyes, enormous five-pointed crown, domed pauldrons, split coat and wide train, giant flanged sceptre-mace', recolour: 'cloth' };

export const params = {
  cloth: { type: 'swap', options: ['cloth', 'leather', 'accent'], default: 'cloth' },
};

const TURN = { s: 'sw', e: 'e', n: 'ne', w: 'w' };
const HM = 8.7, PLAYER = 37;

// closed smooth outline through points (quadratics through the midpoints)
const smooth = pts => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let d = `M${m(pts[n - 1], pts[0]).join(' ')}`;
  for (let i = 0; i < n; i++) d += ` Q${pts[i].join(' ')} ${m(pts[i], pts[(i + 1) % n]).join(' ')}`;
  return d + ' Z';
};
// two-bone reach with fixed lengths: the elbow bends to the `bend` side of the shoulder-to-hand line
const reach = (a, t, l1, l2, bend) => {
  const dx = t[0] - a[0], dy = t[1] - a[1], L0 = Math.hypot(dx, dy) || 1, d = Math.min(L0, l1 + l2 - 0.01), u = [dx / L0, dy / L0];
  const k = (l1 * l1 - l2 * l2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, l1 * l1 - k * k));
  return { elbow: [a[0] + u[0] * k - u[1] * hh * bend, a[1] + u[1] * k + u[0] * hh * bend], hand: [a[0] + u[0] * d, a[1] + u[1] * d] };
};
const norm = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

// The sceptre arm per state and frame: the hand's target from the shoulder ([toward, down] in arm lengths) and the
// haft's direction ([toward, down]). The wind-up hauls it back over the shoulder (kept low: the crown fills the headroom),
// the sweep carries it over, and the hit lands low on the far side, held.
const MACE = {
  idle: [{ h: [0.3, 0.8], b: [0.3, -0.95] }, { h: [0.3, 0.82], b: [0.3, -0.95] }],
  walk: [{ h: [0.24, 0.8], b: [0.24, -0.97] }, { h: [0.3, 0.82], b: [0.3, -0.95] }, { h: [0.36, 0.8], b: [0.36, -0.93] }, { h: [0.3, 0.82], b: [0.3, -0.95] }],
  attack: [
    { h: [0, -0.2], b: [-0.4, -0.92], two: true },   // wind-up: hauled back over the shoulder
    { h: [0.25, -0.3], b: [0.8, -0.6], two: true },       // the sweep over
    { h: [0.4, 0.6], b: [0.6, 0.8], two: true },      // the hit, low and forward (held)
    { h: [0.3, 0.72], b: [0.45, 0.89], follow: true },                   // recovery
  ],
};

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, S = (HM * metre) / PLAYER, X = v => v * S, hr = ctx.dir.scale.proportions?.headRatio ?? 0.4;
  const ground = h - 1, facing = TURN[ctx.facing] ?? ctx.facing;
  const rig = ctx.lib.rigs.body('biped', ctx, { facing, ground, height: Math.round(HM * metre - X(6.2)), proportions: { head: hr * 0.6 } });
  const { sx, front, side } = rig, P = rig.pose(ctx.state, ctx.t), headH = rig.lengths.head / 0.92;
  const dir = sx < 0 ? -1 : 1, profile = side > 0.9, back = front < 0, wf = 1 - 0.3 * side;
  const neck = P.start('neck'), hip = P.start('spine');
  const hcx = P.at('head', 0.5)[0] + dir * X(0.4) * (back ? 0.3 : 1), top = P.end('head')[1] + X(1.2), helmW = X(7.6) * (1 - 0.1 * side), helmH = headH * 1.05;
  const showFace = !back, fx = dir * helmW * 0.2 * side;
  const outR = Math.sign(P.start('armR_up')[0] - neck[0]) || dir, outL = -outR;
  const shY = neck[1] + X(1.8);
  const sh = o => [neck[0] + o * X(7.4) * wf + (profile ? -dir * X(0.4) * (o === outR ? -1 : 1) : 0), shY];
  const shR = sh(outR), shL = sh(outL), l1 = rig.lengths.armR_up, l2 = rig.lengths.armR_lo, arm = l1 + l2;
  const f = (ctx.logical ?? ctx.frame ?? 0), table = MACE[ctx.state] ?? MACE.idle, k = table[f % table.length];
  const toward = profile ? dir : -outR;
  // carried (idle, walk): beside the body in the front views, held out ahead of him from the side, clear of the helm
  const carry = !k.two && !k.follow;
  const target = k.two ? [shR[0] + toward * k.h[0] * arm, shR[1] + k.h[1] * arm] : [shR[0] + (k.follow ? toward * k.h[0] * arm : side > 0.9 ? dir * (k.h[0] * arm) : outR * k.h[0] * X(3)), shR[1] + k.h[1] * arm];
  const swordArm = reach(shR, target, l1, l2, (profile ? -dir : outR) * (k.h[1] < 0 ? -1 : 1));
  // carried, the mace head is aimed at a fixed point beside the shoulders (ahead of him from the side), so it never
  // covers the helm; swung, the haft follows the table
  const aim = [neck[0] + (side > 0.9 ? dir : outR) * X(9.5) + (k.b[0] - 0.3) * X(3) * (side > 0.9 ? dir : outR), shY - X(1.5)];
  const bd = carry ? norm([aim[0] - swordArm.hand[0], aim[1] - swordArm.hand[1]]) : norm([toward * k.b[0], k.b[1]]);
  // the sceptre: the grip sits in the hand, the haft runs `len` along bd to the flanged head; idle, it stands upright
  const grip = swordArm.hand, mace = { base: [grip[0] - bd[0] * X(2.4), grip[1] - bd[1] * X(2.4)], len: X(11.5), dir: bd };
  mace.head = [grip[0] + bd[0] * mace.len, grip[1] + bd[1] * mace.len];
  const offTarget = k.two ? [grip[0] - bd[0] * X(2.4), grip[1] - bd[1] * X(2.4)] : [shL[0] + outL * X(2.2), shL[1] + arm * 0.8];
  const offArm = reach(shL, offTarget, rig.lengths.armL_up, rig.lengths.armL_lo, outL);
  const ey = Math.round(top + helmH * 0.5);
  const eyes = showFace ? (profile ? [hcx + dir * helmW * 0.22] : [hcx + fx - helmW * 0.17, hcx + fx + helmW * 0.15]).map(Math.round) : [];
  return { w, h, X, rig, P, dir, front, side, profile, back, wf, ground, headH, hcx, top, helmW, helmH, showFace, fx, neck, hip, shR, shL, outR, outL, swordArm, offArm, mace, eyes, ey, k };
}

export function render(ctx) {
  const { pal } = ctx.dir, Pm = ctx.params, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), plate = pal[Pm.cloth];
  const { X, P: pose, dir, side, profile, back, wf, ground, hcx, top, helmW, helmH, showFace, fx, neck, hip, shR, shL, swordArm, offArm, mace, eyes, ey } = L;
  const flat = (mat, band) => ({ mat, shade: 'flat', band });
  const R = v => X(v) * wf;
  const walking = ctx.state === 'walk', sway = walking ? Math.sin(ctx.t * Math.PI * 2) * X(0.7) : 0;

  // ---- the imperial train: hangs from the shoulders behind him, flares widest at the calf, ragged hem above the feet
  const train = () => {
    const y0 = neck[1] + X(0.8), hem = ground - X(3.4);
    const pts = profile
      ? [[neck[0] + dir * X(1.4), y0], [neck[0] - dir * X(3.6), y0 + X(1.2)], [neck[0] - dir * X(8) + sway, hem - X(10)], [neck[0] - dir * X(12.5) + sway, hem + X(0.6)],
        [neck[0] - dir * X(9.4) + sway, hem - X(1.4)], [neck[0] - dir * X(6.6) + sway, hem + X(0.8)], [neck[0] - dir * X(3.6) + sway, hem - X(1.2)], [neck[0] - dir * X(1), hem], [neck[0] + dir * X(1.6), y0 + X(12)]]
      : [[neck[0], y0 - X(0.4)], [neck[0] + R(6.4), y0 + X(0.4)], [neck[0] + R(10.8) + sway, y0 + X(14)], [neck[0] + R(13.6) + sway, hem + X(0.4)],
        [neck[0] + R(9.6) + sway, hem - X(1.6)], [neck[0] + R(6.6) + sway, hem + X(0.6)], [neck[0] + R(3) + sway, hem - X(1.4)], [neck[0] - R(0.4) + sway, hem + X(0.5)],
        [neck[0] - R(3.6) + sway, hem - X(1.5)], [neck[0] - R(7) + sway, hem + X(0.7)], [neck[0] - R(10.2) + sway, hem - X(1.2)], [neck[0] - R(13.4) + sway, hem + X(0.2)], [neck[0] - R(10.8) + sway, y0 + X(14)], [neck[0] - R(6.4), y0 + X(0.4)]];
    s.add({ type: 'path', name: 'train', underlay: true, d: smooth(pts), ...flat(plate, 2) });
  };

  // ---- legs: thick armoured thighs, knee cops, tapered greaves and broad sabatons
  const legs = () => {
    for (const n of pose.far(['legL_up', 'legR_up'])) {
      const lo = n.replace('_up', '_lo'), a = pose.start(n), kn = pose.end(n), an = pose.end(lo);
      const spread = profile ? 0 : (Math.sign(a[0] - hip[0]) || 1) * X(2.4);
      const A = [a[0] + spread, a[1]], K = [kn[0] + spread * 1.25, kn[1]], N = [an[0] + spread * 1.1, an[1] - X(0.6)];
      s.add({ type: 'group', name: 'leg', underlay: true, children: [
        { type: 'tube', name: 'thigh', pts: [A, K], w: X(4), w1: X(3.1), ...flat(plate, 1) },
        { type: 'tube', name: 'greave', pts: [K, N], w: X(3.1), w1: X(2.3), ...flat(plate, 1) },
        { type: 'ellipse', name: 'knee', cx: K[0] + dir * X(0.3) * side, cy: K[1], rx: X(1.8), ry: X(1.6), ...flat(plate, 0) },
        { type: 'path', name: 'sabaton', d: smooth([[N[0] - X(1.7), N[1] - X(0.6)], [N[0] + X(1.7), N[1] - X(0.6)], [N[0] + X(1.7) + dir * X(1.8) * (0.4 + side), an[1] + X(0.2)], [N[0] - X(1.9) + dir * X(0.4), an[1] + X(0.2)]]), ...flat(plate, 2) },
      ] });
    }
  };

  // ---- the sceptre-mace: a long haft, a collar, a great flanged head and a small crowned finial
  const sceptre = () => {
    const { base, head, dir: d } = mace, n = [-d[1], d[0]], hr = X(2.4);
    const at = (c, t, m) => [c[0] + d[0] * t + n[0] * m, c[1] + d[1] * t + n[1] * m];
    const flanges = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6, u = [Math.cos(a), Math.sin(a)], v = [-u[1], u[0]];
      flanges.push({ type: 'poly', name: 'flange', pts: [[head[0] + u[0] * hr * 0.5 + v[0] * X(1.1), head[1] + u[1] * hr * 0.5 + v[1] * X(1.1)], [head[0] + u[0] * hr * 1.4, head[1] + u[1] * hr * 1.4], [head[0] + u[0] * hr * 0.5 - v[0] * X(1.1), head[1] + u[1] * hr * 0.5 - v[1] * X(1.1)]], ...flat(pal.metal, 1) });
    }
    s.add({ type: 'group', name: 'sceptre', underlay: true, children: [
      { type: 'capsule', name: 'haft', a: base, b: head, r: X(0.75), ...flat(pal.metal, 2) },
      { type: 'capsule', name: 'collar', a: at(head, -hr * 1.3, -X(1.3)), b: at(head, -hr * 1.3, X(1.3)), r: X(0.6), ...flat(pal.metal, 1) },
      ...flanges,
      { type: 'circle', name: 'mace-head', cx: head[0], cy: head[1], r: hr, ...flat(pal.metal, 0) },
      { type: 'capsule', name: 'finial', a: at(head, hr * 0.8, 0), b: at(head, hr * 2.2, 0), r: X(0.6), ...flat(pal.metal, 1) },
      { type: 'capsule', name: 'finial-bar', a: at(head, hr * 1.75, -X(1.1)), b: at(head, hr * 1.75, X(1.1)), r: X(0.5), ...flat(pal.metal, 1) },
      { type: 'circle', name: 'pommel', cx: base[0], cy: base[1], r: X(1), ...flat(pal.metal, 1) },
    ] });
  };
  const limb = (name, a, arm, fist) => s.add({ type: 'group', name, underlay: true, children: [
    { type: 'tube', name: 'upper-arm', pts: [a, arm.elbow], w: X(3.6), w1: X(2.9), ...flat(plate, 0) },
    { type: 'tube', name: 'vambrace', pts: [arm.elbow, arm.hand], w: X(3.1), w1: X(2.4), ...flat(plate, 0) },
    { type: 'circle', name: 'couter', cx: arm.elbow[0], cy: arm.elbow[1], r: X(1.6), ...flat(plate, 1) },
    { type: 'circle', name: 'gauntlet', cx: arm.hand[0], cy: arm.hand[1], r: X(fist), ...flat(plate, 2) },
  ] });
  const maceArmNode = () => { sceptre(); limb('arm-sceptre', shR, swordArm, 1.5); };
  const offArmNode = () => limb('arm-off', shL, offArm, 1.5);

  // ---- the body: a barrel cuirass swelling at the ribs, belted at the waist, then the split coat's two front skirts
  // falling past the knees on either side of the striding legs, cut to an uneven hem
  const torso = () => {
    const c = neck[0] + fx * 0.5, wy = hip[1] - X(3.4), bul = X(1.8) * side;
    const q = (sg, v) => c + sg * R(v) + (sg === dir ? bul : 0);
    s.add({ type: 'path', name: 'cuirass', underlay: true, d: smooth([
      [c, neck[1] - X(0.6)], [q(1, 5.6), neck[1] + X(0.4)], [q(1, 7.4), neck[1] + X(4.4)], [q(1, 7.6), neck[1] + X(7.6)], [q(1, 5.2), wy - X(1.2)], [q(1, 3.6), wy + X(0.8)],
      [q(-1, 3.6), wy + X(0.8)], [q(-1, 5.2), wy - X(1.2)], [q(-1, 7.6), neck[1] + X(7.6)], [q(-1, 7.4), neck[1] + X(4.4)], [q(-1, 5.6), neck[1] + X(0.4)],
    ]), ...flat(plate, 1) });
    s.add({ type: 'capsule', name: 'belt', a: [q(-1, 3.8), wy], b: [q(1, 3.8), wy], r: X(0.65), ...flat(pal.leather, 2) });
  };
  // the split coat's front skirts hang behind the striding legs, so both legs read through the opening
  const skirts = () => {
    const c = neck[0] + fx * 0.5, wy = hip[1] - X(3.4);
    const knee = pose.end('legR_up')[1];
    for (const sg of [-1, 1]) {
      const o = profile ? -dir : sg, inner = profile ? X(0.6) : R(1.2);
      s.add({ type: 'path', name: 'coat-skirt', underlay: true, d: smooth([
        [c + o * inner, wy - X(0.6)], [c + o * R(4.4), wy - X(0.6)], [c + o * R(7.4) + sway * 0.6, knee + X(1)], [c + o * R(8.6) + sway * 0.6, knee + X(4.6)],
        [c + o * R(5.6) + sway * 0.6, knee + X(3.4)], [c + o * R(3.6) + sway * 0.4, knee + X(4.4)], [c + o * (inner + R(1)), knee + X(1)],
      ]), ...flat(plate, 2) });
      if (profile) break;
    }
  };
  // ---- the pauldrons: broad smooth domes, layered with two lames, no spikes
  const pauldron = o => {
    const c = [neck[0] + (profile ? -dir * X(0.6) * o : o * X(7.8) * wf), neck[1] + X(1.6)], pr = profile ? X(5) : X(5.4) * (1 - 0.12 * side);
    s.add({ type: 'group', name: 'pauldron', underlay: true, children: [
      { type: 'path', name: 'pauldron', d: smooth([[c[0] - pr, c[1] + X(1.6)], [c[0] - pr * 0.8, c[1] - X(2.8)], [c[0], c[1] - X(3.6)], [c[0] + pr * 0.8, c[1] - X(2.8)], [c[0] + pr, c[1] + X(1.6)], [c[0] + o * pr * 0.55, c[1] + X(3.6)], [c[0] - o * pr * 0.25, c[1] + X(3.2)]]), ...flat(plate, 0) },
      { type: 'capsule', name: 'lame', a: [c[0] - pr * 0.85, c[1] + X(1.8)], b: [c[0] + pr * 0.9, c[1] + X(2.2)], r: X(0.55), ...flat(plate, 2) },
      { type: 'capsule', name: 'lame', a: [c[0] - pr * 0.7 + o * X(0.6), c[1] + X(3.4)], b: [c[0] + pr * 0.75 + o * X(0.6), c[1] + X(3.8)], r: X(0.5), ...flat(plate, 1) },
    ] });
  };
  // ---- the hollow helm: a rounded hooded great helm on a gorget, open on a dark void with two ember eyes; and the
  // enormous five-pointed crown set on its brow, the same in every facing
  const crown = () => {
    const cw = helmW * 0.58, by = top + X(1.4), bh = X(1.8), peaks = [4.4, 5.6, 7.2, 5.6, 4.4];
    const pts = [[hcx - cw * 0.92, by + bh], [hcx + cw * 0.92, by + bh]];
    for (let i = 4; i >= 0; i--) {
      const x = hcx - cw + (2 * cw * i) / 4;
      pts.push([x, by - X(peaks[i])]);
      if (i > 0) pts.push([x - cw / 4, by - X(1)]);
    }
    s.add({ type: 'group', name: 'crown', underlay: true, children: [
      { type: 'poly', name: 'crown', pts, ...flat(pal.metal, 0) },
      ...peaks.map((p, i) => ({ type: 'circle', name: 'crown-tip', cx: hcx - cw + (2 * cw * i) / 4, cy: by - X(p), r: X(0.75), ...flat(pal.metal, 0) })),
      { type: 'capsule', name: 'crown-band', a: [hcx - cw * 0.95, by + bh * 0.5], b: [hcx + cw * 0.95, by + bh * 0.5], r: bh * 0.55, ...flat(pal.metal, 1) },
      ...(back ? [] : [{ type: 'circle', name: 'crown-gem', cx: hcx + fx * 1.4, cy: by + bh * 0.5, r: X(0.8), mat: pal.glow, shade: 'flat', band: 1 }]),
    ] });
  };
  const helm = () => {
    const hw = helmW / 2, b = top + helmH;
    s.add({ type: 'ellipse', name: 'gorget', cx: neck[0], cy: neck[1] - X(0.2), rx: X(3.8) * wf, ry: X(2), ...flat(plate, 2) });
    s.add({ type: 'path', name: 'helm', underlay: true, d: smooth([
      [hcx, top - X(0.4)], [hcx + hw * 0.92, top + X(0.4)], [hcx + hw * 1.05, top + helmH * 0.5], [hcx + hw * 0.9, b - X(0.4)], [hcx + dir * X(0.6) * side, b + X(0.8)], [hcx - hw * 0.9, b - X(0.4)], [hcx - hw * 1.05, top + helmH * 0.5], [hcx - hw * 0.92, top + X(0.4)],
    ]), ...flat(plate, 0) });
    if (showFace) {
      const ow = profile ? helmW * 0.26 : helmW * 0.6, ocx = profile ? hcx + dir * helmW * 0.26 : hcx + fx;
      s.add({ type: 'ellipse', name: 'void', cx: ocx, cy: top + helmH * 0.56, rx: ow / 2, ry: helmH * 0.3, mat: pal.hair, shade: 'flat', band: 2 });
      for (const ex of eyes) s.add({ type: 'rect', name: 'ember', x: ex, y: ey, w: Math.max(1, Math.round(X(0.6))), h: Math.max(1, Math.round(X(0.6))), mat: pal.glow, shade: 'flat', band: 1 });
    }
  };

  const [farArm] = pose.far(['armL_up', 'armR_up']), farIsMace = farArm === 'armR_up';
  const farP = profile ? null : (back ? L.outR : -dir);
  if (!back) train();
  const swing = ctx.state === 'attack' && (L.k.two || L.k.follow); // the swing passes in front of the body
  if (farIsMace && !swing) maceArmNode(); else if (!farIsMace) offArmNode();
  skirts();
  legs();
  torso();
  if (back) { helm(); crown(); train(); }
  if (!profile) { pauldron(-(farP ?? dir)); pauldron(farP ?? dir); } else pauldron(1);
  if (!back) { helm(); crown(); }
  if (farIsMace) offArmNode();
  if (!farIsMace || swing) maceArmNode();
  return s.render();
}

// Named points per frame: head, hand (the sceptre hand), the mace head, eyes where the hollow faces the viewer
export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: [Math.round(L.hcx), Math.round(L.top + L.helmH * 0.5)], hand: L.swordArm.hand.map(Math.round), tip: L.mace.head.map(Math.round) };
  delete a.ground;
  L.eyes.forEach((x, i) => { a[i ? 'eye2' : 'eye'] = [x, L.ey]; });
  return a;
};
