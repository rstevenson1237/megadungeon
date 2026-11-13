// boss-skarn-the-burning base.v1 (r1) — SHAPE DRAFT, flat materials, no proc layers (only the ground shadow). Skarn the
// Burning: a unique fire dragon of family-d-cap (the brute of the lava forges), drawn at 5.1 m (about 82 px). Same anatomy
// as the family (one body ramp, recoloured to ember in game; leather wings; bone horns) but read apart by: a towering,
// front-heavy pear body (deep chest, narrower hips) carried high on four thick bent legs, the neck raised steeply; a ragged
// crest of tall flame-tongue spikes from the crown down the neck and spine (glow ramp); wings held raised in a high V
// with a torn trailing edge; heavy forward-curving horns and a broad wedge head with a hinged jaw; a thick tail ending in
// a flame tip. The attack is the head: reared back high, an arc down and forward, jaws open and a short gout of flame on
// the held contact frame, then recovery. Built on the template's shared quadruped rig with the `large` proportions
// (`ctx.lib.rigs.body`), every facing drawn as a three-quarter view (s = sw, e = se, n = ne, w = nw yaw) so the body turns,
// and the body, head and wings built from 3D points in the rig's body frame so they are the same in every facing.
export const meta = { brief: 'boss-skarn-the-burning', pass: 'r1', notes: 'shape draft: towering pear-bodied fire dragon, flame-spike crest down neck and spine, raised V wings with torn edge, forward horns, flame-tipped tail, head-arc attack with flame gout' };

// rig height in frame units (U = 1.5 px on the 96 px frame): tuned so the drawn figure stands about 82 px (5.1 m)
const RIG_H = 25;
// iso facings are diagonal on screen: draw each as a three-quarter view
const YAW = { s: 'sw', e: 'se', n: 'ne', w: 'nw' };
const OPEN = { idle: [0.05, 0.1], walk: [0.05, 0.05, 0.05, 0.05], attack: [0.35, 0.2, 1, 0.4] };
// the attack's arc: neck and head angles per logical frame (rear back high, wind, strike low and forward, recover)
const ARC = { neck: [78, 64, 18, 40], head: [-62, -55, -6, -30] };
// idle and walk: the neck held steeper than the rig's default so the head rides well above the shoulders (a slow sway)
const HOLD = { idle: { neck: [66, 63], head: [-52, -50] }, walk: { neck: [66, 64, 66, 64], head: [-52, -50, -52, -50] } };

// monotone-chain convex hull of screen points
function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const smooth = pts => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let d = `M${m(pts[n - 1], pts[0]).join(' ')}`;
  for (let i = 0; i < n; i++) d += ` Q${pts[i].join(' ')} ${m(pts[i], pts[(i + 1) % n]).join(' ')}`;
  return d + ' Z';
};
const poly = pts => `M${pts.map(p => p.join(' ')).join(' L')} Z`;

function layout(ctx) {
  const [w, h] = ctx.size, U = v => (v * Math.min(w, h)) / 64, ground = Math.round(h * 0.97);
  const f = ctx.logical ?? ctx.frame ?? 0, st = ctx.state;
  const rig = ctx.lib.rigs.body('large', ctx, { facing: YAW[ctx.facing] ?? ctx.facing, tilt: 0.5, height: U(RIG_H), ground,
    proportions: { spine: 0.95, neck: 0.62, head: 0.5, tail: 0.75, leg_up: 0.22, leg_lo: 0.2, barrel: 0.62, legSep: 0.26 } });
  const A = st === 'attack' ? ARC : HOLD[st], ov = A ? { angles: { neck: A.neck[f % A.neck.length], head: A.head[f % A.head.length] } } : undefined;
  const P = rig.pose(st, ctx.t, ov), { sx, front, side } = rig, back = front < 0;
  const open = (OPEN[st] ?? OPEN.idle)[f % (OPEN[st] ?? OPEN.idle).length];
  const headR = U(5.2), hd = (u, fw, sd, up) => P.at('head', u, fw, sd, up);
  const eyePts = back ? [] : [-1, 1].map(k => hd(0.35, 0, k * headR * 0.55, headR * 0.45));
  const mouth = hd(1.05, 0, 0, -headR * 0.35).map(Math.round);
  return { w, h, U, rig, P, sx, front, side, back, ground, headR, hd, open, eyePts, mouth, f, st };
}

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx);
  const { U, P, sx, back, headR, hd, open } = L, hide = pal.accent, D = n => P.depth(n);
  const parts = [], add = (z, g) => parts.push({ z, g });
  const sideDepth = v => v * sx; // how much nearer a point `v` to the body's side is (the rig's depth along its side axis)
  const spD = D('spine');

  // the body: a pear (deep chest at the shoulders, narrower hips), as the hull of its cross-sections in the body frame
  const prof = u => U(4.6) + U(5.4) * Math.sin(Math.PI * Math.min(1, 0.15 + u * 0.8)) + U(1.6) * u;
  const bodyPts = [];
  for (let i = 0; i <= 12; i++) {
    const u = i / 12, r = prof(u);
    for (let j = 0; j < 16; j++) { const a = (j / 16) * Math.PI * 2; bodyPts.push(P.at('spine', u, 0, Math.cos(a) * r * 1.05, Math.sin(a) * r * 0.95 + U(1.2) * u)); }
  }
  add(spD, { type: 'path', name: 'torso', underlay: true, mat: hide, shade: 'normal', round: U(4), d: smooth(hull(bodyPts)) });

  // legs: a thick thigh to a bent knee (fore: elbow back; hind: hock back), a tapered shin, a broad clawed foot
  for (const e of ['FL', 'FR', 'BL', 'BR']) {
    const n = `leg${e}`, fore = e[0] === 'F', k = e[1] === 'L' ? -1 : 1;
    const hip = P.start(`${n}_up`), foot = P.end(`${n}_lo`), knee = P.at(`${n}_up`, 1, fore ? -U(2.2) : U(2.6), k * U(0.6), U(1));
    const top = P.at(`${n}_up`, 0, fore ? U(0.5) : -U(0.5), 0, U(1.5)), z = D(`${n}_up`) + (z0 => z0)(0);
    const toe = P.at(`${n}_lo`, 1, U(2.4), 0, U(0.3));
    add(z, { type: 'group', name: fore ? 'foreleg' : 'hindleg', underlay: true, children: [
      { type: 'capsule', name: 'shin', a: knee, b: foot, r: U(fore ? 2.4 : 2.2), r1: U(1.6), mat: hide, shade: 'cyl' },
      { type: 'capsule', name: fore ? 'upper-leg' : 'thigh', a: top, b: knee, r: U(fore ? 4.2 : 5.2), r1: U(2.5), mat: hide, shade: 'normal', round: U(2) },
      { type: 'path', name: 'foot', mat: hide, shade: 'flat', band: 2, d: smooth(hull([P.at(`${n}_lo`, 1, -U(1.6), -U(1.8), 0), P.at(`${n}_lo`, 1, -U(1.6), U(1.8), 0), P.at(`${n}_lo`, 1, U(1.2), -U(2.4), U(1.6)), P.at(`${n}_lo`, 1, U(1.2), U(2.4), U(1.6)), toe, P.at(`${n}_lo`, 1, U(2.2), -U(2), 0), P.at(`${n}_lo`, 1, U(2.2), U(2), 0)])) },
      ...[-1, 0, 1].map(d => { const c = P.at(`${n}_lo`, 1, U(3.4), d * U(1.6), 0); return { type: 'circle', name: 'claw', cx: c[0], cy: c[1], r: U(0.6), mat: pal.hair, shade: 'flat', band: 0 }; }),
    ] });
  }

  // tail: thick at the root, tapering back and out to a curled flame tip
  const tp = [P.at('tail', 0, U(2), 0, U(1)), P.at('tail', 0.4, 0, U(1), 0), P.at('tail', 0.8, 0, U(3), -U(1)), P.at('tail', 1.05, -U(2), U(5), U(1.5)), P.at('tail', 1.2, -U(3), U(5), U(5))];
  add(D('tail') - 0.5, { type: 'tube', name: 'tail', underlay: true, mat: hide, shade: 'cyl', pts: tp, w: U(7.5), w1: U(1.6) });
  const tt = tp[4], tf = [[tt[0] - U(2.6), tt[1] + U(1)], [tt[0] - U(1.6), tt[1] - U(5)], [tt[0] - U(0.2), tt[1] - U(2.4)], [tt[0] + U(1), tt[1] - U(7.5)], [tt[0] + U(1.8), tt[1] - U(2)], [tt[0] + U(3), tt[1] - U(4)], [tt[0] + U(2.4), tt[1] + U(1.4)]];
  add(D('tail') - 0.45, { type: 'path', name: 'tail-flame', underlay: true, mat: pal.glow, shade: 'flat', band: 1, d: poly(tf) });

  // wings: raised in a high V from the shoulders, three finger struts, a torn trailing edge
  for (const k of [-1, 1]) {
    const W = (u, fw, sd, up) => P.at('spine', u, fw, k * sd, up);
    const root = W(0.72, 0, U(4), U(7)), elbow = W(0.62, -U(3), U(12), U(17)), tip = W(0.3, -U(10), U(19), U(23));
    const f1 = W(0.1, -U(8), U(20), U(14)), f2 = W(0.05, -U(6), U(15), U(9)), trail = W(0.25, 0, U(6), U(7));
    const edge = [root, elbow, tip, W(0.2, -U(10), U(19), U(17)), f1, W(0.1, -U(5), U(16), U(12)), f2, W(0.15, -U(2), U(10), U(9)), trail];
    const z = spD + sideDepth(k) * U(10) + (back ? 0.3 : 0);
    add(z, { type: 'group', name: 'wing', underlay: true, children: [
      { type: 'path', name: 'wing-membrane', mat: pal.leather, shade: 'flat', band: 1, d: poly(edge) },
      { type: 'tube', name: 'wing-arm', mat: hide, shade: 'cyl', pts: [root, elbow, tip], w: U(3), w1: U(1.2) },
      { type: 'tube', name: 'wing-strut', mat: hide, shade: 'flat', band: 2, pts: [elbow, f1], w: U(1.3), w1: U(0.7) },
      { type: 'tube', name: 'wing-strut', mat: hide, shade: 'flat', band: 2, pts: [elbow, f2], w: U(1.3), w1: U(0.7) },
    ] });
  }

  // the flame crest along the spine: ragged spikes leaning back
  const spikes = [];
  for (let i = 0; i < 5; i++) {
    const u = 0.12 + i * 0.16, r = prof(u) * 0.95 + U(1.2) * u, hgt = U(5.5 + 3 * Math.sin(Math.PI * (i + 1) / 6));
    const a = P.at('spine', u - 0.05, 0, 0, r - U(1)), b = P.at('spine', u + 0.06, 0, 0, r - U(1)), t = P.at('spine', u - 0.08, 0, 0, r + hgt);
    spikes.push({ type: 'path', name: 'crest', mat: pal.glow, shade: 'flat', band: 1, d: poly([a, t, b]) });
  }
  add(spD + (back ? 0.2 : -0.2), { type: 'group', name: 'back-crest', underlay: true, children: spikes });

  // neck: a thick tapered tube from the chest up to the skull; its own flame crest down the back of it
  const nk = [P.at('neck', 0, -U(1), 0, -U(1)), P.at('neck', 0.5, 0, 0, 0), P.at('neck', 1, 0, 0, 0)];
  const nz = D('neck') + (back ? -0.2 : 0.2);
  const ncrest = [];
  for (let i = 0; i < 4; i++) {
    const u = 0.15 + i * 0.24, rr = U(4.4 - i * 0.5), ht = U(4.5 + i * 0.6);
    const a = P.at('neck', u - 0.09, -rr * 0.6, 0, rr * 0.7), b = P.at('neck', u + 0.09, -rr * 0.6, 0, rr * 0.7), t = P.at('neck', u - 0.05, -rr - ht, 0, rr + ht * 0.6);
    ncrest.push({ type: 'path', name: 'crest', mat: pal.glow, shade: 'flat', band: i % 2, d: poly([a, t, b]) });
  }
  add(nz - 0.05, { type: 'group', name: 'neck-crest', underlay: true, children: ncrest });
  add(nz, { type: 'tube', name: 'neck', underlay: true, mat: hide, shade: 'cyl', pts: nk, w: U(9), w1: U(6) });

  // head: a broad wedge skull, a lower jaw hinged at its back (opens by `open`), horns curving up and forward
  const hz = D('head') + (back ? -0.1 : 0.3), hr = headR, jawDrop = open * hr * 1.5;
  const skullPts = [];
  for (const [u, r, up] of [[-0.05, hr, hr * 0.2], [0.3, hr * 0.95, hr * 0.35], [0.7, hr * 0.65, hr * 0.1], [1.1, hr * 0.42, -hr * 0.15]])
    for (const [cs, sn] of [[1, 0], [0.5, 0.86], [-0.2, 1], [-0.6, 0.5], [-0.5, -0.6], [0.3, -0.9], [0.8, -0.5]]) skullPts.push(hd(u, 0, cs * r, up + sn * r * 0.8));
  const jawPts = [];
  for (const [u, r] of [[0, hr * 0.8], [0.5, hr * 0.6], [1.05, hr * 0.35]])
    for (const k of [-1, 1]) { const dn = jawDrop * u; jawPts.push(hd(u, 0, k * r, -hr * 0.3 - dn), hd(u, 0, k * r * 0.8, -hr * 0.85 - dn)); }
  const horns = [-1, 1].map(k => ({ type: 'tube', name: 'horn', mat: pal.hair, shade: 'flat', band: 0, pts: [hd(0.05, 0, k * hr * 0.6, hr * 0.7), hd(-0.25, 0, k * hr * 1.1, hr * 1.9), hd(-0.15, 0, k * hr * 1.3, hr * 3.0), hd(0.2, 0, k * hr * 1.2, hr * 3.5)], w: U(2.8), w1: U(0.8) }));
  // a crown of flame spikes behind the horns: the namesake read at 1x
  const crown = [-0.45, 0, 0.45].map((k, i) => { const a = hd(-0.1, 0, k * hr - hr * 0.3, hr * 0.6), b = hd(-0.1, 0, k * hr + hr * 0.3, hr * 0.6), t = hd(-0.45, 0, k * hr * 1.2, hr * (2.4 + (i === 1 ? 0.9 : 0))); return { type: 'path', name: 'crown-flame', mat: pal.glow, shade: 'flat', band: i === 1 ? 0 : 1, d: poly([a, t, b]) }; });
  const headKids = [
    ...(back ? horns : []),
    { type: 'path', name: 'jaw', mat: hide, shade: 'flat', band: 2, d: smooth(hull(jawPts)) },
    ...(open > 0.3 && !back ? [{ type: 'path', name: 'maw', color: 'outline', d: poly([hd(0.1, 0, 0, -hr * 0.3), hd(1.05, 0, 0, -hr * 0.3), hd(1.05, 0, 0, -hr * 0.4 - jawDrop)]) }] : []),
    { type: 'path', name: 'skull', mat: hide, shade: 'sphere', d: smooth(hull(skullPts)) },
    ...(back ? [] : horns),
  ];
  add(hz - 0.02, { type: 'group', name: 'crown', underlay: true, children: crown });
  add(hz, { type: 'group', name: 'head', underlay: true, children: headKids });

  // the attack's held contact frame: a short gout of flame from the open jaws, forward and down
  if (L.st === 'attack' && L.f % 4 === 2) {
    const m0 = hd(1.05, 0, 0, -hr * 0.5), m1 = hd(1.05, U(3), -U(3.5), -hr - U(1)), m2 = hd(1.05, U(5), 0, -hr - U(6)), m3 = hd(1.05, U(3), U(3.5), -hr - U(4));
    add(hz + 0.1, { type: 'path', name: 'breath', underlay: true, mat: pal.glow, shade: 'flat', band: 1, d: smooth([m0, m1, m2, m3]) });
  }

  for (const p of parts.sort((a, b) => a.z - b.z)) s.add(p.g);
  for (const e of L.eyePts) s.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 2, h: 1, color: 'glow.0' });
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}

export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: L.hd(0.3, 0, 0, 0).map(Math.round) };
  delete a.tail;
  a.hand = L.mouth;
  if (!L.back) {
    const ex = L.eyePts.map(p => p.map(Math.round)).sort((p, q) => p[0] - q[0]);
    ex.forEach((p, i) => { a[i ? 'eye2' : 'eye'] = p; });
    a.mouth = L.mouth;
  }
  return a;
};
