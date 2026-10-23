// family-weapon base.v2 (r2) — from base.v1, changed what the v1 roster and review asked: the crossguard read as a red
// lump and the red pommel repeated the rod. v2 keeps the sword on the down-right diagonal (the rod now lies on the other
// one) and makes it read as a sword: a longer blade with a raised bright edge (a one-voxel ridge along it, so the metal
// ramp's light step runs its length), a wide, clear crossguard, a leather grip and a plain metal pommel; no accent ramp.
// Fine-voxel (k = 2) T2+ 3D model, raster renderer, grid-aligned (yaw 45). Role ramps only (R11).
export const meta = { brief: 'family-weapon', pass: 'r2', notes: 'sword on the floor: long bright blade, clear cross, metal pommel', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, m = ctx.lib.t2.scene3d({ k: 2 });
  const U = w / 4, N = U * 2;
  const cells = new Map();
  const put = (part, mat, x, y, z) => { if (x < 0 || y < 0 || x >= N || y >= N) return; if (!cells.has(part)) cells.set(part, { mat, cs: [] }); cells.get(part).cs.push([x, y, z]); };
  const box = (part, mat, x0, y0, z0, bw, bd, bh) => { for (let z = z0; z < z0 + bh; z++) for (let y = y0; y < y0 + bd; y++) for (let x = x0; x < x0 + bw; x++) put(part, mat, x, y, z); };
  box('blade', 'metal', 1, 7, 0, 9, 2, 1);          // longer blade
  box('ridge', 'metal', 1, 7, 1, 9, 1, 1);          // raised edge catching the light
  box('tip', 'metal', 0, 7, 0, 1, 1, 1);
  box('guard', 'metal', 10, 3, 0, 1, 10, 2);        // wide crossguard
  box('grip', 'leather', 11, 7, 0, 3, 2, 1);
  box('pommel', 'metal', 14, 7, 0, 1, 2, 2);         // small pommel
  for (const [name, { mat, cs }] of cells) m.add({ type: 'cells', name, cells: cs, mat });
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [U / 2, U / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
