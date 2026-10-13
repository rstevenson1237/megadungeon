// family-i-cap base.v2 (r2, from base.v1): seven larger wasps instead of a dozen specks, each a sphere-shaded head,
// thorax and striped abdomen with wings lit top-left (band 0), hovering 5 px and more above a detached shadow.
// family-i-cap base.v1 (r1) — insect swarms (glyph I, a cloud about 1.2 m high): a swarm of giant wasps on the
// creature rig (art/lib/beast.v1.js): a loose drifting cloud of a dozen striped wasps with clear wings, the biggest
// in front, shifting each frame; the cloud surges forward in the attack. The bodies are the recoloured ramp
// (recolour: accent).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-i-cap', pass: 'r2', notes: 'wasp swarm: seven large striped wasps hovering in a drifting cloud', mirror: false, recolour: 'accent' };
// [ahead, right, height above the ground, size]: the nearest and biggest low in front, all hovering 5 px or more up
const WASPS = [[1, -1, 10, 1.3], [-6, 4, 16, 1.1], [5, 5, 17, 1.1], [-3, -6, 21, 1], [7, -4, 12, 1], [-8, -2, 11, 1], [2, 2, 24, 0.95]];
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth } = k, c = pal.accent, f = k.frame, L = k.P.lunge * 8;
    WASPS.forEach(([u, v, ht, s], i) => {
      const jit = [Math.sin(f * 1.7 + i * 2.1) * 1.2, Math.cos(f * 2.3 + i * 1.3) * 1.2, Math.sin(f * 1.1 + i) * 1.2];
      const p = at(u + L * (1 - ht / 40) + jit[0], v + jit[1], ht + jit[2]), d = depth(u, v);
      const up = (f + i) % 2 === 0, [x, y] = p;
      // the far wing behind the body, the near wing over it (both lit, the light from the top left)
      k.add({ type: 'ellipse', name: 'wing', mat: pal.cloth, shade: 'flat', band: 1, cx: x + 2 * s, cy: y - (up ? 2.4 : 1.7) * s, rx: 1.6 * s, ry: (up ? 1.1 : 0.7) * s }, d);
      k.add({ type: 'ellipse', name: 'abdomen', underlay: true, mat: c, shade: 'sphere', cx: x + 2.6 * s, cy: y + 0.8 * s, rx: 2.4 * s, ry: 1.6 * s }, d + 0.01);
      for (const sx of [1.9, 3.4]) k.add({ type: 'rect', name: 'stripe', x: Math.round(x + sx * s), y: Math.round(y + 0.2 * s), w: 1, h: Math.max(2, Math.round(1.8 * s)), color: 'outline' }, d + 0.015);
      k.add({ type: 'ellipse', name: 'thorax', underlay: true, mat: c, shade: 'sphere', cx: x, cy: y, rx: 1.6 * s, ry: 1.4 * s }, d + 0.02);
      k.add({ type: 'circle', name: 'head', underlay: true, mat: c, shade: 'sphere', cx: x - 2 * s, cy: y + 0.2 * s, r: 1.2 * s }, d + 0.03);
      k.add({ type: 'ellipse', name: 'wing', mat: pal.cloth, shade: 'flat', band: 0, cx: x + 1 * s, cy: y - (up ? 2.2 : 1.5) * s, rx: 1.5 * s, ry: (up ? 1 : 0.7) * s }, d + 0.04);
    });
  }, { ground: 6, shadow: { rx: 9 } });
}
export const anchors = ctx => groundAnchors(ctx, { head: [0, 0, 12], hand: [3, 0, 10] }, { lunge: 8 });
