// boss-the-drowned-duke base.v3 (r3) — knight build after the owner's rejection of v2: anchor held out to one side clear of the body in every facing (same size, joined to the hand by a chain); metal helm under a spiked ducal coronet; broad pauldrons; narrower waist; legs shown; cloak flares only below the hips. Was: base.v2 (r2) — shape redraw of v1 after the owner's rejection: figure drawn to the brief's 2.4 m; big anchor held clear of the body (ring, shank, stock, curved flukes) on the arm rig; broader shoulders; taller spiked ducal coronet; longer ragged cloak hem. Was base.v1 (r1) — template: iso humanoid walker — facings and a walk cycle, each cell a 2D sprite standing on a 2:1
// ground shadow (the iso hero approach; use 3D mode when every facing must come from one model), on the shared biped rig
// (`ctx.lib.rigs.body`). Facings s, se, e, ne, n are drawn here; the engine mirrors the west ones. The rig turns the figure
// (`yaw`: 0 = facing the viewer, 90 = east, 180 = back): the face slides toward the facing side and disappears from behind,
// the body narrows in profile. Its walk steps the feet on the ground with a 1 px bob on the contact frames and swings the
// arms against the legs; `attack` swings the right arm, `hurt` recoils. This file only dresses the skeleton: silhouette
// first, then costume, gear and face; keep every size relative to ctx.size and colours to role ramps (R11).
export const meta = { brief: 'boss-the-drowned-duke', pass: 'r3', notes: 'shape draft: hulking drowned duke, spiked coronet, sodden ragged cloak, great anchor' };

export const params = {
  cloth: { type: 'swap', options: ['cloth', 'leather', 'accent'], default: 'cloth' },
  item: { type: 'choice', options: ['anchor', 'blade', 'staff', 'none'], default: 'anchor' },
  hood: { type: 'toggle', default: false, p: 0.35 },
};

// Geometry shared by render() and anchors(): the rig's pose for this state and phase, then head, face and hand on it, so the
// face and hand anchors sit exactly on the drawn pixels in every cell.
function layout(ctx) {
  const [w, h] = ctx.size, X = v => v, hr = ctx.dir.scale.proportions?.headRatio ?? 0.4;
  const ground = Math.round(h * 0.95), rig = ctx.lib.rigs.body('biped', ctx, { ground, height: Math.round(ctx.dir.scale.metre * 2.4 * 0.78), proportions: { head: hr * 0.951 } });
  const { sx, front, side } = rig, P = rig.pose(ctx.state, ctx.t), headH = rig.lengths.head / 0.92;
  const headW = Math.min(w * 0.62, headH * 1.2) * (1 - 0.12 * side), bodyW = Math.max(X(8), headW * 0.82) * 1.75 * (1 - 0.3 * side);
  const profile = side > 0.9, hcx = P.at('head', 0.5)[0], top = P.end('head')[1], hand = P.end('armR_lo');
  const fx = sx * headW * 0.24, fw = headW * (0.72 - 0.3 * side);
  // the face is seen from the front and in profile, not from behind; eyes on whole pixels (the finish repaints them)
  const showFace = front > -0.3, ey = Math.round(top + headH * 0.52), eh = Math.max(1, Math.round(X(2)));
  const eyes = !showFace ? [] : (profile ? [hcx + fx + fw * 0.15] : [hcx + fx - fw * 0.28, hcx + fx + fw * 0.2]).map(Math.round);
  const mouth = showFace ? [profile ? eyes[0] : Math.round(hcx + fx - 0.5), ey + eh] : null;
  return { w, h, X, rig, P, sx, front, side, ground, headH, headW, bodyW, profile, hcx, top, hand, fx, fw, showFace, eyes, ey, eh, mouth };
}

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), cloth = pal[P.cloth];
  const { X, P: pose, side, sx, front, ground, headH, headW, bodyW, profile, hcx, top, hand, fx, fw, showFace, eyes, ey, eh } = L;
  const neck = pose.start('neck'), hip = pose.start('spine');
  const limb = (a, b, r) => ({ type: 'capsule', a: pose.start(a), b: pose.end(b), r, mat: cloth, shade: 'cyl' });
  const legR = (profile ? 0.5 : 0.35) * bodyW / 2;
  // the held item: a blade turns with the hand, a staff stands beside it
  const item = () => {
    if (P.item === 'anchor') {
      const ax = neck[0] + (profile ? (sx || 1) * (bodyW / 2 + X(11)) : (front < -0.2 ? -1 : 1) * (bodyW / 2 + X(12))), top0 = top - X(7), mid = ground - X(1), w1 = Math.max(2, X(2));
      const sy = ctx.state === 'attack' ? -X(4) : 0; // lifted a little in the swing
      s.add({ type: 'group', name: 'anchor', underlay: true, children: [
        { type: 'rect', name: 'chain', x: Math.min(hand[0], ax), y: hand[1] - X(0.5), w: Math.abs(ax - hand[0]), h: Math.max(1, X(1.2)), mat: pal.metal, shade: 'flat', band: 1 },
        { type: 'rect', name: 'shank', x: ax - w1 / 2, y: top0 + X(3) + sy, w: w1, h: mid - top0 - X(3), mat: pal.metal, shade: 'cyl', axis: 'y' },
        { type: 'rect', name: 'stock', x: ax - X(6), y: top0 + X(5) + sy, w: X(12), h: Math.max(2, X(2)), mat: pal.metal, shade: 'flat', band: 1 },
        { type: 'ellipse', name: 'ring', cx: ax, cy: top0 + X(1.5) + sy, rx: X(3), ry: X(3), mat: pal.metal, shade: 'sphere' },
        { type: 'ellipse', name: 'ringhole', cx: ax, cy: top0 + X(1.5) + sy, rx: X(1.2), ry: X(1.2), color: 'outline' },
        { type: 'tube', name: 'flukes', mat: pal.metal, shade: 'cyl', w: w1, pts: [[ax - X(8), mid - X(8) + sy], [ax - X(7), mid - X(3) + sy], [ax - X(3.5), mid + X(0.5) + sy], [ax, mid + X(1.5) + sy], [ax + X(3.5), mid + X(0.5) + sy], [ax + X(7), mid - X(3) + sy], [ax + X(8), mid - X(8) + sy]] },
      ] });
    } else if (P.item === 'blade') {
      const a = pose.angles.armR_up - 180 + pose.angles.armR_lo + pose.angles.spine, dir = (180 - (ctx.state === 'walk' || ctx.state === 'idle' ? 0 : 0.4 * a)) * Math.PI / 180, len = X(15);
      const tip = pose.at('armR_lo', 1, len * Math.sin(dir), 0, -len * Math.cos(dir)), dx = tip[0] - hand[0], dy = tip[1] - hand[1], l = Math.hypot(dx, dy) || 1, d = [dx / l, dy / l], n = [-d[1], d[0]], hw = X(1.1), gw = X(1.2 + 1.3 * Math.abs(front));
      const at = (k, m) => `${hand[0] + d[0] * k + n[0] * m} ${hand[1] + d[1] * k + n[1] * m}`;
      s.add({ type: 'group', name: 'blade', underlay: true, children: [
        { type: 'path', d: `M${at(0, -hw)} L${at(l - X(3), -hw)} L${at(l, 0)} L${at(l - X(3), hw)} L${at(0, hw)} Z`, mat: pal.metal, shade: 'bevel' },
        { type: 'path', d: `M${at(0, -gw)} L${at(Math.max(1, X(1.4)), -gw)} L${at(Math.max(1, X(1.4)), gw)} L${at(0, gw)} Z`, mat: pal.accent, shade: 'flat', band: 1 },
      ] });
    } else if (P.item === 'staff') s.add({ type: 'group', name: 'staff', underlay: true, children: [
      { type: 'rect', x: hand[0] - X(0.75), y: top + X(2), w: Math.max(1, X(1.5)), h: ground - top - X(3), mat: pal.wood, shade: 'cyl', axis: 'y' },
      { type: 'circle', cx: hand[0], cy: top + X(2), r: Math.max(1, X(2)), mat: pal.glow, shade: 'sphere' },
    ] });
  };
  if (front < -0.2) item(); // carried in front of the body: hidden behind it from the back
  const arm = n => ({ type: 'group', name: 'arm', underlay: true, children: [limb(`arm${n}_up`, `arm${n}_up`, Math.max(1, X(1.6))), limb(`arm${n}_lo`, `arm${n}_lo`, Math.max(1, X(1.6))), { type: 'circle', cx: pose.end(`arm${n}_lo`)[0], cy: pose.end(`arm${n}_lo`)[1], r: Math.max(0.8, X(1.4)), mat: pal.skin, shade: 'flat', band: 0 }] });
  const arms = pose.far(['armL_up', 'armR_up']).map(n => n[3]);
  { // sodden ragged cloak: narrow behind the torso, flaring only below the hips to a jagged hem
    const back = front < -0.2, hw0 = bodyW * (back ? 0.5 : 0.3), hw1 = bodyW * 0.62 + X(back ? 4 : 2), ty = neck[1] + X(2), hy = ground - X(1), cxn = hip[0] - sx * X(1) * side, wy = hip[1] + X(1);
    s.add({ type: 'path', name: 'cloak', underlay: true, mat: pal.leather, shade: 'normal', round: X(1),
      d: `M${cxn - hw0} ${ty} H${cxn + hw0} V${wy} L${cxn + hw1 + X(1)} ${hy - X(3)} L${cxn + hw1 * 0.5} ${hy + X(1)} L${cxn + hw1 * 0.2} ${hy - X(2)} L${cxn - hw1 * 0.2} ${hy + X(1)} L${cxn - hw1 * 0.55} ${hy - X(1)} L${cxn - hw1 - X(1)} ${hy} L${cxn - hw0} ${wy} Z` });
  }
  // legs, far side first: greaves in front of the cloak
  s.add({ type: 'group', name: 'legs', underlay: true, mat: pal.metal, shade: 'cyl', children: pose.far(['legL_up', 'legR_up']).flatMap(n => [{ ...limb(n, n, legR), mat: pal.metal }, { ...limb(n.replace('_up', '_lo'), n.replace('_up', '_lo'), legR), mat: pal.metal }]) });
  if (profile) s.add(arm(arms[0]));
  s.add({ type: 'group', name: 'body', underlay: true, children: [
    { type: 'path', name: 'torso', d: `M${neck[0] - bodyW * 0.55} ${neck[1]} H${neck[0] + bodyW * 0.55} L${hip[0] + bodyW * 0.3} ${hip[1] - X(3)} L${hip[0] + bodyW * 0.36} ${hip[1] + X(1)} H${hip[0] - bodyW * 0.36} L${hip[0] - bodyW * 0.3} ${hip[1] - X(3)} Z`, mat: cloth, shade: 'normal', round: X(2) },
    { type: 'rect', name: 'belt', x: hip[0] - bodyW / 2 - X(0.5), y: hip[1] - X(2), w: bodyW + X(1), h: Math.max(1, X(1.2)), mat: pal.leather, shade: 'flat', band: 2 },
    ...(front > 0.2 ? [{ type: 'rect', name: 'buckle', x: hip[0] - X(1) + sx * bodyW * 0.3, y: hip[1] - X(2), w: X(2), h: Math.max(1, X(1.2)), mat: pal.accent, shade: 'flat', band: 0 }] : []),
  ] });
  // arms: both sides facing the viewer or away, the near arm swinging in profile; the hand closes over the item's grip
  for (const k of (profile ? [1] : [-1, 1])) s.add({ type: 'ellipse', name: 'pauldron', underlay: true, cx: neck[0] + k * (profile ? 0 : bodyW * 0.62), cy: neck[1] + X(1), rx: X(profile ? 5 : 6.5), ry: X(4), mat: cloth, shade: 'sphere' });
  if (front >= -0.2) item();
  s.add(arm(profile ? arms[1] : arms[0]));
  if (!profile) s.add(arm(arms[1]));
  s.add({ type: 'group', name: 'head', underlay: true, children: [
    { type: 'ellipse', name: 'helm', cx: hcx, cy: top + headH * 0.48, rx: headW / 2, ry: headH * 0.5, mat: pal.metal, shade: 'sphere' },
    ...(showFace ? [{ type: 'path', name: 'face', d: `M${hcx + fx - fw / 2} ${top + headH * 0.45} Q${hcx + fx} ${top + headH * 0.25} ${hcx + fx + fw / 2} ${top + headH * 0.45} V${top + headH * 0.72} Q${hcx + fx} ${top + headH * 1.02} ${hcx + fx - fw / 2} ${top + headH * 0.72} Z`, mat: pal.metal, shade: 'normal', round: X(2) }] : []),
    ...[-2, -1, 0, 1, 2].map(i => ({ type: 'poly', name: 'crown', mat: pal.accent, shade: 'flat', band: 0, pts: [[hcx + i * headW * 0.2 - headW * 0.1, top + headH * 0.12], [hcx + i * headW * 0.2, top - X(7) + Math.abs(i) * X(2)], [hcx + i * headW * 0.2 + headW * 0.1, top + headH * 0.12]] })),
    ...(P.hood ? [{ type: 'ellipse', name: 'hood', cx: hcx - fx * 0.5, cy: top + headH * 0.42, rx: headW / 2 + X(1), ry: headH * 0.48, mat: cloth, shade: 'sphere' }] : []),
  ] });
  for (const ex of eyes) s.add({ type: 'rect', name: 'eye', x: ex, y: ey, w: 1, h: eh, color: 'outline' });
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}

// Named points per frame: the finishing pass paints the face at eye/eye2/mouth (only where the face is visible);
// `hand` is exported in pack.json so effects and held props follow it in game (sprite.anchor('hand')).
export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: [Math.round(L.hcx + L.sx * L.w * 0.08), Math.round(L.top + L.headH * 0.5)] };
  delete a.ground;
  L.eyes.forEach((x, i) => { a[i ? 'eye2' : 'eye'] = [x, L.ey]; });
  if (L.mouth) a.mouth = L.mouth;
  return a;
};
