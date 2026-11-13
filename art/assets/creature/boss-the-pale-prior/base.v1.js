// boss-the-pale-prior base.v1 (r1) SHAPE DRAFT — The Pale Prior, an ivory-robed caster of the ruined temple and a unique
// boss of family h (the hooded cultists), 4.8 m (about 77 px, 2.1x the drawn player) in the 96 x 128 frame. Silhouette and
// form only, flat materials, no proc layers. What tells him apart from the plain family sprite: the family's peaked hood
// grown tall and swept back, a round shoulder cope over a gaunt pear-shaped robe that flares to an uneven hem, a shepherd's
// crook held upright in the bent off arm (taller than his shoulders, its hook curling forward), and a censer on a chain in
// the main hand that hangs at rest and swings out in a wide arc on the attack (held on the contact frame). The four map
// facings s and n are drawn as three-quarter turns (s faces down-left, n up-right) and e as a profile, so the body turns
// rather than standing flat. Built on the template's shared biped rig (`ctx.lib.rigs.body`); bones are never resized.
// template: iso humanoid walker on the shared biped rig; colours are role ramps and sizes relative to ctx.size (R11).
export const meta = { brief: 'boss-the-pale-prior', pass: 'r1', notes: 'shape draft: tall swept hood, shoulder cope, flared robe, crook in the off hand, censer swung on a chain', recolour: 'cloth' };

export const params = {
  cloth: { type: 'swap', options: ['cloth', 'leather', 'accent'], default: 'cloth' },
};

// s and n are three-quarter turns of the rig (iso: south is screen down-left, north up-right); e is the profile the
// engine mirrors for w
const TURN = { s: 'sw', e: 'e', n: 'ne', w: 'w' };
const HM = 4.8, PLAYER = 37;

// closed smooth outline through points (quadratics through the midpoints)
const smooth = pts => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let d = `M${m(pts[n - 1], pts[0]).join(' ')}`;
  for (let i = 0; i < n; i++) d += ` Q${pts[i].join(' ')} ${m(pts[i], pts[(i + 1) % n]).join(' ')}`;
  return d + ' Z';
};
// two-bone reach with fixed lengths: the elbow bends to the `bend` side of the shoulder-to-hand line
const reach = (a, t, l1, l2, bend) => {
  const dx = t[0] - a[0], dy = t[1] - a[1], d = Math.min(Math.hypot(dx, dy) || 1, l1 + l2 - 0.01), u = [dx / (Math.hypot(dx, dy) || 1), dy / (Math.hypot(dx, dy) || 1)];
  const k = (l1 * l1 - l2 * l2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, l1 * l1 - k * k));
  const elbow = [a[0] + u[0] * k - u[1] * hh * bend, a[1] + u[1] * k + u[0] * hh * bend];
  const hand = [a[0] + u[0] * d, a[1] + u[1] * d];
  return { elbow, hand };
};

// Geometry shared by render() and anchors()
function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, S = (HM * metre) / PLAYER, X = v => v * S, hr = ctx.dir.scale.proportions?.headRatio ?? 0.4;
  const ground = h - 1, facing = TURN[ctx.facing] ?? ctx.facing;
  const rig = ctx.lib.rigs.body('biped', ctx, { facing, ground, height: Math.round(HM * metre - X(3.6)), proportions: { head: hr * 0.7 } });
  const { sx, front, side } = rig, P = rig.pose(ctx.state, ctx.t), headH = rig.lengths.head / 0.92;
  const dir = sx < 0 ? -1 : 1, headW = headH * 0.92 * (1 - 0.1 * side);
  const hcx = P.at('head', 0.5)[0], top = P.end('head')[1];
  const fx = dir * headW * 0.2 * side * 1.4, fw = headW * (0.62 - 0.2 * side);
  const showFace = front > -0.3, ey = Math.round(top + headH * 0.5);
  const eyes = !showFace ? [] : [hcx + fx - fw * 0.24 + dir * 0.5, hcx + fx + fw * 0.2 + dir * 0.5].map(Math.round);
  const mouth = showFace ? [Math.round(hcx + fx), Math.round(top + headH * 0.78)] : null;
  // arms: L holds the crook, bent at the elbow in front of the body; R carries the censer (the rig swings it on walk and
  // attack; at rest the forearm is bent forward and the censer hangs from the hand)
  const shL = P.start('armL_up'), shR = P.start('armR_up'), l1 = rig.lengths.armL_up, l2 = rig.lengths.armL_lo;
  const out = Math.sign(shL[0] - P.start('neck')[0]) || -dir;
  const crookArm = reach(shL, [shL[0] + out * X(rig.front < 0 ? 7.5 : 4.2) * (1 - 0.6 * side) + dir * X(1.6 + 4 * side * side), shL[1] + (l1 + l2) * 0.72], l1, l2, -dir);
  const censerArm = ctx.state === 'idle'
    ? reach(shR, [shR[0] + dir * X(2.2), shR[1] + (l1 + l2) * 0.78], rig.lengths.armR_up, rig.lengths.armR_lo, -dir)
    : { elbow: P.end('armR_up'), hand: P.end('armR_lo') };
  // the censer: hanging from the hand (swaying on the walk), or flung along the arm's swing on the attack
  const chain = X(6.5);
  let cdir;
  if (ctx.state === 'attack') { const v = [censerArm.hand[0] - shR[0], censerArm.hand[1] - shR[1]], l = Math.hypot(...v) || 1; cdir = [v[0] / l, v[1] / l]; }
  else { const sway = ctx.state === 'walk' ? Math.sin(ctx.t * Math.PI * 2) * 0.25 : 0; cdir = [Math.sin(sway) * dir, Math.cos(sway)]; }
  const censer = [censerArm.hand[0] + cdir[0] * chain, censerArm.hand[1] + cdir[1] * chain];
  return { w, h, X, S, rig, P, sx, dir, front, side, ground, headH, headW, hcx, top, fx, fw, showFace, eyes, ey, mouth, crookArm, censerArm, censer, shL, shR };
}

export function render(ctx) {
  const { pal } = ctx.dir, Pm = ctx.params, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), cloth = pal[Pm.cloth];
  const { X, P: pose, dir, front, side, ground, headH, headW, hcx, top, fx, fw, showFace, eyes, ey, crookArm, censerArm, censer, shL, shR } = L;
  const neck = pose.start('neck'), hip = pose.start('spine'), back = front < 0, wf = 1 - 0.12 * side;
  const flat = (mat, band) => ({ mat, shade: 'flat', band });
  // legs and feet under the robe: only the feet show below the hem
  const legs = pose.far(['legL_up', 'legR_up']);
  for (const n of legs) {
    const lo = n.replace('_up', '_lo'), e = pose.end(lo);
    s.add({ type: 'group', name: 'leg', underlay: true, children: [
      { type: 'capsule', name: 'leg', a: pose.start(n), b: pose.end(n), r: X(1.5), r1: X(1.2), ...flat(pal.leather, 2) },
      { type: 'capsule', name: 'leg', a: pose.start(lo), b: e, r: X(1.2), r1: X(0.9), ...flat(pal.leather, 2) },
      { type: 'ellipse', name: 'foot', cx: e[0] + dir * X(1), cy: e[1] - X(0.6), rx: X(1.8), ry: X(0.9), ...flat(pal.leather, 1) },
    ] });
  }
  // the arms and what they hold
  const sleeve = (name, a, el, hd) => ({ type: 'group', name, underlay: true, children: [
    { type: 'capsule', name: 'sleeve', a, b: el, r: X(1.4), r1: X(1.3), ...flat(cloth, 1) },
    { type: 'capsule', name: 'sleeve', a: el, b: [el[0] + (hd[0] - el[0]) * 0.8, el[1] + (hd[1] - el[1]) * 0.8], r: X(1.3), r1: X(2), ...flat(cloth, 1) },
    { type: 'circle', name: 'hand', cx: hd[0], cy: hd[1], r: X(0.95), ...flat(pal.skin, 0) },
  ] });
  const crook = () => {
    const hx = crookArm.hand[0], ty = top - X(1.5), cr = X(2.4), cd = side > 0.9 ? dir : (Math.sign(hx - hcx) || dir);
    s.add({ type: 'group', name: 'crook', underlay: true, children: [
      { type: 'capsule', name: 'crook-shaft', a: [hx, ground - X(0.5)], b: [hx, ty + cr], r: X(0.55), ...flat(pal.leather, 1) },
      { type: 'arc', name: 'crook-hook', cx: hx + cd * cr, cy: ty + cr, r: cr, w: X(1.1), a0: cd > 0 ? 180 : 0, a1: cd > 0 ? 360 : 180, ...flat(pal.metal, 1) },
      { type: 'capsule', name: 'crook-hook', a: [hx + cd * cr * 2, ty + cr], b: [hx + cd * cr * 1.7, ty + cr * 1.7], r: X(0.55), ...flat(pal.metal, 1) },
    ] });
  };
  const censerArmNode = () => {
    s.add(sleeve('arm-censer', shR, censerArm.elbow, censerArm.hand));
    s.add({ type: 'capsule', name: 'chain', a: censerArm.hand, b: censer, r: 0.5, ...flat(pal.metal, 2) });
    s.add({ type: 'group', name: 'censer', underlay: true, children: [
      { type: 'path', name: 'censer-cap', d: smooth([[censer[0], censer[1] - X(1.9)], [censer[0] + X(1.3), censer[1] - X(0.4)], [censer[0] - X(1.3), censer[1] - X(0.4)]]), ...flat(pal.metal, 0) },
      { type: 'ellipse', name: 'censer-bowl', cx: censer[0], cy: censer[1] + X(0.5), rx: X(1.7), ry: X(1.3), ...flat(pal.metal, 1) },
    ] });
  };
  const crookArmNode = () => { crook(); s.add(sleeve('arm-crook', shL, crookArm.elbow, crookArm.hand)); };
  // far arm (and its item) behind the body, near arm in front
  // in profile the crook is held out in front of the chest, so it is drawn over the body whichever arm is far
  const [farArm] = pose.far(['armL_up', 'armR_up']), farIsCrook = side > 0.9 ? false : farArm === 'armL_up';
  if (farIsCrook) crookArmNode(); else censerArmNode();

  // the robe: a gaunt, pear-shaped body from narrow shoulders, a pinched waist, then flaring to an uneven hem; the hem
  // follows the feet on the walk and leans a little toward the facing
  const feet = pose.far(['legL_lo', 'legR_lo']).map(n => pose.end(n)), fcx = (feet[0][0] + feet[1][0]) / 2;
  const hemY = ground - X(1.6), lean = dir * X(0.7) * side, bx = hip[0];
  const R = v => X(v) * wf;
  const robe = [
    [neck[0], neck[1] - X(0.5)],
    [neck[0] + R(3.6), neck[1] + X(1.6)],
    [neck[0] + R(4.2), neck[1] + X(6)],
    [bx + R(3.3), hip[1] - X(1)],
    [bx + R(4.4) + lean * 0.5, hip[1] + X(5)],
    [fcx + R(7) + lean, hemY - X(1.4)],
    [fcx + R(7.8) + lean, hemY + X(0.2)],
    [fcx + R(3.4) + lean, hemY + X(0.9)],
    [fcx + R(0.6) + lean, hemY - X(0.2)],
    [fcx - R(2.6) + lean, hemY + X(1)],
    [fcx - R(7.3) + lean, hemY + X(0.4)],
    [fcx - R(6.8) + lean, hemY - X(1.6)],
    [bx - R(4.3) + lean * 0.5, hip[1] + X(5)],
    [bx - R(3.2), hip[1] - X(1)],
    [neck[0] - R(4.1), neck[1] + X(6)],
    [neck[0] - R(3.5), neck[1] + X(1.6)],
  ];
  s.add({ type: 'path', name: 'robe', underlay: true, d: smooth(robe), ...flat(cloth, 1) });
  // the cope: a round shoulder cape wider than the robe, its front edge dipping to a point at the breastbone
  const cy0 = neck[1] - X(0.4), cdepth = X(7.5);
  const cope = back
    ? [[neck[0], cy0], [neck[0] + R(6.3), cy0 + X(2.4)], [neck[0] + R(6.1), cy0 + cdepth * 0.8], [neck[0] + dir * X(0.5), cy0 + cdepth * 1.05], [neck[0] - R(6.1), cy0 + cdepth * 0.8], [neck[0] - R(6.3), cy0 + X(2.4)]]
    : [[neck[0], cy0], [neck[0] + R(6.3), cy0 + X(2.4)], [neck[0] + R(6), cy0 + cdepth * 0.72], [neck[0] + dir * X(1) * side, cy0 + cdepth * 1.15], [neck[0] - R(6), cy0 + cdepth * 0.72], [neck[0] - R(6.3), cy0 + X(2.4)]];
  s.add({ type: 'path', name: 'cope', underlay: true, d: smooth(cope), ...flat(cloth, 0) });

  // the head: the family's peaked hood, grown tall and swept back; the same hood in every facing
  const hb = top + headH * 1.05, hw = headW / 2 + X(1.1), peakX = hcx - dir * X(3) * (0.25 + side), peakY = top - X(5);
  s.add({ type: 'ellipse', name: 'neck', cx: neck[0], cy: neck[1] - X(0.6), rx: X(1.4), ry: X(1.4), ...flat(pal.skin, 1) });
  const hood = [[peakX, peakY], [peakX, peakY], [hcx + hw * 0.75, top + headH * 0.05], [hcx + hw, top + headH * 0.6], [hcx + hw * 0.9, hb], [hcx, hb + X(0.8)], [hcx - hw * 0.9, hb], [hcx - hw, top + headH * 0.6], [hcx - hw * 0.75, top + headH * 0.05]];
  s.add({ type: 'path', name: 'hood', underlay: true, d: smooth(hood), ...flat(cloth, 0) });
  if (showFace) {
    // a long, gaunt, pale face in the hood's opening: round brow, narrow jaw
    const fcx2 = hcx + fx, ft = top + headH * 0.28, fb = top + headH * 0.98;
    s.add({ type: 'path', name: 'face-hollow', d: smooth([[fcx2, ft - X(0.8)], [fcx2 + fw * 0.62, ft + X(0.6)], [fcx2 + fw * 0.6, fb - X(1.2)], [fcx2, fb + X(0.6)], [fcx2 - fw * 0.6, fb - X(1.2)], [fcx2 - fw * 0.62, ft + X(0.6)]]), ...flat(cloth, 2) });
    s.add({ type: 'path', name: 'face', d: smooth([[fcx2, ft], [fcx2 + fw * 0.5, ft + X(0.9)], [fcx2 + fw * 0.42, fb - X(1.6)], [fcx2 + dir * X(0.3), fb], [fcx2 - fw * 0.42, fb - X(1.6)], [fcx2 - fw * 0.5, ft + X(0.9)]]), ...flat(pal.skin, 0) });
    for (const ex of eyes) s.add({ type: 'rect', name: 'eye', x: ex, y: ey, w: 1, h: Math.max(1, Math.round(X(0.8))), color: 'outline' });
  }
  if (farIsCrook) censerArmNode(); else crookArmNode();
  return s.render();
}

// Named points per frame: head, hand (the censer hand), eyes and mouth where the face shows
export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: [Math.round(L.hcx), Math.round(L.top + L.headH * 0.5)], hand: L.censerArm.hand.map(Math.round) };
  delete a.ground;
  L.eyes.forEach((x, i) => { a[i ? 'eye2' : 'eye'] = [x, L.ey]; });
  if (L.mouth) a.mouth = L.mouth;
  return a;
};
