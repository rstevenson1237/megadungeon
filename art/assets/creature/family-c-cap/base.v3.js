// family-c-cap base.v3 (r3) — from base.v2, ONE change (review: every stone sat in the same mid step with even light
// edges, so at 1x the mass was a flat noisy grid with no top-left light or volume): shading. Each stone is now flat
// mid step with its own light step on the top/left face and the dark step on the right/bottom (the stone minus itself
// shifted), instead of an even bevel; the arm's two stones become one, so each forearm and each shin has one seam.
//
// family-c-cap base.v2 (r2) — from base.v1, ONE change (review: read as a toy robot, not stone — smooth single-tone
// slabs, the head perched on top, a red cross for a rune): the body is rebuilt in irregular dressed stones. Every part
// (thighs, shins, the chest's three courses, shoulder blocks, upper arms, forearms, fists, the head) is a slightly
// skewed stone with one chipped corner, laid over a dark mortar core so 1px seams show between them, with a few light
// chips on the edges; the head sinks between shoulder blocks raised above its jaw; the cross becomes an angular carved
// rune (a stave with two pairs of slanted branches).
//
// base.v1 (r1) — golems and constructs (glyph C, 3 m): a stone golem on the biped rig
// (art/lib/beast.v1.js) at the large frame: built of stacked dressed blocks (a construct may be boxy), a small
// square head with two glowing slits sunk between great shoulder blocks, a carved rune on the chest, columnar legs and
// arms of fitted stones ending in heavy block fists. The stone is the recoloured ramp (recolour: cloth).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-c-cap', pass: 'r3', notes: 'stones lit top-left and shaded bottom-right; one seam per forearm and shin', mirror: false, recolour: 'cloth' };
const H = 3;
// fixed jitter so every frame and facing lays the same stones
const J = [0.4, -0.3, 0.5, -0.5, 0.2, 0.6, -0.4, 0.3, -0.6, 0.1, 0.5, -0.2];
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, foot, P } = k, c = pal.cloth;
    let n = 0;
    // a dressed stone between x0..x1, y0..y1 (px), skewed by the jitter, one corner chipped off
    const stone = (name, x0, y0, x1, y1, chip = n % 4) => {
      const j = i => X(J[(n * 3 + i) % J.length]);
      const c0 = [x0 + j(0), y0], c1 = [x1, y0 + j(1)], c2 = [x1 - j(2), y1], c3 = [x0, y1 - j(0) * 0.5];
      const corners = [c0, c1, c2, c3], cut = X(1.1), pts = [];
      corners.forEach((p, i) => {
        if (i !== chip) { pts.push(p); return; }
        const prev = corners[(i + 3) % 4], next = corners[(i + 1) % 4];
        const toward = (q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
        const lp = Math.hypot(prev[0] - p[0], prev[1] - p[1]), ln = Math.hypot(next[0] - p[0], next[1] - p[1]);
        pts.push(toward(prev, cut / lp), toward(next, cut / ln));
      });
      n++;
      // lit from the top left: the light face is the stone minus itself shifted down-right, the dark face the reverse
      const sh = (dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]), t = 2;
      k.add({ type: 'poly', name, underlay: true, mat: c, shade: 'flat', band: 1, pts });
      k.add({ type: 'subtract', name: name + '-lit', mat: c, shade: 'flat', band: 0, shapes: [{ type: 'poly', pts }, { type: 'poly', pts: sh(t, t) }] });
      k.add({ type: 'subtract', name: name + '-shade', mat: c, shade: 'flat', band: 2, shapes: [{ type: 'poly', pts }, { type: 'poly', pts: sh(-t, -t) }] });
    };
    const chipAt = (x, y) => k.add({ type: 'rect', name: 'chip', x: Math.round(x), y: Math.round(y), w: 1, h: 1, color: 'cloth.0' });
    const mortar = (name, x, y, w, h) => k.add({ type: 'rect', name, x, y, w, h, mat: c, shade: 'flat', band: 2 });

    // legs: a thigh stone and a shin stone each, over a mortar core
    P.feet.forEach((dy, i) => {
      const x = i ? k.baseCx + X(1.2) : k.baseCx - X(5.2), dd = dy * Math.max(1, Math.round(k.u));
      mortar('leg-core', x + X(0.4), waist + Y(1), X(3.6), foot - waist - Y(1) + dd);
      stone('thigh', x, waist + Y(1), x + X(4), knee + Y(0.2));
      stone('shin', x - X(0.4), knee + Y(0.8), x + X(4.4), foot + dd);
    });
    // the chest in three courses of stones
    const top = shoulder - Y(1), bot = waist + Y(1.5);
    mortar('core', cx - X(6), top, X(12), bot - top);
    const r1 = shoulder + Y(3), r2 = shoulder + Y(6);
    stone('chest', cx - X(6.2), top, cx - X(0.3), r1 - Y(0.6));
    stone('chest', cx + X(0.3), top, cx + X(6.2), r1 - Y(0.6));
    stone('chest', cx - X(5.8), r1, cx - X(2.2), r2 - Y(0.6));
    stone('chest', cx - X(1.6), r1, cx + X(2.4), r2 - Y(0.6));
    stone('chest', cx + X(3), r1, cx + X(5.8), r2 - Y(0.6));
    stone('hip', cx - X(5.4), r2, cx + X(0.4), bot);
    stone('hip', cx + X(1), r2, cx + X(5.4), bot);
    chipAt(cx - X(4.5), top + 1); chipAt(cx + X(2.4), r1 + 1); chipAt(cx - X(3.5), r2 + 1);
    // the carved rune: a stave with two pairs of slanted branches, cut into the middle chest stone
    k.front(() => {
      const rx = cx + X(0.4) + k.turn, ry = r1 + Y(0.3), rh = Y(2.2), b = X(1.1), t = 1;
      const bar = (x0, y0, x1, y1) => k.add({ type: 'poly', name: 'rune', color: 'accent.1', pts: [[x0, y0], [x0 + t, y0], [x1 + t, y1], [x1, y1]] });
      bar(rx, ry, rx, ry + rh);
      bar(rx - b, ry, rx, ry + Y(0.9)); bar(rx + b, ry, rx, ry + Y(0.9));
      bar(rx, ry + Y(1.2), rx - b, ry + rh); bar(rx, ry + Y(1.2), rx + b, ry + rh);
    });
    // the head: a rough stone sunk low, its jaw below the shoulder blocks' tops
    const hy = headY + Y(2.6);
    stone('head', cx - X(2.8), hy - Y(2.4), cx + X(2.8), hy + Y(2.6), 1);
    k.front(() => [-1.4, 1.4].forEach(e => k.add({ type: 'rect', name: 'slit', x: Math.round(cx + X(e) - X(0.6) + k.turn), y: Math.round(hy), w: Math.round(X(1.2)), h: 1, color: 'accent.0' })));
    // arms: a raised shoulder block, an upper-arm stone, a forearm stone and a block fist
    for (const [side, fn] of [[-1, k.main], [1, k.off]]) fn(() => {
      const sx = cx + side * X(7.2);
      mortar('arm-core', sx - X(1.4), shoulder, X(2.8), waist - shoulder + Y(3));
      stone('arm', sx - X(1.6), shoulder + Y(2), sx + X(1.6), waist + Y(0.8));
      stone('fist', sx - X(2.3), waist + Y(1), sx + X(2.3), waist + Y(4.6));
      stone('shoulder', sx - X(2.9) + side * X(0.3), shoulder - Y(4.2), sx + X(2.9) + side * X(0.3), shoulder + Y(1.6), side < 0 ? 0 : 1);
      chipAt(sx - X(1.5), shoulder - Y(3.6)); chipAt(sx + X(0.8), waist + Y(1.4));
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.cx - L.X(7.2), L.waist + L.Y(2.5)] });
