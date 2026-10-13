// family-w base.v4 (x1, from base.v3) — ONE change (the blind reviewer's): the front views (s/e) open from a cramped
// knot into an S curve: the floor body sweeps out to the side and back (away from the viewer) and curls round at the
// tail, so head column, body and tail no longer overlap; every segment is shaded as a lit-top cylinder (mid body, a
// 1-2 px highlight on the upper left, a dark underbelly crescent), and the maw is a dark ring with 1 px light teeth on
// its inner edge. The back views (n/w, the clean L curve) are unchanged.
// family-w base.v3 (r3, from base.v2) — ONE change: in the back views (n/w) the floor coil's segments are shaded on the
// skin ramp's mid/shadow steps (no longer blown out to the lightest step), each keeping only a 1 px top rim of highlight,
// so the skin ramp stays dominant and the tail stays attached to the column.
// base.v2 (r2, from base.v1) — ONE change: the reared front is drawn by its rise on screen, so s/e show the
// same tall reared column as n/w (v1's front view folded it into a squat coil, its back view overshot 0.6 m); the
// column now tops out ~10 px above the floor in every facing, and the mouth's rim carries a ring of light tooth pixels.
// v1: worms, leeches and crawlers (glyph w, 0.6 m): a great worm on the creature rig (art/lib/beast.v1.js): a fat
// ringed body lying in a curve on the floor and rearing its front up, a round sucker mouth ringed with small teeth at
// the top that opens in the attack. The body is the recoloured ramp (recolour: skin).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-w', pass: 'x1', notes: 'front opened into an S curve, lit-top cylinder segments, dark maw ring with 1 px teeth; back-view tail segments on mid/shadow with a 1 px top rim; reared front by screen rise (same in every facing, ~10 px), ring of teeth on the mouth', mirror: false, recolour: 'skin' };
// the height above the ground that puts a point at screen rise `rise` whichever way the heading turns
const htFor = (k, u, rise) => rise + k.F[1] * u;
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth } = k, c = pal.skin, L = k.P.lunge * 4, sway = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) * 1.2 : (k.state === 'idle' ? k.frame * 0.5 : 0);
    const rear = k.P.open * 1.5; // the attack rears the column higher
    // floor coil [u, v, ht], then the reared column [u, v, rise on screen]
    // front: an S sweeping out to the side and away, curling at the tail; back: v3's L curve
    const floor = k.back ? [[-8, 2, 1.8], [-6, -1, 1.8], [-3, -2.5, 2], [0, -1.5, 2.2]]
      : [[-11.5, 1.5 + sway * 0.4, 1.4], [-10, -1.5, 1.6], [-7.5, -4, 1.8], [-4.5, -4.6 - sway * 0.3, 2], [-1.8, -3, 2.2], [0.3, -1, 2.4]];
    // a lit-top cylinder segment: mid body, dark underbelly, highlight on the upper left
    const seg = (p, r, d) => {
      k.add({ type: 'circle', name: 'ring', underlay: true, mat: c, shade: 'flat', band: 1, cx: p[0], cy: p[1], r }, d);
      k.add({ type: 'ellipse', name: 'ring-shade', cx: p[0] + r * 0.25, cy: p[1] + r * 0.5, rx: r * 0.75, ry: r * 0.42, color: 'skin.2' }, d + 0.0005);
      k.add({ type: 'rect', name: 'ring-hi', x: Math.round(p[0] - r * 0.6), y: Math.round(p[1] - r * 0.6), w: r > 2 ? 2 : 1, h: 1, color: 'skin.0' }, d + 0.001);
    };
    const column = [[2, 0, 3], [3 + L * 0.6, 0.3 + sway * 0.5, 5.5 + rear * 0.5], [3.6 + L, 0.4 + sway, 8 + rear]];
    floor.forEach(([u, v, ht], i) => {
      const p = at(u, v, ht);
      if (!k.back) { seg(p, 1.2 + i * 0.32, depth(u, v)); return; }
      const r = 1.6 + i * 0.35;
      // back view: mid/shadow body, the highlight kept to a 1 px rim on the segment's top
      k.add({ type: 'circle', name: 'ring', underlay: true, mat: c, shade: 'flat', band: 1, cx: p[0], cy: p[1], r }, depth(u, v));
      k.add({ type: 'ellipse', name: 'ring-shade', cx: p[0] + r * 0.2, cy: p[1] + r * 0.45, rx: r * 0.75, ry: r * 0.45, color: 'skin.2' }, depth(u, v) + 0.0005);
      k.add({ type: 'rect', name: 'ring-rim', x: Math.round(p[0] - r * 0.5), y: Math.round(p[1] - r + 0.5), w: Math.max(1, Math.round(r)), h: 1, color: 'skin.0' }, depth(u, v) + 0.001);
    });
    column.forEach(([u, v, rise], i) => {
      const p = at(u, v, htFor(k, u, rise)), r = 2.9 - i * 0.2;
      if (k.back) k.add({ type: 'circle', name: 'ring', underlay: true, mat: c, shade: 'sphere', cx: p[0], cy: p[1], r }, depth(4) + i * 0.1);
      else seg(p, r, depth(4) + i * 0.1);
    });
    const mu = 4 + L * 1.2, m = at(mu, 0.4 + sway, htFor(k, mu, 9.5 + rear + k.P.open));
    if (k.back) k.add({ type: 'ellipse', name: 'mouth-rim', underlay: true, mat: c, shade: 'sphere', cx: m[0], cy: m[1], rx: 3, ry: 2 }, depth(4) + 1);
    else {
      // front: a dark fleshy ring round the maw, lit only on its upper-left lip
      k.add({ type: 'ellipse', name: 'mouth-rim', underlay: true, mat: c, shade: 'flat', band: 2, cx: m[0], cy: m[1], rx: 3, ry: 2 }, depth(4) + 1);
      k.add({ type: 'rect', name: 'lip-hi', x: Math.round(m[0] - 2), y: Math.round(m[1] - 2), w: 2, h: 1, color: 'skin.1' }, depth(4) + 1.05);
    }
    k.add({ type: 'ellipse', name: 'maw', cx: m[0], cy: m[1], rx: 1.6 + k.P.open * 0.6, ry: 0.8 + k.P.open * 0.6, color: k.back ? 'skin.1' : 'outline' }, depth(4) + 1.1);
    if (!k.back) {
      // 1 px light teeth on the maw's inner edge
      const rx = 1.2 + k.P.open * 0.6, ry = 0.5 + k.P.open * 0.6;
      for (const a of [0, 90, 180, 270]) {
        const t = (a * Math.PI) / 180;
        k.add({ type: 'rect', name: 'tooth', x: Math.round(m[0] + Math.cos(t) * rx - 0.5), y: Math.round(m[1] + Math.sin(t) * ry - 0.5), w: 1, h: 1, mat: pal.cloth, shade: 'flat', band: 0 }, depth(4) + 1.2);
      }
    }
  }, { ground: 7 });
}
export const anchors = ctx => groundAnchors(ctx, { head: [4, 0, ctx.facing === 'n' || ctx.facing === 'w' ? 8 : 11.5], hand: [4, 0, ctx.facing === 'n' || ctx.facing === 'w' ? 9.5 : 13] }, { lunge: 4.8, ground: 7 });
