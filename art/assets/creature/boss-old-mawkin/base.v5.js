// boss-old-mawkin base.v5 (r5, from base.v4) — DECORATION on the owner-approved base.v4 shape (silhouette unchanged):
// every body part stays on the family's grass ramp (recoloured in game) but is now shaded by hand in the direction's
// three bands from its top-left light instead of soft sphere/normal pillows: trunk, skulls and jaws get a lit cap up-left,
// a mid body and a dark underside; the belly is grass band 2 with plate seams (was skin); a ragged moss mantle (hair ramp
// decals) along the trunk's back and a moss patch on the crown; old pale scars across the great skull; a readable face in front views
// (glowing eyes, brow, a dark mouth line with a tooth); bone horns two-toned with a dark broken end; the severed stump's
// cut end is raw flesh (accent) in a pale rim; in back views a moss mane runs down every neck instead of the face;
// procedural ao and a lit-side rim light.
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
export const meta = { brief: 'boss-old-mawkin', pass: 'r5', notes: 'Old Mawkin: an ancient moss hydra, one huge scarred central head with a broken horn, two thin side necks and a headless stump, heavy low trunk, heavy tail — drawn at 3.9 m' };

export const params = {
  hide: { type: 'swap', options: ['accent', 'leather', 'grass', 'hair'], default: 'grass' },
  belly: { type: 'swap', options: ['grass', 'skin', 'leather', 'dirt'], default: 'grass' },
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
  const { pal } = ctx.dir, P = ctx.params, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), hide = pal[P.hide], belly = pal[P.belly];
  const { U, rig, P: pose, sx, side, front, skull, hr, bodyH, top, at, showFace } = L, r = U(5), back = front < -0.3;
  const R = Math.round, decals = [];
  const dots = (pts, part, mat, band = 'keep', name = 'mark') => decals.push({ name, part, mat, band, shape: pts.map(([x, y]) => ({ type: 'rect', x: R(x), y: R(y), w: 1, h: 1 })) });
  const line = (x0, y0, x1, y1) => { const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))), o = []; for (let i = 0; i <= n; i++) o.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]); return o; };
  const limb = (n, k = 1) => ({ type: 'capsule', name: 'leg', a: pose.start(n), b: pose.end(n), r: r * k, mat: hide, shade: 'cyl' });
  const pieces = [];
  for (const e of ['FL', 'FR', 'BL', 'BR']) pieces.push({ z: pose.depth(`leg${e}_up`), g: { type: 'group', name: 'legs', underlay: true, children: [limb(`leg${e}_up`), limb(`leg${e}_lo`, 0.9)] } });
  pieces.push({ z: pose.depth('tail') - 0.01, g: { type: 'group', name: 'tail', underlay: true, children: [{ type: 'capsule', name: 'tail', a: pose.start('tail'), b: pose.end('tail'), r: U(5), r1: U(2), mat: hide, shade: 'cyl' }] } });
  // the trunk: a wide heavy barrel, low between the legs — mid band body, a lit cap up-left, a dark plated belly below
  const mid = pose.at('spine', 0.5), rx = U(19) * (1 - side) + (rig.lengths.spine / 2 + U(6)) * side, ry = bodyH / 2;
  const bx = mid[0] + sx * U(3), by = mid[1] + ry * 0.45, brx = rx * 0.6, bry = ry * 0.4;
  const wings = P.wings ? [-1, 1].map(k => { const b = pose.at('spine', 0.5, 0, k * U(5), bodyH * 0.4), t = pose.at('spine', 0.5, -U(1), k * U(12), bodyH * 0.4 + U(18)); return { type: 'path', name: 'wing', d: `M${b[0] - U(4)} ${b[1]} L${t[0]} ${t[1]} L${b[0] + U(7)} ${b[1] + U(3)} Z`, mat: pal.leather, shade: 'flat', band: 1 }; }) : [];
  pieces.push({ z: 0, g: { type: 'group', name: 'body', underlay: true, children: [
    { type: 'ellipse', name: 'torso', cx: mid[0], cy: mid[1], rx, ry, mat: hide, shade: 'flat', band: 1 },
    { type: 'ellipse', name: 'torso', cx: mid[0] - rx * 0.12, cy: mid[1] - ry * 0.3, rx: rx * 0.78, ry: ry * 0.55, mat: hide, shade: 'flat', band: 0 },
    { type: 'ellipse', name: 'belly', cx: bx, cy: by, rx: brx, ry: bry, mat: belly, shade: 'flat', band: 2 },
    ...wings,
  ] } });
  // belly plates: seams across the underside (vertical in side views, short rows from the front)
  if (side > 0.5) { for (let k = -2; k <= 2; k++) dots(line(bx + k * brx * 0.33, by - bry * 0.45, bx + k * brx * 0.33, by + bry * 0.45), 'belly', P.belly, 1, 'plates'); }
  else if (!back) { for (const k of [-0.25, 0.25]) dots(line(bx - brx * 0.6, by + k * bry * 1.4, bx + brx * 0.6, by + k * bry * 1.4), 'belly', P.belly, 1, 'plates'); }
  // moss on the trunk's back: one ragged olive mantle along the spine top, a few short strands hanging from it
  if (side > 0.3 || back) { const sh = [], hi = [];
    for (let j = 0; j <= 8; j++) { const t = 0.18 + j * 0.07, c = pose.at('spine', t, 0, (j % 2 ? 1 : -1) * U(1.5), ry * 0.85);
      sh.push({ type: 'ellipse', cx: c[0], cy: c[1], rx: U(3.2), ry: U(1.6) + (j % 3) * 0.4 });
      if (j % 3 === 1) sh.push({ type: 'rect', x: R(c[0]), y: R(c[1] + U(1)), w: 1, h: 2 });
      if (j % 2 === 0) hi.push([c[0] - U(1), c[1] - U(1)]); }
    decals.push({ name: 'moss-back', part: 'torso', mat: 'hair', band: 1, shape: sh });
    dots(hi, 'torso', 'hair', 0, 'moss-back-lit'); }
  const heads = [], marks = [];
  L.necks.forEach(n => {
    const root = at(n.root, 0), bend = at(n.bend, n.follow * 0.4), tip = at(n.tip, n.follow);
    const zz = pose.depth('head') - 0.02 + (-(n.tip[1]) * sx) * 0.001, dir = side > 0.5 ? sx : Math.sign(tip[0] - root[0]) || 1;
    const sn = side > 0.5 ? [tip[0] + sx * n.hs * 1.1, tip[1] + U(1)] : [tip[0] + dir * n.hs * 0.9, tip[1] + n.hs * 0.35];
    const hrx = n.hs * (1 + 0.2 * side), hry = n.hs * 0.75;
    heads.push({ z: zz, g: { type: 'group', name: n.name, underlay: true, children: [
      { type: 'capsule', name: 'sideneck', a: root, b: bend, r: n.rr, r1: n.rr * 0.85, mat: hide, shade: 'cyl' },
      { type: 'capsule', name: 'sideneck', a: bend, b: tip, r: n.rr * 0.85, r1: n.rr * 0.7, mat: hide, shade: 'cyl' },
      { type: 'ellipse', name: 'sidehead', cx: tip[0], cy: tip[1], rx: hrx, ry: hry, mat: hide, shade: 'flat', band: 1 },
      { type: 'ellipse', name: 'sidehead', cx: tip[0] - hrx * 0.2, cy: tip[1] - hry * 0.3, rx: hrx * 0.6, ry: hry * 0.5, mat: hide, shade: 'flat', band: 0 },
      { type: 'ellipse', name: 'sidesnout', cx: sn[0], cy: sn[1], rx: n.hs * 0.8, ry: n.hs * 0.45, mat: hide, shade: 'flat', band: 1 },
    ] } });
    if (showFace) {
      marks.push({ type: 'rect', name: 'eye', x: R(tip[0] + dir * n.hs * 0.35), y: R(tip[1] - hry * 0.15), w: 1, h: 1, color: 'glow.1' });
      marks.push({ type: 'rect', name: 'mouth', x: R(sn[0] - n.hs * 0.5), y: R(sn[1] + n.hs * 0.1), w: Math.max(2, R(n.hs)), h: 1, color: 'outline' });
    }
    // in back views a continuous moss mane runs down the neck's back
    if (back) decals.push({ name: 'mane-' + n.name, part: 'sideneck', mat: 'hair', band: 1, shape: [0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map(u => { const p = u < 0.5 ? [root[0] + (bend[0] - root[0]) * u * 2, root[1] + (bend[1] - root[1]) * u * 2] : [bend[0] + (tip[0] - bend[0]) * (u - 0.5) * 2, bend[1] + (tip[1] - bend[1]) * (u - 0.5) * 2]; return { type: 'ellipse', cx: p[0], cy: p[1], rx: n.rr * 0.5, ry: U(1.6) }; }) });
  });
  // the severed stump: a short thick neck leaning back from the far shoulder, its cut end raw flesh in a pale rim
  const st0 = pose.at('spine', 0.72, -U(1), -U(5), top - U(1)), st1 = pose.at('spine', 0.72, -U(5), -U(10), top + U(7));
  heads.push({ z: pose.depth('head') - 0.03, g: { type: 'group', name: 'stump', underlay: true, children: [
    { type: 'capsule', name: 'stump', a: st0, b: st1, r: U(3.2), r1: U(2.8), mat: hide, shade: 'cyl' },
    { type: 'ellipse', name: 'cut', cx: st1[0], cy: st1[1] - U(0.5), rx: U(3.2), ry: U(1.6), mat: pal.skin, shade: 'flat', band: 1 },
    { type: 'ellipse', name: 'cut', cx: st1[0], cy: st1[1] - U(0.5), rx: U(2), ry: U(0.9), mat: pal.accent, shade: 'flat', band: 1 },
  ] } });
  // spine ridge: low bone spikes along the top of the trunk, behind the necks
  const ridge = [];
  for (let j = 0; j < 4; j++) { const t = 0.12 + j * 0.15, b = pose.at('spine', t, 0, 0, bodyH * 0.5 - U(1)); ridge.push({ type: 'path', name: 'ridge', d: `M${b[0] - U(2)} ${b[1] + U(1.5)} L${b[0]} ${b[1] - U(4)} L${b[0] + U(2)} ${b[1] + U(1.5)} Z`, mat: pal.skin, shade: 'flat', band: 0 }, { type: 'path', name: 'ridge', d: `M${b[0]} ${b[1] - U(3)} L${b[0] + U(2)} ${b[1] + U(1.5)} L${b[0]} ${b[1] + U(1.5)} Z`, mat: pal.skin, shade: 'flat', band: 1 }); }
  pieces.push({ z: pose.depth('head') - 0.04, g: { type: 'group', name: 'ridge', underlay: true, children: ridge } });
  for (const h of heads) pieces.push(h);
  const G = L.G, nr = at(G.root, 0), nb = at(G.bend, 0.5), sn = at([G.tip[0] + hr * 0.9, 0, G.tip[2] - hr * 0.25]);
  const srx = hr * (1 + 0.45 * side), sry = hr * 0.85;
  // the great head: a broad blunt skull, heavy jaw, one long bone horn and one broken stub
  const hornA = [skull[0] - hr * 0.7, skull[1] - hr * 0.5], hornT = [skull[0] - hr * 1.1 - sx * U(3), skull[1] - hr * 1.6], hornB = [skull[0] - hr * 0.2, skull[1] - hr * 0.75];
  const hornM = [(hornA[0] + hornB[0]) / 2, (hornA[1] + hornB[1]) / 2];
  const stubT = [skull[0] + hr * 0.45, skull[1] - hr * 1.15];
  pieces.push({ z: pose.depth('head') + 0.01, g: { type: 'group', name: 'head', underlay: true, children: [
    { type: 'capsule', name: 'neck', a: nr, b: nb, r: U(6), r1: U(5.2), mat: hide, shade: 'cyl' },
    { type: 'capsule', name: 'neck', a: nb, b: skull, r: U(5.2), r1: U(4.6), mat: hide, shade: 'cyl' },
    { type: 'ellipse', name: 'skull', cx: skull[0], cy: skull[1], rx: srx, ry: sry, mat: hide, shade: 'flat', band: 1 },
    { type: 'ellipse', name: 'skull', cx: skull[0] - srx * 0.2, cy: skull[1] - sry * 0.3, rx: srx * 0.65, ry: sry * 0.55, mat: hide, shade: 'flat', band: 0 },
    ...(side > 0.5 ? [{ type: 'ellipse', name: 'snout', cx: sn[0], cy: sn[1] + U(1), rx: hr * 0.85, ry: hr * 0.5, mat: hide, shade: 'flat', band: 1 },
      { type: 'ellipse', name: 'snout', cx: sn[0] - sx * hr * 0.1, cy: sn[1] + U(1) - hr * 0.2, rx: hr * 0.6, ry: hr * 0.22, mat: hide, shade: 'flat', band: 0 }]
      : [{ type: 'ellipse', name: 'jaw', cx: skull[0], cy: skull[1] + hr * 0.6, rx: hr * 0.8, ry: hr * 0.45, mat: hide, shade: 'flat', band: 2 }]),
    { type: 'path', name: 'horn', d: `M${hornA[0]} ${hornA[1]} L${hornT[0]} ${hornT[1]} L${hornB[0]} ${hornB[1]} Z`, mat: pal.skin, shade: 'flat', band: 0 },
    { type: 'path', name: 'horn', d: `M${hornM[0]} ${hornM[1]} L${hornT[0]} ${hornT[1]} L${hornB[0]} ${hornB[1]} Z`, mat: pal.skin, shade: 'flat', band: 1 },
    { type: 'path', name: 'horn', d: `M${skull[0] + hr * 0.2} ${skull[1] - hr * 0.75} L${stubT[0]} ${stubT[1]} L${skull[0] + hr * 0.7} ${skull[1] - hr * 0.5} Z`, mat: pal.skin, shade: 'flat', band: 1 },
  ] } });
  for (const p of pieces.sort((a, b) => a.z - b.z)) s.add(p.g);
  // the broken horn's snapped end
  decals.push({ name: 'horn-break', part: 'horn', mat: 'skin', band: 2, shape: { type: 'rect', x: R(stubT[0]) - 1, y: R(stubT[1]) + 1, w: 2, h: 1 } });
  // the stump's raw core
  s.add({ type: 'rect', name: 'cut-core', x: R(st1[0]), y: R(st1[1] - U(0.5)), w: 1, h: 1, color: 'accent.2' });
  // moss on the great neck and skull: a mane down the back in back views, a cap on the crown from the front
  if (back) decals.push({ name: 'mane', part: 'neck', mat: 'hair', band: 1, shape: [[nr, nb, 0.1], [nr, nb, 0.35], [nr, nb, 0.6], [nr, nb, 0.85], [nb, skull, 0.1], [nb, skull, 0.35], [nb, skull, 0.6]].map(([p, q, u]) => ({ type: 'ellipse', cx: p[0] + (q[0] - p[0]) * u, cy: p[1] + (q[1] - p[1]) * u, rx: U(2.6), ry: U(1.8) })) });
  decals.push({ name: 'moss-crown', part: 'skull', mat: 'hair', band: 1, shape: back
    ? [{ type: 'ellipse', cx: skull[0], cy: skull[1] - sry * 0.15, rx: srx * 0.6, ry: sry * 0.5 }, { type: 'rect', x: R(skull[0] - U(2.5)), y: R(skull[1] + sry * 0.2), w: 1, h: 2 }, { type: 'rect', x: R(skull[0] + U(1.5)), y: R(skull[1] + sry * 0.2), w: 1, h: 3 }]
    : [{ type: 'ellipse', cx: skull[0] + srx * 0.15, cy: skull[1] - sry * 0.7, rx: srx * 0.3, ry: U(1.1) }] });
  if (back) dots([[skull[0] - U(2), skull[1] - sry * 0.45], [skull[0] + U(1), skull[1] - sry * 0.5]], 'skull', 'hair', 0, 'moss-crown-lit');
  // old pale scars across the great skull (the side away from the light), seen from the front and the side
  if (!back) {
    const k = side > 0.5 ? -sx : 1;
    const x0 = skull[0] + k * srx * 0.1, y0 = skull[1] - sry * 0.6, x1 = skull[0] + k * srx * 0.5, y1 = skull[1] - sry * 0.1;
    dots([...line(x0, y0, x1, y1), ...line(x0 + k * 3, y0 + 1, x1 + k * 3, y1 + 1).slice(1, -1)], 'skull', 'skin', 0, 'scars');
  }
  // the face: glowing eyes under a heavy brow, a dark mouth line with a tooth
  if (showFace) {
    for (const ex of L.eyes) {
      s.add({ type: 'rect', name: 'brow', x: ex - 1, y: L.eyeY - 1, w: 3, h: 1, mat: hide, shade: 'flat', band: 2 });
      s.add({ type: 'rect', name: 'eye', x: ex, y: L.eyeY, w: 1, h: Math.max(1, Math.round(U(2))), color: 'outline' });
      s.add({ type: 'rect', name: 'eye', x: ex, y: L.eyeY, w: 1, h: 1, color: 'glow.1' });
    }
    if (side > 0.5) {
      const my = R(sn[1] + U(1) + hr * 0.2), x0 = R(sx > 0 ? sn[0] - hr * 0.4 : sn[0] - hr * 0.5), mw = R(hr * 0.9);
      s.add({ type: 'rect', name: 'mouth', x: x0, y: my, w: mw, h: 1, color: 'outline' });
      s.add({ type: 'rect', name: 'tooth', x: sx > 0 ? x0 + mw - 2 : x0 + 1, y: my + 1, w: 1, h: 1, color: 'skin.0' });
    } else {
      const my = R(skull[1] + hr * 0.62), x0 = R(skull[0] - hr * 0.5), mw = R(hr * 1.0);
      s.add({ type: 'rect', name: 'mouth', x: x0, y: my, w: mw, h: 1, color: 'outline' });
      s.add({ type: 'rect', name: 'tooth', x: x0 + 1, y: my + 1, w: 1, h: 1, color: 'skin.0' });
      s.add({ type: 'rect', name: 'tooth', x: x0 + mw - 2, y: my + 1, w: 1, h: 1, color: 'skin.0' });
    }
  }
  for (const m of marks) s.add(m);
  let p = ctx.lib.proc(s)
    .add('ao', { part: ['torso', 'belly', 'leg', 'tail'] })
    .add('rimLight', { part: ['skull', 'neck', 'sideneck', 'sidehead', 'torso', 'leg'], side: 'lit' });
  for (const d of decals) p = p.add('decal', d);
  return p.add('groundShadow', {}).render();
}

export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: L.skull.map(Math.round) };
  delete a.tail;
  a.hand = a.head;
  if (L.front > -0.2) L.eyes.forEach((x, i) => { a[i ? 'eye2' : 'eye'] = [x, L.eyeY]; });
  if (L.mouth && L.front > -0.2) a.mouth = L.mouth;
  return a;
};
