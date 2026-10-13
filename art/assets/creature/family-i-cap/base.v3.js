// family-i-cap base.v3 (r3, from base.v2): the members are redrawn as eight separate 5 x 4 px wasps with a 1 px gap
// between outlines, each a pale wing pair over a dark-banded accent abdomen, drifting by rows.
// family-i-cap base.v2 (r2, from base.v1): seven larger wasps instead of a dozen specks, each a sphere-shaded head,
// thorax and striped abdomen with wings lit top-left (band 0), hovering 5 px and more above a detached shadow.
// family-i-cap base.v1 (r1) — insect swarms (glyph I, a cloud about 1.2 m high): a swarm of giant wasps on the
// creature rig (art/lib/beast.v1.js): a loose drifting cloud of a dozen striped wasps with clear wings, the biggest
// in front, shifting each frame; the cloud surges forward in the attack. The bodies are the recoloured ramp
// (recolour: accent).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-i-cap', pass: 'r3', notes: 'wasp swarm: eight small separate wasps in a drifting cloud', mirror: false, recolour: 'accent' };
// the swarm in screen px from the frame's centre: three loose rows, 9 px apart in a row and 9 px between rows, so
// each 5 x 4 px wasp keeps its own outline and a 1 px gap to the next; each row drifts as one
const WASPS = [[-12, -14], [-3, -15], [6, -13], [-10, -5], [-1, -6], [8, -4], [-6, 4], [3, 3]];
// one wasp, heading left: [dx, dy, token]; the wings beat (two pixels tall up, one down)
const BODY = [[0, 1, 'accent.2'], [1, 1, 'accent.1'], [2, 1, 'accent.0'], [3, 1, 'outline'], [4, 1, 'accent.1'], [2, 2, 'accent.1'], [3, 2, 'outline'], [4, 2, 'accent.2']];
export function render(ctx) {
  return creature(ctx, k => {
    const f = k.frame, L = k.P.lunge * 8, [w, h] = ctx.size, ox = w / 2 + k.F[0] * L * 0.5, oy = 20 + k.F[1] * L;
    WASPS.forEach(([dx, dy], i) => {
      const row = Math.floor(i / 3), jx = [[0, 1, 0, -1], [1, 0, -1, 0], [-1, 0, 1, 0]][row][f % 4], jy = [[0, -1, 0, 1], [0, 1, 0, -1], [1, 0, -1, 0]][row][f % 4];
      const x = Math.round(ox + dx + jx), y = Math.round(oy + dy + jy), up = (f + i) % 2 === 0;
      const wings = up ? [[1, -1], [1, 0], [3, -1], [3, 0]] : [[1, 0], [3, 0]];
      k.add({ type: 'group', name: 'wasp', underlay: true, children: [
        ...wings.map(([px, py]) => ({ type: 'rect', name: 'wing', x: x + px, y: y + py, w: 1, h: 1, color: 'cloth.0' })),
        ...BODY.map(([px, py, t]) => ({ type: 'rect', name: 'body', x: x + px, y: y + py, w: 1, h: 1, color: t })),
      ] }, i);
    });
  }, { ground: 6, shadow: { rx: 9 } });
}
export const anchors = ctx => groundAnchors(ctx, { head: [0, 0, 12], hand: [3, 0, 10] }, { lunge: 8 });
