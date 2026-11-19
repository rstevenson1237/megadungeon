// boss-the-gilded-wyrm base.v1 (r1) — SHAPE DRAFT, flat materials, no proc layers. The Gilded Wyrm (family-d-cap, the
// dragons; brute of the dwarven hold, 5.1 m = 82 px): a WINGLESS old wyrm on the shared large-quadruped rig
// (`ctx.lib.rigs.body`). What sets it apart from the winged family drake in silhouette alone: a high arched back crusted
// with a double row of big round hoard-plates (a scalloped dome, not spines), a crown of five swept-back horns fanned
// round the skull, a heavy brute's head on a thick S-curved neck, a long tail held low and hooked up in a curl at its end,
// and short sprawled lizard legs (the family's) with bent knees and clawed feet. The body is a tapered chain of round
// masses (haunch, belly, deep chest), never a box. The facings are turned three-quarter (s heads down-left, e down-right,
// n up-right, w up-left). The attack is the rig's neck strike: the head arcs down and forward with the jaw open, held on
// the contact frame. Role ramps only (R11).
export const meta = { brief: 'boss-the-gilded-wyrm', pass: 'r1', notes: 'shape draft: wingless hoard-wyrm, scalloped plate dome on an arched back, five-horn crown, thick S neck, tail hooked up in a curl, sprawled clawed legs, three-quarter facings' };

export const params = {
  hide: { type: 'swap', options: ['accent', 'leather', 'grass', 'hair'], default: 'accent' },
  plate: { type: 'swap', options: ['skin', 'metal', 'stone'], default: 'skin' },
  neck: { type: 'range', min: 0.8, max: 1.2, default: 1 },
};

// rig height in frame units (U = 1.5 px on the 96 x 128 frame)
const RIG_H = 44;
// the iso view's three-quarter facings: the rig's yaw for each map direction
const TURN = { s: 'sw', e: 'se', n: 'ne', w: 'nw' };

function layout(ctx) {
  const [w, h] = ctx.size, U = v => (v * Math.min(w, h)) / 64, ground = Math.round(h * 0.96);
  const rig = ctx.lib.rigs.body('large', ctx, { facing: TURN[ctx.facing] ?? ctx.facing, height: U(RIG_H), ground,
    proportions: { spine: 0.64, tail: 0.5, leg_up: 0.1, leg_lo: 0.1, barrel: 0.42, head: 0.3, neck: 0.62 * (ctx.params?.neck ?? 1) } });
  const { sx, front, side } = rig, P = rig.pose(ctx.state, ctx.t), sk = rig.skeleton(ctx.state, ctx.t);
  const [sa, sb] = sk.spine, spineY = (sa[1] + sb[1]) / 2, spineL = Math.abs(sb[0] - sa[0]);
  // a point in the body's own frame: f ahead of the spine's middle, s to the side, at height hgt above the ground
  const B = (f, s = 0, hgt = spineY) => P.at('spine', 0.5, f, s, hgt - spineY);
  const D = (f, s = 0) => P.depth('spine') + f * front + s * sx;
  // the neck and head are laid out in the body frame (the same S and head height in every facing) and follow how far the
  // rig's neck end has moved from its idle rest (the idle sway, the walk's bob, the strike's arc down and forward)
  const rest = rig.pose('idle', 0), e0 = rest.end('neck'), e1 = P.end('neck'), dv = [e1[0] - e0[0], e1[1] - e0[1]];
  const N = (f, s, hgt, k = 1) => { const q = B(f, s, hgt); return [q[0] + dv[0] * k * 0.75, q[1] + dv[1] * k * 0.75]; };
  const hf = spineL / 2 + U(10), hh = spineY + U(24) * (ctx.params?.neck ?? 1);
  const headR = U(7.6), skull = N(hf, 0, hh), near = front > 0, eyeSide = sx > 0 ? -1 : 1;
  const eye = near ? N(hf + U(3.6), eyeSide * U(3.5), hh + U(2)).map(Math.round) : null;
  const mouth = N(hf + U(9), 0, hh - U(2.5)).map(Math.round);
  return { w, h, U, rig, P, sk, sx, front, side, ground, spineY, spineL, B, D, N, hf, hh, headR, skull, eye, mouth, near };
}

export function render(ctx) {
  const { pal } = ctx.dir, prm = ctx.params, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), hide = pal[prm.hide], plate = pal[prm.plate];
  const { U, P, sk, sx, front, B, D, N, hf, hh, spineL, spineY, headR, skull } = L;
  const pieces = [], put = (z, g) => pieces.push({ z, g });
  const atk = ctx.state === 'attack', fr = ctx.frame ?? 0, open = atk ? [0.3, 0.7, 1, 0.3][fr % 4] : 0;

  // legs: short and sprawled — the knee pushed out to the side and up, the foot set out wide, three claws ahead
  const fwd = (() => { const a = B(0), b = B(U(2)); return [(b[0] - a[0]) / 2, (b[1] - a[1]) / 2]; })();
  for (const e of ['FL', 'FR', 'BL', 'BR']) {
    const up = `leg${e}_up`, lo = `leg${e}_lo`, k = Math.sign(sk[up][0][2]) || (e.endsWith('L') ? -1 : 1);
    const hip = P.start(up), knee = P.at(up, 1, 0, k * U(3.5), U(2.5)), foot = P.at(lo, 1, U(0.5), k * U(4.5), 0), z = P.depth(lo) + k * sx * U(5);
    const claws = [-1, 0, 1].map(j => { const c = P.at(lo, 1, U(3.6), k * U(4.5) + j * U(1.6), 0); return { type: 'rect', name: 'claw', x: Math.round(c[0]), y: Math.round(c[1]) - 1, w: 1, h: 2, color: 'hair.0' }; });
    put(z, { type: 'group', name: 'leg', underlay: true, children: [
      { type: 'capsule', name: 'leg', a: hip, b: knee, r: U(5), r1: U(3.8), mat: hide, shade: 'cyl' },
      { type: 'capsule', name: 'leg', a: knee, b: foot, r: U(3.4), r1: U(2.7), mat: hide, shade: 'cyl' },
      { type: 'ellipse', name: 'foot', cx: foot[0] + fwd[0] * 1.5, cy: foot[1] - U(1), rx: U(3.4), ry: U(1.8), mat: hide, shade: 'flat', band: 1 },
    ] });
    for (const c of claws) put(z + 0.01, c);
  }

  // the tail: out behind the haunch, low, then hooked up in a curl at its end (off the ground, so it stays in the frame)
  const hind = -spineL / 2, tl = [
    [hind + U(3), 0, spineY + U(2), U(6.5)], [hind - U(7), U(1), spineY - U(3), U(5.4)], [hind - U(14), U(2), U(8), U(4.4)],
    [hind - U(20), U(3), U(13), U(3.6)], [hind - U(21.5), U(3), U(19), U(2.8)], [hind - U(18.5), U(3), U(24), U(2)], [hind - U(14.5), U(2.5), U(23), U(1.5)],
  ];
  for (const p of tl) p[0] = hind + (p[0] - hind) * 0.8;
  for (let i = 0; i < tl.length - 1; i++) {
    const [f0, s0, h0, r0] = tl[i], [f1, s1, h1, r1] = tl[i + 1];
    put(D((f0 + f1) / 2, (s0 + s1) / 2) - 0.2, { type: 'group', name: 'tail', underlay: true, children: [
      { type: 'capsule', name: 'tail', a: B(f0, s0, h0), b: B(f1, s1, h1), r: r0, r1, mat: hide, shade: 'cyl' }] });
  }

  // the back's hoard-crust: a double row of big round plates, tallest over the middle, standing above the spine; drawn
  // behind the body so only their rounded tops break the outline (a scalloped dome)
  const plates = [];
  for (let i = 0; i < 6; i++) {
    const u = -0.4 + i * 0.16, f = u * spineL, ht = U(5) + U(5.5) * Math.cos(u * Math.PI * 1.1), row = (i % 2 ? 1 : -1) * U(2);
    const c = B(f, row, spineY + U(7.5) + ht * 0.5);
    plates.push({ z: D(f, row), n: { type: 'ellipse', name: 'plate', cx: c[0], cy: c[1], rx: U(4.2), ry: ht * 0.55 + U(2), mat: plate, shade: 'flat', band: 1 } });
  }
  plates.sort((a, b) => a.z - b.z);
  const back = front < 0;
  put(D(0) + (back ? 0.3 : -0.3), { type: 'group', name: 'plates', underlay: true, children: plates.map(p => p.n) });

  // the body: a tapered chain of round masses — haunch, belly, deep chest — under one outline, the belly below
  const haunch = B(-spineL * 0.32, 0, spineY + U(1)), mid = B(0, 0, spineY + U(0.5)), chest = B(spineL * 0.3, 0, spineY + U(1.5)), belly = B(U(1), 0, spineY - U(4.5));
  put(D(0), { type: 'group', name: 'body', underlay: true, children: [
    { type: 'ellipse', name: 'torso', cx: haunch[0], cy: haunch[1], rx: U(10), ry: U(9), mat: hide, shade: 'sphere' },
    { type: 'ellipse', name: 'torso', cx: chest[0], cy: chest[1], rx: U(10.5), ry: U(9.8), mat: hide, shade: 'sphere' },
    { type: 'ellipse', name: 'torso', cx: mid[0], cy: mid[1], rx: U(12), ry: U(10), mat: hide, shade: 'normal' },
    { type: 'ellipse', name: 'belly', cx: belly[0], cy: belly[1], rx: U(8.5), ry: U(3.8), mat: pal.skin, shade: 'flat', band: 1 },
  ] });

  // the neck: thick, rising in an S from the chest to the head; the head heavy and blunt with a long jaw
  const n0 = B(spineL * 0.36, 0, spineY + U(2)), nm = N(spineL * 0.5 + U(2), 0, hh - U(2), 0.5), n1 = N(hf - U(2), 0, hh, 0.9);
  const snout = N(hf + U(10), 0, hh - U(1.5)), jawRoot = N(hf + U(1), 0, hh - U(4)), jawTip = N(hf + U(9.5) - open * U(1.5), 0, hh - U(4.5) - open * U(7));
  // the crown: five horns fanned round the back of the skull, swept back and up, the middle ones tallest
  const horns = [-2, -1, 0, 1, 2].flatMap(j => {
    const tall = 1 - Math.abs(j) * 0.16, a = j * 0.62, sj = Math.sin(a) * U(4.5), hb = hh + U(3.5);
    const tip = N(hf - U(6) * tall, Math.sin(a) * U(10), hh + U(6) + U(9) * tall);
    // two crossed wedges, so the horn keeps its width in every facing
    return [[N(hf - U(1.5), sj - U(2), hb), N(hf - U(1.5), sj + U(2), hb)], [N(hf + U(0.5), sj, hb), N(hf - U(3.5), sj, hb)]]
      .map(([b0, b1]) => ({ type: 'poly', name: 'horn', pts: [b0, tip, b1], mat: plate, shade: 'flat', band: 0 }));
  });
  const hz = D(hf, 0);
  put(hz - 0.01, { type: 'group', name: 'neck', underlay: true, children: [
    { type: 'capsule', name: 'neck', a: n0, b: nm, r: U(6.5), r1: U(5.4), mat: hide, shade: 'cyl' },
    { type: 'capsule', name: 'neck', a: nm, b: n1, r: U(5.4), r1: U(4.6), mat: hide, shade: 'cyl' }] });
  if (open > 0.5) put(hz + (back ? 0.04 : 0.015), { type: 'group', name: 'jaw', underlay: true, children: [
    { type: 'capsule', name: 'jaw', a: jawRoot, b: jawTip, r: U(2.8), r1: U(1.8), mat: hide, shade: 'flat', band: 2 }] });
  put(hz + (back ? 0.05 : 0.02), { type: 'group', name: 'crown', underlay: true, children: horns });
  put(hz + 0.03, { type: 'group', name: 'head', underlay: true, children: [
    { type: 'ellipse', name: 'skull', cx: skull[0], cy: skull[1], rx: headR, ry: headR * 0.82, mat: hide, shade: 'sphere' },
    { type: 'capsule', name: 'snout', a: skull, b: snout, r: U(4.6), r1: U(3.4), mat: hide, shade: 'cyl' },
    ...(open > 0.5 ? [] : [{ type: 'capsule', name: 'jaw', a: jawRoot, b: jawTip, r: U(3), r1: U(2), mat: hide, shade: 'flat', band: 1 }]),
  ] });

  for (const p of pieces.sort((a, b) => a.z - b.z)) s.add(p.g);
  if (L.eye) s.add({ type: 'rect', name: 'eye', x: L.eye[0], y: L.eye[1], w: 2, h: 1, color: 'outline' });
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}

export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: L.skull.map(Math.round) };
  delete a.tail;
  a.hand = L.mouth ?? a.head;
  if (L.eye) a.eye = L.eye;
  if (L.mouth) a.mouth = L.mouth;
  return a;
};
