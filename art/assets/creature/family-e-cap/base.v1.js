// family-e-cap base.v1 (r1) — elementals (glyph E, 2.4 m): an elemental on the biped rig (art/lib/beast.v1.js) at
// the large frame: a hulking shape of jagged crystal shards and molten seams, no neck, a crown of spikes on a head
// sunk into the shoulders with a single burning core in the chest, arms that end in clusters of shards, and a column of
// shards for legs. The shards are the recoloured ramp (recolour: accent), so the row's colour makes it flame or crystal.
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-e-cap', pass: 'r1', notes: 'elemental: jagged shards, molten seams, chest core, shard fists', mirror: false, recolour: 'accent' };
const H = 2.4;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, foot, L, R } = k, c = pal.accent, sway = k.state === 'idle' ? k.frame : 0;
    k.add({ type: 'path', name: 'base', underlay: true, mat: c, shade: 'normal', round: X(1), d: `M${cx - X(4)} ${waist} L${cx - X(6)} ${foot - Y(1)} L${cx - X(3)} ${foot - Y(3)} L${cx - X(1)} ${foot} L${cx + X(2)} ${foot - Y(2.5)} L${cx + X(5.5)} ${foot - Y(0.5)} L${cx + X(4)} ${waist} Z` });
    k.add({ type: 'path', name: 'body', underlay: true, mat: c, shade: 'normal', round: X(1.5), d: `M${cx - X(7)} ${shoulder} L${cx - X(4)} ${headY - Y(1)} L${cx} ${shoulder - Y(3)} L${cx + X(4)} ${headY - Y(1.5)} L${cx + X(7.5)} ${shoulder + Y(0.5)} L${cx + X(5.5)} ${waist + Y(1)} L${cx} ${waist + Y(3)} L${cx - X(5)} ${waist + Y(1)} Z` });
    for (const [x0, y0, x1, y1] of [[-3, 0, 0, 5], [3, 1, 1, 6], [-2, 8, 2, 10]]) k.add({ type: 'tube', name: 'seam', mat: pal.accent, shade: 'flat', band: 0, pts: [[cx + X(x0), shoulder + Y(y0)], [cx + X(x1), shoulder + Y(y1)]], w: X(0.6) });
    k.front(() => k.add({ type: 'circle', name: 'core', cx: cx + k.turn, cy: shoulder + Y(4), r: X(1.8), mat: pal.skin, shade: 'flat', band: 0 }));
    for (let i = -2; i <= 2; i++) k.add({ type: 'poly', name: 'spike', underlay: true, mat: c, shade: 'flat', band: 1, pts: [[cx + X(i * 1.8 - 1), headY + Y(1)], [cx + X(i * 1.8), headY - Y(4 + (2 - Math.abs(i)) * 1.5 + (i === 0 ? sway : 0))], [cx + X(i * 1.8 + 1), headY + Y(1)]] });
    k.front(() => [-1.4, 1.4].forEach(e => k.add({ type: 'rect', name: 'eye', x: Math.round(cx + X(e) + k.turn), y: Math.round(headY + Y(1.6)), w: 1, h: 1, color: 'outline' })));
    for (const [side, fn] of [[-1, k.main], [1, k.off]]) fn(() => {
      const hx = cx + side * X(9), hy = waist + Y(1);
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: c, shade: 'cyl', pts: [[cx + side * X(6), shoulder + Y(1)], [cx + side * X(9), shoulder + Y(5)], [hx, hy]], w: X(3), w1: X(2.4) });
      for (const d of [-1, 0, 1]) k.add({ type: 'poly', name: 'shard', underlay: true, mat: c, shade: 'flat', band: 1, pts: [[hx - X(1.2), hy], [hx + X(d * 2), hy + Y(4 - Math.abs(d))], [hx + X(1.2), hy]] });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.cx - L.X(9), L.waist + L.Y(1)] });
