// boss-the-spore-queen base.v3 (r3, from base.v2) — the decorated pass on the owner-approved shape (silhouette kept):
// the cap is lit along the direction's light (linear, no pillow ring) with its spots as decals on the cap; a gill fringe
// (leather band with dark gill slits) under the cap rim on the front facings; a readable face on the upper stalk in front
// (two glowing eyes peering from the gill shadow, a dark mouth on the belly), and on the back facings mycelium veins down the stalk instead; the
// spore bulbs are glow-ramp pods with an accent seed; the crown spikes are metal on a metal circlet, lit on the light side, with
// an accent gem in front; the staff orb is a glowing spore pod (glow ramp) speckled with spores; AO under the cap and
// light material noise on the stalk. Body stays on the skin ramp (recolour: skin), the family-f ramp.
// boss-the-spore-queen base.v2 (r2, shape draft, from v1) — the figure at the boss height (2.7 m, ~43 px) with its base
// on the pivot row: a mushroom dome cap over a narrow stalk, a crown of spikes, spore bulbs, a spore staff at arm's length.
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'boss-the-spore-queen', pass: 'r3', notes: 'dome cap with gills, face, metal crown, glowing spore staff', mirror: false, recolour: 'skin' };
export function render(ctx) {
  const decals = [];
  const proc = p => {
    p = p.add('ao', { part: ['stalk', 'gills'] })
      .add('materialNoise', { part: ['stalk'], amount: 0.08, scale: 3, seed: ctx.variant ?? 0 });
    for (const d of decals) p = p.add('decal', d);
    return p;
  };
  return creature(ctx, k => {
    const S = 0.84, add0 = k.add; k.add = (n, d) => add0({ ...n, scale: [S, S], origin: k.ground }, d);
    const g = k.ground, T = ([x, y]) => [g[0] + (x - g[0]) * S, g[1] + (y - g[1]) * S];
    const decal = (name, part, mat, shape) => decals.push({ name, part, mat, shape: shape.type === 'line' ? seg(shape) : shape });
    const seg = ({ x0, y0, x1, y1, w }) => { const l = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / l * w / 2, ny = (x1 - x0) / l * w / 2; return { type: 'poly', pts: [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]] }; };
    const { pal, at, depth, back } = k, c = pal.skin, L = k.P.lunge * 3, hd = depth(L);
    const X = h => at(L, 0, h)[0], Y = h => at(L, 0, h)[1];
    const turn = back ? 0 : -1; // the face turned toward the viewer's left
    // narrow stalk, flared at the foot, bulging a little at the belly
    const w = [[0, 8], [4, 5.2], [10, 5.8], [18, 4.4], [25, 4.8]];
    k.add({ type: 'path', name: 'stalk', underlay: true, mat: c, shade: 'cyl', d: k.smooth([...w.map(([h, r]) => [X(h) - r, Y(h)]), ...w.slice().reverse().map(([h, r]) => [X(h) + r, Y(h)])]) }, hd);
    if (!back) {
      // the face under the rim: glowing eyes and a dark mouth
      k.add({ type: 'ellipse', name: 'face-shadow', cx: X(24) + turn - 0.5, cy: Y(24) + 1, rx: 4.2, ry: 1.6, mat: pal.hair, shade: 'flat', band: 2 }, hd + 0.48);
      for (const dx of [-2.5, 1.5]) k.add({ type: 'rect', name: 'eye', x: X(24) + dx + turn - 0.5, y: Y(24) + 0.2, w: 1.3, h: 1.3, mat: pal.glow, shade: 'flat', band: 0 }, hd + 0.5);
      k.add({ type: 'path', name: 'mouth', color: 'outline', d: `M${X(11) - 2 + turn} ${Y(11)} Q${X(11) + turn} ${Y(11) + 1.6 + k.P.open * 1.5} ${X(11) + 2 + turn} ${Y(11)} Q${X(11) + turn} ${Y(11) + 0.6} ${X(11) - 2 + turn} ${Y(11)} Z` }, hd + 0.1);
    } else {
      // mycelium veins down the back of the stalk
      for (const [dx, h0, h1] of [[-1.5, 19, 6], [1.5, 18, 9], [0, 13, 3]]) decal('vein', 'stalk', 'hair', { type: 'line', x0: T([X(h0) + dx, Y(h0)])[0], y0: T([X(h0) + dx, Y(h0)])[1], x1: T([X(h1) + dx * 1.4, Y(h1)])[0], y1: T([X(h1) + dx * 1.4, Y(h1)])[1], w: 0.8 });
    }
    // spore bulbs: accent pods on the stalk's flanks, each with a glowing seed toward the light
    for (const [dx, h, r] of [[-5, 8, 2.4], [5.5, 13, 2.2], [-4.5, 19, 1.8], [4, 4, 1.8]]) {
      k.add({ type: 'circle', name: 'bulb', underlay: true, mat: pal.glow, shade: 'sphere', gain: 0.6, cx: X(h) + dx, cy: Y(h), r }, hd + 0.2);
      if (r > 2) decal('bulb-seed', 'bulb', 'accent', { type: 'rect', x: Math.round(T([X(h) + dx - r * 0.45, Y(h) - r * 0.45])[0]), y: Math.round(T([X(h) + dx - r * 0.45, Y(h) - r * 0.45])[1]), w: 1, h: 1 });
    }
    // the staff, held clear of the body on the right: a leather shaft, a glowing spore pod with two prongs
    const sx = at(L, 15, 0)[0], sy = at(L, 15, 0)[1];
    k.add({ type: 'tube', name: 'arm', underlay: true, mat: c, shade: 'flat', band: 1, pts: [[X(18) + 3, Y(18)], [sx - 4, Y(14)], [sx, Y(14) + 1]], w: 2, w1: 1.4 }, hd + 0.25);
    k.add({ type: 'tube', name: 'staff', underlay: true, mat: pal.leather, shade: 'cyl', pts: [[sx, sy], [sx + 0.5, sy - 22], [sx, sy - 38]], w: 1.8, w1: 1.4 }, hd + 0.3);
    k.add({ type: 'circle', name: 'staff-pod', underlay: true, mat: pal.glow, shade: 'sphere', gain: 0.7, cx: sx, cy: sy - 40, r: 3.4 }, hd + 0.31);
    for (const [dx, dy] of [[1, -0.5], [-0.5, 1.5]]) decal('spore', 'staff-pod', 'accent', { type: 'rect', x: Math.round(T([sx + dx, sy - 40 + dy])[0]), y: Math.round(T([sx + dx, sy - 40 + dy])[1]), w: 1, h: 1 });
    for (const a of [-1, 1]) k.add({ type: 'poly', name: 'staff-prong', underlay: true, mat: pal.leather, shade: 'flat', band: a < 0 ? 0 : 1, pts: [[sx + a * 1, sy - 35], [sx + a * 6, sy - 42], [sx + a * 3, sy - 34]] }, hd + 0.3);
    // the cap: a big dome, lit along the light (top-left) rather than ringed
    const b = 24, t = 36;
    k.add({ type: 'path', name: 'cap', underlay: true, mat: c, shade: 'linear', d: k.smooth([[X(b) - 15, Y(b) + 1], [X(b) - 14, Y(b + 7)], [X(t) - 7, Y(t) + 0], [X(t + 3), Y(t + 3)], [X(t) + 7, Y(t) + 0], [X(b) + 14, Y(b + 7)], [X(b) + 15, Y(b) + 1], [X(b) + 8, Y(b) + 1.5], [X(b), Y(b) + 2], [X(b) - 8, Y(b) + 1.5]]) }, hd + 0.4);
    if (!back) {
      // gill fringe under the rim: a leather band with dark slits
      k.add({ type: 'path', name: 'gills', mat: pal.leather, shade: 'flat', band: 0, d: k.smooth([[X(b) - 13, Y(b) + 0.8], [X(b) - 8, Y(b + 3.6)], [X(b), Y(b + 4)], [X(b) + 8, Y(b + 3.6)], [X(b) + 13, Y(b) + 0.8], [X(b) + 8, Y(b) + 1.2], [X(b), Y(b) + 1.6], [X(b) - 8, Y(b) + 1.2]]) }, hd + 0.45);
      for (let dx = -10; dx <= 10; dx += 3) decal('gill-slit', 'gills', 'hair', { type: 'line', x0: T([X(b) + dx, Y(b + 3.4)])[0], y0: T([X(b) + dx, Y(b + 3.4)])[1], x1: T([X(b) + dx * 1.1, Y(b) + 1.2])[0], y1: T([X(b) + dx * 1.1, Y(b) + 1.2])[1], w: 1 });
    }
    // spots on the cap as decals (the back shows more of them)
    const spots = back ? [[-7, 31, 1.6], [3, 33, 1.4], [8, 29, 1.2], [-2, 28, 1.3], [-10, 27, 1]] : [[-7, 31, 1.6], [3, 33, 1.4], [8, 29, 1.2]];
    for (const [dx, h, r] of spots) { const [cx, cy] = T([X(h) + dx, Y(h)]); decal('spot', 'cap', 'skin', { type: 'circle', cx, cy, r: r * S }); }
    // crown: a metal circlet with spikes, lit on the light side; an accent gem in front
    k.add({ type: 'tube', name: 'circlet', underlay: true, mat: pal.metal, shade: 'flat', band: 1, pts: [[X(t) - 9, Y(t + 2) + 5.4], [X(t), Y(t + 2) + 1.2], [X(t) + 9, Y(t + 2) + 5.4]], w: 1.6, w1: 1.6 }, hd + 0.55);
    [-8, -4, 0, 4, 8].forEach((dx, i) => { const tip = 5.5 - Math.abs(dx) * 0.25 + (i % 2) * 1; const by = Y(t + 2) + Math.abs(dx) * 0.6; k.add({ type: 'poly', name: 'crown-spike', underlay: true, mat: pal.metal, shade: 'flat', band: dx < 0 ? 0 : dx === 0 ? 1 : 2, pts: [[X(t) + dx - 1.6, by + 1], [X(t) + dx, by - tip], [X(t) + dx + 1.6, by + 1]] }, hd + 0.6); });
    if (!back) k.add({ type: 'rect', name: 'crown-gem', x: X(t) - 0.6, y: Y(t + 2) + 0.4, w: 1.4, h: 1.4, mat: pal.accent, shade: 'flat', band: 0 }, hd + 0.62);
  }, { ground: 1, proc });
}
export const anchors = ctx => groundAnchors(ctx, { head: [0, 0, 36], hand: [0, 15, 14] }, { ground: 1 });
