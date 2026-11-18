// boss-the-king-below base.v2 (r2) — DECORATION PASS on the approved base.v1 shape (stage shape approved). The
// outline is unchanged: every shape keeps its v1 geometry; only what is inside the line changes.
// What changed vs v1:
//  - flat fills become lit forms under the direction's light (upper left): cylinders along the tail, thighs, greaves,
//    arms, horns, haft and belt; round 'normal' masses for the chest, skirt, mantle, pauldrons, head and sabatons;
//    spheres for knees, couters, gauntlets and pommel; bevelled steel on the blade, spike and point. The plate stays
//    on the cloth ramp, the family K body ramp (family-k-cap recolours cloth), so he takes his row colour (blood);
//  - a readable face on the bull neck: a heavy dark brow ridge over two burning eyes (glow with a hot core), a
//    snout shadow, and a wide fanged mouth; from behind the bare skull shows dark hair/hide and a spine ridge;
//  - the signature great-axe: steel blade with a lit bevel, the one bright accent a burning glow edge with a hot
//    core line along the crescent, leather-wrapped haft with grip bands;
//  - procedural layers: ao in the joints, rim light on the away side of chest, pauldrons and head, low material
//    noise on the mantle; decals: a burning sigil and battle scars on the breastplate, plate seams on the skirt, a
//    gem on the crown, fold creases on the mantle from behind.
// boss-the-king-below base.v1 (r1) SHAPE DRAFT — The King Below, the blood-red demon brute on the throne of level 100
// and a unique boss of family k (the death knights and dread lords), 8.9 m (about 142 px, 3.8x the drawn player) in the
// 128 x 160 frame. Silhouette and form only, flat materials, no proc layers, no decals. What tells him apart from the
// plain family sprite (and from the other K bosses): a colossal hunched demon king, not a knight in a helm — a bare
// horned head on a thick bull neck, sunk low between two great rounded pauldrons, under a spiked iron crown with two
// huge ram horns sweeping out past the shoulders and curling up; a barrel chest over a tapered waist and a flared,
// uneven skirt of plates; thick bent legs in a wide stance on broad hooved sabatons; a short royal mantle flaring to the
// knees behind him (the legs stay clear of it); and a thick demon tail that sweeps out behind and gives the side views
// their depth. His signature is a giant crescent great-axe held upright beside him, its head level with his horns, and
// swung two-handed in a wide arc on the attack (wind-up behind the head, the sweep, a held low hit, recovery). The one
// bright accent is planned on the axe: a burning glow edge on the crescent blade. s and n are three-quarter turns of the
// rig, e a profile the engine mirrors for w. Built on the template's shared biped rig (`ctx.lib.rigs.body`); bones are
// never resized. Colours are role ramps and sizes relative to the brief's height (R11).
export const meta = { brief: 'boss-the-king-below', pass: 'r2', notes: 'decorated: lit plate on the family cloth ramp, burning eyes and fanged maw, glowing crescent edge, sigil and scars', recolour: 'cloth' };

export const params = {
  cloth: { type: 'swap', options: ['cloth', 'leather', 'accent'], default: 'cloth' },
};

const TURN = { s: 'sw', e: 'e', n: 'ne', w: 'w' };
const HM = 8.9, PLAYER = 37;

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

// The axe arm per state and frame: the hand's target from the shoulder ([toward, down] in arm lengths) and the haft's
// direction ([toward, down], from the hand to the axe head). Idle and walk hold the axe upright at the outer side; the
// attack hauls it up behind the head, sweeps it over and brings it down low in front, held on the hit frame.
const AXE = {
  idle: [{ h: [0, 0.8], d: [0.16, -1] }, { h: [0, 0.82], d: [0.16, -1] }],
  walk: [{ h: [-0.06, 0.8], d: [0.12, -1] }, { h: [0, 0.82], d: [0.16, -1] }, { h: [0.06, 0.8], d: [0.2, -1] }, { h: [0, 0.82], d: [0.16, -1] }],
  attack: [
    { h: [0.3, -0.2], d: [-0.8, -0.6], ph: [-0.1, -0.2], pd: [-0.85, -0.53], two: true }, // wind-up: hauled back over the shoulder
    { h: [0.5, -0.2], d: [0.85, -0.53], ph: [0.15, -0.15], pd: [0.45, -0.9], two: true }, // the sweep over the head
    { h: [0.35, 0.5], d: [0.62, 0.78], ph: [0.3, 0.45], pd: [0.4, 0.92], two: true },     // the hit, low in front (held)
    { h: [0, 0.74], d: [0.15, -0.99] },                                                     // recovery, the axe coming back up
  ],
};

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, S = (HM * metre) / PLAYER, X = v => v * S, hr = ctx.dir.scale.proportions?.headRatio ?? 0.4;
  const ground = h - 1, facing = TURN[ctx.facing] ?? ctx.facing;
  // the rig stands to the crown's band; the crown's points and the horns' curl rise above it
  const rig = ctx.lib.rigs.body('biped', ctx, { facing, ground, height: Math.round(HM * metre - X(3.4)), proportions: { head: hr * 0.6, leg_up: 0.19, leg_lo: 0.18 } });
  const { sx, front, side } = rig, P = rig.pose(ctx.state, ctx.t), headH = rig.lengths.head / 0.92;
  const dir = sx < 0 ? -1 : 1, profile = side > 0.9, back = front < 0, wf = 1 - 0.3 * side;
  const neck = P.start('neck'), hip = P.start('spine');
  // the hunch: the head sunk low and thrust toward the facing, between the pauldrons
  const hcx = P.at('head', 0.5)[0] + dir * X(1.2) * side + dir * X(0.4), top = P.end('head')[1] + X(2.6), headW = X(5.6) * (1 - 0.1 * side);
  const showFace = !back, fx = dir * headW * 0.24 * side;
  const outR = Math.sign(P.start('armR_up')[0] - neck[0]) || dir, outL = -outR;
  const shY = neck[1] + X(2);
  const sh = o => [neck[0] + o * X(7) * wf + (profile ? -dir * X(0.5) * (o === outR ? -1 : 1) : 0), shY];
  const shR = sh(outR), shL = sh(outL), l1 = rig.lengths.armR_up, l2 = rig.lengths.armR_lo, arm = l1 + l2;
  const f = (ctx.logical ?? ctx.frame ?? 0), table = AXE[ctx.state] ?? AXE.idle, k = table[f % table.length];
  const toward = profile ? dir : -outR;
  const kh = profile && k.ph ? k.ph : k.h;
  const target = k.two ? [shR[0] + toward * kh[0] * arm, shR[1] + kh[1] * arm]
    : [shR[0] + (profile ? dir * (X(0.2) + k.h[0] * arm) : outR * (X(1.4) + k.h[0] * arm)), shR[1] + k.h[1] * arm];
  const axeArm = reach(shR, target, l1, l2, (profile ? -dir : outR) * (k.h[1] < 0 ? -1 : 1));
  const kd = profile && k.pd ? k.pd : k.d;
  const hd0 = norm(k.two ? [toward * kd[0], kd[1]] : [(profile ? dir : outR) * kd[0], kd[1]]);
  // the blade's side: outward from the body when held upright, leading the swing on the attack
  const grip = axeArm.hand, len = X(12.5), up = k.two ? (toward) : (profile ? dir : outR);
  const side0 = d => {
    let n = [-d[1], d[0]];
    if (Math.sign(n[0] || 1) !== up && Math.abs(n[0]) > 0.2) n = [-n[0], -n[1]];
    if (Math.abs(n[0]) <= 0.2 && n[1] < 0 === (d[0] * up > 0)) n = [-n[0], -n[1]];
    return n;
  };
  // the axe stays inside the frame: the haft turns by the least angle that keeps the head and blade in the cell
  const fits = d => {
    const n = side0(d), at = (t, m) => [grip[0] + d[0] * t + n[0] * m, grip[1] + d[1] * t + n[1] * m], b0 = len - X(7);
    return [at(len + X(3.6), 0), at(b0 - X(2.2), X(6.2)), at(b0 + X(3.4), X(7.8)), at(len + X(1.6), X(6.4)), at(b0 + X(3.6), -X(4.6)), at(-X(4.2), 0)]
      .every(([x, y]) => x >= 2 && x <= w - 3 && y >= 2);
  };
  let hd = hd0;
  for (let i = 1; i <= 24 && !fits(hd); i++) {
    const a = (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 5 * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a), r = [hd0[0] * c - hd0[1] * sn, hd0[0] * sn + hd0[1] * c];
    if (fits(r)) { hd = r; break; }
  }
  const n = side0(hd);
  const axe = { grip, d: hd, n, butt: [grip[0] - hd[0] * X(3.2), grip[1] - hd[1] * X(3.2)], head: [grip[0] + hd[0] * len, grip[1] + hd[1] * len], len };
  const offTarget = k.two ? [grip[0] - hd[0] * X(2.6), grip[1] - hd[1] * X(2.6)] : [shL[0] + outL * X(2.4), shL[1] + arm * 0.8];
  const offArm = reach(shL, offTarget, rig.lengths.armL_up, rig.lengths.armL_lo, outL);
  const headH2 = headH * 1.05, ey = Math.round(top + headH2 * 0.5);
  const eyes = showFace ? (profile ? [hcx + dir * headW * 0.32] : [hcx + fx - headW * 0.22, hcx + fx + headW * 0.14]).map(Math.round) : [];
  return { w, h, X, rig, P, dir, front, side, profile, back, wf, ground, headH: headH2, hcx, top, headW, showFace, fx, neck, hip, shR, shL, outR, outL, axeArm, offArm, axe, eyes, ey, k };
}

export function render(ctx) {
  const { pal } = ctx.dir, Pm = ctx.params, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), plate = pal[Pm.cloth];
  const { X, P: pose, dir, side, profile, back, wf, ground, hcx, top, headW, headH, showFace, fx, neck, hip, shR, shL, outR, axeArm, offArm, axe, eyes, ey } = L;
  const F = (mat, band = 1) => ({ mat, shade: 'flat', band });
  const R = v => X(v) * wf;
  const walking = ctx.state === 'walk', sway = walking ? Math.sin(ctx.t * Math.PI * 2) * X(0.6) : 0;
  const wy = hip[1] - X(2.6); // the waist

  // ---- the demon tail: thick at the root, sweeping out behind and along the ground, the tip curling up
  const tail = () => {
    const r = [hip[0] - (profile ? dir * X(2) : 0), hip[1] - X(0.5)], o = profile ? -dir : (back ? dir : -dir), swing = walking ? Math.sin(ctx.t * Math.PI * 2) * X(1) : 0;
    const pts = profile
      ? [r, [r[0] + o * X(4), r[1] + X(4)], [r[0] + o * X(8), ground - X(3.5)], [r[0] + o * X(9.5) + swing, ground - X(2.8)], [r[0] + o * X(11) + swing, ground - X(6.4)]]
      : [r, [r[0] + o * X(3), r[1] + X(5)], [r[0] + o * X(7), ground - X(2.6)], [r[0] + o * X(10) + swing, ground - X(2.6)], [r[0] + o * X(11.4) + swing, ground - X(6.4)]];
    s.add({ type: 'group', name: 'tail', underlay: true, children: [
      { type: 'tube', name: 'tail', pts, w: X(3), w1: X(0.9), mat: plate, shade: 'cyl' },
      { type: 'poly', name: 'tail-barb', pts: [[pts[4][0] - X(1.2), pts[4][1] + X(0.4)], [pts[4][0] + o * X(1.6), pts[4][1] - X(2.6)], [pts[4][0] + X(1.2), pts[4][1] + X(0.6)]], mat: pal.metal, shade: 'bevel' },
    ] });
  };

  // ---- the royal mantle: hangs from the shoulders behind him and flares wider than the pauldrons to a ragged hem at
  // the knees, so the legs stand clear of it
  const mantle = () => {
    const y0 = neck[1] + X(0.8), hem = ground - X(8.5);
    const pts = profile
      ? [[neck[0] + dir * X(1), y0], [neck[0] - dir * X(4), y0 + X(1)], [neck[0] - dir * X(8) + sway, hem - X(7)], [neck[0] - dir * X(10.5) + sway, hem + X(0.6)],
        [neck[0] - dir * X(7.6) + sway, hem - X(1.4)], [neck[0] - dir * X(5) + sway, hem + X(1)], [neck[0] - dir * X(2.2) + sway, hem - X(1)], [neck[0] + dir * X(0.4), hem - X(3)], [neck[0] + dir * X(1.6), y0 + X(9)]]
      : [[neck[0], y0 - X(0.4)], [neck[0] + R(7), y0 + X(0.4)], [neck[0] + R(11) + sway, y0 + X(12)], [neck[0] + R(13.4) + sway, hem + X(0.4)],
        [neck[0] + R(9) + sway, hem - X(1.8)], [neck[0] + R(5.4) + sway, hem + X(1)], [neck[0] + R(1.6) + sway, hem - X(1.4)], [neck[0] - R(2) + sway, hem + X(0.6)],
        [neck[0] - R(5.6) + sway, hem - X(1.6)], [neck[0] - R(9.4) + sway, hem + X(0.8)], [neck[0] - R(13.2) + sway, hem - X(0.8)], [neck[0] - R(11) + sway, y0 + X(12)], [neck[0] - R(7), y0 + X(0.4)]];
    s.add({ type: 'path', name: 'mantle', underlay: true, d: smooth(pts), mat: pal.leather, shade: 'normal', round: X(4) });
  };

  // ---- legs: thick plated thighs, knee cops, tapered greaves and broad hooved sabatons, in a wide stance
  const legs = () => {
    for (const nm of pose.far(['legL_up', 'legR_up'])) {
      const lo = nm.replace('_up', '_lo'), a = pose.start(nm), kn = pose.end(nm), an = pose.end(lo);
      const spread = profile ? 0 : (Math.sign(a[0] - hip[0]) || 1) * X(2.6);
      const A = [a[0] + spread, a[1] - X(1)], K = [kn[0] + spread * 1.35 + dir * X(0.5) * side, kn[1]], N = [an[0] + spread * 1.2, an[1] - X(1)];
      s.add({ type: 'group', name: 'leg', underlay: true, children: [
        { type: 'tube', name: 'thigh', pts: [A, K], w: X(4.6), w1: X(3.4), mat: plate, shade: 'cyl' },
        { type: 'tube', name: 'greave', pts: [K, N], w: X(3.4), w1: X(2.3), mat: plate, shade: 'cyl' },
        { type: 'ellipse', name: 'knee', cx: K[0] + dir * X(0.4) * side, cy: K[1], rx: X(2), ry: X(1.7), mat: plate, shade: 'sphere' },
        { type: 'path', name: 'sabaton', d: smooth([[N[0] - X(2), N[1] - X(0.4)], [N[0] + X(2), N[1] - X(0.4)], [N[0] + X(2.2) + dir * X(1.8) * (0.3 + side), an[1] + X(0.3)], [N[0] - X(2.4) + dir * X(0.4), an[1] + X(0.3)]]), mat: plate, shade: 'normal', round: X(1.2) },
      ] });
    }
  };

  // ---- the great-axe: a long haft, a broad crescent blade on one side, a back spike, a spear point on top
  const greatAxe = () => {
    const { grip, d, n, butt, head } = axe, at = (t, m) => [grip[0] + d[0] * t + n[0] * m, grip[1] + d[1] * t + n[1] * m], L0 = axe.len;
    const b0 = L0 - X(7), b1 = L0 - X(0.6);
    s.add({ type: 'group', name: 'great-axe', underlay: true, children: [
      { type: 'capsule', name: 'haft', a: butt, b: head, r: X(0.75), mat: pal.leather, shade: 'cyl' },
      { type: 'poly', name: 'spike', pts: [at(b0 + X(2.4), -X(0.6)), at(b0 + X(3.6), -X(4.4)), at(b0 + X(4.4), -X(0.6))], mat: pal.metal, shade: 'bevel' },
      { type: 'path', name: 'blade', d: smooth([at(b0 + X(1.4), X(0.4)), at(b0 - X(1.6), X(3.6)), at(b0 - X(2), X(6.2)), at(b0 + X(3.4), X(7.6)), at(b1 + X(1.4), X(6.2)), at(b1 + X(0.8), X(3.4)), at(b1 - X(1.6), X(0.4))]), mat: pal.metal, shade: 'bevel' },
      { type: 'tube', name: 'edge', pts: [at(b0 - X(1.4), X(5.6)), at(b0 + X(3.4), X(7.1)), at(b1 + X(1), X(5.6))], w: X(1.2), w1: X(1), ...F(pal.glow, 1) },
      { type: 'tube', name: 'edge-core', pts: [at(b0 - X(1.2), X(5.5)), at(b0 + X(3.4), X(6.9)), at(b1 + X(0.9), X(5.5))], w: X(0.4), ...F(pal.glow, 0) },
      { type: 'poly', name: 'point', pts: [at(L0 - X(0.4), -X(0.9)), at(L0 + X(3.4), 0), at(L0 - X(0.4), X(0.9))], mat: pal.metal, shade: 'bevel' },
      ...[-1.6, 0, 1.6].map(t => ({ type: 'capsule', name: 'grip-band', a: at(t - X(0.3), -X(0.8)), b: at(t - X(0.3), X(0.8)), r: X(0.35), mat: pal.leather, shade: 'flat', band: 2 })),
      { type: 'circle', name: 'pommel', cx: butt[0], cy: butt[1], r: X(1), mat: pal.metal, shade: 'sphere' },
    ] });
  };
  const limb = (name, a, armP, fist) => s.add({ type: 'group', name, underlay: true, children: [
    { type: 'tube', name: 'upper-arm', pts: [a, armP.elbow], w: X(4), w1: X(3.2), mat: plate, shade: 'cyl' },
    { type: 'tube', name: 'vambrace', pts: [armP.elbow, armP.hand], w: X(3.4), w1: X(2.6), mat: plate, shade: 'cyl' },
    { type: 'circle', name: 'couter', cx: armP.elbow[0], cy: armP.elbow[1], r: X(1.7), mat: plate, shade: 'sphere' },
    { type: 'circle', name: 'gauntlet', cx: armP.hand[0], cy: armP.hand[1], r: X(fist), mat: pal.metal, shade: 'sphere' },
  ] });
  // the off hand's claws: three hooked talons below the bare fist when it hangs free
  const claws = () => {
    if (L.k.two) return;
    const hnd = offArm.hand, o = profile ? dir : -outR;
    s.add({ type: 'group', name: 'claws', underlay: true, children: [-1, 0, 1].map(i => ({ type: 'poly', name: 'claw', pts: [[hnd[0] + i * X(1) - X(0.5), hnd[1] + X(0.8)], [hnd[0] + i * X(1.2) + o * X(0.6), hnd[1] + X(3.6)], [hnd[0] + i * X(1) + X(0.5), hnd[1] + X(0.8)]], mat: pal.hair, shade: 'bevel' })) });
  };
  const axeArmNode = () => { greatAxe(); limb('arm-axe', shR, axeArm, 1.6); };
  const offArmNode = () => { claws(); limb('arm-off', shL, offArm, 1.7); };

  // ---- the body: a great barrel chest swelling at the ribs, tapered to the waist, then a flared uneven skirt of plates
  const torso = () => {
    const c = neck[0] + fx * 0.5, bul = X(2.2) * side;
    const q = (sg, v) => c + sg * R(v) + (sg === dir ? bul : 0);
    s.add({ type: 'path', name: 'chest', underlay: true, d: smooth([
      [c, neck[1] - X(0.8)], [q(1, 6), neck[1] + X(0.2)], [q(1, 8.2), neck[1] + X(4.4)], [q(1, 8), neck[1] + X(8.4)], [q(1, 5.4), wy - X(1)], [q(1, 4), wy + X(0.8)],
      [q(-1, 4), wy + X(0.8)], [q(-1, 5.4), wy - X(1)], [q(-1, 8), neck[1] + X(8.4)], [q(-1, 8.2), neck[1] + X(4.4)], [q(-1, 6), neck[1] + X(0.2)],
    ]), mat: plate, shade: 'normal', round: X(5) });
    s.add({ type: 'path', name: 'skirt', underlay: true, d: smooth([
      [c - R(4.2), wy - X(0.4)], [c + R(4.2), wy - X(0.4)], [c + R(8) + sway * 0.5, wy + X(5.6)], [c + R(4.6), wy + X(4.6)], [c + R(2), wy + X(6.6)],
      [c - R(0.6), wy + X(4.8)], [c - R(3.4), wy + X(6.2)], [c - R(5.2), wy + X(4.6)], [c - R(8.2) + sway * 0.5, wy + X(5.2)],
    ]), mat: plate, shade: 'normal', round: X(3) });
    s.add({ type: 'capsule', name: 'belt', a: [q(-1, 4.2), wy], b: [q(1, 4.2), wy], r: X(0.7), mat: pal.leather, shade: 'cyl', axis: 'x' });
  };
  // ---- the pauldrons: great rounded plates with a single short horn each, riding below the crown so the head stays clear
  const pauldron = o => {
    const c = [neck[0] + (profile ? -dir * X(0.8) * o : o * X(8.2) * wf), neck[1] + X(0.6)], pr = profile ? X(5) : X(5.4) * (1 - 0.12 * side);
    s.add({ type: 'group', name: 'pauldron', underlay: true, children: [
      { type: 'tube', name: 'pauldron-horn', pts: [[c[0] + o * pr * 0.35, c[1] - X(2.6)], [c[0] + o * pr * 0.85, c[1] - X(4.6)], [c[0] + o * pr * 0.9, c[1] - X(6.6)]], w: X(1.8), w1: X(0.4), mat: pal.hair, shade: 'cyl' },
      { type: 'path', name: 'pauldron', d: smooth([[c[0] - pr, c[1] + X(1.2)], [c[0] - pr * 0.75, c[1] - X(2.8)], [c[0], c[1] - X(3.6)], [c[0] + pr * 0.8, c[1] - X(2.6)], [c[0] + pr, c[1] + X(1.4)], [c[0] + o * pr * 0.6, c[1] + X(4.4)], [c[0] - o * pr * 0.2, c[1] + X(4)]]), mat: plate, shade: 'normal', round: X(3) },
    ] });
  };
  // ---- the head: a bare demon head with a heavy jaw on a thick neck, a spiked iron crown on the brow, and two great
  // ram horns sweeping out past the shoulders and curling up; the same head and horns in every facing
  const horns = () => {
    const hy = top + headH * 0.3;
    for (const o of profile ? [-dir] : [-1, 1]) {
      const b = [hcx + (profile ? -dir * headW * 0.1 : o * headW * 0.38), hy], ox = profile ? 0.75 : 1;
      s.add({ type: 'tube', name: 'horn', underlay: true, pts: [b, [b[0] + o * X(4) * ox, hy + X(0.6)], [b[0] + o * X(8) * ox, hy - X(1.2)], [b[0] + o * X(9.4) * ox, hy - X(5)], [b[0] + o * X(8) * ox, hy - X(7.6)]], w: X(2.6), w1: X(0.6), mat: pal.hair, shade: 'cyl' });
    }
  };
  const head = () => {
    const hw = headW / 2, b = top + headH, jx = hcx + dir * X(0.8) * side;
    s.add({ type: 'ellipse', name: 'neck', cx: neck[0] + fx * 0.3, cy: neck[1] - X(0.6), rx: X(3.6) * wf, ry: X(2.2), mat: showFace ? pal.skin : pal.hair, shade: 'cyl', axis: 'x' });
    s.add({ type: 'path', name: 'head', underlay: true, d: smooth([
      [hcx, top - X(0.2)], [hcx + hw * 0.92, top + X(0.4)], [hcx + hw, top + headH * 0.5], [jx + hw * 0.86 + (profile ? dir * X(0.8) : 0), b - X(0.6)], [jx, b + X(0.6)], [jx - hw * 0.86, b - X(0.6)], [hcx - hw, top + headH * 0.5], [hcx - hw * 0.92, top + X(0.4)],
    ]), mat: showFace ? pal.skin : pal.hair, shade: 'normal', round: X(2.4) });
    // the crown: a band on the brow with five points, the middle one tallest
    const cy = top + X(0.4), cw = hw * 1.08, pts = [[hcx - cw, cy + X(1.6)]];
    for (let i = 0; i < 5; i++) {
      const x = hcx - cw + ((i + 0.5) / 5) * 2 * cw, ph = X(i === 2 ? 3.6 : i % 2 ? 2.4 : 2.8);
      pts.push([x - cw * 0.14, cy], [x, cy - ph], [x + cw * 0.14, cy]);
    }
    pts.push([hcx + cw, cy + X(1.6)]);
    s.add({ type: 'poly', name: 'crown', underlay: true, pts, mat: pal.metal, shade: 'bevel' });
    if (showFace) {
      const bw = profile ? Math.round(headW * 0.42) : Math.round(headW * 0.78), bx = profile ? Math.round(hcx + dir * headW * 0.1 - (dir < 0 ? bw : 0)) : Math.round(hcx + fx - bw / 2);
      s.add({ type: 'rect', name: 'brow', x: bx, y: ey - 2, w: bw, h: 2, mat: pal.skin, shade: 'flat', band: 2 });
      for (const ex of eyes) {
        s.add({ type: 'rect', name: 'eye', x: ex, y: ey, w: 2, h: 2, mat: pal.glow, shade: 'flat', band: 1 });
        s.add({ type: 'rect', name: 'eyecore', x: ex, y: ey, w: 1, h: 1, mat: pal.glow, shade: 'flat', band: 0 });
      }
      const nx = profile ? Math.round(jx + dir * hw * 0.62) : Math.round(jx + fx - 1);
      s.add({ type: 'rect', name: 'snout', x: nx, y: ey + 3, w: 2, h: 2, mat: pal.skin, shade: 'flat', band: 2 });
      const my = Math.round(top + headH * 0.8), mw = profile ? headW * 0.3 : headW * 0.46, mx = profile ? jx + dir * hw * 0.5 - (dir < 0 ? mw : 0) : jx + fx - mw / 2;
      s.add({ type: 'rect', name: 'mouth', x: Math.round(mx), y: my, w: Math.round(mw), h: 2, color: 'outline' });
      const fangs = profile ? [Math.round(mx + (dir > 0 ? mw - 1 : 0))] : [Math.round(mx + 1), Math.round(mx + mw - 2)];
      for (const fx2 of fangs) s.add({ type: 'rect', name: 'fang', x: fx2, y: my, w: 1, h: 2, mat: pal.hair, shade: 'flat', band: 0 });
    } else {
      s.add({ type: 'rect', name: 'spine-ridge', x: Math.round(hcx), y: Math.round(top + X(1.6)), w: 1, h: Math.round(headH - X(2.4)), mat: pal.hair, shade: 'flat', band: 2 });
    }
  };

  // draw order: tail and mantle behind in the front views; from behind the mantle and head go over the back
  const [farArm] = pose.far(['armL_up', 'armR_up']), farIsAxe = farArm === 'armR_up';
  const farP = profile ? null : (back ? outR : -dir);
  if (!back) { tail(); mantle(); }
  if (farIsAxe) axeArmNode(); else offArmNode();
  if (back) tail();
  legs();
  torso();
  if (back) { mantle(); horns(); head(); }
  if (!profile) { pauldron(-(farP ?? dir)); pauldron(farP ?? dir); } else pauldron(1);
  if (!back) { horns(); head(); }
  if (farIsAxe) offArmNode(); else axeArmNode();
  const c = neck[0] + fx * 0.5, cy = neck[1] + X(4.6), decals = [];
  if (!back && !profile) {
    decals.push({ name: 'sigil', part: 'chest', mat: 'glow', band: 1, shape: { type: 'poly', pts: [[c, cy - X(2)], [c + X(1.5), cy], [c, cy + X(2.2)], [c - X(1.5), cy]] } });
    decals.push({ name: 'sigil-core', part: 'chest', mat: 'glow', band: 0, shape: { type: 'rect', x: Math.round(c), y: Math.round(cy - 1), w: 1, h: 2 } });
    decals.push({ name: 'scar', part: 'chest', mat: 'cloth', band: 2, shape: { type: 'poly', pts: [[c + X(3.4), cy - X(3)], [c + X(4), cy - X(3)], [c + X(2.4), cy + X(2.6)], [c + X(1.8), cy + X(2.6)]] } });
    decals.push({ name: 'scar2', part: 'chest', mat: 'cloth', band: 2, shape: { type: 'poly', pts: [[c - X(4.4), cy - X(1)], [c - X(3.8), cy - X(1)], [c - X(2.8), cy + X(2.6)], [c - X(3.4), cy + X(2.6)]] } });
  }
  if (!back) decals.push({ name: 'gem', part: 'crown', mat: 'accent', band: 1, shape: { type: 'rect', x: Math.round(hcx - 1), y: Math.round(top + X(0.2)), w: 2, h: 2 } });
  else {
    for (const z of [-4, 0, 4]) {
      const x0 = neck[0] + R(z), x1 = neck[0] + R(z * 1.3) + sway;
      decals.push({ name: 'fold', part: 'mantle', mat: 'leather', band: 2, shape: { type: 'poly', pts: [[x0 - 0.5, neck[1] + X(4)], [x0 + 0.5, neck[1] + X(4)], [x1 + 0.5, ground - X(10.5)], [x1 - 0.5, ground - X(10.5)]] } });
    }
  }
  if (!back) for (const z of [-2, 2]) decals.push({ name: 'skirt-seam', part: 'skirt', mat: 'cloth', band: 2, shape: { type: 'rect', x: Math.round(c + R(z)), y: Math.round(wy + X(1)), w: 1, h: Math.round(X(3)) } });
  let p = ctx.lib.proc(s)
    .add('ao', { part: ['chest', 'skirt', 'thigh', 'upper-arm', 'neck', 'head'] })
    .add('materialNoise', { part: ['mantle'], amount: 0.1, scale: 3, seed: ctx.variant ?? 0 })
    .add('rimLight', { part: ['chest', 'pauldron', 'head', 'mantle'], side: 'away' });
  for (const d of decals) p = p.add('decal', d);
  return p.render();
}

// Named points per frame: head, hand (the axe hand), the axe head, eyes where the face is visible
export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: [Math.round(L.hcx), Math.round(L.top + L.headH * 0.5)], hand: L.axe.grip.map(Math.round), tip: L.axe.head.map(Math.round) };
  delete a.ground;
  L.eyes.forEach((x, i) => { a[i ? 'eye2' : 'eye'] = [x, L.ey]; });
  return a;
};
