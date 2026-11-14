// boss-hexmother-yarrow base.v3 (r3, from base.v2) - the decoration pass on the owner-approved v2 shape: the silhouette
// is kept and every change is inside the line. One thing: materials, light and marks. Forms are lit from the direction's
// light (up-left) as round masses: the dress is linear-lit with AO and light cloth noise, limbs, shins and the staff are
// cylinders, the skull is a sphere; the hat cone and the hair are on their mid step with a lit strand on the left (the hair off
// the near-black step) and a shadowed one on the right.
// Marks are decals on their parts: a leather stomacher with metal lacing and a leather sash at the waist (not side on, where the near arm covers it), two skirt folds
// (a dark crease with a lit edge on its light side), a soiled band along the ragged hem, an accent hatband with a hex
// sigil on the hat, a brim shadow over the brow and a mouth on the face, an accent hex sigil stitched on the back of the
// dress, knots on the staff, a lit edge on the metal hex ring that flares to glow on the held hit frame (attack frame 2),
// pale dried umbels on the yarrow halo. Face front and side, hair and sigil from behind. Colours from ctx.dir (R11).
// boss-hexmother-yarrow base.v2 (r2) SHAPE DRAFT, from base.v1. One change: the body is redrawn to the shape note
// ("the robe is a straight-sided slab hiding arms and legs, the head sits on the shoulders with no neck"). The slab robe
// and the hump are gone: a fitted bodice narrows from the shoulders to a waist, the skirt hangs close over the hips and
// flares only toward a ragged, uneven hem at mid-calf, with tapered shins and pointed shoes under it; the arms are tapered,
// held clear of the body and bent at the elbow (the left hand spread to cast, the right gripping the staff); the head is
// bigger and sits on a visible neck, with long hair falling behind it and a tall pointed witch hat whose tip hooks back
// and to her left; the yarrow halo (seven stalks with umbel heads) fans out behind the hat and the forked staff with its
// hex ring stays. The attack is a wider sweep: wound back over her right shoulder, swung overhead, then held on the
// contact frame (frame 2, 120 ms) with the staff driven forward, down and across her body, the body leaning in.
// Silhouette and form only, in flat materials: no proc layers, no texture, no decals. Colours from ctx.dir (R11); the
// dress and hat are the cloth ramp (the family-h recolour ramp), so the row's violet dresses her.
export const meta = { brief: 'boss-hexmother-yarrow', pass: 'r3', notes: 'decorated: lit dress with stomacher, sash, folds, soiled hem; hatband sigil; lit staff and hex ring that flares on the hit', recolour: 'cloth' };

export const params = {};

function layout(ctx) {
  const [w, h] = ctx.size, X = v => (v * w) / 64;
  const ground = h - 1, H = Math.round(54 * h / 80);
  const rig = ctx.lib.rigs.body('biped', ctx, { ground, height: H, proportions: { hip: 0.02, spine: 0.3, neck: 0.075, head: 0.2, leg_up: 0.2, leg_lo: 0.2, arm_up: 0.17, arm_lo: 0.16, armSep: 0.105, legSep: 0.05 } });
  const P0 = rig.pose(ctx.state, ctx.t), a0 = P0.angles;
  const attack = ctx.state === 'attack', f = attack ? ((ctx.frame ?? Math.floor((ctx.t ?? 0) * 4)) % 4 + 4) % 4 : 0;
  const angles = {};
  if (attack) {
    // wind back over the right shoulder, swing overhead, the held hit forward and down, recover
    const R = [[-25, 30], [40, 25], [115, 8], [140, 20]][f], lean = [-6, 2, 12, 6][f];
    Object.assign(angles, { armR_up: R[0], armR_lo: R[1], armL_up: [200, 190, 160, 170][f], armL_lo: [40, 50, 30, 40][f], spine: lean, neck: -lean * 0.5 });
  } else {
    const sw = ctx.state === 'walk' ? (a0.armL_up ?? 180) - 180 : 0;
    Object.assign(angles, { armL_up: 168 + sw, armL_lo: -70, armR_up: 166 - sw, armR_lo: -50, spine: (a0.spine ?? 0) + 3, neck: (a0.neck ?? 0) - 3 });
  }
  const P = rig.pose(ctx.state, ctx.t, { angles });
  const { sx, front, side } = rig, profile = side > 0.9;
  return { w, h, X, rig, P, sx, front, side, profile, ground, H, attack, f };
}

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx);
  const { X, P: pose, sx, front, side, profile, ground, attack, f } = L;
  const items = [], put = (depth, node) => items.push({ depth, node, i: items.length });
  const D = (bone, fwd = 0, sd = 0) => pose.depth(bone) + fwd * front + sd * sx;
  const at = (...a) => pose.at(...a);
  const pt = p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  const smooth = pts => {
    const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
    let d = `M${pt(m(pts[n - 1], pts[0]))}`;
    for (let i = 0; i < n; i++) d += ` Q${pt(pts[i])} ${pt(m(pts[i], pts[(i + 1) % n]))}`;
    return d + ' Z';
  };
  const poly = p => `M${p.map(pt).join(' L')} Z`;
  const narrow = 1 - 0.3 * side; // the body is thinner seen side on

  // --- legs: tapered shins and pointed shoes under the hem
  for (const n of ['legL', 'legR']) {
    const k = pose.start(`${n}_lo`), e = pose.end(`${n}_lo`), toe = pose.at(`${n}_lo`, 1, X(3.2), 0, 0);
    put(D(`${n}_lo`) - 0.3, { type: 'group', name: n, underlay: true, children: [
      { type: 'capsule', name: 'shin', a: k, b: [e[0], e[1] - X(1.5)], r: X(1.5), r1: X(0.9), mat: pal.leather, shade: 'cyl' },
      { type: 'path', name: 'shoe', d: smooth([[e[0] - X(1.5), ground], [e[0] - X(1), ground - X(2.4)], [toe[0], ground - X(1.4)], [toe[0] + (toe[0] - e[0]) * 0.35, ground - X(0.1)]]), mat: pal.leather, shade: 'flat', band: 1 },
    ] });
  }

  // --- dress: a fitted bodice narrowing to the waist, the skirt close over the hips, flared only at the ragged hem
  const sh = at('spine', 0.95), waist = at('spine', 0.28), hip = at('hip', 0);
  const knees = ['legL_lo', 'legR_lo'].map(n => pose.at(n, 0.45));
  const kneeC = [(knees[0][0] + knees[1][0]) / 2, (knees[0][1] + knees[1][1]) / 2];
  const hemY = kneeC[1] + X(1), hemC = kneeC[0] * 0.6 + hip[0] * 0.4;
  const shw = X(4.6) * narrow, ww = X(2.6) * narrow, hpw = X(4) * narrow, lw = X(4.6) * narrow, hemW = X(8.5) * (1 - 0.25 * side);
  const lowY = hip[1] + (hemY - hip[1]) * 0.55, lowC = hip[0] * 0.5 + hemC * 0.5;
  const rag = [0, 2.6, 0.4, 1.4, 3.2, 0.6, 2, 0.2, 2.8, 0.8, 0];
  const hem = rag.map((r, i) => { const u = i / (rag.length - 1); return [hemC + hemW * (1 - 2 * u) * (i % 2 ? 0.94 : 1), hemY - X(1.5) + X(r) - X(1.2) * u]; });
  const dress = `M${pt([sh[0] - shw, sh[1] + X(1.2)])} Q${pt([sh[0], sh[1] - X(1.4)])} ${pt([sh[0] + shw, sh[1] + X(1.2)])}`
    + ` Q${pt([sh[0] + shw * 0.95, (sh[1] + waist[1]) / 2 + X(1)])} ${pt([waist[0] + ww, waist[1]])}`
    + ` Q${pt([hip[0] + hpw, hip[1] - X(1)])} ${pt([hip[0] + hpw, hip[1] + X(1)])}`
    + ` L${pt([lowC + lw, lowY])} Q${pt([hemC + hemW * 0.62, hemY - X(3)])} ${pt([hemC + hemW, hemY - X(1.5)])}`
    + ` L${hem.map(pt).join(' L')}`
    + ` Q${pt([hemC - hemW * 0.62, hemY - X(3)])} ${pt([lowC - lw, lowY])} L${pt([hip[0] - hpw, hip[1] + X(1)])}`
    + ` Q${pt([hip[0] - hpw, hip[1] - X(1)])} ${pt([waist[0] - ww, waist[1]])}`
    + ` Q${pt([sh[0] - shw * 0.95, (sh[1] + waist[1]) / 2 + X(1)])} ${pt([sh[0] - shw, sh[1] + X(1.2)])} Z`;
  put(D('spine'), { type: 'path', name: 'dress', underlay: true, d: dress, mat: pal.cloth, shade: 'linear' });

  // --- hair: long, falling behind the head to below the shoulders (in front of the dress from behind)
  const hc = at('head', 0.45), htop = at('head', 1), hh = pose.bone('head').len, hw = X(3.6) * (1 - 0.08 * side);
  const hairB = at('spine', 0.82, -X(1.6), 0, 0), hairW = X(3.4) * (1 - 0.35 * side);
  const hairPts = [
    [htop[0] - hw * 1.05, htop[1] + X(0.5)], [htop[0] + hw * 1.05, htop[1] + X(0.5)],
    [hc[0] + hw + X(1), hc[1] + hh * 0.4], [hairB[0] + hairW, hairB[1]], [hairB[0] + hairW * 0.3, hairB[1] + X(2)],
    [hairB[0] - hairW * 0.4, hairB[1] + X(1)], [hairB[0] - hairW, hairB[1] + X(2.4)], [hc[0] - hw - X(1), hc[1] + hh * 0.4],
  ];
  const back = -sx * side * X(2.4); // side on, the hair falls from the back of the head, clear of the face
  put(front > -0.3 ? D('head') - 1.5 : D('spine') + 3, { type: 'path', name: 'hair', underlay: true, d: smooth(hairPts.map(([x, y]) => [x + back, y])), mat: pal.hair, shade: 'flat', band: 1 });

  // --- arms: tapered, held out from the body, bent at the elbow; a short ragged cuff at the elbow
  const arm = (k, claws) => {
    const o = k === 'L' ? -1 : 1;
    const a = pose.start(`arm${k}_up`), e = at(`arm${k}_up`, 1, 0, o * X(3.8), 0), hnd = at(`arm${k}_lo`, 1, 0, o * X(attack && k === 'R' ? 1 : 2.2), k === 'L' && !attack ? X(2.5) : 0);
    const kids = [
      { type: 'capsule', name: 'upper-arm', a, b: e, r: X(1.7), r1: X(1.3), mat: pal.cloth, shade: 'cyl' },
      { type: 'path', name: 'cuff', d: smooth([[e[0] - X(1.8), e[1] - X(0.6)], [e[0] + X(1.8), e[1] - X(0.6)], [e[0] + X(1.4), e[1] + X(2.8)], [e[0], e[1] + X(1.6)], [e[0] - X(1.2), e[1] + X(3.4)]]), mat: pal.cloth, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'forearm', a: e, b: hnd, r: X(1.05), r1: X(0.7), mat: pal.skin, shade: 'cyl' },
      { type: 'circle', name: 'hand', cx: hnd[0], cy: hnd[1], r: X(1.3), mat: pal.skin, shade: 'flat', band: 1 },
    ];
    if (claws) {
      const dx = hnd[0] - e[0], dy = hnd[1] - e[1], l = Math.hypot(dx, dy) || 1, d = [dx / l, dy / l];
      for (const t of [-0.8, 0, 0.8]) {
        const c = Math.cos(t), sn = Math.sin(t), dd = [d[0] * c - d[1] * sn, d[0] * sn + d[1] * c];
        kids.push({ type: 'capsule', name: 'claw', a: hnd, b: [hnd[0] + dd[0] * X(3.2), hnd[1] + dd[1] * X(3.2)], r: X(0.55), r1: X(0.3), mat: pal.skin, shade: 'flat', band: 1 });
      }
    }
    put(D(`arm${k}_up`) + 0.5, { type: 'group', name: `arm${k}`, underlay: true, children: kids });
    return { e, hnd };
  };
  arm('L', true);
  const armR = arm('R', false);

  // --- the staff: tall, crooked, forked at the top with a hex ring hanging in the fork; in the right hand.
  // Its direction is a 3D vector (fwd, side, up) projected through the rig, so the sweep turns with the facing.
  const SL = L.H * 1.0;
  const dirs = [[-0.45, 0.45, 0.77], [0.62, 0.25, 0.74], [0.82, -0.42, -0.38], [0.62, -0.1, -0.78]];
  const d3 = attack ? dirs[f] : [0.08, 0.06, 1];
  const n3 = Math.hypot(...d3), u3 = d3.map(v => v / n3);
  const grip = armR.hnd;
  const S3 = (k, m = 0) => { // a point k along the staff from the hand, m across it (screen-normal)
    const p = at('armR_lo', 1, u3[0] * k, X(attack ? 1 : 2.2) + u3[1] * k, u3[2] * k);
    const q = at('armR_lo', 1, u3[0] * (k + 1), X(attack ? 1 : 2.2) + u3[1] * (k + 1), u3[2] * (k + 1));
    const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1;
    return [p[0] - (dy / l) * m, p[1] + (dx / l) * m];
  };
  // at rest the butt stands on the ground; in the swing it trails a short way behind the hand
  let down = attack ? SL * 0.16 : Math.max(0, (ground - X(0.5) - grip[1]) / (u3[2] * (1 - 0.3 * 0)));
  let up = SL - down;
  if (attack) { // keep the staff head inside the frame
    let lo = X(6), hi = up;
    for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2, p = S3(m); if (p[0] < X(2.5) || p[0] > L.w - X(2.5) || p[1] < X(3) || p[1] > ground) hi = m; else lo = m; }
    up = lo;
  }
  const bend = [[-down, 0], [-down * 0.45, X(0.8)], [up * 0.25, -X(0.6)], [up * 0.62, X(0.9)], [up * 0.86, 0]];
  const staff = [];
  for (let i = 0; i < bend.length - 1; i++) if (bend[i + 1][0] - bend[i][0] > 0.5) staff.push({ type: 'capsule', name: 'staff', a: S3(...bend[i]), b: S3(...bend[i + 1]), r: X(i ? 1.0 : 0.85), r1: X(1.0), mat: pal.leather, shade: 'cyl' });
  const fork = S3(up * 0.86, 0);
  staff.push({ type: 'capsule', name: 'tine', a: fork, b: S3(up, -X(3)), r: X(0.95), r1: X(0.5), mat: pal.leather, shade: 'flat', band: 1 });
  staff.push({ type: 'capsule', name: 'tine', a: fork, b: S3(up * 1.02, X(2.6)), r: X(0.95), r1: X(0.5), mat: pal.leather, shade: 'flat', band: 1 });
  const top = S3(up * 0.95, 0), ringC = [top[0], Math.min(ground - X(3), top[1] + X(attack && f >= 2 ? 3.4 : 5))];
  staff.push({ type: 'capsule', name: 'cord', a: top, b: [ringC[0], ringC[1] - X(2.5)], r: X(0.45), mat: pal.leather, shade: 'flat', band: 2 });
  staff.push({ type: 'arc', name: 'hex-ring', cx: ringC[0], cy: ringC[1], r: X(2.6), w: Math.max(1, X(1.2)), a0: 0, a1: 360, mat: pal.metal, shade: 'flat', band: 1 });
  put(D('armR_lo') + 0.4, { type: 'group', name: 'staff', underlay: true, children: staff });

  // --- head on a visible neck: a long face with a pointed chin, a hooked nose side on
  const nk0 = pose.start('neck'), nk1 = pose.end('neck'), hD = D('head') + 1;
  const showFace = front > -0.3;
  const head = [
    { type: 'capsule', name: 'neck', a: [nk0[0], nk0[1] + X(1)], b: nk1, r: X(1.4), r1: X(1.2), mat: pal.skin, shade: 'flat', band: 1 },
    { type: 'path', name: 'skull', d: smooth([[hc[0] - hw, hc[1] - hh * 0.1], [htop[0] - hw * 0.9, htop[1] + X(0.4)], [htop[0] + hw * 0.9, htop[1] + X(0.4)], [hc[0] + hw, hc[1] - hh * 0.1], [hc[0] + hw * 0.6, hc[1] + hh * 0.45], [hc[0] - hw * 0.6, hc[1] + hh * 0.45]]), mat: showFace ? pal.skin : pal.hair, shade: showFace ? 'sphere' : 'flat', band: 1 },
  ];
  if (showFace) {
    const fsx = sx, fx = hc[0] + fsx * hw * 0.45, chinX = fx + fsx * X(1.6), fb = hc[1] + hh * 0.62;
    head.push({ type: 'path', name: 'chin', d: poly([[fx - hw * 0.55, hc[1] + hh * 0.2], [fx + hw * 0.55, hc[1] + hh * 0.2], [chinX + X(0.6), fb], [chinX - X(0.6), fb]]), mat: pal.skin, shade: 'flat', band: 1 });
    const noseY = hc[1] + hh * 0.05;
    if (side > 0.3) head.push({ type: 'path', name: 'nose', d: poly([[fx + fsx * hw * 0.4, noseY - X(1.6)], [fx + fsx * (hw + X(2.6)), noseY + X(1.8)], [fx + fsx * hw * 0.6, noseY + X(1.2)]]), mat: pal.skin, shade: 'flat', band: 1 });
    const eyes = profile ? [fx + fsx * hw * 0.2] : [fx - hw * 0.55, fx + hw * 0.25];
    for (const ex of eyes) head.push({ type: 'rect', name: 'eye', x: Math.round(ex), y: Math.round(noseY - X(1.8)), w: Math.max(1, Math.round(X(1.3))), h: 1, color: 'outline' });
  }
  put(hD, { type: 'group', name: 'head', underlay: true, children: head });

  // --- the hat: a wide brim and a tall cone whose tip hooks back and to her left (the same hat in every facing)
  const hb = at('head', 0.95, 0, 0, 0);
  const c1 = at('head', 1, -X(1), -X(0.8), X(7)), c2 = at('head', 1, -X(3.5), -X(2.6), X(12.5)), tip = at('head', 1, -X(8.5), -X(5.5), X(10.5));
  const cw = hw * 0.95, cone = `M${pt([hb[0] - cw, hb[1]])} Q${pt([c1[0] - X(1.6), c1[1]])} ${pt([c2[0] - X(0.6), c2[1] - X(0.6)])} L${pt(tip)} L${pt([c2[0] + X(0.8), c2[1] + X(0.9)])} Q${pt([c1[0] + X(1.6), c1[1] + X(0.4)])} ${pt([hb[0] + cw, hb[1]])} Z`;
  const hat = [
    { type: 'path', name: 'cone', d: cone, mat: pal.cloth, shade: 'flat', band: 1 },
    { type: 'ellipse', name: 'brim', cx: hb[0], cy: hb[1], rx: X(8.6) * (1 - 0.1 * side), ry: X(1.9), mat: pal.cloth, shade: 'flat', band: 2 },
  ];
  put(hD + 0.5, { type: 'group', name: 'hat', underlay: true, children: hat });

  // --- yarrow halo: seven dried stalks fanned out behind the hat, each ending in a flat umbel head
  const crown = [];
  for (let i = -3; i <= 3; i++) {
    const r = Math.abs(i), base = at('head', 0.8, -X(1), X(i * 0.6), 0);
    const tip2 = at('head', 0.8, X(i * 2.4) - X(2), X(i * 4.6), X(7.5 - r * r * 0.9 + (i === 1 ? 1 : i === -2 ? -1 : 0)));
    crown.push({ type: 'capsule', name: 'stalk', a: base, b: tip2, r: X(0.5), r1: X(0.45), mat: pal.grass, shade: 'flat', band: 2 });
    crown.push({ type: 'ellipse', name: 'umbel', cx: tip2[0], cy: tip2[1], rx: X(1.5), ry: X(0.9), mat: pal.grass, shade: 'flat', band: 0 });
  }
  put(front > -0.3 ? hD - 2 : hD + 0.2, { type: 'group', name: 'crown', underlay: true, children: crown });

  items.sort((a, b) => a.depth - b.depth || a.i - b.i).forEach(it => s.add(it.node));

  // --- decoration (S2), inside the line only: every mark is a decal on its part
  const decals = [], R = Math.round, one = v => Math.max(1, R(v));
  const strip = (x0, ya, x1, yb) => ({ type: 'poly', pts: [[x0, ya], [x0 + 1, ya], [x1 + 1, yb], [x1, yb]] });
  // skirt folds: a dark crease with a lit edge on its light (left) side, fanning from the hips to the hem
  for (const [i, u] of (profile ? [0.15] : [-0.4, 0.35]).entries()) {
    const xa = R(hip[0] + u * hpw * 0.8), ya = R(hip[1] + X(2.5)), xb = R(hemC + u * hemW * 0.7), yb = R(hemY - X(1));
    decals.push({ name: `fold${i}`, part: 'dress', mat: 'cloth', band: 2, shape: strip(xa, ya, xb, yb) });
    decals.push({ name: `fold-lit${i}`, part: 'dress', mat: 'cloth', band: 0, shape: strip(xa - 1, ya + X(1.5), xb - 1, yb) });
  }
  // the ragged hem is soiled: a dark band that follows its cut
  decals.push({ name: 'hem-soil', part: 'dress', mat: 'cloth', band: 2, shape: { type: 'poly', pts: [...hem.map(([x, y]) => [x, y]), ...hem.slice().reverse().map(([x, y]) => [x, y - X(2.5)])] } });
  // a leather sash at the waist; from the front a stomacher laced with metal down the bodice
  if (!profile) decals.push({ name: 'sash', part: 'dress', mat: 'leather', band: 2, shape: { type: 'rect', x: R(waist[0] - hpw - X(1)), y: R(waist[1] - X(0.4)), w: R(2 * (hpw + X(1))), h: one(X(2)) } });
  if (front > 0.3 && !profile) {
    decals.push({ name: 'stomacher', part: 'dress', mat: 'leather', band: 1, shape: { type: 'poly', pts: [[sh[0] - shw * 0.42, sh[1] + X(1.8)], [sh[0] + shw * 0.42, sh[1] + X(1.8)], [waist[0] + ww * 0.45, waist[1] - X(0.4)], [waist[0] - ww * 0.45, waist[1] - X(0.4)]] } });
    for (let k = 0; k < 3; k++) { const u = (k + 0.5) / 3, y = R(sh[1] + X(2.4) + (waist[1] - sh[1] - X(3)) * u), x = R(sh[0] + (waist[0] - sh[0]) * u); decals.push({ name: `lace${k}`, part: 'dress', mat: 'metal', band: 0, shape: { type: 'rect', x: x - 1, y, w: 2, h: 1 } }); }
  }
  // from behind, a hex sigil stitched between the shoulders, in the accent
  if (front < -0.3) {
    const c = at('spine', 0.4), r = X(2.2), hexPts = [0, 1, 2, 3, 4, 5].map(k => [c[0] + r * Math.cos(k * Math.PI / 3), c[1] + r * Math.sin(k * Math.PI / 3)]);
    decals.push({ name: 'sigil', part: 'dress', mat: 'accent', band: 1, shape: { type: 'poly', pts: hexPts } });
    decals.push({ name: 'sigil-eye', part: 'dress', mat: 'cloth', band: 2, shape: { type: 'rect', x: R(c[0]) - 1, y: R(c[1]), w: 2, h: 1 } });
  }
  // the hat's cone is lit along its left (light) edge; the hair has a lit strand on its left and a shadowed one on its right
  if (!(attack && f === 0 && side > 0.5)) decals.push({ name: 'cone-lit', part: 'cone', mat: 'cloth', band: 0, shape: strip(R(c2[0] - X(1)), R(c2[1] + X(0.5)), R(hb[0] - cw * 0.55), R(hb[1] - X(3.4))) });
  if (front < -0.3) decals.push({ name: 'hair-lit', part: 'hair', mat: 'hair', band: 0, shape: strip(R(htop[0] - hw * 0.55 + back), R(htop[1] + X(2)), R(hairB[0] - hairW * 0.55 + back), R(hairB[1])) });
  if (front < -0.3) decals.push({ name: 'hair-dark', part: 'hair', mat: 'hair', band: 2, shape: strip(R(htop[0] + hw * 0.45 + back), R(htop[1] + X(3)), R(hairB[0] + hairW * 0.45 + back), R(hairB[1])) });
  // the hat: an accent band above the brim with a metal hex clasp at the front
  decals.push({ name: 'hatband', part: 'cone', mat: 'accent', band: 1, shape: { type: 'rect', x: R(hb[0] - cw - X(1)), y: R(hb[1] - X(3.4)), w: R(2 * cw + X(2)), h: one(X(1.6)) } });
  const hatHidden = attack && f === 0 && side > 0.5; // wound back, the staff and arm cover the hat
  if (showFace && !hatHidden) decals.push({ name: 'clasp', part: 'cone', mat: 'metal', band: 0, shape: { type: 'rect', x: R(hb[0] + sx * cw * 0.35) - 1, y: R(hb[1] - X(3.4)), w: 2, h: one(X(1.6)) } });
  // the face: the brim's shadow over the brow, a thin mouth over the pointed chin
  if (showFace) {
    const fx = hc[0] + sx * hw * 0.45;
    decals.push({ name: 'brow-shadow', part: 'skull', mat: 'skin', band: 2, shape: { type: 'rect', x: R(hc[0] - hw), y: R(hc[1] + hh * 0.05 - X(1.8)) - 1, w: R(2 * hw), h: 1 } });
    decals.push({ name: 'mouth', part: ['chin', 'skull'], mat: 'skin', band: 2, shape: { type: 'rect', x: R(fx + sx * X(0.6) - X(0.8)), y: R(hc[1] + hh * 0.36), w: one(X(1.6)), h: 1 } });
  }
  // the staff: two knots in the shaft; the hex ring lit on its upper left, flaring to glow (a white-hot metal glint on its upper left) on the held hit frame
  for (const [i, k] of [-down * 0.5].entries()) { if (attack || Math.abs(k) < X(3)) continue; const q = S3(k); decals.push({ name: `knot${i}`, part: 'staff', mat: 'leather', band: 2, shape: { type: 'rect', x: R(q[0]) - 1, y: R(q[1]) - 1, w: 2, h: 2 } }); }
  const rr = X(2.6) + X(1.2);
  const ul = { type: 'poly', pts: [[ringC[0] - rr, ringC[1] + X(0.5)], [ringC[0] - rr, ringC[1] - rr], [ringC[0] + X(0.5), ringC[1] - rr], [ringC[0] + X(0.5), ringC[1] + X(0.5)]] };
  if (attack && f === 2) {
    decals.push({ name: 'ring-flare', part: 'hex-ring', mat: 'glow', band: 1, shape: { type: 'circle', cx: ringC[0], cy: ringC[1], r: rr } });
    decals.push({ name: 'ring-flare-hot', part: 'hex-ring', mat: 'metal', band: 0, shape: ul });
  } else decals.push({ name: 'ring-lit', part: 'hex-ring', mat: 'metal', band: 0, shape: ul });

  let pr = ctx.lib.proc(s).add('ao', { part: 'dress' }).add('materialNoise', { part: 'dress', amount: 0.08, scale: 3, seed: ctx.variant ?? 0 });
  for (const d of decals) pr = pr.add('decal', d);
  return pr.render();
}

export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P) };
  const hc = L.P.at('head', 0.5);
  a.head = [Math.round(hc[0]), Math.round(hc[1])];
  delete a.ground;
  return a;
};
