// boss-the-weeping-knight base.v2 (r2) — DECORATION PASS on the approved base.v1 shape (stage shape approved
// 2026-11-17). The outline is unchanged: every node keeps its geometry; only fills, shading, proc layers and decals change.
// What changed vs v1:
//  - flat fills become lit forms under the direction's light (upper left): cylinders for limbs, plume, gorget, grip,
//    belt and lames; round 'normal' masses for breastplate, tassets, helm and cloak; spheres for pauldrons, knees,
//    couters and gauntlets; bevelled spikes, sabatons and blade. The plate stays on the cloth ramp (the family K
//    body ramp that family-k-cap recolours), the cloak moves to leather (the family's cape) so plate and cloth part;
//  - a readable face in the helm: a dark visor slit with two burning eye points, and the tear streaks (now decals on
//    the helm, two pixels wide and longer, the v1 review's "bigger tear glow"); from behind, the plume over the helm
//    and fold creases down the cloak;
//  - the signature greatsword reads as steel apart from the plate: metal ramp, bevelled blade with a lit edge, and the
//    one bright accent — a glowing fuller (glow ramp) down the blade, so the sword reads at 1x in every pose;
//  - procedural layers: ao in the joints, rim light on the away side of the plate masses, low material noise on the
//    cloak, a weeping teardrop sigil decal on the breastplate, and a ground shadow.
export const meta = { brief: 'boss-the-weeping-knight', pass: 'r2', notes: 'decorated: lit plate on the family cloth ramp, leather cloak, burning eyes and tear streaks, glowing fuller on the greatsword, teardrop sigil', recolour: 'cloth' };

export const params = {
  cloth: { type: 'swap', options: ['cloth', 'leather', 'accent'], default: 'cloth' },
};

// s and n are three-quarter turns of the rig (iso: south is screen down-left, north up-right); e is the profile the
// engine mirrors for w
const TURN = { s: 'sw', e: 'e', n: 'ne', w: 'w' };
const HM = 5.9, PLAYER = 37;

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

// The sword arm per state and frame: the hand's target from the shoulder ([toward, down] in arm lengths) and the blade's
// direction ([toward, down]). `toward` is across the body in the front views and forward in profile; the wind-up is on
// the far side of it, so the attack sweeps over the head and lands low on the near side, held on the hit frame.
const SWORD = {
  idle: [{ h: [0.05, 0.86], b: [0.32, 0.95] }, { h: [0.05, 0.88], b: [0.32, 0.95] }],
  walk: [{ h: [-0.05, 0.86], b: [-0.2, 0.98] }, { h: [0.02, 0.88], b: [-0.05, 1] }, { h: [0.1, 0.86], b: [0.05, 1] }, { h: [0.02, 0.88], b: [-0.05, 1] }],
  attack: [
    { h: [-0.1, -0.6], b: [-0.45, -0.89], two: true },  // wind-up: hauled up over the shoulder
    { h: [0.3, -0.55], b: [0.74, -0.67], pb: [0.3, -0.95], two: true },   // the sweep over the head
    { h: [0.5, 0.62], b: [0.66, 0.75], two: true },     // the hit, low on the far side (held)
    { h: [0.25, 0.78], b: [0.28, 0.96] },                // recovery
  ],
};

// Geometry shared by render() and anchors()
function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, S = (HM * metre) / PLAYER, X = v => v * S, hr = ctx.dir.scale.proportions?.headRatio ?? 0.4;
  const ground = h - 1, facing = TURN[ctx.facing] ?? ctx.facing;
  const rig = ctx.lib.rigs.body('biped', ctx, { facing, ground, height: Math.round(HM * metre - X(1.2)), proportions: { head: hr * 0.62 } });
  const { sx, front, side } = rig, P = rig.pose(ctx.state, ctx.t), headH = rig.lengths.head / 0.92;
  const dir = sx < 0 ? -1 : 1, profile = side > 0.9, back = front < 0, wf = 1 - 0.32 * side;
  const neck = P.start('neck'), hip = P.start('spine');
  // the bowed helm: dropped toward the shoulders and pushed a little toward the facing
  const hcx = P.at('head', 0.5)[0] + dir * X(0.6) * (back ? 0.3 : 1), top = P.end('head')[1] + X(2.2), helmW = X(7) * (1 - 0.12 * side), helmH = headH * 1.02;
  const showFace = !back, fx = dir * helmW * 0.22 * side;
  // shoulders set wide under the pauldrons; in profile both sit near the spine
  const outR = Math.sign(P.start('armR_up')[0] - neck[0]) || dir, outL = -outR;
  const shY = neck[1] + X(1.6);
  const sh = o => [neck[0] + o * X(6.6) * wf + (profile ? -dir * X(0.4) * (o === outR ? -1 : 1) : 0), shY];
  const shR = sh(outR), shL = sh(outL), l1 = rig.lengths.armR_up, l2 = rig.lengths.armR_lo, arm = l1 + l2;
  const f = (ctx.logical ?? ctx.frame ?? 0), table = SWORD[ctx.state] ?? SWORD.idle, k = table[f % table.length];
  const toward = profile ? dir : -outR; // the swing's forward side
  const target = k.two ? [shR[0] + toward * k.h[0] * arm, shR[1] + k.h[1] * arm] : [shR[0] + (profile ? toward * k.h[0] * arm : outR * X(1.4)), shR[1] + k.h[1] * arm];
  const swordArm = reach(shR, target, l1, l2, (profile ? -dir : outR) * (k.h[1] < 0 ? -1 : 1));
  const kb = profile && k.pb ? k.pb : k.b, bd = norm([toward * kb[0] + (profile || k.two ? 0 : outR * 0.05), kb[1]]);
  const grip = swordArm.hand, blade = { base: [grip[0] + bd[0] * X(1.3), grip[1] + bd[1] * X(1.3)], len: X(15.5), dir: bd };
  blade.tip = [blade.base[0] + bd[0] * blade.len, blade.base[1] + bd[1] * blade.len];
  // the off hand: on the grip below the sword hand for the two-handed swing, else hanging by the hip in a gauntlet
  const offTarget = k.two ? [grip[0] - bd[0] * X(2.2), grip[1] - bd[1] * X(2.2)] : [shL[0] + outL * X(1.4), shL[1] + arm * 0.84];
  const offArm = reach(shL, offTarget, rig.lengths.armL_up, rig.lengths.armL_lo, outL);
  const ey = Math.round(top + helmH * 0.44);
  const eyes = showFace ? (profile ? [hcx + dir * helmW * 0.3] : [hcx + fx - helmW * 0.2, hcx + fx + helmW * 0.16]).map(Math.round) : [];
  return { w, h, X, rig, P, dir, front, side, profile, back, wf, ground, headH, hcx, top, helmW, helmH, showFace, fx, neck, hip, shR, shL, outR, outL, swordArm, offArm, blade, eyes, ey, k };
}

export function render(ctx) {
  const { pal } = ctx.dir, Pm = ctx.params, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), plate = pal[Pm.cloth];
  const { X, P: pose, dir, side, profile, back, wf, ground, hcx, top, helmW, helmH, showFace, fx, neck, hip, shR, shL, outR, outL, swordArm, offArm, blade, eyes, ey } = L;
  const flat = (mat, band) => ({ mat, shade: 'flat', band });
  const R = v => X(v) * wf;
  const walking = ctx.state === 'walk', sway = walking ? Math.sin(ctx.t * Math.PI * 2) * X(0.6) : 0;

  // ---- the mourning cloak: hangs from the shoulders behind him and flares wider than the pauldrons to a ragged hem
  const cloak = () => {
    const y0 = neck[1] + X(0.6), hem = ground - X(1.4);
    const pts = profile
      ? [[neck[0] + dir * X(1.2), y0], [neck[0] - dir * X(3), y0 + X(1)], [neck[0] - dir * X(6.5) + sway, hem - X(8)], [neck[0] - dir * X(9.5) + sway, hem + X(0.4)],
        [neck[0] - dir * X(7) + sway, hem - X(1.2)], [neck[0] - dir * X(4.6) + sway, hem + X(0.6)], [neck[0] - dir * X(2) + sway, hem - X(1)], [neck[0] + dir * X(0.5), hem - X(0.2)], [neck[0] + dir * X(2), y0 + X(10)]]
      : [[neck[0], y0 - X(0.4)], [neck[0] + R(5.6), y0 + X(0.4)], [neck[0] + R(9.4) + sway, y0 + X(12)], [neck[0] + R(12) + sway, hem + X(0.2)],
        [neck[0] + R(7.4) + sway, hem - X(1.6)], [neck[0] + R(4.8) + sway, hem + X(0.6)], [neck[0] + R(1.6) + sway, hem - X(1.3)], [neck[0] - R(1.4) + sway, hem + X(0.4)],
        [neck[0] - R(4.6) + sway, hem - X(1.5)], [neck[0] - R(7.2) + sway, hem + X(0.5)], [neck[0] - R(11.8) + sway, hem - X(0.6)], [neck[0] - R(9.4) + sway, y0 + X(12)], [neck[0] - R(5.6), y0 + X(0.4)]];
    s.add({ type: 'path', name: 'cloak', underlay: true, d: smooth(pts), mat: pal.leather, shade: 'normal', round: X(3) });
  };

  // ---- legs: thick armoured thighs, knee cops, tapered greaves and broad sabatons
  const legs = () => {
    for (const n of pose.far(['legL_up', 'legR_up'])) {
      const lo = n.replace('_up', '_lo'), a = pose.start(n), kn = pose.end(n), an = pose.end(lo);
      const spread = profile ? 0 : (Math.sign(a[0] - hip[0]) || 1) * X(2.2);
      const A = [a[0] + spread, a[1]], K = [kn[0] + spread * 1.2, kn[1]], N = [an[0] + spread, an[1] - X(0.6)];
      s.add({ type: 'group', name: 'leg', underlay: true, children: [
        { type: 'tube', name: 'thigh', pts: [A, K], w: X(3.6), w1: X(2.9), mat: plate, shade: 'cyl' },
        { type: 'tube', name: 'greave', pts: [K, N], w: X(2.9), w1: X(2.2), mat: plate, shade: 'cyl' },
        { type: 'ellipse', name: 'knee', cx: K[0] + dir * X(0.3) * side, cy: K[1], rx: X(1.7), ry: X(1.5), mat: plate, shade: 'sphere' },
        { type: 'path', name: 'sabaton', d: smooth([[N[0] - X(1.6), N[1] - X(0.6)], [N[0] + X(1.6), N[1] - X(0.6)], [N[0] + X(1.6) + dir * X(1.6) * (0.4 + side), an[1] + X(0.2)], [N[0] - X(1.8) + dir * X(0.4), an[1] + X(0.2)]]), mat: plate, shade: 'bevel' },
      ] });
    }
  };

  // ---- the greatsword: a long broad blade tapering to its point, a wide crossguard, a long grip and a pommel
  const sword = () => {
    const { base, tip, dir: d, len } = blade, n = [-d[1], d[0]], hw = X(1.5), g = swordArm.hand;
    const at = (t, m) => [base[0] + d[0] * t + n[0] * m, base[1] + d[1] * t + n[1] * m];
    s.add({ type: 'group', name: 'greatsword', underlay: true, children: [
      { type: 'poly', name: 'blade', pts: [at(0, -hw), at(len * 0.82, -hw * 0.9), tip, at(len * 0.82, hw * 0.9), at(0, hw)], mat: pal.metal, shade: 'bevel' },
      { type: 'capsule', name: 'fuller', a: at(X(0.8), 0), b: at(len * 0.7, 0), r: X(0.3), mat: pal.glow, shade: 'flat', band: 0 },
      { type: 'capsule', name: 'grip', a: [g[0] - d[0] * X(3.6), g[1] - d[1] * X(3.6)], b: base, r: X(0.6), mat: pal.leather, shade: 'cyl' },
      { type: 'capsule', name: 'crossguard', a: at(0, -X(3.8)), b: at(0, X(3.8)), r: X(0.75), mat: pal.metal, shade: 'cyl' },
      { type: 'circle', name: 'pommel', cx: g[0] - d[0] * X(4), cy: g[1] - d[1] * X(4), r: X(1), mat: pal.metal, shade: 'sphere' },
    ] });
  };
  const limb = (name, a, arm, fist) => s.add({ type: 'group', name, underlay: true, children: [
    { type: 'tube', name: 'upper-arm', pts: [a, arm.elbow], w: X(3.2), w1: X(2.6), mat: plate, shade: 'cyl' },
    { type: 'tube', name: 'vambrace', pts: [arm.elbow, arm.hand], w: X(2.8), w1: X(2.2), mat: plate, shade: 'cyl' },
    { type: 'circle', name: 'couter', cx: arm.elbow[0], cy: arm.elbow[1], r: X(1.45), mat: plate, shade: 'sphere' },
    { type: 'circle', name: 'gauntlet', cx: arm.hand[0], cy: arm.hand[1], r: X(fist), mat: plate, shade: 'sphere' },
  ] });
  const swordArmNode = () => { sword(); limb('arm-sword', shR, swordArm, 1.35); };
  const offArmNode = () => limb('arm-off', shL, offArm, 1.35);

  // ---- the body: a barrel breastplate swelling at the ribs, tapered to the waist, then a skirt of tassets flaring out
  const torso = () => {
    const c = neck[0] + fx * 0.5, wy = hip[1] - X(3.2), bul = X(1.6) * side, R = v => X(v) * wf; // the chest bulges toward the facing in profile
    const q = (sg, v) => c + sg * R(v) + (sg === dir ? bul : 0);
    s.add({ type: 'path', name: 'breastplate', underlay: true, d: smooth([
      [c, neck[1] - X(0.6)], [q(1, 5), neck[1] + X(0.4)], [q(1, 6.6), neck[1] + X(4)], [q(1, 6.8), neck[1] + X(7)], [q(1, 4.6), wy - X(1.2)], [q(1, 3.2), wy + X(0.6)],
      [q(-1, 3.2), wy + X(0.6)], [q(-1, 4.6), wy - X(1.2)], [q(-1, 6.8), neck[1] + X(7)], [q(-1, 6.6), neck[1] + X(4)], [q(-1, 5), neck[1] + X(0.4)],
    ]), mat: plate, shade: 'normal', round: X(4) });
    s.add({ type: 'path', name: 'tassets', underlay: true, d: smooth([
      [c - R(3.4), wy - X(0.4)], [c + R(3.4), wy - X(0.4)], [c + R(6.6) + sway * 0.5, wy + X(4.4)], [c + R(3.4), wy + X(3.6)], [c + R(1.2), wy + X(4.8)],
      [c - R(1.4), wy + X(3.7)], [c - R(3.6), wy + X(4.8)], [c - R(6.7) + sway * 0.5, wy + X(4)],
    ]), mat: plate, shade: 'normal', round: X(2) });
    s.add({ type: 'capsule', name: 'belt', a: [q(-1, 3.4), wy], b: [q(1, 3.4), wy], r: X(0.55), mat: pal.leather, shade: 'cyl', axis: 'x' });
  };
  // ---- the pauldrons: great rounded plates riding up beside the helm, each with a spike swept up and out
  const pauldron = o => {
    const c = [neck[0] + (profile ? -dir * X(0.6) * o : o * X(7.4) * wf), neck[1] - X(0.2)], pr = profile ? X(4.8) : X(5.2) * (1 - 0.12 * side);
    s.add({ type: 'group', name: 'pauldron', underlay: true, children: [
      { type: 'poly', name: 'spike', pts: [[c[0] + o * X(0.4) - X(1.4), c[1] - X(2.4)], [c[0] + o * X(3.4), c[1] - X(8)], [c[0] + o * X(2.6) + X(1.2) * o, c[1] - X(1.8)]], mat: plate, shade: 'bevel' },
      { type: 'path', name: 'pauldron', d: smooth([[c[0] - pr, c[1] + X(1.2)], [c[0] - pr * 0.75, c[1] - X(3)], [c[0], c[1] - X(3.8)], [c[0] + pr * 0.8, c[1] - X(2.8)], [c[0] + pr, c[1] + X(1.4)], [c[0] + o * pr * 0.6, c[1] + X(4.2)], [c[0] - o * pr * 0.2, c[1] + X(3.8)]]), mat: plate, shade: 'sphere' },
      { type: 'capsule', name: 'lame', a: [c[0] - pr * 0.8, c[1] + X(1.6)], b: [c[0] + pr * 0.85, c[1] + X(2)], r: X(0.5), mat: plate, shade: 'cyl', axis: 'x' },
    ] });
  };
  // ---- the bowed great helm: a rounded bucket on a gorget, the visor slit burning, two tear streaks below it, and a
  // horsehair plume falling from the crown like a willow; the same helm and plume in every facing
  const plume = () => s.add({ type: 'tube', name: 'plume', underlay: true, pts: [[hcx, top + X(0.4)], [hcx - dir * X(3), top - X(1.6)], [hcx - dir * X(5.6), top + X(2.4)], [hcx - dir * X(6.6), top + X(8.5)], [hcx - dir * X(6.2), top + X(12)]], w: X(3), w1: X(1.2), mat: pal.hair, shade: 'cyl' });
  const helm = () => {
    const hw = helmW / 2, b = top + helmH;
    s.add({ type: 'ellipse', name: 'gorget', cx: neck[0], cy: neck[1] - X(0.2), rx: X(3.4) * wf, ry: X(1.8), mat: plate, shade: 'cyl', axis: 'x' });
    s.add({ type: 'path', name: 'helm', underlay: true, d: smooth([
      [hcx, top - X(0.4)], [hcx + hw * 0.9, top + X(0.2)], [hcx + hw, top + helmH * 0.45], [hcx + hw * 0.92, b - X(0.6)], [hcx + dir * X(0.6) * side, b + X(0.8)], [hcx - hw * 0.92, b - X(0.6)], [hcx - hw, top + helmH * 0.45], [hcx - hw * 0.9, top + X(0.2)],
    ]), mat: plate, shade: 'normal', round: X(3) });
    if (showFace) {
      const sw = profile ? helmW * 0.42 : helmW * 0.78, sx0 = profile ? hcx + dir * helmW * 0.12 - (dir < 0 ? sw : 0) : hcx + fx - sw / 2;
      s.add({ type: 'rect', name: 'slit', x: Math.round(sx0), y: ey, w: Math.round(sw), h: Math.max(2, Math.round(X(0.7))), color: 'outline' });
      // the eyes burn in the slit: two points of the glow ramp's bright step
      for (const ex of eyes) s.add({ type: 'rect', name: 'eye', x: ex, y: ey, w: 2, h: Math.max(2, Math.round(X(0.7))), mat: pal.glow, shade: 'flat', band: 0 });
    }
  };

  // draw order: the cloak behind in the front views, over the back from behind; the far arm and its load behind the body
  const [farArm] = pose.far(['armL_up', 'armR_up']), farIsSword = farArm === 'armR_up';
  const farP = profile ? null : (back ? outR : -dir);
  if (!back) { plume(); cloak(); }
  if (farIsSword) swordArmNode(); else offArmNode();
  legs();
  torso();
  if (back) { helm(); plume(); cloak(); }
  if (!profile) { pauldron(-(farP ?? dir)); pauldron(farP ?? dir); } else pauldron(1);
  if (!back) helm();
  if (farIsSword) offArmNode(); else swordArmNode();

  // decals: marks on their parts (tears on the helm, the sigil on the breastplate, seams and folds from behind)
  const decals = [], slitH = Math.max(2, Math.round(X(0.7))), helmB = top + helmH;
  const poly = pts => ({ type: 'poly', pts });
  // a tear is left off where the near forearm or the sword's grip crosses in front of it (the attack's wind-up and hit)
  const segD = (p, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy || 1))); return Math.hypot(p[0] - a[0] - vx * t, p[1] - a[1] - vy * t); };
  const nearArm = farIsSword ? offArm : swordArm, grip = [swordArm.hand, [swordArm.hand[0] - blade.dir[0] * X(4), swordArm.hand[1] - blade.dir[1] * X(4)]];
  const hidden = ex => { const q = [ex + 1, ey + X(2)]; return segD(q, nearArm.elbow, nearArm.hand) < X(2.2) || (!farIsSword && segD(q, ...grip) < X(1.6)); };
  if (showFace) for (const ex of eyes.filter(ex => !hidden(ex))) {
    const y0 = ey + slitH, th = Math.max(2, Math.min(Math.round(X(3.4)), Math.floor(helmB - y0 - 1)));
    decals.push({ name: 'tear', part: 'helm', mat: 'glow', band: 1, shape: { type: 'rect', x: ex, y: y0, w: 2, h: th } });
  }
  const fr = ctx.logical ?? ctx.frame ?? 0, armOverChest = ctx.state === 'attack' && fr % 4 === 2;
  if (!back && !armOverChest) {
    // a weeping teardrop sigil chased into the breastplate, set toward the facing in profile
    const c = neck[0] + fx * 0.5 + (profile ? dir * X(2.4) : 0), cy = neck[1] + X(4.6), rr = X(1);
    decals.push({ name: 'sigil', part: 'breastplate', mat: 'metal', band: 1, shape: poly([[c, cy - X(2.4)], [c + rr, cy - X(0.2)], [c + rr * 0.8, cy + rr * 0.8], [c, cy + rr * 1.1], [c - rr * 0.8, cy + rr * 0.8], [c - rr, cy - X(0.2)]]) });
  } else if (back) {
    // fold creases down the cloak stopping above the ragged hem
    const y0 = neck[1] + X(4), y1 = ground - X(4);
    for (const z of [-6.4, -3.2, 0]) {
      const x0 = neck[0] + R(z), x1 = neck[0] + R(z * 1.5) + sway;
      decals.push({ name: 'fold', part: 'cloak', mat: 'leather', band: 2, shape: poly([[x0 - 0.5, y0], [x0 + 0.5, y0], [x1 + 0.5, y1], [x1 - 0.5, y1]]) });
    }
  }
  let p = ctx.lib.proc(s)
    .add('ao', { part: ['breastplate', 'tassets', 'gorget', 'thigh', 'upper-arm', 'helm'] })
    .add('materialNoise', { part: ['cloak'], amount: 0.1, scale: 3, seed: ctx.variant ?? 0 })
    .add('rimLight', { part: ['breastplate', 'helm', 'pauldron', 'tassets'], side: 'away' });
  for (const d of decals) p = p.add('decal', d);
  return p.add('groundShadow', {}).render();
}

// Named points per frame: head, hand (the sword hand), the blade's tip, eyes where the visor faces the viewer
export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: [Math.round(L.hcx), Math.round(L.top + L.helmH * 0.5)], hand: L.swordArm.hand.map(Math.round), tip: L.blade.tip.map(Math.round) };
  delete a.ground;
  L.eyes.forEach((x, i) => { a[i ? 'eye2' : 'eye'] = [x, L.ey]; });
  return a;
};
