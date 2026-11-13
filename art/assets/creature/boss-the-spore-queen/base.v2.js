// boss-the-spore-queen base.v2 (r2, shape draft, from v1) — changed (owner: "fails the feet-on-ground pivot check"): the
// figure is redrawn at the boss height (2.7 m, ~43 px) with its base on the pivot row (ground 1): a clear mushroom dome cap
// overhanging a much narrower stalk body, a crown of spikes on the cap, a few spore-bulb bumps on the stalk, and a spore
// staff held clear of the body at arm's length. Flat materials only (the ground shadow stays); no proc layers.
// The whole figure is scaled to 84% about its ground point to land on the 2.7 m height.
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'boss-the-spore-queen', pass: 'r2', notes: 'dome cap, narrow stalk, spike crown, spore staff', mirror: false, recolour: 'skin' };
export function render(ctx) {
  return creature(ctx, k => {
    const S = 0.84, add0 = k.add; k.add = (n, d) => add0({ ...n, scale: [S, S], origin: k.ground }, d);
    const { pal, at, depth } = k, c = pal.skin, L = k.P.lunge * 3, hd = depth(L);
    const X = h => at(L, 0, h)[0], Y = h => at(L, 0, h)[1];
    // narrow stalk, flared at the foot, bulging a little at the belly
    const w = [[0, 8], [4, 5.2], [10, 5.8], [18, 4.4], [25, 4.8]];
    k.add({ type: 'path', name: 'stalk', underlay: true, mat: c, shade: 'cyl', d: k.smooth([...w.map(([h, r]) => [X(h) - r, Y(h)]), ...w.slice().reverse().map(([h, r]) => [X(h) + r, Y(h)])]) }, hd);
    // spore bulbs: bumps on the stalk's flanks
    for (const [dx, h, r] of [[-5, 8, 2.4], [5.5, 13, 2.2], [-4.5, 19, 1.8], [4, 4, 1.8]]) k.add({ type: 'circle', name: 'bulb', underlay: true, mat: c, shade: 'sphere', cx: X(h) + dx, cy: Y(h), r }, hd + 0.2);
    // the staff, held clear of the body on the right: a long shaft, a spore pod with two prongs
    const sx = at(L, 15, 0)[0], sy = at(L, 15, 0)[1];
    k.add({ type: 'tube', name: 'arm', underlay: true, mat: c, shade: 'flat', band: 1, pts: [[X(18) + 3, Y(18)], [sx - 4, Y(14)], [sx, Y(14) + 1]], w: 2, w1: 1.4 }, hd + 0.25);
    k.add({ type: 'tube', name: 'staff', underlay: true, mat: pal.leather, shade: 'cyl', pts: [[sx, sy], [sx + 0.5, sy - 22], [sx, sy - 38]], w: 1.8, w1: 1.4 }, hd + 0.3);
    k.add({ type: 'circle', name: 'staff-pod', underlay: true, mat: pal.accent, shade: 'sphere', cx: sx, cy: sy - 40, r: 3.4 }, hd + 0.31);
    for (const a of [-1, 1]) k.add({ type: 'poly', name: 'staff-prong', underlay: true, mat: pal.leather, shade: 'flat', band: 1, pts: [[sx + a * 1, sy - 35], [sx + a * 6, sy - 42], [sx + a * 3, sy - 34]] }, hd + 0.3);
    // the cap: a big dome overhanging the stalk on every side, with a flat-ish underside
    const b = 24, t = 36;
    k.add({ type: 'path', name: 'cap', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[X(b) - 15, Y(b) + 1], [X(b) - 14, Y(b + 7)], [X(t) - 7, Y(t) + 0], [X(t + 3), Y(t + 3)], [X(t) + 7, Y(t) + 0], [X(b) + 14, Y(b + 7)], [X(b) + 15, Y(b) + 1], [X(b) + 8, Y(b) + 1.5], [X(b), Y(b) + 2], [X(b) - 8, Y(b) + 1.5]]) }, hd + 0.4);
    // crown of spikes along the cap's top
    [-8, -4, 0, 4, 8].forEach((dx, i) => { const tip = 5.5 - Math.abs(dx) * 0.25 + (i % 2) * 1; const by = Y(t + 2) + Math.abs(dx) * 0.6; k.add({ type: 'poly', name: 'crown-spike', underlay: true, mat: i % 2 ? pal.leather : c, shade: 'flat', band: i % 2 ? 1 : 0, pts: [[X(t) + dx - 1.6, by + 1], [X(t) + dx, by - tip], [X(t) + dx + 1.6, by + 1]] }, hd + 0.6); });
    for (const [dx, h, r] of [[-7, 31, 1.6], [3, 33, 1.4], [8, 29, 1.2]]) k.add({ type: 'circle', name: 'spot', cx: X(h) + dx, cy: Y(h), r, mat: c, shade: 'flat', band: 0 }, hd + 0.5);
  }, { ground: 1 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [0, 0, 36], hand: [0, 15, 14] }, { ground: 1 });
