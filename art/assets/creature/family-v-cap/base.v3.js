// family-v-cap base.v3 (r3) — from base.v2, ONE change (review: the cape made the whole silhouette a
// smooth egg with nothing above the shoulders, a blob and not a vampire): the cape. Its hem is cut into four ragged
// points (straight cuts between them) and the thin collar becomes a high stiff collar flaring from the shoulders into
// two sharp points beside the head, above the crown; both stay in the leather ramp, which stays dominant.
//
// family-v-cap base.v2 (r2) — from base.v1, ONE change (review: the attack frames barely differed from idle, the claw
// never left the cape's oval): attack frames 1-3 (swing, contact, recovery) are rebuilt. The rig's turn of the right
// hand is undone and the arm is drawn reaching out toward the heading (screen left, the facing's mirror on e/n): on the
// swing the claw is already out past the cape at the shoulder, on contact the arm is straight at chest height with the
// claw's three talons 4-6 px beyond the cape's edge, on recovery it draws back low. Frame 0 (anticipation, the claw
// raised behind) and every other state are base.v1's.
//
// base.v1 (r1) — vampires (glyph V, 1.8 m): a vampire lord on the biped rig (art/lib/beast.v1.js): a
// tall stiff collar rising behind a pale narrow face with a widow's peak and red eyes, a long cape spread from the
// shoulders like folded wings and falling to the floor, a fitted doublet, one clawed hand raised. The cape is the
// recoloured ramp (recolour: leather).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-v-cap', pass: 'r3', notes: 'high flared collar with two points beside the head; cape hem cut into four ragged points', mirror: false, recolour: 'leather' };
const H = 1.8;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    // the cape: rounded shoulders and sides, the hem cut into four ragged points
    const P2 = (x, y) => `${cx + X(x)} ${y}`;
    k.add({ type: 'path', name: 'cape', underlay: true, mat: pal.leather, shade: 'normal', round: X(2), d: `M${P2(-7, shoulder - Y(0.5))} Q${P2(0, shoulder - Y(1.5))} ${P2(7, shoulder - Y(0.5))} Q${P2(10.5, waist - Y(3))} ${P2(9.6, waist + Y(3))} L${P2(8.6, foot - Y(0.8))} L${P2(5.6, foot - Y(6.2))} L${P2(3.4, foot - Y(0.3))} L${P2(0.6, foot - Y(5.4))} L${P2(-2.6, foot - Y(0.5))} L${P2(-5.2, foot - Y(6))} L${P2(-8.6, foot - Y(1))} L${P2(-9.6, waist + Y(3))} Q${P2(-10.5, waist - Y(3))} ${P2(-7, shoulder - Y(0.5))} Z` });
    k.legs(pal.hair, 2, 1.4); k.boots(pal.hair);
    k.front(() => k.shape('doublet', pal.hair, [[0, shoulder], [4, shoulder + Y(0.5)], [3.4, waist], [3.8, waist + Y(2)], [0, waist + Y(2.5)]]));
    // the high collar: stiff wings flaring from the shoulders into two points beside the head, above the crown
    k.add({ type: 'path', name: 'collar', underlay: true, mat: pal.leather, shade: 'bevel', mirrorX: cx, d: `M${cx - X(2.2)} ${shoulder + Y(1)} Q${cx - X(3.6)} ${headY + Y(1)} ${cx - X(4)} ${headY - Y(2)} L${cx - X(7.2)} ${headY - Y(6.5)} Q${cx - X(8.2)} ${headY - Y(1)} ${cx - X(7.4)} ${shoulder - Y(0.6)} Q${cx - X(5)} ${shoulder + Y(0.4)} ${cx - X(2.2)} ${shoulder + Y(1)} Z` });
    k.head(headY, { mat: pal.cloth, wide: 2.8, crown: 4.6, jaw: 1.2, chin: 4.8, point: 0.7, eyes: 1.5, eye: 'accent.1', hair: pal.hair });
    k.front(() => k.add({ type: 'path', name: 'peak', mat: pal.hair, shade: 'sphere', d: `M${cx - X(3)} ${headY - Y(1)} Q${cx - X(3)} ${headY - Y(5)} ${cx} ${headY - Y(5)} Q${cx + X(3)} ${headY - Y(5)} ${cx + X(3)} ${headY - Y(1)} L${cx + X(1.5)} ${headY - Y(2.4)} L${cx + k.turn} ${headY - Y(0.5)} L${cx - X(1.5)} ${headY - Y(2.4)} Z` }));
    k.off(() => k.arm(1, pal.hair, R - X(2.5), waist - Y(0.5), { r: 1.3, glove: pal.cloth }));
    // attack frames 1-3: the claw arm reaches past the cape (hand point, in px from the body's centre and shoulder)
    const f = (ctx.logical ?? ctx.frame) % 4, REACH = { 1: [-11.5, -1.5], 2: [-12.2, 1.2], 3: [-10.5, 3.5] };
    if (ctx.state === 'attack' && REACH[f]) {
      k.main(() => {
        const sx = cx - X(5), sy = shoulder + Y(1.2), hx = cx + X(REACH[f][0]), hy = shoulder + Y(REACH[f][1]);
        const ex = (sx + hx) / 2, ey = (sy + hy) / 2 + Y(0.8), r = X(1.3);
        const len = Math.hypot(hx - ex, hy - ey), dx = (hx - ex) / len, dy = (hy - ey) / len;
        const kids = [
          { type: 'capsule', name: 'upper-arm', underlay: true, mat: pal.hair, shade: 'cyl', a: [sx, sy], b: [ex, ey], r, r1: r * 0.9 },
          { type: 'capsule', name: 'forearm', underlay: true, mat: pal.hair, shade: 'cyl', a: [ex, ey], b: [hx, hy], r: r * 0.9, r1: r * 0.8 },
          { type: 'circle', name: 'hand', cx: hx, cy: hy, r: X(1.1), mat: pal.cloth, shade: 'sphere' },
          ...[-1, 0, 1].map(d => ({ type: 'capsule', name: 'claw', a: [hx, hy], b: [hx + dx * X(2.4) - dy * X(d * 0.9), hy + dy * X(2.4) + dx * X(d * 0.9)], r: X(0.4), mat: pal.cloth, shade: 'flat', band: 0 })),
        ];
        k.add({ type: 'group', name: 'reach', rotate: -k.P.main, origin: k.mainShoulder, children: kids }); // undo the rig's turn
      });
    } else k.main(() => {
      k.arm(-1, pal.hair, L + X(0.5), shoulder - Y(2), { r: 1.3, glove: pal.cloth });
      for (const d of [-1, 0, 1]) k.add({ type: 'capsule', name: 'claw', a: [L + X(0.5), shoulder - Y(2)], b: [L - X(1) + X(d), shoulder - Y(5)], r: X(0.4), mat: pal.cloth, shade: 'flat', band: 0 });
    });
  }, { height: H });
}
const REACH_AT = { 1: [-11.5, -1.5], 2: [-12.2, 1.2], 3: [-10.5, 3.5] };
export const anchors = ctx => {
  const a = bipedAnchors(ctx, { height: H, eyes: 1.5, hand: L => [L.L + L.X(0.5), L.shoulder - L.Y(2)] }), f = (ctx.logical ?? ctx.frame) % 4;
  if (ctx.state === 'attack' && REACH_AT[f]) {
    // the reaching hand is drawn unturned: its anchor is the hand point itself (mirrored on e/n)
    const L = a, flip = ctx.facing === 'e' || ctx.facing === 'n', [w] = ctx.size;
    const lean = [1, 0, -1, 0][f], cx = w / 2 + lean, sh = (ctx.size[1] - 2) - 21 + [0, 0, 1, 0][f];
    const x = Math.round(cx + REACH_AT[f][0]), y = Math.round(sh + REACH_AT[f][1]);
    L.hand = [flip ? w - 1 - x : x, y];
  }
  return a;
};
