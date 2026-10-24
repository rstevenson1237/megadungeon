// family-ammunition base.v1 (r1) — floor item (one state): a bundle of arrows, 0.1 m. Fine-voxel (k = 2) T2+ 3D model, raster renderer, grid-aligned, standing on the cell's floor diamond centre (16, h-8). Role ramps only (R11).
export const meta = { brief: 'family-ammunition', pass: 'r1', notes: 'arrow bundle: wood shafts, metal heads, cloth fletching, leather tie', mirror: false };
export function render(ctx) {
  const [w, h] = ctx.size, K = 2, m = ctx.lib.t2.scene3d({ k: K });
  const add = (o) => m.add({ ...o, x: o.x / 2, y: o.y / 2, z: o.z / 2, w: o.w / 2, d: o.d / 2, h: o.h / 2 }); // authored in fine voxels
  const x0 = 3, y0 = 6;
  for (const [i, dy] of [[0, 0], [1, 1], [2, 2]]) {
    add({ type: 'box', name: 'shaft' + i, x: x0 + 2, y: y0 + dy, z: i === 1 ? 1 : 0, w: 9, d: 1, h: 1, mat: 'wood' });
    add({ type: 'box', name: 'head' + i, x: x0 + 11, y: y0 + dy, z: i === 1 ? 1 : 0, w: 2, d: 1, h: 1, mat: 'metal' });
    add({ type: 'box', name: 'fletch' + i, x: x0, y: y0 + dy, z: i === 1 ? 1 : 0, w: 2, d: 1, h: 1, mat: 'cloth' });
  }
  add({ type: 'slab', name: 'tie', x: x0 + 6, y: y0 - 1, z: 0, w: 1, d: 5, h: 3, mat: 'leather' });
  const PX = x0 + 13 / 2, PY = y0 + 3 / 2; // footprint centre, fine voxels
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [PX / 2, PY / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
