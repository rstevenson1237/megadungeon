// family-y-cap base.v2 (r2, from base.v1) — ONE change: the forearms bend up at the elbow, the paws raised above the
// shoulders (v1 held them out level in a T-pose), and each claw is 3 curved 1 px hooks in the light bone token
// (hair.0) instead of v1's pale blue blocks that read as axes.
// v1: bears (glyph Y, 1.6 m): a cave bear on the creature rig (art/lib/beast.v1.js),
// reared on its hind legs to 1.6 m: a massive rounded body, a shoulder hump, a broad head with small round ears and a
// short muzzle, heavy forearms raised with long claws, and a roar (jaw open) in the attack. The fur is the
// recoloured ramp (recolour: leather).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-y-cap', pass: 'r2', notes: 'forearms bent up at the elbow above the shoulders, claws as 3 curved 1px light hooks', mirror: false, recolour: 'leather' };
export function render(ctx) {
  return creature(ctx, k => {
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
    for (const dx of [-3.2, 3.2]) k.add({ type: 'circle', name: 'ear', underlay: true, mat: c, shade: 'sphere', cx: hd[0] + dx, cy: hd[1] - 3.6, r: 1.4 }, depth(0) + 0.55);
    if (!k.back) {
      k.add({ type: 'ellipse', name: 'muzzle', underlay: true, mat: pal.skin, shade: 'sphere', cx: hd[0] - 1.5, cy: hd[1] + 1.6, rx: 2.4, ry: 1.8 }, depth(0) + 0.7);
      k.add({ type: 'rect', name: 'nose', x: Math.round(hd[0] - 2.5), y: Math.round(hd[1] + 0.6), w: 2, h: 1, color: 'outline' }, depth(0) + 0.8);
      if (k.P.open > 0.5) k.add({ type: 'ellipse', name: 'maw', cx: hd[0] - 1.5, cy: hd[1] + 3, rx: 1.4, ry: 1, color: 'outline' }, depth(0) + 0.8);
      for (const dx of [-2.6, 0.4]) k.add({ type: 'rect', name: 'eye', x: Math.round(hd[0] + dx), y: Math.round(hd[1] - 1.4), w: 1, h: 1, color: 'outline' }, depth(0) + 0.8);
    }
    for (const sd of [-1, 1]) {
      const up = k.state === 'attack' ? [4, 2, -3, 1][k.frame % 4] : 0, lift = sd < 0 ? 1 : 0.7, d0 = depth(0) + (k.back ? 0.1 : 0.9);
      const sh = [body[0] + sd * 6, body[1] - 5], elbow = [body[0] + sd * 10.5 - L * 0.5, body[1] - 5 - up * 0.3 * lift], hand = [body[0] + sd * 7 - L, body[1] - 13 - up * lift];
      k.add({ type: 'capsule', name: 'upper-arm', underlay: true, mat: c, shade: 'cyl', a: sh, b: elbow, r: 2.4, r1: 2 }, d0);
      k.add({ type: 'capsule', name: 'forearm', underlay: true, mat: c, shade: 'cyl', a: elbow, b: hand, r: 1.9, r1: 1.5 }, d0 + 0.005);
      // three curved hooks rising from the paw and bending outward
      for (const d of [-1, 0, 1]) {
        const bx = Math.round(hand[0] + d * 2), by = Math.round(hand[1] - 1 + Math.abs(d));
        for (const [dx, dy] of [[0, -1], [0, -2], [sd, -3]]) k.add({ type: 'rect', name: 'claw', x: bx + dx, y: by + dy, w: 1, h: 1, color: 'hair.0' }, d0 + 0.01);
      }
    }
  }, { ground: 5 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [2, 0, 21], hand: [0, -9, 26] }, { lunge: 4, ground: 5 });
