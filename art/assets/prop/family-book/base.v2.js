// family-book base.v2 (r2) — from base.v1. Roster v1: flat lozenge twin of cloak and armour, too big (16 x 11), pinkish
// slab reads as a cake or a brick (skin-tone top), needs spine, page edge and clasp. Changed: about two thirds the size, a
// taller closed block; cover on a leather ramp without its pale step (leather.1 top, leather.2 sides) so it is brown, not
// pink; a pale page edge (wood.0) on the two open sides; a dark raised spine on the third; a metal clasp; the red accent
// boss is gone. Role ramps only (R11).
export const meta = { brief: 'family-book', pass: 'r2', notes: 'small closed book: brown cover, pale page edge, dark spine, metal clasp', mirror: false };
export function render(ctx) {
  const [w, h] = ctx.size, K = 2, m = ctx.lib.t2.scene3d({ k: K });
  const add = (o) => m.add({ ...o, x: o.x / 2, y: o.y / 2, z: o.z / 2, w: o.w / 2, d: o.d / 2, h: o.h / 2 }); // authored in fine voxels
  const L = ctx.dir.pal.leather, W = ctx.dir.pal.wood;
  const cover = [L[1], L[1], L[2]], spine = [L[2], L[2], L[2]], page = [W[0], W[0], W[1]];
  const x0 = 6, y0 = 4;
  add({ type: 'box', name: 'book', x: x0, y: y0, z: 0, w: 6, d: 4, h: 1, mat: cover });
  add({ type: 'box', name: 'book', x: x0, y: y0, z: 1, w: 6, d: 4, h: 2, mat: page });
  add({ type: 'box', name: 'book', x: x0, y: y0, z: 3, w: 6, d: 4, h: 1, mat: cover });
  add({ type: 'slab', name: 'book', x: x0, y: y0, z: 0, w: 6, d: 1, h: 4, mat: spine });
  add({ type: 'slab', name: 'book', x: x0 + 2, y: y0 + 3, z: 1, w: 1, d: 1, h: 2, mat: 'metal' });
  const PX = x0 + 6 / 2, PY = y0 + 4 / 2; // footprint centre, fine voxels
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [PX / 2, PY / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
