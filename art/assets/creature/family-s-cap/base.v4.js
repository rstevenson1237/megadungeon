// family-s-cap base.v4 (x1, from base.v2): the blind re-score's point - the coil base is three smooth stacked loops
// (flattened tube rings, cylinder-shaded light on top and dark under, inked apart) instead of a pile of sphere-shaded
// circles; the neck is thinner (3.2 px tapering to 2.4 px) in the same S-curve; the head is a narrow tapered wedge
// pointing forward, and the hood a taller, narrower oval under it, so nothing reads as a brimmed hat.
// family-s-cap base.v2 (r2, from base.v1): the reared neck is an S-curve (back, then forward) tapering to a hood
// spread twice its width over it and a wedge head tilted forward; in the attack the neck lunges 4-6 px forward.
// family-s-cap base.v1 (r1) — snakes, serpents and spiders (glyph S, 1.0 m): a great serpent on the creature rig
// (art/lib/beast.v1.js): a thick body coiled on the floor in two loops, the front third reared up to a metre with a
// spread hood, a broad wedge head, a forked tongue, and a strike forward in the attack. The scales are the
// recoloured ramp (recolour: grass).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-s-cap', pass: 'x1', notes: 'great serpent: coiled loops, reared front, spread hood, wedge head', mirror: false, recolour: 'grass' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth } = k, c = pal.grass, L = k.P.lunge * 6, sw = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) * 1.2 : (k.state === 'idle' ? k.frame * 0.5 : 0);
    // the coiled body: three stacked loops, widest on the floor, each a flattened tube ring shaded light on top
    const [gx, gy] = k.ground, ox = gx + sw * 0.6;
    [[ox + 1, gy - 2.5, 10, 4.4], [ox - 0.5, gy - 6, 8, 3.6], [ox + 0.5, gy - 9, 5.6, 2.8]].forEach(([x, y, rx, ry], i) => {
      k.add({ type: 'subtract', name: 'coil', underlay: true, mat: c, shade: 'sphere', shapes: [{ type: 'ellipse', cx: x, cy: y, rx, ry }, { type: 'ellipse', cx: x + 0.5, cy: y - 0.8, rx: rx - 3.6, ry: Math.max(0.8, ry - 2.4) }] }, i * 0.01);
    });
    // the top loop's open centre, where the body turns down into the coil
    k.add({ type: 'ellipse', name: 'coil-hole', color: 'grass.2', cx: ox + 1.5, cy: gy - 9.6, rx: 2.4, ry: 0.9 }, 0.05);
    // the reared third: an S (back, then forward, then back under the hood), lunging forward in the attack
    const LU = k.state === 'attack' ? [-1, 4, 6, 2][k.frame % 4] : 0, neck = [], b0 = [ox - 1, gy - 8];
    for (let i = 0; i <= 8; i++) { const t = i / 8; neck.push([b0[0] + 3.2 * Math.sin(t * Math.PI * 2) * (1 - 0.3 * t) - (LU + sw) * t * t, b0[1] - 14 * t]); }
    k.add({ type: 'tube', name: 'neck', underlay: true, mat: c, shade: 'cyl', pts: neck, w: 3.2, w1: 2.4 }, 1);
    const D = 1, top = neck[8], hd = [top[0] - 1, top[1] - 2];
    // the hood: spread to twice the neck's width round the top of the neck, behind the head
    k.add({ type: 'path', name: 'hood', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[top[0] + 0.5, top[1] - 2.5], [top[0] + 3.4, top[1] + 0.5], [top[0] + 3, top[1] + 5], [top[0] + 0.5, top[1] + 7.5], [top[0] - 2.6, top[1] + 5], [top[0] - 3, top[1] + 0.5]]) }, D + 0.1);
    if (!k.back) k.add({ type: 'ellipse', name: 'hood-mark', mat: pal.accent, shade: 'flat', band: 1, cx: top[0] + 0.5, cy: top[1] + 3, rx: 1, ry: 1.5 }, D + 0.15);
    // the wedge head, its snout tilted forward and down
    k.add({ type: 'path', name: 'head', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[hd[0] + 2.5, hd[1] - 1.2], [hd[0] - 0.5, hd[1] - 2], [hd[0] - 4, hd[1] - 0.2], [hd[0] - 6, hd[1] + 1], [hd[0] - 3.5, hd[1] + 1.8], [hd[0] + 2, hd[1] + 1.4]]) }, D + 0.3);
    if (!k.back) {
      k.add({ type: 'rect', name: 'eye', x: Math.round(hd[0] - 2), y: Math.round(hd[1] - 1), w: 1, h: 1, color: 'accent.0' }, D + 0.4);
      if (k.state !== 'walk') k.add({ type: 'tube', name: 'tongue', mat: pal.accent, shade: 'flat', band: 1, pts: [[hd[0] - 6, hd[1] + 1.2], [hd[0] - 8.5, hd[1] + 2.2], [hd[0] - 9.5, hd[1] + 1.2]], w: 0.8 }, D + 0.4);
    }
  }, { ground: 8 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [3, 0, 20], hand: [1, 0, 16] }, { lunge: 7.8, ground: 8 });
