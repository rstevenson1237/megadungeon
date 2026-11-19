// boss-the-black-abbess base.v1 (r1) SHAPE DRAFT — The Black Abbess, a unique undead caster of the family-h (men and
// dwarves: acolytes, priests, mages) family, 5.6 m in the brief (about 89 px, 2.4x the drawn player) in the 96 x 128 frame.
// Silhouette and form only, flat materials, no proc layers. What makes her read:
//  - headgear: a black veil over the head with a pale wimple framing a gaunt skull face, and behind it an iron halo
//    ringed with spikes (a dark nimbus) that crowns the outline in every facing;
//  - build: a tall, slightly stooped figure with sloping shoulders, a pear-shaped habit (narrow waist, flaring to a wide
//    scalloped hem over the feet) and a long veil falling down her back to the knees with a ragged end;
//  - hands: wide bell sleeves bent at the elbow, bony hands; the main hand holds a tall processional cross-staff,
//    the off hand is raised before her chest. The attack swings the cross-staff in an overhead arc
//    (wind-up behind, overhead, a held forward strike, recovery).
// Drawn on the shared biped rig (`ctx.lib.rigs.body`, fixed bone lengths) turned to the iso three-quarter views: s is the
// front drawing turned toward the viewer's lower left, w the back drawing toward the upper left; e and n are those
// mirrored, as the game does (Spec 01b). Arms are placed by the rig's 3D frame (`pose.at`) so they turn with the body.
export const meta = { brief: 'boss-the-black-abbess', pass: 'r1', notes: 'shape draft: veiled abbess, spiked halo, wimple, pear habit with scalloped hem, back veil, bell sleeves, cross-staff', mirror: false, recolour: 'cloth' };

const BODY_M = 5.0; // rig height (ground to crown of the veil) in metres; the halo's spikes rise above it to the brief's 5.6 m

function smooth(pts) {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let d = `M${m(pts[n - 1], pts[0]).join(' ')}`;
  for (let i = 0; i < n; i++) d += ` Q${pts[i].join(' ')} ${m(pts[i], pts[(i + 1) % n]).join(' ')}`;
  return d + ' Z';
}
const dirv = deg => [Math.sin(deg * Math.PI / 180), -Math.cos(deg * Math.PI / 180)]; // [fwd, up] for an angle from straight down

// arm and staff angles (degrees from hanging straight down, forward positive): [upper arm, forearm, staff]
function armPose(ctx) {
  const st = ctx.state, f = ctx.frame ?? 0;
  if (st === 'attack') {
    const main = [[165, 205, 200], [140, 150, 140], [75, 80, 68], [35, 85, 150]][f % 4];
    const off = [[20, 70], [35, 95], [55, 110], [25, 85]][f % 4];
    return { main, off };
  }
  if (st === 'walk') {
    const sw = 12 * Math.sin(2 * Math.PI * (ctx.t ?? 0));
    return { main: [8 + sw * 0.5, 30 + sw * 0.5, 180 + sw * 0.6], off: [12 - sw, 80 - sw], reach: X => X(9) };
  }
  const b = (f % 2) ? 1.5 : 0;
  return { main: [8, 30, 180], off: [12 + b, 82 + b], reach: X => X(9) };
}

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, back = ctx.facing === 'w' || ctx.facing === 'n', flip = ctx.facing === 'e' || ctx.facing === 'n';
  const H = Math.round(BODY_M * metre), ground = h - 1;
  const rig = ctx.lib.rigs.body('biped', ctx, { facing: back ? 'nw' : 'sw', ground, height: H,
    proportions: { head: 0.17, neck: 0.05, spine: 0.34, leg_up: 0.22, leg_lo: 0.22, arm_up: 0.18, arm_lo: 0.17 } });
  const P = rig.pose(ctx.state, ctx.t), { front, sx } = rig, S = H / 80; // S: design px per px at the 80 px rig
  const X = v => v * S, Lh = rig.lengths.head;
  // the outward side of each shoulder, found numerically (the rig's side axis sign)
  const out = n => { const a = P.at(`arm${n}_up`, 0), o = P.at(`arm${n === 'R' ? 'L' : 'R'}_up`, 0), p = P.at(`arm${n}_up`, 0, 0, 1, 0);
    return Math.hypot(p[0] - o[0], p[1] - o[1]) > Math.hypot(a[0] - o[0], a[1] - o[1]) ? 1 : -1; };
  const A = armPose(ctx), Lu = rig.lengths.armR_up, Ll = rig.lengths.armR_lo;
  const arm = (n, [tu, tl], spread, reach = 0) => {
    const z = out(n), du = dirv(tu), dl = dirv(tl);
    const elbowO = [Lu * du[0], z * spread, Lu * du[1]], handO = [Lu * du[0] + Ll * dl[0], z * (spread * 1.4 + reach), Lu * du[1] + Ll * dl[1]];
    const at = o => P.at(`arm${n}_up`, 0, o[0], o[1], o[2]);
    return { sh: P.at(`arm${n}_up`, 0), el: at(elbowO), hand: at(handO), handO, z,
      depth: P.depth(`arm${n}_up`) + handO[0] * front };
  };
  const main = arm('R', A.main, X(5), A.reach ? A.reach(X) : 0), off = arm('L', A.off, X(2));
  // the cross-staff: gripped at `grip` of its length from the butt, along its own angle in the sagittal plane
  const SL = X(ctx.state === 'attack' ? 52 : 62), grip = ctx.state === 'attack' ? 0.46 : 0.33, ds = dirv(A.main[2]);
  const sAt = k => P.at('armR_up', 0, main.handO[0] + ds[0] * SL * k, main.handO[1], main.handO[2] + ds[1] * SL * k);
  const staff = { butt: sAt(-grip), head: sAt(1 - grip), cross: sAt(1 - grip - 0.14), crossL: P.at('armR_up', 0, main.handO[0] + ds[0] * SL * (0.86 - grip), main.handO[1] + X(6.5), main.handO[2] + ds[1] * SL * (0.86 - grip)), crossR: P.at('armR_up', 0, main.handO[0] + ds[0] * SL * (0.86 - grip), main.handO[1] - X(6.5), main.handO[2] + ds[1] * SL * (0.86 - grip)) };
  const headC = P.at('head', 0.5, X(1.2)), face = P.at('head', 0.45, Lh * 0.32), showFace = !back;
  return { w, h, X, S, H, rig, P, front, sx, back, flip, ground, Lh, main, off, staff, headC, face, showFace, A };
}

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx);
  const { X, H, P, front, back, ground, Lh, main, off, staff, headC, face, showFace } = L;
  const cloth = pal.cloth, R = Math.round, items = [];
  const put = (depth, ...nodes) => nodes.forEach(node => items.push({ depth, node, seq: items.length }));
  const dS = P.depth('spine'), dH = P.depth('head');
  const neck = P.start('neck'), hip = P.start('spine'), sway = ctx.state === 'walk' ? R(1.5 * Math.sin(2 * Math.PI * (ctx.t ?? 0))) : 0;
  const lean = (neck[0] - hip[0]);

  // feet peep out under the hem (drawn first: the habit covers all but their toes)
  for (const n of P.far(['legL_lo', 'legR_lo'])) {
    const e = P.end(n);
    put(-1e3, { type: 'ellipse', name: 'foot', underlay: true, cx: e[0] + (back ? 1 : -1) * X(1.5), cy: ground - X(1.4), rx: X(3), ry: X(1.6), mat: pal.leather, shade: 'flat', band: 2 });
  }

  // the habit: sloping shoulders, a full chest, a narrow waist, then a bell flaring to a scalloped hem; its front hangs
  // lower than its back and the whole hem swings a pixel with the stride
  const nx = neck[0], ny = neck[1] + X(1), hx = hip[0], hy = hip[1], k = 1 - 0.08 * Math.abs(L.sx);
  const fwdX = P.at('spine', 0, X(3))[0] - hip[0]; // which way "forward" leans on screen
  const hemC = hx + fwdX * 0.8 + sway, hemW = X(19) * k, scal = [0, 3, 1, 4, 0.5, 3.5, 1, 2.5, 0];
  const hem = scal.map((j, i) => { const u = i / (scal.length - 1), x = hemC + hemW * (2 * u - 1), drop = (fwdX < 0 ? 1 - u : u) * X(1.5);
    return [x, ground - X(1) - X(j) + drop - X(1.5)]; });
  const sideL = [[nx - X(3), ny - X(1)], [nx - X(8.5) * k, ny + X(3)], [nx - X(9.5) * k + lean * 0.3, ny + X(9)], [hx - X(5.5) * k, hy - X(4)], [hx - X(8) * k, hy + X(4)], [hemC - X(15) * k, ground - X(14)]];
  const sideR = [[hemC + X(15) * k, ground - X(14)], [hx + X(8) * k, hy + X(4)], [hx + X(5.5) * k, hy - X(4)], [nx + X(9.5) * k + lean * 0.3, ny + X(9)], [nx + X(8.5) * k, ny + X(3)], [nx + X(3), ny - X(1)]];
  put(dS, { type: 'path', name: 'habit', underlay: true, d: smooth([...sideL, ...hem, ...sideR]), mat: cloth, shade: 'flat', band: 1 });

  // the long veil: from the crown, down her back past the shoulders to the knees, flaring, with a ragged end
  const vb = P.at('spine', 0, -X(4)), vy = ground - X(34), vw = X(13) * k;
  const veil = [[headC[0] - X(4.5), headC[1] - Lh * 0.5], [headC[0] + X(4.5), headC[1] - Lh * 0.5], [nx + X(6), ny + X(1)], [nx + X(8.5), ny + X(9)], [vb[0] + vw, vy - X(5)],
    [vb[0] + vw * 0.6, vy + X(1)], [vb[0] + vw * 0.25, vy - X(3)], [vb[0] - vw * 0.15, vy + X(3)], [vb[0] - vw * 0.55, vy - X(2)], [vb[0] - vw * 0.85, vy + X(1)], [vb[0] - vw, vy - X(6)], [nx - X(8.5), ny + X(9)], [nx - X(6), ny + X(1)]];
  put(dS - X(4) * front, { type: 'path', name: 'veil', underlay: true, d: smooth(veil), mat: cloth, shade: 'flat', band: 2 });

  // the spiked halo: an iron ring behind the head with nine spikes standing out of its upper part
  const hc = P.at('head', 0.55, -X(3)), hr = X(10.5), spikes = [];
  for (let i = 0; i < 9; i++) {
    const a = (-90 + (i - 4) * 24) * Math.PI / 180, len = X(i % 2 ? 4 : 6.5), bw = X(1.6);
    const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
    spikes.push({ type: 'poly', pts: [[hc[0] + ca * (hr - X(0.5)) + px * bw, hc[1] + sa * (hr - X(0.5)) + py * bw], [hc[0] + ca * (hr + len), hc[1] + sa * (hr + len)], [hc[0] + ca * (hr - X(0.5)) - px * bw, hc[1] + sa * (hr - X(0.5)) - py * bw]] });
  }
  put(dS - X(6) * front, { type: 'group', name: 'halo', underlay: true, mat: pal.metal, shade: 'flat', band: 1, children: [
    { type: 'ring', cx: hc[0], cy: hc[1], r: hr, w: X(2) }, ...spikes] });

  // the head: veiled, slightly stooped forward on the neck; from the front a pale wimple frames a gaunt skull face and
  // falls as a bib over the chest (the neck); from behind the veil covers it all
  const hood = [[headC[0], headC[1] - Lh * 0.62], [headC[0] + Lh * 0.55, headC[1] - Lh * 0.35], [headC[0] + Lh * 0.6, headC[1] + Lh * 0.2], [headC[0] + Lh * 0.5, headC[1] + Lh * 0.62],
    [headC[0] - Lh * 0.5, headC[1] + Lh * 0.62], [headC[0] - Lh * 0.6, headC[1] + Lh * 0.2], [headC[0] - Lh * 0.55, headC[1] - Lh * 0.35]];
  put(dH + 1, { type: 'path', name: 'hood', underlay: true, d: smooth(hood), mat: cloth, shade: 'flat', band: 2 });
  if (showFace) {
    const fx = face[0], fy = face[1];
    put(dS + X(3) * front, { type: 'path', name: 'collar', underlay: true, mat: pal.stone, shade: 'flat', band: 0,
      d: smooth([[fx - X(3), fy + X(3.5)], [fx + X(3), fy + X(3.5)], [nx + X(8), ny + X(2.5)], [nx + X(6), ny + X(5.5)], [nx, ny + X(6.5)], [nx - X(6), ny + X(5.5)], [nx - X(8), ny + X(2.5)]]) });
    put(dH + 2, { type: 'ellipse', name: 'wimple', underlay: true, cx: fx, cy: fy + X(0.5), rx: Lh * 0.4, ry: Lh * 0.5, mat: pal.stone, shade: 'flat', band: 0 });
    put(dH + 3, { type: 'path', name: 'face', underlay: true, mat: pal.skin, shade: 'flat', band: 0,
      d: smooth([[fx, fy - Lh * 0.38], [fx + Lh * 0.27, fy - Lh * 0.22], [fx + Lh * 0.22, fy + Lh * 0.15], [fx + Lh * 0.08, fy + Lh * 0.36], [fx - Lh * 0.08, fy + Lh * 0.36], [fx - Lh * 0.22, fy + Lh * 0.15], [fx - Lh * 0.27, fy - Lh * 0.22]]) });
    for (const ex of [-1, 1]) put(dH + 4, { type: 'rect', name: 'eye', x: R(fx + ex * Lh * 0.13 - X(1)), y: R(fy - Lh * 0.06), w: R(X(2)), h: R(X(2)), color: 'outline' });
    put(dH + 4, { type: 'rect', name: 'mouth', x: R(fx - X(1)), y: R(fy + Lh * 0.22), w: R(X(2)), h: 1, color: 'outline' });
  }

  // arms: a sleeve bent at the elbow that flares into a bell at the wrist, a bony hand
  const sleeve = (a, name) => [
    { type: 'capsule', name: `${name}-upper`, underlay: true, a: a.sh, b: a.el, r: X(3), r1: X(3.1), mat: cloth, shade: 'flat', band: 1 },
    { type: 'capsule', name: `${name}-sleeve`, underlay: true, a: a.el, b: a.hand, r: X(3.1), r1: X(4.6), mat: cloth, shade: 'flat', band: 1 },
  ];
  const hand = (a, name) => ({ type: 'path', name: `${name}-hand`, underlay: true, mat: pal.skin, shade: 'flat', band: 0,
    d: smooth([[a.hand[0] - X(2), a.hand[1] - X(1.5)], [a.hand[0] + X(2), a.hand[1] - X(1.5)], [a.hand[0] + X(2.2), a.hand[1] + X(2)], [a.hand[0], a.hand[1] + X(3.5)], [a.hand[0] - X(2.2), a.hand[1] + X(2)]]) });
  const dOff = off.depth, dMain = main.depth;
  put(dOff, ...sleeve(off, 'off'), hand(off, 'off'));
  // the cross-staff: a long pole, a cross near its head, a knob finial
  put(dMain - 0.01, { type: 'group', name: 'staff', underlay: true, children: [
    { type: 'capsule', name: 'pole', a: staff.butt, b: staff.head, r: X(1.4), mat: pal.leather, shade: 'flat', band: 1 },
    { type: 'capsule', name: 'cross', a: staff.crossL, b: staff.crossR, r: X(1.7), mat: pal.metal, shade: 'flat', band: 1 },
    { type: 'circle', name: 'finial', cx: staff.head[0], cy: staff.head[1], r: X(2.6), mat: pal.metal, shade: 'flat', band: 1 },
  ] });
  put(dMain, ...sleeve(main, 'main'), hand(main, 'main'));

  items.sort((a, b) => a.depth - b.depth || a.seq - b.seq).forEach(i => s.add(i.node));
  const g = s.render();
  return L.flip ? g.flip('x') : g;
}

// Named points per frame (mirrored with the drawing for e and n): head, the main hand on the staff, the face from the front.
export const anchors = ctx => {
  const L = layout(ctx), fl = ([x, y]) => [L.flip ? L.w - 1 - Math.round(x) : Math.round(x), Math.round(y)];
  const a = { head: fl(L.headC), hand: fl(L.main.hand) };
  if (L.showFace) { const f = L.face, d = L.Lh * 0.13; a.eye = fl([f[0] - d, f[1] - L.Lh * 0.06]); a.eye2 = fl([f[0] + d, f[1] - L.Lh * 0.06]); a.mouth = fl([f[0], f[1] + L.Lh * 0.22]); }
  return a;
};
