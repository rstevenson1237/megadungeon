// family-i-cap base.v1 (r1) — insect swarms (glyph I, a cloud about 1.2 m high): a swarm of giant wasps on the
// creature rig (art/lib/beast.v1.js): a loose drifting cloud of a dozen striped wasps with clear wings, the biggest
// in front, shifting each frame; the cloud surges forward in the attack. The bodies are the recoloured ramp
// (recolour: accent).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-i-cap', pass: 'r1', notes: 'wasp swarm: a dozen striped wasps in a drifting cloud', mirror: false, recolour: 'accent' };
const WASPS = [[0, 0, 10, 1.4], [-4, 3, 14, 1], [3, -3, 15, 1], [-2, -4, 7, 1], [5, 3, 8, 1.1], [-6, -1, 11, 0.9], [1, 5, 17, 0.9], [-1, 2, 4, 0.9], [6, 0, 13, 0.9], [-5, 5, 6, 0.8], [2, -6, 12, 0.8], [-3, -2, 18, 0.8]];
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth } = k, c = pal.accent, f = k.frame, L = k.P.lunge * 8;
    WASPS.forEach(([u, v, ht, s], i) => {
      const jit = [Math.sin(f * 1.7 + i * 2.1) * 1.2, Math.cos(f * 2.3 + i * 1.3) * 1.2, Math.sin(f * 1.1 + i) * 1.5];
      const p = at(u + L * (1 - ht / 30) + jit[0], v + jit[1], ht + jit[2]), d = depth(u, v);
      const up = (f + i) % 2 === 0;
      k.add({ type: 'ellipse', name: 'wing', mat: pal.cloth, shade: 'flat', band: 0, cx: p[0] + 0.5, cy: p[1] - (up ? 2 : 1.2) * s, rx: 1.8 * s, ry: (up ? 1.2 : 0.7) * s }, d);
      k.add({ type: 'ellipse', name: 'abdomen', underlay: true, mat: c, shade: 'flat', band: 1, cx: p[0] + 1.6 * s, cy: p[1] + 0.4 * s, rx: 1.8 * s, ry: 1.1 * s }, d + 0.01);
      k.add({ type: 'rect', name: 'stripe', x: Math.round(p[0] + 1.6 * s), y: Math.round(p[1] - 0.2), w: 1, h: Math.max(1, Math.round(1.6 * s)), color: 'outline' }, d + 0.02);
      k.add({ type: 'circle', name: 'head', mat: c, shade: 'flat', band: 0, cx: p[0] - 1.2 * s, cy: p[1], r: 0.9 * s }, d + 0.03);
    });
  }, { ground: 6, shadow: { rx: 7 } });
}
export const anchors = ctx => groundAnchors(ctx, { head: [0, 0, 12], hand: [3, 0, 10] }, { lunge: 8 });
