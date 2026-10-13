// family-w base.v2 (r2, from base.v1) — ONE change: the reared front is drawn by its rise on screen, so s/e show the
// same tall reared column as n/w (v1's front view folded it into a squat coil, its back view overshot 0.6 m); the
// column now tops out ~10 px above the floor in every facing, and the mouth's rim carries a ring of light tooth pixels.
// v1: worms, leeches and crawlers (glyph w, 0.6 m): a great worm on the creature rig (art/lib/beast.v1.js): a fat
// ringed body lying in a curve on the floor and rearing its front up, a round sucker mouth ringed with small teeth at
// the top that opens in the attack. The body is the recoloured ramp (recolour: skin).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-w', pass: 'r2', notes: 'reared front by screen rise (same in every facing, ~10 px), ring of teeth on the mouth', mirror: false, recolour: 'skin' };
// the height above the ground that puts a point at screen rise `rise` whichever way the heading turns
const htFor = (k, u, rise) => rise + k.F[1] * u;
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth } = k, c = pal.skin, L = k.P.lunge * 4, sway = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) * 1.2 : (k.state === 'idle' ? k.frame * 0.5 : 0);
    const rear = k.P.open * 1.5; // the attack rears the column higher
    // floor coil [u, v, ht], then the reared column [u, v, rise on screen]
    const floor = [[-8, 2, 1.8], [-6, -1, 1.8], [-3, -2.5, 2], [0, -1.5, 2.2]];
    const column = [[2, 0, 3], [3 + L * 0.6, 0.3 + sway * 0.5, 5.5 + rear * 0.5], [3.6 + L, 0.4 + sway, 8 + rear]];
    floor.forEach(([u, v, ht], i) => {
      const p = at(u, v, ht), r = 1.6 + i * 0.35;
      k.add({ type: 'circle', name: 'ring', underlay: true, mat: c, shade: 'sphere', cx: p[0], cy: p[1], r }, depth(u, v));
    });
    column.forEach(([u, v, rise], i) => {
      const p = at(u, v, htFor(k, u, rise)), r = 2.9 - i * 0.2;
      k.add({ type: 'circle', name: 'ring', underlay: true, mat: c, shade: 'sphere', cx: p[0], cy: p[1], r }, depth(4) + i * 0.1);
    });
    const mu = 4 + L * 1.2, m = at(mu, 0.4 + sway, htFor(k, mu, 9.5 + rear + k.P.open));
    k.add({ type: 'ellipse', name: 'mouth-rim', underlay: true, mat: c, shade: 'sphere', cx: m[0], cy: m[1], rx: 3, ry: 2 }, depth(4) + 1);
    k.add({ type: 'ellipse', name: 'maw', cx: m[0], cy: m[1], rx: 1.6 + k.P.open * 0.6, ry: 0.8 + k.P.open * 0.6, color: k.back ? 'skin.1' : 'outline' }, depth(4) + 1.1);
    if (!k.back) {
      // a ring of light tooth pixels round the maw
      const rx = 2.2 + k.P.open * 0.6, ry = 1.3 + k.P.open * 0.6;
      for (const a of [0, 60, 120, 180, 240, 300]) {
        const t = (a * Math.PI) / 180;
        k.add({ type: 'rect', name: 'tooth', x: Math.round(m[0] + Math.cos(t) * rx - 0.5), y: Math.round(m[1] + Math.sin(t) * ry - 0.5), w: 1, h: 1, mat: pal.cloth, shade: 'flat', band: 0 }, depth(4) + 1.2);
      }
    }
  }, { ground: 7 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [4, 0, ctx.facing === 'n' || ctx.facing === 'w' ? 8 : 11.5], hand: [4, 0, ctx.facing === 'n' || ctx.facing === 'w' ? 9.5 : 13] }, { lunge: 4.8, ground: 7 });
