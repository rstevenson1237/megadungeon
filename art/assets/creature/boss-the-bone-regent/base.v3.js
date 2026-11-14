// boss-the-bone-regent base.v3 (r3, from base.v2) — the decorated pass on the owner-approved v2 shape (silhouette kept,
// nothing outside the outer line moves). Inside the line only: a face (two dark sockets with a pale glow.0 point each, a
// nasal notch and a row of separate teeth on the jaw, front and near-side profile); the back of the skull a crack decal
// instead, and the mantle's tears; the spine notched (front) into vertebrae and the ribs, pelvis and skull lit as round
// masses from the direction's light (pelvis `normal` with a round edge, not a flat slab); a gem (glow) on the crown's
// brow band facing the viewer; the maul's haft wrapped in a leather grip above the fist, metal rivets on its collar and
// cracks across the bone head; the mantle in the accent ramp with light material noise and dark tears; overlap AO under
// the skull, ribs and pelvis. Body stays on cloth (the family-s recolour ramp); no wood.
// boss-the-bone-regent base.v2 (r2, from base.v1, SHAPE DRAFT) — one change, the owner's shape note "reads as an armoured
// knight, not a skeleton": the body is redrawn as bones that show in the silhouette. The broad red cape becomes a thin
// tattered mantle (two narrow ragged tails from the shoulders to the knees); the solid barrel ribcage becomes four
// separate curved ribs over a bare spine, with the floor showing between them; the pelvis becomes a bowl with two hip
// wings over a gap; the limbs are thin tapered bones with knob elbows and knees; the round skull pauldrons shrink to
// shoulder knobs on a thin collarbone; the skull hangs a separate jaw on a long bare neck, and the crown is a tall three-spiked crown set higher on the cranium.
// Height, rig, maul and facings unchanged.
// boss-the-bone-regent base.v1 (r1, SHAPE DRAFT) — The Bone Regent, a unique brute boss of the skeleton family (glyph s,
// bone, undead), 3.8 m (about 61 px, 1.6x the drawn player) in the 64 x 80 large frame, on the shared biped rig
// (`ctx.lib.rigs.body`, from the iso walker template; bone lengths fixed for the asset, proportions set once for a tall
// gaunt giant: small skull, long legs and arms). Silhouette and form only, plain shading, no proc layers but the ground
// shadow. What tells him from the plain skeleton: a tall five-spiked crown on the skull, a high bone mantle with round
// skull pauldrons that widen the shoulders, a barrel ribcage tapering to a bare spine and a pelvis bowl, a ragged regal
// cloak that hangs from the shoulders and flares to a jagged hem (behind him from the front, trailing in profile,
// covering him from behind), and a great bone maul (a femur haft with a knotted bone head and a metal collar) dragged low
// in the right hand and swung overhead in an arc on the attack. The body is one ramp (cloth, the family's recolour ramp).
// Facings come from the rig's yaw; every part is placed with pose.at(bone, u, fwd, side, up) so the body turns.
export const meta = { brief: 'boss-the-bone-regent', pass: 'r3', notes: 'decorated: face with glowing sockets and teeth, notched spine, crown gem, leather grip and rivets on the maul, cracks, mantle noise and tears', recolour: 'cloth' };

const HM = 3.8;

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, k = (HM * metre) / 61, X = v => v * k;
  const ground = h - 1;
  const rig = ctx.lib.rigs.body('biped', ctx, {
    ground, height: Math.round(HM * metre * 0.9),
    proportions: { hip: 0.02, spine: 0.33, neck: 0.05, head: 0.16, leg_up: 0.22, leg_lo: 0.22, arm_up: 0.19, arm_lo: 0.18, shoulder: 0.92, legSep: 0.07, armSep: 0.19 },
  });
  // the clip's pose, then a brute's hunch (spine forward, head lifted back on the neck) and bent elbows added to it:
  // the same offsets in every frame, so the bone lengths never change
  const P0 = rig.pose(ctx.state, ctx.t), A = P0.angles, atk = ctx.state === 'attack';
  const P = rig.pose(ctx.state, ctx.t, { angles: {
    spine: (A.spine ?? 0) - 9, neck: (A.neck ?? 0) + 4, head: (A.head ?? 0) + 6,
    armL_lo: (A.armL_lo ?? 0) + 22, ...(atk ? {} : { armR_lo: (A.armR_lo ?? 0) + 26 }),
  } });
  const { sx, front, side } = rig, profile = side > 0.9;
  const hd0 = P.start('head'), hd1 = P.end('head'), headLen = Math.hypot(hd1[0] - hd0[0], hd1[1] - hd0[1]);
  const rC = headLen * 0.62, cran = P.at('head', 0.6), hand = P.end('armR_lo');
  return { w, h, X, k, rig, P, sx, front, side, profile, ground, headLen, rC, cran, hand };
}

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx);
  const { X, P, sx, front, side, profile, rC, cran, hand } = L, bone = pal.cloth;
  const at = (n, u, f = 0, sd = 0, up = 0) => P.at(n, u, X(f), X(sd), X(up));
  const pts = list => list.map(p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`);
  const poly = list => { const q = pts(list); return `M${q[0]} ${q.slice(1).map(v => `L${v}`).join(' ')} Z`; };
  const wob = ctx.state === 'walk' ? Math.sin(ctx.t * Math.PI * 2) : ctx.state === 'attack' ? -0.6 : 0;
  // screen half-width of a body cross-section `ws` wide (side to side) and `wd` deep, as the rig turns
  const half = (ws, wd) => Math.hypot(X(ws) * front, X(wd) * sx);
  const decals = [], R = v => Math.round(v);
  const dot = (x, y, w = 1, h = 1) => ({ type: 'rect', x: R(x), y: R(y), w, h });

  // ---- the ragged cloak: from the shoulders, behind the back, flaring to a jagged hem near the ankles
  const cloak = () => {
    // two halves (one path, wound the same way on screen) so the cape has depth in profile: its edges hang close behind the shoulders
    // and its middle bellies out behind and flares backward to the hem
    const fl = 6, hemUp = -12, sway = wob * 1.2;
    const cuts = [1, 0.75, 0.5, 0.25, 0], dips = [0, 4.5, 1, 5.5, 2];
    const hemF = c => -2.5 - 4 * (1 - c) - sway * (1 - c);
    const halfOf = sg => {
      const list = [
        at('spine', 1, -2.5, 0), at('spine', 0.95, -1.8, sg * 2.6), at('spine', 0.5, -2.5, sg * 3.6), at('spine', 0, -3, sg * (fl - 1)),
        ...cuts.map((c, i) => at('spine', 0, hemF(c), sg * c * fl, hemUp - dips[i] + (1 - c) * 1.5)),
        at('spine', 0.1, -5 - sway * 0.6, 0), at('spine', 0.6, -4, 0),
      ];
      return sg > 0 || Math.abs(front) < 0.5 ? list : list.reverse();
    };
    s.add({ type: 'path', name: 'cloak', underlay: true, mat: pal.accent, shade: 'normal', round: X(2), d: `${poly(halfOf(1))} ${poly(halfOf(-1))}` });
    // tears: short dark slits up from the hem on each tail
    if (front < -0.3) for (const sg of [1, -1]) {
      const t = at('spine', 0, hemF(0.5) + 0.4, sg * 0.5 * fl, hemUp + 3);
      decals.push({ name: 'tear', part: 'cloak', mat: 'accent', band: 2, shape: [dot(t[0], t[1], 1, 3), dot(t[0] + sg, t[1] - 3, 1, 2)] });
    }
  };

  // ---- limbs: tapered bone segments with knob joints
  const legs = names => names.forEach(n => {
    const lo = n.replace('_up', '_lo');
    const sg = n[3] === 'R' ? 1 : -1, hipP = P.start(n), knee = P.at(n, 1, X(0.6), X(sg * 1.4)), ank = P.end(lo), toe = P.at(lo, 1, X(3.6), X(sg * 0.6), X(0.4));
    s.add({ type: 'group', name: 'leg', underlay: true, mat: bone, shade: 'cyl', children: [
      { type: 'capsule', name: 'thigh', a: hipP, b: knee, r: X(1.4), r1: X(1.0) },
      { type: 'capsule', name: 'shin', a: knee, b: ank, r: X(1.0), r1: X(0.8) },
      { type: 'circle', name: 'knee', cx: knee[0], cy: knee[1], r: X(1.7), shade: 'sphere' },
      { type: 'capsule', name: 'foot', a: [ank[0], ank[1] - X(0.6)], b: toe, r: X(1.4), r1: X(1.0), shade: 'sphere' },
    ] });
  });
  const arm = c => {
    const sg = c === 'R' ? 1 : -1, sh = P.start(`arm${c}_up`), el = P.at(`arm${c}_up`, 1, 0, X(sg * 2.6)), hd = P.end(`arm${c}_lo`);
    s.add({ type: 'group', name: 'arm', underlay: true, mat: bone, shade: 'cyl', children: [
      { type: 'capsule', name: 'upper-arm', a: sh, b: el, r: X(1.1), r1: X(0.85) },
      { type: 'capsule', name: 'forearm', a: el, b: hd, r: X(0.9), r1: X(0.75) },
      { type: 'circle', name: 'elbow', cx: el[0], cy: el[1], r: X(1.5), shade: 'sphere' },
      { type: 'circle', name: 'hand', cx: hd[0], cy: hd[1], r: X(1.8), shade: 'sphere' },
    ] });
  };
  // ---- the great bone maul along the right forearm: grip in the fist, a long femur haft, a knotted bone head
  const maul = () => {
    const a = P.start('armR_lo'), b = hand, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    // the forearm's screen direction, with a little of the swing's sideways arc in the facings that foreshorten it
    let d = [dx / l, dy / l];
    // wound up, the maul lies back over the shoulder (behind him in profile, out to his right side facing the viewer or
    // away) so it stays in the frame, then comes over in the arc to strike the ground ahead on the held contact frame
    // at rest it is held out from the body, its head on the ground ahead of him (in profile) or out at his side
    const outX = profile ? Math.sign(sx) : -Math.sign(front || 1);
    if (ctx.state === 'attack') {
      const f = ctx.frame % 4, bx = profile ? -outX : outX, k2 = profile ? [1.6, 1.3, 0, 0.2][f] : [1.6, 1.3, 0.8, 0.6][f];
      d = [d[0] + bx * k2, d[1]];
    } else d = [d[0] + outX * 0.6, d[1]];
    { const m = Math.hypot(...d) || 1; d = [d[0] / m, d[1] / m]; }
    const len = X(17), butt = [b[0] - d[0] * X(3), b[1] - d[1] * X(3)], top = [b[0] + d[0] * len, b[1] + d[1] * len];
    const n = [-d[1], d[0]], neck = [b[0] + d[0] * (len - X(5.6)), b[1] + d[1] * (len - X(5.6))];
    s.add({ type: 'group', name: 'maul', underlay: true, children: [
      { type: 'capsule', name: 'haft', a: butt, b: top, r: X(1.4), mat: bone, shade: 'cyl' },
      { type: 'circle', name: 'pommel', cx: butt[0], cy: butt[1], r: X(1.5), mat: bone, shade: 'sphere' },
      { type: 'ellipse', name: 'maul-head', cx: top[0], cy: top[1], rx: X(5), ry: X(4.4), mat: bone, shade: 'sphere' },
      { type: 'circle', name: 'maul-knot', cx: top[0] + n[0] * X(4.2) + d[0] * X(1.2), cy: top[1] + n[1] * X(4.2) + d[1] * X(1.2), r: X(2.6), mat: bone, shade: 'sphere' },
      { type: 'circle', name: 'maul-knot', cx: top[0] - n[0] * X(4.2) + d[0] * X(1.2), cy: top[1] - n[1] * X(4.2) + d[1] * X(1.2), r: X(2.6), mat: bone, shade: 'sphere' },
      { type: 'capsule', name: 'collar', a: [neck[0] + n[0] * X(2.4), neck[1] + n[1] * X(2.4)], b: [neck[0] - n[0] * X(2.4), neck[1] - n[1] * X(2.4)], r: X(1.3), mat: pal.metal, shade: 'cyl' },
    ] });
    // a leather grip wound round the haft above the fist, rivets on the collar, cracks across the bone head
    const g0 = [b[0] + d[0] * X(2.2), b[1] + d[1] * X(2.2)], g1 = [b[0] + d[0] * X(5.4), b[1] + d[1] * X(5.4)], gw = X(1.5);
    decals.push({ name: 'grip', part: 'haft', mat: 'leather', band: 'keep', shape: { type: 'poly', pts: [
      [g0[0] + n[0] * gw, g0[1] + n[1] * gw], [g1[0] + n[0] * gw, g1[1] + n[1] * gw], [g1[0] - n[0] * gw, g1[1] - n[1] * gw], [g0[0] - n[0] * gw, g0[1] - n[1] * gw]] } });
    decals.push({ name: 'rivets', part: 'collar', mat: 'metal', band: 0, shape: [dot(neck[0] + n[0] * X(1.6), neck[1] + n[1] * X(1.6)), dot(neck[0] - n[0] * X(1.6), neck[1] - n[1] * X(1.6))] });
    const hc = [top[0] + d[0] * X(1.5) - n[0] * X(0.5), top[1] + d[1] * X(1.5) - n[1] * X(0.5)];
    decals.push({ name: 'head-crack', part: 'maul-head', mat: 'cloth', band: 2, shape: [dot(hc[0], hc[1]), dot(hc[0] + n[0] * 1.2 + d[0], hc[1] + n[1] * 1.2 + d[1]), dot(hc[0] + n[0] * 2.2 + d[0] * 0.6, hc[1] + n[1] * 2.2 + d[1] * 0.6), dot(hc[0] - n[0] * 1.2 + d[0] * 0.8, hc[1] - n[1] * 1.2 + d[1] * 0.8)] });
  };

  // ---- the torso: pelvis bowl with hip wings, a bare spine, four curved ribs apart, a thin collarbone
  const torso = () => {
    const pel = at('spine', 0.02, 0.4), pw = half(5.4, 3.4);
    s.add({ type: 'path', name: 'pelvis', underlay: true, mat: bone, shade: 'normal', round: X(1.5), d: smooth([
      [pel[0] - pw, pel[1] - X(1.4)], [pel[0], pel[1] + X(0.2)], [pel[0] + pw, pel[1] - X(1.4)], [pel[0] + pw * 0.8, pel[1] + X(1.6)],
      [pel[0] + pw * 0.25, pel[1] + X(1.4)], [pel[0], pel[1] + X(2.6)], [pel[0] - pw * 0.25, pel[1] + X(1.4)], [pel[0] - pw * 0.8, pel[1] + X(1.6)]]) });
    s.add({ type: 'capsule', name: 'spine', underlay: true, a: at('spine', 0.05, -0.6), b: at('spine', 1, -0.6), r: X(1.1), mat: bone, shade: 'cyl' });
    // vertebrae: a dark notch across the spine every few pixels
    if (front > 0.3 && !profile) for (const u of [0.14, 0.26]) { const v = at('spine', u, -0.6); decals.push({ name: 'vertebra', part: 'spine', mat: 'cloth', band: 2, shape: dot(v[0] - X(0.6), v[1], Math.max(1, R(X(1.4)))) }); }
    // ribs: each a pair of bars from the breastbone out and down to the flank, widest at the chest
    for (const [u, ws, wd, f] of [[0.5, 5.4, 3.8, 1.2], [0.64, 7.4, 5, 1.8], [0.78, 8.2, 5.6, 2], [0.92, 7.4, 5, 1.4]]) {
      const c = at('spine', u, f), hw = half(ws, wd), dip = X(1.6);
      s.add({ type: 'group', name: 'rib', underlay: true, mat: bone, shade: 'cyl', children: [
        { type: 'capsule', name: 'rib-l', a: c, b: [c[0] - hw, c[1] + dip], r: X(0.9), r1: X(0.6) },
        { type: 'capsule', name: 'rib-r', a: c, b: [c[0] + hw, c[1] + dip], r: X(0.9), r1: X(0.6) },
      ] });
    }
    const nk = P.start('neck'), sl = P.start('armL_up'), sr = P.start('armR_up');
    s.add({ type: 'capsule', name: 'collarbone', underlay: true, a: sl, b: sr, r: X(1), mat: bone, shade: 'cyl' });
    s.add({ type: 'circle', name: 'sternum', underlay: true, cx: nk[0], cy: nk[1] + X(1), r: X(1.3), mat: bone, shade: 'sphere' });
  };
  const pauldron = c => {
    const p = P.at(`arm${c}_up`, 0.05, 0, 0, X(0.4));
    s.add({ type: 'circle', name: 'shoulder', underlay: true, cx: p[0], cy: p[1], r: X(2), mat: bone, shade: 'sphere' });
  };

  // ---- the skull with a heavy jaw, the neck vertebrae and the spiked crown (the same in every facing)
  const head = () => {
    const nk0 = P.start('neck'), nk1 = P.end('neck');
    s.add({ type: 'capsule', name: 'neck', underlay: true, a: nk0, b: nk1, r: X(1.0), mat: bone, shade: 'cyl' });
    const jaw = at('head', 0.0, 1.4 + 0.8 * side), jr = half(2.2, 1.8);
    s.add({ type: 'group', name: 'skull', underlay: true, mat: bone, children: [
      { type: 'ellipse', name: 'jaw', cx: jaw[0], cy: jaw[1], rx: Math.max(X(1.8), jr), ry: X(1.7), shade: 'sphere' },
      { type: 'circle', name: 'cranium', cx: cran[0], cy: cran[1], r: rC, shade: 'sphere' },
    ] });
    if (front > -0.3) {
      // the face: dark sockets (both from the front, the near one in profile) each with a pale glow point low on the
      // inner side, a nasal notch between them, and separate teeth on the jaw (dark gaps in a dark line)
      const eyes = profile ? [0] : [-1, 1];
      for (const e of eyes) {
        const p = at('head', 0.5, rC / L.k * 0.85, profile ? 0 : e * 1.7);
        const x = R(p[0] - X(0.9)), y = R(p[1] - X(0.7)), w = Math.max(2, R(X(1.8))), h = Math.max(2, R(X(1.6)));
        s.add({ type: 'rect', name: 'socket', x, y, w, h, color: 'outline' });
        const gx = profile ? x + (sx > 0 ? w - 1 : 0) : (e < 0 ? x + w - 1 : x);
        s.add({ type: 'rect', name: 'eye-glow', x: gx, y: y + h - 1, w: 1, h: 1, color: 'glow.0' });
      }
      if (!profile) { const ns = at('head', 0.3, rC / L.k * 0.95, 0); s.add({ type: 'rect', name: 'nose', x: R(ns[0]), y: R(ns[1]), w: 1, h: 1, color: 'outline' }); }
      const tj = at('head', 0.08, 2.6 + 0.6 * side), tw = Math.max(1, R(profile ? X(1.6) : X(3.6))), tx = R(tj[0] - (profile ? X(0.8) : X(1.8)));
      s.add({ type: 'rect', name: 'teeth', x: tx, y: R(tj[1]), w: tw, h: 1, color: 'outline' });
      if (!profile) for (let i = 1; i < tw; i += 2) s.add({ type: 'rect', name: 'tooth', x: tx + i, y: R(tj[1]) - 1, w: 1, h: 1, color: 'cloth.0' });
      // the crown's gem on the brow band, toward the viewer
      const gm = [cran[0], cran[1] - rC * 0.7 + X(0.6)];
      if (!profile) decals.push({ name: 'crown-gem', part: 'crown', mat: 'glow', band: 0, shape: dot(gm[0] - 1, gm[1], profile ? 1 : 2, 1) });
    } else {
      // from behind: a crack down the back of the cranium
      const c0 = [cran[0] + rC * 0.15, cran[1] - rC * 0.4];
      decals.push({ name: 'skull-crack', part: 'cranium', mat: 'cloth', band: 2, shape: [dot(c0[0], c0[1]), dot(c0[0] - 1, c0[1] + 1), dot(c0[0] - 1, c0[1] + 2), dot(c0[0], c0[1] + 3)] });
    }
    // the crown: a band on the brow and three tall spikes apart, tallest in the middle
    const cw = rC * 1.1, by = cran[1] - rC * 0.7, bh = X(2), hts = [7, 12, 7].map(X);
    const xs = [-1, 0, 1].map(f => cran[0] + f * cw);
    const crown = [[cran[0] - cw - X(0.6), by + bh]];
    xs.forEach((x, i) => {
      const gap = i ? (xs[i - 1] + x) / 2 : null;
      if (gap !== null) crown.push([gap - X(0.6), by + X(0.2)], [gap + X(0.6), by + X(0.2)]);
      crown.push([x - X(0.45), by - hts[i]], [x + X(0.45), by - hts[i]]);
    });
    crown.push([cran[0] + cw + X(0.6), by + bh]);
    s.add({ type: 'path', name: 'crown', underlay: true, mat: pal.metal, shade: 'bevel', d: poly(crown) });
  };

  // ---- draw order, far to near
  const legNames = P.far(['legL_up', 'legR_up']), armNames = P.far(['armL_up', 'armR_up']).map(n => n[3]);
  const backView = front < -0.3;
  if (!backView) cloak();
  if (profile) { arm(armNames[0]); if (armNames[0] === 'R') maul(); }
  legs(legNames);
  torso();
  if (backView) { maul(); cloak(); }
  if (!profile) { pauldron(armNames[0]); arm(armNames[0]); }
  head();
  if (!profile) { if (!backView) maul(); pauldron(armNames[1]); arm(armNames[1]); }
  else { pauldron(armNames[1]); if (armNames[1] === 'R') maul(); arm(armNames[1]); }
  let pr = ctx.lib.proc(s)
    .add('ao', { part: ['cranium', 'jaw', 'rib', 'pelvis', 'spine', 'collarbone'] })
    .add('materialNoise', { part: 'cloak', amount: 0.12, scale: 2, seed: ctx.variant ?? 0 });
  for (const d of decals) pr = pr.add('decal', d);
  return pr.add('groundShadow', {}).render();
}

const smooth = list => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = list.length;
  let d = `M${m(list[n - 1], list[0]).join(' ')}`;
  for (let i = 0; i < n; i++) d += ` Q${list[i].join(' ')} ${m(list[i], list[(i + 1) % n]).join(' ')}`;
  return d + ' Z';
};

// head and hand from the rig, the sockets are drawn dark (no face for the finish to paint); ground stays the rig's
export const anchors = ctx => {
  const L = layout(ctx), a = L.rig.anchors(L.P);
  a.head = [Math.round(L.cran[0]), Math.round(L.cran[1])];
  delete a.ground;
  return a;
};
