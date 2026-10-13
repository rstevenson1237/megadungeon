// family-a-cap base.v3 (r3, from base.v2) — ONE change, the reviewer's "attack frames barely differ from idle": the
// attack now builds to the contact frame (by the pose's `open`, 1 at contact): the maw opens 3 px wider and 2 px deeper,
// a heavy upper lid of hide slants down over the great eye to narrow it, and the stalks splay wider and lunge forward.
// family-a-cap base.v2 (r2, from base.v1) — ONE change, the reviewer's "too small and too friendly": the orb is scaled
// up 1.5x (radius 11 -> 16, eye, stalks and face with it), it hovers with a ~7 px gap over a ground shadow now pinned to
// the floor point (was auto, under the lowest pixel), and the 3-dot smile is replaced by a wide dark maw across the
// orb's lower third with six jagged light fangs.
// base.v1 (r1) — aberrations: eye tyrants and mind horrors (glyph A, 2.2 m): an eye tyrant on the
// creature rig (art/lib/beast.v1.js) at the large frame, floating with its shadow on the floor below: a great round
// body with one huge central eye, a wide fanged mouth under it, and a crown of writhing stalks each tipped with a small
// eye. The hide is the recoloured ramp (recolour: skin).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-a-cap', pass: 'r3', notes: 'eye tyrant: bigger floating orb, one great eye, wide fanged maw, eye stalks', mirror: false, recolour: 'skin' };
const S = 1.5; // the v2 scale-up of the orb and everything on it
export function render(ctx) {
  const [w, h] = ctx.size;
  return creature(ctx, k => {
    const { pal, at, F } = k, c = pal.skin, L = k.P.lunge * 6, hov = 12 + (k.state === 'idle' ? k.frame : 0) + (k.P.walking ? Math.round(Math.sin(k.P.phase * Math.PI * 2)) : 0);
    const r = 11 * S, o = at(L, 0, hov + r), face = [o[0] + F[0] * 4 * S, o[1] + (k.back ? -3 : 2) * S];
    const wig = i => (k.P.walking ? Math.sin(k.P.phase * Math.PI * 2 + i) : (k.state === 'idle' ? k.frame * 0.5 : 0)) * 1.5 * S;
    const hit = k.state === 'attack' ? k.P.open : 0; // the attack's build, 1 at the contact frame
    const stalks = [-50, -25, 0, 25, 50].map((a, i) => { const t = (a * (1 + 0.25 * hit) - 90) * Math.PI / 180; return [o[0] + Math.cos(t) * (r - 3), o[1] + Math.sin(t) * (r - 3), o[0] + Math.cos(t) * (r + 7 * S) + wig(i) + F[0] * hit * 2.5 * S, o[1] + Math.sin(t) * (r + 7 * S) - 2 + hit * 3 * S]; });
    if (k.back) { k.add({ type: 'circle', name: 'body', underlay: true, mat: c, shade: 'sphere', cx: o[0], cy: o[1], r }, 1); }
    stalks.forEach(([x0, y0, x1, y1], i) => {
      k.add({ type: 'tube', name: 'stalk', underlay: true, mat: c, shade: 'cyl', pts: [[x0, y0], [(x0 + x1) / 2 + wig(i + 1), (y0 + y1) / 2 - 1], [x1, y1]], w: 2 * S, w1: 1.4 * S }, k.back ? 2 : 0);
      k.add({ type: 'circle', name: 'stalk-eye', underlay: true, mat: pal.cloth, shade: 'sphere', cx: x1, cy: y1, r: 1.6 * S }, k.back ? 2.1 : 0.1);
      if (!k.back) k.add({ type: 'rect', name: 'pupil', x: Math.round(x1 - 0.5), y: Math.round(y1), w: 1, h: 1, color: 'outline' }, 0.2);
    });
    if (!k.back) {
      k.add({ type: 'circle', name: 'body', underlay: true, mat: c, shade: 'sphere', cx: o[0], cy: o[1], r }, 1);
      k.add({ type: 'ellipse', name: 'eye', underlay: true, mat: pal.cloth, shade: 'sphere', cx: face[0], cy: face[1] - 3 * S, rx: 5 * S, ry: 4 * S }, 1.1);
      k.add({ type: 'circle', name: 'iris', mat: pal.accent, shade: 'flat', band: 1, cx: face[0] - 1, cy: face[1] - 3 * S, r: 2.4 * S }, 1.2);
      k.add({ type: 'ellipse', name: 'pupil', cx: face[0] - 1, cy: face[1] - 3 * S, rx: 1, ry: 1.8 * S, color: 'outline' }, 1.3);
      if (hit > 0) {
        // the heavy upper lid: hide over the eye's top, its edge slanting down toward the centre of the face
        const ex = face[0], ey = face[1] - 3 * S, rx = 5 * S + 1, ry = 4 * S + 1, dl = ry * 0.75 * hit, dr = ry * 0.45 * hit;
        k.add({ type: 'path', name: 'lid', mat: c, shade: 'flat', band: 1, d: `M${ex - rx} ${ey - ry - 1} L${ex + rx} ${ey - ry - 1} L${ex + rx} ${ey - ry + dr} Q${ex} ${ey - ry + (dl + dr) / 2 + 1} ${ex - rx} ${ey - ry + dl} Z` }, 1.35);
        k.add({ type: 'path', name: 'lid-edge', color: 'outline', d: `M${ex - rx} ${ey - ry + dl} Q${ex} ${ey - ry + (dl + dr) / 2 + 1} ${ex + rx} ${ey - ry + dr} L${ex + rx} ${ey - ry + dr + 1} Q${ex} ${ey - ry + (dl + dr) / 2 + 2} ${ex - rx} ${ey - ry + dl + 1} Z` }, 1.36);
      }
      // the maw: a wide dark gash across the lower third, opening with the attack, upper and lower fangs jagged
      const mx = face[0] + 1, y0 = o[1] + 5, y1 = o[1] + 12 + k.P.open * 3 + hit * 2, hw = 10 + hit * 3;
      k.add({ type: 'path', name: 'maw', color: 'outline', d: `M${mx - hw} ${y0} Q${mx} ${y0 + 2} ${mx + hw} ${y0 - 1} Q${mx + 1} ${2 * y1 - y0} ${mx - hw} ${y0} Z` }, 1.2);
      for (const [dx, len] of [[-6.5, 3], [-3.5, 4], [-0.5, 3], [2.5, 4], [5.5, 2.5]]) k.add({ type: 'poly', name: 'fang', mat: pal.cloth, shade: 'flat', band: 0, pts: [[mx + dx - 1, y0 + 0.6], [mx + dx, y0 + 0.6 + len + hit * 1.5], [mx + dx + 1, y0 + 0.4]] }, 1.3);
      k.add({ type: 'poly', name: 'fang', mat: pal.cloth, shade: 'flat', band: 0, pts: [[mx - 2, y1 - 1.6], [mx - 1, y1 - 4.5], [mx, y1 - 1.4]] }, 1.3);
    }
  }, { ground: 8, shadow: { cx: w / 2, cy: h - 8, rx: 12 } });
}
export const anchors = ctx => groundAnchors(ctx, { head: [0, 0, 46], hand: [4, 0, 30] }, { lunge: 6, ground: 8 });
