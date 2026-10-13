// family-b base.v3 (r3, from base.v2) — ONE change, the reviewer's "flat wing blobs that vanish on the downstroke": each
// wing is now an arm bone to the wrist and three light finger struts fanning from the wrist, with the membrane spanned
// between them and scalloped between the finger tips; the trailing edge is set off the bone line (perpendicular,
// below it), so a narrow membrane stays under the bones on the downstroke frames too.
// family-b base.v2 (r2, from base.v1) — ONE change, the reviewer's "near-black blob, not airborne": the body, head and
// ears are filled in the leather ramp in three steps (lit top, mid, dark belly) with two light eye pixels and a fang,
// and the bat flies 4 px higher over a ground shadow pinned to the floor point (was auto, touching the body).
// base.v1 (r1) — cave bats (glyph b, 0.4 m): a cave bat on the creature rig (art/lib/beast.v1.js), flying a
// body-height above the floor (a small shadow under it): a furry round body, big pointed ears, a pug face with tiny
// fangs, and two wide membrane wings that beat through the walk (the flight) and fold forward in the bite. The wings
// and fur are the recoloured ramp (recolour: leather).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-b', pass: 'r3', notes: 'cave bat flying: round body, big ears, membrane wings beating', mirror: false, recolour: 'leather' };
export function render(ctx) {
  const [w, h] = ctx.size;
  return creature(ctx, k => {
    const { pal, at, depth } = k, c = pal.leather, L = k.P.lunge * 4;
    const beat = k.P.walking ? [1, 0.2, -0.8, 0.2][Math.round(k.P.phase * 4) % 4] : (k.state === 'attack' ? [0.6, -0.6, -0.9, 0][k.frame % 4] : [0.6, 0.3][k.frame % 2]);
    const fly = 16 + (k.state === 'idle' ? k.frame % 2 : 0), body = at(L, 0, fly);
    // the wings spread across the screen whatever the heading, so the bat reads as a spread shape from every side
    for (const v of [-1, 1]) {
      const root = [body[0] + v * 1.6, body[1] - 1], wr = [body[0] + v * 5.5, body[1] - 3 - 4 * beat], tip = [body[0] + v * 10, body[1] - 1 - 6 * beat];
      // the finger struts fan from the wrist: the long one to the tip, two more set off below the bone line
      const dx = tip[0] - wr[0], dy = tip[1] - wr[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
      let nx = -uy, ny = ux; if (ny < 0) { nx = -nx; ny = -ny; } // the perpendicular pointing down the screen
      const fA = [wr[0] + ux * len * 0.75 + nx * 3.4, wr[1] + uy * len * 0.75 + ny * 3.4], fB = [wr[0] + ux * len * 0.2 + nx * 4.2, wr[1] + uy * len * 0.2 + ny * 4.2];
      const sc = (p, q) => [(p[0] + q[0]) / 2 - nx * 0.9, (p[1] + q[1]) / 2 - ny * 0.9]; // a scallop between finger tips
      const wd = depth(L) + (k.back ? 1 : 0);
      k.add({ type: 'path', name: 'wing', underlay: true, mat: c, shade: 'flat', band: 1, d: k.smooth([root, wr, tip, sc(tip, fA), fA, sc(fA, fB), fB, [body[0] + v * 2.6, body[1] + 3]]) }, wd);
      k.add({ type: 'tube', name: 'wing-bone', mat: c, shade: 'flat', band: 0, pts: [root, wr, tip], w: 0.8 }, wd + 0.01);
      for (const f of [fA, fB]) k.add({ type: 'tube', name: 'finger', mat: c, shade: 'flat', band: 0, pts: [wr, f], w: 0.7 }, wd + 0.01);
    }
    // the fur in three flat steps of the leather ramp: dark belly, mid flank, lit back and crown
    const fur = (name, cx, cy, rx, ry, d, lit = 0.45) => {
      k.add({ type: 'ellipse', name, underlay: true, mat: c, shade: 'flat', band: 1, cx, cy, rx, ry }, d);
      k.add({ type: 'ellipse', name: name + '-lit', mat: c, shade: 'flat', band: 0, cx: cx - rx * 0.25, cy: cy - ry * (1 - lit), rx: rx * 0.6, ry: ry * lit }, d + 0.01);
    };
    fur('body', body[0], body[1], 3, 3.4, depth(L) + 0.5);
    k.add({ type: 'ellipse', name: 'belly', mat: c, shade: 'flat', band: 2, cx: body[0] + 0.5, cy: body[1] + 2, rx: 1.8, ry: 1.2 }, depth(L) + 0.52);
    const hd = at(L + 1.5, 0, fly + 3);
    for (const v of [-1, 1]) k.add({ type: 'poly', name: 'ear', underlay: true, mat: c, shade: 'flat', band: v < 0 ? 0 : 1, pts: [at(L + 1.3, v * 0.6, fly + 4.5), at(L + 1, v * 1.8, fly + 8), at(L + 1.8, v * 2, fly + 4.2)] }, depth(L) + 0.55);
    fur('head', hd[0], hd[1], 2.6, 2.4, depth(L) + 0.6, 0.3);
    if (!k.back) {
      for (const v of [-1.3, 1.3]) { const e = at(L + 2.8, v, fly + 3.4); k.add({ type: 'rect', name: 'eye', x: Math.round(e[0]), y: Math.round(e[1]), w: 1, h: 1, color: 'accent.0' }, depth(L) + 0.7); }
      const f = at(L + 3, 0, fly + 1.4);
      k.add({ type: 'rect', name: 'fang', x: Math.round(f[0]), y: Math.round(f[1]), w: 1, h: 1, color: 'cloth.0' }, depth(L) + 0.7);
    }
  }, { ground: 5, shadow: { cx: w / 2, cy: h - 5, rx: 4 } });
}
export const anchors = ctx => groundAnchors(ctx, { head: [1.5, 0, 19], hand: [3, 0, 18] }, { lunge: 4, ground: 5 });
