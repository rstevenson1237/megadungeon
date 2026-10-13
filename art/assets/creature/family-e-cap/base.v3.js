// family-e-cap base.v3 (r3, from base.v2) — changed: a head is carved below the crown (an inked egg of the body ramp
// (flat mid tone) with two 2 px dark eye sockets on the front facings), and the right half of the torso (the side away from the light,
// on screen in every facing) is shaded one ramp step darker, so the figure has a face and turns.
// family-e-cap base.v2 (r2, from base.v1) — changed: the smooth body and base paths are replaced by jagged angular
// shard outlines that break the silhouette, with shard spikes (3-5 px) out of both shoulders and a taller crown.
// family-e-cap base.v1 (r1) — elementals (glyph E, 2.4 m): an elemental on the biped rig (art/lib/beast.v1.js) at
// the large frame: a hulking shape of jagged crystal shards and molten seams, no neck, a crown of spikes on a head
// sunk into the shoulders with a single burning core in the chest, arms that end in clusters of shards, and a column of
// shards for legs. The shards are the recoloured ramp (recolour: accent), so the row's colour makes it flame or crystal.
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-e-cap', pass: 'r3', notes: 'elemental: jagged shards, molten seams, chest core, shard fists', mirror: false, recolour: 'accent' };
const H = 2.4;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, foot, L, R } = k, c = pal.accent, sway = k.state === 'idle' ? k.frame : 0;
    const J = (pts) => pts.map(([x, y]) => `${cx + X(x)} ${y}`).join(' L');
    // the base: a column of shards, its hem a row of jagged points down to the floor
    k.add({ type: 'path', name: 'base', underlay: true, mat: c, shade: 'normal', round: 0, d: `M${J([[-4, waist], [-5.5, waist + Y(3)], [-4.5, waist + Y(4)], [-7, foot - Y(0.5)], [-4, foot - Y(3)], [-2.5, foot], [-0.5, foot - Y(4)], [1.5, foot - Y(0.5)], [2.5, foot - Y(3.5)], [6, foot], [4.5, waist + Y(4)], [5.5, waist + Y(2)], [4, waist]])} Z` });
    // the body: an angular mass of shards, spikes jutting out of both shoulders and a notched chest edge
    const body = k.add({ type: 'path', name: 'body', underlay: true, mat: c, shade: 'normal', round: 0, d: `M${J([[-5, waist + Y(1)], [-6.5, waist - Y(2)], [-5.5, waist - Y(3)], [-7.5, shoulder + Y(3)], [-6.5, shoulder + Y(1.5)], [-12, shoulder - Y(6)], [-6.5, shoulder - Y(0.5)], [-8.5, shoulder - Y(8)], [-4.5, shoulder - Y(1.5)], [-4, headY - Y(1)], [-2, shoulder - Y(4)], [0, shoulder - Y(2.5)], [2, shoulder - Y(4.5)], [4, headY - Y(1.5)], [5, shoulder - Y(1.5)], [9, shoulder - Y(8)], [7, shoulder - Y(0.5)], [12.5, shoulder - Y(5.5)], [7.5, shoulder + Y(1.5)], [8, shoulder + Y(3)], [5.5, waist - Y(2)], [6.5, waist + Y(0.5)], [3, waist + Y(1.5)], [0, waist + Y(3.5)], [-2.5, waist + Y(1.5)]])} Z` });
    // the torso's right half on screen (the side away from the light) one ramp step darker; drawn on the left before the
    // e/n flip so it ends on the right in every facing
    const flipped = ctx.facing === 'e' || ctx.facing === 'n', dark = [...c.slice(1), c[c.length - 1]];
    k.add({ type: 'group', name: 'body-shade', clip: { type: 'rect', x: flipped ? 0 : cx, y: 0, w: flipped ? cx : k.w - cx, h: k.h }, children: [{ ...body, name: 'body-dark', underlay: false, mat: dark }] });
    for (const [x0, y0, x1, y1] of [[-3, 0, 0, 5], [3, 1, 1, 6], [-2, 8, 2, 10]]) k.add({ type: 'tube', name: 'seam', mat: pal.accent, shade: 'flat', band: 0, pts: [[cx + X(x0), shoulder + Y(y0)], [cx + X(x1), shoulder + Y(y1)]], w: X(0.6) });
    k.front(() => k.add({ type: 'circle', name: 'core', cx: cx + k.turn, cy: shoulder + Y(4), r: X(1.8), mat: pal.skin, shade: 'flat', band: 0 }));
    for (let i = -2; i <= 2; i++) k.add({ type: 'poly', name: 'spike', underlay: true, mat: c, shade: 'flat', band: 1, pts: [[cx + X(i * 1.6 - 1.1), headY + Y(1)], [cx + X(i * 2.6), headY - Y(4 + (2 - Math.abs(i)) * 2 + (i === 0 ? sway : 0))], [cx + X(i * 1.6 + 1.1), headY + Y(1)]] });
    // the head: an egg sunk below the crown, inked off the body, with two dark eye sockets from the front
    const hy = headY + Y(1.8);
    k.add({ type: 'path', name: 'head', underlay: true, mat: c, shade: 'flat', band: 1, d: k.smooth([[cx, hy - Y(3.2)], [cx + X(3), hy - Y(2.2)], [cx + X(3.2), hy + Y(0.8)], [cx + X(1.6), hy + Y(3)], [cx, hy + Y(3.4)], [cx - X(1.6), hy + Y(3)], [cx - X(3.2), hy + Y(0.8)], [cx - X(3), hy - Y(2.2)]]) });
    k.front(() => [-1.5, 1.3].forEach(e => k.add({ type: 'rect', name: 'eye', x: Math.round(cx + X(e) + k.turn - 1), y: Math.round(hy), w: 2, h: 2, color: 'outline' })));
    for (const [side, fn] of [[-1, k.main], [1, k.off]]) fn(() => {
      const hx = cx + side * X(9), hy = waist + Y(1);
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: c, shade: 'cyl', pts: [[cx + side * X(6), shoulder + Y(1)], [cx + side * X(9), shoulder + Y(5)], [hx, hy]], w: X(3), w1: X(2.4) });
      for (const d of [-1, 0, 1]) k.add({ type: 'poly', name: 'shard', underlay: true, mat: c, shade: 'flat', band: 1, pts: [[hx - X(1.2), hy], [hx + X(d * 2), hy + Y(4 - Math.abs(d))], [hx + X(1.2), hy]] });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, face: false, hand: L => [L.cx - L.X(9), L.waist + L.Y(1)] });
