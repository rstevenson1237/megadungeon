// family-f-cap base.v1 (r1) — stalkers (glyph F, 2 m): a cave stalker on the biped rig (art/lib/beast.v1.js) at the
// large frame: a gaunt hunched hunter, its spine arched so the long eyeless head hangs forward below the shoulders, a
// wide mouth of needle teeth, ribs showing, very long thin arms ending in hooked claws held ready, bent back-jointed
// legs. The hide is the recoloured ramp (recolour: skin).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-f-cap', pass: 'r1', notes: 'stalker: hunched, long eyeless head hung low, long hooked claws', mirror: false, recolour: 'skin' };
const H = 2;
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
    const hy = shoulder - Y(1);
    k.add({ type: 'path', name: 'head', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[cx - X(1), hy - Y(3)], [cx - X(5) + k.turn, hy - Y(1)], [cx - X(7) + k.turn, hy + Y(2)], [cx - X(4) + k.turn, hy + Y(3)], [cx, hy + Y(1)]]) });
    k.front(() => k.add({ type: 'path', name: 'maw', color: 'outline', d: `M${cx - X(6.4) + k.turn} ${hy + Y(1.8)} Q${cx - X(3.5) + k.turn} ${hy + Y(2.6 + P.open)} ${cx - X(1) + k.turn} ${hy + Y(1.4)} Q${cx - X(3.5) + k.turn} ${hy + Y(1.6)} ${cx - X(6.4) + k.turn} ${hy + Y(1.8)} Z` }));
    for (const [side, fn] of [[-1, k.main], [1, k.off]]) fn(() => {
      const sh = [cx + side * X(4), shoulder - Y(2)], el = [cx + side * X(9), shoulder + dn + Y(2)], hd = [cx + side * X(8), knee];
      k.add({ type: 'capsule', name: 'upper-arm', underlay: true, mat: c, shade: 'cyl', a: sh, b: el, r: X(1.1), r1: X(0.9) });
      k.add({ type: 'capsule', name: 'forearm', underlay: true, mat: c, shade: 'cyl', a: el, b: hd, r: X(0.9), r1: X(0.7) });
      for (const d of [-1, 0, 1]) k.add({ type: 'tube', name: 'claw', mat: pal.cloth, shade: 'flat', band: 0, pts: [hd, [hd[0] + X(d * 1.2), hd[1] + Y(2.5)], [hd[0] + X(d * 1.2) - side * X(1), hd[1] + Y(3.4)]], w: X(0.6), w1: X(0.3) });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.cx - L.X(8), L.knee] });
