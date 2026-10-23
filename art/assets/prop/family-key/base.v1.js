// family-key base.v1 (r1) — an iron key lying on the floor (0.05 m): ring bow, shaft and two teeth.
// One family of floor items: a fine-voxel model (k = 2, a voxel 2 px across the diamond's side, 1 px high) in T2+ 3D
// mode, raster renderer, grid-aligned (yaw 45) so it lies on the cell's floor diamond (bottom 16 rows of the 32 x 32
// frame) with its ground centre on the diamond's centre. Role ramps only (R11): metal and the outline.
export const meta = { brief: 'family-key', pass: 'r1', notes: 'iron key on the floor', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, m = ctx.lib.t2.scene3d({ k: 2 });
  const U = w / 4, N = U * 2;
  const cells = new Map();
  const put = (part, mat, x, y, z) => { if (x < 0 || y < 0 || x >= N || y >= N) return; if (!cells.has(part)) cells.set(part, { mat, cs: [] }); cells.get(part).cs.push([x, y, z]); };
  const box = (part, mat, x0, y0, z0, bw, bd, bh) => { for (let z = z0; z < z0 + bh; z++) for (let y = y0; y < y0 + bd; y++) for (let x = x0; x < x0 + bw; x++) put(part, mat, x, y, z); };
  // bow (a small ring) at the far end, shaft along grid x, two teeth at the other end
  for (const [x, y] of [[2, 6], [3, 5], [4, 5], [5, 6], [5, 7], [4, 8], [3, 8], [2, 7]]) put('bow', 'metal', x, y, 0);
  box('shaft', 'metal', 5, 7, 0, 8, 1, 1);
  box('tooth1', 'metal', 11, 8, 0, 1, 2, 1);
  box('tooth2', 'metal', 13, 8, 0, 1, 2, 1);
  for (const [name, { mat, cs }] of cells) m.add({ type: 'cells', name, cells: cs, mat });
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [U / 2, U / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
