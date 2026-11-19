// boss-sister-gloam base.v3 (r3, from base.v2) — the decoration pass on the owner-approved v2 shape (silhouette kept,
// inside the line only). The robe, sleeves and mitre move to the cloth ramp, the family-h recolour ramp (meta.recolour),
// so the boss row's dusk violet dresses her in game; the robe is lit along the direction's light (linear, lit side
// up-left) with AO and light noise, and its folds are decals: dark fold lines with a lit edge on their light side. The
// mitre gets metal trim (a band at the brim and an orphrey up the front) and its brow shadow falls on the face; a pale
// accent stole runs down the robe front. The ring staff's orb glows (glow.1 orb, hot glow.0 core toward the light, a lit
// metal pixel on the ring). Side view: the near sleeve is a lit step over the robe with a cast shadow on the robe behind
// it, and a fold line down the skirt. Back view: a veil hangs from the mitre over the hair to the shoulders.
// boss-sister-gloam base.v2 (r2): feet now on the pivot row (ground = h-1), drawn to height 2.3 m, slimmer torso and skirt, robe hem lifted with feet showing; mitre and ring staff kept.
// was: base.v1 (r1) SHAPE DRAFT: Sister Gloam, a violet-robed caster of the ruined temple: tall pointed mitre, wide bell-sleeved
// robe flaring to the ground, a ring-headed staff held upright. Flat materials, no proc layers.
// template: — template: iso humanoid walker — facings and a walk cycle, each cell a 2D sprite standing on a 2:1
// ground shadow (the iso hero approach; use 3D mode when every facing must come from one model), on the shared biped rig
// (`ctx.lib.rigs.body`). Facings s, se, e, ne, n are drawn here; the engine mirrors the west ones. The rig turns the figure
// (`yaw`: 0 = facing the viewer, 90 = east, 180 = back): the face slides toward the facing side and disappears from behind,
// the body narrows in profile. Its walk steps the feet on the ground with a 1 px bob on the contact frames and swings the
// arms against the legs; `attack` swings the right arm, `hurt` recoils. This file only dresses the skeleton: silhouette
// first, then costume, gear and face; keep every size relative to ctx.size and colours to role ramps (R11).
export const meta = { brief: 'boss-sister-gloam', pass: 'r3', notes: 'decorated: cloth robe lit from the light with folds, metal-trimmed mitre, stole, glowing orb, veil from behind', recolour: 'cloth' };

export const params = {
  cloth: { type: 'swap', options: ['cloth', 'leather', 'accent'], default: 'cloth' },
  item: { type: 'choice', options: ['blade', 'staff', 'none'], default: 'staff' },
  hood: { type: 'toggle', default: true, p: 0.35 },
};

// Geometry shared by render() and anchors(): the rig's pose for this state and phase, then head, face and hand on it, so the
// face and hand anchors sit exactly on the drawn pixels in every cell.
function layout(ctx) {
  const [w, h] = ctx.size, X = v => (v * w) / 64, metre = ctx.dir.scale.metre ?? 16, hr = ctx.dir.scale.proportions?.headRatio ?? 0.4;
  const ground = h - 1, rig = ctx.lib.rigs.body('biped', ctx, { ground, height: Math.round((2.3 * metre - 7) * 0.97), proportions: { head: hr * 0.951 } });
  const { sx, front, side } = rig, P = rig.pose(ctx.state, ctx.t), headH = rig.lengths.head / 0.92;
  const headW = Math.min(w * 0.62, headH * 1.2) * (1 - 0.12 * side), bodyW = Math.max(X(7), headW * 0.7) * (1 - 0.3 * side);
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
  const neck = pose.start('neck'), hip = pose.start('spine'), decals = [], R = Math.round, lit = sx < 0 ? -1 : 1;
  let staffX = null;
  const limb = (a, b, r) => ({ type: 'capsule', a: pose.start(a), b: pose.end(b), r, mat: cloth, shade: 'flat', band: 1 });
  // legs, far side first: side by side facing the viewer or away, a stride in profile
  const legR = (profile ? 0.5 : 0.3) * bodyW / 2;
  s.add({ type: 'group', name: 'legs', underlay: true, mat: pal.leather, shade: 'bevel', children: pose.far(['legL_up', 'legR_up']).flatMap(n => [{ ...limb(n, n, legR), mat: pal.leather }, { ...limb(n.replace('_up', '_lo'), n.replace('_up', '_lo'), legR), mat: pal.leather }]) });
  for (const n of pose.far(['legL_lo', 'legR_lo'])) { const e = pose.end(n); s.add({ type: 'ellipse', name: 'foot', underlay: true, cx: e[0] + sx * X(1), cy: ground - X(1), rx: Math.max(1.5, X(2.2)), ry: Math.max(1, X(1.2)), mat: pal.leather, shade: 'flat', band: 0 }); }
  // the held item: a blade turns with the hand, a staff stands beside it
  const item = () => {
    if (P.item === 'blade') {
      const a = pose.angles.armR_up - 180 + pose.angles.armR_lo + pose.angles.spine, dir = (180 - (ctx.state === 'walk' || ctx.state === 'idle' ? 0 : 0.4 * a)) * Math.PI / 180, len = X(15);
      const tip = pose.at('armR_lo', 1, len * Math.sin(dir), 0, -len * Math.cos(dir)), dx = tip[0] - hand[0], dy = tip[1] - hand[1], l = Math.hypot(dx, dy) || 1, d = [dx / l, dy / l], n = [-d[1], d[0]], hw = X(1.1), gw = X(1.2 + 1.3 * Math.abs(front));
      const at = (k, m) => `${hand[0] + d[0] * k + n[0] * m} ${hand[1] + d[1] * k + n[1] * m}`;
      s.add({ type: 'group', name: 'blade', underlay: true, children: [
        { type: 'path', d: `M${at(0, -hw)} L${at(l - X(3), -hw)} L${at(l, 0)} L${at(l - X(3), hw)} L${at(0, hw)} Z`, mat: pal.metal, shade: 'bevel' },
        { type: 'path', d: `M${at(0, -gw)} L${at(Math.max(1, X(1.4)), -gw)} L${at(Math.max(1, X(1.4)), gw)} L${at(0, gw)} Z`, mat: pal.accent, shade: 'flat', band: 1 },
      ] });
    } else if (P.item === 'staff') { const hx = hand[0] + (profile ? 0 : Math.sign(hand[0] - pose.start('spine')[0] || 1) * X(3)); staffX = hx; s.add({ type: 'group', name: 'staff', underlay: true, children: [
      { type: 'rect', x: hx - X(0.75), y: top - X(1), w: Math.max(1, X(2)), h: ground - top, mat: pal.leather, shade: 'flat', band: 1 },
      { type: 'arc', name: 'ring', cx: hx, cy: top - X(2), r: X(3), w: Math.max(1, X(1.4)), a0: 0, a1: 360, mat: pal.metal, shade: 'flat', band: 1 },
      { type: 'circle', name: 'orb', cx: hx, cy: top - X(2), r: Math.max(1, X(1.2)), mat: pal.glow, shade: 'flat', band: 0 },
    ] }); }
  };
  if (front < -0.2) item(); // carried in front of the body: hidden behind it from the back
  const arm = n => ({ type: 'group', name: 'arm', underlay: true, children: [{ ...limb(`arm${n}_up`, `arm${n}_up`, Math.max(1, X(1.6))), name: 'sleeve' }, { ...limb(`arm${n}_lo`, `arm${n}_lo`, Math.max(1, X(1.6))), name: 'sleeve' }, { type: 'circle', cx: pose.end(`arm${n}_lo`)[0], cy: pose.end(`arm${n}_lo`)[1], r: Math.max(0.8, X(1.4)), mat: pal.skin, shade: 'flat', band: 0 }] });
  const arms = pose.far(['armL_up', 'armR_up']).map(n => n[3]);
  if (profile) s.add(arm(arms[0]));
  const sw = bodyW * (profile ? 0.85 : 1.15), hem = ground - X(5);
  s.add({ type: 'path', name: 'robe', underlay: true, d: `M${hip[0] - bodyW / 2} ${hip[1] - X(2)} H${hip[0] + bodyW / 2} L${hip[0] + sw} ${hem} H${hip[0] - sw} Z`, mat: cloth, shade: 'linear' });
  s.add({ type: 'group', name: 'body', underlay: true, children: [
    { type: 'path', name: 'torso', d: `M${neck[0] - bodyW / 2} ${neck[1]} H${neck[0] + bodyW / 2} L${hip[0] + bodyW / 2 + X(1)} ${hip[1] + X(1)} H${hip[0] - bodyW / 2 - X(1)} Z`, mat: cloth, shade: 'linear' },
    { type: 'rect', name: 'belt', x: hip[0] - bodyW / 2 - X(0.5), y: hip[1] - X(2), w: bodyW + X(1), h: Math.max(1, X(1.2)), mat: pal.leather, shade: 'flat', band: 2 },
    ...(front > 0.2 ? [{ type: 'rect', name: 'buckle', x: hip[0] - X(1) + sx * bodyW * 0.3, y: hip[1] - X(2), w: X(2), h: Math.max(1, X(1.2)), mat: pal.accent, shade: 'flat', band: 0 }] : []),
  ] });
  // arms: both sides facing the viewer or away, the near arm swinging in profile; the hand closes over the item's grip
  if (front >= -0.2) item();
  s.add(arm(profile ? arms[1] : arms[0]));
  if (!profile) s.add(arm(arms[1]));
  s.add({ type: 'group', name: 'head', underlay: true, children: [
    { type: 'ellipse', name: 'hair', cx: hcx, cy: top + headH * 0.48, rx: headW / 2, ry: headH * 0.5, mat: pal.hair, shade: 'sphere' },
    ...(showFace ? [{ type: 'path', name: 'face', d: `M${hcx + fx - fw / 2} ${top + headH * 0.45} Q${hcx + fx} ${top + headH * 0.25} ${hcx + fx + fw / 2} ${top + headH * 0.45} V${top + headH * 0.72} Q${hcx + fx} ${top + headH * 1.02} ${hcx + fx - fw / 2} ${top + headH * 0.72} Z`, mat: pal.skin, shade: 'normal', round: X(2) }] : []),
    ...(P.hood ? [{ type: 'path', name: 'mitre', d: `M${hcx - headW / 2 - X(1)} ${top + headH * 0.5} L${hcx} ${top - X(6)} L${hcx + headW / 2 + X(1)} ${top + headH * 0.5} Q${hcx} ${top + headH * 0.3} ${hcx - headW / 2 - X(1)} ${top + headH * 0.5} Z`, mat: cloth, shade: 'linear' }] : []),
  ] });
  for (const ex of eyes) s.add({ type: 'rect', name: 'eye', x: ex, y: ey, w: 1, h: eh, color: 'outline' });
  // --- decoration (S2), inside the line only: every mark is a decal clipped to its part ---
  const y0 = hip[1], half = y => bodyW / 2 + (sw - bodyW / 2) * (y - (hip[1] - X(2))) / (hem - hip[1] + X(2));
  const line = (x0, ya, x1, yb) => ({ type: 'poly', pts: [[x0, ya], [x0 + 1, ya], [x1 + 1, yb], [x1, yb]] });
  // robe folds: a dark crease with a lit edge on its light (left) side, fanning toward the hem
  const folds = profile ? [0] : front < -0.2 ? [-0.3, 0.3] : [0];
  for (const [i, f] of folds.entries()) {
    const ya = neck[1] + X(front < -0.2 ? 6 : 4), xa = R(neck[0] + f * bodyW * 0.42), xb = R(hip[0] + f * half(hem) * 0.95);
    decals.push({ name: `fold${i}`, part: profile ? ['torso', 'robe', 'sleeve'] : ['torso', 'robe'], mat: 'cloth', band: 2, shape: line(xa, ya, xb, hem) });
    decals.push({ name: `fold-lit${i}`, part: profile ? ['torso', 'robe', 'sleeve'] : ['torso', 'robe'], mat: 'cloth', band: 0, shape: profile ? [line(xa + 1, ya, xb + 1, hem), line(xa + 2, ya + X(6), xb + 2, hem)] : line(xa - 1, ya + X(2), xb - 1, hem) });
  }
  // a pale stole down the front, over the belt to the hem
  if (front > 0.2 && !profile) for (const d of [-1, 1]) {
    const x = R(neck[0] + d * bodyW * 0.22 - (d > 0 ? 1 : 0));
    decals.push({ name: `stole${d}`, part: ['torso', 'robe'], mat: 'accent', band: 1, shape: line(x, neck[1] + 1, R(x + d * X(1)), hem) });
  }
  // mitre: metal trim along the brim, an orphrey up the front; the brim's shadow over the brow
  if (P.hood) {
    const l = hcx - headW / 2 - X(1), r = hcx + headW / 2 + X(1), yb = top + headH * 0.5, yc = top + headH * 0.3;
    decals.push({ name: 'mitre-trim', part: 'mitre', mat: 'metal', band: 0, shape: { type: 'path', d: `M${l} ${yb} Q${hcx} ${yc} ${r} ${yb} L${r} ${yb - 2.2} Q${hcx} ${yc - 2.2} ${l} ${yb - 2.2} Z` } });
    if (showFace) decals.push({ name: 'orphrey', part: 'mitre', mat: 'metal', band: 1, shape: { type: 'rect', x: R(hcx + fx * 0.5 - 0.5), y: R(top - X(4)), w: 1, h: R(headH * 0.45 + X(3)) } });
    if (showFace) decals.push({ name: 'brow-shadow', part: 'face', mat: 'skin', band: 2, shape: { type: 'rect', x: R(hcx + fx - fw / 2), y: R(top + headH * 0.4), w: R(fw) + 1, h: 1 } });
  }
  // from behind, a veil falls from the mitre over the hair to the shoulders
  if (!showFace) decals.push({ name: 'veil', part: ['hair', 'torso'], mat: 'cloth', band: 1, shape: { type: 'path',
    d: `M${hcx - headW / 2 + 0.5} ${top + headH * 0.35} H${hcx + headW / 2 - 0.5} L${neck[0] + bodyW / 2} ${neck[1] + X(4)} H${neck[0] - bodyW / 2} Z` } });
  if (!showFace) decals.push({ name: 'veil-lit', part: ['hair', 'torso'], mat: 'cloth', band: 0, shape: line(R(hcx - headW / 2 + 1), top + headH * 0.4, R(neck[0] - bodyW / 2 + 1), neck[1] + X(4)) });
  // the orb glows: a hot core toward the light, and the ring catches the light on its upper-left
  if (staffX != null && !profile) {
    const oy = top - X(2);
    decals.push({ name: 'orb-fire', part: 'orb', mat: 'glow', band: 1, shape: { type: 'rect', x: Math.floor(staffX + 0.5), y: Math.floor(oy + 0.5), w: 1, h: 1 } });
    decals.push({ name: 'ring-lit', part: 'ring', mat: 'metal', band: 0, shape: { type: 'path', d: `M${staffX - X(4)} ${oy} L${staffX - X(4)} ${oy - X(4)} L${staffX} ${oy - X(4)} L${staffX} ${oy - X(1.8)} L${staffX - X(1.8)} ${oy} Z` } });
  }
  let pr = ctx.lib.proc(s).add('ao', { part: ['robe', 'torso'] }).add('materialNoise', { part: 'robe', amount: 0.08, scale: 3, seed: ctx.variant ?? 0 });
  for (const d of decals) pr = pr.add('decal', d);
  return pr.render();
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
