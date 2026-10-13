// class-monk base.v3 (r3) — from base.v2 (R12), one change, the robe's body: it is wrapped (a skin V-neck at the
// collar with the overlap's edge running to the sash), pinched at the waist under the sash and flared 1-2 px each side
// at the skirt, and the free (left) arm is bent at a clear elbow with the hand resting on the hip.
// base.v2 header: from base.v1, one change: the quarterstaff is no longer held across the chest; it stands
// upright in the right hand beside the body (one ramp, flat, with a 1-px light edge), so the robe and sash read clean.
// base.v1 header: the Monk on the shared player body (art/lib/person.v1.js), from the approved class probe:
// a bare broad round skull, a wrapped robe with a sash, wrapped shins, and a long quarterstaff held across the body in
// both hands (it turns with the right hand).
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-monk', pass: 'r3', notes: 'probe monk: bare skull, robe and sash, staff upright in the right hand', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, knee, L, R, P } = k;
    k.legs(pal.accent, 2.2, 1.7);
    P.feet.forEach((dy, i) => k.add({ type: 'ellipse', name: 'wraps', cx: k.baseCx + (i ? 1 : -1) * X(2.6), cy: foot - Y(3.5) + dy, rx: X(1.8), ry: Y(1.6), mat: pal.cloth, shade: 'sphere' }));
    k.boots(pal.leather);
    k.neck();
    k.shape('robe', pal.accent, [[0, shoulder - Y(0.5)], [4.8, shoulder], [4.8, shoulder + Y(3)], [3.2, waist], [4.6, waist + Y(2)], [7, knee - Y(0.6)], [6.4, knee + Y(0.4)], [0, knee]]);
    k.front(() => {
      // the wrap: a V of skin at the collar, the overlapping edge running from the V down to the sash
      k.add({ type: 'path', name: 'v-neck', mat: pal.skin, shade: 'flat', band: 1, d: `M${cx - X(2.2)} ${shoulder - Y(0.4)} L${cx + X(1.6)} ${shoulder - Y(0.4)} L${cx - X(0.6)} ${shoulder + Y(3.4)} Z` });
      k.add({ type: 'tube', name: 'wrap-edge', d: `M${cx + X(1.6)} ${shoulder - Y(0.2)} Q${cx} ${shoulder + Y(3.6)} ${cx - X(2.4)} ${waist - Y(0.8)}`, w: 1, color: 'accent.2' });
      for (const [x0, x1] of [[-1.6, -4.4], [1.8, 4.6]]) k.add({ type: 'tube', name: 'fold', d: `M${cx + X(x0)} ${waist + Y(1.6)} Q${cx + X((x0 + x1) / 2)} ${waist + Y(3)} ${cx + X(x1)} ${knee - Y(0.8)}`, w: 1, color: 'accent.2' });
    });
    k.add({ type: 'ellipse', name: 'sash', cx, cy: waist, rx: X(3.8), ry: Y(1.1), mat: pal.leather, shade: 'cyl', axis: 'x' });
    k.head(headY, { wide: 4, crown: 5.2, jaw: 2.6, chin: 3.6, point: 0, eyes: 2.2, hair: pal.skin });
    k.off(() => {
      // the free arm bent at the elbow, the hand on the hip
      const sh = [cx + X(4.8), shoulder + Y(1.2)], el = [cx + X(7.4), waist - Y(3.6)], hd = [cx + X(4.4), waist - Y(0.4)];
      k.add({ type: 'capsule', name: 'upper-arm', underlay: true, mat: pal.skin, shade: 'cyl', a: sh, b: el, r: X(1.3), r1: X(1.2) });
      k.add({ type: 'capsule', name: 'sleeve', underlay: true, mat: pal.accent, shade: 'cyl', a: sh, b: [cx + X(5.9), shoulder + Y(3.2)], r: X(1.6), r1: X(1.5) });
      k.add({ type: 'capsule', name: 'forearm', underlay: true, mat: pal.skin, shade: 'cyl', a: el, b: hd, r: X(1.15), r1: X(1) });
      k.add({ type: 'circle', name: 'hand', cx: hd[0], cy: hd[1], r: X(1.1), mat: pal.skin, shade: 'sphere' });
    });
    k.main(() => {
      k.add({ type: 'capsule', name: 'staff', underlay: true, mat: pal.leather, shade: 'flat', band: 2, a: [L, foot - Y(1)], b: [L, headY - Y(7)], r: X(0.75) });
      k.add({ type: 'rect', name: 'staff-edge', x: Math.round(L - X(0.75)), y: Math.round(headY - Y(6.5)), w: 1, h: Math.round(foot - Y(1.5) - (headY - Y(6.5))), color: 'leather.0' });
      k.arm(-1, pal.skin, L + X(0.6), waist - Y(3));
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 2.2, hand: L => [L.L + L.X(0.6), L.waist - L.Y(3)] });
