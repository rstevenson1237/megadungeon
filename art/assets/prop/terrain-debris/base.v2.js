// terrain-debris base.v2 (r2) — from base.v1. One change, as the r1 review asked: the form is rebuilt as 3-5 distinct
// cut-stone chunks (squared boxes, each its own part so the light gives it a light top / mid left / dark right face)
// piled in a low grit mound that tapers out to the diamond's edges, with 4-8 loose single-pixel grit/shards on the
// floor round it; inside the heap the seams between chunks are stone dark, not the outline (outline stays on the
// silhouette only). Same frame and placement as v1: the heap stands on the cell's floor diamond (bottom 16 rows of
// the 32 x 32 frame), k = 2 fine voxels, raster renderer, grid-aligned. ctx.variant (3) picks its own seeded pile.
// Role ramps only (R11): stone (chunks: full ramp; grit: its two darker steps) and the outline.
export const meta = { brief: 'terrain-debris', pass: 'r2', notes: 'low mound of 3-5 cut-stone chunks + loose grit, stone-dark seams', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir, v = ((ctx.variant | 0) % 3 + 3) % 3;
  const K = 2, m = ctx.lib.t2.scene3d({ k: K });
  let a = 0x51ed270b ^ Math.imul(v + 1, 2654435761);
  const r = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const U = w / 4, N = U * K;
  const occ = new Map(), key = (x, y, z) => `${x},${y},${z}`;
  const inside = (x, y) => x >= 1 && y >= 1 && x < N - 1 && y < N - 1;
  const put = (x, y, z, mat) => { if (inside(x, y) && z >= 0) occ.set(key(x, y, z), mat); };
  const top = (x, y) => { let z = 0; while (occ.has(key(x, y, z))) z++; return z; };
  // grit bed: a low, wide bed (1-2 voxels at its crown) that runs out to nothing near the diamond's edges
  const cx = N / 2 + (r() - 0.5) * 1.5, cy = N / 2 + (r() - 0.5) * 1.5, rx = N * 0.44, ry = N * 0.42;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
    if (d >= 1) continue;
    const ht = Math.round((1 - d) * 1.8 + (r() - 0.5) * 0.6);
    for (let z = 0; z < ht; z++) put(x, y, z, 'grit');
  }
  // cut-stone chunks: [w, d, h] in fine voxels and a placement zone (fraction of the cell), biggest at the crown,
  // the rest lower down the slopes; each variant drops one or two and jitters the rest
  const chunks = [
    { s: [5, 4, 3], at: [0.5, 0.45] },   // crown block
    { s: [3, 5, 2], at: [0.27, 0.6] },   // left slope, long side down the slope
    { s: [4, 3, 2], at: [0.68, 0.72] },  // front-right, low
    { s: [3, 3, 2], at: [0.7, 0.28] },   // back-right
    { s: [2, 2, 1], at: [0.32, 0.25] },  // small chip, back-left
  ];
  const drop = [[3], [4], [1]][v];
  chunks.forEach(({ s: [bw, bd, bh], at: [fx, fy] }, bi) => {
    if (drop.includes(bi)) return;
    if (v === 1 && bi === 0) [bw, bd] = [bd, bw];
    const x0 = Math.max(2, Math.min(N - 2 - bw, Math.round(fx * N - bw / 2 + (r() - 0.5) * 2)));
    const y0 = Math.max(2, Math.min(N - 2 - bd, Math.round(fy * N - bd / 2 + (r() - 0.5) * 2)));
    let z = 0;
    for (let y = y0; y < y0 + bd; y++) for (let x = x0; x < x0 + bw; x++) z = Math.max(z, top(x, y));
    const broken = r() < 0.6;
    for (let y = y0; y < y0 + bd; y++) for (let x = x0; x < x0 + bw; x++) for (let zz = z; zz < z + bh; zz++) {
      // a knocked-off corner on the top course so it reads as broken masonry, not a box
      if (broken && bh > 1 && zz === z + bh - 1 && x === x0 + bw - 1 && y === y0) continue;
      occ.set(key(x, y, zz), `chunk${bi}`);
    }
  });
  const cells = new Map();
  for (const [kk, part] of occ) { if (!cells.has(part)) cells.set(part, []); cells.get(part).push(kk.split(',').map(Number)); }
  const s = pal.stone, dark = s[s.length - 1], mid = s[Math.min(1, s.length - 1)];
  for (const [part, cs] of cells) m.add(part === 'grit' ? { type: 'cells', name: 'rubble', cells: cs, mat: [mid, dark], shade: 'toon' } : { type: 'cells', name: part, cells: cs, mat: 'stone' });
  const g = m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [U / 2, U / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
  // seams inside the heap: inner ink becomes stone dark; the silhouette keeps the outline
  const ink = (ctx.dir.outline || '').toLowerCase(), op = (x, y) => g.alpha(x, y) > 0;
  const seams = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if ((g.get(x, y) || '') !== ink) continue;
    if (op(x - 1, y) && op(x + 1, y) && op(x, y - 1) && op(x, y + 1)) seams.push([x, y]);
  }
  for (const [x, y] of seams) g.set(x, y, dark);
  // loose grit and shards on the floor round the pile: single pixels inside the diamond, clear of the heap
  const inDia = (x, y) => Math.abs(x + 0.5 - w / 2) / 15 + Math.abs(y + 0.5 - (h - 8)) / 7.5 <= 1;
  const free = (x, y) => !op(x, y) && !op(x - 1, y) && !op(x + 1, y) && !op(x, y - 1) && !op(x, y + 1);
  const want = 5 + v;
  for (let n = 0, tries = 0; n < want && tries < 400; tries++) {
    const x = 1 + Math.floor(r() * (w - 2)), y = h - 16 + Math.floor(r() * 16);
    if (!inDia(x, y) || !free(x, y)) continue;
    g.set(x, y, n % 3 === 0 ? s[0] : mid);
    n++;
  }
  return g;
}
