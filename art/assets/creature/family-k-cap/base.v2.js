// family-k-cap base.v2 (r2) — from base.v1, one change: the greatsword is a 2-px blade with a lit edge and its
// crossguard at chest height in front of the body (the hands on the grip above it), and the cape gets three vertical
// fold bands and a ragged, deeply torn hem.
// base.v1 header: death knights and dread lords (glyph K, 2 m): a death knight on the biped rig
// (art/lib/beast.v1.js) at the large frame: blackened plate (boxy, as plate may be) with spiked pauldrons, a horned
// great helm with a burning slit, a tattered cape, and a two-handed greatsword held point down before him. The armour
// is the recoloured ramp (recolour: cloth).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-k-cap', pass: 'r2', notes: 'death knight: spiked plate, horned helm with burning slit, greatsword', mirror: false, recolour: 'cloth' };
const H = 2;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, foot, L, R, P } = k, m = pal.cloth;
    k.worn(() => {
      const hem = [[7, 2.2], [6, 4.6], [5, 1.4], [3.6, 3.8], [2.4, 0.8], [1, 3.4], [-0.4, 1.2], [-1.8, 4.2], [-3, 1], [-4.4, 3.6], [-5.6, 1.6], [-6.6, 4.4], [-7, 2.4]];
      k.add({ type: 'path', name: 'cape', underlay: true, mat: pal.leather, shade: 'normal', round: X(1.5), d: `M${cx - X(6)} ${shoulder} H${cx + X(6)} ` + hem.map(([dx, dy]) => `L${cx + X(dx)} ${foot - Y(dy)}`).join(' ') + ' Z' });
      for (const [dx, tone] of [[-4, 'leather.2'], [-3, 'leather.0'], [0, 'leather.2'], [1, 'leather.0'], [4, 'leather.2'], [5, 'leather.0']])
        k.add({ type: 'tube', name: 'cape-fold', color: tone, w: 1, pts: [[cx + X(dx * 0.75), shoulder + Y(2)], [cx + X(dx * 0.9), waist], [cx + X(dx * 1.05), foot - Y(5)]] });
    });
    P.feet.forEach((dy, i) => k.add({ type: 'rect', name: 'greave', underlay: true, mat: m, shade: 'bevel', x: i ? k.baseCx + X(1) : k.baseCx - X(4.2), y: waist, w: X(3.2), h: foot - waist + dy }));
    k.add({ type: 'path', name: 'plate', underlay: true, mat: m, shade: 'normal', round: X(1.5), d: `M${cx - X(6)} ${shoulder} H${cx + X(6)} L${cx + X(5)} ${waist + Y(2)} H${cx - X(5)} Z` });
    k.add({ type: 'rect', name: 'faulds', x: cx - X(5), y: waist + Y(1), w: X(10), h: Y(3), mat: m, shade: 'flat', band: 1 });
    for (const s of [-1, 1]) {
      k.add({ type: 'circle', name: 'pauldron', cx: cx + s * X(6.2), cy: shoulder + Y(0.5), r: X(2.8), mat: m, shade: 'sphere', underlay: true });
      k.add({ type: 'poly', name: 'spike', mat: m, shade: 'flat', band: 0, pts: [[cx + s * X(5.4), shoulder - Y(1.6)], [cx + s * X(7), shoulder - Y(5)], [cx + s * X(7.4), shoulder - Y(1.2)]] });
    }
    k.add({ type: 'rect', name: 'helm', x: cx - X(3.8), y: headY - Y(5), w: X(7.6), h: Y(9), r: X(1.5), mat: m, shade: 'cyl', underlay: true });
    for (const s of [-1, 1]) k.add({ type: 'tube', name: 'horn', underlay: true, mat: pal.hair, shade: 'cyl', pts: [[cx + s * X(3.4), headY - Y(3)], [cx + s * X(6), headY - Y(5)], [cx + s * X(6.4), headY - Y(9)]], w: X(1.8), w1: X(0.6) });
    k.front(() => k.add({ type: 'rect', name: 'slit', x: cx - X(2.8) + k.turn, y: headY, w: X(5.6), h: 1, color: 'accent.1' }));
    k.main(() => {
      const guard = shoulder + Y(4.5), grip = shoulder + Y(2.6);
      k.arm(-1, m, cx - X(1.2), grip, { r: 1.6, wide: 5.5 });
      k.arm(1, m, cx + X(1.2), grip, { r: 1.6, wide: 5.5 });
      const bx = Math.round(cx) - 1; // the 2-px blade, point down, its left column lit
      k.add({ type: 'path', name: 'greatsword', underlay: true, mat: pal.cloth, shade: 'flat', band: 1, d: `M${bx} ${guard} H${bx + 2} V${foot - Y(2.5)} L${bx + 1} ${foot - Y(0.5)} L${bx} ${foot - Y(2.5)} Z` });
      k.add({ type: 'rect', name: 'blade-edge', x: bx, y: Math.round(guard) + 1, w: 1, h: Math.round(foot - Y(3) - guard), color: 'cloth.0' });
      k.add({ type: 'capsule', name: 'crossguard', underlay: true, a: [cx - X(4), guard], b: [cx + X(4), guard], r: X(0.7), mat: pal.hair, shade: 'cyl', axis: 'x' });
      k.pole(pal.leather, cx, guard - Y(0.5), cx, shoulder + Y(0.5), 0.6, 'grip');
      k.add({ type: 'circle', name: 'pommel', cx, cy: shoulder + Y(0.2), r: X(0.9), mat: pal.hair, shade: 'sphere', underlay: true });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.cx - L.X(1.2), L.shoulder + L.Y(2.6)] });
