// boss-lord-vael-of-the-deep base.v2 (r2, from base.v1) SHAPE DRAFT, ONE change: the shape is redrawn on the owner's
// note ("reads as a thin normal vampire in a cape: narrow torso, stick legs, a boxy tunic"). The bat-wing cape and the
// collar stay; he is broadened: wide shoulders (14 U) and a heavy chest tapering to a nipped waist, the boxy coat skirt
// cut back to a short peplum flaring to an uneven hem above the knee, thick tapered legs set wide with the knees pushed
// out, heavier arms with a clear elbow, deltoids and long claws on both hands, a smaller head on a visible neck, and the
// cape spread wider (rib tips to 31 U a side, the front over half as wide as tall) with a deeper train so the profile
// and three-quarter facings keep the mass. The blood orb is still the one bright accent. Flat materials, no proc layers.
//
// boss-lord-vael-of-the-deep base.v1 (r1) SHAPE DRAFT: Lord Vael of the Deep, the vampire lord of the catacombs (family
// v, an undead caster boss drawn 6.6 m tall, 2.9x the player). Silhouette and form only, flat materials, no proc layers.
// Family-v's high stiff collar, pale narrow face with a widow's peak, fitted dark doublet and long cape, made his own and
// given a lord's mass: the cape is a great bat-wing spread, its top edge held out along both arms from broad shoulders
// to the wrists and falling in scalloped "ribs" to a ragged, flaring hem near the floor, so the front silhouette is a wide
// dark wedge, wider than half his height. The collar's two points rise high above an iron circlet of three spikes; a
// long-skirted coat flares from a nipped waist over bent, tapering legs. His off hand holds a floating orb of blood-fire
// (glow, the one bright accent), his main hand ends in long claws. The attack swings the clawed arm in an arc: raised up
// and back, overhead, raked down and across (held), then back out; the cape wing on that side follows the wrist.
// The body's dominant ramp is the cape's leather (recolour: leather), as the family, so the boss row's blood colours it.
// From the template iso humanoid walker on the shared biped rig (`ctx.lib.rigs.body`): facings s, se, e, ne, n are drawn
// here and the engine mirrors the west ones; parts are placed in the body's frame (`pose.at`), so the cape, collar and
// arms turn with the body in the three-quarter facings and trail as a train in profile.
export const meta = { brief: 'boss-lord-vael-of-the-deep', pass: 'r2', notes: 'shape draft redrawn: broad shoulders, heavy chest to a nipped waist, thick wide-set legs, clawed elbowed arms, head on a neck, wider bat-wing cape', recolour: 'leather' };

export const params = {};

const HM = 6.6; // metres, from the brief
// the main (right, side +) hand per attack frame in the body frame at the shoulder line: [forward, side, up] in U
const SWING = [
  { hand: [-7, 20, 16], spine: 6 },   // wind-up: raised up and back
  { hand: [6, 13, 24], spine: 0 },    // overhead
  { hand: [21, -2, -6], spine: -12 }, // contact: raked down and across, held
  { hand: [9, 22, -6], spine: -5 },   // recovery: back out
];

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, ground = h - 2;
  const H = Math.round(HM * metre * 0.9), U = H / 72;
  const rig = ctx.lib.rigs.body('biped', ctx, { ground, height: H, proportions: { hip: 0.02, head: 0.15, neck: 0.06, leg_up: 0.19, leg_lo: 0.19, arm_up: 0.19, arm_lo: 0.19, legSep: 0.1 } });
  const frame = (ctx.logical ?? ctx.frame ?? 0) % 4, attack = ctx.state === 'attack';
  const P = rig.pose(ctx.state, ctx.t, attack ? { angles: { spine: SWING[frame].spine } } : {});
  const { sx, front, side } = rig, headH = rig.lengths.head, headW = headH * 0.86 * (1 - 0.12 * side);
  const profile = side > 0.9, hcx = P.at('head', 0.5)[0], top = P.end('head')[1];
  const fx = sx * headW * 0.24, fw = headW * (0.66 - 0.25 * side);
  const showFace = front > -0.3, ey = Math.round(top + headH * 0.5);
  const eyes = !showFace ? [] : (profile ? [hcx + fx + fw * 0.22] : [hcx + fx - fw * 0.24, hcx + fx + fw * 0.2]).map(Math.round);
  const mouth = showFace ? [Math.round(profile ? eyes[0] : hcx + fx), Math.round(top + headH * 0.78)] : null;
  // body-frame points: J from the shoulder line (the spine's top), Gd from the ground under the hips
  const sh = P.end('spine'), hipY = P.start('spine')[1];
  const J = (f, s, u) => P.at('spine', 1, f * U, s * U, u * U);
  const Gd = (f, s, z) => P.at('spine', 0, f * U, s * U, z * U - (ground - hipY));
  // the hands: held out wide holding the cape open; the walk swings them a little, the attack swings the main one
  const sw = ctx.state === 'walk' ? Math.sin(ctx.t * Math.PI * 2) * 3 : 0, bob = ctx.state === 'idle' && frame === 1 ? -1 : 0;
  const mainB = attack ? SWING[frame].hand : [6 - sw, 26, -8 + bob];
  const offB = attack ? [9, -24, -2] : [6 + sw, -26, -6 + bob];
  return { w, h, U, rig, P, sx, front, side, ground, headH, headW, profile, hcx, top, fx, fw, showFace, eyes, ey, mouth, frame, attack, J, Gd, mainB, offB, sh };
}

// a closed curve through the points (quadratic midpoint spline); `sharp` indices stay corners
const smooth = (pts, sharp = []) => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let dd = '';
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    if (i === 0) dd += sharp.includes(0) ? `M${p.join(' ')}` : `M${m(pts[n - 1], p).join(' ')} Q${p.join(' ')} ${m(p, q).join(' ')}`;
    else dd += sharp.includes(i) ? ` L${p.join(' ')}` : ` Q${p.join(' ')} ${m(p, q).join(' ')}`;
  }
  return dd + ' Z';
};

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx);
  const { U, P: pose, sx, front, side, ground: G, headH, headW, profile, hcx, top, fx, fw, showFace, eyes, ey, J, Gd, mainB, offB } = L;
  const back = front < -0.2, af = Math.abs(front);
  const sway = ctx.state === 'walk' ? Math.sin(ctx.t * Math.PI * 4) * 1.5 : 0;
  const neck = pose.start('neck');

  // ---- the arms: shoulder, an elbow bent out and down, the hand (body frame, so they turn with him)
  const SH = { L: [0, -13, -1], R: [0, 13, -1] }, HB = { L: offB, R: mainB };
  const elbowB = k => { const a = SH[k], b = HB[k], o = k === 'R' ? 1 : -1; return [(a[0] + b[0]) / 2 - 2, (a[1] + b[1]) / 2 + o * 4, (a[2] + b[2]) / 2 - 5]; };
  const pt = b => J(...b);
  const arm = k => {
    const a = pt(SH[k]), e = pt(elbowB(k)), hd = pt(HB[k]);
    const kids = [
      { type: 'circle', name: 'shoulder', cx: a[0], cy: a[1], r: 4.2 * U, mat: pal.hair, shade: 'sphere' },
      { type: 'capsule', name: 'upper-arm', a, b: e, r: 3.8 * U, r1: 2.9 * U, mat: pal.hair, shade: 'cyl' },
      { type: 'circle', name: 'elbow', cx: e[0], cy: e[1], r: 2.9 * U, mat: pal.hair, shade: 'sphere' },
      { type: 'capsule', name: 'forearm', a: e, b: hd, r: 3 * U, r1: 1.9 * U, mat: pal.hair, shade: 'cyl' },
      { type: 'circle', name: 'hand', cx: hd[0], cy: hd[1], r: 2.3 * U, mat: pal.cloth, shade: 'sphere' },
    ];
    { // long claws on both hands, pointing on along the forearm (the main hand's longest)
      const dx = hd[0] - e[0], dy = hd[1] - e[1], l = Math.hypot(dx, dy) || 1, d = [dx / l, dy / l], n = [-d[1], d[0]], cl = k === 'R' ? 8 : 5;
      for (const m of [-1, 0, 1]) kids.push({ type: 'capsule', name: 'claw', a: [hd[0] + n[0] * m * 1.4 * U, hd[1] + n[1] * m * 1.4 * U], b: [hd[0] + d[0] * cl * U + n[0] * m * 3 * U, hd[1] + d[1] * cl * U + n[1] * m * 3 * U], r: 0.8 * U, r1: 0.3 * U, mat: pal.cloth, shade: 'flat', band: 0 });
    }
    return { type: 'group', name: `arm${k}`, underlay: true, children: kids };
  };
  // the blood orb floating over the off hand: the one bright accent
  const orb = () => { const o = J(offB[0], offB[1], offB[2] + 5.5);
    s.add({ type: 'group', name: 'orb', underlay: true, children: [
      { type: 'circle', name: 'orb', cx: o[0], cy: o[1], r: 3.6 * U, mat: pal.glow, shade: 'flat', band: 1 },
      { type: 'circle', name: 'orb-core', cx: o[0] - 0.6 * U, cy: o[1] - 0.6 * U, r: 1.7 * U, mat: pal.glow, shade: 'flat', band: 0 },
    ] }); };

  // ---- the bat-wing cape: from the collar along each arm to the wrist, then scalloped ribs down to a ragged hem
  const capeF = back ? 1.5 : -2.5; // just behind the body (seen from behind it covers him)
  // the cape's two edges sit at different depths, so in profile it spans from the leading wrist to a train behind
  // (the right edge forward, the left far back); seen from the front or behind the depth does not show
  const FW = { R: [4, 3, 2, 1, 0, -1, -2], L: [-9, -13, -17, -21, -25, -28, -31] };
  const wing = (k, o) => { // the outer edge from the wrist down to the hem corner, as body-frame points
    const hb = HB[k], wr = [hb[0] - 1, hb[1] - o * 1, hb[2] - 1], f = FW[k].map(v => v + capeF);
    return [pt(wr),
      Gd(f[0], o * 31, 45), Gd(f[1], o * 26.5, 39),  // first scallop: a rib tip, then the bay
      Gd(f[2], o * 31, 29), Gd(f[3], o * 25.5, 24),
      Gd(f[4], o * 29.5, 13), Gd(f[5], o * 24, 9),
      Gd(f[6], o * 26 + o * sway * 0.5, 1)];
  };
  const cape = () => {
    const r = wing('R', 1), l = wing('L', -1), hem = [];
    for (let i = 1; i < 8; i++) { const u = i / 8, sd = 25 - 50 * u; hem.push(Gd(capeF - 2 - 28 * u, sd + sway, i % 2 ? 5 : 0.5)); }
    const pts = [J(capeF, -5, 4), J(capeF, 5, 4), J(capeF, 14, 1), ...r, ...hem, ...l.reverse(), J(capeF, -14, 1)];
    // corners at the wrists, rib tips and hem points; rounded over the shoulders and in the bays
    const n = pts.length, sharp = [];
    for (let i = 3; i < n - 1; i++) sharp.push(i);
    s.add({ type: 'path', name: 'cape', underlay: true, d: smooth(pts, sharp), mat: pal.leather, shade: 'normal', round: 2 * U });
  };

  // ---- the high collar: two stiff wings flaring from behind the neck into points well above the circlet
  const collar = () => {
    const pts = [J(capeF + 1, -3, 1), J(capeF, -7.5, 4), J(capeF - 0.5, -10.5, 13), J(capeF - 1, -8.5, 25.5), J(capeF - 0.5, -5.5, 15), J(capeF, -3, 8),
      J(capeF, 3, 8), J(capeF - 0.5, 5.5, 15), J(capeF - 1, 8.5, 25.5), J(capeF - 0.5, 10.5, 13), J(capeF, 7.5, 4), J(capeF + 1, 3, 1)];
    s.add({ type: 'path', name: 'collar', underlay: true, d: smooth(pts, [3, 8]), mat: pal.leather, shade: 'normal', round: U });
  };

  // ---- legs: thighs and shins tapering, bent at the knee, tall boots
  const legs = () => {
    for (const n of pose.far(['legL_up', 'legR_up'])) {
      const lo = n.replace('_up', '_lo'), e = pose.end(lo), o = n[3] === 'R' ? 1 : -1;
      // the knee pushed out to the side (body frame), so the legs stand in a wide, bowed stance
      const sv = [J(0, 1, 0)[0] - J(0, 0, 0)[0], J(0, 1, 0)[1] - J(0, 0, 0)[1]], kn0 = pose.end(n);
      const kn = [kn0[0] + sv[0] * o * 2.5, kn0[1] + sv[1] * o * 2.5], hp = pose.start(n);
      s.add({ type: 'group', name: 'leg', underlay: true, children: [
        { type: 'capsule', name: 'thigh', a: hp, b: kn, r: 4.6 * U, r1: 3.4 * U, mat: pal.hair, shade: 'cyl' },
        { type: 'circle', name: 'knee', cx: kn[0], cy: kn[1], r: 3.3 * U, mat: pal.hair, shade: 'sphere' },
        { type: 'capsule', name: 'shin', a: kn, b: [e[0], e[1] - 1.5 * U], r: 3.3 * U, r1: 2 * U, mat: pal.hair, shade: 'cyl' },
        { type: 'ellipse', name: 'boot', cx: e[0] + sx * 1.8 * U, cy: G - 1.5 * U, rx: (3.6 - 0.6 * af) * U, ry: 1.8 * U, mat: pal.hair, shade: 'sphere' },
      ] });
    }
  };

  // ---- the body: a wedge doublet (broad chest, nipped waist) over a coat skirt flaring to an uneven hem at the knee.
  // Drawn as rings in screen space: each level's half-width blends its width (seen from the front) and its depth (seen
  // in profile), and in the turned views the coat's back edge trails wider than its front.
  const ring = (levels, flare = 0) => {
    const R = [], Lf = [];
    for (const [c, S, F] of levels) {
      const hw = (S * af + F * side) * U, tr = 1 + flare * side; // trailing side: away from the facing (-sx)
      R.push([c[0] + hw * (sx < 0 ? tr : 1), c[1]]); Lf.push([c[0] - hw * (sx > 0 ? tr : 1), c[1]]);
    }
    return { R, Lf };
  };
  const body = () => {
    const sk = ring([[J(0, 0, -19), 6.5, 5.5], [J(-0.5, 0, -25), 9, 7], [Gd(-1, 0, 25), 11, 8.5]], 0.35);
    const hemY = Gd(-1, 0, 21)[1], hc = Gd(-1, 0, 21)[0], hwR = sk.R[2][0] - hc + 1.2 * U, hwL = hc - sk.Lf[2][0] + 1.2 * U;
    const hem = [[hc + hwR, hemY - 1 * U + sway * 0.3], [hc + hwR * 0.62, hemY + 2 * U], [hc + hwR * 0.3, hemY - 1.2 * U], [hc, hemY + 1.8 * U], [hc - hwL * 0.3, hemY - 1.4 * U], [hc - hwL * 0.62, hemY + 2.2 * U], [hc - hwL, hemY - 0.6 * U + sway * 0.3]];
    s.add({ type: 'path', name: 'coat-skirt', underlay: true, d: smooth([...sk.R, ...hem, ...sk.Lf.reverse()], [3, 4, 5, 6, 7, 8, 9]), mat: pal.hair, shade: 'normal', round: 2 * U });
    const to = ring([[J(0, 0, 3.5), 5.5, 4], [J(0, 0, 1), 14, 6.5], [J(0, 0, -5), 14.5, 8.5], [J(0, 0, -11), 11.5, 8], [J(0, 0, -17), 6.5, 5.8], [J(0, 0, -21), 7.5, 6]]);
    s.add({ type: 'path', name: 'doublet', underlay: true, d: smooth([...to.R, ...to.Lf.reverse()], [5, 6]), mat: pal.hair, shade: 'normal', round: 3 * U });
  };

  // ---- the head on its neck: pale and narrow, the widow's peak, the iron circlet of three spikes
  const head = () => {
    const hw = headW / 2, cy = top + headH * 0.5, nk = pose.end('neck');
    s.add({ type: 'capsule', name: 'neck', underlay: true, a: neck, b: [nk[0], nk[1] + headH * 0.15], r: 2.4 * U, mat: pal.cloth, shade: 'cyl' });
    const jx = hcx + fx * 0.5;
    const skull = [[hcx, top], [hcx + hw, top + headH * 0.18], [hcx + hw * 1.02, cy + headH * 0.08], [jx + hw * 0.5, top + headH * 0.92], [jx, top + headH * 1.06], [jx - hw * 0.5, top + headH * 0.92], [hcx - hw * 1.02, cy + headH * 0.08], [hcx - hw, top + headH * 0.18]];
    s.add({ type: 'path', name: 'head', underlay: true, d: smooth(skull, [4]), mat: pal.cloth, shade: 'flat', band: 0 });
    if (showFace) { // slicked hair down to a widow's peak toward the facing
      const px = hcx + fx * 0.8;
      s.add({ type: 'path', name: 'hair', d: smooth([[hcx - hw * 1.06, cy + headH * 0.05], [hcx - hw * 1.02, top - headH * 0.04], [hcx, top - headH * 0.08], [hcx + hw * 1.02, top - headH * 0.04], [hcx + hw * 1.06, cy + headH * 0.05], [px + hw * 0.55, top + headH * 0.22], [px, top + headH * 0.42], [px - hw * 0.55, top + headH * 0.22]], [0, 4, 6]), mat: pal.hair, shade: 'flat', band: 1 });
    } else s.add({ type: 'path', name: 'hair', d: smooth(skull.map(([x, y]) => [x, Math.min(y, top + headH * 0.86)]), [4]), mat: pal.hair, shade: 'flat', band: 1 });
    // the circlet: a band round the brow, three tall spikes standing up from it
    const cyb = top + headH * 0.12, spikes = [[-0.7, 0.45, -1], [0, 0.75, 0], [0.7, 0.45, 1]];
    s.add({ type: 'group', name: 'circlet', underlay: true, children: [
      { type: 'path', name: 'band', d: `M${hcx - hw * 1.05} ${cyb} Q${hcx} ${cyb + headH * 0.12 * af} ${hcx + hw * 1.05} ${cyb} L${hcx + hw * 1.05} ${cyb + 1.1 * U} Q${hcx} ${cyb + 1.1 * U + headH * 0.12 * af} ${hcx - hw * 1.05} ${cyb + 1.1 * U} Z`, mat: pal.metal, shade: 'flat', band: 1 },
      ...spikes.map(([u, ht, lean], i) => { const bx = hcx + hw * u * (1 - 0.35 * side) + (i === 1 ? fx * 0.3 : 0), by = cyb + (i === 1 ? headH * 0.1 * af : 0); return { type: 'path', name: 'spike', d: `M${bx - 1.1 * U} ${by + U} L${bx + lean * 1.6 * U} ${by - headH * ht} L${bx + 1.1 * U} ${by + U} Z`, mat: pal.metal, shade: 'flat', band: 1 }; }),
    ] });
    for (const ex of eyes) s.add({ type: 'rect', name: 'eye', x: ex, y: ey, w: 1, h: 1, mat: pal.accent, shade: 'flat', band: 1 });
  };

  // ---- draw order: from behind the cape covers the body; facing us it hangs behind him
  const arms = pose.far(['armL_up', 'armR_up']).map(n => n[3]); // far first
  if (back) {
    legs(); s.add(arm(arms[0])); if (arms[0] === 'L') orb(); body(); s.add(arm(arms[1])); if (arms[1] === 'L') orb();
    cape(); head(); collar();
  } else {
    cape(); collar(); legs(); if (side > 0.5) { s.add(arm(arms[0])); if (arms[0] === 'L') orb(); }
    body(); head();
    if (side > 0.5) { s.add(arm(arms[1])); if (arms[1] === 'L') orb(); }
    else { s.add(arm('L')); s.add(arm('R')); orb(); }
  }
  return s.render();
}

// Named points per frame: eye/eye2/mouth where the face is seen; `hand` is the clawed hand; `orb` the blood orb.
export const anchors = ctx => {
  const L = layout(ctx), hd = L.J(...L.mainB), ob = L.J(L.offB[0], L.offB[1], L.offB[2] + 5.5);
  const a = { ...L.rig.anchors(L.P), head: [Math.round(L.hcx), Math.round(L.top + L.headH * 0.5)], hand: hd.map(Math.round), orb: ob.map(Math.round) };
  delete a.ground;
  L.eyes.forEach((x, i) => { a[i ? 'eye2' : 'eye'] = [x, L.ey]; });
  if (L.mouth) a.mouth = L.mouth;
  return a;
};
