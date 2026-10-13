// family-j base.v2 (r2, from base.v1): a true cube (36 px wide, 38 px tall, ~2.4 m) drawn translucent: mid-band faces
// with the contents (a 6 px skull, bones, a sword) drawn over them as if seen through, and lit rim bands (band 0) on
// the edges, instead of an opaque 52 px pillar with tiny contents.
// family-j base.v1 (r1) — gelatinous cubes (glyph j, 2.4 m): a gelatinous cube on the creature rig
// (art/lib/beast.v1.js) at the large frame: a great quivering cube (a jelly may be boxy) drawn as an iso block a
// cell wide, its faces lighter at the top edge, with bones, a skull and a lost sword floating inside, and a slump
// forward that engulfs in the attack. The jelly is the recoloured ramp (recolour: grass).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-j', pass: 'r2', notes: 'gelatinous cube: iso jelly block, bones and a sword floating inside', mirror: false, recolour: 'grass' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, ground } = k, c = pal.grass, [gx, gy] = ground, L = k.P.lunge * 6;
    const wob = k.state === 'idle' ? k.frame : (k.P.walking ? Math.round(Math.sin(k.P.phase * Math.PI * 2)) : 0);
    const hw = 18 + (k.P.open > 0.5 ? 1 : 0), hh = hw / 2, H = 20 - wob - (k.P.open > 0.5 ? 2 : 0), ox = gx - L * 0.9, oy = gy + L * 0.45;
    const T = [ox, oy - hh - H], E = [ox + hw, oy - H], F = [ox, oy + hh - H], W = [ox - hw, oy - H];
    const top = [T, E, F, W];
    const left = [W, F, [ox, oy + hh], [ox - hw, oy]];
    const right = [F, E, [ox + hw, oy], [ox, oy + hh]];
    // the jelly's body: mid bands, seen through
    k.add({ type: 'poly', name: 'left-face', mat: c, shade: 'flat', band: 1, pts: left }, 0);
    k.add({ type: 'poly', name: 'right-face', mat: c, shade: 'flat', band: 2, pts: right }, 0.1);
    // what it has swallowed, large enough to read, floating inside
    const fy = oy - H * 0.45 + (k.frame % 2) * 0.5;
    k.add({ type: 'capsule', name: 'sword', a: [ox + 3, oy + 2], b: [ox + 11, fy - 9], r: 0.9, mat: pal.cloth, shade: 'flat', band: 0 }, 0.2);
    k.add({ type: 'rect', name: 'guard', x: Math.round(ox + 3), y: Math.round(oy - 2), w: 5, h: 1, mat: pal.leather, shade: 'flat', band: 1 }, 0.21);
    k.add({ type: 'capsule', name: 'bone', a: [ox - 11, oy - 2], b: [ox - 4, oy + 1], r: 1.1, mat: pal.cloth, shade: 'flat', band: 0 }, 0.2);
    k.add({ type: 'capsule', name: 'bone', a: [ox + 7, oy - 1], b: [ox + 14, oy - 5], r: 1, mat: pal.cloth, shade: 'flat', band: 0 }, 0.2);
    k.add({ type: 'path', name: 'skull', mat: pal.cloth, shade: 'flat', band: 0, d: k.smooth([[ox - 7, fy - 4], [ox - 3.5, fy - 3], [ox - 3.5, fy + 0.5], [ox - 5, fy + 2.5], [ox - 8, fy + 2.5], [ox - 10, fy + 0.5], [ox - 10, fy - 3]]) }, 0.22);
    for (const ex of [-9, -6]) k.add({ type: 'rect', name: 'socket', x: Math.round(ox + ex), y: Math.round(fy - 1), w: 2, h: 2, color: 'outline' }, 0.23);
    k.add({ type: 'rect', name: 'teeth', x: Math.round(ox - 8), y: Math.round(fy + 1.5), w: 3, h: 1, color: 'outline' }, 0.23);
    // the top and the lit rims on the edges: the jelly's skin
    k.add({ type: 'poly', name: 'top-face', mat: c, shade: 'flat', band: 0, pts: top }, 0.3);
    const rim = (name, a, b, dx) => k.add({ type: 'poly', name, mat: c, shade: 'flat', band: 0, pts: [a, b, [b[0] + dx, b[1]], [a[0] + dx, a[1]]] }, 0.32);
    rim('rim-left', W, [ox - hw, oy - 1], 2);
    rim('rim-front', F, [ox, oy + hh - 1], -2);
    rim('rim-front-r', F, [ox, oy + hh - 1], 1);
    rim('rim-right', E, [ox + hw, oy - 1], -1);
    k.add({ type: 'poly', name: 'rim-base', mat: c, shade: 'flat', band: 1, pts: [[ox - hw, oy - 1], [ox, oy + hh - 1], [ox + hw, oy - 1], [ox + hw, oy], [ox, oy + hh], [ox - hw, oy]] }, 0.31);
    k.add({ type: 'poly', name: 'top-sheen', mat: pal.cloth, shade: 'flat', band: 0, pts: [[ox - 7, oy - H - hh + 4], [ox - 3, oy - H - hh + 2], [ox, oy - H - hh + 3.5], [ox - 4, oy - H - hh + 5.5]] }, 0.33);
  }, { ground: 12, shadow: false });
}
export const anchors = ctx => groundAnchors(ctx, { head: [0, 0, 29], hand: [6, 0, 14] }, { ground: 12 });
