// family-s-cap base.v1 (r1) — snakes, serpents and spiders (glyph S, 1.0 m): a great serpent on the creature rig
// (art/lib/beast.v1.js): a thick body coiled on the floor in two loops, the front third reared up to a metre with a
// spread hood, a broad wedge head, a forked tongue, and a strike forward in the attack. The scales are the
// recoloured ramp (recolour: grass).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-s-cap', pass: 'r1', notes: 'great serpent: coiled loops, reared front, spread hood, wedge head', mirror: false, recolour: 'grass' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth } = k, c = pal.grass, L = k.P.lunge * 6, sw = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) * 1.2 : (k.state === 'idle' ? k.frame * 0.5 : 0);
    const coil = [];
    for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI * 3.2; coil.push([Math.cos(a) * (7 - i * 0.2) - 2, Math.sin(a) * (5 - i * 0.12), 1.6]); }
    for (let i = 0; i < coil.length - 1; i++) {
      const [u, v] = coil[i], p = at(u, v + sw * 0.3, 2);
      k.add({ type: 'circle', name: 'coil', underlay: true, mat: c, shade: 'sphere', cx: p[0], cy: p[1], r: 2.8 - i * 0.05 }, depth(u, v));
    }
    const neck = [at(2, 0, 3), at(3 + L * 0.5 + sw, 0, 8), at(3 + L + sw, 0, 13), at(4.5 + L * 1.3 + sw, 0, 16)];
    k.add({ type: 'tube', name: 'neck', underlay: true, mat: c, shade: 'cyl', pts: neck, w: 5, w1: 4 }, depth(6));
    const hd = neck[3];
    k.add({ type: 'ellipse', name: 'hood', underlay: true, mat: c, shade: 'sphere', cx: hd[0] + (k.back ? 0 : 1), cy: hd[1] + 3.5, rx: 5, ry: 4.5 }, depth(6) + (k.back ? 0.2 : -0.1));
    if (!k.back) k.add({ type: 'ellipse', name: 'hood-mark', mat: pal.accent, shade: 'flat', band: 1, cx: hd[0] + 1, cy: hd[1] + 4, rx: 2, ry: 2.6 }, depth(6) - 0.05);
    k.add({ type: 'path', name: 'head', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[hd[0] - 4, hd[1] + 0.5], [hd[0] - 1, hd[1] - 2.6], [hd[0] + 3, hd[1] - 1.5], [hd[0] + 2.4, hd[1] + 1.8], [hd[0] - 1, hd[1] + 2]]) }, depth(6) + 0.3);
    if (!k.back) {
      k.add({ type: 'rect', name: 'eye', x: Math.round(hd[0] - 1.5), y: Math.round(hd[1] - 1), w: 1, h: 1, color: 'accent.0' }, depth(6) + 0.4);
      if (k.state !== 'walk') k.add({ type: 'tube', name: 'tongue', mat: pal.accent, shade: 'flat', band: 1, pts: [[hd[0] - 4, hd[1] + 1], [hd[0] - 6.5, hd[1] + 1.5], [hd[0] - 7.5, hd[1] + 0.5]], w: 0.8 }, depth(6) + 0.4);
    }
  }, { ground: 8 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [4.5, 0, 16], hand: [1, 0, 16] }, { lunge: 7.8, ground: 8 });
