// boss-hexmother-yarrow base.v1 (r1) SHAPE DRAFT: Hexmother Yarrow, the violet witch-mother of the wizards' sanctum, a
// unique boss of family h (the hooded cultist) drawn at 4 m (64 px) in the 64 x 80 large frame. Silhouette and form only,
// in flat materials: no proc layers, no texture, no decals.
// What reads from the silhouette: a tall, hunched crone with a rounded hump between the shoulders and her head thrust
// forward on a long neck under a peaked shawl-hood (the family's hood); a crown of dried yarrow stalks fanning up out of
// the hood, each stalk ending in a flat umbel head; a pear-shaped robe flaring to a ragged, uneven hem; long tapered arms
// bent at the elbow, ragged sleeves, a clawed off hand spread to cast; and a tall crooked staff, forked at the top, with a
// ring-shaped hex charm hanging in the fork. The attack swings the staff overhead and down in an arc along the forearm,
// held on the contact frame.
// Built on the shared biped rig (`ctx.lib.rigs.body`), bone lengths fixed per asset: the hunch is the rig's own clip
// angles plus a fixed forward bend of spine and neck, so every facing (s, se, e, ne, n; west mirrored) shows the same
// hump and head, and the body turns with the rig's yaw. Colours are ramps from ctx.dir (R11); the robe and hood are the
// cloth ramp, the family-h recolour ramp, so the row's violet dresses her.
export const meta = { brief: 'boss-hexmother-yarrow', pass: 'r1', notes: 'shape draft: hunched crone, yarrow-stalk crown, crooked forked staff with hex ring', recolour: 'cloth' };

export const params = {};

const HUNCH = -8, NECK = -50, HEAD = 46; // fixed forward bend (degrees) added to the rig's clip angles

function layout(ctx) {
  const [w, h] = ctx.size, X = v => (v * w) / 64, metre = ctx.dir.scale.metre ?? 16, hr = ctx.dir.scale.proportions?.headRatio ?? 0.32;
  const ground = h - 1, H = Math.round(4 * metre * 0.95);
  const rig = ctx.lib.rigs.body('biped', ctx, { ground, height: H, proportions: { head: hr * 0.74, neck: 0.11, spine: 0.33, armSep: 0.14 } });
  const P0 = rig.pose(ctx.state, ctx.t), a0 = P0.angles;
  const P = rig.pose(ctx.state, ctx.t, { angles: { spine: (a0.spine ?? 0) + HUNCH, neck: (a0.neck ?? 0) + NECK, head: (a0.head ?? 0) + HEAD } });
  const { sx, front, side } = rig, profile = side > 0.9;
  return { w, h, X, rig, P, sx, front, side, profile, ground, H };
}

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx);
  const { X, P: pose, sx, front, side, profile, ground, H } = L;
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
  const narrow = 1 - 0.25 * side; // the body is thinner seen side on

  // --- robe: pear-shaped, narrow at the shoulders, wide at the hips, flaring to a ragged uneven hem
  const sh = at('spine', 0.92), waist = at('spine', 0.35), hip = at('hip', 0), mid = at('spine', 0);
  const feet = ['legL_lo', 'legR_lo'].map(n => pose.end(n));
  const sway = ((feet[0][0] + feet[1][0]) / 2 - hip[0]) * 0.35;
  const hemY = ground - X(2), hemC = hip[0] + sway + sx * X(1.5);
  const ws = X(3.6) * narrow, ww = X(6.8) * narrow, wh = X(12) * (1 - 0.22 * side);
  // ragged hem: an uneven run of tatters, longer on the side away from the light
  const rag = [0, 2.2, 0.6, 3, 0.8, 2.4, 0.2, 1.6, 0.4, 2.8, 0];
  const hem = rag.map((r, i) => { const u = i / (rag.length - 1); return [hemC + wh * (1 - 2 * u) * (i % 2 ? 0.96 : 1), hemY - X(3) + X(r) + X(0.8) * u]; });
  const robe = [
    [sh[0] - ws, sh[1] + X(1)], [sh[0], sh[1] - X(1.2)], [sh[0] + ws, sh[1] + X(1)],
    [waist[0] + ww, waist[1]], [mid[0] + ww * 1.35, mid[1] + X(5)], [hemC + wh * 1.05, hemY - X(2.5)],
  ];
  const robeD = `M${pt(robe[0])} Q${pt(robe[1])} ${pt(robe[2])} Q${pt([waist[0] + ww * 0.95, (sh[1] + waist[1]) / 2])} ${pt(robe[3])} Q${pt(robe[4])} ${pt(robe[5])} L${hem.map(pt).join(' L')} L${pt([hemC - wh * 1.05, hemY - X(2.5)])} Q${pt([mid[0] - ww * 1.35, mid[1] + X(5)])} ${pt([waist[0] - ww, waist[1]])} Q${pt([waist[0] - ww * 0.95, (sh[1] + waist[1]) / 2])} ${pt(robe[0])} Z`;
  put(D('spine'), { type: 'path', name: 'robe', underlay: true, d: robeD, mat: pal.cloth, shade: 'flat', band: 1 });

  // --- the hump: a round mass on the upper back, the same in every facing (a point behind the spine, projected)
  const humpC = at('spine', 1, -X(3.4), 0, X(0.5)), humpR = X(5.8);
  put(D('spine', -X(4.2)), { type: 'ellipse', name: 'hump', underlay: true, cx: humpC[0], cy: humpC[1], rx: humpR * (1 - 0.12 * side) + X(1.2) * (1 - side), ry: humpR * 0.95, mat: pal.cloth, shade: 'flat', band: 1 });

  // --- feet: pointed shoes peeking out under the hem
  for (const n of ['legL_lo', 'legR_lo']) {
    const e = pose.end(n), toe = pose.at(n, 1, X(3), 0, 0);
    put(D(n) - 0.2, { type: 'path', name: 'foot', underlay: true, d: smooth([[e[0] - X(1.6), ground - X(0.2)], [e[0] - X(1.2), ground - X(2.4)], [toe[0], ground - X(1.6)], [toe[0] + (toe[0] - e[0]) * 0.3, ground - X(0.2)]]), mat: pal.leather, shade: 'flat', band: 2 });
  }

  // --- arms: long and tapered, bent at the elbow, a ragged sleeve hanging from the upper arm
  const arm = (k, claws) => {
    const a = pose.start(`arm${k}_up`), e = pose.end(`arm${k}_up`), hnd = pose.end(`arm${k}_lo`), dep = D(`arm${k}_up`) + 0.5;
    const kids = [
      { type: 'capsule', name: 'upper-arm', a, b: e, r: X(2.1), r1: X(1.6), mat: pal.cloth, shade: 'flat', band: 1 },
      { type: 'path', name: 'sleeve', d: smooth([a, [e[0] + (e[0] - a[0]) * 0.15 - X(1.8), e[1] + X(1.5)], [e[0] + (e[0] - a[0]) * 0.15, e[1] + X(4.5)], [e[0] + X(1.8), e[1] + X(1)]]), mat: pal.cloth, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'forearm', a: e, b: hnd, r: X(1.3), r1: X(0.9), mat: pal.skin, shade: 'flat', band: 1 },
      { type: 'circle', name: 'hand', cx: hnd[0], cy: hnd[1], r: X(1.4), mat: pal.skin, shade: 'flat', band: 1 },
    ];
    if (claws) {
      const dx = hnd[0] - e[0], dy = hnd[1] - e[1], l = Math.hypot(dx, dy) || 1, d = [dx / l, dy / l];
      for (const t of [-0.75, 0, 0.75]) {
        const c = Math.cos(t), sn = Math.sin(t), dd = [d[0] * c - d[1] * sn, d[0] * sn + d[1] * c];
        kids.push({ type: 'capsule', name: 'claw', a: hnd, b: [hnd[0] + dd[0] * X(3.6), hnd[1] + dd[1] * X(3.6)], r: X(0.6), r1: X(0.35), mat: pal.skin, shade: 'flat', band: 1 });
      }
    }
    put(dep, { type: 'group', name: `arm${k}`, underlay: true, children: kids });
  };
  arm('L', true);
  arm('R', false);

  // --- the staff: tall, crooked, forked at the top with a hex ring hanging in the fork; in the right hand
  // at rest the staff stands just outside the hand (beside the body in front and back views, ahead of it side on)
  const elbow = pose.end('armR_up'), hand0 = pose.end('armR_lo'), hand = ctx.state === 'attack' ? hand0 : pose.at('armR_lo', 1, X(1.5 + 3.5 * side), X(2.2), 0);
  const swing = ctx.state === 'attack';
  let dir = [0, -1];
  if (swing) { const dx = hand[0] - elbow[0], dy = hand[1] - elbow[1], l = Math.hypot(dx, dy) || 1; dir = [dx / l, dy / l]; }
  else { const lean = profile ? 0.12 : sx * 0.05; dir = [lean, -1]; const l = Math.hypot(...dir); dir = [dir[0] / l, dir[1] / l]; }
  const SL = H * 0.95; let up; const down = swing ? SL * 0.14 : Math.max(0, ground - X(0.5) - hand[1]); up = swing ? SL * 0.42 : SL - down;
  // the swing keeps the staff head inside the frame
  const room = Math.min(dir[1] < 0 ? (hand[1] - X(4)) / -dir[1] : 1e9, dir[0] < 0 ? (hand[0] - X(3)) / -dir[0] : dir[0] > 0 ? (L.w - X(3) - hand[0]) / dir[0] : 1e9);
  if (swing) up = Math.max(X(8), Math.min(up, room));
  const nrm = [-dir[1], dir[0]], S = (k, m = 0) => [hand[0] + dir[0] * k + nrm[0] * m, hand[1] + dir[1] * k + nrm[1] * m];
  const bend = [[-down, 0], [-down * 0.45, X(0.9)], [up * 0.25, -X(0.6)], [up * 0.62, X(1)], [up * 0.86, 0]];
  const staff = [];
  for (let i = 0; i < bend.length - 1; i++) if (bend[i + 1][0] - bend[i][0] > 0.5) staff.push({ type: 'capsule', name: 'staff', a: S(...bend[i]), b: S(...bend[i + 1]), r: X(i ? 1.05 : 0.9), r1: X(1.05), mat: pal.leather, shade: 'flat', band: 1 });
  const fork = S(up * 0.86, 0);
  staff.push({ type: 'capsule', name: 'tine', a: fork, b: S(up, -X(3.2)), r: X(0.95), r1: X(0.55), mat: pal.leather, shade: 'flat', band: 1 });
  staff.push({ type: 'capsule', name: 'tine', a: fork, b: S(up * 1.02, X(2.6)), r: X(0.95), r1: X(0.55), mat: pal.leather, shade: 'flat', band: 1 });
  // the hex charm: a ring hanging on a cord from the fork, always straight down
  const top = S(up * 0.97, 0), ringC = [top[0], top[1] + X(swing ? 4.2 : 5.4)];
  staff.push({ type: 'capsule', name: 'cord', a: top, b: [ringC[0], ringC[1] - X(2.6)], r: X(0.45), mat: pal.leather, shade: 'flat', band: 2 });
  staff.push({ type: 'arc', name: 'hex-ring', cx: ringC[0], cy: ringC[1], r: X(2.8), w: Math.max(1, X(1.3)), a0: 0, a1: 360, mat: pal.metal, shade: 'flat', band: 1 });
  staff.push({ type: 'capsule', name: 'tassel', a: [ringC[0], ringC[1] + X(2.8)], b: [ringC[0], ringC[1] + X(5)], r: X(0.6), r1: X(0.3), mat: pal.leather, shade: 'flat', band: 2 });
  put(D('armR_lo') + 0.4, { type: 'group', name: 'staff', underlay: true, children: staff });

  // --- head thrust forward on a long neck, under the family's hood (a round cowl draped back onto the hump),
  // with the yarrow crown fanned up out of it
  const nk0 = pose.start('neck'), nk1 = pose.end('neck'), hc = at('head', 0.45), htop = at('head', 1);
  const hw = X(4) * (1 - 0.1 * side), hh = pose.bone('head').len, hD = D('head') + 1;
  const showFace = front > -0.3, fsx = sx; // the face slides toward the facing side and is hidden from behind
  const head = [{ type: 'capsule', name: 'neck', a: nk0, b: nk1, r: X(2.4), r1: X(2), mat: pal.cloth, shade: 'flat', band: 1 }];
  const nape = at('head', 0.3, -X(3.2), 0, 0), drape = at('spine', 0.95, -X(3.5), 0, X(1));
  const hoodPts = [
    [hc[0] - hw - X(0.6), hc[1] + hh * 0.35], [hc[0] - hw - X(0.4), hc[1] - hh * 0.35], [htop[0] - hw * 0.55, htop[1] - X(0.6)],
    [htop[0] + hw * 0.55, htop[1] - X(0.6)], [hc[0] + hw + X(0.4), hc[1] - hh * 0.35], [hc[0] + hw + X(0.6), hc[1] + hh * 0.35],
    [(nape[0] + drape[0]) / 2 + sx * 0 + X(1.5) * (1 - side), drape[1] - X(1)], [(nape[0] + drape[0]) / 2 - X(1.5) * (1 - side), drape[1] - X(1)],
  ];
  head.push({ type: 'path', name: 'hood', d: smooth(hoodPts), mat: pal.cloth, shade: 'flat', band: 1 });
  if (showFace) {
    // a long gaunt face deep in the hood, a pointed chin; side on, a hooked nose and the chin jut past the hood's rim
    const fx = hc[0] + fsx * hw * 0.45, fw = hw * (0.6 - 0.25 * side), ft = hc[1] - hh * 0.22, fb = hc[1] + hh * 0.62;
    const chinX = fx + fsx * X(1.8);
    head.push({ type: 'path', name: 'face', d: smooth([[fx - fw, ft + X(0.6)], [fx, ft - X(0.4)], [fx + fw, ft + X(0.6)], [fx + fw * 0.8, hc[1] + hh * 0.3], [chinX + X(0.7), fb], [chinX - X(0.7), fb], [fx - fw * 0.8, hc[1] + hh * 0.3]]), mat: pal.skin, shade: 'flat', band: 1 });
    const noseY = hc[1] + hh * 0.12;
    if (side > 0.3) head.push({ type: 'path', name: 'nose', d: poly([[fx + fsx * fw * 0.6, noseY - X(2)], [fx + fsx * (fw + X(3)), noseY + X(1.8)], [fx + fsx * fw * 0.7, noseY + X(1.3)]]), mat: pal.skin, shade: 'flat', band: 1 });
    else head.push({ type: 'rect', name: 'nose', x: Math.round(fx), y: Math.round(noseY - X(1)), w: Math.max(1, Math.round(X(1))), h: Math.max(1, Math.round(X(2.5))), mat: pal.skin, shade: 'flat', band: 2 });
    const eyes = profile ? [fx + fsx * fw * 0.3] : [fx - fw * 0.5, fx + fw * 0.3];
    for (const ex of eyes) head.push({ type: 'rect', name: 'eye', x: Math.round(ex), y: Math.round(noseY - X(2.2)), w: Math.max(1, Math.round(X(1.4))), h: 1, color: 'outline' });
  }
  // yarrow crown: seven dried stalks fanned wide out of the hood's crown like a halo, each ending in a flat umbel head
  const crown = [];
  for (let i = -3; i <= 3; i++) {
    const r = Math.abs(i), base = at('head', 0.9, -X(0.8), X(i * 0.8), 0);
    const tip = at('head', 0.9, X(i * 2.6) - X(1.5), X(i * 3.8), X(12 - r * r * 1.1 + (i === 1 ? 1 : i === -2 ? -1 : 0)));
    crown.push({ type: 'capsule', name: 'stalk', a: base, b: tip, r: X(0.5), r1: X(0.45), mat: pal.grass, shade: 'flat', band: 2 });
    crown.push({ type: 'ellipse', name: 'umbel', cx: tip[0], cy: tip[1], rx: X(1.5), ry: X(0.9), mat: pal.grass, shade: 'flat', band: 1 });
  }
  put(hD - 0.5, { type: 'group', name: 'crown', underlay: true, children: crown });
  put(hD, { type: 'group', name: 'head', underlay: true, children: head });

  items.sort((a, b) => a.depth - b.depth || a.i - b.i).forEach(it => s.add(it.node));
  return s.render();
}

export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P) };
  const hc = L.P.at('head', 0.5);
  a.head = [Math.round(hc[0]), Math.round(hc[1])];
  delete a.ground;
  return a;
};
