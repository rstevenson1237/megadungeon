// family-quest-item base.v4 (x2) — from base.v3 (6), the wave 1 retry (several named fixes, both reviewers). Changed:
// the tall bottle becomes a squat, wide, uneven cloth bundle (~12 px tall, ~15 px wide) lying low; the narrow neck is
// gone, replaced by a pinched, flared 3-4 px cloth tuft above the cord knot; the 1px diagonal hemp cord stays and bites
// into the cloth with fold clusters; the straight vertical highlight and the pale label patch are dropped for short
// fold highlights. Role ramps only (R11).
export const meta = { brief: 'family-quest-item', pass: 'x2', notes: 'squat uneven linen bundle, flared tuft over knot, 1px diagonal hemp cord, fold clusters', mirror: false };
export function render(ctx) {
  const [w, h] = ctx.size, K = 4, m = ctx.lib.t2.scene3d({ k: K });
  const C = ctx.dir.pal.cloth, Wd = ctx.dir.pal.wood;
  const linen = [C[0], C[1], C[1]], hemp = [Wd[0], Wd[1], Wd[1]];
  const cx = 4, cy = 4; // footprint centre, model units
  // the bundle: a low, wide lump, lopsided by the thing wrapped inside
  m.add({ type: 'ellipsoid', name: 'relic', cx, cy, cz: 0.8, rx: 1.5, ry: 1.25, rz: 0.85, mat: linen, shade: 'toon' });
  m.add({ type: 'ellipsoid', name: 'relic', cx: cx + 0.7, cy: cy - 0.5, cz: 0.75, rx: 1.0, ry: 0.85, rz: 0.75, mat: linen, shade: 'toon' }); // bulge of the relic
  m.add({ type: 'ellipsoid', name: 'relic', cx: cx - 0.6, cy: cy + 0.5, cz: 0.6, rx: 0.85, ry: 0.8, rz: 0.6, mat: linen, shade: 'toon' }); // slumped corner
  // gathered top: the knot and a pinched, flared tuft of cloth above it
  m.add({ type: 'ellipsoid', name: 'knot', cx, cy, cz: 1.75, rx: 0.42, ry: 0.42, rz: 0.2, mat: hemp, shade: 'toon' });
  m.add({ type: 'capsule', name: 'tuft', a: [cx, cy, 1.85], b: [cx, cy, 2.55], r: 0.15, r1: 0.45, mat: linen, shade: 'toon' });
  m.add({ type: 'capsule', name: 'tuft', a: [cx, cy, 2.45], b: [cx - 0.5, cy + 0.45, 2.3], r: 0.28, r1: 0.16, mat: linen, shade: 'toon' }); // ear flopping left
  m.add({ type: 'capsule', name: 'tuft', a: [cx, cy, 2.45], b: [cx + 0.45, cy - 0.4, 2.8], r: 0.28, r1: 0.16, mat: linen, shade: 'toon' }); // ear flaring right
  m.add({ type: 'capsule', name: 'knot', a: [cx + 0.25, cy - 0.25, 1.75], b: [cx + 0.95, cy - 0.85, 1.25], r: 0.15, mat: hemp, shade: 'toon' }); // loose cord end
  const g = m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [cx, cy, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts', scale: 1.25 });
  // 1px hemp cord wound diagonally round the bundle (two turns, from the knot), biting into the linen, with fold clusters
  // where it bites: a dark crease under the cord and a short highlight on the puffed cloth above it (R6c decals)
  const px = (pts) => pts.map(([x, y]) => ({ type: 'rect', x, y, w: 1, h: 1 }));
  return ctx.lib.proc(g).noDefaults()
    .add('decal', { name: 'cord', part: 'cloth', mat: 'wood', band: 1, shape: px([[11, 21], [12, 21], [13, 22], [14, 22], [15, 23], [16, 23], [17, 24], [18, 24],
      [16, 21], [17, 21], [18, 22], [19, 22], [20, 23], [21, 23]]) })
    .add('decal', { name: 'crease', part: 'cloth', mat: 'cloth', band: 2, shape: px([[11, 22], [12, 23], [16, 22], [19, 23]]) })
    .add('decal', { name: 'foldlight', part: 'cloth', mat: 'cloth', band: 0, shape: px([[13, 21], [18, 21], [20, 22], [19, 24]]) })
    .render();
}
