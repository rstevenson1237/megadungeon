// family-y-cap base.v4 (x1, from base.v3) — ONE change (the blind reviewer's): idle and walk go down on all fours, a
// low wide bear with a heavy shoulder hump (~1.0 m at the shoulder), the head carried low and forward with a pale
// snout and round ears, four thick legs that step in the walk; the hump's top is lit with the ramp's top step so the
// back views (n/w) hold a shape instead of a dark blob. No claw dots on the belly. The attack keeps v3's upright
// rearing pose unchanged.
// family-y-cap base.v3 (r3, from base.v1, the best so far) — ONE change (the bear's front read): the forearms hang at
// chest height in idle and walk, claws down (raised only in the attack), so the head is no longer lost between them,
// and the head gets a pale muzzle protruding 3 px past its outline and two clear round ears.
// base.v1 (r1) — bears (glyph Y, 1.6 m): a cave bear on the creature rig (art/lib/beast.v1.js),
// reared on its hind legs to 1.6 m: a massive rounded body, a shoulder hump, a broad head with small round ears and a
// short muzzle, heavy forearms raised with long claws, and a roar (jaw open) in the attack. The fur is the
// recoloured ramp (recolour: leather).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-y-cap', pass: 'x1', notes: 'idle/walk on all fours with a lit shoulder hump, head low and forward; attack keeps the upright rear; forearms at chest height outside the attack, protruding pale muzzle, round ears; cave bear reared up: massive body, hump, raised clawed forearms', mirror: false, recolour: 'leather' };
// idle and walk: on all fours, a low wide body with a shoulder hump and the head carried forward
function onAllFours(k) {
  const { pal, at, depth, step } = k, c = pal.leather, breath = k.state === 'idle' ? k.frame * 0.5 : 0;
  // four thick legs, front pair under the hump, hind pair under the rump; diagonal pairs step together
  for (const [u, v, ph, r] of [[-5, -2.6, 0, 2.3], [-5, 2.6, 0.5, 2.3], [3.6, -2.4, 0.5, 2.4], [3.6, 2.4, 0, 2.4]]) {
    const s = step(ph, 1.6, 1.2), hip = at(u, v, 6), foot = at(u + s.du, v, s.dh + 1);
    k.add({ type: 'capsule', name: 'leg', underlay: true, mat: c, shade: 'cyl', a: hip, b: foot, r, r1: r * 0.8 }, depth(u, v) - 100);
    k.add({ type: 'ellipse', name: 'paw', underlay: true, mat: c, shade: 'sphere', cx: foot[0] + k.F[0] * 0.8, cy: foot[1] + 0.4, rx: 2.2, ry: 1.2 }, depth(u, v) - 99.9);
  }
  const rump = at(-5, 0, 9 - breath * 0.5), chest = at(2, 0, 9.5 - breath * 0.5), hump = at(0.8, 0, 13.5 - breath);
  k.add({ type: 'ellipse', name: 'rump', underlay: true, mat: c, shade: 'sphere', cx: rump[0], cy: rump[1], rx: 6, ry: 5 }, depth(-5));
  k.add({ type: 'ellipse', name: 'body', mat: c, shade: 'sphere', cx: (rump[0] + chest[0]) / 2, cy: (rump[1] + chest[1]) / 2 + 0.5, rx: 8, ry: 5.2 }, depth(-1));
  k.add({ type: 'ellipse', name: 'chest', mat: c, shade: 'sphere', cx: chest[0], cy: chest[1], rx: 6, ry: 5.6 }, depth(2));
  // the shoulder hump, its top lit with the ramp's top step so every facing holds a shape
  k.add({ type: 'ellipse', name: 'hump', mat: c, shade: 'sphere', cx: hump[0], cy: hump[1], rx: 4.6, ry: 3.6 }, depth(2) + 0.01);
  k.add({ type: 'ellipse', name: 'hump-light', cx: hump[0] - 0.8, cy: hump[1] - 2, rx: 2.4, ry: 1, color: 'leather.0' }, depth(2) + 0.02);
  k.add({ type: 'ellipse', name: 'back-light', cx: rump[0] - 0.5, cy: rump[1] - 3.6, rx: 3, ry: 0.8, color: 'leather.0' }, depth(-5) + 0.01);
  // the head, low and forward of the hump
  const hd = at(8, 0, 9 - breath), sn = at(10.6, 0, 7.6 - breath);
  const hdDepth = k.back ? depth(-6) : depth(8);
  for (const dv of [-2.2, 2.2]) { const e = at(7.4, dv, 12.4 - breath); k.add({ type: 'circle', name: 'ear', underlay: true, mat: c, shade: 'sphere', cx: e[0], cy: e[1], r: 1.6 }, hdDepth - 0.01); }
  k.add({ type: 'circle', name: 'head', underlay: true, mat: c, shade: 'sphere', cx: hd[0], cy: hd[1], r: 3.8 }, hdDepth);
  if (!k.back) {
    k.add({ type: 'ellipse', name: 'muzzle', underlay: true, mat: pal.skin, shade: 'flat', band: 0, cx: sn[0], cy: sn[1], rx: 2.4, ry: 1.7 }, hdDepth + 0.01);
    k.add({ type: 'rect', name: 'nose', x: Math.round(sn[0] - 2.4), y: Math.round(sn[1] - 1), w: 2, h: 1, color: 'outline' }, hdDepth + 0.02);
    for (const dv of [-1.4, 1.4]) { const e = at(8.6, dv, 10.2 - breath); k.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 1, h: 1, color: 'outline' }, hdDepth + 0.02); }
  }
}
export function render(ctx) {
  return creature(ctx, k => {
    if (k.state !== 'attack') return onAllFours(k);
    const { pal, at, depth, step } = k, c = pal.leather, L = k.P.lunge * 4, sway = k.state === 'idle' ? k.frame : 0;
    for (const [v, ph] of [[-3, 0], [3, 0.5]]) {
      const s = step(ph, 1.5, 1);
      k.add({ type: 'ellipse', name: 'hind-leg', underlay: true, mat: c, shade: 'sphere', cx: at(-1 + s.du * 0.5, v, 3 + s.dh)[0], cy: at(-1, v, 3 + s.dh)[1], rx: 3, ry: 4 }, depth(0, v));
      k.add({ type: 'ellipse', name: 'paw', underlay: true, mat: c, shade: 'sphere', cx: at(1 + s.du, v, s.dh)[0], cy: at(1 + s.du, v, s.dh)[1], rx: 2.4, ry: 1.3 }, depth(1, v) + 0.1);
    }
    const body = at(L * 0.5, 0, 12 - sway * 0.5);
    k.add({ type: 'ellipse', name: 'body', underlay: true, mat: c, shade: 'sphere', cx: body[0], cy: body[1], rx: 7.5, ry: 9 }, depth(0) + 0.2);
    k.add({ type: 'ellipse', name: 'hump', underlay: true, mat: c, shade: 'sphere', cx: body[0] + (k.back ? 0 : 1), cy: body[1] - 6, rx: 6, ry: 4 }, depth(0) + (k.back ? 0.5 : 0.15));
    const hd = at(2 + L, 0, 21 - sway * 0.5);
    k.add({ type: 'circle', name: 'head', underlay: true, mat: c, shade: 'sphere', cx: hd[0], cy: hd[1], r: 4 }, depth(0) + 0.6);
    for (const dx of [-3.4, 3.4]) k.add({ type: 'circle', name: 'ear', underlay: true, mat: c, shade: 'sphere', cx: hd[0] + dx, cy: hd[1] - 3.4, r: 1.7 }, depth(0) + 0.55);
    if (!k.back) {
      // a pale muzzle that sticks out 3 px past the head's outline, toward the heading
      k.add({ type: 'ellipse', name: 'muzzle', underlay: true, mat: pal.skin, shade: 'flat', band: 0, cx: hd[0] - 4.5, cy: hd[1] + 1.4, rx: 2.6, ry: 1.8 }, depth(0) + 0.7);
      k.add({ type: 'rect', name: 'nose', x: Math.round(hd[0] - 7), y: Math.round(hd[1] + 0.4), w: 2, h: 1, color: 'outline' }, depth(0) + 0.8);
      if (k.P.open > 0.5) k.add({ type: 'ellipse', name: 'maw', cx: hd[0] - 4.5, cy: hd[1] + 2.8, rx: 1.6, ry: 1, color: 'outline' }, depth(0) + 0.8);
      for (const dx of [-2.6, 0.4]) k.add({ type: 'rect', name: 'eye', x: Math.round(hd[0] + dx), y: Math.round(hd[1] - 1.4), w: 1, h: 1, color: 'outline' }, depth(0) + 0.8);
    }
    for (const sd of [-1, 1]) {
      const sh = [body[0] + sd * 6, body[1] - 5], raised = k.state === 'attack';
      // idle and walk: the forearms hang in front of the chest, claws down; only the attack raises them
      const swing = k.P.walking ? Math.sin((k.P.phase + (sd < 0 ? 0 : 0.5)) * Math.PI * 2) : 0;
      const up = raised ? [6, 3, -2, 2][k.frame % 4] : 0, hand = raised ? [body[0] + sd * 9 - L, body[1] - 5 - up * (sd < 0 ? 1 : 0.6)] : [body[0] + sd * 4.2 + swing * 0.8, body[1] - 1 + (k.state === 'idle' ? k.frame * 0.5 : 0)];
      k.add({ type: 'capsule', name: 'forearm', underlay: true, mat: c, shade: 'cyl', a: sh, b: hand, r: 2.4, r1: 2 }, depth(0) + (k.back ? 0.1 : 0.5));
      for (const d of [-1, 0, 1]) k.add({ type: 'capsule', name: 'claw', a: raised ? [hand[0] + sd * 1.2, hand[1] + d] : [hand[0] + d, hand[1] + 1.2], b: raised ? [hand[0] + sd * 3.2, hand[1] + d * 1.4 - 1] : [hand[0] + d * 1.3, hand[1] + 3.2], r: 0.45, mat: pal.cloth, shade: 'flat', band: 0 }, depth(0) + (k.back ? 0.11 : 0.51));
    }
  }, { ground: 5 });
}
export const anchors = ctx => groundAnchors(ctx, ctx.state === 'attack' ? { head: [2, 0, 21], hand: [0, -9, 19] } : { head: [8, 0, 11], hand: [11, 0, 7] }, { lunge: 4, ground: 5 });
