// boss-the-unnamed-regent base.v1 (r1) SHAPE DRAFT: The Unnamed Regent, the faceless king of the abyssal throne (family
// K, death knights and dread lords; an aberration caster boss, the final boss of level 100, drawn 9.1 m tall, 3.9x the
// player). Silhouette and form only: flat materials, no proc layers, no decals.
// What keeps him in the family: blackened plate on the family's body ramp (cloth, recoloured violet), great rounded
// pauldrons, a horned great helm and a cape. What makes him the Regent and not a big death knight:
//  - the signature crown: a tall, uneven crown of seven tines, far wider than the helm, standing clear above it, with
//    the family's horns sweeping out and up beneath it like a second, living crown;
//  - no face: the helm is a smooth egg with a hollow, featureless void where the face should be (he has no name);
//  - a regent's sceptre: a long staff taller than his shoulders, topped by a ring that holds a glowing orb (the glow
//    ramp, the one bright accent), swung in a clear overhead arc on the attack and held low on the hit frame;
//  - mass: a royal mantle (leather, the family cape) hung from the shoulders and flaring wide to a ragged hem whose
//    points curl like tendrils (the aberration), so the front is far wider than half his height; a barrel breastplate
//    tapering to the waist, flared tassets, thick bent legs set wide and an off hand with three long claws, held open.
// The head, both arms, the sceptre and the legs stay clear of the mantle in every facing; the profile keeps its depth
// with the mantle trailing as a long train behind and the sceptre held forward.
// Built on the shared biped rig (`ctx.lib.rigs.body`); s and n are three-quarter turns, e is the profile (w mirrored).
export const meta = { brief: 'boss-the-unnamed-regent', pass: 'r1', notes: 'shape draft: faceless crowned regent, wide tendril-hemmed mantle, orb sceptre, clawed off hand', recolour: 'cloth' };

export const params = {
  cloth: { type: 'swap', options: ['cloth', 'leather', 'accent'], default: 'cloth' },
};

const TURN = { s: 'sw', e: 'e', n: 'ne', w: 'w' };
const HM = 9.1, PLAYER = 37;

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
// sceptre's head direction from the hand ([toward, down]). Idle and walk hold it upright beside him; the attack hauls it
// up and back, sweeps it over the crown and brings the orb down in front (held), then lifts it back.
const ROD = {
  idle: [{ h: [0.1, 0.62], b: [0.06, -1] }, { h: [0.1, 0.64], b: [0.06, -1] }],
  walk: [{ h: [0.04, 0.62], b: [0.02, -1] }, { h: [0.1, 0.64], b: [0.08, -1] }, { h: [0.16, 0.62], b: [0.12, -1] }, { h: [0.1, 0.64], b: [0.08, -1] }],
  attack: [
    { h: [-0.15, -0.3], b: [-0.3, -0.95], two: true },               // wind-up: raised up and back over the shoulder
    { h: [0.18, -0.4], b: [0.4, -0.92], pb: [0.2, -0.98], two: true }, // the sweep over the crown
    { h: [0.4, 0.3], b: [0.6, 0.8], two: true },                   // the hit: the orb driven down in front (held)
    { h: [0.25, 0.55], b: [0.35, -0.94] },                            // recovery: lifted back upright
  ],
};

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, S = (HM * metre) / PLAYER, X = v => v * S, hr = ctx.dir.scale.proportions?.headRatio ?? 0.4;
  const ground = h - 1, facing = TURN[ctx.facing] ?? ctx.facing;
  // the rig stops at the helm's crown; the crown's tines make up the rest of his height
  const rig = ctx.lib.rigs.body('biped', ctx, { facing, ground, height: Math.round(HM * metre - X(4.4)), proportions: { hip: 0.02, spine: 0.34, neck: 0.04, head: hr * 0.55, leg_up: 0.19, leg_lo: 0.19, arm_up: 0.16, arm_lo: 0.15, legSep: 0.08 } });
  const { sx, front, side } = rig, P = rig.pose(ctx.state, ctx.t), headH = rig.lengths.head / 0.92;
  const dir = sx < 0 ? -1 : 1, profile = side > 0.9, back = front < 0, wf = 1 - 0.3 * side;
  const neck = P.start('neck'), hip = P.start('spine');
  const hcx = P.at('head', 0.5)[0] + dir * X(0.4) * side, top = P.end('head')[1] + X(1.2), helmW = X(6.2) * (1 - 0.1 * side), helmH = headH * 1.05;
  const showFace = !back, fx = dir * helmW * 0.22 * side;
  const outR = Math.sign(P.start('armR_up')[0] - neck[0]) || dir, outL = -outR;
  const shY = neck[1] + X(1.6);
  const sh = o => [neck[0] + o * X(6.8) * wf + (profile ? -dir * X(0.4) * (o === outR ? -1 : 1) : 0), shY];
  const shR = sh(outR), shL = sh(outL), l1 = rig.lengths.armR_up, l2 = rig.lengths.armR_lo, arm = l1 + l2;
  const f = (ctx.logical ?? ctx.frame ?? 0), table = ROD[ctx.state] ?? ROD.idle, k = table[f % table.length];
  const toward = profile ? dir : -outR;
  const target = k.two ? [shR[0] + toward * k.h[0] * arm, shR[1] + k.h[1] * arm] : [shR[0] + (profile ? toward * k.h[0] * arm : outR * X(2)), shR[1] + k.h[1] * arm];
  const rodArm = reach(shR, target, l1, l2, (profile ? -dir : outR) * (k.h[1] < 0 ? -1 : 1));
  const kb = profile && k.pb ? k.pb : k.b, bd = norm([toward * kb[0] + (profile || k.two ? 0 : outR * 0.04), kb[1]]);
  const grip = rodArm.hand, rod = { up: X(ctx.state === 'attack' ? 9.5 : 14), down: X(6.5), dir: bd };
  rod.head = [grip[0] + bd[0] * rod.up, grip[1] + bd[1] * rod.up];
  rod.butt = [grip[0] - bd[0] * rod.down, grip[1] - bd[1] * rod.down];
  // the off hand: on the shaft below the sceptre hand for the two-handed swing, else held open and out, claws spread
  const offTarget = k.two ? [grip[0] - bd[0] * X(2.6), grip[1] - bd[1] * X(2.6)] : [shL[0] + outL * X(3.2) + (profile ? dir * X(2.5) : 0), shL[1] + arm * 0.72];
  const offArm = reach(shL, offTarget, rig.lengths.armL_up, rig.lengths.armL_lo, outL);
  return { w, h, X, rig, P, dir, front, side, profile, back, wf, ground, headH, hcx, top, helmW, helmH, showFace, fx, neck, hip, shR, shL, outR, outL, rodArm, offArm, rod, k };
}

export function render(ctx) {
  const { pal } = ctx.dir, Pm = ctx.params, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), plate = pal[Pm.cloth];
  const { X, P: pose, dir, side, profile, back, wf, ground, hcx, top, helmW, helmH, showFace, fx, neck, hip, shR, shL, outR, rodArm, offArm, rod, k } = L;
  const R = v => X(v) * wf;
  const walking = ctx.state === 'walk', sway = walking ? Math.sin(ctx.t * Math.PI * 2) * X(0.6) : 0;
  const flat = (mat, band) => ({ mat, shade: 'flat', band });

  // ---- the royal mantle: from the shoulders, flaring wide to a ragged hem of curling, tendril-like points
  const mantle = () => {
    const y0 = neck[1] + X(0.4), hem = ground - X(1);
    const pts = profile
      ? [[neck[0] + dir * X(1.6), y0], [neck[0] - dir * X(3.4), y0 + X(0.6)], [neck[0] - dir * X(7.5) + sway, hem - X(14)], [neck[0] - dir * X(11.2) + sway, hem - X(2)],
        [neck[0] - dir * X(13.4) + sway, hem + X(0.4)], [neck[0] - dir * X(9.6) + sway, hem - X(1.6)], [neck[0] - dir * X(7.4) + sway, hem + X(0.6)], [neck[0] - dir * X(4.8) + sway, hem - X(1.8)],
        [neck[0] - dir * X(2.6) + sway, hem + X(0.2)], [neck[0] - dir * X(0.6), hem - X(2.4)], [neck[0] + dir * X(0.6), y0 + X(14)], [neck[0] + dir * X(2.4), y0 + X(5)]]
      : [[neck[0], y0 - X(0.6)], [neck[0] + R(6), y0 + X(0.2)], [neck[0] + R(10) + sway, y0 + X(10)], [neck[0] + R(13.4) + sway, hem - X(2.4)], [neck[0] + R(14.4) + sway, hem + X(0.6)],
        [neck[0] + R(10.6) + sway, hem - X(1.4)], [neck[0] + R(8.4) + sway, hem + X(0.8)], [neck[0] + R(5.6) + sway, hem - X(1.8)], [neck[0] + R(2.6) + sway, hem + X(0.4)],
        [neck[0] - R(0.6) + sway, hem - X(1.6)], [neck[0] - R(3.6) + sway, hem + X(0.8)], [neck[0] - R(6.6) + sway, hem - X(1.4)], [neck[0] - R(9.4) + sway, hem + X(0.6)],
        [neck[0] - R(14.2) + sway, hem - X(0.2)], [neck[0] - R(13) + sway, hem - X(3)], [neck[0] - R(10) + sway, y0 + X(10)], [neck[0] - R(6), y0 + X(0.2)]];
    s.add({ type: 'path', name: 'mantle', underlay: true, d: smooth(pts), ...flat(pal.leather, 1) });
  };

  // ---- legs: thick armoured thighs, knee cops, tapered greaves and broad sabatons, set wide
  const legs = () => {
    for (const n of pose.far(['legL_up', 'legR_up'])) {
      const lo = n.replace('_up', '_lo'), a = pose.start(n), kn = pose.end(n), an = pose.end(lo);
      const spread = profile ? 0 : (Math.sign(a[0] - hip[0]) || 1) * X(2.4);
      const A = [a[0] + spread, a[1]], K = [kn[0] + spread * 1.25, kn[1]], N = [an[0] + spread, an[1] - X(0.6)];
      s.add({ type: 'group', name: 'leg', underlay: true, children: [
        { type: 'tube', name: 'thigh', pts: [A, K], w: X(4.8), w1: X(3.6), ...flat(plate, 1) },
        { type: 'tube', name: 'greave', pts: [K, N], w: X(3.6), w1: X(2.4), ...flat(plate, 1) },
        { type: 'ellipse', name: 'knee', cx: K[0] + dir * X(0.3) * side, cy: K[1], rx: X(2.1), ry: X(1.7), ...flat(plate, 0) },
        { type: 'path', name: 'sabaton', d: smooth([[N[0] - X(1.7), N[1] - X(0.6)], [N[0] + X(1.7), N[1] - X(0.6)], [N[0] + X(1.7) + dir * X(1.6) * (0.4 + side), an[1] + X(0.2)], [N[0] - X(1.9) + dir * X(0.4), an[1] + X(0.2)]]), ...flat(plate, 2) },
      ] });
    }
  };

  // ---- the sceptre: a long shaft with a butt knob, a collar under the head, and a ring holding the glowing orb
  const sceptre = () => {
    const { head, butt, dir: d } = rod, n = [-d[1], d[0]], g = rodArm.hand, rr = X(2.4);
    const oc = [head[0] + d[0] * rr, head[1] + d[1] * rr]; // the ring's centre, past the shaft's end
    s.add({ type: 'group', name: 'sceptre', underlay: true, children: [
      { type: 'capsule', name: 'shaft', a: butt, b: head, r: X(0.55), ...flat(pal.metal, 1) },
      { type: 'circle', name: 'butt', cx: butt[0], cy: butt[1], r: X(0.9), ...flat(pal.metal, 2) },
      { type: 'capsule', name: 'collar', a: [head[0] - n[0] * X(1.6), head[1] - n[1] * X(1.6)], b: [head[0] + n[0] * X(1.6), head[1] + n[1] * X(1.6)], r: X(0.6), ...flat(pal.metal, 1) },
      { type: 'circle', name: 'ring', cx: oc[0], cy: oc[1], r: rr, ...flat(pal.metal, 0) },
      { type: 'circle', name: 'orb', cx: oc[0], cy: oc[1], r: rr * 0.62, ...flat(pal.glow, 0) },
      { type: 'poly', name: 'finial', pts: [[oc[0] + d[0] * rr * 0.8 + n[0] * X(0.7), oc[1] + d[1] * rr * 0.8 + n[1] * X(0.7)], [oc[0] + d[0] * (rr + X(2.6)), oc[1] + d[1] * (rr + X(2.6))], [oc[0] + d[0] * rr * 0.8 - n[0] * X(0.7), oc[1] + d[1] * rr * 0.8 - n[1] * X(0.7)]], ...flat(pal.metal, 1) },
      { type: 'circle', name: 'fist', cx: g[0], cy: g[1], r: X(1.45), ...flat(plate, 0) },
    ] });
  };
  const limb = (name, a, arm, claws) => {
    const fd = norm([arm.hand[0] - arm.elbow[0], arm.hand[1] - arm.elbow[1]]), fn = [-fd[1], fd[0]];
    s.add({ type: 'group', name, underlay: true, children: [
      { type: 'tube', name: 'upper-arm', pts: [a, arm.elbow], w: X(3.4), w1: X(2.8), ...flat(plate, 1) },
      { type: 'tube', name: 'vambrace', pts: [arm.elbow, arm.hand], w: X(3), w1: X(2.3), ...flat(plate, 1) },
      { type: 'circle', name: 'couter', cx: arm.elbow[0], cy: arm.elbow[1], r: X(1.5), ...flat(plate, 0) },
      { type: 'circle', name: 'gauntlet', cx: arm.hand[0], cy: arm.hand[1], r: X(1.4), ...flat(plate, 0) },
      // three long, hooked claws fanned from the open hand
      ...(claws ? [-1, 0, 1].map(i => {
        const cd = norm([fd[0] + fn[0] * i * 0.45, fd[1] + fn[1] * i * 0.45]), b = [arm.hand[0] + cd[0] * X(1), arm.hand[1] + cd[1] * X(1)];
        return { type: 'tube', name: 'claw', pts: [b, [b[0] + cd[0] * X(2.4), b[1] + cd[1] * X(2.4)], [b[0] + cd[0] * X(3.6) + fn[0] * i * X(0.8), b[1] + cd[1] * X(3.6) + X(0.8)]], w: X(0.9), w1: X(0.3), ...flat(pal.hair, 1) };
      }) : []),
    ] });
  };
  const rodArmNode = () => { sceptre(); limb('arm-sceptre', shR, rodArm, false); };
  const offArmNode = () => limb('arm-off', shL, offArm, !k.two);

  // ---- the body: a barrel breastplate swelling at the ribs, tapered to the waist, then flared tassets
  const torso = () => {
    const c = neck[0] + fx * 0.5, wy = hip[1] - X(3), bul = X(1.8) * side;
    const q = (sg, v) => c + sg * R(v) + (sg === dir ? bul : 0);
    s.add({ type: 'path', name: 'breastplate', underlay: true, d: smooth([
      [c, neck[1] - X(0.6)], [q(1, 5.2), neck[1] + X(0.4)], [q(1, 7), neck[1] + X(4)], [q(1, 7.2), neck[1] + X(7.2)], [q(1, 4.4), wy - X(1.6)], [q(1, 3), wy + X(0.6)],
      [q(-1, 3), wy + X(0.6)], [q(-1, 4.4), wy - X(1.6)], [q(-1, 7.2), neck[1] + X(7.2)], [q(-1, 7), neck[1] + X(4)], [q(-1, 5.2), neck[1] + X(0.4)],
    ]), ...flat(plate, 1) });
    s.add({ type: 'path', name: 'tassets', underlay: true, d: smooth([
      [c - R(3.6), wy - X(0.4)], [c + R(3.6), wy - X(0.4)], [c + R(7) + sway * 0.5, wy + X(4.4)], [c + R(3.6), wy + X(3.4)], [c + R(1.2), wy + X(4.6)],
      [c - R(1.4), wy + X(3.5)], [c - R(3.8), wy + X(4.6)], [c - R(7.1) + sway * 0.5, wy + X(4.1)],
    ]), ...flat(plate, 2) });
    s.add({ type: 'capsule', name: 'belt', a: [q(-1, 3.6), wy], b: [q(1, 3.6), wy], r: X(0.6), ...flat(pal.metal, 1) });
  };
  // ---- the pauldrons: great rounded, layered plates with no spikes (the Regent's are smooth, unlike his knights')
  const pauldron = o => {
    const c = [neck[0] + (profile ? -dir * X(0.6) * o : o * X(7.6) * wf), neck[1] + X(0.2)], pr = profile ? X(5) : X(5.4) * (1 - 0.12 * side);
    s.add({ type: 'group', name: 'pauldron', underlay: true, children: [
      { type: 'path', name: 'pauldron', d: smooth([[c[0] - pr, c[1] + X(1.4)], [c[0] - pr * 0.75, c[1] - X(2.8)], [c[0], c[1] - X(3.6)], [c[0] + pr * 0.8, c[1] - X(2.6)], [c[0] + pr, c[1] + X(1.6)], [c[0] + o * pr * 0.6, c[1] + X(4.4)], [c[0] - o * pr * 0.2, c[1] + X(4)]]), ...flat(plate, 0) },
      { type: 'capsule', name: 'lame', a: [c[0] - pr * 0.85, c[1] + X(1.8)], b: [c[0] + pr * 0.9, c[1] + X(2.2)], r: X(0.6), ...flat(plate, 1) },
    ] });
  };
  // ---- the head: a smooth egg helm on a gorget with a hollow void for a face, the family's horns sweeping out and up,
  // and the tall uneven crown of seven tines standing clear above it; the same head and crown in every facing
  const horns = () => {
    for (const o of profile ? [-dir] : [-1, 1]) {
      const b = [hcx + o * helmW * 0.42, top + helmH * 0.36], ow = profile ? 0.7 : 1;
      s.add({ type: 'tube', name: 'horn', underlay: true, pts: [b, [b[0] + o * X(3.6) * ow, b[1] - X(0.6)], [b[0] + o * X(5.2) * ow, b[1] - X(3.6)], [b[0] + o * X(4.6) * ow, b[1] - X(7)]], w: X(1.9), w1: X(0.5), ...flat(pal.hair, 1) });
    }
  };
  const crown = () => {
    const by = top + X(1.2), bw = helmW * 0.62, tw = helmW * 0.95;
    // tine heights, outer to centre: uneven, the centre tallest, a broken one on the left
    const hts = [3, 4.6, 3.4, 6, 3.8, 4.2, 2.6], n = hts.length, pts = [[hcx - bw, by + X(1.2)]];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), x = hcx - tw + u * 2 * tw, xb = hcx - bw + u * 2 * bw;
      const tip = [x + (x - hcx) * 0.12, by - X(hts[i])];
      if (i > 0) pts.push([xb - (bw / (n - 1)) * 0.5, by - X(0.6)]);
      pts.push([tip[0] - X(0.35), tip[1] + X(0.4)], [tip[0], tip[1]], [tip[0] + X(0.35), tip[1] + X(0.4)]);
    }
    pts.push([hcx + bw, by + X(1.2)]);
    s.add({ type: 'poly', name: 'crown', underlay: true, pts, ...flat(pal.metal, 0) });
    s.add({ type: 'capsule', name: 'circlet', a: [hcx - bw, by + X(0.8)], b: [hcx + bw, by + X(0.8)], r: X(0.75), ...flat(pal.metal, 1) });
  };
  const helm = () => {
    const hw = helmW / 2, b = top + helmH;
    s.add({ type: 'ellipse', name: 'gorget', cx: neck[0], cy: neck[1] - X(0.2), rx: X(3.4) * wf, ry: X(1.8), ...flat(plate, 2) });
    horns();
    s.add({ type: 'path', name: 'helm', underlay: true, d: smooth([
      [hcx, top - X(0.4)], [hcx + hw * 0.9, top + X(0.3)], [hcx + hw, top + helmH * 0.45], [hcx + hw * 0.8, b - X(0.6)], [hcx + dir * X(0.6) * side, b + X(0.6)], [hcx - hw * 0.8, b - X(0.6)], [hcx - hw, top + helmH * 0.45], [hcx - hw * 0.9, top + X(0.3)],
    ]), ...flat(plate, 1) });
    if (showFace) {
      // the void: a hollow oval where the face would be, featureless; narrowed toward the facing in profile
      const vw = profile ? helmW * 0.26 : helmW * 0.52, vx = profile ? hcx + dir * helmW * 0.3 : hcx + fx;
      s.add({ type: 'ellipse', name: 'void', cx: vx, cy: top + helmH * 0.6, rx: vw / 2, ry: helmH * 0.26, ...flat(pal.cloth, 2) });
    }
    crown();
  };

  // draw order: the mantle behind in the front views, over the back from behind; the far arm and its load behind
  const [farArm] = pose.far(['armL_up', 'armR_up']), farIsRod = farArm === 'armR_up';
  const farP = profile ? null : (back ? outR : -dir);
  if (!back) mantle();
  if (farIsRod) rodArmNode(); else offArmNode();
  legs();
  torso();
  if (back) { helm(); mantle(); }
  if (!profile) { pauldron(-(farP ?? dir)); pauldron(farP ?? dir); } else pauldron(1);
  if (!back) helm();
  if (farIsRod) offArmNode(); else rodArmNode();
  return s.render();
}

// Named points per frame: head, hand (the sceptre hand), the orb at the sceptre's head
export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: [Math.round(L.hcx), Math.round(L.top + L.helmH * 0.5)], hand: L.rodArm.hand.map(Math.round), orb: L.rod.head.map(Math.round) };
  delete a.ground;
  return a;
};
