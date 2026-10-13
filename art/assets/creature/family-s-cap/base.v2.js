// family-s-cap base.v2 (r2, from base.v1): the reared neck is an S-curve (back, then forward) tapering to a hood
// spread twice its width over it and a wedge head tilted forward; in the attack the neck lunges 4-6 px forward.
// family-s-cap base.v1 (r1) — snakes, serpents and spiders (glyph S, 1.0 m): a great serpent on the creature rig
// (art/lib/beast.v1.js): a thick body coiled on the floor in two loops, the front third reared up to a metre with a
// spread hood, a broad wedge head, a forked tongue, and a strike forward in the attack. The scales are the
// recoloured ramp (recolour: grass).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-s-cap', pass: 'r2', notes: 'great serpent: coiled loops, reared front, spread hood, wedge head', mirror: false, recolour: 'grass' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth } = k, c = pal.grass, L = k.P.lunge * 6, sw = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) * 1.2 : (k.state === 'idle' ? k.frame * 0.5 : 0);
    const coil = [];
    for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI * 3.2; coil.push([Math.cos(a) * (7 - i * 0.2) - 2, Math.sin(a) * (5 - i * 0.12), 1.6]); }
    for (let i = 0; i < coil.length - 1; i++) {
      const [u, v] = coil[i], p = at(u, v + sw * 0.3, 2);
      k.add({ type: 'circle', name: 'coil', underlay: true, mat: c, shade: 'sphere', cx: p[0], cy: p[1], r: 2.8 - i * 0.05 }, depth(u, v));
    }
    // the reared third: an S (back, then forward, then back under the hood), lunging forward in the attack
    const LU = k.state === 'attack' ? [-1, 4, 6, 2][k.frame % 4] : 0, neck = [], b0 = at(1, 0, 3);
    for (let i = 0; i <= 8; i++) { const t = i / 8; neck.push([b0[0] + 3.2 * Math.sin(t * Math.PI * 2) * (1 - 0.3 * t) - (LU + sw) * t * t, b0[1] - 15 * t]); }
    k.add({ type: 'tube', name: 'neck', underlay: true, mat: c, shade: 'cyl', pts: neck, w: 4.4, w1: 3.6 }, depth(6));
    const top = neck[8], hd = [top[0] - 1, top[1] - 3];
    // the hood: spread to twice the neck's width round the top of the neck, behind the head
    k.add({ type: 'path', name: 'hood', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[top[0], top[1] - 4], [top[0] + 4.5, top[1] - 2], [top[0] + 4, top[1] + 2.5], [top[0], top[1] + 4.5], [top[0] - 4, top[1] + 2.5], [top[0] - 4.5, top[1] - 2]]) }, depth(6) + 0.1);
    if (!k.back) k.add({ type: 'ellipse', name: 'hood-mark', mat: pal.accent, shade: 'flat', band: 1, cx: top[0] + 0.5, cy: top[1] + 1.5, rx: 1, ry: 1.5 }, depth(6) + 0.15);
    // the wedge head, its snout tilted forward and down
    k.add({ type: 'path', name: 'head', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[hd[0] + 3, hd[1] - 2], [hd[0], hd[1] - 3.2], [hd[0] - 5, hd[1] + 0.5], [hd[0] - 6, hd[1] + 2.2], [hd[0] - 1.5, hd[1] + 1.5], [hd[0] + 2.5, hd[1] + 1]]) }, depth(6) + 0.3);
    if (!k.back) {
      k.add({ type: 'rect', name: 'eye', x: Math.round(hd[0] - 2), y: Math.round(hd[1] - 1.5), w: 1, h: 1, color: 'accent.0' }, depth(6) + 0.4);
      if (k.state !== 'walk') k.add({ type: 'tube', name: 'tongue', mat: pal.accent, shade: 'flat', band: 1, pts: [[hd[0] - 5.5, hd[1] + 2], [hd[0] - 8, hd[1] + 3], [hd[0] - 9, hd[1] + 2]], w: 0.8 }, depth(6) + 0.4);
    }
  }, { ground: 8 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [3, 0, 20], hand: [1, 0, 16] }, { lunge: 7.8, ground: 8 });
