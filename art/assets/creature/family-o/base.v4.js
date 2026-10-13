// family-o base.v4 (x1, from base.v3): the blind re-score's point - organic shapes: the head is the asset's own round
// egg skull (a domed cranium tapering at both top corners) over the heavy underbite jaw, both arms are drawn here with
// a rounded deltoid and a clearly bent, outward elbow (curved, not straight tubes), and the cleaver's blade is a large
// crescent axe head.
// family-o base.v3 (r3, from base.v2) — changed: the lower head widens into a heavy underbite jaw (a separate inked jaw
// wider than the skull, the tusks on its corners), the head sits ~2 px higher on a short thick neck, and the torso's
// sides are rounded (sloped shoulders swelling to a barrel chest) instead of boxy.
// family-o base.v2 (r2, from base.v1) — changed: the head is a rounded skull (narrower jaw, taller crown) with a 1 px
// dark brow shelf over the eyes and two 1x2 px light tusks jutting up from the lower jaw corners; from behind the head
// is bare skin with only the topknot dark (no hair cap).
// family-o base.v1 (r1) — orcs (glyph o, 1.9 m): a broad orc raider on the biped rig (art/lib/beast.v1.js): a heavy
// brow, tusks jutting from an underbite, a topknot, hunched massive shoulders with a spiked pauldron, a hide kilt and
// a notched cleaver in the right hand. The skin is the recoloured ramp (recolour: skin).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-o', pass: 'x1', notes: 'broad orc, tusks, topknot, spiked pauldron, cleaver', mirror: false, recolour: 'skin' };
const H = 1.9;
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.legs(pal.skin, 2.8, 1.9); k.boots(pal.leather, 2.4, 1.5);
    k.shape('kilt', pal.leather, [[0, waist - Y(1)], [5, waist - Y(1)], [5.8, knee - Y(1)], [0, knee - Y(0.5)]]);
    k.shape('torso', pal.skin, [[0, shoulder - Y(1.2)], [4.2, shoulder - Y(0.9)], [6.6, shoulder + Y(1.2)], [7, shoulder + Y(4)], [5.6, waist - Y(0.6)], [0, waist + Y(0.3)]], { round: X(3) });
    k.add({ type: 'rect', name: 'belt', x: cx - X(5), y: waist - Y(1.4), w: X(10), h: Y(1.8), mat: pal.leather, shade: 'flat', band: 2 });
    k.add({ type: 'ellipse', name: 'pauldron', cx: cx - X(5.6), cy: shoulder, rx: X(3), ry: Y(2.2), mat: pal.cloth, shade: 'sphere', underlay: true });
    for (const d of [-1, 0, 1]) k.add({ type: 'poly', name: 'spike', mat: pal.cloth, shade: 'flat', band: 0, pts: [[cx - X(5.6) + X(d * 1.6) - X(0.6), shoulder - Y(1.6)], [cx - X(5.6) + X(d * 1.6), shoulder - Y(4)], [cx - X(5.6) + X(d * 1.6) + X(0.6), shoulder - Y(1.6)]] });
    // an arm with a round deltoid and an elbow bent well outward, so the limb curves
    const arm = (side, hx, hy) => {
      const sx = cx + side * X(6), sy = shoulder + Y(1.4), ex = cx + side * X(9), ey = (sy + hy) / 2 + Y(0.5), r = X(1.9);
      k.add({ type: 'ellipse', name: 'deltoid', underlay: true, mat: pal.skin, shade: 'sphere', cx: sx + side * X(0.6), cy: sy + Y(0.6), rx: X(2.4), ry: Y(2.6) });
      k.add({ type: 'capsule', name: 'upper-arm', underlay: true, mat: pal.skin, shade: 'cyl', a: [sx + side * X(0.8), sy + Y(1.5)], b: [ex, ey], r: r * 1.05, r1: r * 0.9 });
      k.add({ type: 'capsule', name: 'forearm', underlay: true, mat: pal.skin, shade: 'cyl', a: [ex, ey], b: [hx, hy], r: r, r1: r * 0.8 });
      k.add({ type: 'circle', name: 'hand', cx: hx, cy: hy, r: X(1.4), mat: pal.skin, shade: 'sphere' });
    };
    k.off(() => arm(1, R - X(1.5), waist + Y(0.5)));
    const hy = headY - Y(1.5), jw = 2.4, ch = 3;
    k.neck(pal.skin);
    // the skull: a domed egg, its top corners tapering, no flat helmet top
    k.add({ type: 'path', name: 'head', underlay: true, mat: pal.skin, shade: 'sphere', d: k.smooth([[cx, hy - Y(5.6)], [cx + X(2.6), hy - Y(4.8)], [cx + X(3.9), hy - Y(1.6)], [cx + X(3.7), hy + Y(1.2)], [cx + X(jw), hy + Y(ch * 0.85)], [cx - X(jw), hy + Y(ch * 0.85)], [cx - X(3.7), hy + Y(1.2)], [cx - X(3.9), hy - Y(1.6)], [cx - X(2.6), hy - Y(4.8)]]) });
    k.front(() => { for (const e of [-1.8, 1.8]) k.add({ type: 'rect', name: 'eye', x: Math.round(cx + X(e) + k.turn), y: Math.round(hy), w: 1, h: 1, color: 'accent.1' }); });
    // the underbite: a heavy lower jaw wider than the skull, jutting below it (seen from behind too)
    const jx = cx + (k.back ? 0 : k.turn);
    k.add({ type: 'path', name: 'jaw', underlay: true, mat: pal.skin, shade: 'flat', band: 1, d: k.smooth([[jx - X(3), hy + Y(2)], [jx + X(3), hy + Y(2)], [jx + X(4.2), hy + Y(3)], [jx + X(3.2), hy + Y(4.2)], [jx - X(3.2), hy + Y(4.2)], [jx - X(4.2), hy + Y(3)]]) });
    k.front(() => {
      k.add({ type: 'rect', name: 'brow', x: Math.round(cx - X(2.8) + k.turn), y: Math.round(hy) - 1, w: Math.round(X(5.6)) + 1, h: 1, mat: pal.skin, shade: 'flat', band: 2 });
      for (const s of [-1, 1]) k.add({ type: 'rect', name: 'tusk', x: Math.round(jx + s * X(3.2)), y: Math.round(hy + Y(2.6)) - 2, w: 1, h: 2, mat: pal.cloth, shade: 'flat', band: 0 });
    });
    k.add({ type: 'ellipse', name: 'topknot', cx, cy: hy - Y(4.9), rx: X(1.4), ry: Y(2), mat: pal.hair, shade: 'sphere', underlay: true });
    k.main(() => {
      arm(-1, L + X(1.5), waist - Y(1));
      k.pole(pal.leather, L + X(1.5), waist + Y(1), L + X(0.5), headY - Y(4), 0.8, 'grip');
      // a large crescent axe head on the haft's top, its edge sweeping out and down
      k.add({ type: 'path', name: 'cleaver', underlay: true, mat: pal.cloth, shade: 'bevel', d: `M${L + X(1)} ${headY - Y(3.5)} Q${L - X(1.5)} ${headY - Y(4.5)} ${L - X(4)} ${headY - Y(6)} Q${L - X(6)} ${headY + Y(0.5)} ${L - X(4)} ${shoulder + Y(1.5)} Q${L - X(2)} ${shoulder - Y(1.5)} ${L + X(1)} ${shoulder - Y(1)} Z` });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: -1.5, eyes: 1.8, hand: L => [L.L + L.X(1.5), L.waist - L.Y(1)] });
