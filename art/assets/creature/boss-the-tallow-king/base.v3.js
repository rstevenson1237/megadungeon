// boss-the-tallow-king base.v3 (r3) — DECORATION pass on the owner-approved v2 silhouette (stage shape approved 2026-11-13).
// Nothing moves outside the outer line; inside it: the robe goes on the cloth ramp (the family-k-cap recolour ramp, so the
// row colour reaches it in game), dark armour plates show under the robe (a breastplate down the open front, steel greaves,
// pauldron plates on the shoulders, steel gauntlets), tallow wax drips run down the robe, the crown band and the club's arms as decals,
// the crown's candles are parted by shadow gaps, their flames on the glow ramp, the eyes burn on the glow ramp in a pale tallow face, and the back
// shows a dark mantle over the shoulders with the crown's back. The attack cells keep v2's club pose: moving the club would
// change the approved silhouette of those cells (the shape key covers every cell), so the swing waits for a later shape round.
// boss-the-tallow-king base.v2 (r2) — SHAPE DRAFT again; owner rejected v1 ("tiny; no arms or weapon read"). Changes: height 2 m (32 px),
// slimmer body, arms held out from the torso and the candelabra-club raised on a clear side, so arms and club read at 1x.
// (was: boss-the-tallow-king base.v1 (r1) — template: iso humanoid walker — facings and a walk cycle, each cell a 2D sprite standing on a 2:1
// ground shadow (the iso hero approach; use 3D mode when every facing must come from one model), on the shared biped rig
// (`ctx.lib.rigs.body`). Facings s, se, e, ne, n are drawn here; the engine mirrors the west ones. The rig turns the figure
// (`yaw`: 0 = facing the viewer, 90 = east, 180 = back): the face slides toward the facing side and disappears from behind,
// the body narrows in profile. Its walk steps the feet on the ground with a 1 px bob on the contact frames and swings the
// arms against the legs; `attack` swings the right arm, `hurt` recoils. This file only dresses the skeleton: silhouette
// first, then costume, gear and face; keep every size relative to ctx.size and colours to role ramps (R11).
// SHAPE DRAFT (r1): The Tallow King, a human brute of the cellars: a vast pear-shaped body in a wax-slumped robe that pools into
// drips at the hem, a bald lumpy head under a crown of three guttering candles, and an iron candelabra-club in the fist.
export const meta = { brief: 'boss-the-tallow-king', pass: 'r3', notes: 'decorated: cloth robe over dark plate, wax drips, glowing eyes and flames' };

export const params = {
  cloth: { type: 'swap', options: ['cloth', 'accent', 'leather'], default: 'cloth' },
  item: { type: 'choice', options: ['club', 'none'], default: 'club' },
  };

// Geometry shared by render() and anchors(): the rig's pose for this state and phase, then head, face and hand on it, so the
// face and hand anchors sit exactly on the drawn pixels in every cell.
function layout(ctx) {
  const [w, h] = ctx.size, X = v => (v * w) / 56, hr = ctx.dir.scale.proportions?.headRatio ?? 0.4;
  const ground = h - 2, rig = ctx.lib.rigs.body('biped', ctx, { ground, height: Math.round(h * 0.29), proportions: { head: hr * 0.951 } });
  const { sx, front, side } = rig, P = rig.pose(ctx.state, ctx.t), headH = rig.lengths.head / 0.92;
  const headW = Math.min(w * 0.62, headH * 1.2) * (1 - 0.12 * side), bodyW = Math.max(X(18), headW * 1.3) * (1 - 0.2 * side);
  const profile = side > 0.9, hcx = P.at('head', 0.5)[0], top = P.end('head')[1], sh0 = P.start('neck'), prof = side > 0.9;
  const hand = [sh0[0] + (prof ? sx * X(10) : (front < -0.2 ? -X(11) : X(11))), sh0[1] + X(1)], hand2 = [sh0[0] + (prof ? -sx * X(9) : (front < -0.2 ? X(12) : -X(12))), sh0[1] + X(1)];
  const fx = sx * headW * 0.24, fw = headW * (0.72 - 0.3 * side);
  // the face is seen from the front and in profile, not from behind; eyes on whole pixels (the finish repaints them)
  const showFace = front > -0.3, ey = Math.round(top + headH * 0.52), eh = Math.max(1, Math.round(X(2)));
  const eyes = !showFace ? [] : (profile ? [hcx + fx + fw * 0.15] : [hcx + fx - fw * 0.28, hcx + fx + fw * 0.2]).map(Math.round);
  const mouth = showFace ? [profile ? eyes[0] : Math.round(hcx + fx - 0.5), ey + eh] : null;
  return { w, h, X, rig, P, sx, front, side, ground, headH, headW, bodyW, profile, hcx, top, hand, hand2, sh0, fx, fw, showFace, eyes, ey, eh, mouth };
}

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), cloth = pal[P.cloth];
  const { X, P: pose, sx, front, ground, headH, headW, bodyW, profile, hcx, top, hand, hand2, sh0, fx, fw, showFace, eyes, ey, eh } = L;
  const neck = pose.start('neck'), hip = pose.start('spine');
  const limb = (a, b, r) => ({ type: 'capsule', a: pose.start(a), b: pose.end(b), r, mat: cloth, shade: 'cyl' });
  // legs, far side first: side by side facing the viewer or away, a stride in profile
  const legR = (profile ? 0.5 : 0.3) * bodyW / 2;
  s.add({ type: 'group', name: 'legs', underlay: true, mat: pal.metal, shade: 'cyl', children: pose.far(['legL_up', 'legR_up']).flatMap(n => [{ ...limb(n, n, legR), mat: pal.metal, name: 'greave' }, { ...limb(n.replace('_up', '_lo'), n.replace('_up', '_lo'), legR), mat: pal.metal, name: 'greave' }]) });
  // the held item: a blade turns with the hand, a staff stands beside it
  const item = () => {
    if (P.item !== 'club') return;
    const hw = Math.max(1, X(1.1)), hx = hand[0], hy = hand[1], topY = hy - X(11), swing = ctx.state === 'attack' ? (hx > 0 ? 0 : 0) : 0;
    s.add({ type: 'group', name: 'club', underlay: true, children: [
      { type: 'rect', name: 'club-shaft', x: hx - hw, y: topY + X(2), w: hw * 2, h: X(13), mat: pal.leather, shade: 'cyl', axis: 'y' },
      { type: 'rect', name: 'club-arms', x: hx - X(4.5), y: topY + X(1), w: X(9), h: Math.max(1, X(2.4)), mat: pal.metal, shade: 'bevel' },
      ...[-4, 0, 4].map(o => ({ type: 'rect', name: 'club-candle', x: hx + X(o) - Math.max(1, X(1)), y: topY - X(2.5), w: Math.max(2, X(2)), h: X(3.5), mat: pal.skin, shade: 'flat', band: 0 })),
      ...[-4, 0, 4].map(o => ({ type: 'circle', name: 'club-flame', cx: hx + X(o), cy: topY - X(3.8), r: Math.max(1, X(1.2)), mat: pal.glow, shade: 'sphere' })),
    ] });
    clubWax = [hx, topY];
  };
  let clubWax = null;
  if (front < -0.2) item(); // carried in front of the body: hidden behind it from the back
  const armTo = (from, to, name) => ({ type: 'group', name, underlay: true, children: [
    { type: 'capsule', a: from, b: to, r: Math.max(1.5, X(2.6)), mat: cloth, shade: 'cyl' },
    { type: 'circle', name: 'pauldron', cx: from[0], cy: from[1], r: Math.max(1.5, X(2.3)), mat: pal.metal, shade: 'sphere' },
    { type: 'circle', name: 'gauntlet', cx: to[0], cy: to[1], r: Math.max(1.5, X(2.4)), mat: pal.metal, shade: 'sphere' }] });
  const bs = !profile && front < -0.2 ? -1 : 1, shR = [sh0[0] + (profile ? sx * X(2) : bs * bodyW * 0.3), sh0[1] + X(2)], shL = [sh0[0] + (profile ? -sx * X(2) : -bs * bodyW * 0.3), sh0[1] + X(2)];
  if (profile) s.add(armTo(shL, hand2, 'arm-far'));
  s.add({ type: 'group', name: 'body', underlay: true, children: [
    { type: 'path', name: 'torso', d: `M${neck[0] - bodyW * 0.32} ${neck[1]} H${neck[0] + bodyW * 0.32} L${hip[0] + bodyW / 2 + X(2)} ${hip[1] - X(2)} L${hip[0] + bodyW / 2 + X(3)} ${ground - X(5)} H${hip[0] - bodyW / 2 - X(3)} L${hip[0] - bodyW / 2 - X(2)} ${hip[1] - X(2)} Z`, mat: cloth, shade: 'normal', round: X(5) },
    ...[-0.42, -0.22, 0, 0.2, 0.4].map((f, i) => ({ type: 'path', name: 'drip', d: `M${hip[0] + f * bodyW * 1.1 - X(1.6)} ${ground - X(6)} H${hip[0] + f * bodyW * 1.1 + X(1.6)} V${ground - X(2) + (i % 2 ? X(2) : 0)} Q${hip[0] + f * bodyW * 1.1} ${ground + (i % 2 ? X(1) : 0)} ${hip[0] + f * bodyW * 1.1 - X(1.6)} ${ground - X(2) + (i % 2 ? X(2) : 0)} Z`, mat: cloth, shade: 'flat', band: 1 })),
    ...(front > -0.2 ? [{ type: 'path', name: 'plate', mat: pal.metal, shade: 'normal', round: X(2), d: (() => {
      const c0 = neck[0] + (profile ? sx * bodyW * 0.14 : 0), c1 = hip[0] + (profile ? sx * bodyW * 0.18 : 0), t = profile ? 0.12 : 0.17, b = profile ? 0.16 : 0.22;
      return `M${c0 - bodyW * t} ${neck[1] + X(1)} H${c0 + bodyW * t} L${c1 + bodyW * b} ${hip[1] - X(4)} H${c1 - bodyW * b} Z`; })() }] : []),
    ...(front <= -0.2 ? [{ type: 'path', name: 'mantle', mat: pal.leather, shade: 'normal', round: X(2), d: `M${neck[0] - bodyW * 0.3} ${neck[1] + X(0.5)} H${neck[0] + bodyW * 0.3} L${hip[0] + bodyW * 0.42} ${hip[1] - X(6)} L${hip[0] + bodyW * 0.15} ${hip[1] - X(4)} L${hip[0]} ${hip[1] - X(6.5)} L${hip[0] - bodyW * 0.15} ${hip[1] - X(4)} L${hip[0] - bodyW * 0.42} ${hip[1] - X(6)} Z` }] : []),
    { type: 'rect', name: 'belt', x: hip[0] - bodyW / 2 - X(1.5), y: hip[1] - X(5), w: bodyW + X(3), h: Math.max(1, X(1.2)), mat: pal.leather, shade: 'flat', band: 2 },
    ...(front > 0.2 ? [{ type: 'rect', name: 'buckle', x: hip[0] - X(1) + sx * bodyW * 0.3, y: hip[1] - X(5), w: X(2), h: Math.max(1, X(1.2)), mat: pal.metal, shade: 'flat', band: 0 }] : []),
  ] });
  // arms: both sides facing the viewer or away, the near arm swinging in profile; the hand closes over the item's grip
  if (front >= -0.2) item();
  s.add(armTo(shR, hand, 'arm-club'));
  if (!profile) s.add(armTo(shL, hand2, 'arm-free'));
  s.add({ type: 'group', name: 'head', underlay: true, children: [
    { type: 'ellipse', name: 'hair', cx: hcx, cy: top + headH * 0.5, rx: headW / 2 + X(1), ry: headH * 0.52, mat: pal.skin, shade: 'sphere' },
    ...(showFace ? [{ type: 'path', name: 'face', d: `M${hcx + fx - fw / 2} ${top + headH * 0.45} Q${hcx + fx} ${top + headH * 0.25} ${hcx + fx + fw / 2} ${top + headH * 0.45} V${top + headH * 0.72} Q${hcx + fx} ${top + headH * 1.02} ${hcx + fx - fw / 2} ${top + headH * 0.72} Z`, mat: pal.skin, shade: 'normal', round: X(2) }] : []),
    { type: 'rect', name: 'crown-band', x: hcx - headW / 2 - X(0.5), y: top + headH * 0.12, w: headW + X(1), h: Math.max(1, X(1.6)), mat: pal.metal, shade: 'bevel' },
    ...[-0.32, 0, 0.32].flatMap((f, i) => [
      { type: 'rect', name: 'candle', x: hcx + f * headW - X(1.1), y: top - X(2.5) + (i === 1 ? -X(1.5) : 0), w: Math.max(2, X(2.2)), h: X(3.8) + (i === 1 ? X(1.5) : 0), mat: pal.skin, shade: 'flat', band: 0 },
      { type: 'circle', name: 'flame', cx: hcx + f * headW, cy: top - X(3.8) + (i === 1 ? -X(1.5) : 0), r: Math.max(1, X(1.3)), mat: pal.glow, shade: 'sphere' },
    ]),
  ] });
  for (const ex of eyes) s.add({ type: 'rect', name: 'eye', x: ex, y: ey, w: 1, h: eh, color: 'glow.1' });
  if (L.mouth && !profile) s.add({ type: 'rect', name: 'mouth', x: L.mouth[0], y: L.mouth[1] + 1, w: 1, h: 1, color: 'skin.2' });
  // tallow: wax runs down the robe from the shoulders, under the crown band, and off the club's arms (decals on their parts)
  const px = Math.max(1, Math.round(X(1))), drip = (x, y, len) => [{ type: 'rect', x: Math.round(x), y: Math.round(y), w: px, h: Math.round(len) },
    { type: 'rect', x: Math.round(x) - (px > 1 ? 0 : 0), y: Math.round(y + len), w: px + 1, h: px + 1 }];
  const robeX = front > -0.2 ? [-0.27, 0.3] : [-0.22, 0.05, 0.26];
  const pr = ctx.lib.proc(s).add('materialNoise', { part: 'torso', amount: 0.12 })
    .add('decal', { name: 'wax-robe', part: 'torso', mat: 'skin', band: 0, shape: robeX.flatMap((f, i) => drip(neck[0] + f * bodyW, neck[1] + X(1), X(4 + 2.5 * (i % 2)))) })
    .add('decal', { name: 'candle-gaps', part: 'candle', mat: 'skin', band: 2, shape: [-0.16, 0.16].map(f => ({ type: 'rect', x: Math.round(hcx + f * headW), y: Math.round(top - X(6)), w: 1, h: Math.round(X(8)) })) })
    .add('decal', { name: 'wax-crown', part: 'hair', mat: 'skin', band: 0, shape: [-0.28, 0.08, 0.34].flatMap((f, i) => drip(hcx + f * headW, top + headH * 0.12 + Math.max(1, X(1.6)), X(1 + (i % 2)))) });
  if (clubWax && front >= -0.2) pr.add('decal', { name: 'wax-club', part: 'club-shaft', mat: 'skin', band: 0, shape: drip(clubWax[0] - Math.max(1, X(1.1)), clubWax[1] + X(3.6), X(2)) });
  return pr.add('groundShadow', {}).render();
}

// Named points per frame: the finishing pass paints the face at eye/eye2/mouth (only where the face is visible);
// `hand` is exported in pack.json so effects and held props follow it in game (sprite.anchor('hand')).
export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: [Math.round(L.hcx + L.sx * L.w * 0.08), Math.round(L.top + L.headH * 0.5)] };
  delete a.ground; a.hand = [Math.round(L.hand[0]), Math.round(L.hand[1])];
  L.eyes.forEach((x, i) => { a[i ? 'eye2' : 'eye'] = [x, L.ey]; });
  if (L.mouth) a.mouth = L.mouth;
  return a;
};
