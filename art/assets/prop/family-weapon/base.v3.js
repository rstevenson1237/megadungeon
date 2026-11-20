// family-weapon base.v3 (x1) — from base.v1 (R12), the redo-list fix: v1's blade was short and wide with no point and
// the chunky crossguard plus red hilt made half its length (a pistol or hammer blob; the lineup called the guard a red
// lump). v3 lays the sword along the cell's left-right diagonal (screen horizontal, so it no longer twins the key and
// rod on the grid diagonals and has the diamond's full width), centred on the diamond; the blade is about two thirds of
// the item with its bright metal top edge and tapers to a 1 px point; the crossguard is a thin gold bar across it; the
// grip and pommel are smaller, the pommel gold, no accent ramp, so it reads apart by its own steel and gold at 1x.
// Fine-voxel (k = 2) T2+ 3D model, raster renderer, grid-aligned (yaw 45). Role ramps only (R11).
export const meta = { brief: 'family-weapon', pass: 'x1', notes: 'sword on the floor: long tapered blade, thin gold cross, small hilt', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, m = ctx.lib.t2.scene3d({ k: 2 });
  const U = w / 4, N = U * 2;
  const cells = new Map();
  const put = (part, mat, x, y, z) => { if (x < 0 || y < 0 || x >= N || y >= N) return; if (!cells.has(part)) cells.set(part, { mat, cs: [] }); cells.get(part).cs.push([x, y, z]); };
  const box = (part, mat, x0, y0, z0, bw, bd, bh) => { for (let z = z0; z < z0 + bh; z++) for (let y = y0; y < y0 + bd; y++) for (let x = x0; x < x0 + bw; x++) put(part, mat, x, y, z); };
  // lies along the cell's left-right diagonal (screen horizontal), point to the left: step p runs along the sword (one
  // voxel along x and one back along y, 2 px on screen), q across it. A run is a staircase of two cells per step.
  const C = N / 2;
  const run = (part, mat, p0, p1, q = 0, h = 1) => { for (let p = p0; p <= p1; p++) for (let z = 0; z < h; z++) { put(part, mat, C + p + q, C - p + q, z); put(part, mat, C + p + q + 1, C - p + q, z); } };
  for (let p = -7; p <= -5; p++) put('blade', 'metal', C + p + 1, C - p, 0);   // the point: one cell a step, tapering
  run('blade', 'metal', -4, 2);                     // blade: two thirds of the item
  for (let q = -2; q <= 2; q++) put('guard', 'gold', C + 3 + q, C - 3 + q, 0);   // thin bar across the blade
  run('grip', 'leather', 4, 5);                     // short grip
  run('pommel', 'gold', 6, 6);                      // small pommel
  for (const [name, { mat, cs }] of cells) m.add({ type: 'cells', name, cells: cs, mat });
  const g = m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [U / 2, U / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
  // the staircase's two side faces alternate light and dark along the blade's underside: one even steel band instead
  // (a rendered grid names its parts by ramp, so the target is the metal)
  return ctx.lib.proc(g).add('decal', { name: 'underside', part: 'metal', mat: 'metal', band: 1, shape: { type: 'rect', x: 1, y: h - 8, w: w / 2 + 4, h: 1 } }).render();
}
