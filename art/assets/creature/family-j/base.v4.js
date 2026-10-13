// family-j base.v4 (x1, from base.v3): the blind re-score's point, translucency - the hidden back floor edges show
// through the body as light lines, the deep lower band is the ramp's dark step instead of near-black ink, a long
// glossy wet streak runs down the lit face and the top's sheen is larger, and the skull is half again as large
// (a 10 px cranium with square sockets, a nose hole and a row of teeth) so the contents read.
// family-j base.v3 (r3, from base.v2): the body is translucent jelly - darker mid fill, the floor-dark showing through
// the lower half of the side faces, a soft light rim only on the top's edges, sagging rounded bottom corners - and the
// block is scaled up toward the 2.4 m box (40 px wide, 34 px sides).
// family-j base.v2 (r2, from base.v1): a true cube (36 px wide, 38 px tall, ~2.4 m) drawn translucent: mid-band faces
// with the contents (a 6 px skull, bones, a sword) drawn over them as if seen through, and lit rim bands (band 0) on
// the edges, instead of an opaque 52 px pillar with tiny contents.
// family-j base.v1 (r1) — gelatinous cubes (glyph j, 2.4 m): a gelatinous cube on the creature rig
// (art/lib/beast.v1.js) at the large frame: a great quivering cube (a jelly may be boxy) drawn as an iso block a
// cell wide, its faces lighter at the top edge, with bones, a skull and a lost sword floating inside, and a slump
// forward that engulfs in the attack. The jelly is the recoloured ramp (recolour: grass).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-j', pass: 'x1', notes: 'gelatinous cube: iso jelly block, bones and a sword floating inside', mirror: false, recolour: 'grass' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, ground } = k, c = pal.grass, [gx, gy] = ground, L = k.P.lunge * 6;
    const wob = k.state === 'idle' ? k.frame : (k.P.walking ? Math.round(Math.sin(k.P.phase * Math.PI * 2)) : 0);
    const hw = 20 + (k.P.open > 0.5 ? 1 : 0), hh = hw / 2, H = 34 - wob - (k.P.open > 0.5 ? 2 : 0), ox = gx - L * 0.9, oy = gy + L * 0.45;
    const T = [ox, oy - hh - H], E = [ox + hw, oy - H], F = [ox, oy + hh - H], W = [ox - hw, oy - H];
    const top = [T, E, F, W];
    // the side faces, their bottom edges sagging and the bottom corners rounded and bulging out a little
    const face = sd => `M${W[0] * (sd < 0) + E[0] * (sd > 0)} ${W[1]} L${F[0]} ${F[1]} L${ox} ${oy + hh - 1} Q${ox + sd * hw / 2} ${oy + hh / 2 + 2.5} ${ox + sd * (hw - 2)} ${oy + 1.2} Q${ox + sd * (hw + 1)} ${oy + 0.5} ${ox + sd * (hw + 0.8)} ${oy - 2.5} Z`;
    // the lower part of each face, below the jelly's middle, where the dark floor shows through
    const lower = sd => ({ type: 'poly', pts: [...Array.from({ length: 9 }, (_, i) => { const t = 1 - i / 8; return [ox + sd * (hw + 2) * t, oy - H * 0.45 + hh * (1 - t) + Math.sin(t * Math.PI * 2.5 + k.frame) * 1.5 + t * 3]; }), [ox, oy + hh + 6], [ox + sd * (hw + 2), oy + 6]] });
    // the jelly's body: darker mid fill above, darker still below where the floor shows through
    k.add({ type: 'path', name: 'left-face', underlay: true, d: face(-1), color: 'grass.1' }, 0);
    k.add({ type: 'group', name: 'left-deep', clip: lower(-1), children: [{ type: 'path', name: 'left-deep', d: face(-1), color: 'grass.2' }] }, 0.01);
    k.add({ type: 'path', name: 'right-face', underlay: true, d: face(1), color: 'grass.2' }, 0.1);
    k.add({ type: 'group', name: 'right-deep', clip: lower(1), children: [{ type: 'path', name: 'right-deep', d: face(1), color: 'grass.2' }] }, 0.11);
    // what it has swallowed, large enough to read, floating inside
    const fy = oy - H * 0.45 + (k.frame % 2) * 0.5;
    k.add({ type: 'capsule', name: 'sword', a: [ox + 3, oy + 2], b: [ox + 11, fy - 9], r: 0.9, mat: pal.cloth, shade: 'flat', band: 0 }, 0.2);
    k.add({ type: 'rect', name: 'guard', x: Math.round(ox + 3), y: Math.round(oy - 2), w: 5, h: 1, mat: pal.leather, shade: 'flat', band: 1 }, 0.21);
    k.add({ type: 'capsule', name: 'bone', a: [ox - 11, oy - 2], b: [ox - 4, oy + 1], r: 1.1, mat: pal.cloth, shade: 'flat', band: 0 }, 0.2);
    k.add({ type: 'capsule', name: 'bone', a: [ox + 7, oy - 1], b: [ox + 14, oy - 5], r: 1, mat: pal.cloth, shade: 'flat', band: 0 }, 0.2);
    // the cube's hidden back floor edges, seen through the jelly
    const B = [ox, oy - hh];
    k.add({ type: 'line', name: 'back-edge', x0: B[0], y0: B[1], x1: ox - hw + 1, y1: oy - 0.5, w: 1, color: 'grass.0' }, 0.15);
    k.add({ type: 'line', name: 'back-edge', x0: B[0], y0: B[1], x1: ox + hw - 1, y1: oy - 0.5, w: 1, color: 'grass.1' }, 0.15);
    // a larger skull: cranium, square sockets, nose hole and a row of teeth
    const sx = ox - 9, sy = fy - 3;
    k.add({ type: 'path', name: 'skull', underlay: true, mat: pal.cloth, shade: 'flat', band: 0, d: k.smooth([[sx, sy - 6], [sx + 4.5, sy - 5], [sx + 5.5, sy - 0.5], [sx + 3.5, sy + 2.5], [sx + 3.5, sy + 5], [sx - 3.5, sy + 5], [sx - 3.5, sy + 2.5], [sx - 5.5, sy - 0.5], [sx - 4.5, sy - 5]]) }, 0.22);
    for (const ex of [-4, 1]) k.add({ type: 'rect', name: 'socket', x: Math.round(sx + ex), y: Math.round(sy - 1), w: 3, h: 2, color: 'outline' }, 0.23);
    k.add({ type: 'rect', name: 'nose', x: Math.round(sx), y: Math.round(sy + 2), w: 1, h: 1, color: 'outline' }, 0.23);
    for (const tx of [-2, 0, 2]) k.add({ type: 'rect', name: 'teeth', x: Math.round(sx + tx), y: Math.round(sy + 4), w: 1, h: 1, color: 'outline' }, 0.23);
    // a glossy wet streak down the lit face, sagging with the jelly
    k.add({ type: 'path', name: 'gloss', color: 'grass.0', d: `M${ox - hw + 2} ${oy - H + 3} Q${ox - hw + 3} ${oy - H * 0.5} ${ox - hw + 2.5} ${oy - 6} L${ox - hw + 3.6} ${oy - 7} Q${ox - hw + 4.2} ${oy - H * 0.5} ${ox - hw + 3.4} ${oy - H + 4} Z` }, 0.24);
    // the top: mid fill with a soft light rim only along its edges (the jelly's skin catching the light)
    k.add({ type: 'poly', name: 'top-face', underlay: true, pts: top, color: 'grass.1' }, 0.3);
    k.add({ type: 'group', name: 'top-rim', clip: { type: 'poly', pts: top }, children: [
      { type: 'poly', name: 'rim-near', pts: [W, F, E, [E[0], E[1] - 1.5], [F[0], F[1] - 1.5], [W[0], W[1] - 1.5]], color: 'grass.0' },
      { type: 'poly', name: 'rim-back', pts: [W, T, E, [E[0], E[1] + 1], [T[0], T[1] + 1], [W[0], W[1] + 1]], color: 'grass.0' },
    ] }, 0.31);
    k.add({ type: 'poly', name: 'top-sheen', mat: pal.cloth, shade: 'flat', band: 0, pts: [[ox - 10, oy - H - hh + 7], [ox - 4, oy - H - hh + 4], [ox + 1, oy - H - hh + 5.5], [ox - 5, oy - H - hh + 8.5]] }, 0.33);
  }, { ground: 12, shadow: false });
}
export const anchors = ctx => groundAnchors(ctx, { head: [0, 0, 42], hand: [6, 0, 14] }, { ground: 12 });
