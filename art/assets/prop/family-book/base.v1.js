// family-book base.v1 (r1) — floor item (one state): a heavy closed book, 0.15 m. Fine-voxel (k = 2) T2+ 3D model, raster renderer, grid-aligned, standing on the cell's floor diamond centre (16, h-8). Role ramps only (R11).
export const meta = { brief: 'family-book', pass: 'r1', notes: 'closed book: leather cover, page block, clasp', mirror: false };
export function render(ctx) {
  const [w, h] = ctx.size, K = 2, m = ctx.lib.t2.scene3d({ k: K });
  const add = (o) => m.add({ ...o, x: o.x / 2, y: o.y / 2, z: o.z / 2, w: o.w / 2, d: o.d / 2, h: o.h / 2 }); // authored in fine voxels
  const x0 = 5, y0 = 4;
  add({ type: 'box', name: 'cover', x: x0, y: y0, z: 0, w: 6, d: 8, h: 1, mat: 'leather' });
  add({ type: 'box', name: 'lid', x: x0, y: y0, z: 2, w: 6, d: 8, h: 1, mat: 'leather' });
  add({ type: 'box', name: 'pages', x: x0 + 1, y: y0, z: 1, w: 5, d: 7, h: 1, mat: 'cloth', hi: 'glow.0' });
  add({ type: 'slab', name: 'boss', x: x0 + 1, y: y0 + 2, z: 2, w: 4, d: 4, h: 1, mat: 'accent' });
  add({ type: 'slab', name: 'clasp', x: x0 + 6, y: y0 + 3, z: 0, w: 1, d: 2, h: 3, mat: 'metal' });
  const PX = x0 + 6 / 2, PY = y0 + 8 / 2; // footprint centre, fine voxels
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [PX / 2, PY / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
