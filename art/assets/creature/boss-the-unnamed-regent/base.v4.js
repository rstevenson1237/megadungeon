// boss-the-unnamed-regent base.v4 (r4, decoration) — from base.v3, whose shape the owner approved (stage shape, 2026-11-18).
// The silhouette is kept pixel for pixel: every change sits inside the outer line (new shapes are clipped to the shroud,
// or drawn over parts already there). The one detailed pass in the budget decorates it:
//  - materials and light: the shroud, mantle and hood shade as round masses on the cloth ramp from the direction's
//    upper-left light (`normal`, not flat), arms and sleeves as tapered cylinders on leather and cloth, claws as bone
//    (hair ramp), the crown and sceptre as metal with highlights; rim light on the lit edges, ambient occlusion under
//    overlaps, a faint material noise on the cloth;
//  - the review's "squared shoulders" note, inside the line: the mantle is now its own lit mass with a ragged inked hem
//    across the chest, so the shoulders read as a rounded, sloping cowl over a darker lower shroud; fold shadows and lit
//    ridges run down to the hem's tatters (the trailing tatters read as torn cloth, not a flat edge);
//  - the face: the hood's void is rimmed by a lit cowl lip, with a deeper shadow under its brow and two faint embers for
//    eyes (glow.1) — one in profile; the back facing shows the hood's centre seam and a cloak seam instead;
//  - the signature sceptre: shaded metal shaft, collar and ring, the orb a lit sphere on the glow ramp (the one bright
//    accent at 1x) with a pale glow.0 core;
//  - decals: a faded regent's sigil (accent) on the mantle's chest in front facings, and dark wear marks on the hem.
// The body stays on the cloth ramp (the family-k-cap recolour ramp). No colour literals (R11).
export const meta = { brief: 'boss-the-unnamed-regent', pass: 'r4', notes: 'decoration on the approved v3 shape: round lit cloth masses, a separate mantle with an inked ragged hem, folds, rimmed void hood with faint ember eyes, metal crown and sceptre, glowing orb accent, sigil and wear decals', recolour: 'cloth' };

export const params = {
  cloth: { type: 'swap', options: ['cloth', 'leather', 'accent'], default: 'cloth' },
};

const TURN = { s: 'sw', e: 'e', n: 'ne', w: 'w' };
const HM = 9.1, PLAYER = 37;

// closed smooth outline through points; a point given as [x, y, 1] is a sharp corner (the curve passes through it)
const smooth = pts => {
  const p = [];
  for (const q of pts) { p.push([q[0], q[1]]); if (q[2]) p.push([q[0], q[1]]); }
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = p.length;
  let d = `M${m(p[n - 1], p[0]).join(' ')}`;
  for (let i = 0; i < n; i++) d += ` Q${p[i].join(' ')} ${m(p[i], p[(i + 1) % n]).join(' ')}`;
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
// sceptre's head direction from the hand ([toward, down]).
const ROD = {
  idle: [{ h: [0.1, 0.5], b: [0.06, -1] }, { h: [0.1, 0.53], b: [0.06, -1] }],
  walk: [{ h: [0.04, 0.5], b: [0.02, -1] }, { h: [0.1, 0.53], b: [0.08, -1] }, { h: [0.16, 0.5], b: [0.12, -1] }, { h: [0.1, 0.53], b: [0.08, -1] }],
  attack: [
    { h: [-0.34, -0.3], b: [-0.3, -0.95], two: true },               // wind-up: raised up and out over the shoulder
    { h: [0.08, -0.4], b: [0.4, -0.92], pb: [0.2, -0.98], two: true }, // the sweep over the crown
    { h: [0.45, 0.32], b: [0.6, 0.8], two: true },                    // the hit: the orb driven down in front (held)
    { h: [0.25, 0.48], b: [0.35, -0.94] },                            // recovery: lifted back upright
  ],
};

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, S = (HM * metre) / PLAYER, X = v => v * S, hr = ctx.dir.scale.proportions?.headRatio ?? 0.4;
  const ground = h - 1, facing = TURN[ctx.facing] ?? ctx.facing;
  const rig = ctx.lib.rigs.body('biped', ctx, { facing, ground, height: Math.round(HM * metre - X(4.4)), proportions: { hip: 0.02, spine: 0.34, neck: 0.04, head: hr * 0.55, leg_up: 0.19, leg_lo: 0.19, arm_up: 0.16, arm_lo: 0.15, legSep: 0.08 } });
  const { sx, front, side } = rig, P = rig.pose(ctx.state, ctx.t);
  const dir = sx < 0 ? -1 : 1, profile = side > 0.9, back = front < 0, wf = 1 - 0.3 * side;
  const f = (ctx.logical ?? ctx.frame ?? 0);
  // the hover: the whole body bobs; only the trailing tatter tips stay on the floor
  const bob = ctx.state === 'walk' ? Math.sin(ctx.t * Math.PI * 2) * X(0.35) : ctx.state === 'idle' ? (f % 2 ? X(0.3) : 0) : 0;
  const c = w / 2 + (profile ? -dir * X(1) : 0);
  const U = v => ground - X(v) + bob;           // height above the floor (in player pixels), bobbed
  const neck = [c, U(25)];
  const outR = Math.sign(P.start('armR_up')[0] - P.start('neck')[0]) || dir, outL = -outR;
  const shY = U(23.2);
  const sh = o => [c + (profile ? dir * X(0.6) * (o === outR ? 1 : -1) : o * X(6) * wf), shY];
  const shR = sh(outR), shL = sh(outL), l1 = X(7), l2 = X(8), arm = l1 + l2;
  const table = ROD[ctx.state] ?? ROD.idle, k = table[f % table.length];
  const toward = profile ? dir : -outR;
  const target = k.two ? [shR[0] + toward * k.h[0] * arm, shR[1] + k.h[1] * arm]
    : [shR[0] + (profile ? toward * (k.h[0] * arm + X(7)) : outR * X(9)), shR[1] + k.h[1] * arm * (profile ? 0.6 : 1)];
  const rodArm = reach(shR, target, l1, l2, (profile ? (k.two ? -dir : dir) : outR) * (k.h[1] < 0 ? -1 : 1));
  const kb = profile && k.pb ? k.pb : k.b, bd = norm([toward * kb[0] + (profile || k.two ? 0 : outR * 0.04), kb[1]]);
  const grip = rodArm.hand, rod = { up: X(ctx.state === 'attack' ? 7.5 : 10), down: X(4), dir: bd };
  rod.head = [grip[0] + bd[0] * rod.up, grip[1] + bd[1] * rod.up];
  rod.butt = [grip[0] - bd[0] * rod.down, grip[1] - bd[1] * rod.down];
  // the off hand: on the shaft for the two-handed swing, else reaching wide and low, claws open
  const reachSway = ctx.state === 'walk' ? Math.sin(ctx.t * Math.PI * 2 + 1) * X(0.6) : 0;
  const lunge = ctx.state === 'attack' ? [X(1.2), X(-1), X(-1.6), X(0)][f % 4] : 0; // the claw rears with the swing
  const offTarget = [shL[0] + (profile ? dir * (X(9.5) + lunge) : outL * (X(7.6) - lunge * 0.4)), shL[1] + X(profile ? 11 : 9.4) + reachSway + lunge];
  const offArm = reach(shL, offTarget, l1, l2, profile ? dir : -outL);
  return { w, h, X, rig, P, dir, front, side, profile, back, wf, ground, bob, c, U, neck, shR, shL, outR, outL, rodArm, offArm, rod, k };
}

export function render(ctx) {
  const { pal } = ctx.dir, Pm = ctx.params, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), body = pal[Pm.cloth];
  const { X, P: pose, dir, side, profile, back, wf, ground, c, U, shR, shL, rodArm, offArm, rod } = L;
  const R = v => X(v) * wf;
  const walking = ctx.state === 'walk', sway = walking ? Math.sin(ctx.t * Math.PI * 2) * X(0.7) : 0;
  const flat = (mat, band) => ({ mat, shade: 'flat', band });
  const round = (mat, r) => ({ mat, shade: 'normal', round: r });
  const cyl = (mat, axis) => ({ mat, shade: 'cyl', ...(axis ? { axis } : {}) });
  const G = v => ground - X(v);                 // un-bobbed height: the tatter tips that touch the floor
  const lean = dir * X(0.5) * side;             // three-quarter turn: the hood and crown lean toward the facing
  const decals = [];

  // ---- the shroud: the approved outline, now a lit round mass; inside it (clipped) the mantle, folds and hollow
  const shroud = () => {
    let pts;
    // x along the figure (profile: toward the facing), with the hem's sway; Mx/My give the inner detail's coordinates
    let x, xs;
    if (profile) {
      x = v => c + dir * X(v); xs = v => x(v) - dir * sway;
      pts = [[x(1.8), U(25.4)], [x(3.4), U(27.6), 1], [x(4.6), U(25)], [x(6.4), U(22.4)], [x(7.4), U(19)], [x(7.2), U(16.4), 1],
        [x(5.6), U(17.6)], [x(4.6), U(15.8), 1], [x(3.6), U(16.8)], [x(3.2), U(13)], [x(4.4), U(9)], [xs(7), U(4)],
        [xs(7.4), U(1.6), 1], [xs(5), U(3.4)], [xs(2.4), G(-0.6), 1], [xs(0), U(3.2)], [xs(-3), U(0.8), 1], [xs(-5.4), U(3)],
        [xs(-8.4), G(-0.6), 1], [xs(-9.6), U(3.2)], [xs(-12.6), U(1.4), 1], [xs(-11.4), U(5.6)], [x(-8.6), U(10)], [x(-7.4), U(13.6)],
        [x(-8.6), U(15.2), 1], [x(-9.4), U(16.6)], [x(-10.8), U(15), 1], [x(-10.6), U(18.6)], [x(-9.8), U(22)], [x(-7.6), U(25)],
        [x(-4.6), U(27.4)], [x(-3.2), U(28.8), 1], [x(-1.6), U(26.2)]];
    } else {
      const Rm = v => X(v) * (1 - 0.12 * side);
      x = v => c + Rm(v) + lean * 0.4; xs = v => x(v) + sway;
      pts = [[x(0), U(25.6)], [x(3.6), U(26.2)], [x(5.6), U(28.4), 1], [x(6.6), U(25.8)], [x(10.4), U(24.4)], [x(13.2), U(21.6)],
        [x(14.4), U(19)], [x(14.8), U(16.8), 1], [x(12.2), U(18.2)], [x(11.4), U(15.6), 1], [x(10.2), U(17.4)], [x(8.6), U(16.4), 1],
        [x(7.6), U(16.8)], [x(6.4), U(13.4)], [x(8.4), U(9.4)], [xs(12.6), U(5.2)], [xs(14), U(1.4), 1], [xs(11.4), U(3.6)],
        [xs(9.4), U(0.8), 1], [xs(7.2), U(3.8)], [xs(5), G(-0.6), 1], [xs(2.6), U(3.4)], [xs(0.4), U(1.6), 1], [xs(-1.8), U(3.8)],
        [xs(-4), G(-0.6), 1], [xs(-6.2), U(3.4)], [xs(-8.6), U(1), 1], [xs(-10.4), U(3.6)], [xs(-14), U(1.8), 1], [xs(-12.8), U(5.6)],
        [x(-8.4), U(9.4)], [x(-6.4), U(13.4)], [x(-7.6), U(16.6)], [x(-9), U(15.8), 1], [x(-10.4), U(17.6)], [x(-12), U(14.8), 1],
        [x(-12.8), U(17.8)], [x(-15), U(17.2), 1], [x(-14.4), U(19.4)], [x(-13.4), U(21.8)], [x(-10.6), U(24.6)], [x(-6.6), U(26)],
        [x(-5.8), U(28.6), 1], [x(-3.6), U(26.2)]];
    }
    const d = smooth(pts), clip = { type: 'path', d };
    s.add({ type: 'path', name: 'shroud', underlay: true, d, ...round(body, X(5)) });

    // the mantle: everything above a ragged hem line across the chest, its own rounded mass, inked along its hem
    const hem = profile
      ? [[x(12), U(15)], [x(9), U(16.2)], [x(7.2), U(16.4), 1], [x(5.8), U(17.4)], [x(4.6), U(15.8), 1], [x(2.2), U(16.8)], [x(-0.6), U(15.4), 1],
        [x(-3.4), U(16.6)], [x(-6), U(15.2), 1], [x(-8.6), U(15.2), 1], [x(-9.6), U(16.4)], [x(-10.8), U(15), 1], [x(-13), U(15)]]
      : [[x(-16), U(16.4)], [x(-15), U(17.2), 1], [x(-12.8), U(17.4)], [x(-12), U(14.8), 1], [x(-10.4), U(17.2)], [x(-9), U(15.8), 1],
        [x(-7.2), U(16.8)], [x(-4.6), U(14.6), 1], [x(-2.2), U(16.4)], [x(0.4), U(14.2), 1], [x(2.8), U(16.2)], [x(5.2), U(14.8), 1],
        [x(7.4), U(16.6)], [x(8.6), U(16.4), 1], [x(10.2), U(17.2)], [x(11.4), U(15.6), 1], [x(12.4), U(17.8)], [x(14.8), U(16.8), 1], [x(16), U(16.4)]];
    const mantle = [...(profile ? [[x(12), U(32)], [x(-13), U(32)]].reverse() : [[x(-16), U(32)]]), ...hem, ...(profile ? [] : [[x(16), U(32)]])];
    const folds = [];
    if (profile) {
      // folds trail back from the waist to the hem's tatters; the mantle's hump folds down from the collar
      folds.push([[x(1.4), U(12.6)], [xs(0.6), U(7)], [xs(0), U(3.6)]], [[x(-2.6), U(12)], [xs(-4.4), U(7)], [xs(-5.6), U(3.4)]],
        [[x(-5.4), U(11.6)], [xs(-8), U(7)], [xs(-9.6), U(3.6)]], [[x(-3.4), U(26)], [x(-6.6), U(21)], [x(-7.6), U(17)]]);
    } else {
      folds.push([[x(-2.6), U(12.6)], [xs(-3), U(8)], [xs(-4), U(3.6)]], [[x(2.6), U(12.6)], [xs(3), U(8)], [xs(2.4), U(3.8)]],
        [[x(-5.4), U(12)], [xs(-7.4), U(7.4)], [xs(-8.6), U(3.4)]], [[x(5.6), U(12)], [xs(7.6), U(7.4)], [xs(9), U(3.8)]],
        [[x(-6.6), U(24.4)], [x(-9.2), U(20.6)], [x(-10.2), U(17.4)]], [[x(6.8), U(24.2)], [x(9.4), U(20.4)], [x(10.6), U(17.6)]]);
      if (back) folds.push([[x(0), U(25)], [x(0), U(20)], [x(0.2), U(15.8)]], [[x(0), U(13.2)], [xs(0.2), U(8)], [xs(0.4), U(2.4)]]);
    }
    const kids = [
      { type: 'path', name: 'mantle', underlay: true, d: smooth(mantle), ...round(body, X(2.6)) },
      // fold shadows, each with a lit ridge on the light's side (upper left)
      ...folds.map(p => ({ type: 'tube', name: 'fold-lit', pts: p.map(q => [q[0] - X(0.6), q[1]]), w: X(0.4), w1: X(0.2), ...flat(body, 0) })),
      ...folds.map(p => ({ type: 'tube', name: 'fold', pts: p, w: X(0.75), w1: X(0.3), ...flat(body, 2) })),
    ];
    let hollow = null;
    if (!back && !profile) {
      // the hollow inside: the shroud hangs open below the waist on an empty dark lining
      const hx = v => c + R(v) + lean * 0.4 + sway * 0.6;
      hollow = ({ type: 'path', name: 'hollow', d: smooth([[hx(0), U(14)], [hx(1.6), U(9)], [hx(2.4), U(4.2)], [hx(1.2), U(2.6), 1], [hx(0), U(3.8)], [hx(-1.4), U(2.4), 1], [hx(-2.2), U(4.4)], [hx(-1.4), U(9)]]), ...flat(body, 2) });
      // a faded sigil of the regent's house on the mantle's chest: an inverted crown over a ring
      const sx = c + lean * 0.4, sy = U(20);
      decals.push({ name: 'sigil', part: 'mantle', mat: 'accent', band: 2, shape: [
        { type: 'poly', pts: [[sx - X(1.6), sy - X(1.4)], [sx - X(0.8), sy + X(0.2)], [sx, sy - X(0.8)], [sx + X(0.8), sy + X(0.2)], [sx + X(1.6), sy - X(1.4)], [sx + X(1.1), sy + X(1.1)], [sx - X(1.1), sy + X(1.1)]] },
      ] });
    }
    s.add({ type: 'group', name: 'shroud-inner', clip, children: kids });
    // drawn unclipped, as in the approved shape: its tips are part of the hem's outline
    if (hollow) s.add(hollow);
  };

  // ---- the hood: a tall, peaked cowl; in front a lit lip rims the void, with faint ember eyes in it
  const hood = () => {
    const hx = c + lean, x = v => hx + (profile ? dir * X(v) : R(v));
    const pts = profile
      ? [[x(3.2), U(24)], [x(3.6), U(27.4)], [x(1.8), U(29)], [x(-0.4), U(29.8), 1], [x(-2.6), U(28.4)], [x(-3.8), U(26.4)], [x(-3.2), U(23.6)]]
      : [[x(-4.8), U(23.6)], [x(-4.4), U(27.4)], [x(-2.6), U(28.8)], [x(0.3 * dir), U(29.8), 1], [x(2.6), U(28.8)], [x(4.4), U(27.4)], [x(4.8), U(23.6)], [x(0), U(24.6)]];
    const d = smooth(pts);
    s.add({ type: 'path', name: 'hood', underlay: true, d, ...round(body, X(2)) });
    if (!back) {
      const vx = profile ? hx + dir * X(1.9) : hx + lean * 0.6, rx = profile ? X(1.3) : R(2.7) * (1 - 0.15 * side), vy = U(26.3);
      s.add({ type: 'ellipse', name: 'hood-rim', cx: vx, cy: U(26.4), rx: rx + X(0.6), ry: X(2.7), ...round(body, X(0.6)) });
      s.add({ type: 'group', name: 'face', children: [
        { type: 'ellipse', name: 'void', cx: vx + (profile ? dir * X(0.2) : 0), cy: vy, rx, ry: X(2.2), ...flat(pal.hair, 2) },
        ...(profile ? [[dir * 0.5]] : [[-1], [1]]).map(([o]) => (
          { type: 'rect', name: 'eye', x: Math.round(vx + X(o) * (profile ? 1 : 1 - 0.3 * side) + (profile ? 0 : lean * 0.3)) - 1, y: Math.round(vy - X(0.2)), w: 2, h: 1, ...flat(pal.glow, 1) })),
      ] });
    } else {
      // the back of the cowl: a centre seam down to the collar, clipped to the hood
      s.add({ type: 'group', name: 'hood-back', clip: { type: 'path', d }, children: [
        { type: 'tube', name: 'hood-seam', pts: [[x(0.3), U(29.6)], [x(0.1), U(27)], [x(0), U(24)]], w: X(0.6), w1: X(0.4), ...flat(body, 2) },
      ] });
    }
  };

  // ---- the crown: tall, uneven, tilted, floating clear above the hood; lit metal with dark gems in the circlet
  const crown = () => {
    const cx = c + lean * 1.4 + (profile ? -dir * X(0.4) : 0), by = U(32.4), sq = profile ? 0.62 : 1 - 0.2 * side;
    const bw = X(3.8) * sq, tw = X(5.2) * sq, tilt = 0.09;
    const hts = [2.6, 4.4, 2, 5.2, 2.8, 4, 1.6], n = hts.length, ty = x => (x - cx) * tilt; // tilted down to the right
    const pts = [[cx - bw, by + X(1.2) + ty(cx - bw)]];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), x = cx - tw + u * 2 * tw, xb = cx - bw + u * 2 * bw, tip = [x, by - X(hts[i]) + ty(x)];
      if (i > 0) pts.push([xb - (bw / (n - 1)), by - X(0.4) + ty(xb)]);
      pts.push([tip[0] - X(0.4), tip[1] + X(0.5)], [tip[0], tip[1]], [tip[0] + X(0.4), tip[1] + X(0.5)]);
    }
    pts.push([cx + bw, by + X(1.2) + ty(cx + bw)]);
    s.add({ type: 'poly', name: 'crown', underlay: true, pts, mat: pal.metal, shade: 'bevel' });
    s.add({ type: 'capsule', name: 'circlet', a: [cx - bw, by + X(0.7) + ty(cx - bw)], b: [cx + bw, by + X(0.7) + ty(cx + bw)], r: X(0.6), ...cyl(pal.metal, 'x') });
    decals.push({ name: 'gems', part: 'circlet', mat: 'accent', band: 2, shape: [-0.55, 0, 0.55].map(u => ({ type: 'rect', x: Math.round(cx + u * bw) - 1, y: Math.round(by + X(0.7) + ty(cx + u * bw)) - 1, w: 2, h: 2 })) });
  };

  // ---- the arms: a ragged sleeve, a long bony forearm, and (on the open hand) four long hooked bone claws
  const limb = (name, a, arm, claws) => {
    const fd = norm([arm.hand[0] - arm.elbow[0], arm.hand[1] - arm.elbow[1]]), fn = [-fd[1], fd[0]];
    const ud = norm([arm.elbow[0] - a[0], arm.elbow[1] - a[1]]), cuff = [a[0] + ud[0] * X(5.4), a[1] + ud[1] * X(5.4)];
    s.add({ type: 'group', name, underlay: true, children: [
      { type: 'tube', name: 'forearm', pts: [arm.elbow, arm.hand], w: X(1.6), w1: X(1.1), ...cyl(pal.leather) },
      { type: 'tube', name: 'upper-arm', pts: [a, arm.elbow], w: X(1.8), w1: X(1.5), ...cyl(pal.leather) },
      { type: 'circle', name: 'elbow', cx: arm.elbow[0], cy: arm.elbow[1], r: X(1), mat: pal.leather, shade: 'sphere' },
      // the sleeve: hangs from the shoulder over the upper arm, its torn cuff dropping in points
      { type: 'path', name: 'sleeve', d: smooth([[a[0] - X(1.8), a[1] - X(0.8)], [a[0] + X(1.8), a[1] - X(0.8)], [cuff[0] + X(1.6), cuff[1]], [cuff[0] + X(1), cuff[1] + X(2), 1], [cuff[0], cuff[1] + X(0.8)], [cuff[0] - X(1.2), cuff[1] + X(2.6), 1], [cuff[0] - X(1.7), cuff[1]]]), ...round(body, X(1.2)) },
      { type: 'circle', name: 'hand', cx: arm.hand[0], cy: arm.hand[1], r: X(1.1), mat: pal.leather, shade: 'sphere' },
      ...(claws ? [-1.5, -0.5, 0.5, 1.5].map(i => {
        const cd = norm([fd[0] + fn[0] * i * 0.42, fd[1] + fn[1] * i * 0.42]), b = [arm.hand[0] + cd[0] * X(0.8), arm.hand[1] + cd[1] * X(0.8)];
        const hook = [b[0] + cd[0] * X(3.4) + fn[0] * i * X(0.5), b[1] + cd[1] * X(3.4) + X(1)];
        return { type: 'tube', name: 'claw', pts: [b, [b[0] + cd[0] * X(2.2), b[1] + cd[1] * X(2.2)], hook], w: X(0.8), w1: X(0.25), ...flat(pal.hair, 0) };
      }) : []),
    ] });
  };
  // ---- the sceptre: a metal shaft, a collar, a ring holding the glowing orb (the one bright accent), a spike finial
  const sceptre = () => {
    const { head, butt, dir: d } = rod, n = [-d[1], d[0]], rr = X(2.2);
    const oc = [head[0] + d[0] * rr, head[1] + d[1] * rr];
    s.add({ type: 'group', name: 'sceptre', underlay: true, children: [
      { type: 'capsule', name: 'shaft', a: butt, b: head, r: X(0.5), ...cyl(pal.metal) },
      { type: 'capsule', name: 'collar', a: [head[0] - n[0] * X(1.5), head[1] - n[1] * X(1.5)], b: [head[0] + n[0] * X(1.5), head[1] + n[1] * X(1.5)], r: X(0.55), mat: pal.metal, shade: 'bevel' },
      { type: 'circle', name: 'ring', cx: oc[0], cy: oc[1], r: rr, mat: pal.metal, shade: 'sphere' },
      { type: 'circle', name: 'orb', cx: oc[0], cy: oc[1], r: rr * 0.66, ...flat(pal.glow, 1) },
      { type: 'circle', name: 'orb-core', cx: oc[0] - X(0.35), cy: oc[1] - X(0.35), r: rr * 0.38, ...flat(pal.glow, 0) },
      { type: 'poly', name: 'finial', pts: [[oc[0] + d[0] * rr * 0.8 + n[0] * X(0.7), oc[1] + d[1] * rr * 0.8 + n[1] * X(0.7)], [oc[0] + d[0] * (rr + X(2.2)), oc[1] + d[1] * (rr + X(2.2))], [oc[0] + d[0] * rr * 0.8 - n[0] * X(0.7), oc[1] + d[1] * rr * 0.8 - n[1] * X(0.7)]], mat: pal.metal, shade: 'bevel' },
    ] });
  };
  const rodArmNode = () => { sceptre(); limb('arm-sceptre', shR, rodArm, false); };
  const offArmNode = () => limb('arm-off', shL, offArm, true);

  // draw order: the far arm behind the shroud, the near arm over it; the crown always on top
  const [farArm] = pose.far(['armL_up', 'armR_up']), farIsRod = farArm === 'armR_up';
  if (farIsRod) rodArmNode(); else offArmNode();
  shroud();
  hood();
  crown();
  if (farIsRod) offArmNode(); else rodArmNode();

  let p = ctx.lib.proc(s)
    .add('ao', { part: ['mantle', 'hood'] })
    .add('materialNoise', { part: ['shroud', 'mantle'], amount: 0.05, scale: 3, seed: ctx.variant ?? 0 });
  for (const d of decals) p = p.add('decal', d);
  return p.render();
}

// Named points per frame: head (the void), hand (the sceptre hand), the orb at the sceptre's head
export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: [Math.round(L.c), Math.round(L.U(27))], hand: L.rodArm.hand.map(Math.round), orb: L.rod.head.map(Math.round) };
  delete a.ground;
  return a;
};
