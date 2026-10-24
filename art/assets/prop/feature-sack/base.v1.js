// feature-sack base.v1 (r1) — adapted from the iso chest template to the brief: a tied sack of coarse cloth, 0.6 m
// (10 px tall), standing on the cell's floor-diamond centre. One fine-voxel model (k = 2, as terrain-debris): each
// voxel belongs to exactly one part (blobs are unioned into a grid with a material priority), so nothing
// interpenetrates (R5). closed: a plump sack cinched at the neck by a leather cord, a puckered tuft above; open:
// untied and slumped, wider and lower, mouth fallen open with a rolled lip and a little spill of goods (accent);
// looted: empty and flat, a slack cloth pancake with its loose cord beside it. Coarse cloth is the wood ramp (the
// khaki of burlap; the cloth ramp is blue steel); the cord is leather. Role ramps only (R11).
export const meta = { brief: 'feature-sack', pass: 'r1', notes: 'tied sack: closed / open slumped / looted flat', mirror: false };

export const params = {
  body: { type: 'swap', options: ['wood', 'leather'], default: 'wood' },
};

export function render(ctx) {
  const [w, h] = ctx.size, P = ctx.params, st = ctx.state, K = 2, m = ctx.lib.t2.scene3d({ k: K });
  const N = (w / 4) * K, C = N / 2;                  // the cell is N x N fine voxels; (C, C) is its centre
  const grid = new Map(), key = (x, y, z) => `${x},${y},${z}`;
  // blob(name, dx, dy, z0, rx, ry, rz): an ellipsoid sitting on z0; later blobs win the voxels they share
  const blob = (name, dx, dy, z0, rx, ry, rz) => {
    for (let z = Math.floor(z0); z < Math.ceil(z0 + 2 * rz); z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = ((x + 0.5 - C - dx) / rx) ** 2 + ((y + 0.5 - C - dy) / ry) ** 2 + ((z + 0.5 - z0 - rz) / rz) ** 2;
      if (d <= 1 && z >= 0) grid.set(key(x, y, z), name);
    }
  };
  if (st === 'open') {
    blob('body', 0, 0, 0, 4.4, 4.0, 2.8);
    blob('slump', 0.5, 0.3, 2.4, 3.2, 3.0, 2.0);
    blob('flop', 3.0, -0.4, 0, 2.4, 1.7, 1.3);        // cloth slid down over the side
    blob('lip', -0.3, -0.2, 4.6, 3.0, 2.8, 0.9);        // the rolled, open mouth
    blob('goods', 0.2, 0.1, 5.0, 2.0, 1.8, 0.9);
    blob('coin', 2.8, 3.2, 0, 1.2, 1.0, 0.6);
    blob('cord', -4.4, 2.6, 0, 2.0, 0.6, 0.5);
  } else if (st === 'looted') {
    blob('body', 0, 0, 0, 5.0, 4.4, 1.4);
    blob('fold', -1, -0.8, 1, 3.0, 2.0, 1.0);
    blob('fold2', 1.8, 1.4, 1, 2.0, 1.5, 0.8);
    blob('cord', 4.2, -2.4, 0, 2.0, 0.6, 0.5);
  } else {
    blob('body', 0, 0, 0, 3.9, 3.7, 2.7);
    blob('shoulder', 0, 0, 3.6, 1.7, 1.6, 2.0);
    blob('tuft', 0.5, 0, 6.0, 2.8, 2.2, 1.0);
    blob('cord', 0, 0, 5.0, 2.0, 1.9, 0.5);
  }
  const parts = new Map();
  for (const [k, part] of grid) { if (!parts.has(part)) parts.set(part, []); parts.get(part).push(k.split(',').map(Number)); }
  const mat = { cord: 'leather', goods: 'accent', coin: 'accent' };
  for (const [part, cells] of parts) m.add({ type: 'cells', name: part, cells, mat: mat[part] || P.body, shade: 'toon' });
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [C / K, C / K, 0], at: [w / 2, h - 8], shadow: true, });
}
