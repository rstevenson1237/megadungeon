// boss-the-stone-mother base.v3 (r3) — from base.v2 (the owner APPROVED its shape), ONE change: the decoration pass.
// The silhouette is untouched (no shape moved, added outside the line or removed). Inside the line: the body stays on the
// cloth ramp (the family-c-cap body ramp, recoloured to the row colour in game) and the menhir and the child on stone;
// procedural layers light the masses from the direction's top-left light (rim light on the lit edges of the rounded
// head, shoulder boulders, elbows, knees and fists, overlap AO where limbs cross the body, a 1 px cast shadow) and give
// the stone a quiet grain (material noise). Decals: a leather sling strap across the torso (front and back), a curved
// course seam round the ribcage and one round the pelvis (they bend with the mass, so it reads round, not a slab), a
// crack on one shoulder boulder; the face (front): a lit nose ridge under the brow, a dark mouth line under the glowing
// slits; the back: a carved stone braid down the back of the head and a spine groove; the family's red rune on the chest
// (front only, above the sling clear of the child); torso and pelvis shaded with a wider rounding so they light as
// round masses; the menhir gets a leather grip wrap above the fist, a glowing carved groove along its length and a
// crack; the child gets two tiny glowing eyes when it faces us.
export const meta = { brief: 'boss-the-stone-mother', pass: 'r3', notes: 'decoration on the approved v2 shape: top-left light, rim, AO, grain; strap, seams, face, braid, rune, menhir wrap and groove', recolour: 'cloth' };

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
    { type: 'path', name: 'pelvis', d: smooth(pelvis), mat: body, shade: 'normal', round: U(0.07) },
    { type: 'path', name: 'torso', d: smooth(torso), mat: body, shade: 'normal', round: U(0.13) },
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

  // ---- decoration (inside the line only) ----
  const backView = front < -0.3, band = (pts, t) => { // a thin band along a polyline, t px thick
    const up = pts.map(p => [p[0], p[1] - t / 2]), dn = pts.map(p => [p[0], p[1] + t / 2]).reverse();
    return { type: 'poly', pts: [...up, ...dn] };
  };
  const arcPts = (x0, x1, y, sag, n = 8) => Array.from({ length: n + 1 }, (_, i) => [x0 + (x1 - x0) * i / n, y + sag * Math.sin(Math.PI * i / n)]);
  const strip = (a, b, t) => { // a straight band from a to b, t px wide
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, q = [-dy / l * t / 2, dx / l * t / 2];
    return { type: 'poly', pts: [[a[0] + q[0], a[1] + q[1]], [b[0] + q[0], b[1] + q[1]], [b[0] - q[0], b[1] - q[1]], [a[0] - q[0], a[1] - q[1]]] };
  };
  const p = ctx.lib.proc(s)
    .add('materialNoise', { part: ['menhir', 'child'], amount: 0.2, scale: 2 })
    .add('materialNoise', { part: ['torso', 'pelvis', 'thigh', 'upper-arm'], amount: 0.1, scale: 3, seed: 3 })
    .add('ao', { part: ['torso', 'pelvis', 'thigh', 'shin', 'upper-arm', 'forearm', 'neck', 'child', 'menhir'] })
    .add('castShadow', { part: ['head', 'brow', 'shoulder-l', 'shoulder-r', 'fist', 'child', 'elbow'], dist: 1 })
    .add('rimLight', { part: ['head', 'brow', 'crest', 'shoulder-l', 'shoulder-r', 'elbow', 'knee', 'fist', 'child', 'menhir'] });

  // courses that bend round the ribcage and the pelvis
  p.add('decal', { name: 'rib-seam', part: 'torso', mat: 'cloth', band: 2, shape: band(arcPts(neck[0] - sw * 0.62, neck[0] + sw * 0.62, sh + U(0.12), U(0.035)), 1.2) });
  p.add('decal', { name: 'hip-seam', part: 'pelvis', mat: 'cloth', band: 2, shape: band(arcPts(hip[0] - pw * 0.85, hip[0] + pw * 0.85, hip[1] - U(0.02), U(0.03)), 1.2) });
  // a crack on the lit shoulder boulder
  const sl = roots[0], cr = U(0.085);
  if (!L.profile) p.add('decal', { name: 'crack', part: ['upper-arm', 'shoulder-l'], mat: 'cloth', band: 2, shape: { type: 'poly', pts: [
    [sl[0] - cr * 0.1, sh - cr * 0.7], [sl[0] + cr * 0.05, sh - cr * 0.7], [sl[0] - cr * 0.1, sh], [sl[0] + cr * 0.3, sh + cr * 0.4], [sl[0] + cr * 0.15, sh + cr * 0.45], [sl[0] - cr * 0.25, sh + cr * 0.05],
  ] } });
  // the leather sling across the torso, shoulder to the far hip (seen front and back)
  const sA = [roots[1][0], sh - U(0.02)], sB = [hip[0] + (roots[0][0] - hip[0]) * 0.55, wy + U(0.02)];
  if (!L.profile) p.add('decal', { name: 'sling', part: 'torso', mat: 'leather', shape: strip(sA, sB, U(0.045)) });
  if (!backView) {
    // the family's red rune, high on the chest away from the sling
    const rx = neck[0] + chest * 0.4, sy = sA[1] + (sB[1] - sA[1]) * (rx - sA[0]) / ((sB[0] - sA[0]) || 1), rr = 2.2;
    const ry = Math.max(sh + U(0.02), Math.min(sh + U(0.14), sy - U(0.06)));
    if (!L.profile) p.add('decal', { name: 'rune', part: 'torso', mat: 'accent', band: 1, shape: { type: 'poly', pts: [[rx, ry - rr], [rx + rr * 0.8, ry], [rx, ry + rr], [rx - rr * 0.8, ry]] } });
    // the face: a lit nose ridge under the brow, a dark mouth under the slits
    const nx = Math.round(hcx + fx + (L.profile ? sx * U(0.035) : 0));
    p.add('decal', { name: 'nose', part: 'head', mat: 'cloth', band: 0, shape: { type: 'rect', x: nx - (L.profile ? 0 : 0), y: ey + 1, w: 1, h: 2 } });
    const my = Math.round(top + headH * 0.82), mw = L.profile ? 2 : 4, mx = Math.round(hcx + fx - mw / 2 + (L.profile ? sx * U(0.02) : 0));
    p.add('decal', { name: 'mouth', part: 'head', mat: 'cloth', band: 2, shape: { type: 'rect', x: mx, y: my, w: mw, h: 1 } });
    // the child looks out from her arm
    if (front > 0.2) p.add('decal', { name: 'child-eyes', part: 'child', mat: 'accent', band: 0, shape: [
      { type: 'rect', x: Math.round(child[0] - U(0.04)), y: Math.round(child[1] - U(0.02)), w: 1, h: 1 },
      { type: 'rect', x: Math.round(child[0] + U(0.02)), y: Math.round(child[1] - U(0.02)), w: 1, h: 1 },
    ] });
  } else {
    // the back: a carved braid down the back of the head and onto the neck, and a spine groove
    const braid = [];
    for (let y = Math.round(by + 2), i = 0; y < hb + U(0.04); y += 2, i++) braid.push({ type: 'rect', x: Math.round(hcx - 1 + (i % 2 ? 1 : -1)), y, w: 2, h: 1 });
    p.add('decal', { name: 'braid', part: ['head', 'neck'], mat: 'cloth', band: 2, shape: braid });
    p.add('decal', { name: 'braid-lit', part: ['head', 'neck'], mat: 'cloth', band: 0, shape: { type: 'rect', x: Math.round(hcx - 2), y: Math.round(by + 2), w: 1, h: Math.max(1, Math.round(hb - by - 2)) } });
    p.add('decal', { name: 'spine', part: 'torso', mat: 'cloth', band: 2, shape: { type: 'rect', x: Math.round(neck[0]), y: Math.round(sh), w: 1, h: Math.round(wy - sh) } });
  }
  // the menhir: a leather grip wrap above the fist, a glowing carved groove along it, a crack near the head of the stone
  if (!menhirBehind) p.add('decal', { name: 'grip', part: 'menhir', mat: 'leather', shape: { type: 'poly', pts: [at(U(0.075), -U(0.085)), at(U(0.13), -U(0.09)), at(U(0.13), U(0.075)), at(U(0.075), U(0.07))] } });
  p.add('decal', { name: 'groove', part: 'menhir', mat: 'accent', band: 1, shape: strip(at(len * 0.45, U(0.005)), at(len * 0.72, -U(0.01)), 1.2) });
  p.add('decal', { name: 'menhir-crack', part: 'menhir', mat: 'stone', band: 2, shape: strip(at(len * 0.82, -U(0.07)), at(len * 0.9, U(0.0)), 1.2) });
  return p.render();
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
