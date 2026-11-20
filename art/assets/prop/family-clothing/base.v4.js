// family-clothing base.v4 (x2) — from base.v3 (6.5). Blind-miss retry (striped pillow/stone): the single rounded block
// becomes three flat folds stacked and stepped back so each front face shows a hem lip; the two light fold stripes are
// dropped (each fold's top is lit from the cloth ramp, its side is the one shadow step under it); the dark front-left
// notch is closed by a hem flap hanging over the front edge; the clasp becomes a 2 px gold mark on the top fold's front
// edge (a cloak cue, no shared accent red), and the folds sit mostly on the cloth mid step, away from the slate floor.
export const meta = { brief: 'family-clothing', pass: 'x2', notes: 'folded cloak: three stacked folds with hem lips, hanging hem flap, gold clasp', mirror: false };
export function render(ctx) {
  const [w, h] = ctx.size, m = ctx.lib.t2.scene3d({ k: 2 });
  const cx = 4, cy = 4;
  const fold = (name, hx, hy, z0, hz, R, ox = 0, oy = 0) => { // a flat rounded fold of cloth, footprint centre offset
    const fx = cx + ox, fy = cy + oy;
    const fn = (x, y, z) => {
      const qx = Math.abs(x - fx) - (hx - R), qy = Math.abs(y - fy) - (hy - R);
      const d2 = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - R;
      return Math.max(d2, Math.abs(z - z0 - hz) - hz);
    };
    m.add({ type: 'sdf', name, fn, bbox: [fx - hx, fy - hy, z0, fx + hx, fy + hy, z0 + 2 * hz], mat: 'cloth' });
  };
  fold('fold1', 2.8, 1.9, 0, 0.4, 0.7);
  fold('fold2', 2.3, 1.5, 0.8, 0.3, 0.6, -0.4, -0.35);
  // hem flap hanging from the top fold down over the front faces (raised trim, fills only empty cells)
  m.add({ type: 'slab', name: 'hem', x: cx - 2.1, y: cy + 1.1, z: 0, w: 1.3, d: 1.2, h: 1.5, mat: 'cloth', add: true });
  m.add({ type: 'slab', name: 'clasp', x: cx - 0.4, y: cy + 0.7, z: 0.9, w: 0.8, d: 0.4, h: 0.5, mat: 'gold' });
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [cx, cy, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
