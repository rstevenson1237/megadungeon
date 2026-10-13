// family-m-cap base.v3 (r3) — from base.v2, ONE change (review: a box head on a box chest still looked robotic): the
// head. The rig's head is replaced by a narrow skull tilted forward (toward the heading) on a 1px neck: a round crown,
// the jaw tapering to a 2px chin, and the linen bands following its curve (1px dark lines on rings centred above the
// head, so they bow round the skull) instead of straight slanted lines; the dark socket and glowing eye tilt with it.
//
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
export const meta = { brief: 'family-m-cap', pass: 'r3', notes: 'narrow forward-tilted skull on a thin neck, bands bowing round it', mirror: false, recolour: 'cloth' };
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
    // the head: a narrow skull tilted forward on a 1px neck, the bands bowing round it
    k.add({ type: 'capsule', name: 'neck', underlay: true, mat: c, shade: 'flat', band: 1, a: [cx, headY + Y(3)], b: [cx, shoulder], r: 0.6 });
    const S = pts => k.smooth(pts.map(([x, y]) => [cx + X(x), headY + Y(y)]));
    const skull = S([[0, -4.7], [2.2, -4.1], [2.8, -1.8], [2.5, 0.6], [1.6, 2.6], [1, 4], [-1, 4], [-1.6, 2.6], [-2.5, 0.6], [-2.8, -1.8], [-2.2, -4.1]]);
    const kids = [{ type: 'path', name: 'head', underlay: true, mat: c, shade: 'flat', band: 0, d: skull }];
    const rc = [cx, headY - Y(11)];
    kids.push({ type: 'group', name: 'head-wraps', clip: { type: 'path', d: skull }, children: [8, 11, 14].map(r => (
      { type: 'ring', name: 'wrap', cx: rc[0], cy: rc[1], r: Y(r), w: 1, color: 'cloth.2' })) });
    // the eyes sit outside the turned group (1px rects), placed where the tilt carries them
    const tilt = (x, y) => { const a = (-12 * Math.PI) / 180, o = [cx, headY + Y(4)]; return [o[0] + (x - o[0]) * Math.cos(a) - (y - o[1]) * Math.sin(a), o[1] + (x - o[0]) * Math.sin(a) + (y - o[1]) * Math.cos(a)]; };
    k.add({ type: 'group', name: 'skull', rotate: -12, origin: [cx, headY + Y(4)], children: kids });
    if (!k.back) for (const [dx, color] of [[1.2, 'outline'], [-1.4, 'accent.0']]) {
      const [ex, ey] = tilt(cx + X(dx) + k.turn, headY);
      k.add({ type: 'rect', name: color === 'outline' ? 'socket' : 'glow-eye', x: Math.round(ex), y: Math.round(ey), w: 1, h: 1, color });
    }
    k.main(() => reach(-1, cx - X(9.5)));
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.cx - L.X(9.5), L.shoulder + L.Y(2.6)] });
