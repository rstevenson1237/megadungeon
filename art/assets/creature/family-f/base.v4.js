// family-f base.v4 (x1, from base.v3) — changed (blind re-score, one body revision): the fungus is hunched and wide —
// a broad bulging trunk leaning forward with the cap pitched ahead and drooping over the face, a ragged fringe of gill
// tatters hanging under the rim (the eyes glint between them), long thin hyphae arms reaching down near the floor and
// splitting into three grasping filaments, and a distinct back view: shelf fungi stepping up the trunk's back and a
// dome of spots, no face.
// family-f base.v3 (r3, from base.v2) — changed: the stem is thickened into a ~5 px trunk (wider at every point, flaring
// at the foot), and on the front facings (s/e) two pale eye spots glint in a band of shadow under the cap's rim.
// family-f base.v2 (r2, from base.v1) — changed: the stalk, root legs and arms are drawn in the skin ramp (the recolour
// ramp, its shadow side on skin step 2 instead of the near-black hair step) and the whole fungus is scaled to 75% about
// its ground point, so it stands ~23 px for 1.4 m.
// family-f base.v1 (r1) — fungus horrors and spore beasts (glyph f, 1.4 m): a walking fungus on the creature rig
// (art/lib/beast.v1.js): a fat stalk splitting into root legs at the floor, a broad drooping cap with paler gills
// under its rim and spots on top, two ropy arms of mycelium, and a slit of a mouth in the stalk; spores puff from the
// cap in the attack. The cap and stalk are the recoloured ramp (recolour: skin).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-f', pass: 'x1', notes: 'walking mushroom: fat stalk, root legs, drooping spotted cap, ropy arms', mirror: false, recolour: 'skin' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step } = k, S = 0.75, add0 = k.add;
    k.add = (n, d) => add0({ ...n, scale: [S, S], origin: k.ground }, d);
    const c = pal.skin, L = k.P.lunge * 3, sq = k.state === 'idle' ? k.frame : 0;
    for (const [u, v, ph] of [[1.5, -2.5, 0], [1.5, 2.5, 0.5], [-1.5, -2, 0.5], [-1.5, 2.2, 0]]) {
      const s = step(ph, 1.5, 1);
      k.add({ type: 'tube', name: 'root', underlay: true, mat: c, shade: 'cyl', pts: [at(L, v * 0.4, 5), at(u + L, v, 2), at(u * 2.6 + L + s.du, v * 3, s.dh)], w: 2.2, w1: 0.8 }, depth(L) - 1 + depth(u + L, v) * 0.001);
    }
    const top = at(L + 2.5, 0, 17 - sq), mid = at(L + 1, 0, 9), foot = at(L, 0, 2), hd = depth(L);
    // a wide hunched trunk: flared at the foot, bulging at the belly, bent forward under the cap
    k.add({ type: 'path', name: 'stalk', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[foot[0] - 7.5, foot[1] + 1], [mid[0] - 7, mid[1] + 1], [top[0] - 5, top[1] + 3], [top[0] + 1, top[1] + 1], [top[0] + 6, top[1] + 3], [mid[0] + 7.5, mid[1] - 1], [foot[0] + 7.5, foot[1] + 1], [foot[0], foot[1] + 2]]) }, hd);
    if (!k.back) k.add({ type: 'path', name: 'mouth', color: 'outline', d: `M${mid[0] - 3.5} ${mid[1] - 1} Q${mid[0] - 1} ${mid[1] + 1.5 + k.P.open * 2.5} ${mid[0] + 2.5} ${mid[1] - 1} Q${mid[0] - 1} ${mid[1] + 0.2} ${mid[0] - 3.5} ${mid[1] - 1} Z` }, hd + 0.1);
    if (k.back) {
      // from behind: shelf fungi stepping up the trunk's back
      for (const [dx, dy, rx] of [[-2.5, 6, 3.6], [2.5, 2, 3.2], [-1.5, -2.5, 2.8]]) {
        k.add({ type: 'path', name: 'shelf', underlay: true, mat: c, shade: 'flat', band: 1, d: k.smooth([[mid[0] + dx - rx, mid[1] + dy], [mid[0] + dx, mid[1] + dy - 2.2], [mid[0] + dx + rx, mid[1] + dy], [mid[0] + dx, mid[1] + dy + 0.8]]) }, hd + 0.15);
        k.add({ type: 'path', name: 'shelf-lit', mat: c, shade: 'flat', band: 0, d: k.smooth([[mid[0] + dx - rx + 1, mid[1] + dy - 0.3], [mid[0] + dx - 0.5, mid[1] + dy - 1.8], [mid[0] + dx + 0.5, mid[1] + dy - 0.8]]) }, hd + 0.16);
      }
    }
    // long thin hyphae arms reaching down near the floor, each splitting into three grasping filaments
    for (const sd of [-1, 1]) {
      const reach = sd < 0 ? L * 2 + k.P.open * 3 : 0;
      const sh = [mid[0] + sd * 6, mid[1] - 3], el = [mid[0] + sd * 10 - (sd < 0 ? reach : 0), mid[1] + 1 - (sd < 0 ? k.P.open * 3 : 0)], hand = [mid[0] + sd * 11 - (sd < 0 ? reach * 1.4 : 0), mid[1] + 8 - (sd < 0 ? k.P.open * 7 : 0)];
      const d0 = hd + (sd < 0 ? 0.2 : -0.2);
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: c, shade: 'cyl', pts: [sh, el, hand], w: 1.8, w1: 1 }, d0);
      for (const [fx, fy] of [[-2.2, 2.6], [0, 3.4], [2.2, 2.4]]) k.add({ type: 'tube', name: 'filament', underlay: true, mat: c, shade: 'flat', band: 1, pts: [hand, [hand[0] + fx * 0.6, hand[1] + fy * 0.6], [hand[0] + fx + sd * 0.4, hand[1] + fy]], w: 0.9, w1: 0.6 }, d0 + 0.01);
    }
    // the cap: broad, pitched forward, its rim drooping well down at the sides
    const cap = k.add({ type: 'path', name: 'cap', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[top[0] - 12, top[1] + 5], [top[0] - 10, top[1] - 3.5], [top[0], top[1] - 7], [top[0] + 10, top[1] - 3.5], [top[0] + 12, top[1] + 5], [top[0] + 7, top[1] + 2.5], [top[0], top[1] + 2], [top[0] - 7, top[1] + 2.5]]) }, hd + 0.4);
    if (!k.back) {
      // under the rim from the front: a shadowed hollow and a ragged fringe of gill tatters, the eyes glinting between
      k.add({ type: 'ellipse', name: 'under-shadow', cx: top[0], cy: top[1] + 4.5, rx: 7.5, ry: 3.6, mat: c, shade: 'flat', band: 2 }, hd + 0.35);
      [-8.5, -6, -3.5, 3.5, 6, 8.5].forEach((dx, i) => {
        const y0 = top[1] + 2.4 + Math.abs(dx) * Math.abs(dx) * 0.03, len = 3.4 + ((i * 7) % 3) * 0.9;
        k.add({ type: 'poly', name: 'gill', underlay: true, mat: i % 2 ? pal.leather : c, shade: 'flat', band: i % 2 ? 1 : 2, pts: [[top[0] + dx - 1.3, y0 - 1], [top[0] + dx + 0.3, y0 + len], [top[0] + dx + 1.3, y0 - 1]] }, hd + 0.45);
      });
      for (const dx of [-3.4, 2]) k.add({ type: 'rect', name: 'eye', x: Math.round(top[0] + dx - 1), y: Math.round(top[1] + 4), w: 2.2, h: 2.4, color: 'skin.0' }, hd + 0.46);
    }
    const spots = k.back ? [[-5, -2.5, 1.6], [1, -4.5, 1.5], [6, -1, 1.3], [-1, 0, 1.1], [3.5, 1.5, 0.9], [-7.5, 1.5, 0.9]] : [[-4, -3, 1.4], [2, -5, 1.2], [5.5, -1.5, 1.1], [-1, -1, 0.9]];
    for (const [dx, dy, r] of spots) k.add({ type: 'circle', name: 'spot', cx: top[0] + dx, cy: top[1] + dy, r, mat: c, shade: 'flat', band: 0 }, hd + 0.5);
    if (k.P.open > 0.5) for (const [dx, dy] of [[-6, -9], [0, -11], [6, -8], [-3, -13]]) k.add({ type: 'circle', name: 'spore', cx: top[0] + dx, cy: top[1] + dy, r: 0.8, mat: pal.skin, shade: 'flat', band: 0 }, 100);
  }, { ground: 6 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [0, 0, 13.5], hand: [-1.5, 0, 9] }, { ground: 6 });
