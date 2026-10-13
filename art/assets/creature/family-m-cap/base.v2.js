// family-m-cap base.v2 (r2) — from base.v1, ONE change (review: read as a dark-suited ninja or robot — the wraps sat in
// the darkest cloth steps so the bands vanished, the arms hung instead of reaching, no strips trailed): the linen is
// lifted and wound, and the mummy reaches. Every part (legs, body, arms, head) is laid flat in the cloth ramp's mid
// step with light linen bands and 1px dark band lines wound diagonally over it every 3px (clipped to the part, the
// torso's and head's slanting one way, the limbs' the other); both forearms are raised forward to chest height, toward
// the heading, each with a 4px loose strip hanging from it. Collar and eye are base.v1's.
//
// base.v1 (r1) — mummies (glyph M, 1.8 m): a mummy on the biped rig (art/lib/beast.v1.js): wrapped from
// head to foot in bands of linen, loose strips trailing from the arms, one eye glowing through a gap in the wrappings,
// a broad collar of the old kings, both arms reaching forward. The linen is the recoloured ramp (recolour: cloth).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-m-cap', pass: 'r2', notes: 'light wound linen with dark band lines, forearms raised forward with hanging strips', mirror: false, recolour: 'cloth' };
const H = 1.8;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, P } = k, c = pal.cloth;
    // wind linen over a part: light bands and dark 1px lines every 3px, slanting `tilt` degrees, clipped to `clip`
    const wind = (clip, tilt, y0 = shoulder - Y(8), n = 14, light2 = true) => {
      const line = (dy, color) => ({ type: 'rect', name: 'wrap', x: cx - X(16), y: y0 + dy, w: X(32), h: 1, color, rotate: tilt, origin: [cx, y0 + dy] });
      k.add({ type: 'group', name: 'wraps', clip, repeat: { n, dy: 3 }, children: [line(0, 'cloth.2'), line(1, 'cloth.0')].concat(light2 ? [line(2, 'cloth.0')] : []) });
    };
    const part = (node, tilt, y0, n) => { k.add({ ...node, underlay: true, mat: c, shade: 'flat', band: 1 }); const { name, underlay, mat, shade, band, ...geo } = { ...node }; wind(geo, tilt, y0, n); };
    // legs (the rig's legs, wound)
    P.feet.forEach((dy, i) => {
      const kk = i ? 1 : -1;
      part({ type: 'capsule', name: 'leg', a: [cx + kk * X(1.7), waist], b: [k.baseCx + kk * X(2.3), foot - Y(1.5) + dy], r: X(1.7), r1: X(1.3) }, -14, waist - Y(1), 6);
    });
    k.boots(c, 2, 1.2);
    // the body
    part({ type: 'path', name: 'body', d: k.sym([[0, shoulder - Y(0.5)], [4.6, shoulder], [4.6, shoulder + Y(4)], [4, waist], [4.2, waist + Y(2)], [0, waist + Y(2)]]) }, 14, shoulder - Y(3), 6);
    k.add({ type: 'ellipse', name: 'collar', cx, cy: shoulder + Y(0.5), rx: X(5.4), ry: Y(2), mat: pal.accent, shade: 'cyl', axis: 'x', underlay: true });
    // an arm raised forward: the upper arm drops to an elbow at the side, the forearm reaches ahead (screen left) at
    // chest height; a loose strip hangs from the forearm
    const reach = (side, hx) => {
      const sx = cx + side * X(4.6), sy = shoulder + Y(1), ex = cx + side * X(5.2) - X(1), ey = shoulder + Y(4.5), hy = shoulder + Y(2.6);
      part({ type: 'capsule', name: 'upper-arm', a: [sx, sy], b: [ex, ey], r: X(1.5), r1: X(1.35) }, 20, sy - Y(1), 3);
      part({ type: 'capsule', name: 'forearm', a: [ex, ey], b: [hx, hy], r: X(1.35), r1: X(1.2) }, 70, hy - Y(3), 4);
      k.add({ type: 'circle', name: 'hand', cx: hx, cy: hy, r: X(1.1), mat: c, shade: 'flat', band: 0 });
      const mx = (ex + hx) / 2, my = (ey + hy) / 2 + Y(1);
      k.add({ type: 'tube', name: 'strip', underlay: true, mat: c, shade: 'flat', band: 0, pts: [[mx, my], [mx + X(0.6), my + Y(2)], [mx + X(0.2), my + Y(4)]], w: X(1), w1: X(0.6) });
    };
    k.off(() => reach(1, cx - X(2.8)));
    k.head(headY, { mat: c, wide: 3.2, crown: 4.6, jaw: 2, chin: 4.2, point: 0.2, eyes: 1.6, hair: c, nose: false, eye: 'outline' });
    wind({ type: 'ellipse', cx, cy: headY - Y(0.3), rx: X(3.1), ry: Y(4.3) }, 10, headY - Y(5), 4);
    k.front(() => k.add({ type: 'rect', name: 'glow-eye', x: Math.round(cx - X(1.6) + k.turn), y: Math.round(headY), w: 1, h: 1, color: 'accent.0' }));
    k.main(() => reach(-1, cx - X(9.5)));
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.cx - L.X(9.5), L.shoulder + L.Y(2.6)] });
