// boss-old-mawkin base.v4 (r4, from base.v3) — SHAPE DRAFT, RESCALE: the brief's height is now 3.9 m (62 px at the
// direction's 16 px a metre, 1.7x the drawn player), so the rig height and every proportion are redrawn at the new size
// (rig 27 -> 37 units, widths, legs, heads, horns scaled with it; the side view's spine and tail shortened to stay in the
// 64 px frame). Same design, flat materials. To make it read as a hydra in every facing, the necks are now laid out in
// the body's own 3D frame (forward, side, up) instead of screen offsets: one heavy low trunk on four thick legs, and from
// its shoulders three separate necks, each a two-segment S-curve with its own head, spread wide apart with clear gaps
// (left high, great head centre and highest, right lower and forward) plus the short severed stump. The side heads
// follow the great neck's idle/walk/attack motion.
// (v3 header follows) boss-old-mawkin base.v3 (r3) — SHAPE DRAFT: front/back no longer read as an upright figure with raised arms: side necks rise from the trunk's top centre and fan up close to the great head (heads at staggered heights), spine ridge on the back, side view unchanged.
// (v2 header follows) boss-old-mawkin base.v2 (r2) — SHAPE DRAFT after the owner rejected v1 (upright from the front): one low four-legged hydra body in every facing (wide low torso, four legs, four necks fanning up, a dominant old head with broken horn, a severed stump), drawn to 3 m.
// (v1 header follows) boss-old-mawkin base.v1 (r1) — template: very large creature on the shared quadruped rig with the `large` proportions
// (`ctx.lib.rigs.body`). `ground` is where it stands. Role ramps only (R11).
export const meta = { brief: 'boss-old-mawkin', pass: 'r4', notes: 'Old Mawkin: an ancient moss hydra, one huge scarred central head with a broken horn, two thin side necks and a headless stump, heavy low trunk, heavy tail — drawn at 3.9 m' };

export const params = {
  hide: { type: 'swap', options: ['accent', 'leather', 'grass', 'hair'], default: 'grass' },
  belly: { type: 'swap', options: ['skin', 'leather', 'dirt'], default: 'skin' },
  wings: { type: 'toggle', default: false },
  neck: { type: 'range', min: 0.6, max: 1.6, default: 1.35 },
};

// rig height in frame units: the brief's 3.9 m (62 px) on a 64 px frame
const RIG_H = 37;

// Geometry shared by render() and anchors(): the rig's pose for this state and phase, the necks laid out in the body's
// own frame [forward, side, up] from the shoulders (so every facing projects the same hydra), the great head, the eyes.
function layout(ctx) {
  const [w, h] = ctx.size, U = v => (v * Math.min(w, h)) / 64, ground = Math.round(h * 0.96);
  const rig = ctx.lib.rigs.body('large', ctx, { height: U(RIG_H), ground, proportions: { spine: 0.7, tail: 0.34, leg_up: 0.12, leg_lo: 0.12, neck: 0.5 * (ctx.params?.neck ?? 1) } });
  const { sx, front, side } = rig, P = rig.pose(ctx.state, ctx.t), headR = U(7.5), showFace = front > -0.3, bodyH = U(22), top = bodyH * 0.35;
  // the necks follow the rig's neck: how far its head has moved from the idle rest pose (sway, the walk's bob, the strike)
  const rest = rig.pose('idle', 0), h0 = rest.end('neck'), h1 = P.end('neck'), dv = [h1[0] - h0[0], h1[1] - h0[1]];
  const at = (o, k = 1) => { const q = P.at('spine', 0.82, o[0], o[1], o[2]); return [q[0] + dv[0] * k, q[1] + dv[1] * k]; };
  // great neck: from the shoulders' centre, bending forward, the head highest of all; side necks spread wide, each its own head
  const G = { root: [U(2), 0, top - U(2)], bend: [U(3), 0, top + U(11)], tip: [U(9), 0, top + U(19)] };
  const necks = [
    { name: 'neckL', root: [-U(1), -U(7), top - U(1)], bend: [-U(7), -U(17), top + U(5)], tip: [-U(13), -U(19), top + U(17)], rr: U(3.4), hs: U(4.6), follow: 0.6 },
    { name: 'neckR', root: [U(2), U(7), top - U(1)], bend: [U(8), U(17), top + U(2)], tip: [U(14), U(20), top + U(10)], rr: U(3.2), hs: U(4.2), follow: 0.8 },
  ];
  const skull = at(G.tip), hr = headR * 1.2;
  const eyePts = !showFace ? [] : (side > 0.9 ? [Math.sign(sx)] : [-1, 1]).map(k => at([G.tip[0] + hr * 0.5, k * hr * 0.45, G.tip[2] + hr * 0.1]));
  const eyes = eyePts.map(p => Math.round(p[0])).sort((a, b) => a - b), eyeY = Math.round(eyePts.length ? eyePts[0][1] : skull[1]);
  const mouth = showFace ? at([G.tip[0] + hr * 0.7, 0, G.tip[2] - hr * 0.6]).map(Math.round) : null;
  return { w, h, U, rig, P, sx, front, side, ground, headR, hr, bodyH, top, at, G, necks, skull, showFace, eyes, eyeY, mouth };
}

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), hide = pal[P.hide];
  const { U, rig, P: pose, sx, side, skull, hr, bodyH, top, at } = L, r = U(5);
  const limb = (n, k = 1) => ({ type: 'capsule', a: pose.start(n), b: pose.end(n), r: r * k, mat: hide, shade: 'cyl' });
  const pieces = [];
  for (const e of ['FL', 'FR', 'BL', 'BR']) pieces.push({ z: pose.depth(`leg${e}_up`), g: { type: 'group', name: 'legs', underlay: true, children: [limb(`leg${e}_up`), limb(`leg${e}_lo`, 0.9)] } });
  pieces.push({ z: pose.depth('tail') - 0.01, g: { type: 'group', name: 'tail', underlay: true, children: [{ type: 'capsule', name: 'tail', a: pose.start('tail'), b: pose.end('tail'), r: U(5), r1: U(2), mat: hide, shade: 'cyl' }] } });
  // the trunk: a wide heavy barrel, low between the legs
  const mid = pose.at('spine', 0.5), rx = U(19) * (1 - side) + (rig.lengths.spine / 2 + U(6)) * side, ry = bodyH / 2;
  const wings = P.wings ? [-1, 1].map(k => { const b = pose.at('spine', 0.5, 0, k * U(5), bodyH * 0.4), t = pose.at('spine', 0.5, -U(1), k * U(12), bodyH * 0.4 + U(18)); return { type: 'path', name: 'wing', d: `M${b[0] - U(4)} ${b[1]} L${t[0]} ${t[1]} L${b[0] + U(7)} ${b[1] + U(3)} Z`, mat: pal.leather, shade: 'flat', band: 1 }; }) : [];
  pieces.push({ z: 0, g: { type: 'group', name: 'body', underlay: true, children: [
    { type: 'ellipse', name: 'torso', cx: mid[0], cy: mid[1], rx, ry, mat: hide, shade: 'normal' },
    { type: 'ellipse', name: 'belly', cx: mid[0] + sx * U(3), cy: mid[1] + ry * 0.45, rx: rx * 0.6, ry: ry * 0.4, mat: pal[P.belly], shade: 'normal' },
    ...wings,
  ] } });
  const heads = [];
  L.necks.forEach(n => {
    const root = at(n.root, 0), bend = at(n.bend, n.follow * 0.4), tip = at(n.tip, n.follow);
    const zz = pose.depth('head') - 0.02 + (-(n.tip[1]) * sx) * 0.001;
    heads.push({ z: zz, g: { type: 'group', name: n.name, underlay: true, children: [
      { type: 'capsule', a: root, b: bend, r: n.rr, r1: n.rr * 0.85, mat: hide, shade: 'cyl' },
      { type: 'capsule', a: bend, b: tip, r: n.rr * 0.85, r1: n.rr * 0.7, mat: hide, shade: 'cyl' },
      { type: 'ellipse', cx: tip[0], cy: tip[1], rx: n.hs * (1 + 0.2 * side), ry: n.hs * 0.75, mat: hide, shade: 'sphere' },
      side > 0.5
        ? { type: 'ellipse', cx: tip[0] + sx * n.hs * 1.1, cy: tip[1] + U(1), rx: n.hs * 0.8, ry: n.hs * 0.45, mat: hide, shade: 'normal' }
        : { type: 'ellipse', cx: tip[0] + Math.sign(tip[0] - root[0]) * n.hs * 0.9, cy: tip[1] + n.hs * 0.35, rx: n.hs * 0.8, ry: n.hs * 0.45, mat: hide, shade: 'normal' },
    ] } });
  });
  // the severed stump: a short thick neck leaning back from the far shoulder, its cut end flat
  const st0 = pose.at('spine', 0.72, -U(1), -U(5), top - U(1)), st1 = pose.at('spine', 0.72, -U(5), -U(10), top + U(7));
  heads.push({ z: pose.depth('head') - 0.03, g: { type: 'group', name: 'stump', underlay: true, children: [
    { type: 'capsule', a: st0, b: st1, r: U(3.2), r1: U(2.8), mat: hide, shade: 'cyl' },
    { type: 'ellipse', cx: st1[0], cy: st1[1] - U(0.5), rx: U(3.2), ry: U(1.6), mat: pal.skin, shade: 'flat' },
  ] } });
  // spine ridge: low spikes along the top of the trunk, behind the necks
  const ridge = [];
  for (let j = 0; j < 4; j++) { const t = 0.12 + j * 0.15, b = pose.at('spine', t, 0, 0, bodyH * 0.5 - U(1)); ridge.push({ type: 'path', name: 'ridge', d: `M${b[0] - U(2)} ${b[1] + U(1.5)} L${b[0]} ${b[1] - U(4)} L${b[0] + U(2)} ${b[1] + U(1.5)} Z`, mat: pal.skin, shade: 'flat', band: 0 }); }
  pieces.push({ z: pose.depth('head') - 0.04, g: { type: 'group', name: 'ridge', underlay: true, children: ridge } });
  for (const h of heads) pieces.push(h);
  const G = L.G, nr = at(G.root, 0), nb = at(G.bend, 0.5), sn = at([G.tip[0] + hr * 0.9, 0, G.tip[2] - hr * 0.25]);
  // the great head: a broad blunt skull, heavy jaw, one long horn and one broken stub
  pieces.push({ z: pose.depth('head') + 0.01, g: { type: 'group', name: 'head', underlay: true, children: [
    { type: 'capsule', name: 'neck', a: nr, b: nb, r: U(6), r1: U(5.2), mat: hide, shade: 'cyl' },
    { type: 'capsule', name: 'neck', a: nb, b: skull, r: U(5.2), r1: U(4.6), mat: hide, shade: 'cyl' },
    { type: 'ellipse', name: 'skull', cx: skull[0], cy: skull[1], rx: hr * (1 + 0.45 * side), ry: hr * 0.85, mat: hide, shade: 'sphere' },
    ...(side > 0.5 ? [{ type: 'ellipse', name: 'snout', cx: sn[0], cy: sn[1] + U(1), rx: hr * 0.85, ry: hr * 0.5, mat: hide, shade: 'normal' }] : [{ type: 'ellipse', name: 'jaw', cx: skull[0], cy: skull[1] + hr * 0.6, rx: hr * 0.8, ry: hr * 0.45, mat: hide, shade: 'normal' }]),
    { type: 'path', name: 'horn', d: `M${skull[0] - hr * 0.7} ${skull[1] - hr * 0.5} L${skull[0] - hr * 1.1 - sx * U(3)} ${skull[1] - hr * 1.6} L${skull[0] - hr * 0.2} ${skull[1] - hr * 0.75} Z`, mat: pal.skin, shade: 'flat', band: 0 },
    { type: 'path', name: 'horn', d: `M${skull[0] + hr * 0.2} ${skull[1] - hr * 0.75} L${skull[0] + hr * 0.45} ${skull[1] - hr * 1.15} L${skull[0] + hr * 0.7} ${skull[1] - hr * 0.5} Z`, mat: pal.skin, shade: 'flat', band: 0 },
  ] } });
  for (const p of pieces.sort((a, b) => a.z - b.z)) s.add(p.g);
  for (const ex of L.eyes) s.add({ type: 'rect', name: 'eye', x: ex, y: L.eyeY, w: 1, h: Math.max(1, Math.round(U(2))), color: 'outline' });
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}

export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: L.skull.map(Math.round) };
  delete a.tail;
  a.hand = a.head;
  if (L.front > -0.2) L.eyes.forEach((x, i) => { a[i ? 'eye2' : 'eye'] = [x, L.eyeY]; });
  if (L.mouth && L.front > -0.2) a.mouth = L.mouth;
  return a;
};
