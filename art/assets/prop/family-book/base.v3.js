// family-book base.v3 (x1) — from base.v1 (best, 7). Roster and blind review of v1: flat pink lozenge, too big (16 x 11),
// reads as a cake or brick, skin-tone top with stray dark pixels; needs spine, page edge and clasp. Changed: about two
// thirds the size (12 x 9; v2 went too small); cover on the dark leather ramp (leather.1 top, leather.2 shade) with no
// pale step, so it is brown, not pink; a pale page band (wood.0) between two cover lines on the near long side and the
// front edge; the spine on the far long side; a gold clasp on the near long side as the lighter accent, so the book reads
// apart from the red-accent items; the red boss and the inner part lines are gone (one part, no stray dark pixels on the
// top face). Role ramps only (R11).
export const meta = { brief: 'family-book', pass: 'x1', notes: 'small closed book: dark leather cover, pale page band, far spine, gold clasp', mirror: false };
export function render(ctx) {
  const [w, h] = ctx.size, K = 2, m = ctx.lib.t2.scene3d({ k: K });
  const add = (o) => m.add({ ...o, x: o.x / 2, y: o.y / 2, z: o.z / 2, w: o.w / 2, d: o.d / 2, h: o.h / 2 }); // authored in fine voxels
  const L = ctx.dir.pal.leather, W = ctx.dir.pal.wood;
  const cover = [L[1], L[1], L[2]], spine = [L[2], L[2], L[2]], page = [W[0], W[0], W[0]];
  const x0 = 6, y0 = 6, BW = 6, BD = 4;
  add({ type: 'box', name: 'book', x: x0, y: y0, z: 0, w: BW, d: BD, h: 1, mat: cover });
  add({ type: 'box', name: 'book', x: x0, y: y0, z: 1, w: BW, d: BD, h: 1, mat: page });
  add({ type: 'box', name: 'book', x: x0, y: y0, z: 2, w: BW, d: BD, h: 1, mat: cover });
  add({ type: 'slab', name: 'book', x: x0, y: y0, z: 0, w: BW, d: 1, h: 2, mat: spine });
  add({ type: 'slab', name: 'book', x: x0 + 2, y: y0 + BD - 1, z: 1, w: 2, d: 1, h: 2, mat: 'gold' });
  const PX = x0 + BW / 2, PY = y0 + BD / 2; // footprint centre, fine voxels
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [PX / 2, PY / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
