// family-quest-item base.v2 (r2) — from base.v1. Roster v1: round blob (stone, coin pile or pouch; silhouette twin of the
// sack) and the dark blue base with an orange glow on top read as a lit brazier. Changed: no glow at all; the relic is an
// upright, narrow wrapped bundle (a capsule standing on end, tied off in a knot at the top) in pale linen (cloth.0 top,
// cloth.1 shade) with two dark leather cord bands around it, so it reads tall and tied, not
// round. Role ramps only (R11).
export const meta = { brief: 'family-quest-item', pass: 'r2', notes: 'upright wrapped relic: pale linen bundle, two cord bands, knot on top, no glow', mirror: false };
export function render(ctx) {
  const [w, h] = ctx.size, K = 2, m = ctx.lib.t2.scene3d({ k: K });
  const C = ctx.dir.pal.cloth, Lt = ctx.dir.pal.leather;
  const linen = [C[0], C[0], C[1]], cord = [Lt[1], Lt[1], Lt[1]];
  const cx = 4, cy = 4; // footprint centre, model units
  m.add({ type: 'capsule', name: 'relic', a: [cx, cy, 0.9], b: [cx, cy, 2.5], r: 1, mat: linen, shade: 'toon' });
  m.add({ type: 'ellipsoid', name: 'relic', cx, cy, cz: 4.1, rx: 0.8, ry: 0.8, rz: 0.45, mat: linen, shade: 'toon' });
  for (const z of [1, 2.5]) m.add({ type: 'slab', name: 'relic', x: cx - 1.5, y: cy - 1.5, z, w: 3, d: 3, h: 0.5, mat: cord });
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [cx, cy, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
