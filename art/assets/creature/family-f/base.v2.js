// family-f base.v2 (r2, from base.v1) — changed: the stalk, root legs and arms are drawn in the skin ramp (the recolour
// ramp, its shadow side on skin step 2 instead of the near-black hair step) and the whole fungus is scaled to 75% about
// its ground point, so it stands ~23 px for 1.4 m.
// family-f base.v1 (r1) — fungus horrors and spore beasts (glyph f, 1.4 m): a walking fungus on the creature rig
// (art/lib/beast.v1.js): a fat stalk splitting into root legs at the floor, a broad drooping cap with paler gills
// under its rim and spots on top, two ropy arms of mycelium, and a slit of a mouth in the stalk; spores puff from the
// cap in the attack. The cap and stalk are the recoloured ramp (recolour: skin).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-f', pass: 'r2', notes: 'walking mushroom: fat stalk, root legs, drooping spotted cap, ropy arms', mirror: false, recolour: 'skin' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, S = 0.75, add0 = k.add;
    k.add = (n, d) => add0({ ...n, scale: [S, S], origin: k.ground }, d);
    const c = pal.skin, L = k.P.lunge * 3, sq = k.state === 'idle' ? k.frame : 0;
    for (const [u, v, ph] of [[1.5, -2.5, 0], [1.5, 2.5, 0.5], [-1.5, -2, 0.5], [-1.5, 2.2, 0]]) {
      const s = step(ph, 1.5, 1);
      k.add({ type: 'tube', name: 'root', underlay: true, mat: c, shade: 'cyl', pts: [at(L, v * 0.4, 5), at(u + L, v, 2), at(u * 1.6 + L + s.du, v * 1.4, s.dh)], w: 2, w1: 0.8 }, depth(u + L, v));
    }
    const top = at(L, 0, 19 - sq), mid = at(L, 0, 10);
    k.add({ type: 'path', name: 'stalk', underlay: true, mat: c, shade: 'cyl', d: k.smooth([[mid[0] - 4, mid[1] + 6], [mid[0] - 5, mid[1]], [top[0] - 3, top[1] + 3], [top[0] + 3, top[1] + 3], [mid[0] + 5, mid[1]], [mid[0] + 4, mid[1] + 6]]) }, depth(L));
    if (!k.back) k.add({ type: 'path', name: 'mouth', color: 'outline', d: `M${mid[0] - 3} ${mid[1] - 1} Q${mid[0] - 1} ${mid[1] + 1 + k.P.open * 2} ${mid[0] + 2} ${mid[1] - 1} Q${mid[0] - 1} ${mid[1] + 0.2} ${mid[0] - 3} ${mid[1] - 1} Z` }, depth(L) + 0.1);
    for (const sd of [-1, 1]) {
      const sh = [mid[0] + sd * 4, mid[1] - 3], hand = [mid[0] + sd * 8 - (sd < 0 ? L * 2 : 0), mid[1] + 2 - (sd < 0 ? k.P.open * 4 : 0)];
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: c, shade: 'cyl', pts: [sh, [(sh[0] + hand[0]) / 2 + sd, sh[1] + 1], hand], w: 1.6, w1: 1 }, depth(L) + (sd < 0 ? 0.2 : -0.2));
    }
    k.add({ type: 'path', name: 'gills', mat: pal.leather, shade: 'flat', band: 0, d: k.smooth([[top[0] - 9, top[1] + 2], [top[0], top[1] + 4.5], [top[0] + 9, top[1] + 2], [top[0], top[1] + 1]]) }, depth(L) + 0.3);
    k.add({ type: 'path', name: 'cap', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[top[0] - 10, top[1] + 2.5], [top[0] - 8, top[1] - 4], [top[0], top[1] - 7], [top[0] + 8, top[1] - 4], [top[0] + 10, top[1] + 2.5], [top[0], top[1] + 1]]) }, depth(L) + 0.4);
    for (const [dx, dy, r] of [[-4, -3, 1.4], [2, -5, 1.2], [5, -1.5, 1.1], [-1, -1, 0.9]]) k.add({ type: 'circle', name: 'spot', cx: top[0] + dx, cy: top[1] + dy, r, mat: c, shade: 'flat', band: 0 }, depth(L) + 0.5);
    if (k.P.open > 0.5) for (const [dx, dy] of [[-6, -9], [0, -11], [6, -8], [-3, -13]]) k.add({ type: 'circle', name: 'spore', cx: top[0] + dx, cy: top[1] + dy, r: 0.8, mat: pal.skin, shade: 'flat', band: 0 }, 100);
  }, { ground: 6 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [0, 0, 13.5], hand: [-1.5, 0, 9] }, { ground: 6 });
