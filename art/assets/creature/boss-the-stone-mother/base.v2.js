// boss-the-stone-mother base.v2 (r2) — from base.v1, ONE change (the owner's shape note: "reads as a hooded ghost, not a
// golem"): the figure is rebuilt as a heavy stone construct, still a SHAPE DRAFT (silhouette and form only, flat
// materials, no procedural layers, no finish, no decals). The veil and the flared skirt are gone. Now: a broad shoulder
// yoke with a boulder at each shoulder, tapering through a ribcage to a narrow waist and a rounded pelvis block; a stone
// head with a heavy brow slab and a raised crest stone (her headgear), set on a thick neck, the same head in every
// facing with the family's glowing slits; thick tapered arms with an elbow stone and great fists; tapered legs with a
// knee stone and block feet. Kept as boss marks: the boulder child cradled against her belly in the left arm, and the
// menhir club in the right hand. The attack is now a real club arc: the menhir is heaved up behind the head, swung over
// the top, and slammed down in front onto the ground, where the hit is held for the last two frames with the body bent
// into it. Drawn to the brief's 5.2 m (about 83 px), feet on the pivot row.
export const meta = { brief: 'boss-the-stone-mother', pass: 'r2', notes: 'shape draft: stone construct, shoulder yoke, head on a neck with brow and crest, elbowed arms, kneed legs, cradled child, menhir club arc with held hit', recolour: 'cloth' };

export const params = {};

// fixed per-asset proportions of the rig (bone lengths never change per frame)
const PROPS = { hip: 0.03, neck: 0.05, head: 0.12, leg_up: 0.17, leg_lo: 0.16, arm_up: 0.2, arm_lo: 0.19, shoulder: 0.9, legSep: 0.1, armSep: 0.3 };

// the club arc, one pose per attack frame: heave up behind the head, over the top, slam down in front, hold the hit
const ARC = [
  { up: 10, lo: 115, spine: 8 },
  { up: 320, lo: 20, spine: 0 },
  { up: 225, lo: 10, spine: -14 },
  { up: 222, lo: 12, spine: -12 },
];

// the left arm always cradles the child; the right elbow keeps a bend outside the attack
const overrides = (state, f) => {
  const a = { armL_up: 196, armL_lo: 100 };
  if (state === 'attack') { const k = ARC[Math.min(ARC.length - 1, f)]; a.armR_up = k.up; a.armR_lo = k.lo; a.spine = k.spine; }
  else a.armR_lo = 25;
  return a;
};

function layout(ctx) {
  const [w, h] = ctx.size, ground = h - 1, H = 80;
  const rig = ctx.lib.rigs.body('biped', ctx, { ground, height: H, proportions: PROPS });
  const { sx, front, side } = rig, base = rig.pose(ctx.state, ctx.t), f = ctx.logical ?? ctx.frame ?? 0;
  const P = rig.pose(ctx.state, ctx.t, { angles: { ...base.angles, ...overrides(ctx.state, f) } });
  const U = v => v * H; // sizes as fractions of the rig height
  const headH = rig.lengths.head, top = P.end('head')[1], hcx = P.at('head', 0.5)[0], neck = P.start('neck'), hip = P.start('spine');
  const profile = side > 0.9, showFace = front > -0.3, fx = sx * U(0.025) * side;
  const ey = Math.round(top + headH * 0.5);
  const eyes = !showFace ? [] : (profile ? [hcx + fx + sx * U(0.02)] : [hcx + fx - U(0.028), hcx + fx + U(0.028)]).map(v => Math.round(v - 1));
  const hand = P.end('armR_lo'), elbow = P.start('armR_lo');
  return { w, h, H, U, rig, P, f, sx, front, side, ground, headH, top, hcx, neck, hip, profile, showFace, fx, ey, eyes, hand, elbow };
}

export function render(ctx) {
  const { pal } = ctx.dir, L = layout(ctx), { U, P, f, sx, front, side, ground, headH, top, hcx, neck, hip, fx, ey, eyes, hand, elbow } = L;
  const s = ctx.lib.t2.scene(...ctx.size, { groundShadow: [L.w / 2, ground, U(0.3)] });
  const body = pal.cloth, stone = pal.stone;
  const back = [], front_ = [], add = (list, n) => list.push(n);
  const lay = (bone, n) => add(P.depth(bone) < -1 ? back : front_, n);
  const wf = 1 - 0.25 * side;

  // legs: tapered stone thighs and shins, a knee stone between them, a heavy block foot
  for (const n of P.far(['legL_lo', 'legR_lo'])) {
    const up = n.replace('_lo', '_up'), knee = P.start(n), ft = P.end(n);
    s.add({ type: 'group', name: 'leg', underlay: true, children: [
      { type: 'capsule', name: 'thigh', a: P.start(up), b: knee, r: U(0.075), r1: U(0.05), mat: body, shade: 'cyl' },
      { type: 'capsule', name: 'shin', a: knee, b: [ft[0], ft[1] - U(0.03)], r: U(0.05), r1: U(0.035), mat: body, shade: 'cyl' },
      { type: 'circle', name: 'knee', cx: knee[0] + sx * U(0.012) * side, cy: knee[1], r: U(0.055), mat: body, shade: 'sphere' },
      { type: 'poly', name: 'foot', mat: body, shade: 'normal', round: 1, pts: [
        [ft[0] - U(0.06) + Math.min(0, sx) * U(0.04) * side, ground], [ft[0] + U(0.06) + Math.max(0, sx) * U(0.04) * side, ground],
        [ft[0] + U(0.045) + Math.max(0, sx) * U(0.02) * side, ft[1] - U(0.045)], [ft[0] - U(0.045) + Math.min(0, sx) * U(0.02) * side, ft[1] - U(0.045)],
      ] },
    ] });
  }

  // the right arm and the menhir it grips: the stone continues the forearm past the fist
  const hit = ctx.state === 'attack' && f >= 2, aim = [hip[0] + sx * U(0.55) * side - sx * U(0.06) * (1 - side), ground - U(0.02)];
  const dx = hit ? aim[0] - hand[0] : hand[0] - elbow[0], dy = hit ? aim[1] - hand[1] : hand[1] - elbow[1], l = Math.hypot(dx, dy) || 1, d = [dx / l, dy / l], nn = [-d[1], d[0]];
  const len = hit ? Math.min(U(0.42), Math.hypot(aim[0] - hand[0], aim[1] - hand[1])) : U(0.42), at = (k, m) => [hand[0] + d[0] * k + nn[0] * m, hand[1] + d[1] * k + nn[1] * m];
  const menhir = { type: 'group', name: 'menhir', underlay: true, children: [{ type: 'poly', name: 'menhir', mat: stone, shade: 'normal', round: 2, pts: [
    at(-U(0.04), -U(0.04)), at(len * 0.3, -U(0.07)), at(len * 0.7, -U(0.095)), at(len * 0.94, -U(0.06)), at(len, U(0.02)),
    at(len * 0.88, U(0.085)), at(len * 0.6, U(0.09)), at(len * 0.28, U(0.06)), at(-U(0.04), U(0.04)),
  ] }] };
  const arm = (side_, fistR) => {
    const sh = P.start(`arm${side_}_up`), el = P.start(`arm${side_}_lo`), hd = P.end(`arm${side_}_lo`);
    return { type: 'group', name: `arm-${side_.toLowerCase()}`, underlay: true, children: [
      { type: 'capsule', name: 'upper-arm', a: sh, b: el, r: U(0.085), r1: U(0.06), mat: body, shade: 'cyl' },
      { type: 'capsule', name: 'forearm', a: el, b: hd, r: U(0.07), r1: U(0.045), mat: body, shade: 'cyl' },
      { type: 'circle', name: 'elbow', cx: el[0], cy: el[1], r: U(0.06), mat: body, shade: 'sphere' },
      { type: 'circle', name: 'fist', cx: hd[0], cy: hd[1], r: U(fistR), mat: body, shade: 'sphere' },
    ] };
  };
  // the left arm cradles the child against the belly
  const hl = P.end('armL_lo'), child = [hl[0] * 0.45 + hip[0] * 0.55 + sx * U(0.06) * side, hl[1] - U(0.06)];
  const kid = { type: 'group', name: 'child', underlay: true, children: [
    { type: 'ellipse', name: 'child', cx: child[0], cy: child[1], rx: U(0.12), ry: U(0.105), mat: stone, shade: 'sphere' },
  ] };
  // a far arm hides behind the body; the child sits under the forearm that holds it
  if (P.depth('armL_lo') < -1) { add(back, kid); add(back, arm('L', 0.065)); }
  else { add(front_, kid); add(front_, arm('L', 0.065)); }
  const menhirBehind = P.depth('armR_lo') < -1 || (ctx.state === 'attack' && f === 0 && front > 0.2);
  add(menhirBehind ? back : front_, menhir); lay('armR_up', arm('R', 0.08));
  for (const n of back) s.add(n);

  // the body: a broad shoulder yoke, a ribcage tapering to a narrow waist, then a rounded pelvis block; leans with the spine
  const lean = neck[0] - hip[0], chest = sx * U(0.07) * side, humpX = -sx * U(0.05) * side;
  const roots = ['armL_up', 'armR_up'].map(b => P.start(b)), reach = Math.max(...roots.map(r => Math.abs(r[0] - neck[0])));
  const sh = neck[1] + U(0.02), wy = hip[1] - U(0.1), sw = Math.max(U(0.21), reach * 0.95 + U(0.03) * wf), ww = U(0.13) * wf, pw = U(0.17) * wf;
  const torso = [
    [neck[0] - sw * 0.55 + Math.min(0, humpX), sh - U(0.05)], [neck[0] - sw + Math.min(0, humpX), sh + U(0.02)],
    [neck[0] - sw * 0.92 + Math.min(0, humpX), sh + U(0.1)], [neck[0] - sw * 0.62 + Math.min(0, chest), sh + U(0.17)],
    [hip[0] + lean * 0.25 - ww, wy], [hip[0] - ww * 0.9, wy + U(0.04)],
    [hip[0] + lean * 0.25 + ww * 0.9, wy + U(0.04)], [hip[0] + lean * 0.25 + ww, wy],
    [neck[0] + sw * 0.62 + Math.max(0, chest), sh + U(0.17)], [neck[0] + sw * 0.92 + Math.max(0, humpX), sh + U(0.1)],
    [neck[0] + sw + Math.max(0, humpX), sh + U(0.02)], [neck[0] + sw * 0.55 + Math.max(0, humpX), sh - U(0.05)],
    [neck[0], sh - U(0.065)],
  ];
  const pelvis = [
    [hip[0] - pw, hip[1] - U(0.06)], [hip[0] + pw, hip[1] - U(0.06)], [hip[0] + pw * 0.95, hip[1] + U(0.03)],
    [hip[0] + pw * 0.4, hip[1] + U(0.07)], [hip[0] - pw * 0.4, hip[1] + U(0.07)], [hip[0] - pw * 0.95, hip[1] + U(0.03)],
  ];
  s.add({ type: 'group', name: 'body', underlay: true, children: [
    { type: 'path', name: 'pelvis', d: smooth(pelvis), mat: body, shade: 'normal', round: U(0.03) },
    { type: 'path', name: 'torso', d: smooth(torso), mat: body, shade: 'normal', round: U(0.04) },
    // the shoulder boulders crown the yoke on both sides
    ...roots.map((r, i) => ({ type: 'circle', name: i ? 'shoulder-r' : 'shoulder-l', cx: r[0], cy: sh + U(0.01), r: U(0.085) * (1 - 0.15 * side), mat: body, shade: 'sphere' })),
  ] });

  // the head on a thick neck: a squared stone head with a heavy brow slab and a raised crest stone, the same in every facing
  const nk0 = P.start('neck'), nk1 = P.end('neck'), hw = U(0.075) * (1 - 0.15 * side), jaw = sx * U(0.02) * side;
  s.add({ type: 'group', name: 'neck', underlay: true, children: [
    { type: 'capsule', name: 'neck', a: [nk0[0], nk0[1] + U(0.02)], b: nk1, r: U(0.055), r1: U(0.045), mat: body, shade: 'cyl' },
  ] });
  const hb = top + headH;
  const head = [
    [hcx - hw, top + headH * 0.15], [hcx + hw, top + headH * 0.15], [hcx + hw * 0.95 + Math.max(0, jaw), top + headH * 0.75],
    [hcx + hw * 0.6 + jaw, hb + U(0.01)], [hcx - hw * 0.6 + jaw, hb + U(0.01)], [hcx - hw * 0.95 + Math.min(0, jaw), top + headH * 0.75],
  ];
  const bw = hw * 1.25, by = top + headH * 0.3;
  const brow = [[hcx - bw + fx * 0.5, by - U(0.03)], [hcx + bw + fx * 0.5, by - U(0.03)], [hcx + bw * 0.95 + fx * 0.5, by + U(0.025)], [hcx - bw * 0.95 + fx * 0.5, by + U(0.025)]];
  const cw = U(0.03), crest = [[hcx - cw * 1.4 - fx * 0.3, by - U(0.02)], [hcx - cw * 0.6 - fx * 0.3, top - U(0.06)], [hcx + cw * 0.6 - fx * 0.3, top - U(0.07)], [hcx + cw * 1.4 - fx * 0.3, by - U(0.02)]];
  s.add({ type: 'group', name: 'head', underlay: true, children: [
    { type: 'poly', name: 'crest', pts: crest, mat: body, shade: 'normal', round: 1 },
    { type: 'path', name: 'head', d: smooth(head), mat: body, shade: 'normal', round: U(0.02) },
    { type: 'poly', name: 'brow', pts: brow, mat: body, shade: 'normal', round: 1 },
  ] });
  for (const ex of eyes) s.add({ type: 'rect', name: 'slit', x: ex, y: ey, w: L.profile ? 1 : 2, h: 1, color: 'accent.0' });

  for (const n of front_) s.add(n);
  return ctx.lib.proc(s).render();
}

const smooth = pts => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let d = `M${m(pts[n - 1], pts[0]).join(' ')}`;
  for (let i = 0; i < n; i++) d += ` Q${pts[i].join(' ')} ${m(pts[i], pts[(i + 1) % n]).join(' ')}`;
  return d + ' Z';
};

// head (the face), hand (the menhir's grip) and ground, from the same pose as the drawing
export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: [Math.round(L.hcx), Math.round(L.top + L.headH * 0.5)], hand: L.hand.map(Math.round) };
  delete a.ground;
  L.eyes.forEach((x, i) => { a[i ? 'eye2' : 'eye'] = [x, L.ey]; });
  return a;
};
