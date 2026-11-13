// boss-the-stone-mother base.v1 (r1) — SHAPE DRAFT, on the iso walker's shared biped rig (`ctx.lib.rigs.body`), from the
// template iso/character-walk. The Stone Mother (glyph C, slate, a slow construct brute of the dwarven holds), a unique
// boss of the golem family (family-c-cap: a slate-stone golem with a small head sunk low and glowing slit eyes), drawn
// at 5.2 m (about 83 px). Not the family's stacked blocks: a matronly carved idol of stone. A small stone head with the
// family's glowing slits looks out of a peaked stone veil that falls over sloping shoulders into a mantle hump on her back;
// a pear body swells from the shoulders to broad hips and flares into a heavy stone skirt with a broken, uneven hem, stone
// feet showing below it. Her left arm cradles a round boulder "child" against her belly in every state; her right hand
// grips a tapered standing stone (a menhir) as a club, its tip resting on the ground, swung overhead in a wide arc and
// slammed down in the attack. Flat materials only: the body in the cloth ramp (the recoloured ramp, as the family), the
// menhir and the child in the stone ramp; no procedural layers, no texture, no finish.
export const meta = { brief: 'boss-the-stone-mother', pass: 'r1', notes: 'shape draft: veiled stone idol, pear body and flared skirt, cradled boulder child, menhir club', recolour: 'cloth' };

export const params = {};

// fixed per-asset proportions of the rig (bone lengths never change per frame)
const PROPS = { hip: 0.02, neck: 0.03, head: 0.15, leg_up: 0.15, leg_lo: 0.15, arm_up: 0.19, arm_lo: 0.18, shoulder: 0.86, legSep: 0.085, armSep: 0.25 };

// the left arm always cradles the child; the right elbow keeps a bend outside the attack
const overrides = state => {
  const a = { armL_up: 196, armL_lo: 98 };
  if (state !== 'attack') a.armR_lo = 30;
  return a;
};

function layout(ctx) {
  const [w, h] = ctx.size, ground = h - 3, H = 76;
  const rig = ctx.lib.rigs.body('biped', ctx, { ground, height: H, proportions: PROPS });
  const { sx, front, side } = rig, base = rig.pose(ctx.state, ctx.t);
  const P = rig.pose(ctx.state, ctx.t, { angles: { ...base.angles, ...overrides(ctx.state) } });
  const U = v => v * H; // sizes as fractions of the rig height
  const headH = rig.lengths.head, top = P.end('head')[1], hcx = P.at('head', 0.5)[0], neck = P.start('neck'), hip = P.start('spine');
  const profile = side > 0.9, showFace = front > -0.3, fx = sx * U(0.03);
  const ey = Math.round(top + headH * 0.5);
  const eyes = !showFace ? [] : (profile ? [hcx + fx + sx * U(0.01)] : [hcx + fx - U(0.03), hcx + fx + U(0.03)]).map(v => Math.round(v - 1));
  const hand = P.end('armR_lo'), elbow = P.start('armR_lo');
  return { w, h, H, U, rig, P, sx, front, side, ground, headH, top, hcx, neck, hip, profile, showFace, fx, ey, eyes, hand, elbow };
}

export function render(ctx) {
  const { pal } = ctx.dir, L = layout(ctx), { U, P, sx, front, side, ground, headH, top, hcx, neck, hip, showFace, fx, ey, eyes, hand, elbow } = L;
  const s = ctx.lib.t2.scene(...ctx.size, { groundShadow: [L.w / 2, ground, U(0.3)] });
  const body = pal.cloth, stone = pal.stone;
  const back = [], front_ = [], add = (list, n) => list.push(n);
  const lay = (bone, n) => add(P.depth(bone) < -1 ? back : front_, n);

  // legs: short tapered stone columns, mostly under the skirt, with a block foot
  for (const n of P.far(['legL_lo', 'legR_lo'])) {
    const up = n.replace('_lo', '_up');
    s.add({ type: 'group', name: 'leg', underlay: true, children: [
      { type: 'capsule', name: 'thigh', a: P.start(up), b: P.end(up), r: U(0.06), r1: U(0.05), mat: body, shade: 'cyl' },
      { type: 'capsule', name: 'shin', a: P.start(n), b: P.end(n), r: U(0.05), r1: U(0.04), mat: body, shade: 'cyl' },
      { type: 'ellipse', name: 'foot', cx: P.end(n)[0] + sx * U(0.02), cy: P.end(n)[1] - U(0.015), rx: U(0.055 + 0.015 * side), ry: U(0.03), mat: body, shade: 'normal', round: 1 },
    ] });
  }

  // the right arm and the menhir it grips: the stone continues the forearm past the fist
  const dx = hand[0] - elbow[0], dy = hand[1] - elbow[1], l = Math.hypot(dx, dy) || 1, d = [dx / l, dy / l], nn = [-d[1], d[0]];
  const len = U(0.4), at = (k, m) => [hand[0] + d[0] * k + nn[0] * m, hand[1] + d[1] * k + nn[1] * m];
  const menhir = { type: 'group', name: 'menhir', underlay: true, children: [{ type: 'poly', name: 'menhir', mat: stone, shade: 'normal', round: 2, pts: [
    at(-U(0.04), -U(0.04)), at(len * 0.3, -U(0.07)), at(len * 0.7, -U(0.095)), at(len * 0.94, -U(0.06)), at(len, U(0.02)),
    at(len * 0.88, U(0.085)), at(len * 0.6, U(0.09)), at(len * 0.28, U(0.06)), at(-U(0.04), U(0.04)),
  ] }] };
  const armR = { type: 'group', name: 'arm-r', underlay: true, children: [
    { type: 'capsule', name: 'upper-arm', a: P.start('armR_up'), b: P.end('armR_up'), r: U(0.085), r1: U(0.07), mat: body, shade: 'cyl' },
    { type: 'capsule', name: 'forearm', a: P.start('armR_lo'), b: P.end('armR_lo'), r: U(0.075), r1: U(0.06), mat: body, shade: 'cyl' },
    { type: 'circle', name: 'fist', cx: hand[0], cy: hand[1], r: U(0.08), mat: body, shade: 'sphere' },
  ] };
  // the left arm cradles the child against the belly
  const hl = P.end('armL_lo'), child = [hl[0] * 0.4 + hip[0] * 0.6 + sx * U(0.1), hl[1] - U(0.07)];
  const armLup = { type: 'capsule', name: 'upper-arm', underlay: true, a: P.start('armL_up'), b: P.end('armL_up'), r: U(0.085), r1: U(0.07), mat: body, shade: 'cyl' };
  const kid = { type: 'group', name: 'child', underlay: true, children: [
    { type: 'ellipse', name: 'child', cx: child[0], cy: child[1], rx: U(0.13), ry: U(0.115), mat: stone, shade: 'sphere' },
  ] };
  const armLlo = { type: 'group', name: 'arm-l', underlay: true, children: [
    { type: 'capsule', name: 'forearm', a: P.start('armL_lo'), b: P.end('armL_lo'), r: U(0.075), r1: U(0.06), mat: body, shade: 'cyl' },
    { type: 'circle', name: 'fist', cx: hl[0], cy: hl[1], r: U(0.075), mat: body, shade: 'sphere' },
  ] };
  // a far upper arm hides behind the body; the child sits under the forearm that holds it
  lay('armL_up', armLup); lay('armL_lo', kid); lay('armL_lo', armLlo);
  const menhirBehind = P.depth('armR_lo') < -1 || (ctx.state === 'attack' && (ctx.logical ?? ctx.frame) === 0 && front > 0.2);
  add(menhirBehind ? back : front_, menhir); lay('armR_up', armR);
  for (const n of back) s.add(n);

  // the body: a pear torso swelling to the hips, flaring into a stone skirt with a broken hem; turned in three-quarter
  const wf = 1 - 0.22 * side, belly = sx * U(0.06), hump = -sx * U(0.07);
  const sh = neck[1] + U(0.02), wy = hip[1] - U(0.06), hemY = ground - U(0.12);
  const ox = x => x; // screen x is already turned by the rig
  const bodyPts = [
    [neck[0] - U(0.24) * wf + Math.min(0, hump), sh + U(0.05)], [neck[0] - U(0.15) * wf + Math.min(0, hump), sh - U(0.01)], [neck[0], sh - U(0.02)], [neck[0] + U(0.15) * wf + Math.max(0, hump), sh - U(0.01)], [neck[0] + U(0.24) * wf + Math.max(0, hump), sh + U(0.05)],
    [ox(hip[0] + U(0.2) * wf + Math.max(0, belly)), wy], [hip[0] + U(0.3) * wf + Math.max(0, belly) * 0.6, hip[1] + U(0.1)],
  ];
  // the hem: uneven stone teeth from right to left, swaying a little with the stride
  const sway = ctx.state === 'walk' ? Math.round(Math.sin(ctx.t * Math.PI * 4)) : 0, teeth = [0.35, 0.2, 0.06, -0.08, -0.22, -0.35];
  const drop = [0.02, 0.055, 0.015, 0.06, 0.01, 0.045];
  teeth.forEach((f, i) => bodyPts.push([hip[0] + f * U(0.95) * wf + sway, hemY + U(drop[i])]));
  bodyPts.push([hip[0] - U(0.3) * wf + Math.min(0, belly) * 0.6, hip[1] + U(0.1)], [hip[0] - U(0.2) * wf + Math.min(0, belly), wy]);
  s.add({ type: 'group', name: 'body', underlay: true, children: [{ type: 'path', name: 'torso', d: smooth(bodyPts), mat: body, shade: 'normal', round: U(0.05) }] });

  // the veil: a peaked stone hood over the small head, falling to a mantle hump over the shoulders
  const vt = top - U(0.04), vw = U(0.125), mw = U(0.23) * wf;
  const veil = [[hcx - vw * 0.8 + sx * U(0.01), vt + U(0.005)], [hcx + vw * 0.8 + sx * U(0.01), vt + U(0.005)], [hcx + vw, top + headH * 0.2], [hcx + vw + U(0.02) + Math.max(0, hump), top + headH * 1.1],
    [neck[0] + mw + Math.max(0, hump), sh + U(0.06)], [neck[0], sh + U(0.1)], [neck[0] - mw + Math.min(0, hump), sh + U(0.06)],
    [hcx - vw - U(0.02) + Math.min(0, hump), top + headH * 1.1], [hcx - vw, top + headH * 0.2]];
  s.add({ type: 'group', name: 'veil', underlay: true, children: [{ type: 'path', name: 'veil', d: smooth(veil), mat: body, shade: 'normal', round: U(0.04) }] });
  // the face: a small stone oval set in the veil's opening, seen from the front and in profile
  if (showFace) s.add({ type: 'ellipse', name: 'face', cx: hcx + fx, cy: top + headH * 0.55, rx: U(0.055) * (1 - 0.35 * side), ry: headH * 0.42, mat: body, shade: 'flat', band: 1 });
  for (const ex of eyes) s.add({ type: 'rect', name: 'slit', x: ex, y: ey, w: L.profile ? 1 : 2, h: 1, color: 'accent.0' });

  for (const n of front_) s.add(n);
  return ctx.lib.proc(s).render();
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
