// family-clothing base.v3 (x1) — from base.v1 (6). Redo fix (art/redo.md): one clean rounded folded rectangle in the
// single cloth ramp (rounded-rectangle SDF in place of the stacked boxes), the brown leather side dropped for the cloth
// shadow step, two soft fold lines (cloth mid step) across the top, the clasp kept as a 2 px metal mark on the front edge (no accent
// red, so it reads apart from the other floor items), and no loose voxels on the right end.
export const meta = { brief: 'family-clothing', pass: 'x1', notes: 'folded cloak: rounded cloth rectangle, two fold lines, front clasp', mirror: false };
export function render(ctx) {
  const [w, h] = ctx.size, m = ctx.lib.t2.scene3d({ k: 2 });
  const C = ctx.dir.pal.cloth, fold = [C[1], C[1], C[2]];
  const cx = 4, cy = 4, hx = 2.6, hy = 1.8, hz = 0.65, R = 0.9; // footprint centre and half sizes, model units
  const rbox = (x, y, z) => { // rounded rectangle in plan, flat top: a folded cloth block with soft corners
    const qx = Math.abs(x - cx) - (hx - R), qy = Math.abs(y - cy) - (hy - R);
    const d2 = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - R;
    return Math.max(d2, Math.abs(z - hz) - hz);
  };
  m.add({ type: 'sdf', name: 'cloak', fn: rbox, bbox: [cx - hx, cy - hy, 0, cx + hx, cy + hy, hz * 2], mat: 'cloth' });
  for (const dx of [-0.9, 0.9]) m.add({ type: 'slab', name: 'cloak', x: cx + dx - 0.25, y: cy - hy, z: 0.4, w: 0.5, d: hy * 2, h: 1, mat: fold });
  m.add({ type: 'slab', name: 'clasp', x: cx - 0.5, y: cy + hy - 0.5, z: 0.5, w: 1, d: 0.6, h: 0.8, mat: 'metal' });
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [cx, cy, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
