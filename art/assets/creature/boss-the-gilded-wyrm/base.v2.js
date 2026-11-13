// boss-the-gilded-wyrm base.v2 (r2, from base.v1) — SHAPE DRAFT again (flat materials, no proc layers but the ground
// shadow). The redraw the owner's review asked for: v1 read as a horse or camel, not a dragon. One change, the body
// plan's silhouette: the neck and the tail are lengthened into S-curves; the blunt head becomes a wedge dragon skull with
// a hinged lower jaw (opening on the held strike) and the crown of horns sweeps back off it; folded wings sit on the
// shoulders, their wrist peaks standing above the back; the legs are longer and tapered, with a knee in each. The boss
// marks stay: the crown of horns and the hoard-plated back (now a lower row of plates between the folded wings).
// Height 5.1 m against the player as drawn (~82 px).
export const meta = { brief: 'boss-the-gilded-wyrm', pass: 'r2', notes: 'shape draft: S-curved neck and tail, wedge skull with jaw and swept horn crown, folded shoulder wings, longer tapered kneed legs, hoard-plated back' };

export const params = {
  hide: { type: 'swap', options: ['accent', 'leather', 'grass', 'hair'], default: 'accent' },
  plate: { type: 'swap', options: ['skin', 'metal', 'stone'], default: 'skin' },
  neck: { type: 'range', min: 0.8, max: 1.2, default: 1 },
};

// rig height in frame units (U = 1.5 px on the 96 x 128 frame)
const RIG_H = 46;
// the iso view's three-quarter facings: the rig's yaw for each map direction
const TURN = { s: 'sw', e: 'se', n: 'ne', w: 'nw' };

function layout(ctx) {
  const [w, h] = ctx.size, U = v => (v * Math.min(w, h)) / 64, ground = Math.round(h * 0.96);
  const rig = ctx.lib.rigs.body('large', ctx, { facing: TURN[ctx.facing] ?? ctx.facing, height: U(RIG_H), ground,
    proportions: { spine: 0.6, tail: 0.5, leg_up: 0.14, leg_lo: 0.14, barrel: 0.36, head: 0.3, neck: 0.62 * (ctx.params?.neck ?? 1) } });
  const { sx, front, side } = rig, P = rig.pose(ctx.state, ctx.t), sk = rig.skeleton(ctx.state, ctx.t);
  const [sa, sb] = sk.spine, spineY = (sa[1] + sb[1]) / 2, spineL = Math.abs(sb[0] - sa[0]);
  // a point in the body's own frame: f ahead of the spine's middle, s to the side, at height hgt above the ground
  const B = (f, s = 0, hgt = spineY) => P.at('spine', 0.5, f, s, hgt - spineY);
  const D = (f, s = 0) => P.depth('spine') + f * front + s * sx;
  // the neck and head are laid out in the body frame (the same S and head in every facing) and follow how far the rig's
  // neck end has moved from its idle rest (the idle sway, the walk's bob, the strike's arc down and forward)
  const rest = rig.pose('idle', 0), e0 = rest.end('neck'), e1 = P.end('neck'), dv = [e1[0] - e0[0], e1[1] - e0[1]];
  const N = (f, s, hgt, k = 1) => { const q = B(f, s, hgt); return [q[0] + dv[0] * k * 0.55, q[1] + dv[1] * k * 0.7]; };
  const nk = ctx.params?.neck ?? 1, hf = spineL / 2 + U(11), hh = spineY + U(21) * nk;
  const skull = N(hf, 0, hh), near = front > 0, eyeSide = sx > 0 ? -1 : 1;
  const eye = near ? N(hf + U(2.2), eyeSide * U(2.2), hh + U(1.2)).map(Math.round) : null;
  const mouth = N(hf + U(8), 0, hh - U(2)).map(Math.round);
  // the tail curls out to the side the viewer sees past the haunch
  const tside = ctx.facing === 's' || ctx.facing === 'n' ? -1 : 1;
  // the rig stands its spine on the frame's middle, but the neck reaches further ahead than the tail behind: centre the
  // figure's reach (snout to tail hook, at idle rest) on the frame, the same shift in every frame of a facing
  // (half of the strike's body lunge is taken back, so the lunging head stays inside the frame)
  const mid = Q => (Q.at('spine', 0.5, hf + U(8), 0, 0)[0] + Q.at('spine', 0.5, -spineL / 2 - U(20), 0, 0)[0]) / 2;
  // then nudged so the snout, the horn tips and the tail hook (as posed in this frame) keep a margin inside the frame
  const reach = [N(hf + U(8.5), 0, hh - U(2)), N(hf + U(7), 0, hh - U(9)), N(hf - U(13), -U(5.5), hh + U(6)), N(hf - U(13), U(5.5), hh + U(6)),
    ...[[-15, 7, 4], [-19, 11, 7], [-21, 14, 12], [-20, 15.5, 17], [-17, 15.5, 19.5], [-10, 3.5, 5]].map(([f, sd, hg]) => B(-spineL / 2 + U(f) * 0.78, U(sd) * 0.7 * tside, U(hg)))].map(q => q[0]);
  const lo = Math.min(...reach) - U(3), hi = Math.max(...reach) + U(3);
  let dx = Math.round(w / 2 - (mid(rest) + mid(P)) / 2);
  if (hi - lo > w - 3) dx = Math.round(w / 2 - (lo + hi) / 2);
  else if (lo + dx < 1) dx = Math.ceil(1 - lo); else if (hi + dx > w - 2) dx = Math.floor(w - 2 - hi);
  return { w, h, U, rig, P, sk, sx, front, side, ground, spineY, spineL, B, D, N, hf, hh, skull, eye, mouth, near, dx, tside };
}

export function render(ctx) {
  const { pal } = ctx.dir, prm = ctx.params, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), hide = pal[prm.hide], plate = pal[prm.plate];
  const { U, P, sk, sx, front, B, D, N, hf, hh, spineL, spineY, skull } = L;
  const pieces = [], put = (z, g) => pieces.push({ z, g });
  const atk = ctx.state === 'attack', fr = ctx.frame ?? 0, open = atk ? [0.2, 0.6, 1, 0.4][fr % 4] : 0;
  const back = front < 0;

  // legs: long and tapered, each with a knee — the thigh from a round haunch/shoulder, the knee a little out and (hind)
  // forward or (fore) back, the shin tapering to a clawed foot
  for (const e of ['FL', 'FR', 'BL', 'BR']) {
    const up = `leg${e}_up`, lo = `leg${e}_lo`, k = Math.sign(sk[up][0][2]) || (e.endsWith('L') ? -1 : 1), hind = e[0] === 'B';
    const hip = P.start(up), knee = P.at(up, 1, hind ? U(5.5) : -U(3.2), k * U(3), U(1.5)), foot = P.end(lo), z = P.depth(lo) + k * sx * U(5);
    const claws = [-1, 0, 1].map(j => { const c = P.at(lo, 1, U(2.6), k * U(0.6) + j * U(1.2), 0); return { type: 'rect', name: 'claw', x: Math.round(c[0]), y: Math.round(c[1]) - 1, w: 1, h: 2, color: 'hair.0' }; });
    put(z, { type: 'group', name: 'leg', underlay: true, children: [
      { type: 'capsule', name: hind ? 'thigh' : 'upper-leg', a: hip, b: knee, r: hind ? U(4) : U(3.2), r1: U(1.8), mat: hide, shade: 'cyl' },
      { type: 'capsule', name: 'shin', a: knee, b: foot, r: U(1.8), r1: U(1.1), mat: hide, shade: 'cyl' },
      { type: 'ellipse', name: 'foot', cx: P.at(lo, 1, U(1.2), 0, 0)[0], cy: foot[1] - U(0.7), rx: U(2.4), ry: U(1.1), mat: hide, shade: 'flat', band: 1 },
    ] });
    for (const c of claws) put(z + 0.01, c);
  }

  // the tail: a long S — down and back off the haunch, sweeping low and curving out to one side (so it shows beside the
  // body in the front views too), then rising in a hook to a fine tip
  const hind = -spineL / 2, tl = [
    [3, 0, spineY + U(1), U(4.8)], [-4, 1, spineY - U(3), U(4)], [-10, 3.5, U(5), U(3.3)], [-15, 7, U(4), U(2.7)],
    [-19, 11, U(7), U(2.1)], [-21, 14, U(12), U(1.6)], [-20, 15.5, U(17), U(1.1)], [-17, 15.5, U(19.5), U(0.5)],
  ].map(([f, sd, hgt, r]) => [hind + U(f) * 0.78, U(sd) * 0.7 * L.tside, hgt, r]);
  for (let i = 0; i < tl.length - 1; i++) {
    const [f0, s0, h0, r0] = tl[i], [f1, s1, h1, r1] = tl[i + 1];
    put(D((f0 + f1) / 2, (s0 + s1) / 2) - 0.2, { type: 'group', name: 'tail', underlay: true, children: [
      { type: 'capsule', name: 'tail', a: B(f0, s0, h0), b: B(f1, s1, h1), r: r0, r1, mat: hide, shade: 'cyl' }] });
  }

  // the back's hoard-crust: a row of round plates along the spine between the folded wings, tallest over the middle
  const plates = [];
  for (let i = 0; i < 5; i++) {
    const u = -0.36 + i * 0.16, f = u * spineL, ht = U(2.6) + U(2.4) * Math.cos(u * Math.PI * 1.2);
    const c = B(f, 0, spineY + U(6) + ht * 0.5);
    plates.push({ type: 'ellipse', name: 'plate', cx: c[0], cy: c[1], rx: U(3), ry: ht * 0.5 + U(1.4), mat: plate, shade: 'flat', band: 1 });
  }
  put(D(0) + (back ? 0.3 : -0.3), { type: 'group', name: 'plates', underlay: true, children: plates });

  // the body: deep round chest tapering to a waist, a smaller round haunch — never a box
  const haunch = B(-spineL * 0.3, 0, spineY + U(0.5)), waist = B(-spineL * 0.02, 0, spineY + U(0.5)), chest = B(spineL * 0.26, 0, spineY + U(0.5)), belly = B(spineL * 0.12, 0, spineY - U(4));
  put(D(0), { type: 'group', name: 'body', underlay: true, children: [
    { type: 'ellipse', name: 'torso', cx: haunch[0], cy: haunch[1], rx: U(7.5), ry: U(6.8), mat: hide, shade: 'sphere' },
    { type: 'ellipse', name: 'torso', cx: waist[0], cy: waist[1], rx: U(7.5), ry: U(5.6), mat: hide, shade: 'normal' },
    { type: 'ellipse', name: 'torso', cx: chest[0], cy: chest[1], rx: U(9), ry: U(8.2), mat: hide, shade: 'sphere' },
    { type: 'ellipse', name: 'belly', cx: belly[0], cy: belly[1], rx: U(6), ry: U(2.6), mat: pal.skin, shade: 'flat', band: 1 },
  ] });

  // folded wings on the shoulders: the wing arm rises from the shoulder to a wrist peak above the back, the folded
  // membrane hangs back from it to a point over the haunch; the far wing behind the body, the near one over it
  for (const v of [-1, 1]) {
    const sd = v * U(5.5), W = (f, hgt, m = 1) => B(spineL * f, sd * m, spineY + U(hgt));
    const sh = W(0.26, 5), wr = W(0.24, 20, 1.15), tip = W(-0.72, 6, 1.1), root = W(0.08, 5);
    // the folded membrane's trailing edge: three finger points with notches between
    const edge = [W(-0.46, 2, 1.05), W(-0.36, 5), W(-0.24, 1.5), W(-0.14, 5.5), W(-0.02, 2.5)];
    const nearW = v * sx > 0, z = D(0) + (nearW ? 0.5 : -0.5);
    put(z, { type: 'group', name: 'wing', underlay: true, children: [
      { type: 'poly', name: 'wing', pts: [sh, wr, tip, ...edge, root], mat: pal.leather, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'wing-arm', a: sh, b: wr, r: U(1.8), r1: U(0.9), mat: hide, shade: 'cyl' },
      { type: 'capsule', name: 'wing-arm', a: wr, b: tip, r: U(1), r1: U(0.5), mat: hide, shade: 'cyl' },
    ] });
  }

  // the neck: long, an S from the chest — forward and low, back up, then forward again under the head
  const n0 = B(spineL * 0.34, 0, spineY + U(2)), n1 = N(spineL / 2 + U(6), 0, spineY + U(6), 0.3), n2 = N(spineL / 2 + U(5), 0, spineY + U(15), 0.6),
    n3 = N(hf - U(2.5), 0, hh, 0.9);
  // the wedge skull: a round brow at the back tapering to a pointed snout; the lower jaw hinged under the brow
  const brow = N(hf - U(0.5), 0, hh + U(0.8)), snout = N(hf + U(7), 0, hh - U(2));
  const jawRoot = N(hf - U(1), 0, hh - U(2)), jawTip = N(hf + U(6) - open * U(1.5), 0, hh - U(3.2) - open * U(6));
  // the crown: four horns from the back of the skull, swept back and up, the middle ones longest
  const horns = [[-1, 1], [1, 1], [-0.4, 0.65], [0.4, 0.65]].flatMap(([j, tall]) => {
    const root = N(hf - U(1.2), j * U(2.4), hh + U(1.8)), mid = N(hf - U(5.5) * tall, j * U(4.5), hh + U(4.2) * tall + U(1.5)),
      tip = N(hf - U(13) * tall, j * U(5.5), hh + U(4.5) * tall + U(1.5));
    return [{ type: 'capsule', name: 'horn', a: root, b: mid, r: U(1.3), r1: U(0.9), mat: plate, shade: 'flat', band: 0 },
      { type: 'capsule', name: 'horn', a: mid, b: tip, r: U(0.9), r1: U(0.35), mat: plate, shade: 'flat', band: 0 }];
  });
  const hz = D(hf, 0);
  put(hz - 0.01, { type: 'group', name: 'neck', underlay: true, children: [
    { type: 'capsule', name: 'neck', a: n0, b: n1, r: U(4.6), r1: U(3.4), mat: hide, shade: 'cyl' },
    { type: 'capsule', name: 'neck', a: n1, b: n2, r: U(3.4), r1: U(2.8), mat: hide, shade: 'cyl' },
    { type: 'capsule', name: 'neck', a: n2, b: n3, r: U(2.8), r1: U(2.6), mat: hide, shade: 'cyl' }] });
  put(hz + (back ? 0.05 : 0.01), { type: 'group', name: 'crown', underlay: true, children: horns });
  put(hz + 0.02, { type: 'group', name: 'jaw', underlay: true, children: [
    { type: 'capsule', name: 'jaw', a: jawRoot, b: jawTip, r: U(2), r1: U(0.9), mat: hide, shade: 'flat', band: 2 }] });
  put(hz + 0.03, { type: 'group', name: 'head', underlay: true, children: [
    { type: 'ellipse', name: 'skull', cx: brow[0], cy: brow[1], rx: U(3.8), ry: U(3.2), mat: hide, shade: 'sphere' },
    { type: 'capsule', name: 'snout', a: brow, b: snout, r: U(3.2), r1: U(1.4), mat: hide, shade: 'cyl' },
  ] });

  const kids = pieces.sort((a, b) => a.z - b.z).map(p => p.g);
  if (L.eye) kids.push({ type: 'rect', name: 'eye', x: L.eye[0], y: L.eye[1], w: 2, h: 1, color: 'outline' });
  s.add({ type: 'group', name: 'wyrm', translate: [L.dx, 0], children: kids });
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}

export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: L.skull.map(Math.round) };
  delete a.tail;
  a.hand = L.mouth ?? a.head;
  if (L.eye) a.eye = L.eye;
  if (L.mouth) a.mouth = L.mouth;
  // every anchor moves with the figure's centring shift
  for (const k of Object.keys(a)) a[k] = [a[k][0] + L.dx, a[k][1]];
  return a;
};
