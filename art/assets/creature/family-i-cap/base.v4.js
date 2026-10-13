// family-i-cap base.v4 (x1, from base.v3): the blind re-score's point — the swarm is now a loose cloud of wasps in
// three sizes (two large in front, three medium, three small behind) at irregular depths, each a real wasp shape
// (head with eye, thorax, pinched waist, a dark-striped abdomen and a stinger), each jittering on its own every
// frame; the back views draw the wings spread over the body and no eye, so the facings differ.
// family-i-cap base.v3 (r3, from base.v2): the members are redrawn as eight separate 5 x 4 px wasps with a 1 px gap
// between outlines, each a pale wing pair over a dark-banded accent abdomen, drifting by rows.
// family-i-cap base.v2 (r2, from base.v1): seven larger wasps instead of a dozen specks, each a sphere-shaded head,
// thorax and striped abdomen with wings lit top-left (band 0), hovering 5 px and more above a detached shadow.
// family-i-cap base.v1 (r1) — insect swarms (glyph I, a cloud about 1.2 m high): a swarm of giant wasps on the
// creature rig (art/lib/beast.v1.js): a loose drifting cloud of a dozen striped wasps with clear wings, the biggest
// in front, shifting each frame; the cloud surges forward in the attack. The bodies are the recoloured ramp
// (recolour: accent).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-i-cap', pass: 'x1', notes: 'wasp swarm: a loose cloud of striped, stinging wasps in three sizes', mirror: false, recolour: 'accent' };
// pixel templates, heading left (head at the left, stinger at the right); front = seen from the side and below,
// back = seen from above and behind (wings spread over the thorax, no eye)
const T = {
  L: {
    front: ['..ww......', '.wwvw.....', 'hetwaakak.', 'hhttbkbkbs', '.l.l.ckc..'],
    back: ['.www......', 'wwvvw.....', 'hwwvwakak.', 'hhttbkbkbs', '.l.l.ckc..'],
  },
  M: {
    front: ['..wv.....', 'hetwakak.', 'httbbkbks', '.l..ck...'],
    back: ['.wwv.....', 'hwvwakak.', 'httbbkbks', '.l..ck...'],
  },
  S: {
    front: ['.ww...', 'htakas', '.tbkb.'],
    back: ['www...', 'hwakas', '.tbkb.'],
  },
};
const TOK = { w: 'cloth.0', v: 'cloth.1', h: 'accent.2', e: 'outline', t: 'accent.1', a: 'accent.0', b: 'accent.1', c: 'accent.2', k: 'outline', s: 'outline', l: 'outline' };
// the cloud: [size, dx, dy] of each wasp's top-left from the frame's centre point, irregular, small ones behind
const FRONT = [['S', -9, -17], ['S', 6, -14], ['M', -4, -11], ['M', -14, -6], ['M', 3, -3], ['S', -6, -1], ['L', -13, 4], ['L', 1, 7]];
const BACK = [['S', 4, -18], ['S', -11, -13], ['M', 0, -11], ['M', 6, -5], ['M', -13, -3], ['S', -3, -2], ['L', -9, 6], ['L', 4, 4]];
// each wasp's own jitter per frame (px), so no two move together
const JX = [[0, 1, -1, 2], [1, -1, 0, -2], [-1, 0, 2, 1], [2, 0, -1, -1], [0, -2, 1, 0], [-1, 1, 1, -2], [1, 2, 0, -1], [-2, 0, -1, 1]];
const JY = [[1, 0, -1, 0], [0, -1, 1, 1], [-1, 1, 0, -1], [0, 1, -1, 1], [1, -1, 0, 0], [-1, 0, 1, -1], [0, -1, 1, 0], [1, 0, 0, -1]];
export function render(ctx) {
  return creature(ctx, k => {
    const f = k.frame % 4, L = k.P.lunge * 8, [w] = ctx.size, ox = w / 2 + k.F[0] * L * 0.5, oy = 20 + k.F[1] * L;
    (k.back ? BACK : FRONT).forEach(([sz, dx, dy], i) => {
      const rows = T[sz][k.back ? 'back' : 'front'], x0 = Math.round(ox + dx + JX[i][f]), y0 = Math.round(oy + dy + JY[i][f]);
      const up = (f + i) % 2 === 0, children = [];
      rows.forEach((row, ry) => [...row].forEach((ch, rx) => {
        if (ch === '.') return;
        // the wings beat: on the down stroke the top wing row sweeps back one pixel
        const xx = !up && (ch === 'w' || ch === 'v') && ry === 0 ? 1 : 0;
        children.push({ type: 'rect', name: ch === 'w' || ch === 'v' ? 'wing' : 'body', x: x0 + rx + xx, y: y0 + ry, w: 1, h: 1, color: TOK[ch] });
      }));
      k.add({ type: 'group', name: 'wasp', underlay: true, children }, y0 + rows.length);
    });
  }, { ground: 6, shadow: { rx: 10 } });
}
export const anchors = ctx => groundAnchors(ctx, { head: [0, 0, 12], hand: [3, 0, 10] }, { lunge: 8 });
