// terrain-debris base.v1 (r1) — adapted from the iso chest template: a low, walkable heap (0.3 m) of broken masonry
// and rubble on the cell's floor diamond (the bottom 16 rows of the 32 x 32 frame). One fine-voxel model (k = 2, a
// voxel 2 px across, 1 px high) in T2+ 3D mode, raster renderer, grid-aligned so its footprint sits on the diamond:
// a lumpy, settled mound of grit and chips with broken wall blocks fallen in and on it, a few loose chips round it.
// ctx.variant (3) picks its own seeded heap. Role ramps only (R11): the stone ramp (masonry: full ramp; grit: its two
// darker steps) and the outline. Dirt is not in the direction's prop palette (perKind.prop), so the gate refuses it.
export const meta = { brief: 'terrain-debris', pass: 'r1', notes: 'rubble heap: grit mound + broken stone blocks', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir, v = ((ctx.variant | 0) % 3 + 3) % 3;
  const K = 2, m = ctx.lib.t2.scene3d({ k: K });
  // own seeded stream per variant so each heap is its own and stable
  let a = 0x51ed270b ^ Math.imul(v + 1, 2654435761);
  const r = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // the cell: U x U model units (a unit 2 px across the diamond's side), N x N fine voxels; heap height in fine voxels
  const U = w / 4, N = U * K, H = Math.round((ctx.brief?.height ?? 0.3) * ctx.dir.scale.metre);
  const occ = new Map(), key = (x, y, z) => `${x},${y},${z}`;
  const inside = (x, y) => x >= 1 && y >= 1 && x < N - 1 && y < N - 1;
  const put = (x, y, z, mat) => { if (inside(x, y) && z >= 0 && z < H) occ.set(key(x, y, z), mat); };
  const top = (x, y) => { let z = 0; while (occ.has(key(x, y, z))) z++; return z; };
  // grit mound: an off-centre, lumpy dome that thins out to the cell's edges
  const cx = N / 2 + (r() - 0.5) * 2.5, cy = N / 2 + (r() - 0.5) * 2.5, rx = N * (0.4 + r() * 0.05), ry = N * (0.36 + r() * 0.05);
  const lumps = [0, 1, 2, 3].map(() => [2 + r() * (N - 4), 2 + r() * (N - 4), 0.8 + r() * 1.2]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
    let ht = (1 - d) * (H - 2.5);
    for (const [lx, ly, s] of lumps) ht += d < 1.2 ? s * Math.max(0, 1 - ((x + 0.5 - lx) ** 2 + (y + 0.5 - ly) ** 2) / 6) : 0;
    ht = Math.round(ht + (r() - 0.5) * 0.8);
    for (let z = 0; z < Math.min(H - 1, ht); z++) put(x, y, z, 'grit');
  }
  // masonry: broken wall blocks (courses of 2 x 1 and 1 x 2 units, a square chunk), half sunk into the mound
  const blocks = [[5, 3, 3], [3, 5, 2], [4, 3, 2], [2, 2, 2], [3, 2, 1]];
  blocks.forEach(([bw, bd, bh], bi) => {
    const x0 = 2 + Math.floor(r() * (N - 3 - bw)), y0 = 2 + Math.floor(r() * (N - 3 - bd));
    let z = 0;
    for (let y = y0; y < y0 + bd; y++) for (let x = x0; x < x0 + bw; x++) z = Math.max(z, top(x, y) - 1);
    z = Math.max(0, Math.min(z, H - bh));
    for (let y = y0; y < y0 + bd; y++) for (let x = x0; x < x0 + bw; x++) for (let zz = z; zz < z + bh; zz++) {
      // a broken corner: one top cell knocked off
      if (zz === z + bh - 1 && bh > 1 && x === x0 + bw - 1 && y === y0 && (x0 + y0) % 2) continue;
      put(x, y, zz, `block${bi}`);
    }
  });
  // loose chips scattered on the floor round the heap
  for (let i = 0; i < 4; i++) {
    const x = 1 + Math.floor(r() * (N - 2)), y = 1 + Math.floor(r() * (N - 2));
    if (!occ.has(key(x, y, 0))) put(x, y, 0, r() < 0.5 ? `chip${i}` : 'grit');
  }
  // one part per block and chip, so the inner line separates stones that touch
  const cells = new Map();
  for (const [kk, part] of occ) { if (!cells.has(part)) cells.set(part, []); cells.get(part).push(kk.split(',').map(Number)); }
  const s = pal.stone, grit = [s[Math.min(1, s.length - 1)], s[s.length - 1]];
  for (const [part, cs] of cells) m.add(part === 'grit' ? { type: 'cells', name: 'rubble', cells: cs, mat: grit, shade: 'toon' } : { type: 'cells', name: part, cells: cs, mat: 'stone' });
  // grid-aligned (cancel the iso yaw) with the cell's ground centre on the diamond's centre
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [U / 2, U / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
