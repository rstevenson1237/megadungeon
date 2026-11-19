// boss-old-mawkin base.v2 (r2) — SHAPE DRAFT after the owner rejected v1 (upright from the front): one low four-legged hydra body in every facing (wide low torso, four legs, four necks fanning up, a dominant old head with broken horn, a severed stump), drawn to 3 m.
// (v1 header follows) boss-old-mawkin base.v1 (r1) — template: very large creature (dragon, giant beast, golem on all fours, ogre-sized brute) with
// four facings and a heavy walk over ctx.t (iso camera: a 2D sprite per facing on a 2:1 ground shadow), on the shared quadruped rig with the `large` proportions
// (`ctx.lib.rigs.body`). A massive body low on four thick legs, a long neck raising the head above the shoulders, a tail and
// optional wings folded on the back. Brief it on a large frame (`--size large` or WxH) with its real height: a 4 m dragon
// must come out at 4 m × px per metre — the height check fails characters and creatures more than 15 % off. `ground` is
// where it stands. Role ramps only (R11).
export const meta = { brief: 'boss-old-mawkin', pass: 'r2', notes: 'Old Mawkin: an ancient moss hydra, one huge scarred central head with a broken horn, two thin side necks and a headless stump, hunched high shoulders, heavy tail' };

export const params = {
  hide: { type: 'swap', options: ['accent', 'leather', 'grass', 'hair'], default: 'grass' },
  belly: { type: 'swap', options: ['skin', 'leather', 'dirt'], default: 'skin' },
  wings: { type: 'toggle', default: false },
  neck: { type: 'range', min: 0.6, max: 1.6, default: 1.35 },
};

// Geometry shared by render() and anchors(): the rig's pose for this state and phase, the head at the neck's end, the eyes.
function layout(ctx) {
  const [w, h] = ctx.size, U = v => (v * Math.min(w, h)) / 64, ground = Math.round(h * 0.96);
  // the neck parameter is the drawn neck's length: it changes the proportion of the whole asset, so it is fixed per asset, not per cell
  const rig = ctx.lib.rigs.body('large', ctx, { height: U(27), ground, proportions: { neck: 0.55 * (ctx.params?.neck ?? 1) } });
  const { sx, front, side } = rig, P = rig.pose(ctx.state, ctx.t), headR = U(6), showFace = front > -0.3;
  const skull = P.at('head', 0.3), eyePts = !showFace ? [] : (side > 0.9 ? [Math.sign(sx)] : [-1, 1]).map(k => P.at('head', 0.3, headR * 0.45, k * headR * 0.45, headR * 0.1));
  const eyes = eyePts.map(p => Math.round(p[0])).sort((a, b) => a - b), eyeY = Math.round(eyePts.length ? eyePts[0][1] : skull[1]);
  const mouth = showFace ? P.at('head', 0.6, headR * 0.3, 0, -headR * 0.6).map(Math.round) : null;
  return { w, h, U, rig, P, sx, front, side, ground, headR, skull, showFace, eyes, eyeY, mouth };
}

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), hide = pal[P.hide];
  const { U, rig, P: pose, sx, side, headR, skull } = L, bodyH = U(15), r = U(4);
  const limb = (n, k = 1) => ({ type: 'capsule', a: pose.start(n), b: pose.end(n), r: r * k, mat: hide, shade: 'cyl' });
  const pieces = [];
  for (const e of ['FL', 'FR', 'BL', 'BR']) pieces.push({ z: pose.depth(`leg${e}_up`), g: { type: 'group', name: 'legs', underlay: true, children: [limb(`leg${e}_up`), limb(`leg${e}_lo`, 0.95)] } });
  pieces.push({ z: pose.depth('tail') - 0.01, g: { type: 'group', name: 'tail', underlay: true, children: [{ type: 'capsule', name: 'tail', a: pose.start('tail'), b: pose.end('tail'), r, mat: hide, shade: 'cyl' }] } });
  const mid = pose.at('spine', 0.5), rx = U(17) * (1 - side) + (rig.lengths.spine / 2 + U(8)) * side, ry = bodyH / 2;
  const wings = P.wings ? [-1, 1].map(k => { const b = pose.at('spine', 0.5, 0, k * U(4), bodyH * 0.4), t = pose.at('spine', 0.5, -U(1), k * (U(9) + side * 0), bodyH * 0.4 + U(14)); return { type: 'path', name: 'wing', d: `M${b[0] - U(3)} ${b[1]} L${t[0]} ${t[1]} L${b[0] + U(5)} ${b[1] + U(2)} Z`, mat: pal.leather, shade: 'flat', band: 1 }; }) : [];
  pieces.push({ z: 0, g: { type: 'group', name: 'body', underlay: true, children: [
    { type: 'ellipse', name: 'torso', cx: mid[0], cy: mid[1], rx, ry, mat: hide, shade: 'normal' },
    { type: 'ellipse', name: 'belly', cx: mid[0] + sx * U(2), cy: mid[1] + ry * 0.45, rx: rx * 0.6, ry: ry * 0.4, mat: pal[P.belly], shade: 'normal' },
    ...wings,
  ] } });
  const nk = pose.start('neck'), hd = pose.end('neck'), up = U(1);
  const heads = [];
  // two thin side necks (younger heads) fanning from the shoulders, and a headless stump on the far side
  [[-1, 6, 0.8], [1, 11, 0.7]].forEach(([k, lift, sc], i) => {
    const root = pose.at('spine', 0.85, 0, k * U(2), bodyH * 0.3), tip = [skull[0] + k * U(14) - sx * U(2), skull[1] + U(8 - lift) - (1 - side) * U(5)], mid = [(root[0] + tip[0]) / 2 + k * U(3), (root[1] + tip[1]) / 2];
    heads.push({ z: pose.depth('head') - 0.02 + i * 0.001, g: { type: 'group', name: 'sideneck' + i, underlay: true, children: [
      { type: 'capsule', a: root, b: mid, r: U(2.2), mat: hide, shade: 'cyl' },
      { type: 'capsule', a: mid, b: tip, r: U(1.8), mat: hide, shade: 'cyl' },
      { type: 'ellipse', cx: tip[0], cy: tip[1], rx: U(3.2 * sc + 1.5), ry: U(2.2), mat: hide, shade: 'sphere' },
      { type: 'ellipse', cx: tip[0] + sx * U(2.5), cy: tip[1] + U(0.8), rx: U(2.4), ry: U(1.2), mat: hide, shade: 'normal' },
    ] } });
  });
  const stumpRoot = pose.at('spine', 0.7, 0, U(-3), bodyH * 0.35);
  heads.push({ z: pose.depth('head') - 0.03, g: { type: 'group', name: 'stump', underlay: true, children: [
    { type: 'capsule', a: stumpRoot, b: [stumpRoot[0] - U(3), stumpRoot[1] - U(7)], r: U(2.4), mat: hide, shade: 'cyl' },
    { type: 'ellipse', cx: stumpRoot[0] - U(3), cy: stumpRoot[1] - U(7.5), rx: U(2.6), ry: U(1.3), mat: pal.skin, shade: 'flat' },
  ] } });
  for (const h of heads) pieces.push(h);
  const sn = pose.at('head', 0.55, 0, 0, -headR * 0.2), hr = headR * 1.35;
  // the great head: a broad blunt skull, heavy jaw, one long horn and one broken stub
  pieces.push({ z: pose.depth('head') + 0.01, g: { type: 'group', name: 'head', underlay: true, children: [
    { type: 'capsule', name: 'neck', a: nk, b: hd, r: U(5.2), mat: hide, shade: 'cyl' },
    { type: 'ellipse', name: 'skull', cx: skull[0], cy: skull[1], rx: hr * (1 + 0.45 * side), ry: hr * 0.85, mat: hide, shade: 'sphere' },
    ...(side > 0.5 ? [{ type: 'ellipse', name: 'snout', cx: sn[0], cy: sn[1] + U(1), rx: hr * 0.85, ry: hr * 0.5, mat: hide, shade: 'normal' }] : [{ type: 'ellipse', name: 'jaw', cx: skull[0], cy: skull[1] + hr * 0.6, rx: hr * 0.8, ry: hr * 0.45, mat: hide, shade: 'normal' }]),
    { type: 'path', name: 'horn', d: `M${skull[0] - hr * 0.7} ${skull[1] - hr * 0.5} L${skull[0] - hr * 1.2 - sx * U(2)} ${skull[1] - hr * 2} L${skull[0] - hr * 0.2} ${skull[1] - hr * 0.7} Z`, mat: pal.skin, shade: 'flat', band: 0 },
    { type: 'path', name: 'horn', d: `M${skull[0] + hr * 0.2} ${skull[1] - hr * 0.7} L${skull[0] + hr * 0.45} ${skull[1] - hr * 1.15} L${skull[0] + hr * 0.7} ${skull[1] - hr * 0.5} Z`, mat: pal.skin, shade: 'flat', band: 0 },
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
