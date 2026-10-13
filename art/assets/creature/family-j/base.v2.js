// family-j base.v1 (r1) — gelatinous cubes (glyph j, 2.4 m): a gelatinous cube on the creature rig
// (art/lib/beast.v1.js) at the large frame: a great quivering cube (a jelly may be boxy) drawn as an iso block a
// cell wide, its faces lighter at the top edge, with bones, a skull and a lost sword floating inside, and a slump
// forward that engulfs in the attack. The jelly is the recoloured ramp (recolour: grass).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-j', pass: 'r1', notes: 'gelatinous cube: iso jelly block, bones and a sword floating inside', mirror: false, recolour: 'grass' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, ground } = k, c = pal.grass, [gx, gy] = ground, L = k.P.lunge * 6;
    const wob = k.state === 'idle' ? k.frame : (k.P.walking ? Math.round(Math.sin(k.P.phase * Math.PI * 2)) : 0);
    const hw = 15 + (k.P.open > 0.5 ? 1 : 0), hh = 7.5, H = 36 - wob - (k.P.open > 0.5 ? 3 : 0), ox = gx - L * 0.9, oy = gy + L * 0.45;
    const top = [[ox, oy - hh - H], [ox + hw, oy - H], [ox, oy + hh - H], [ox - hw, oy - H]];
    const left = [[ox - hw, oy - H], [ox, oy + hh - H], [ox, oy + hh], [ox - hw, oy]];
    const right = [[ox, oy + hh - H], [ox + hw, oy - H], [ox + hw, oy], [ox, oy + hh]];
    k.add({ type: 'poly', name: 'left-face', mat: c, shade: 'flat', band: 1, pts: left }, 0);
    k.add({ type: 'poly', name: 'right-face', mat: c, shade: 'flat', band: 2, pts: right }, 0.1);
    k.add({ type: 'circle', name: 'skull', mat: pal.cloth, shade: 'sphere', cx: ox - 5, cy: oy - 14, r: 3 }, 0.2);
    k.add({ type: 'rect', name: 'socket', x: Math.round(ox - 6.5), y: Math.round(oy - 14.5), w: 3, h: 1, color: 'outline' }, 0.21);
    k.add({ type: 'capsule', name: 'bone', a: [ox + 3, oy - 20], b: [ox + 9, oy - 12], r: 0.9, mat: pal.cloth, shade: 'cyl' }, 0.2);
    k.add({ type: 'capsule', name: 'bone', a: [ox - 9, oy - 6], b: [ox - 3, oy - 4], r: 0.8, mat: pal.cloth, shade: 'cyl' }, 0.2);
    k.add({ type: 'capsule', name: 'sword', a: [ox + 2, oy - 4], b: [ox + 10, oy - 26], r: 0.7, mat: pal.cloth, shade: 'flat', band: 0 }, 0.2);
    k.add({ type: 'poly', name: 'top-face', mat: c, shade: 'flat', band: 0, pts: top }, 0.3);
    k.add({ type: 'poly', name: 'top-sheen', mat: pal.cloth, shade: 'flat', band: 0, pts: [[ox - 6, oy - H - 1], [ox - 2, oy - H - 3], [ox + 1, oy - H - 1.5], [ox - 3, oy - H + 0.5]] }, 0.31);
  }, { ground: 10, shadow: false });
}
export const anchors = ctx => groundAnchors(ctx, { head: [0, 0, 36], hand: [6, 0, 18] }, { ground: 10 });
