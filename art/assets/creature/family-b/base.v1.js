// family-b base.v1 (r1) — cave bats (glyph b, 0.4 m): a cave bat on the creature rig (art/lib/beast.v1.js), flying a
// body-height above the floor (a small shadow under it): a furry round body, big pointed ears, a pug face with tiny
// fangs, and two wide membrane wings that beat through the walk (the flight) and fold forward in the bite. The wings
// and fur are the recoloured ramp (recolour: leather).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-b', pass: 'r1', notes: 'cave bat flying: round body, big ears, membrane wings beating', mirror: false, recolour: 'leather' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth } = k, c = pal.leather, L = k.P.lunge * 4;
    const beat = k.P.walking ? [1, 0.2, -0.8, 0.2][Math.round(k.P.phase * 4) % 4] : (k.state === 'attack' ? [0.6, -0.6, -0.9, 0][k.frame % 4] : [0.6, 0.3][k.frame % 2]);
    const fly = 12 + (k.state === 'idle' ? k.frame % 2 : 0), body = at(L, 0, fly);
    // the wings spread across the screen whatever the heading, so the bat reads as a spread shape from every side
    for (const v of [-1, 1]) {
      const root = [body[0] + v * 1.6, body[1] - 1], mid = [body[0] + v * 5.5, body[1] - 3 - 4 * beat], tip = [body[0] + v * 10, body[1] - 1 - 6 * beat];
      k.add({ type: 'path', name: 'wing', underlay: true, mat: c, shade: 'flat', band: 1, d: k.smooth([root, mid, tip, [body[0] + v * 8, body[1] + 2 - 2 * beat], [body[0] + v * 5, body[1] + 1], [body[0] + v * 3, body[1] + 3]]) }, depth(L) + (k.back ? 1 : 0));
      k.add({ type: 'tube', name: 'wing-bone', mat: c, shade: 'flat', band: 0, pts: [root, mid, tip], w: 0.8 }, depth(L) + (k.back ? 1.01 : 0.01));
    }
    k.add({ type: 'ellipse', name: 'body', underlay: true, mat: c, shade: 'sphere', cx: body[0], cy: body[1], rx: 2.6, ry: 3 }, depth(L) + 0.5);
    const hd = at(L + 1.5, 0, fly + 3);
    k.add({ type: 'circle', name: 'head', underlay: true, mat: c, shade: 'sphere', cx: hd[0], cy: hd[1], r: 2.1 }, depth(L) + 0.6);
    for (const v of [-1, 1]) k.add({ type: 'poly', name: 'ear', underlay: true, mat: c, shade: 'flat', band: 1, pts: [at(L + 1.3, v * 0.6, fly + 4.5), at(L + 1, v * 1.8, fly + 8), at(L + 1.8, v * 2, fly + 4.2)] }, depth(L) + 0.55);
    if (!k.back) {
      for (const v of [-0.8, 0.8]) { const e = at(L + 2.8, v, fly + 3.4); k.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 1, h: 1, color: 'accent.1' }, depth(L) + 0.7); }
    }
  }, { ground: 5, shadow: { rx: 4 } });
}
export const anchors = ctx => groundAnchors(ctx, { head: [1.5, 0, 15], hand: [3, 0, 14] }, { lunge: 4, ground: 5 });
