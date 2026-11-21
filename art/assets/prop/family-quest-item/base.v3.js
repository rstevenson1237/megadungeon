// family-quest-item base.v3 (x1) — from base.v2 (7), the redo-list fix. Changed: the outline is broken at the top by
// a pinched neck, a knotted cord tie and a loose cloth tuft that flops to one side; the two thick cord bands become one
// 1px cord wrapped diagonally round the bundle (decals on the relic); the linen gets a fold and a bulge so the thing
// inside shows its shape. Lineup note: the cord moves off the red-brown leather onto the wood ramp (pale linen +
// olive hemp), so the item reads apart from the red-accented floor items at 1x. Role ramps only (R11).
export const meta = { brief: 'family-quest-item', pass: 'x1', notes: 'linen bundle, pinched neck, knot + flopped tuft, 1px diagonal hemp cord, one fold', mirror: false };
export function render(ctx) {
  const [w, h] = ctx.size, K = 4, m = ctx.lib.t2.scene3d({ k: K });
  const C = ctx.dir.pal.cloth, Wd = ctx.dir.pal.wood;
  const linen = [C[0], C[0], C[1]], hemp = [Wd[0], Wd[1], Wd[1]];
  const cx = 4, cy = 4; // footprint centre, model units
  m.add({ type: 'ellipsoid', name: 'knot', cx, cy, cz: 4.55, rx: 0.7, ry: 0.7, rz: 0.35, mat: hemp, shade: 'toon' });
  m.add({ type: 'capsule', name: 'knot', a: [cx + 0.5, cy - 0.5, 4.4], b: [cx + 1.3, cy - 0.9, 3.4], r: 0.2, mat: hemp, shade: 'toon' }); // cord end hanging loose
  m.add({ type: 'capsule', name: 'relic', a: [cx, cy, 0.9], b: [cx, cy, 3.1], r: 0.95, mat: linen, shade: 'toon' });
  m.add({ type: 'ellipsoid', name: 'relic', cx: cx + 0.35, cy: cy + 0.35, cz: 1.4, rx: 0.85, ry: 0.85, rz: 0.9, mat: linen, shade: 'toon' }); // the thing inside
  m.add({ type: 'capsule', name: 'relic', a: [cx, cy, 4.0], b: [cx, cy, 4.3], r: 0.5, mat: linen, shade: 'toon' }); // pinched neck
  m.add({ type: 'capsule', name: 'tuft', a: [cx, cy, 4.9], b: [cx, cy, 5.5], r: 0.35, r1: 0.55, mat: linen, shade: 'toon' }); // gathered cloth above the knot
  m.add({ type: 'capsule', name: 'flap', a: [cx - 0.2, cy - 0.2, 5.7], b: [cx - 1.4, cy - 1.0, 5.0], r: 0.3, r1: 0.18, mat: linen, shade: 'toon' }); // loose flap flopping over
  const g = m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [cx, cy, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts', scale: 1.25 });
  // 1px hemp cord wound diagonally round the bundle (two turns), and a fold in the linen over the bulge (R6c decals; a rendered grid names its parts by ramp, so the target is the cloth)
  const line = (x0, y0, x1, y1) => ({ type: 'poly', pts: [[x0, y0], [x1 + 1, y1], [x1 + 1, y1 + 1], [x0, y0 + 1]] });
  return ctx.lib.proc(g).noDefaults()
    .add('decal', { name: 'cord', part: 'cloth', mat: 'wood', band: 'keep', shape: [line(11, 15, 20, 19), line(11, 20, 20, 24)] })
    .add('decal', { name: 'fold', part: 'cloth', mat: 'cloth', band: 1, shape: { type: 'rect', x: 13, y: 18, w: 1, h: 2 } })
    .render();
}
