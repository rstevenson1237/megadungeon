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
export const meta = { brief: 'boss-the-bone-regent', pass: 'r1', notes: 'shape draft: spiked crown, skull pauldrons, barrel ribcage, ragged cloak, bone maul', recolour: 'cloth' };

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

  // ---- the ragged cloak: from the shoulders, behind the back, flaring to a jagged hem near the ankles
  const cloak = () => {
    // two halves (one path, wound the same way on screen) so the cape has depth in profile: its edges hang close behind the shoulders
    // and its middle bellies out behind and flares backward to the hem
    const fl = 13, hemUp = -22, sway = wob * 1.2;
    const cuts = [1, 0.75, 0.5, 0.25, 0], dips = [0, 2.8, 0.6, 3.4, 1.2];
    const hemF = c => -3 - 9 * (1 - c) - sway * (1 - c);
    const halfOf = sg => {
      const list = [
        at('spine', 1, -2.5, 0), at('spine', 0.95, -1.8, sg * 7.5), at('spine', 0.5, -2.5, sg * 10), at('spine', 0, -3, sg * (fl - 1)),
        ...cuts.map((c, i) => at('spine', 0, hemF(c), sg * c * fl, hemUp - dips[i] + (1 - c) * 1.5)),
        at('spine', 0.1, -8.5 - sway * 0.6, 0), at('spine', 0.6, -6, 0),
      ];
      return sg > 0 || Math.abs(front) < 0.5 ? list : list.reverse();
    };
    s.add({ type: 'path', name: 'cloak', underlay: true, mat: pal.accent, shade: 'normal', round: X(2), d: `${poly(halfOf(1))} ${poly(halfOf(-1))}` });
  };

  // ---- limbs: tapered bone segments with knob joints
  const legs = names => names.forEach(n => {
    const lo = n.replace('_up', '_lo');
    const sg = n[3] === 'R' ? 1 : -1, hipP = P.start(n), knee = P.at(n, 1, X(0.6), X(sg * 1.4)), ank = P.end(lo), toe = P.at(lo, 1, X(3.6), X(sg * 0.6), X(0.4));
    s.add({ type: 'group', name: 'leg', underlay: true, mat: bone, shade: 'cyl', children: [
      { type: 'capsule', name: 'thigh', a: hipP, b: knee, r: X(2.5), r1: X(1.7) },
      { type: 'capsule', name: 'shin', a: knee, b: ank, r: X(1.8), r1: X(1.2) },
      { type: 'circle', name: 'knee', cx: knee[0], cy: knee[1], r: X(2.2), shade: 'sphere' },
      { type: 'capsule', name: 'foot', a: [ank[0], ank[1] - X(0.6)], b: toe, r: X(1.6), r1: X(1.2), shade: 'sphere' },
    ] });
  });
  const arm = c => {
    const sg = c === 'R' ? 1 : -1, sh = P.start(`arm${c}_up`), el = P.at(`arm${c}_up`, 1, 0, X(sg * 2.6)), hd = P.end(`arm${c}_lo`);
    s.add({ type: 'group', name: 'arm', underlay: true, mat: bone, shade: 'cyl', children: [
      { type: 'capsule', name: 'upper-arm', a: sh, b: el, r: X(2.2), r1: X(1.6) },
      { type: 'capsule', name: 'forearm', a: el, b: hd, r: X(1.7), r1: X(1.3) },
      { type: 'circle', name: 'elbow', cx: el[0], cy: el[1], r: X(2), shade: 'sphere' },
      { type: 'circle', name: 'hand', cx: hd[0], cy: hd[1], r: X(2.4), shade: 'sphere' },
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
  };

  // ---- the torso: pelvis bowl, a bare spine, a barrel ribcage widest at the chest, the bone mantle on the shoulders
  const torso = () => {
    const pel = at('spine', 0.02, 0.4), chestTop = 0.98, ribLo = 0.4;
    s.add({ type: 'ellipse', name: 'pelvis', underlay: true, cx: pel[0], cy: pel[1] + X(0.6), rx: half(5.6, 3.6), ry: X(3), mat: bone, shade: 'sphere' });
    s.add({ type: 'capsule', name: 'spine', underlay: true, a: at('spine', 0.05, -0.6), b: at('spine', ribLo + 0.1, -0.6), r: X(1.7), mat: bone, shade: 'cyl' });
    // barrel: half-width (side) and depth (fore-aft) by height up the spine, its centre pushed forward at the chest
    const prof = [[ribLo, 5, 3.8, 0.6], [0.55, 7.8, 5.4, 1.6], [0.72, 9, 6.2, 2.2], [0.86, 8.8, 5.8, 1.8], [chestTop, 6.6, 4.4, 0.6]];
    const R = [], Lf = [];
    for (const [u, ws, wd, f] of prof) {
      const c = at('spine', u, f), hw = half(ws, wd);
      R.push([c[0] + hw, c[1]]); Lf.push([c[0] - hw, c[1]]);
    }
    const bot = at('spine', ribLo - 0.06, 0.6), topc = at('spine', chestTop + 0.05, 0.2);
    s.add({ type: 'path', name: 'ribcage', underlay: true, mat: bone, shade: 'normal', round: X(3),
      d: smooth([bot, ...R, topc, ...Lf.reverse()]) });
    // the mantle: a bone collar across the shoulders, round skull pauldrons on each
    const nk = P.start('neck');
    s.add({ type: 'ellipse', name: 'mantle', underlay: true, cx: nk[0], cy: nk[1] + X(1.2), rx: half(10, 5.5), ry: X(3), mat: bone, shade: 'sphere' });
  };
  const pauldron = c => {
    const p = P.at(`arm${c}_up`, 0.05, 0, 0, X(0.8));
    s.add({ type: 'ellipse', name: 'pauldron', underlay: true, cx: p[0], cy: p[1], rx: X(4.4), ry: X(3.8), mat: bone, shade: 'sphere' });
  };

  // ---- the skull with a heavy jaw, the neck vertebrae and the spiked crown (the same in every facing)
  const head = () => {
    const nk0 = P.start('neck'), nk1 = P.end('neck');
    s.add({ type: 'capsule', name: 'neck', underlay: true, a: nk0, b: nk1, r: X(1.3), mat: bone, shade: 'cyl' });
    const jaw = at('head', 0.12, 1.6 + 0.4 * side), jr = half(2.9, 2.4);
    s.add({ type: 'group', name: 'skull', underlay: true, mat: bone, children: [
      { type: 'ellipse', name: 'jaw', cx: jaw[0], cy: jaw[1], rx: Math.max(X(2.4), jr), ry: X(2.3), shade: 'sphere' },
      { type: 'circle', name: 'cranium', cx: cran[0], cy: cran[1], r: rC, shade: 'sphere' },
    ] });
    if (front > -0.3) {
      // dark sockets on the face side: both from the front, the near one in profile; teeth across the jaw
      const eyes = profile ? [0] : [-1, 1];
      for (const e of eyes) {
        const p = at('head', 0.5, rC / L.k * 0.85, profile ? 0 : e * 1.7);
        s.add({ type: 'rect', name: 'socket', x: Math.round(p[0] - X(0.9)), y: Math.round(p[1] - X(0.7)), w: Math.max(1, Math.round(X(1.8))), h: Math.max(1, Math.round(X(1.6))), color: 'outline' });
      }
      const tj = at('head', 0.08, 2.6 + 0.6 * side);
      s.add({ type: 'rect', name: 'teeth', x: Math.round(tj[0] - (profile ? X(0.8) : X(1.8))), y: Math.round(tj[1]), w: Math.max(1, Math.round(profile ? X(1.6) : X(3.6))), h: 1, color: 'outline' });
    }
    // the crown: a band on the brow and five spikes, tallest in the middle
    const cw = rC * 1.0, by = cran[1] - rC * 0.45, bh = X(2.2), hts = [3.2, 5.2, 7.4, 5.2, 3.2].map(X);
    const xs = [-1, -0.5, 0, 0.5, 1].map(f => cran[0] + f * cw);
    const crown = [[cran[0] - cw - X(0.6), by + bh]];
    xs.forEach((x, i) => {
      const gap = i ? (xs[i - 1] + x) / 2 : null;
      if (gap !== null) crown.push([gap, by - X(0.4)]);
      crown.push([x - X(0.25), by - hts[i]], [x + X(0.25), by - hts[i]]);
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
  return ctx.lib.proc(s).add('groundShadow', {}).render();
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
