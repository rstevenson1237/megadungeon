// family-clothing base.v2 (r2) — from base.v1. Roster v1: flat lozenge twin of armour and book; brown and teal patch
// reads as a rug or a book; needs fold lines and a hood or clasp. Changed: the stacked box slab became a soft rounded
// drape (flattened ellipsoid, all cloth blue, no leather hem) with a hood lump rising at the back, two dark fold lines
// across it and a small metal clasp at the throat, so its outline is a round mound with a bump, not a box.
export const meta = { brief: 'family-clothing', pass: 'r2', notes: 'folded cloak: rounded cloth drape, hood lump, fold lines, metal clasp', mirror: false };
export function render(ctx) {
  const [w, h] = ctx.size, K = 2, m = ctx.lib.t2.scene3d({ k: K });
  const C = ctx.dir.pal.cloth, fold = [C[2], C[2], C[2]], drape = [C[0], C[1], C[1]];
  const cx = 4, cy = 4; // footprint centre, model units
  m.add({ type: 'ellipsoid', name: 'cloak', cx, cy: cy + 0.3, cz: 0.5, rx: 2.3, ry: 1.6, rz: 0.75, mat: drape, shade: 'toon' });
  m.add({ type: 'ellipsoid', name: 'cloak', cx, cy: cy - 1.1, cz: 0.9, rx: 1.0, ry: 0.8, rz: 0.9, mat: drape, shade: 'toon' });
  for (const dy of [0.5, 1.5]) m.add({ type: 'slab', name: 'cloak', x: cx - 2.5, y: cy + dy, z: 0.5, w: 5, d: 0.5, h: 2, mat: fold });
  m.add({ type: 'slab', name: 'cloak', x: cx - 0.5, y: cy - 0.5, z: 0, w: 1, d: 1.5, h: 3, mat: 'metal' });
  return m.render(w, h, { renderer: 'raster', yaw: 0, pivot: [cx, cy, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
