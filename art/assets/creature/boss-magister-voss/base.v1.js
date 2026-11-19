// boss-magister-voss base.v1 (r1) SHAPE DRAFT: Magister Voss, the violet archmage of the wizard's sanctum (family h, a
// caster boss drawn 5 m tall, 2.2x the player). Silhouette and form only, flat materials, no proc layers. Family-h's deep
// pointed hood and long robe, made his own: a tall hood whose point droops back, a long beard spilling from it to the
// belt, a dagged shoulder mantle over a wedge torso, a robe that flares to an uneven dagged hem with a train behind, bell
// sleeves bent at the elbow, a grimoire in the off hand and a tall crescent-headed staff that stands above his hood. The
// attack swings the staff in an arc: raised up and back, overhead, chopped forward and across (held), then back upright.
// The robe, mantle and hood are the cloth ramp (recolour: cloth), so the boss row's violet dresses him in game.
// From the template iso humanoid walker on the shared biped rig (`ctx.lib.rigs.body`): facings s, se, e, ne, n are drawn
// here and the engine mirrors the west ones; the rig turns the figure and the body narrows and turns with it.
export const meta = { brief: 'boss-magister-voss', pass: 'r1', notes: 'shape draft: hooded bearded archmage, dagged mantle, flared robe, grimoire, crescent staff', recolour: 'cloth' };

export const params = {};

const HM = 5; // metres, from the brief
const ARM = ['armL_up', 'armL_lo', 'armR_up', 'armR_lo'];
// the staff swing, per attack frame: arm angles (relative to the spine), spine lean, and the staff's 3D direction
// (forward, side, up; side + is his right hand's side)
const SWING = [ // rig angles: an upper arm under 180 swings back, over 180 forward; a forearm bends forward when positive; a negative spine leans forward
  { spine: 6, armR_up: 35, armR_lo: 25, dir: [-0.45, 0.4, 0.8] },    // wind-up: raised up and back
  { spine: 0, armR_up: -20, armR_lo: 10, dir: [0.3, 0.3, 0.9] },     // overhead
  { spine: -14, armR_up: 228, armR_lo: -8, dir: [0.5, -0.8, -0.2] },  // contact: chopped forward and across, held
  { spine: -6, armR_up: 205, armR_lo: 25, dir: [0.35, -0.1, 0.93] }, // recovery: back upright
];

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, ground = h - 1;
  const H = Math.round(HM * metre * 0.9), U = H / 72;
  // slim, grown-up proportions (not the rig's chibi default): a smaller head, long legs under the robe
  const rig = ctx.lib.rigs.body('biped', ctx, { ground, height: H, proportions: { hip: 0.02, head: 0.2, neck: 0.04, leg_up: 0.17, leg_lo: 0.17, arm_up: 0.19, arm_lo: 0.19 } });
  const frame = (ctx.logical ?? ctx.frame ?? 0) % 4, attack = ctx.state === 'attack';
  const base = rig.pose(ctx.state, ctx.t), angles = {};
  if (attack) { const k = SWING[frame]; Object.assign(angles, { spine: k.spine, armR_up: k.armR_up, armR_lo: k.armR_lo, armL_up: 192, armL_lo: 55 }); }
  else Object.assign(angles, { armL_up: 188, armL_lo: 62, armR_up: (base.angles.armR_up ?? 180) + 14, armR_lo: (base.angles.armR_lo ?? 0) + 28 });
  const P = rig.pose(ctx.state, ctx.t, { angles });
  const { sx, front, side } = rig, headH = rig.lengths.head, headW = headH * 0.98 * (1 - 0.1 * side);
  const profile = side > 0.9, hcx = P.at('head', 0.5)[0], top = P.end('head')[1], hand = P.end('armR_lo');
  const fx = sx * headW * 0.26, fw = headW * (0.62 - 0.2 * side);
  const showFace = front > -0.3, ey = Math.round(top + headH * 0.5);
  const eyes = !showFace ? [] : (profile ? [hcx + fx + fw * 0.2] : [hcx + fx - fw * 0.25, hcx + fx + fw * 0.22]).map(Math.round);
  const mouth = showFace ? [Math.round(profile ? eyes[0] : hcx + fx), Math.round(top + headH * 0.75)] : null;
  const dir = attack ? SWING[frame].dir : [0, 0, 1], dl = Math.hypot(...dir), d = dir.map(v => v / dl);
  const lt = (attack ? 36 : 53) * U, lb = (attack ? 32 : 24) * U; // the grip slides down the shaft for the swing
  const staffTip = P.at('armR_lo', 1, d[0] * lt, d[1] * lt, d[2] * lt);
  const staffButt = P.at('armR_lo', 1, -d[0] * lb, -d[1] * lb, -d[2] * lb);
  if (staffButt[1] > ground - 1) staffButt[1] = ground - 1;
  return { w, h, U, rig, P, sx, front, side, ground, headH, headW, profile, hcx, top, hand, fx, fw, showFace, eyes, ey, mouth, staffTip, staffButt, frame, attack };
}

// a closed curve through the points (quadratic midpoint spline); `sharp` indices stay corners
const smooth = (pts, sharp = []) => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let dd = '';
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    if (i === 0) dd += sharp.includes(0) ? `M${p.join(' ')}` : `M${m(pts[n - 1], p).join(' ')} Q${p.join(' ')} ${m(p, q).join(' ')}`;
    else dd += sharp.includes(i) ? ` L${p.join(' ')}` : ` Q${p.join(' ')} ${m(p, q).join(' ')}`;
  }
  return dd + ' Z';
};

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx);
  const { U, P: pose, sx, front, side, ground: G, headH, headW, profile, hcx, top, fx, fw, showFace, eyes, ey, staffTip, staffButt } = L;
  const neck = pose.start('neck'), hip = pose.start('spine'), af = Math.abs(front);
  const wf = 1 - 0.28 * side, sway = ctx.state === 'walk' ? Math.sin(ctx.t * Math.PI * 4) * U : 0;
  // the edge toward his facing is the front; the back edge flares wider (a train) in the turned views
  const wR = wf * (1 + 0.35 * Math.max(0, -sx)) * (1 - 0.12 * Math.max(0, sx));
  const wL = wf * (1 + 0.35 * Math.max(0, sx)) * (1 - 0.12 * Math.max(0, -sx));

  // legs and feet, far side first (under the robe; the feet show below the hem)
  for (const n of pose.far(['legL_up', 'legR_up'])) {
    const lo = n.replace('_up', '_lo'), e = pose.end(lo);
    s.add({ type: 'group', name: 'leg', underlay: true, children: [
      { type: 'capsule', name: 'thigh', a: pose.start(n), b: pose.end(n), r: 2.8 * U, r1: 2.3 * U, mat: pal.leather, shade: 'flat', band: 2 },
      { type: 'capsule', name: 'shin', a: pose.start(lo), b: e, r: 2.2 * U, r1: 1.7 * U, mat: pal.leather, shade: 'flat', band: 2 },
    ] });
    s.add({ type: 'ellipse', name: 'foot', underlay: true, cx: e[0] + sx * 1.4 * U, cy: G - 1.2 * U, rx: (2.8 - 0.6 * af) * U, ry: 1.4 * U, mat: pal.leather, shade: 'flat', band: 1 });
  }

  const sleeve = n => {
    const h = pose.end(`arm${n}_lo`);
    return { type: 'group', name: `arm${n}`, underlay: true, children: [
      { type: 'capsule', name: 'sleeve-up', a: pose.start(`arm${n}_up`), b: pose.end(`arm${n}_up`), r: 2.5 * U, r1: 2.6 * U, mat: pal.cloth, shade: 'flat', band: 1 },
      { type: 'capsule', name: 'sleeve-lo', a: pose.start(`arm${n}_lo`), b: [h[0] + (h[0] - pose.start(`arm${n}_lo`)[0]) * -0.12, h[1] + (h[1] - pose.start(`arm${n}_lo`)[1]) * -0.12], r: 2.4 * U, r1: 3.5 * U, mat: pal.cloth, shade: 'flat', band: 1 },
      { type: 'circle', name: 'hand', cx: h[0], cy: h[1], r: 1.7 * U, mat: pal.skin, shade: 'flat', band: 1 },
    ] };
  };
  // the grimoire in the off hand, held against the hip
  const book = () => { const b = pose.end('armL_lo'), bw = (3.6 - 1.4 * side) * U, bh = 4.6 * U;
    s.add({ type: 'group', name: 'grimoire', underlay: true, children: [
      { type: 'path', name: 'book', d: `M${b[0] - bw} ${b[1] - bh} L${b[0] + bw} ${b[1] - bh + U} L${b[0] + bw} ${b[1] + bh} L${b[0] - bw} ${b[1] + bh - U} Z`, mat: pal.leather, shade: 'flat', band: 1 },
      { type: 'rect', name: 'pages', x: b[0] - bw + U, y: b[1] - bh + 1.5 * U, w: Math.max(1, U), h: 2 * bh - 3 * U, mat: pal.skin, shade: 'flat', band: 0 },
    ] }); };
  // the staff: a long shaft through the hand, a crescent cradling an orb at its head
  const staff = () => {
    const [tx, ty] = staffTip, [bx, by] = staffButt, ang = Math.atan2(tx - bx, by - ty) * 180 / Math.PI;
    s.add({ type: 'group', name: 'staff', underlay: true, children: [
      { type: 'capsule', name: 'shaft', a: [bx, by], b: [tx, ty], r: 1.1 * U, r1: 1.0 * U, mat: pal.leather, shade: 'flat', band: 1 },
      { type: 'group', name: 'staff-head', rotate: ang, origin: [tx, ty], children: [
        { type: 'arc', name: 'crescent', cx: tx, cy: ty - 5.2 * U, r: 6 * U, w: 2 * U, a0: -35, a1: 215, mat: pal.metal, shade: 'flat', band: 1 },
        { type: 'circle', name: 'orb', cx: tx, cy: ty - 5.6 * U, r: 2.8 * U, mat: pal.glow, shade: 'flat', band: 1 },
      ] },
    ] });
  };

  const arms = pose.far(['armL_up', 'armR_up']).map(n => n[3]); // far first
  const back = front < -0.2;
  if (back) { staff(); book(); }
  if (side > 0.5) { s.add(sleeve(arms[0])); if (arms[0] === 'L' && !back) book(); if (arms[0] === 'R' && !back) staff(); }

  // the robe: a wedge torso (broad chest, narrow waist) flaring to a dagged, uneven hem
  const nx = neck[0], ny = neck[1], hx = hip[0], hy = hip[1], hemY = G - 2.2 * U;
  const hemL = hx - 16 * U * wL + sway, hemR = hx + 16 * U * wR + sway, dags = [];
  for (let i = 1; i < 7; i++) { const u = i / 7; dags.push([hemR + (hemL - hemR) * u, hemY + (i % 2 ? -2.6 : 0.6) * U + (i === 3 ? -1 : 0) * U]); }
  const robe = [
    [nx + 7.5 * U * wR, ny], [nx + 9 * U * wR, ny + 6 * U], [hx + 6.2 * U * wR, hy - 4 * U], [hx + 8.5 * U * wR, hy + 6 * U],
    [hx + 12.5 * U * wR + sway * 0.5, hy + 15 * U], [hemR, hemY], ...dags, [hemL, hemY],
    [hx - 12.5 * U * wL + sway * 0.5, hy + 15 * U], [hx - 8.5 * U * wL, hy + 6 * U], [hx - 6.2 * U * wL, hy - 4 * U], [nx - 9 * U * wL, ny + 6 * U], [nx - 7.5 * U * wL, ny],
  ];
  s.add({ type: 'path', name: 'robe', underlay: true, d: smooth(robe, [5, 6, 7, 8, 9, 10, 11, 12, 13]), mat: pal.cloth, shade: 'flat', band: 1 });
  // a sash cinches the waist, curving with the body
  s.add({ type: 'path', name: 'sash', d: `M${hx - 6.6 * U * wL} ${hy - 5.2 * U} Q${hx} ${hy - 4 * U + 1.2 * U * af} ${hx + 6.6 * U * wR} ${hy - 5.2 * U} L${hx + 6.4 * U * wR} ${hy - 3 * U} Q${hx} ${hy - 1.8 * U + 1.2 * U * af} ${hx - 6.4 * U * wL} ${hy - 3 * U} Z`, mat: pal.accent, shade: 'flat', band: 1 });

  if (side > 0.5) { s.add(sleeve(arms[1])); if (arms[1] === 'L' && !back) book(); if (arms[1] === 'R' && !back) staff(); }
  else { if (!back) { staff(); } s.add(sleeve(arms[0])); s.add(sleeve(arms[1])); if (!back) book(); }

  // the dagged mantle over the shoulders, a hump the same in every facing
  const mw = (9.5 + 6.5 * af) * U, my = ny + 12 * U, mL = nx - mw * wL / wf, mR = nx + mw * wR / wf;
  const mantle = [[nx, ny - 3 * U], [nx + 0.75 * (mR - nx), ny - 1.8 * U], [mR, ny + 3.5 * U], [mR - 0.6 * U, my],
    [nx + 0.55 * (mR - nx), my - 3 * U], [nx + 0.3 * (mR - nx), my + 0.5 * U], [nx, my - 2.8 * U], [nx - 0.3 * (nx - mL), my + 0.5 * U], [nx - 0.55 * (nx - mL), my - 3 * U],
    [mL + 0.6 * U, my], [mL, ny + 3.5 * U], [nx - 0.75 * (nx - mL), ny - 1.8 * U]];
  s.add({ type: 'path', name: 'mantle', underlay: true, d: smooth(mantle, [3, 4, 5, 6, 7, 8, 9]), mat: pal.cloth, shade: 'flat', band: 2 });

  // the long beard from the hood's mouth to the sash, jutting forward in profile
  if (showFace) {
    const bcx = hcx + fx * (profile ? 1.25 : 1), bt = top + headH * 0.72, bw = (3.6 - 1.2 * side) * U, tip = hy - 6 * U, bend = sx * 2 * U;
    s.add({ type: 'path', name: 'beard', underlay: true, d: `M${bcx - bw} ${bt} Q${bcx - bw * 1.1} ${(bt + tip) / 2} ${bcx - 0.8 * U + bend} ${tip} L${bcx + bend * 0.5} ${tip - 2 * U} L${bcx + 0.8 * U + bend} ${tip} Q${bcx + bw * 1.1} ${(bt + tip) / 2} ${bcx + bw} ${bt} Z`, mat: pal.hair, shade: 'flat', band: 0 });
  }

  // the deep pointed hood; its point droops back, away from the facing
  const hw = headW / 2, tipX = hcx - sx * 3.5 * U - (back ? 0 : 0), tipY = top - 7 * U;
  s.add({ type: 'path', name: 'hood', underlay: true, d: `M${tipX} ${tipY} Q${hcx + hw * 1.05} ${top - 2 * U} ${hcx + hw * 1.12} ${top + headH * 0.5} Q${hcx + hw * 1.2} ${top + headH * 0.95} ${hcx + hw * 1.3} ${top + headH + 2 * U} L${hcx - hw * 1.3} ${top + headH + 2 * U} Q${hcx - hw * 1.2} ${top + headH * 0.95} ${hcx - hw * 1.12} ${top + headH * 0.5} Q${hcx - hw * 1.05} ${top - 2 * U} ${tipX} ${tipY} Z`, mat: pal.cloth, shade: 'flat', band: 1 });
  if (showFace) {
    // the hood's opening: shadow over the brow, the face below it
    const ox = hcx + fx, oy = top + headH * 0.5;
    s.add({ type: 'ellipse', name: 'hood-opening', cx: ox, cy: oy, rx: fw * 0.62, ry: headH * 0.36, mat: pal.cloth, shade: 'flat', band: 2 });
    s.add({ type: 'ellipse', name: 'face', cx: ox + sx * 0.5 * U, cy: oy + headH * 0.1, rx: fw * 0.42, ry: headH * 0.24, mat: pal.skin, shade: 'flat', band: 1 });
    for (const ex of eyes) s.add({ type: 'rect', name: 'eye', x: ex, y: ey, w: 1, h: 1, mat: pal.glow, shade: 'flat', band: 0 });
  }
  return s.render();
}

// Named points per frame: eye/eye2/mouth where the face is seen; `hand` is the staff hand; `staff` is the staff's head.
export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: [Math.round(L.hcx), Math.round(L.top + L.headH * 0.5)], staff: L.staffTip.map(Math.round) };
  delete a.ground;
  L.eyes.forEach((x, i) => { a[i ? 'eye2' : 'eye'] = [x, L.ey]; });
  if (L.mouth) a.mouth = L.mouth;
  return a;
};
