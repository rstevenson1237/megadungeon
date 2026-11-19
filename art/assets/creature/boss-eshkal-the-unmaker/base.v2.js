// boss-eshkal-the-unmaker base.v2 (r2, from base.v1; shape approved by the owner) — the one DECORATION pass, inside the
// approved line only (every shape keeps its outline; new marks are decals on their parts or shade changes). Materials and
// light from the direction's light (upper left): the chest, withers, haunch and waist are one hide mass lit round
// (normal shading over their union, so no banded slabs), the thighs round, the shins, neck, tail and wing arms tapered
// cylinders along their length, the skull and snout one lit wedge, the jaw a tapered cylinder; the wing membrane a leather
// gradient with dark finger struts and a lit leading arm; the horns bone (hair ramp) lit as tapered cylinders. The
// signature part, the broken halo, carries the one bright accent: void fire (glow ramp) burning at the roots of the crown
// and in the snapped stumps, so it reads at 1x. Face (front facings): a dark brow ridge over a glowing eye, a nostril on
// the snout; the maw glows and shows bone fangs when the jaw opens (the attack's held contact frame wide open). Back
// facings: a dark spined dorsal ridge down the neck and withers instead of the face, and the pale belly plate only
// shows in front. Proc layers: AO at overlaps, rim light on the lit edges of the masses, a fine scale noise on the hide.
// Body stays on the family's accent ramp (recolour: accent, like family-d-cap) so the violet row colour lands on it.
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
export const meta = { brief: 'boss-eshkal-the-unmaker', pass: 'r2', recolour: 'accent', notes: 'decoration on the approved shape: round directional shading, void-fire halo roots and stumps, glowing eye and maw, brow, nostril, fangs, wing struts, belly plate, dorsal ridge, AO, rim light, scale noise; shape draft was: hunched towering shoulder mass, thick wide-set legs, vast raised ragged wings, broken-halo fan of horns, heavy wedge head with jaw on a long raised neck' };

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
  const struts = [], hornRoots = [], hornBase = [], hornStumps = [];

  // legs: thick, set wide, each with a knee — a heavy thigh from a round haunch/shoulder, a tapering shin, a broad
  // clawed foot
  for (const e of ['FL', 'FR', 'BL', 'BR']) {
    const up = `leg${e}_up`, lo = `leg${e}_lo`, k = Math.sign(sk[up][0][2]) || (e.endsWith('L') ? -1 : 1), hind = e[0] === 'B';
    const hip = P.start(up), knee = P.at(up, 1, hind ? U(5) : -U(3), k * U(3.5), U(1.5)), foot = P.end(lo), z = P.depth(lo) + k * sx * U(5);
    const claws = [-1, 0, 1].map(j => { const c = P.at(lo, 1, U(3), k * U(0.6) + j * U(1.4), 0); return { type: 'rect', name: 'claw', x: Math.round(c[0]), y: Math.round(c[1]) - 2, w: 2, h: 3, color: 'hair.0' }; });
    put(z, { type: 'group', name: 'leg', underlay: true, children: [
      { type: 'capsule', name: hind ? 'thigh' : 'upper-leg', a: hip, b: knee, r: hind ? U(4.8) : U(4.2), r1: U(2.4), mat: hide, shade: 'normal', round: U(2.5) },
      { type: 'capsule', name: 'shin', a: knee, b: foot, r: U(2.4), r1: U(1.6), mat: hide, shade: 'normal', round: U(1.6) },
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
      { type: 'capsule', name: 'tail', a: B(f0, s0, h0), b: B(f1, s1, h1), r: r0, r1, mat: hide, shade: 'normal', round: U(2) }] });
  }
  { const [f, sd, hgt] = tl[tl.length - 1], t0 = B(f, sd, hgt), t1 = B(f + U(2), sd + U(1.5) * L.tside, hgt + U(4)), t2 = B(f - U(2.5), sd + U(1) * L.tside, hgt + U(1.5));
    put(D(f, sd) - 0.19, { type: 'poly', name: 'tail-barb', pts: [t0, t1, t2], mat: horn, shade: 'flat', band: 1 }); }

  // the body: a towering deep chest under a humped withers, tapering to a smaller round haunch (a wedge, not a box)
  const haunch = B(-spineL * 0.32, 0, spineY + U(0.5)), waist = B(-spineL * 0.05, 0, spineY + U(1.5)), chest = B(spineL * 0.24, 0, spineY + U(1.5)),
    withers = B(spineL * 0.12, 0, spineY + U(7.5)), belly = B(spineL * 0.1, 0, spineY - U(5));
  put(D(0), { type: 'group', name: 'body', underlay: true, children: [
    // one hide mass (the union of the haunch, waist, chest and withers) lit round as a whole, so no seams or slabs
    { type: 'union', name: 'torso', mat: hide, shade: 'normal', round: U(7), shapes: [
      { type: 'ellipse', cx: haunch[0], cy: haunch[1], rx: U(8), ry: U(7.2) },
      { type: 'ellipse', cx: waist[0], cy: waist[1], rx: U(8.5), ry: U(6.8) },
      { type: 'ellipse', cx: chest[0], cy: chest[1], rx: U(10.5), ry: U(9.8) },
      { type: 'ellipse', cx: withers[0], cy: withers[1], rx: U(8), ry: U(6) }] },
    { type: 'ellipse', name: 'belly', cx: belly[0], cy: belly[1], rx: U(6.5), ry: U(2.8), mat: pal.skin, shade: 'linear' },
  ] });

  // vast wings, half-spread and raised in a high V: the arm climbs from the shoulder to a high wrist out to the side,
  // the long outer finger reaches back and out; the membrane's trailing edge is torn into ragged fingers
  for (const v of [-1, 1]) {
    const W = (f, sd, hgt) => B(spineL * f, v * U(sd), spineY + U(hgt));
    const sh = W(0.2, 4.5, 7), elbow = W(0.14, 11, 15 + flare * 2), arc = W(0.06, 16, 22 + flare * 3), wr = W(-0.06, 20, 26 + flare * 4),
      tip = W(-0.58, 22, 20 + flare * 3), root = W(-0.24, 3, 6), fl = 0;
    // trailing edge from the tip back in to the root: long torn fingers with deep curved notches
    const edge = [W(-0.54, 20.5, 13.5), W(-0.46, 18, 15.5), W(-0.6, 18, 7), W(-0.44, 14.5, 11), W(-0.54, 11, 3.5), W(-0.36, 8, 8), W(-0.4, 5, 3)];
    // finger struts: dark bone lines from the wrist out to the torn fingertips (decals on the membrane)
    for (const f of [edge[0], edge[2], edge[4]]) struts.push([wr, f]);
    struts.push([elbow, edge[6]]);
    const nearW = v * sx > 0, z = D(0) + (nearW ? 0.5 : -0.5) + (back ? 0 : 0);
    put(z, { type: 'group', name: 'wing', underlay: true, children: [
      { type: 'poly', name: 'wing', pts: [sh, elbow, arc, wr, W(-0.3, 20, 25 + flare * 3.5), tip, ...edge, root], mat: pal.leather, shade: 'linear' },
      { type: 'capsule', name: 'wing-arm', a: sh, b: elbow, r: U(2.2), r1: U(1.6), mat: hide, shade: 'normal', round: U(1) },
      { type: 'capsule', name: 'wing-arm', a: elbow, b: arc, r: U(1.6), r1: U(1.3), mat: hide, shade: 'normal', round: U(1) },
      { type: 'capsule', name: 'wing-arm', a: arc, b: wr, r: U(1.3), r1: U(1.1), mat: hide, shade: 'normal', round: U(1) },
      { type: 'capsule', name: 'wing-arm', a: wr, b: tip, r: U(1.1), r1: U(0.5), mat: hide, shade: 'normal', round: U(1) },
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
    hornRoots.push(R(0.12, 0)); hornBase.push([R(0, 0), R(0.32, U(0.4))]); if (snap) hornStumps.push(R(0.94, 0));
    return [{ type: 'capsule', name: 'horn', a: root, b: mid, r: U(1.5), r1: U(1), mat: horn, shade: 'normal', round: U(1) },
      { type: 'capsule', name: 'horn', a: mid, b: tip, r: U(1), r1: snap ? U(0.7) : U(0.3), mat: horn, shade: 'normal', round: U(0.8) }];
  });
  const hz = D(hf, 0);
  put(hz - 0.01, { type: 'group', name: 'neck', underlay: true, children: [
    { type: 'union', name: 'neck', mat: hide, shade: 'normal', round: U(3.5), shapes: [
      { type: 'capsule', a: n0, b: n1, r: U(5.6), r1: U(4.4) },
      { type: 'capsule', a: n1, b: n2, r: U(4.4), r1: U(3.6) },
      { type: 'capsule', a: n2, b: n3, r: U(3.6), r1: U(3.2) }] }] });
  put(hz + (back ? 0.05 : 0.005), { type: 'group', name: 'crown', underlay: true, children: horns });
  put(hz + 0.02, { type: 'group', name: 'jaw', underlay: true, children: [
    { type: 'capsule', name: 'jaw', a: jawRoot, b: jawTip, r: U(2.3), r1: U(1.1), mat: hide, shade: 'normal', round: U(1.5) }] });
  put(hz + 0.03, { type: 'group', name: 'head', underlay: true, children: [
    { type: 'ellipse', name: 'skull', cx: brow[0], cy: brow[1], rx: U(5), ry: U(4.2), mat: hide, shade: 'sphere' },
    { type: 'capsule', name: 'snout', a: brow, b: snout, r: U(4), r1: U(2.2), mat: hide, shade: 'normal', round: U(2) },
  ] });

  const kids = pieces.sort((a, b) => a.z - b.z).map(p => p.g);
  // the eye: a glowing slit (void fire) with a hot core, under the brow ridge decal
  if (L.eye) kids.push({ type: 'rect', name: 'eye', x: L.eye[0], y: L.eye[1], w: 3, h: 2, color: 'glow.0' },
    { type: 'rect', name: 'eye', x: L.eye[0] + (sx > 0 ? 2 : 0), y: L.eye[1] + 1, w: 1, h: 1, color: 'glow.1' });
  s.add({ type: 'group', name: 'eshkal', translate: [L.dx, 0], children: kids });

  // decals are in frame pixels: shift by the figure's centring offset
  const X = q => [q[0] + L.dx, q[1]];
  const bar = (a, b, wd) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * wd / 2, ny = dx / l * wd / 2;
    return { type: 'poly', pts: [X([a[0] + nx, a[1] + ny]), X([b[0] + nx, b[1] + ny]), X([b[0] - nx, b[1] - ny]), X([a[0] - nx, a[1] - ny])] }; };
  const dot = (q, r) => ({ type: 'circle', cx: q[0] + L.dx, cy: q[1], r });
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  let pr = ctx.lib.proc(s)
    .add('ao', { part: ['torso', 'neck', 'thigh', 'upper-leg', 'jaw'] })
    .add('materialNoise', { part: ['thigh', 'upper-leg', 'tail'], amount: 0.06, scale: 2, seed: ctx.variant ?? 0 })
    .add('rimLight', { part: ['horn'], side: 'lit' })
    .add('decal', { name: 'struts', part: 'wing', mat: prm.hide, band: 2, shape: struts.map(([a, b]) => bar(a, b, U(0.9))) })
    // the broken halo's void fire: burning where the horns leave the skull, and in the snapped stumps
    .add('decal', { name: 'halo-fire', part: 'horn', mat: 'glow', band: 1, shape: [...hornRoots.map(q => dot(q, U(1.2))), ...hornBase.map(([a, b]) => bar(a, b, U(1.2)))] })
    .add('decal', { name: 'halo-core', part: 'horn', mat: 'glow', band: 0, shape: [...hornRoots.filter((_, i) => i % 2 === 1).map(q => dot(q, U(0.6))), ...hornStumps.map(q => dot(q, U(0.6)))] });
  if (!back) {
    // front facings: dark scute lines across the pale belly plate
    pr = pr.add('decal', { name: 'scutes', part: 'belly', mat: 'skin', band: 2, shape: [-0.5, 0, 0.5].map(k => bar([belly[0] + k * U(4.5), belly[1] - U(2)], [belly[0] + k * U(4.5) - U(0.8), belly[1] + U(2)], 1)) });
  } else {
    // back facings: a dark spined dorsal ridge down the neck and over the withers in place of the face
    const ridge = [[n0, n1, 0.6], [n1, n2, 0.2], [n1, n2, 0.75], [n2, n3, 0.4]].map(([a, b, t]) => lerp(a, b, t));
    pr = pr.add('decal', { name: 'ridge', part: ['neck', 'torso'], mat: prm.hide, band: 2, shape: ridge.map(q => ({ type: 'poly', pts: [X([q[0] - U(1.2), q[1] + U(0.6)]), X([q[0], q[1] - U(1.6)]), X([q[0] + U(1.2), q[1] + U(0.6)])] })) })
      .add('decal', { name: 'saddle', part: 'torso', mat: prm.hide, band: 2, shape: [0, 1, 2].map(i => ({ type: 'poly', pts: [X([withers[0] - U(5) + i * U(4), withers[1] - U(1)]), X([withers[0] - U(3.6) + i * U(4), withers[1] - U(4)]), X([withers[0] - U(2.4) + i * U(4), withers[1] - U(0.6)])] })) });
  }
  if (L.eye) {
    // the face: a heavy dark brow ridge over the eye, a nostril near the snout tip
    const e = L.eye, nos = lerp(brow, snout, 0.86);
    pr = pr.add('decal', { name: 'brow', part: ['skull', 'snout'], mat: prm.hide, band: 2, shape: { type: 'poly', pts: [X([e[0] - 2, e[1] - 2]), X([e[0] + 5, e[1] - 3]), X([e[0] + 5, e[1] + 3]), X([e[0] - 1, e[1] + 3])] } })
      .add('decal', { name: 'nostril', part: 'snout', mat: prm.hide, band: 2, shape: { type: 'rect', x: Math.round(nos[0] + L.dx) - 1, y: Math.round(nos[1]) - 1, w: 2, h: 1 } });
  }
  if (open > 0.3) {
    // the opened maw: void fire along the jaw's inner edge, bone fangs standing on it
    const fangs = [0.35, 0.6, 0.85].map(t => lerp(jawRoot, jawTip, t));
    pr = pr.add('decal', { name: 'maw', part: 'jaw', mat: 'glow', band: open > 0.8 ? 0 : 1, shape: bar([jawRoot[0], jawRoot[1] - U(1)], [jawTip[0], jawTip[1] - U(0.6)], U(1.4)) });
    if (open > 0.5) pr = pr.add('decal', { name: 'fangs', part: 'jaw', mat: 'hair', band: 0, shape: fangs.map(q => ({ type: 'poly', pts: [X([q[0] - 1, q[1] - U(0.4)]), X([q[0], q[1] - U(2.2)]), X([q[0] + 1, q[1] - U(0.4)])] })) });
  }
  return pr.add('groundShadow', {}).render();
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
