// boss-eshkal-the-unmaker base.v1 (r1) — SHAPE DRAFT: silhouette and form only, flat materials, no proc layers (only
// the ground shadow). Eshkal the Unmaker: the void dragon of the void halls (violet in game, brute, fast), a unique boss
// of family-d-cap drawn at 8.5 m (about 137 px, 3.7x the player). Same anatomy as the family (one body ramp, recoloured in
// game; leather wings; bone horns), read apart by mass and three signature parts:
//  - a great hunched shoulder mass: a towering deep chest and a humped withers high over a smaller haunch (a wedge
//    from shoulder to hip, never a box), on thick bent legs with heavy clawed feet, set wide;
//  - vast wings half-spread and raised in a high, wide V, their trailing edge torn into long ragged fingers (unmade);
//  - a broken halo: a fan of long horns radiating back and up from the skull like a shattered crown, the middle one
//    tallest, over a heavy wedge head with a hinged jaw on a long thick neck held up and ahead, clear of the wings.
// Planned accent (v2): the glow ramp in the eyes and the opened maw (void fire). The attack is the head: reared back,
// an arc down and forward, jaw wide on the held contact frame, the wings flaring up; then recovery.
// Built on the template's shared `large` body rig (ctx.lib.rigs.body), every facing a three-quarter view (s = sw,
// e = se, n = ne, w = nw yaw) so the body turns; body, neck, head and wings are 3D points in the rig's body frame.
export const meta = { brief: 'boss-eshkal-the-unmaker', pass: 'r1', recolour: 'accent', notes: 'shape draft: hunched towering shoulder mass, thick wide-set legs, vast raised ragged wings, broken-halo fan of horns, heavy wedge head with jaw on a long raised neck' };

export const params = {
  hide: { type: 'swap', options: ['accent', 'leather', 'grass', 'hair'], default: 'accent' },
  horn: { type: 'swap', options: ['hair', 'skin', 'stone'], default: 'hair' },
  neck: { type: 'range', min: 0.85, max: 1.15, default: 1 },
};

// rig height in frame units (U = 2 px on the 128 x 160 frame); G scales the body's own measures to the rig
const RIG_H = 54;
const G = 1.08;
const TURN = { s: 'sw', e: 'se', n: 'ne', w: 'nw' };

function layout(ctx) {
  const [w, h] = ctx.size, U0 = v => (v * Math.min(w, h)) / 64, U = v => U0(v) * G, ground = Math.round(h * 0.96);
  const rig = ctx.lib.rigs.body('large', ctx, { facing: TURN[ctx.facing] ?? ctx.facing, height: U0(RIG_H), ground,
    proportions: { spine: 0.5, tail: 0.5, leg_up: 0.125, leg_lo: 0.12, barrel: 0.46, head: 0.3, neck: 0.6 * (ctx.params?.neck ?? 1) } });
  const { sx, front, side } = rig, P = rig.pose(ctx.state, ctx.t), sk = rig.skeleton(ctx.state, ctx.t);
  const [sa, sb] = sk.spine, spineY = (sa[1] + sb[1]) / 2, spineL = Math.abs(sb[0] - sa[0]);
  const B = (f, s = 0, hgt = spineY) => P.at('spine', 0.5, f, s, hgt - spineY);
  const D = (f, s = 0) => P.depth('spine') + f * front + s * sx;
  const rest = rig.pose('idle', 0), e0 = rest.end('neck'), e1 = P.end('neck'), dv = [e1[0] - e0[0], e1[1] - e0[1]];
  // the walk's head bob is damped (a heavy head rides steady); the strike keeps its full arc
  const kd = ctx.state === 'walk' ? 0.35 : 1;
  const N = (f, s, hgt, k = 1) => { const q = B(f, s, hgt); return [q[0] + dv[0] * k * 0.6 * kd, q[1] + dv[1] * k * 0.75 * kd]; };
  const nk = ctx.params?.neck ?? 1, hf = spineL / 2 + U(10), hh = spineY + U(22) * nk;
  const skull = N(hf, 0, hh), near = front > 0, eyeSide = sx > 0 ? -1 : 1;
  const eye = near ? N(hf + U(2.4), eyeSide * U(2.6), hh + U(1.2)).map(Math.round) : null;
  const mouth = N(hf + U(8.5), 0, hh - U(2.5)).map(Math.round);
  const tside = ctx.facing === 's' || ctx.facing === 'n' ? -1 : 1;
  // centre the figure's reach (snout to tail tip and wing tips) on the frame, the same shift in every frame of a facing
  const mid = Q => (Q.at('spine', 0.5, hf + U(9), 0, 0)[0] + Q.at('spine', 0.5, -spineL / 2 - U(16), 0, 0)[0]) / 2;
  const reach = [N(hf + U(9), 0, hh - U(2.5)), N(hf - U(14), 0, hh + U(14)),
    ...[-1, 1].flatMap(v => [B(spineL * -0.06, v * U(20), spineY + U(26)), B(spineL * -0.58, v * U(22), spineY + U(20))]),
    B(-spineL / 2 - U(12), U(10) * tside, U(6))].map(q => q[0]);
  const lo = Math.min(...reach) - U(2), hi = Math.max(...reach) + U(2);
  let dx = Math.round(w / 2 - (mid(rest) + mid(P)) / 2);
  if (hi - lo > w - 3) dx = Math.round(w / 2 - (lo + hi) / 2);
  else if (lo + dx < 1) dx = Math.ceil(1 - lo); else if (hi + dx > w - 2) dx = Math.floor(w - 2 - hi);
  return { w, h, U, rig, P, sk, sx, front, side, ground, spineY, spineL, B, D, N, hf, hh, skull, eye, mouth, near, dx, tside };
}

export function render(ctx) {
  const { pal } = ctx.dir, prm = ctx.params, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), hide = pal[prm.hide], horn = pal[prm.horn];
  const { U, P, sk, sx, front, B, D, N, hf, hh, spineL, spineY, skull } = L;
  const pieces = [], put = (z, g) => pieces.push({ z, g });
  const atk = ctx.state === 'attack', fr = ctx.frame ?? 0, open = atk ? [0.25, 0.55, 1, 0.4][fr % 4] : 0;
  const flare = atk ? [0.2, 0.6, 1, 0.4][fr % 4] : (ctx.state === 'idle' ? fr % 2 * 0.15 : (fr % 2) * 0.25);
  const back = front < 0;

  // legs: thick, set wide, each with a knee — a heavy thigh from a round haunch/shoulder, a tapering shin, a broad
  // clawed foot
  for (const e of ['FL', 'FR', 'BL', 'BR']) {
    const up = `leg${e}_up`, lo = `leg${e}_lo`, k = Math.sign(sk[up][0][2]) || (e.endsWith('L') ? -1 : 1), hind = e[0] === 'B';
    const hip = P.start(up), knee = P.at(up, 1, hind ? U(5) : -U(3), k * U(3.5), U(1.5)), foot = P.end(lo), z = P.depth(lo) + k * sx * U(5);
    const claws = [-1, 0, 1].map(j => { const c = P.at(lo, 1, U(3), k * U(0.6) + j * U(1.4), 0); return { type: 'rect', name: 'claw', x: Math.round(c[0]), y: Math.round(c[1]) - 2, w: 2, h: 3, color: 'hair.0' }; });
    put(z, { type: 'group', name: 'leg', underlay: true, children: [
      { type: 'capsule', name: hind ? 'thigh' : 'upper-leg', a: hip, b: knee, r: hind ? U(4.8) : U(4.2), r1: U(2.4), mat: hide, shade: 'cyl' },
      { type: 'capsule', name: 'shin', a: knee, b: foot, r: U(2.4), r1: U(1.6), mat: hide, shade: 'cyl' },
      { type: 'ellipse', name: 'foot', cx: P.at(lo, 1, U(1.4), 0, 0)[0], cy: foot[1] - U(0.8), rx: U(3), ry: U(1.3), mat: hide, shade: 'flat', band: 1 },
    ] });
    for (const c of claws) put(z + 0.01, c);
  }

  // the tail: thick at the root, sweeping low and out to the side the viewer sees, ending in a barbed tip
  const hind = -spineL / 2, tl = [
    [3, 0, spineY + U(0), U(5.4)], [-3, 1, spineY - U(4), U(4.4)], [-8, 3.5, U(6), U(3.6)], [-11, 6.5, U(3.5), U(2.8)],
    [-13, 10, U(3), U(2.2)], [-13, 13, U(5), U(1.6)], [-11, 14.5, U(8), U(1)],
  ].map(([f, sd, hgt, r]) => [hind + U(f) * 0.8, U(sd) * 0.75 * L.tside, hgt, r]);
  for (let i = 0; i < tl.length - 1; i++) {
    const [f0, s0, h0, r0] = tl[i], [f1, s1, h1, r1] = tl[i + 1];
    put(D((f0 + f1) / 2, (s0 + s1) / 2) - 0.2, { type: 'group', name: 'tail', underlay: true, children: [
      { type: 'capsule', name: 'tail', a: B(f0, s0, h0), b: B(f1, s1, h1), r: r0, r1, mat: hide, shade: 'cyl' }] });
  }
  { const [f, sd, hgt] = tl[tl.length - 1], t0 = B(f, sd, hgt), t1 = B(f + U(2), sd + U(1.5) * L.tside, hgt + U(4)), t2 = B(f - U(2.5), sd + U(1) * L.tside, hgt + U(1.5));
    put(D(f, sd) - 0.19, { type: 'poly', name: 'tail-barb', pts: [t0, t1, t2], mat: horn, shade: 'flat', band: 1 }); }

  // the body: a towering deep chest under a humped withers, tapering to a smaller round haunch (a wedge, not a box)
  const haunch = B(-spineL * 0.32, 0, spineY + U(0.5)), waist = B(-spineL * 0.05, 0, spineY + U(1.5)), chest = B(spineL * 0.24, 0, spineY + U(1.5)),
    withers = B(spineL * 0.12, 0, spineY + U(7.5)), belly = B(spineL * 0.1, 0, spineY - U(5));
  put(D(0), { type: 'group', name: 'body', underlay: true, children: [
    { type: 'ellipse', name: 'torso', cx: haunch[0], cy: haunch[1], rx: U(8), ry: U(7.2), mat: hide, shade: 'sphere' },
    { type: 'ellipse', name: 'torso', cx: waist[0], cy: waist[1], rx: U(8.5), ry: U(6.8), mat: hide, shade: 'normal' },
    { type: 'ellipse', name: 'torso', cx: chest[0], cy: chest[1], rx: U(10.5), ry: U(9.8), mat: hide, shade: 'sphere' },
    { type: 'ellipse', name: 'hump', cx: withers[0], cy: withers[1], rx: U(8), ry: U(6), mat: hide, shade: 'sphere' },
    { type: 'ellipse', name: 'belly', cx: belly[0], cy: belly[1], rx: U(6.5), ry: U(2.8), mat: pal.skin, shade: 'flat', band: 1 },
  ] });

  // vast wings, half-spread and raised in a high V: the arm climbs from the shoulder to a high wrist out to the side,
  // the long outer finger reaches back and out; the membrane's trailing edge is torn into ragged fingers
  for (const v of [-1, 1]) {
    const W = (f, sd, hgt) => B(spineL * f, v * U(sd), spineY + U(hgt));
    const sh = W(0.2, 4.5, 7), elbow = W(0.14, 11, 15 + flare * 2), arc = W(0.06, 16, 22 + flare * 3), wr = W(-0.06, 20, 26 + flare * 4),
      tip = W(-0.58, 22, 20 + flare * 3), root = W(-0.24, 3, 6), fl = 0;
    // trailing edge from the tip back in to the root: long torn fingers with deep curved notches
    const edge = [W(-0.54, 20.5, 13.5), W(-0.46, 18, 15.5), W(-0.6, 18, 7), W(-0.44, 14.5, 11), W(-0.54, 11, 3.5), W(-0.36, 8, 8), W(-0.4, 5, 3)];
    const nearW = v * sx > 0, z = D(0) + (nearW ? 0.5 : -0.5) + (back ? 0 : 0);
    put(z, { type: 'group', name: 'wing', underlay: true, children: [
      { type: 'poly', name: 'wing', pts: [sh, elbow, arc, wr, W(-0.3, 20, 25 + flare * 3.5), tip, ...edge, root], mat: pal.leather, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'wing-arm', a: sh, b: elbow, r: U(2.2), r1: U(1.6), mat: hide, shade: 'cyl' },
      { type: 'capsule', name: 'wing-arm', a: elbow, b: arc, r: U(1.6), r1: U(1.3), mat: hide, shade: 'cyl' },
      { type: 'capsule', name: 'wing-arm', a: arc, b: wr, r: U(1.3), r1: U(1.1), mat: hide, shade: 'cyl' },
      { type: 'capsule', name: 'wing-arm', a: wr, b: tip, r: U(1.1), r1: U(0.5), mat: hide, shade: 'cyl' },
      { type: 'rect', name: 'wing-claw', x: Math.round(wr[0]) - 1, y: Math.round(wr[1]) - 4, w: 2, h: 3, color: 'hair.0' },
    ] });
  }

  // the neck: long and thick, rising from the chest steeply up and ahead, so the head stands clear of the wings
  const n0 = B(spineL * 0.32, 0, spineY + U(3)), n1 = N(spineL / 2 + U(6), 0, spineY + U(8), 0.3), n2 = N(spineL / 2 + U(9), 0, spineY + U(15), 0.65),
    n3 = N(hf - U(2.5), 0, hh, 0.9);
  // the heavy wedge skull: a broad brow tapering to a blunt snout; the lower jaw hinged under the brow
  const brow = N(hf - U(0.5), 0, hh + U(0.8)), snout = N(hf + U(7.5), 0, hh - U(2.2));
  const jawRoot = N(hf - U(1), 0, hh - U(2.4)), jawTip = N(hf + U(6.5) - open * U(1.5), 0, hh - U(3.6) - open * U(6.5));
  // the broken halo: a fan of long horns from the back of the skull, radiating back and up, the middle one tallest;
  // two of them snapped short (the crown is broken)
  const fan = [[-100, 9, 1], [-66, 12, 0], [-33, 14.5, 0], [0, 16, 0], [33, 14.5, 0], [66, 12, 1], [100, 9, 0]];
  const horns = fan.flatMap(([deg, len, snap]) => {
    const a = (deg * Math.PI) / 180, lv = snap ? len * 0.6 : len, sw = U(4.5);
    // each horn leaves the crown, sweeps back off the skull and bends out along its ray of the halo
    const R = (t, b) => N(hf - U(2) - sw * t - U(lv) * 0.25 * t, Math.sin(a) * U(lv) * t * 1.05, hh + U(2.5) + Math.cos(a) * U(lv) * t * 0.95 + b);
    const root = R(0, 0), mid = R(0.5, U(0.8)), tip = R(1, 0);
    return [{ type: 'capsule', name: 'horn', a: root, b: mid, r: U(1.5), r1: U(1), mat: horn, shade: 'flat', band: 0 },
      { type: 'capsule', name: 'horn', a: mid, b: tip, r: U(1), r1: snap ? U(0.7) : U(0.3), mat: horn, shade: 'flat', band: 0 }];
  });
  const hz = D(hf, 0);
  put(hz - 0.01, { type: 'group', name: 'neck', underlay: true, children: [
    { type: 'capsule', name: 'neck', a: n0, b: n1, r: U(5.6), r1: U(4.4), mat: hide, shade: 'cyl' },
    { type: 'capsule', name: 'neck', a: n1, b: n2, r: U(4.4), r1: U(3.6), mat: hide, shade: 'cyl' },
    { type: 'capsule', name: 'neck', a: n2, b: n3, r: U(3.6), r1: U(3.2), mat: hide, shade: 'cyl' }] });
  put(hz + (back ? 0.05 : 0.005), { type: 'group', name: 'crown', underlay: true, children: horns });
  put(hz + 0.02, { type: 'group', name: 'jaw', underlay: true, children: [
    { type: 'capsule', name: 'jaw', a: jawRoot, b: jawTip, r: U(2.3), r1: U(1.1), mat: hide, shade: 'flat', band: 2 }] });
  put(hz + 0.03, { type: 'group', name: 'head', underlay: true, children: [
    { type: 'ellipse', name: 'skull', cx: brow[0], cy: brow[1], rx: U(5), ry: U(4.2), mat: hide, shade: 'sphere' },
    { type: 'capsule', name: 'snout', a: brow, b: snout, r: U(4), r1: U(2.2), mat: hide, shade: 'cyl' },
  ] });

  const kids = pieces.sort((a, b) => a.z - b.z).map(p => p.g);
  if (L.eye) kids.push({ type: 'rect', name: 'eye', x: L.eye[0], y: L.eye[1], w: 3, h: 2, color: 'outline' });
  s.add({ type: 'group', name: 'eshkal', translate: [L.dx, 0], children: kids });
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}

export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: L.skull.map(Math.round) };
  delete a.tail;
  a.hand = L.mouth ?? a.head;
  if (L.eye) a.eye = L.eye;
  if (L.mouth) a.mouth = L.mouth;
  for (const k of Object.keys(a)) a[k] = [a[k][0] + L.dx, a[k][1]];
  return a;
};
