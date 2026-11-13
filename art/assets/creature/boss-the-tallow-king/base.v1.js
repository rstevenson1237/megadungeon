// boss-the-tallow-king base.v1 (r1) — template: iso humanoid walker — facings and a walk cycle, each cell a 2D sprite standing on a 2:1
// ground shadow (the iso hero approach; use 3D mode when every facing must come from one model), on the shared biped rig
// (`ctx.lib.rigs.body`). Facings s, se, e, ne, n are drawn here; the engine mirrors the west ones. The rig turns the figure
// (`yaw`: 0 = facing the viewer, 90 = east, 180 = back): the face slides toward the facing side and disappears from behind,
// the body narrows in profile. Its walk steps the feet on the ground with a 1 px bob on the contact frames and swings the
// arms against the legs; `attack` swings the right arm, `hurt` recoils. This file only dresses the skeleton: silhouette
// first, then costume, gear and face; keep every size relative to ctx.size and colours to role ramps (R11).
// SHAPE DRAFT (r1): The Tallow King, a human brute of the cellars: a vast pear-shaped body in a wax-slumped robe that pools into
// drips at the hem, a bald lumpy head under a crown of three guttering candles, and an iron candelabra-club in the fist.
export const meta = { brief: 'boss-the-tallow-king', pass: 'r1', notes: 'fat wax king: candle crown, drip hem, candelabra club' };

export const params = {
  cloth: { type: 'swap', options: ['accent', 'cloth', 'leather'], default: 'accent' },
  item: { type: 'choice', options: ['club', 'none'], default: 'club' },
  };

// Geometry shared by render() and anchors(): the rig's pose for this state and phase, then head, face and hand on it, so the
// face and hand anchors sit exactly on the drawn pixels in every cell.
function layout(ctx) {
  const [w, h] = ctx.size, X = v => (v * w) / 56, hr = ctx.dir.scale.proportions?.headRatio ?? 0.4;
  const ground = h - 2, rig = ctx.lib.rigs.body('biped', ctx, { ground, height: Math.round(h * 0.31), proportions: { head: hr * 0.951 } });
  const { sx, front, side } = rig, P = rig.pose(ctx.state, ctx.t), headH = rig.lengths.head / 0.92;
  const headW = Math.min(w * 0.62, headH * 1.2) * (1 - 0.12 * side), bodyW = Math.max(X(22), headW * 1.5) * (1 - 0.25 * side);
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
  const { X, P: pose, sx, front, ground, headH, headW, bodyW, profile, hcx, top, hand, fx, fw, showFace, eyes, ey, eh } = L;
  const neck = pose.start('neck'), hip = pose.start('spine');
  const limb = (a, b, r) => ({ type: 'capsule', a: pose.start(a), b: pose.end(b), r, mat: cloth, shade: 'cyl' });
  // legs, far side first: side by side facing the viewer or away, a stride in profile
  const legR = (profile ? 0.5 : 0.3) * bodyW / 2;
  s.add({ type: 'group', name: 'legs', underlay: true, mat: pal.leather, shade: 'bevel', children: pose.far(['legL_up', 'legR_up']).flatMap(n => [{ ...limb(n, n, legR), mat: pal.leather }, { ...limb(n.replace('_up', '_lo'), n.replace('_up', '_lo'), legR), mat: pal.leather }]) });
  // the held item: a blade turns with the hand, a staff stands beside it
  const item = () => {
    if (P.item !== 'club') return;
    const hw = Math.max(1, X(1.1)), hx = hand[0], hy = hand[1], topY = hy - X(8), swing = ctx.state === 'attack' ? (hx > 0 ? 0 : 0) : 0;
    s.add({ type: 'group', name: 'club', underlay: true, children: [
      { type: 'rect', x: hx - hw, y: topY + X(2), w: hw * 2, h: X(11), mat: pal.leather, shade: 'cyl', axis: 'y' },
      { type: 'rect', x: hx - X(4.5), y: topY + X(1), w: X(9), h: Math.max(1, X(2.4)), mat: pal.metal, shade: 'bevel' },
      ...[-4, 0, 4].map(o => ({ type: 'rect', x: hx + X(o) - Math.max(1, X(1)), y: topY - X(2.5), w: Math.max(2, X(2)), h: X(3.5), mat: pal.skin, shade: 'flat', band: 0 })),
      ...[-4, 0, 4].map(o => ({ type: 'circle', cx: hx + X(o), cy: topY - X(3.8), r: Math.max(1, X(1.2)), mat: pal.glow, shade: 'sphere' })),
    ] });
  };
  if (front < -0.2) item(); // carried in front of the body: hidden behind it from the back
  const arm = n => ({ type: 'group', name: 'arm', underlay: true, children: [limb(`arm${n}_up`, `arm${n}_up`, Math.max(1, X(2.4))), limb(`arm${n}_lo`, `arm${n}_lo`, Math.max(1, X(2.4))), { type: 'circle', cx: pose.end(`arm${n}_lo`)[0], cy: pose.end(`arm${n}_lo`)[1], r: Math.max(0.8, X(2)), mat: pal.skin, shade: 'flat', band: 0 }] });
  const arms = pose.far(['armL_up', 'armR_up']).map(n => n[3]);
  if (profile) s.add(arm(arms[0]));
  s.add({ type: 'group', name: 'body', underlay: true, children: [
    { type: 'path', name: 'torso', d: `M${neck[0] - bodyW * 0.32} ${neck[1]} H${neck[0] + bodyW * 0.32} L${hip[0] + bodyW / 2 + X(2)} ${hip[1] - X(2)} L${hip[0] + bodyW / 2 + X(3)} ${ground - X(5)} H${hip[0] - bodyW / 2 - X(3)} L${hip[0] - bodyW / 2 - X(2)} ${hip[1] - X(2)} Z`, mat: cloth, shade: 'normal', round: X(5) },
    ...[-0.42, -0.22, 0, 0.2, 0.4].map((f, i) => ({ type: 'path', name: 'drip', d: `M${hip[0] + f * bodyW * 1.1 - X(1.6)} ${ground - X(6)} H${hip[0] + f * bodyW * 1.1 + X(1.6)} V${ground - X(2) + (i % 2 ? X(2) : 0)} Q${hip[0] + f * bodyW * 1.1} ${ground + (i % 2 ? X(1) : 0)} ${hip[0] + f * bodyW * 1.1 - X(1.6)} ${ground - X(2) + (i % 2 ? X(2) : 0)} Z`, mat: cloth, shade: 'flat', band: 1 })),
    { type: 'rect', name: 'belt', x: hip[0] - bodyW / 2 - X(1.5), y: hip[1] - X(5), w: bodyW + X(3), h: Math.max(1, X(1.2)), mat: pal.leather, shade: 'flat', band: 2 },
    ...(front > 0.2 ? [{ type: 'rect', name: 'buckle', x: hip[0] - X(1) + sx * bodyW * 0.3, y: hip[1] - X(5), w: X(2), h: Math.max(1, X(1.2)), mat: pal.metal, shade: 'flat', band: 0 }] : []),
  ] });
  // arms: both sides facing the viewer or away, the near arm swinging in profile; the hand closes over the item's grip
  if (front >= -0.2) item();
  s.add(arm(profile ? arms[1] : arms[0]));
  if (!profile) s.add(arm(arms[1]));
  s.add({ type: 'group', name: 'head', underlay: true, children: [
    { type: 'ellipse', name: 'hair', cx: hcx, cy: top + headH * 0.5, rx: headW / 2 + X(1), ry: headH * 0.52, mat: pal.skin, shade: 'sphere' },
    ...(showFace ? [{ type: 'path', name: 'face', d: `M${hcx + fx - fw / 2} ${top + headH * 0.45} Q${hcx + fx} ${top + headH * 0.25} ${hcx + fx + fw / 2} ${top + headH * 0.45} V${top + headH * 0.72} Q${hcx + fx} ${top + headH * 1.02} ${hcx + fx - fw / 2} ${top + headH * 0.72} Z`, mat: pal.skin, shade: 'normal', round: X(2) }] : []),
    { type: 'rect', name: 'crown-band', x: hcx - headW / 2 - X(0.5), y: top + headH * 0.12, w: headW + X(1), h: Math.max(1, X(1.6)), mat: pal.metal, shade: 'bevel' },
    ...[-0.32, 0, 0.32].flatMap((f, i) => [
      { type: 'rect', name: 'candle', x: hcx + f * headW - X(1.1), y: top - X(2.5) + (i === 1 ? -X(1.5) : 0), w: Math.max(2, X(2.2)), h: X(3.8) + (i === 1 ? X(1.5) : 0), mat: pal.skin, shade: 'flat', band: 0 },
      { type: 'circle', name: 'flame', cx: hcx + f * headW, cy: top - X(3.8) + (i === 1 ? -X(1.5) : 0), r: Math.max(1, X(1.3)), mat: pal.glow, shade: 'sphere' },
    ]),
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
