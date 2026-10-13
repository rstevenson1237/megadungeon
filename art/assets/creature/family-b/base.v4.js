// family-b base.v4 (x1, from base.v3) — ONE change, the blind reviewer's "reads as a moth/beetle at 1x": the bat's
// silhouette is redrawn in screen space: wide wings (span ~26 px) as a mid-tone membrane spanned from the arm bone to
// three dark finger struts fanning from the wrist, with a scalloped trailing edge notched between the finger tips;
// short dark triangle ears; the face (eyes, fangs) only on s/e, and on n/w the head sits above and behind the body
// with a lit furred back and spine instead of a face.
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
export const meta = { brief: 'family-b', pass: 'x1', notes: 'cave bat flying: wide scalloped wings on three finger struts, short ears, face only from the front', mirror: false, recolour: 'leather' };
export function render(ctx) {
  const [w, h] = ctx.size;
  return creature(ctx, k => {
    const { pal, at, depth } = k, c = pal.leather, L = k.P.lunge * 4;
    const beat = k.P.walking ? [1, 0.2, -0.8, 0.2][Math.round(k.P.phase * 4) % 4] : (k.state === 'attack' ? [0.6, -0.6, -0.9, 0][k.frame % 4] : [0.6, 0.3][k.frame % 2]);
    const fly = 16 + (k.state === 'idle' ? k.frame % 2 : 0), body = at(L, 0, fly), [bx, by] = body, D = depth(L);
    // the wings, in screen space: they spread across the screen whatever the heading
    for (const v of [-1, 1]) {
      const P = (x, y) => [bx + v * x, by + y];
      const root = P(1.5, -1.5), wr = P(6.5, -3.5 - 4 * beat);
      const t1 = P(13.5, -1.5 - 6 * beat), t2 = P(12, 2.5 - 3 * beat), t3 = P(8, 5.5 - 0.5 * beat), low = P(2, 2.5);
      // a scallop: the trailing edge between two finger tips bows in toward the wrist
      const sc = (p, q, k2 = 0.5) => { const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; return [m[0] + (wr[0] - m[0]) * k2, m[1] + (wr[1] - m[1]) * k2]; };
      k.add({ type: 'poly', name: 'wing', underlay: true, mat: c, shade: 'flat', band: 1, pts: [root, wr, t1, sc(t1, t2), t2, sc(t2, t3), t3, sc(t3, low, 0.35), low] }, D - 0.2);
      k.add({ type: 'tube', name: 'wing-arm', mat: c, shade: 'flat', band: 0, pts: [root, wr], w: 0.9 }, D - 0.19);
      for (const t of [t1, t2, t3]) k.add({ type: 'tube', name: 'finger', mat: c, shade: 'flat', band: 2, pts: [wr, t], w: 0.8 }, D - 0.18);
    }
    // the fur: mid flank, lit top, dark belly (front) or lit back and spine (behind)
    k.add({ type: 'ellipse', name: 'body', underlay: true, mat: c, shade: 'flat', band: 1, cx: bx, cy: by, rx: 2.8, ry: 3.4 }, D);
    if (k.back) {
      k.add({ type: 'ellipse', name: 'back-fur', mat: c, shade: 'flat', band: 0, cx: bx - 0.4, cy: by - 0.6, rx: 1.8, ry: 2.4 }, D + 0.01);
      k.add({ type: 'rect', name: 'spine', x: Math.round(bx), y: Math.round(by - 2), w: 1, h: 4, mat: c, shade: 'flat', band: 1 }, D + 0.02);
    } else {
      k.add({ type: 'ellipse', name: 'body-lit', mat: c, shade: 'flat', band: 0, cx: bx - 0.8, cy: by - 1.4, rx: 1.4, ry: 1.4 }, D + 0.01);
      k.add({ type: 'ellipse', name: 'belly', mat: c, shade: 'flat', band: 2, cx: bx + 0.4, cy: by + 1.8, rx: 1.6, ry: 1.2 }, D + 0.02);
    }
    // the head: in front it leads, low and toward the viewer; from behind it sits up over the shoulders
    const hd = k.back ? [bx + 0.5, by - 4.5] : at(L + 1.2, 0, fly + 4), hD = D + 0.1;
    for (const v of [-1, 1]) k.add({ type: 'poly', name: 'ear', underlay: true, mat: c, shade: 'flat', band: 1, pts: [[hd[0] + v * 0.3, hd[1] - 1.8], [hd[0] + v * 2.6, hd[1] - 4.8], [hd[0] + v * 2.5, hd[1] - 0.8]] }, hD - 0.01);
    k.add({ type: 'ellipse', name: 'head', underlay: true, mat: c, shade: 'flat', band: 1, cx: hd[0], cy: hd[1], rx: 2.4, ry: 2.2 }, hD);
    k.add({ type: 'ellipse', name: 'head-lit', mat: c, shade: 'flat', band: 0, cx: hd[0] - 0.6, cy: hd[1] - 1, rx: 1.3, ry: 0.9 }, hD + 0.01);
    if (!k.back) {
      for (const v of [-1, 1]) k.add({ type: 'rect', name: 'eye', x: Math.round(hd[0] + v * 1.2 - 0.5), y: Math.round(hd[1] - 0.3), w: 1, h: 1, color: 'accent.0' }, hD + 0.02);
      k.add({ type: 'rect', name: 'muzzle', x: Math.round(hd[0] - 1), y: Math.round(hd[1] + 1), w: 2, h: 1, mat: c, shade: 'flat', band: 2 }, hD + 0.02);
      for (const v of [-1, 1]) k.add({ type: 'rect', name: 'fang', x: Math.round(hd[0] - 0.5 + v * 0.6), y: Math.round(hd[1] + 2), w: 1, h: 1, color: 'cloth.0' }, hD + 0.03);
    }
  }, { ground: 5, shadow: { cx: w / 2, cy: h - 5, rx: 4 } });
}
export const anchors = ctx => groundAnchors(ctx, { head: [1.5, 0, 19], hand: [3, 0, 18] }, { lunge: 4, ground: 5 });
