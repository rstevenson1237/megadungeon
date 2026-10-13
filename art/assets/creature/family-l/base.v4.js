// family-l base.v4 (x1) — from base.v2, one change (the blind reviewer's): the lizard's form is redrawn from scratch,
// because v1-v3 read as a dog on table legs. A long low body about 2.5:1 long to tall with the belly 1 px off the
// floor; a wedge head (skull and a separate lower jaw, so a jaw line shows) with a dark eye at the front end in every
// frame; four thin legs whose upper segment runs out sideways nearly level to an elbow (front legs) or knee (hind legs)
// wide of the body, and whose lower segment bends down to a foot planted wide of the body; and a curved tail as long as
// the body, tapering to a point on the floor. The ground-frame drawing serves both views, so n/w is the same lizard
// from behind, tail nearest the viewer. The crest spikes and the dewlap are gone (they made a dog's back and chest).
// base.v2 (r2) — the pose rebuilt low on elbows-out legs. base.v1 (r1) — lizards, frogs and lizardmen (glyph l,
// 1.0 m) on the creature rig (art/lib/beast.v1.js). The scales are the recoloured ramp (recolour: grass).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-l', pass: 'x1', notes: 'cave lizard redrawn: long low body, sprawled bent legs, wedge head with eye, long tapering tail', mirror: false, recolour: 'grass' };
const GROUND = 8, LUNGE = 4;
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth, step, smooth } = k, c = pal.grass, L = k.P.lunge * LUNGE, open = k.P.open;
    // one smooth silhouette from the tail tip to the snout, offset round a spine in the ground frame: a curved tail as
    // long as the body tapering to a point on the floor, a long low body (belly 1 px off the floor), a short neck and
    // a flat wedge head. [u along the heading, v sideways, h height of the spine, half-thickness]
    const spine = [[-15, -1.6, 0.3, 0.3], [-12.8, 0.4, 0.5, 0.7], [-10.4, 2, 1, 1.1], [-7.8, 2.2, 1.9, 1.5], [-5.6, 1, 2.9, 2.2],
      [-3, 0, 3.5, 3], [0, 0, 3.7, 3.2], [2.6, 0, 3.9, 2.9], [4.6, 0, 4.6, 1.7], [6.6, 0, 5.4, 2.5], [9, 0, 5, 2.3], [11.2, 0, 4.2, 1.5], [12.8, 0, 3.6, 0.5]];
    const pts = spine.map(([u, v, h]) => at(u + L, v, h)), top = [], bot = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1;
      let nx = dy / n, ny = -dx / n; if (ny > 0) { nx = -nx; ny = -ny; }
      const r = spine[i][3];
      top.push([p[0] + nx * r, p[1] + ny * r]); bot.push([p[0] - nx * r, p[1] - ny * r]);
    });
    const outline = [...top, ...bot.reverse()];
    // sprawled legs: the upper segment runs out sideways nearly level to an elbow (front, pointing back) or a knee
    // (hind, pointing forward) wide of the body; the lower segment bends down to a foot planted wide of the body
    const legs = [];
    for (const [u, v, ph, eu, fu] of [[3.4, -1, 0, -0.8, 0.6], [2.6, 1, 0.5, -2.2, -1], [-3.6, -1, 0.5, 0.8, -0.6], [-3.6, 1, 0, 0.8, -0.6]]) {
      const s = step(ph, 1.6, 1.2);
      const hip = at(u + L, v * 1.6, 3.2), elbow = at(u + eu + L + s.du * 0.4, v * (v > 0 ? 5.6 : 7), (v > 0 ? 2.4 : 3.7) + s.dh * 0.5), foot = at(u + fu + L + s.du, v * 7.4, s.dh);
      const toe = at(u + fu + L + s.du + (fu > 0 ? 0.6 : -0.6), v * 8.8, s.dh);
      legs.push({ v, hip, elbow, foot, toe, d: depth(u + L, v * 5) });
    }
    for (const g of legs.filter(g => g.v > 0)) {
      k.add({ type: 'capsule', name: 'upper-leg', underlay: true, mat: c, shade: 'flat', band: 2, a: g.hip, b: g.elbow, r: 1.2, r1: 1 }, -100 + g.d);
      k.add({ type: 'capsule', name: 'lower-leg', underlay: true, mat: c, shade: 'flat', band: 2, a: g.elbow, b: g.foot, r: 1, r1: 0.8 }, -100 + g.d + 0.01);
    }
    k.add({ type: 'path', name: 'body', underlay: true, mat: c, shade: 'normal', round: 2.5, d: smooth(outline) }, 0);
    for (const g of legs.filter(g => g.v < 0)) {
      k.add({ type: 'capsule', name: 'upper-leg', underlay: true, mat: c, shade: 'cyl', a: g.hip, b: g.elbow, r: 1.3, r1: 1.1 }, 100 + g.d);
      k.add({ type: 'capsule', name: 'lower-leg', underlay: true, mat: c, shade: 'cyl', a: g.elbow, b: g.foot, r: 1.1, r1: 0.85 }, 100 + g.d + 0.01);
      k.add({ type: 'capsule', name: 'foot', underlay: true, mat: c, shade: 'flat', band: 1, a: g.foot, b: g.toe, r: 0.75 }, 100 + g.d + 0.02);
    }
    // the head: a flat wedge of its own over the neck, so the head end reads apart from the body
    k.add({ type: 'path', name: 'head', mat: c, shade: 'normal', round: 1.2, d: smooth([at(5.4 + L, -0.6, 6.4), at(7.6 + L, -0.6, 7.2), at(10.4 + L, -0.4, 6.2), at(13.6 + L, 0, 4.2), at(13.4 + L, 0, 3.3), at(10 + L, 0, 2.9), at(7 + L, 0, 3), at(5 + L, 0, 3.8)]) }, 150);
    // the mouth: in the attack the lower jaw drops open and the tongue flicks
    const dot = (p, color, name) => k.add({ type: 'rect', name, x: Math.round(p[0]), y: Math.round(p[1]), w: 1, h: 1, color }, 300);
    if (open > 0.5) {
      const dr = open * 1.8;
      k.add({ type: 'path', name: 'jaw', underlay: true, mat: c, shade: 'flat', band: 2, d: smooth([at(7.5 + L, 0, 2.6), at(11 + L, 0, 2.6 - dr), at(12.4 + L, 0, 2.4 - dr), at(11 + L, 0, 1.6 - dr), at(7.5 + L, 0, 1.6)]) }, 200);
      k.add({ type: 'poly', name: 'gape', color: 'outline', pts: [at(8 + L, 0, 3), at(12.6 + L, 0, 3.1), at(12.4 + L, 0, 2.5 - dr), at(8.5 + L, 0, 2.5)] }, 210);
      if (open > 0.8) k.add({ type: 'tube', name: 'tongue', mat: pal.accent, shade: 'flat', band: 1, pts: [at(11 + L, 0, 2.6 - dr / 2), at(13.2 + L, 0, 2.2 - dr / 2), at(14.4 + L, 0, 2.8 - dr / 2)], w: 0.9 }, 220);
    }
    // the eye, dark, high on the near side of the skull toward the front: in every facing it marks the head end
    dot(at(10.4 + L, -0.8, 5.6), 'outline', 'eye');
  }, { ground: GROUND });
}
export const anchors = ctx => groundAnchors(ctx, { head: [10, 0, 6], hand: [12.5, 0, 2.5] }, { lunge: LUNGE, ground: GROUND });
