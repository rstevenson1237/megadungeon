// family-armour base.v2 (r2) — from base.v1. Roster v1: flat lozenge twin of cloak/book, too big (17 x 11), grey slab
// reads as a stone or pillow, too light. Changed: a smaller T-shaped mail shirt (body plus two sleeves laid out flat, so
// its silhouette is a T, not a slab), mid-grey ramp (metal.1 top) with metal.0 ring rows across it as mail texture, and a
// dark neck opening. Folded mail now roughly weapon width. Role ramps only (R11).
export const meta = { brief: 'family-armour', pass: 'r2', notes: 'T-shaped mail shirt laid flat: ring rows, sleeves, dark neck hole', mirror: false };
export function render(ctx) {
  const [w, h] = ctx.size, K = 2, m = ctx.lib.t2.scene3d({ k: K });
  const add = (o) => m.add({ ...o, x: o.x / 2, y: o.y / 2, z: o.z / 2, w: o.w / 2, d: o.d / 2, h: o.h / 2 }); // authored in fine voxels
  const P = ctx.dir.pal.metal, mail = [P[1], P[1], P[2]], ring = [P[0], P[0], P[1]], hole = [P[2], P[2], P[2]];
  const x0 = 6, y0 = 5;
  add({ type: 'box', name: 'body', x: x0, y: y0, z: 0, w: 4, d: 6, h: 2, mat: mail });
  add({ type: 'box', name: 'body', x: x0 - 2, y: y0, z: 0, w: 2, d: 2, h: 1, mat: mail });
  add({ type: 'box', name: 'body', x: x0 + 4, y: y0, z: 0, w: 2, d: 2, h: 1, mat: mail });
  for (const yy of [y0 + 2, y0 + 4]) add({ type: 'slab', name: 'body', x: x0, y: yy, z: 1, w: 4, d: 1, h: 1, mat: ring });
  add({ type: 'slab', name: 'body', x: x0 + 1, y: y0, z: 1, w: 2, d: 1, h: 1, mat: hole });
  const PX = x0 + 4 / 2, PY = y0 + 6 / 2; // footprint centre, fine voxels
  return m.render(w, h, { renderer: 'raster', yaw: 0, pivot: [PX / 2, PY / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
