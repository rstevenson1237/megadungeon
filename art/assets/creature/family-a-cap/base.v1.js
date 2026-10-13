// family-a-cap base.v1 (r1) — aberrations: eye tyrants and mind horrors (glyph A, 2.2 m): an eye tyrant on the
// creature rig (art/lib/beast.v1.js) at the large frame, floating with its shadow on the floor below: a great round
// body with one huge central eye, a wide fanged mouth under it, and a crown of writhing stalks each tipped with a small
// eye. The hide is the recoloured ramp (recolour: skin).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-a-cap', pass: 'r1', notes: 'eye tyrant: floating orb, one great eye, fanged maw, eye stalks', mirror: false, recolour: 'skin' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, F } = k, c = pal.skin, L = k.P.lunge * 6, hov = 14 + (k.state === 'idle' ? k.frame : 0) + (k.P.walking ? Math.round(Math.sin(k.P.phase * Math.PI * 2)) : 0);
    const o = at(L, 0, hov + 11), r = 11, face = [o[0] + F[0] * 4, o[1] + (k.back ? -3 : 2)];
    const wig = i => (k.P.walking ? Math.sin(k.P.phase * Math.PI * 2 + i) : (k.state === 'idle' ? k.frame * 0.5 : 0)) * 1.5;
    const stalks = [-50, -25, 0, 25, 50].map((a, i) => { const t = (a - 90) * Math.PI / 180; return [o[0] + Math.cos(t) * (r - 2), o[1] + Math.sin(t) * (r - 2), o[0] + Math.cos(t) * (r + 7) + wig(i), o[1] + Math.sin(t) * (r + 7) - 2]; });
    if (k.back) { k.add({ type: 'circle', name: 'body', underlay: true, mat: c, shade: 'sphere', cx: o[0], cy: o[1], r }, 1); }
    stalks.forEach(([x0, y0, x1, y1], i) => {
      k.add({ type: 'tube', name: 'stalk', underlay: true, mat: c, shade: 'cyl', pts: [[x0, y0], [(x0 + x1) / 2 + wig(i + 1), (y0 + y1) / 2 - 1], [x1, y1]], w: 2, w1: 1.4 }, k.back ? 2 : 0);
      k.add({ type: 'circle', name: 'stalk-eye', underlay: true, mat: pal.cloth, shade: 'sphere', cx: x1, cy: y1, r: 1.6 }, k.back ? 2.1 : 0.1);
      if (!k.back) k.add({ type: 'rect', name: 'pupil', x: Math.round(x1 - 0.5), y: Math.round(y1), w: 1, h: 1, color: 'outline' }, 0.2);
    });
    if (!k.back) {
      k.add({ type: 'circle', name: 'body', underlay: true, mat: c, shade: 'sphere', cx: o[0], cy: o[1], r }, 1);
      k.add({ type: 'ellipse', name: 'eye', underlay: true, mat: pal.cloth, shade: 'sphere', cx: face[0], cy: face[1] - 3, rx: 5, ry: 4 }, 1.1);
      k.add({ type: 'circle', name: 'iris', mat: pal.accent, shade: 'flat', band: 1, cx: face[0] - 1, cy: face[1] - 3, r: 2.4 }, 1.2);
      k.add({ type: 'ellipse', name: 'pupil', cx: face[0] - 1, cy: face[1] - 3, rx: 0.8, ry: 1.8, color: 'outline' }, 1.3);
      k.add({ type: 'path', name: 'maw', color: 'outline', d: `M${face[0] - 6} ${face[1] + 4} Q${face[0]} ${face[1] + 7 + k.P.open * 3} ${face[0] + 6} ${face[1] + 4} Q${face[0]} ${face[1] + 5} ${face[0] - 6} ${face[1] + 4} Z` }, 1.2);
      for (const dx of [-4, -1.5, 1, 3.5]) k.add({ type: 'poly', name: 'fang', mat: pal.cloth, shade: 'flat', band: 0, pts: [[face[0] + dx - 0.8, face[1] + 4.6], [face[0] + dx, face[1] + 6.5], [face[0] + dx + 0.8, face[1] + 4.6]] }, 1.3);
    }
  }, { ground: 8, shadow: { rx: 8 } });
}
export const anchors = ctx => groundAnchors(ctx, { head: [0, 0, 36], hand: [4, 0, 26] }, { lunge: 6, ground: 8 });
