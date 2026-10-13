// family-w base.v1 (r1) — worms, leeches and crawlers (glyph w, 0.6 m): a great worm on the creature rig
// (art/lib/beast.v1.js): a fat ringed body lying in a curve on the floor and rearing its front up, a round sucker
// mouth ringed with small teeth at the top that opens in the attack. The body is the recoloured ramp (recolour: skin).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-w', pass: 'r1', notes: 'great worm: ringed fat body, front reared, toothed sucker mouth', mirror: false, recolour: 'skin' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth } = k, c = pal.skin, L = k.P.lunge * 4, sway = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) * 1.2 : (k.state === 'idle' ? k.frame * 0.5 : 0);
    const pts = [[-8, 2, 1.8], [-6, -1, 1.8], [-3, -2.5, 2], [0, -1.5, 2.2], [2.5, 0, 3], [4 + L, 0.5 + sway, 6], [5 + L * 1.4, 0.4 + sway, 9.5]];
    pts.forEach(([u, v, ht], i) => {
      const p = at(u, v, ht), r = 1.6 + Math.min(i, 4) * 0.35;
      k.add({ type: 'circle', name: 'ring', underlay: true, mat: c, shade: 'sphere', cx: p[0], cy: p[1], r }, i < 5 ? depth(u, v) : depth(4) + i * 0.1);
    });
    const m = at(5.6 + L * 1.4, 0.4 + sway, 11.5 + k.P.open);
    k.add({ type: 'ellipse', name: 'mouth-rim', underlay: true, mat: c, shade: 'sphere', cx: m[0], cy: m[1], rx: 3, ry: 2 }, depth(4) + 1);
    k.add({ type: 'ellipse', name: 'maw', cx: m[0], cy: m[1], rx: 1.6 + k.P.open * 0.6, ry: 0.8 + k.P.open * 0.6, color: k.back ? 'skin.1' : 'outline' }, depth(4) + 1.1);
    if (!k.back) for (const dx of [-1.6, 0, 1.6]) k.add({ type: 'rect', name: 'tooth', x: Math.round(m[0] + dx), y: Math.round(m[1] - 1), w: 1, h: 1, mat: pal.cloth, shade: 'flat', band: 0 }, depth(4) + 1.2);
  }, { ground: 7 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [5, 0, 10], hand: [6, 0, 11.5] }, { lunge: 5.6, ground: 7 });
