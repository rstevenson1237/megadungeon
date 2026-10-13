// family-p-cap base.v3 (r3, from base.v2) — head only: the near-black mass round the head (the rig's narrow wedge head
// and thick hair-ramp horns whose dark side filled it) is replaced by a horned red skull on the body ramp: a broad
// cranium, a heavy brow ridge shadowing glowing eyes, sunken cheeks, a squared fanged jaw, and slimmer pale horns
// growing from the crown and curling out (lit flat, no dark core). From behind, the same skull without a face.
// family-p-cap base.v2 (r2, from base.v1) — wings only: v1's flat brown ovals are redrawn as bat wings, a bony
// leading-edge spar from the shoulder to a clawed wrist peaking above the horns and on to the wingtip, three finger
// ribs fanning from the wrist, and a scalloped membrane edge between the finger ends.
// family-p-cap base.v1 (r1) — fiends and demon lords (glyph P, 3.2 m): a pit fiend on the biped rig
// (art/lib/beast.v1.js) at the large frame: great bat wings spread behind, curling ram horns, a narrow fanged face,
// a heavy muscled torso, digitigrade goat legs ending in hooves, a barbed tail, and a burning whip in the right hand.
// The hide is the recoloured ramp (recolour: accent).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-p-cap', pass: 'r3', notes: 'pit fiend: spread bat wings, ram horns, goat legs, barbed tail, whip', mirror: false, recolour: 'accent' };
const H = 3.2;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, foot, L, R, P } = k, c = pal.accent;
    k.worn(() => {
      for (const s of [-1, 1]) {
        const W = (dx, dy) => [cx + s * X(dx), headY + Y(dy)], j = p => p.join(' ');
        const root = W(2.5, 5), wrist = W(8, -9), tip = W(16, -4), root2 = W(3, 12);
        const ends = [W(15, 6), W(11.5, 10.5), W(7, 12.5)];
        // the membrane: up the spar to the wrist and tip, then scalloped between the finger ends back to the body
        const edge = [tip, ...ends, root2];
        let d = `M${j(root)} Q${j(W(4, -5))} ${j(wrist)} Q${j(W(13, -8))} ${j(tip)}`;
        for (let i = 1; i < edge.length; i++) {
          const a = edge[i - 1], b = edge[i], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], c = [m[0] + (wrist[0] - m[0]) * 0.35, m[1] + (wrist[1] - m[1]) * 0.35];
          d += ` Q${j(c)} ${j(b)}`;
        }
        k.add({ type: 'path', name: 'wing', underlay: true, mat: pal.leather, shade: 'flat', band: 1, d: d + ' Z' });
        // three finger ribs fanning from the wrist to the scallop points
        for (const e of ends) k.add({ type: 'tube', name: 'wing-rib', mat: pal.leather, shade: 'flat', band: 0, pts: [wrist, e], w: X(0.7), w1: X(0.5) });
        // the bony spar along the leading edge, and the wrist claw
        k.add({ type: 'tube', name: 'wing-spar', underlay: true, mat: pal.leather, shade: 'cyl', pts: [root, W(4.5, -4), wrist, W(12, -7.5), tip], w: X(1.5), w1: X(0.6) });
        k.add({ type: 'poly', name: 'wing-claw', mat: pal.hair, shade: 'flat', band: 0, pts: [W(7.4, -9), W(7.6, -11.5), W(8.8, -9)] });
      }
      k.add({ type: 'tube', name: 'tail', underlay: true, mat: c, shade: 'cyl', pts: [[cx + X(2), waist + Y(1)], [cx + X(9), knee], [cx + X(11), foot - Y(4)]], w: X(1.6), w1: X(0.8) });
      k.add({ type: 'poly', name: 'barb', mat: c, shade: 'flat', band: 2, pts: [[cx + X(10), foot - Y(5)], [cx + X(13), foot - Y(3)], [cx + X(10.5), foot - Y(2)]] });
    });
    P.feet.forEach((dy, i) => {
      const kk = i ? 1 : -1, hip = [cx + kk * X(2), waist], kn = [k.baseCx + kk * X(4), knee - Y(1)], hock = [k.baseCx + kk * X(2.5), foot - Y(3) + dy], hoof = [k.baseCx + kk * X(3), foot - Y(0.5) + dy];
      k.add({ type: 'capsule', name: 'thigh', underlay: true, mat: c, shade: 'cyl', a: hip, b: kn, r: X(2.2), r1: X(1.6) });
      k.add({ type: 'capsule', name: 'shin', underlay: true, mat: c, shade: 'cyl', a: kn, b: hock, r: X(1.3), r1: X(1) });
      k.add({ type: 'capsule', name: 'hoof', underlay: true, mat: pal.hair, shade: 'cyl', a: hock, b: hoof, r: X(1.1) });
    });
    k.shape('torso', c, [[0, shoulder - Y(1)], [6, shoulder], [6, shoulder + Y(3)], [4, waist], [0, waist + Y(1)]]);
    k.off(() => k.arm(1, c, R - X(0.5), waist - Y(1), { r: 1.7, wide: 5.6 }));
    // the horned skull, drawn here instead of the rig's head: all on the body ramp
    const hy = headY + Y(1), t = k.turn;
    k.add({ type: 'path', name: 'head', underlay: true, mat: c, shade: 'sphere', d: k.smooth([[cx, hy - Y(4.4)], [cx + X(3.3), hy - Y(3.4)], [cx + X(3.4), hy], [cx + X(2.4), hy + Y(2.4)], [cx + X(2.2), hy + Y(4.4)], [cx, hy + Y(5)], [cx - X(2.2), hy + Y(4.4)], [cx - X(2.4), hy + Y(2.4)], [cx - X(3.4), hy], [cx - X(3.3), hy - Y(3.4)]]) });
    k.front(() => {
      // a heavy brow ridge, lit on top, overhanging the eyes, with a shadow band under it
      k.add({ type: 'path', name: 'brow', mat: c, shade: 'flat', band: 0, d: k.smooth([[cx - X(3.2) + t, hy - Y(0.2)], [cx - X(2.2) + t, hy - Y(2)], [cx + t, hy - Y(1.2)], [cx + X(2.2) + t, hy - Y(2)], [cx + X(3.2) + t, hy - Y(0.2)], [cx + t, hy - Y(0.4)]]) });
      k.add({ type: 'rect', name: 'brow-shadow', x: Math.round(cx - X(2.6) + t), y: Math.round(hy), w: Math.round(X(5.2)), h: 1, mat: c, shade: 'flat', band: 2 });
      for (const e of [-1, 1]) k.add({ type: 'rect', name: 'eye', x: Math.round(cx + e * X(1.4) + t) - (e < 0 ? 1 : 0), y: Math.round(hy), w: 2, h: 1, color: 'accent.0' });
      // sunken cheeks under the cheekbones
      for (const e of [-1, 1]) k.add({ type: 'rect', name: 'cheek', x: Math.round(cx + e * X(2) + t) - (e < 0 ? 1 : 0), y: Math.round(hy + Y(1.6)), w: 1, h: 2, mat: c, shade: 'flat', band: 2 });
      // the squared jaw: a dark mouth line with two fangs biting down over it
      k.add({ type: 'rect', name: 'mouth', x: Math.round(cx - X(1.6) + t), y: Math.round(hy + Y(3.2)), w: Math.round(X(3.2)), h: 1, color: 'outline' });
      for (const e of [-1, 1]) k.add({ type: 'rect', name: 'fang', x: Math.round(cx + e * X(1) + t), y: Math.round(hy + Y(3.2)), w: 1, h: 2, mat: pal.hair, shade: 'flat', band: 0 });
    });
    // slim pale horns from the crown, curling out and down
    for (const s of [-1, 1]) k.add({ type: 'tube', name: 'horn', underlay: true, mat: pal.hair, shade: 'flat', band: 0, pts: [[cx + s * X(2.2), hy - Y(3.2)], [cx + s * X(4.4), hy - Y(6)], [cx + s * X(6.2), hy - Y(4)], [cx + s * X(5.8), hy - Y(1.4)]], w: X(1.4), w1: X(0.5) });
    k.main(() => {
      k.arm(-1, c, L, waist - Y(3), { r: 1.7, wide: 5.6 });
      k.add({ type: 'tube', name: 'whip', mat: pal.accent, shade: 'flat', band: 0, pts: [[L, waist - Y(3)], [L - X(3), waist + Y(2)], [L - X(1), knee + Y(1)], [L - X(4), foot - Y(1)]], w: X(1), w1: X(0.5) });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 1, eyes: 1.5, hand: L => [L.L, L.waist - L.Y(3)] });
