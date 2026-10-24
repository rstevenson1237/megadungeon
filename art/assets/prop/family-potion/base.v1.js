// family-potion base.v1 (r1) — a stoppered glass potion bottle standing (0.25 m): round glass belly of liquid, narrow neck, cork.
// One family of floor items: a fine-voxel model (k = 2, a voxel 2 px across the diamond's side, 1 px high) in T2+ 3D
// mode, raster renderer, grid-aligned (yaw 45) so it lies on the cell's floor diamond (bottom 16 rows of the 32 x 32
// frame) with its ground centre on the diamond's centre. Role ramps only (R11): cloth (glass), accent (liquid), glow, wood (cork) and the outline.
export const meta = { brief: 'family-potion', pass: 'r1', notes: 'stoppered potion bottle', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, m = ctx.lib.t2.scene3d({ k: 2 });
  const U = w / 4, N = U * 2;
  const cells = new Map();
  const put = (part, mat, x, y, z) => { if (x < 0 || y < 0 || x >= N || y >= N) return; if (!cells.has(part)) cells.set(part, { mat, cs: [] }); cells.get(part).cs.push([x, y, z]); };
  const box = (part, mat, x0, y0, z0, bw, bd, bh) => { for (let z = z0; z < z0 + bh; z++) for (let y = y0; y < y0 + bd; y++) for (let x = x0; x < x0 + bw; x++) put(part, mat, x, y, z); };
  const cx = 7, cy = 7;
  box('belly', 'accent', cx - 1, cy - 1, 0, 4, 4, 2);   // liquid-filled round belly
  box('glass', 'cloth', cx, cy, 2, 2, 2, 1);            // shoulder / neck, glass
  box('neck', 'cloth', cx, cy, 3, 2, 2, 1);
  box('cork', 'wood', cx, cy, 4, 2, 2, 1);              // stopper
  for (const [name, { mat, cs }] of cells) m.add({ type: 'cells', name, cells: cs, mat });
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [U / 2, U / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
