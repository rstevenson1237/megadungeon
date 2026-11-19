// boss-hrolf-the-hammerlord base.v1 (r1, SHAPE DRAFT) — Hrolf the Hammerlord, a unique brute boss of the giant family
// (family-g-cap, glyph G, colour rust, tags giant, the dwarven hold), 5.8 m (about 93 px, 2.5x the drawn player) in the
// 96 x 128 frame, on the shared biped rig (`ctx.lib.rigs.body`, from the iso walker template; bone lengths fixed for the
// asset, proportions set once for a heavy giant: wide stance, broad shoulders, thick limbs). Silhouette and form only,
// flat materials, no proc layers but the ground shadow.
// From the family: the giant's egg head with a heavy brow and long beard, bare thick arms bent at the elbow, a belted
// tunic over long legs with wrapped calves. What makes him Hrolf: a colossal war hammer (a long haft and a flared
// iron head as big as his chest) resting on his right shoulder, its head beside his crown, swung one-handed in a
// wide arc over the shoulder and down to the ground ahead (held contact frame); a low iron crown with blunt points; a
// shaggy grey pelt mantle (stone ramp) over hunched shoulders and a heavy cloak flaring to a ragged hem at the calves; a barrel chest
// tapering to a broad belt and a flared, uneven kilt; a long beard forked in two braids. Body ramp: leather (the
// family's recolour ramp, rust). Planned bright accent for v2: glowing runes (glow) on the hammer's striking faces.
export const meta = { brief: 'boss-hrolf-the-hammerlord', pass: 'r1', notes: 'shape draft: crowned giant king, fur mantle and flared cloak, colossal war hammer on the shoulder, one-armed overhead smash, off arm braced', recolour: 'leather' };

const HM = 5.8;

// Attack: per logical frame, the hands' target in the rig plane (fwd, down from the hip; px in design units) and the
// hammer's direction (angle in the fwd/up plane from straight up, toward fwd positive) and its sideways lean (front views).
const ATTACK = [
  { hand: [-4, -30], ang: -125, lean: 0.55 }, // anticipation: wound back over the right shoulder, head behind him
  { hand: [4, -33], ang: 15, lean: 0.25 },    // swing: overhead, the head high above
  { hand: [3, 0], ang: 120, lean: -0.6 },  // contact (held): smashed down to the ground ahead
  { hand: [3, 2], ang: 124, lean: -0.5 },   // recovery: head resting on the ground
];

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, k = (HM * metre) / 61, X = v => v * k;
  const ground = h - 1;
  const rig = ctx.lib.rigs.body('biped', ctx, {
    ground, height: Math.round(HM * metre * 0.84),
    proportions: { hip: 0.02, spine: 0.30, neck: 0.05, head: 0.15, leg_up: 0.22, leg_lo: 0.22, arm_up: 0.2, arm_lo: 0.19, shoulder: 0.9, legSep: 0.1, armSep: 0.25 },
  });
  const P0 = rig.pose(ctx.state, ctx.t), A = P0.angles, atk = ctx.state === 'attack', f = (ctx.logical ?? ctx.frame) % 4;
  // a giant's hunch (spine forward, head lifted back), the off arm bent at the elbow; the hammer arm by IK: on the
  // shoulder at rest, the fist in the attack's arc; the off arm braced, bent. Same offsets in every frame, so bone lengths never change.
  const ik = {};
  let hdir = null;
  if (atk) {
    const a = ATTACK[f];
    ik.armR_lo = { target: [X(a.hand[0]), X(a.hand[1])], bend: 1 };
    hdir = a;
  } else {
    const bob = ctx.state === 'walk' ? Math.sin(ctx.t * Math.PI * 2) * X(0.8) : 0;
    ik.armR_lo = { target: [X(5), X(-10) + bob], bend: -1 };
  }
  const P = rig.pose(ctx.state, ctx.t, { angles: {
    spine: (A.spine ?? 0) - 7, neck: (A.neck ?? 0) + 3, head: (A.head ?? 0) + 4,
    armL_up: (A.armL_up ?? 180) + (atk ? 20 : 8), armL_lo: (A.armL_lo ?? 0) + (atk ? 40 : 24),
  }, ik });
  const { sx, front, side } = rig, profile = side > 0.9;
  const hd0 = P.start('head'), hd1 = P.end('head'), headLen = Math.hypot(hd1[0] - hd0[0], hd1[1] - hd0[1]);
  const rC = headLen * 0.66, cran = P.at('head', 0.6), hand = P.end('armR_lo');
  return { w, h, X, k, rig, P, sx, front, side, profile, ground, headLen, rC, cran, hand, hdir, atk, f };
}

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx);
  const { X, P, sx, front, side, profile, rC, cran, hand } = L;
  const hide = pal.leather, skin = pal.skin, fur = pal.hair, iron = pal.metal;
  const at = (n, u, f = 0, sd = 0, up = 0) => P.at(n, u, X(f), X(sd), X(up));
  const pts = list => list.map(p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`);
  const poly = list => { const q = pts(list); return `M${q[0]} ${q.slice(1).map(v => `L${v}`).join(' ')} Z`; };
  const wob = ctx.state === 'walk' ? Math.sin(ctx.t * Math.PI * 2) : ctx.state === 'attack' ? -0.6 : 0;
  // screen half-width of a body cross-section `ws` wide (side to side) and `wd` deep, as the rig turns
  const half = (ws, wd) => Math.hypot(X(ws) * front, X(wd) * sx);
  const backView = front < -0.3;

  // ---- the heavy cloak: from the shoulders, behind the back, flaring wide to a ragged hem at the calves
  const cloak = () => {
    const fl = 15, hemUp = -21, sway = wob * 1.4;
    const cuts = [1, 0.8, 0.6, 0.4, 0.2, 0], dips = [0, 3.5, 0.5, 4.5, 1, 3];
    const hemF = c => -4 - 9 * (1 - c) - sway * (1 - c);
    const halfOf = sg => {
      const list = [
        at('spine', 1, -3.5, 0), at('spine', 0.98, -3, sg * 9.5), at('spine', 0.6, -4, sg * 10.5), at('spine', 0.1, -4.5, sg * (fl - 2)),
        ...cuts.map((c, i) => at('spine', 0, hemF(c), sg * c * fl, hemUp - dips[i] + (1 - c) * 2)),
        at('spine', 0.1, -6.5 - sway * 0.6, 0), at('spine', 0.6, -5.5, 0),
      ];
      return sg > 0 || Math.abs(front) < 0.5 ? list : list.reverse();
    };
    s.add({ type: 'path', name: 'cloak', underlay: true, mat: hide, shade: 'normal', round: X(2), d: `${poly(halfOf(1))} ${poly(halfOf(-1))}` });
  };

  // ---- legs: thick tapered thighs, a knee, wrapped calves, heavy boots
  const legs = names => names.forEach(n => {
    const lo = n.replace('_up', '_lo'), sg = n[3] === 'R' ? 1 : -1;
    const hipP = P.start(n), knee = P.at(n, 1, X(0.8), X(sg * 1)), ank = P.end(lo), toe = P.at(lo, 1, X(4.2), X(sg * 0.8), X(0.6));
    s.add({ type: 'group', name: 'leg', underlay: true, shade: 'cyl', children: [
      { type: 'capsule', name: 'thigh', a: hipP, b: knee, r: X(3.6), r1: X(2.6), mat: skin },
      { type: 'capsule', name: 'shin', a: knee, b: ank, r: X(2.8), r1: X(2.0), mat: hide },
      { type: 'circle', name: 'knee', cx: knee[0], cy: knee[1], r: X(2.7), mat: skin, shade: 'sphere' },
      { type: 'capsule', name: 'boot', a: [ank[0], ank[1] - X(1.2)], b: toe, r: X(2.6), r1: X(1.9), mat: hide, shade: 'sphere' },
    ] });
  });

  // ---- arms: thick bare arms, a bulging upper arm, an elbow, an iron bracer on the forearm, a big fist
  const arm = c => {
    const sg = c === 'R' ? 1 : -1, sh = P.start(`arm${c}_up`), el = P.end(`arm${c}_up`), hd = P.end(`arm${c}_lo`);
    const fa = P.at(`arm${c}_lo`, 0.35), fb = P.at(`arm${c}_lo`, 0.82);
    s.add({ type: 'group', name: 'arm', underlay: true, shade: 'cyl', children: [
      { type: 'capsule', name: 'upper-arm', a: sh, b: el, r: X(3.1), r1: X(2.4), mat: skin },
      { type: 'capsule', name: 'forearm', a: el, b: hd, r: X(2.5), r1: X(2.0), mat: skin },
      { type: 'circle', name: 'elbow', cx: el[0], cy: el[1], r: X(2.4), mat: skin, shade: 'sphere' },
      { type: 'capsule', name: 'bracer', a: fa, b: fb, r: X(2.7), mat: iron },
      { type: 'circle', name: 'fist', cx: hd[0], cy: hd[1], r: X(2.6), mat: skin, shade: 'sphere' },
    ] });
    void sg;
  };

  // ---- the colossal war hammer: a long haft from the fist, a flared iron head across its top
  const hammer = () => {
    // direction in the rig's 3D frame (fwd, side, up): on the shoulder at rest, the attack's arc otherwise
    let dir;
    if (L.atk) {
      const r = L.hdir.ang * Math.PI / 180;
      dir = [Math.sin(r), L.hdir.lean, Math.cos(r)];
    } else dir = [-0.75, 0.4, 0.62];
    { const m = Math.hypot(...dir); dir = dir.map(v => v / m); }
    const off = (u, perp = 0) => {
      // a point `u` design units along the haft from the fist, `perp` across it (in the fwd/up plane)
      const pf = dir[2], pu = -dir[0];
      return P.at('armR_lo', 1, X(dir[0] * u + pf * perp), X(dir[1] * u), X(dir[2] * u + pu * perp));
    };
    const len = 23, butt = off(-6), top = off(len);
    // the head in screen space, across the haft as it shows on screen: two flared striking faces on a thick iron block
    const dx = top[0] - butt[0], dy = top[1] - butt[1], l = Math.hypot(dx, dy) || 1, d = [dx / l, dy / l], nn = [-d[1], d[0]];
    const hp = (t, c) => [top[0] + d[0] * X(t) + nn[0] * X(c), top[1] + d[1] * X(t) + nn[1] * X(c)];
    const outline = [[-5.6, -9.5], [5.6, -9.5], [5.6, -7], [4.2, -5.6], [4.6, 0], [4.2, 5.6], [5.6, 7], [5.6, 9.5], [-5.6, 9.5], [-5.6, 7], [-4.2, 5.6], [-4.6, 0], [-4.2, -5.6], [-5.6, -7]];
    s.add({ type: 'group', name: 'hammer', underlay: true, children: [
      { type: 'capsule', name: 'haft', a: butt, b: hp(-2, 0), r: X(1.4), mat: pal.hair, shade: 'cyl' },
      { type: 'circle', name: 'pommel', cx: butt[0], cy: butt[1], r: X(1.9), mat: iron, shade: 'sphere' },
      { type: 'path', name: 'hammer-head', mat: iron, shade: 'normal', round: X(1.2), d: poly(outline.map(([t, c]) => hp(t, c))) },
      { type: 'path', name: 'hammer-spike', mat: iron, shade: 'flat', d: poly([hp(5, -2.2), hp(9, 0), hp(5, 2.2)]) },
    ] });
  };

  // ---- the torso: a barrel chest swelling at the ribs, in at the broad belt, a flared ragged kilt
  const torso = () => {
    const sp = u => at('spine', u, 1.2);
    const W = [[0.0, 10, 8], [0.14, 9.2, 8.5], [0.4, 13.2, 11], [0.68, 14, 10.5], [0.9, 12.5, 9], [1.04, 7, 5]];
    const R = W.map(([u, ws, wd]) => { const c = sp(u); return [c[0] + half(ws, wd), c[1]]; });
    const Lf = W.map(([u, ws, wd]) => { const c = sp(u); return [c[0] - half(ws, wd), c[1]]; });
    s.add({ type: 'path', name: 'tunic', underlay: true, mat: hide, shade: 'normal', round: X(3), d: smooth([...R, ...Lf.reverse()]) });
    // the kilt: flared below the belt to an uneven hem above the knee
    const kc = at('spine', 0, 1.2), kw = half(10, 8), hw = half(17.5, 12), hy = kc[1] + X(10.5);
    const sw = wob * X(0.8);
    s.add({ type: 'path', name: 'kilt', underlay: true, mat: hide, shade: 'normal', round: X(1.5), d: smooth([
      [kc[0] - kw, kc[1] - X(1.5)], [kc[0] + kw, kc[1] - X(1.5)], [kc[0] + hw + sw, hy - X(1)], [kc[0] + hw * 0.55 + sw, hy + X(1.5)],
      [kc[0] + hw * 0.15 + sw, hy - X(0.5)], [kc[0] - hw * 0.3 + sw, hy + X(2)], [kc[0] - hw * 0.7 + sw, hy], [kc[0] - hw + sw, hy + X(1)]]) });
    // the broad belt
    const bc = at('spine', 0.06, 1.4), bw = half(11.2, 8);
    s.add({ type: 'capsule', name: 'belt', underlay: true, a: [bc[0] - bw, bc[1]], b: [bc[0] + bw, bc[1]], r: X(1.9), mat: pal.leather, shade: 'cyl', axis: 'x' });
  };

  // ---- the fur mantle: a shaggy rounded collar over both shoulders, ragged at its lower edge
  const mantle = () => {
    const c = at('spine', 0.93, 0.6), ws = half(16.5, 11);
    const lo = [];
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = c[0] + ws * 0.98 * (1 - 2 * u), y = c[1] + X(1.2) + X(5) * Math.abs(1 - 2 * u) + (i % 2 ? X(2) : 0);
      lo.push([x, y]);
    }
    s.add({ type: 'path', name: 'mantle', underlay: true, mat: pal.stone, shade: 'normal', round: X(2.5), d: smooth([
      [c[0] - ws * 0.4, c[1] - X(3.6)], [c[0], c[1] - X(4)], [c[0] + ws * 0.4, c[1] - X(3.6)], [c[0] + ws * 0.82, c[1] - X(1.4)], [c[0] + ws * 1.04, c[1] + X(3)],
      ...lo, [c[0] - ws * 1.04, c[1] + X(3)], [c[0] - ws * 0.82, c[1] - X(1.4)]]) });
  };

  // ---- the head: egg head on a thick neck, heavy brow, a long beard forked in two braids, a low iron crown
  const head = () => {
    const nk0 = P.start('neck'), nk1 = P.end('neck');
    s.add({ type: 'capsule', name: 'neck', underlay: true, a: nk0, b: nk1, r: X(3), mat: skin, shade: 'cyl' });
    const jaw = at('head', 0.15, 1.2 + 0.8 * side), jr = half(3.2, 2.8);
    s.add({ type: 'group', name: 'skull', underlay: true, mat: skin, children: [
      { type: 'ellipse', name: 'jaw', cx: jaw[0], cy: jaw[1], rx: Math.max(X(2.6), jr), ry: X(2.6), shade: 'sphere' },
      { type: 'ellipse', name: 'cranium', cx: cran[0], cy: cran[1], rx: rC * 0.95, ry: rC, shade: 'sphere' },
    ] });
    if (!backView) {
      // the beard: a broad wedge from the jaw, splitting into two braids down to the belly
      const b0 = at('head', -0.2, 2.6 + side * 1.4), bw = half(3.4, 2.6);
      const fwd = profile ? 3.6 : 1.8;
      for (const sg of profile ? [0] : [-1, 1]) {
        const tip = at('spine', 0.62, fwd + 1.4, sg * 2.2), mid = at('spine', 0.82, fwd + 1, sg * 2.4);
        s.add({ type: 'capsule', name: 'braid', underlay: true, a: mid, b: tip, r: X(1.6), r1: X(1.1), mat: fur, shade: 'cyl' });
      }
      const bm = at('spine', 0.84, fwd + 0.8);
      s.add({ type: 'path', name: 'beard', underlay: true, mat: fur, shade: 'normal', round: X(1.5), d: smooth([
        [b0[0] - bw - X(0.4), b0[1] - X(1.6)], [b0[0], b0[1] + X(0.2)], [b0[0] + bw + X(0.4), b0[1] - X(1.6)], [bm[0] + bw * 0.9, bm[1]],
        [bm[0], bm[1] + X(2)], [bm[0] - bw * 0.9, bm[1]]]) });
      // the heavy brow and small dark eyes beneath it
      const eyes = profile ? [0] : [-1, 1];
      for (const e of eyes) {
        const p = at('head', 0.4, rC / L.k * 0.8, profile ? 0 : e * 1.6);
        s.add({ type: 'rect', name: 'eye', x: Math.round(p[0] - 0.5), y: Math.round(p[1]), w: 1, h: Math.max(1, Math.round(X(0.8))), color: 'outline' });
      }
    } else {
      // from behind: the hair hanging over the nape
      const hb = at('head', 0.35, -0.8);
      s.add({ type: 'ellipse', name: 'back-hair', underlay: true, cx: hb[0], cy: hb[1], rx: rC * 0.9, ry: rC * 0.7, mat: fur, shade: 'normal' });
    }
    // the crown: a low iron band round the brow with five blunt points, the middle tallest
    const cw = rC * 1.0, by = cran[1] - rC * 0.72, bh = X(2.6), hts = [2.6, 3.6, 5, 3.6, 2.6].map(X);
    const xs = [-1, -0.5, 0, 0.5, 1].map(f => cran[0] + f * cw * (profile ? 0.75 : 0.85));
    const crown = [[cran[0] - cw, by + bh]];
    xs.forEach((x, i) => {
      if (i) { const g = (xs[i - 1] + x) / 2; crown.push([g, by + X(0.3)]); }
      crown.push([x - X(0.7), by - hts[i] + X(0.6)], [x, by - hts[i]], [x + X(0.7), by - hts[i] + X(0.6)]);
    });
    crown.push([cran[0] + cw, by + bh]);
    s.add({ type: 'path', name: 'crown', underlay: true, mat: iron, shade: 'bevel', d: poly(crown) });
  };

  // ---- draw order, far to near
  const legNames = P.far(['legL_up', 'legR_up']), armNames = P.far(['armL_up', 'armR_up']).map(n => n[3]);
  if (!backView) cloak();
  if (backView) hammer();
  if (profile) { arm(armNames[0]); if (armNames[0] === 'R' && !L.atk) hammer(); }
  legs(legNames);
  torso();
  if (backView) cloak();
  if (!profile) arm(armNames[0]);
  mantle();
  head();
  if (!profile) { if (!backView) hammer(); arm(armNames[1]); }
  else { if (armNames[1] === 'R' || L.atk) hammer(); arm(armNames[1]); }
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}

const smooth = list => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = list.length;
  let d = `M${m(list[n - 1], list[0]).join(' ')}`;
  for (let i = 0; i < n; i++) d += ` Q${list[i].join(' ')} ${m(list[i], list[(i + 1) % n]).join(' ')}`;
  return d + ' Z';
};

// head and hand from the rig; the eyes are drawn dark here (the finish repaints the face in a later pass)
export const anchors = ctx => {
  const L = layout(ctx), a = L.rig.anchors(L.P);
  a.head = [Math.round(L.cran[0]), Math.round(L.cran[1])];
  delete a.ground;
  return a;
};
