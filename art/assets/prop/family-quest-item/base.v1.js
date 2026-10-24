// family-quest-item base.v1 (r1) — floor item (one state): a wrapped relic tied with cord, 0.3 m. Fine-voxel (k = 2) T2+ 3D model, raster renderer, grid-aligned, standing on the cell's floor diamond centre (16, h-8). Role ramps only (R11).
export const meta = { brief: 'family-quest-item', pass: 'r1', notes: 'relic bundle: cloth wrap, cord bands, glow gem peeking', mirror: false };
export function render(ctx) {
  const [w, h] = ctx.size, K = 2, m = ctx.lib.t2.scene3d({ k: K });
  const add = (o) => m.add({ ...o, x: o.x / 2, y: o.y / 2, z: o.z / 2, w: o.w / 2, d: o.d / 2, h: o.h / 2 }); // authored in fine voxels
  const x0 = 5, y0 = 5;
  add({ type: 'box', name: 'wrap', x: x0, y: y0, z: 0, w: 6, d: 6, h: 4, mat: 'cloth' });
  add({ type: 'box', name: 'wraptop', x: x0 + 1, y: y0 + 1, z: 4, w: 4, d: 4, h: 1, mat: 'cloth' });
  add({ type: 'slab', name: 'cord1', x: x0, y: y0, z: 1, w: 6, d: 6, h: 1, mat: 'leather' });
  add({ type: 'slab', name: 'cord2', x: x0 + 2, y: y0, z: 0, w: 1, d: 6, h: 5, mat: 'leather' });
  add({ type: 'box', name: 'gem', x: x0 + 2, y: y0 + 2, z: 5, w: 2, d: 2, h: 1, mat: 'glow', hi: 'glow.0' });
  const PX = x0 + 6 / 2, PY = y0 + 6 / 2; // footprint centre, fine voxels
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [PX / 2, PY / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
