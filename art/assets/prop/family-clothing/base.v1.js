// family-clothing base.v1 (r1) — floor item (one state): a folded cloak, 0.15 m. Fine-voxel (k = 2) T2+ 3D model, raster renderer, grid-aligned, standing on the cell's floor diamond centre (16, h-8). Role ramps only (R11).
export const meta = { brief: 'family-clothing', pass: 'r1', notes: 'folded cloak: cloth stack with a clasp', mirror: false };
export function render(ctx) {
  const [w, h] = ctx.size, K = 2, m = ctx.lib.t2.scene3d({ k: K });
  const add = (o) => m.add({ ...o, x: o.x / 2, y: o.y / 2, z: o.z / 2, w: o.w / 2, d: o.d / 2, h: o.h / 2 }); // authored in fine voxels
  const x0 = 4, y0 = 5;
  add({ type: 'box', name: 'fold1', x: x0, y: y0, z: 0, w: 8, d: 6, h: 1, mat: 'cloth' });
  add({ type: 'box', name: 'fold2', x: x0 + 1, y: y0, z: 1, w: 7, d: 6, h: 1, mat: 'cloth' });
  add({ type: 'box', name: 'fold3', x: x0, y: y0 + 1, z: 2, w: 7, d: 5, h: 1, mat: 'cloth' });
  add({ type: 'slab', name: 'hem', x: x0, y: y0 + 5, z: 0, w: 8, d: 1, h: 3, mat: 'leather' });
  add({ type: 'box', name: 'clasp', x: x0 + 5, y: y0 + 2, z: 3, w: 1, d: 1, h: 1, mat: 'accent' });
  const PX = x0 + 8 / 2, PY = y0 + 6 / 2; // footprint centre, fine voxels
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [PX / 2, PY / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
