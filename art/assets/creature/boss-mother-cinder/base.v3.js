// base.v3 (r3, from base.v2): the decorated pass on the owner-approved shape (silhouette unchanged). The robe is the
// family-h recolour ramp (cloth, meta.recolour) lit along the direction's light (linear, lit side up-left), with AO
// and light noise; the brazier glows: a hot glow.0 core inside the flame, live coals in a metal bowl with a lit rim,
// a metal collar on the leather staff; the hem smoulders (a charred band with flickering embers, as decals on the
// robe); the face is lit from below by the brazier (warm under-light on the staff-side jaw, the brim shading the brow)
// with grey hair locks at the cheeks; the hat gets a hatband and linear light; the shawl gets a dark trim. From behind,
// a long grey braid and the shawl draped down the back to the sash, so front and back differ inside the line.
// base.v2 (r2): owner rejected shape - staff was hidden by the robe. Staff now held upright well clear of the flared hem (idle and walk); H=2 per brief. Bell robe, shawl, hat kept.
// boss-mother-cinder base.v1 (r1) — SHAPE DRAFT, flat materials, no proc layers. Mother Cinder: a fire-witch of family-h:
// a wide bell-shaped robe that flares to the ground, a heavy shawl over the shoulders, a tall bent-point hat with a broad
// brim, and a tall staff topped by a flaming brazier (raised on the attack). Same biped rig as family-h (art/lib/beast.v1.js).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'boss-mother-cinder', pass: 'r3', notes: 'decorated: lit robe, glowing brazier, smouldering hem, under-lit face, braid and shawl from behind', mirror: false, recolour: 'cloth' };
const H = 1.75; // body scale so hat+flame total reads 2 m
export function render(ctx) {
  const decals = [];
  const proc = p => {
    p = p.add('ao', { part: ['robe', 'shawl', 'brim'] })
      .add('materialNoise', { part: ['robe', 'shawl'], amount: 0.08, scale: 3, seed: ctx.variant ?? 0 });
    for (const d of decals) p = p.add('decal', d);
    return p;
  };
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, foot, back } = k, headY = k.headY + Y(1), fr = k.frame % 4;
    k.legs(pal.leather, 2.2, 1.5); k.boots(pal.leather);
    // bell robe: narrow at the shoulders, flaring wide to the hem; lit along the light (up-left)
    k.shape('robe', pal.cloth, [[0, shoulder - Y(1)], [4.2, shoulder], [4.6, waist], [8.6, foot - Y(3)], [9.2, foot], [0, foot + Y(0.5)]], { shade: 'cyl', axis: 'y' });
    // smouldering hem: a charred band just above the hem's line, embers flickering along it
    const hy = Math.round(foot - Y(1.5));
    decals.push({ name: 'char', part: 'robe', mat: 'accent', band: 2, shape: { type: 'rect', x: Math.round(cx - X(8.4)), y: hy, w: Math.round(X(16.8)), h: 1 } });
    const embers = [[-7, 0], [-3, 1], [2, 0], [6, 1], [-5, 1], [4, 0]].filter((_, i) => (i + fr) % 3 !== 0);
    decals.push({ name: 'embers', part: 'robe', mat: 'glow', band: 1, shape: embers.map(([dx, dy]) => ({ type: 'rect', x: Math.round(cx + X(dx)), y: hy - dy, w: 1, h: 1 })) });
    k.add({ type: 'rect', name: 'sash', x: cx - X(4.8), y: waist - Y(0.5), w: X(9.6), h: Y(1.4), mat: pal.accent, shade: 'flat', band: 1 });
    // shawl: a broad cape over the shoulders; from behind it drapes down the back to the sash
    k.shape('shawl', pal.accent, [[0, shoulder - Y(2)], [7, shoulder + Y(0.5)], [6.6, shoulder + Y(5)], [3, waist - Y(2)], [0, waist - Y(1)]], { shade: 'flat', band: 1 });
    if (back) k.shape('shawl', pal.accent, [[0, shoulder + Y(1)], [3.4, shoulder + Y(2)], [3.8, waist - Y(0.8)], [0, waist - Y(0.4)]], { shade: 'flat', band: 1 });
    decals.push({ name: 'trim', part: 'shawl', mat: 'accent', band: 2, shape: back
      ? { type: 'rect', x: Math.round(cx - X(4.4)), y: Math.round(waist - Y(1.5)), w: Math.round(X(8.8)), h: 1 }
      : [{ type: 'rect', x: Math.round(cx - X(3.6)), y: Math.round(waist - Y(2.6)), w: Math.round(X(7.2)), h: 1 }] });
    k.off(() => k.arm(1, pal.cloth, cx + X(5), waist - Y(1), { glove: pal.skin }));
    k.head(headY + Y(1), { wide: 3.4, crown: 3.4, jaw: 1.8, chin: 4.2, point: 0.5, eyes: 1.6, hair: pal.hair });
    k.front(() => {
      // the brim's shadow over the brow, the brazier's warm light under the jaw on the staff side, grey locks at the cheeks
      const fy = headY + Y(1); // the face's eye line
      k.add({ type: 'rect', name: 'brow-shadow', x: Math.round(cx - X(2.4)), y: Math.round(fy - 1), w: Math.round(X(4.8)), h: 1, color: 'skin.2' });
      k.add({ type: 'rect', name: 'under-light', x: Math.round(cx - X(1.6)), y: Math.round(fy + Y(3)), w: 2, h: 1, color: 'glow.0' });
      k.add({ type: 'rect', name: 'cheek-light', x: Math.round(cx - X(2.2)), y: Math.round(fy + Y(1.6)), w: 1, h: 1, color: 'skin.0' });
      for (const s of [-1, 1]) k.add({ type: 'rect', name: 'lock', x: Math.round(cx + s * X(2.6) - (s > 0 ? 1 : 0)), y: Math.round(fy - 1), w: 1, h: 2, mat: pal.hair, shade: 'flat', band: s < 0 ? 0 : 1 });
    });
    k.rear(() => {
      // a long grey braid down the back, over the shawl
      k.add({ type: 'capsule', name: 'braid', underlay: true, mat: pal.hair, shade: 'cyl', a: [cx, headY + Y(2)], b: [cx + X(0.5), shoulder + Y(5)], r: X(1.1), r1: X(0.7) });
      decals.push({ name: 'plait', part: 'braid', mat: 'hair', band: 2, shape: [0, 2, 4].map(dy => ({ type: 'rect', x: Math.round(cx), y: Math.round(headY + Y(3.5 + dy)), w: 1, h: 1 })) });
    });
    // hat: wide brim and a tall cone with a bent tip, lit along the light, with a hatband
    k.add({ type: 'ellipse', name: 'brim', underlay: true, cx, cy: headY - Y(1.6), rx: X(6.6), ry: Y(1.5), mat: pal.leather, shade: 'flat', band: 1 });
    k.add({ type: 'path', name: 'hat', underlay: true, mat: pal.leather, shade: 'cyl', axis: 'y', d: k.smooth([[cx - X(4), headY - Y(1.8)], [cx - X(2.2), headY - Y(4)], [cx + X(0.5), headY - Y(4.6)], [cx + X(3), headY - Y(5.2)], [cx + X(1.8), headY - Y(4)], [cx + X(4), headY - Y(1.8)]]) });
    k.add({ type: 'intersect', name: 'hatband', mat: pal.accent, shade: 'flat', band: 1, shapes: [
      { type: 'rect', x: Math.round(cx - X(4)), y: Math.round(headY - Y(2.8)), w: Math.round(X(8)), h: 1 },
      { type: 'path', d: k.smooth([[cx - X(4), headY - Y(1.8)], [cx - X(2.2), headY - Y(4)], [cx + X(0.5), headY - Y(4.6)], [cx + X(3), headY - Y(5.2)], [cx + X(1.8), headY - Y(4)], [cx + X(4), headY - Y(1.8)]]) }] });
    // staff topped with a brazier and flame; lifted forward on the attack
    k.main(() => {
      const atk = k.state === 'attack', dx = atk ? [0, X(3), X(6), X(3)][fr] : 0, dy = atk ? [0, -Y(1), 0, Y(1)][fr] : 0;
      const hx = cx - X(11.5) + dx, hy2 = waist - Y(1.5) + dy, ty = headY + Y(4.5) + dy;
      k.arm(-1, pal.cloth, hx, hy2, { glove: pal.skin });
      k.pole(pal.leather, hx, foot, hx, ty, 1, 'staff');
      k.add({ type: 'rect', name: 'collar', x: Math.round(hx - X(1)), y: Math.round(ty + Y(2.5)), w: Math.round(X(2)), h: 1, mat: pal.metal, shade: 'flat', band: 0 });
      k.add({ type: 'path', name: 'bowl', underlay: true, mat: pal.metal, shade: 'flat', band: 1, d: `M${hx - X(3.2)} ${ty - Y(2)} H${hx + X(3.2)} L${hx + X(1.2)} ${ty + Y(1.5)} H${hx - X(1.2)} Z` });
      k.add({ type: 'rect', name: 'bowl-rim', x: Math.round(hx - X(2.4)), y: Math.round(ty - Y(2)), w: Math.round(X(4.8)), h: 1, color: 'metal.0' });
      k.add({ type: 'path', name: 'flame', underlay: true, mat: pal.glow, shade: 'flat', band: 1, d: k.smooth([[hx - X(2.8), ty - Y(2)], [hx - X(3), ty - Y(6)], [hx - X(0.8), ty - Y(8)], [hx - X(0.4), ty - Y(10.5)], [hx + X(1.6), ty - Y(7.5)], [hx + X(3), ty - Y(5)], [hx + X(2.8), ty - Y(2)]]) });
      // the hot core, swaying a pixel frame to frame, and the coals at its foot
      const sw = [0, 1, 0, -1][fr] * 0.6;
      k.add({ type: 'path', name: 'flame-core', mat: pal.glow, shade: 'flat', band: 0, d: k.smooth([[hx - X(1.4), ty - Y(2.4)], [hx - X(1.4) + sw, ty - Y(5)], [hx + sw, ty - Y(7)], [hx + X(1.4) + sw, ty - Y(4.6)], [hx + X(1.4), ty - Y(2.4)]]) });
      k.add({ type: 'rect', name: 'coals', x: Math.round(hx - X(1.6)), y: Math.round(ty - Y(3)), w: Math.round(X(3.2)), h: 1, color: 'accent.1' });
    });
  }, { height: H, proc });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 1, eyes: 1.6, hand: L => [L.cx - L.X(11.5), L.waist - L.Y(1.5)] });
