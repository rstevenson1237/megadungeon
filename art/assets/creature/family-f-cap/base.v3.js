// family-f-cap base.v3 (r3, from base.v2) — changed: the body is scaled up to stand ~32 px (height 2.4 m on the rig,
// from 2), and on the front facings (s/e) a head juts forward below the pale shoulder plate: a long mid-tone skull with
// an open lower jaw, a dark maw and pale needle teeth (the old mouth slit on the plate is gone).
// family-f-cap base.v2 (r2, from base.v1) — changed: the head is pushed forward and down out of the shoulder line as a
// long pale wedge (~5 px past the old head, drawn over the arms) with a dark mouth slit along its underside, so the
// head breaks the silhouette instead of sinking into the torso.
// family-f-cap base.v1 (r1) — stalkers (glyph F, 2 m): a cave stalker on the biped rig (art/lib/beast.v1.js) at the
// large frame: a gaunt hunched hunter, its spine arched so the long eyeless head hangs forward below the shoulders, a
// wide mouth of needle teeth, ribs showing, very long thin arms ending in hooked claws held ready, bent back-jointed
// legs. The hide is the recoloured ramp (recolour: skin).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-f-cap', pass: 'r3', notes: 'stalker: hunched, long eyeless head hung low, long hooked claws', mirror: false, recolour: 'skin' };
const H = 2.4;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, foot, L, R, P } = k, c = pal.skin, dn = Y(1.5);
    P.feet.forEach((dy, i) => {
      const kk = i ? 1 : -1, hip = [cx + kk * X(2), waist], kn = [k.baseCx + kk * X(4.5), knee - Y(2)], ft = [k.baseCx + kk * X(3), foot - Y(0.8) + dy];
      k.add({ type: 'capsule', name: 'thigh', underlay: true, mat: c, shade: 'cyl', a: hip, b: kn, r: X(1.5), r1: X(1.1) });
      k.add({ type: 'capsule', name: 'shin', underlay: true, mat: c, shade: 'cyl', a: kn, b: ft, r: X(1), r1: X(0.7) });
    });
    k.add({ type: 'path', name: 'back', underlay: true, mat: c, shade: 'normal', round: X(2), d: k.smooth([[cx - X(4), waist + Y(1)], [cx - X(5), shoulder + dn], [cx - X(1), shoulder - Y(5)], [cx + X(4), shoulder - Y(3)], [cx + X(4.5), waist - Y(2)], [cx + X(3), waist + Y(1.5)]]) });
    for (let i = 0; i < 3; i++) k.add({ type: 'rect', name: 'rib', x: cx - X(3), y: shoulder + dn + Y(1 + i * 1.6), w: X(5.5), h: 1, mat: c, shade: 'flat', band: 2 });
    for (const [side, fn] of [[-1, k.main], [1, k.off]]) fn(() => {
      const sh = [cx + side * X(4), shoulder - Y(2)], el = [cx + side * X(9), shoulder + dn + Y(2)], hd = [cx + side * X(8), knee];
      k.add({ type: 'capsule', name: 'upper-arm', underlay: true, mat: c, shade: 'cyl', a: sh, b: el, r: X(1.1), r1: X(0.9) });
      k.add({ type: 'capsule', name: 'forearm', underlay: true, mat: c, shade: 'cyl', a: el, b: hd, r: X(0.9), r1: X(0.7) });
      for (const d of [-1, 0, 1]) k.add({ type: 'tube', name: 'claw', mat: pal.cloth, shade: 'flat', band: 0, pts: [hd, [hd[0] + X(d * 1.2), hd[1] + Y(2.5)], [hd[0] + X(d * 1.2) - side * X(1), hd[1] + Y(3.4)]], w: X(0.6), w1: X(0.3) });
    });
    const hy = shoulder + Y(1.5), t = k.turn; // the head hangs forward and down, past the shoulder line
    k.add({ type: 'path', name: 'head', underlay: true, mat: c, shade: 'flat', band: 0, d: k.smooth([[cx - X(1), hy - Y(3.5)], [cx - X(5) + t, hy - Y(1.5)], [cx - X(10) + t, hy + Y(4.5)], [cx - X(9.5) + t, hy + Y(6.5)], [cx - X(4) + t, hy + Y(4.5)], [cx - X(0.5), hy + Y(1)]]) });
    // the head, jutting forward below the plate (front facings only): skull, a dark maw, the open lower jaw and teeth
    k.front(() => {
      const o = Y(0.8 + P.open * 1.6), hx = cx + t;
      k.add({ type: 'path', name: 'maw', color: 'outline', d: k.smooth([[hx - X(4), hy + Y(8.6)], [hx - X(13.4), hy + Y(9)], [hx - X(13), hy + Y(10) + o], [hx - X(4.5), hy + Y(10.4)]]) });
      k.add({ type: 'path', name: 'jaw', underlay: true, mat: c, shade: 'flat', band: 1, d: k.smooth([[hx - X(3.5), hy + Y(9.6)], [hx - X(13.2), hy + Y(10) + o], [hx - X(12.6), hy + Y(11.4) + o], [hx - X(4.5), hy + Y(11.6)]]) });
      k.add({ type: 'path', name: 'skull', underlay: true, mat: c, shade: 'flat', band: 1, d: k.smooth([[hx - X(3), hy + Y(5.6)], [hx - X(8), hy + Y(5.8)], [hx - X(14), hy + Y(8.2)], [hx - X(13.6), hy + Y(9.4)], [hx - X(7), hy + Y(9.4)], [hx - X(3), hy + Y(9)]]) });
      k.add({ type: 'path', name: 'skull-top', mat: c, shade: 'flat', band: 0, d: k.smooth([[hx - X(3.5), hy + Y(6.2)], [hx - X(8), hy + Y(6.4)], [hx - X(12.5), hy + Y(8.2)], [hx - X(7.5), hy + Y(7.6)]]) });
      for (const tx of [-12, -10, -8, -6]) k.add({ type: 'rect', name: 'teeth', x: Math.round(hx + X(tx)), y: Math.round(hy + Y(9.4)), w: 1, h: 1, color: 'cloth.0' });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.cx - L.X(8), L.knee] });
