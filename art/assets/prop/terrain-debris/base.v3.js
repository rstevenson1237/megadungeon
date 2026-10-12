// terrain-debris base.v3 (r3) — from base.v2. One change, as the r2 review asked: the heap no longer ends abruptly
// as a pasted-on lump. A low, flat, ragged grit skirt (stone mid with a few stone-dark specks) spreads from under the
// chunks over most of the floor diamond; the heap's hard floor outline inside it becomes a stone-dark seam (only the
// skirt's thin ragged rim keeps the outer line the gate asks for), the 3D grit bed is tightened under the chunks
// (same random draws, so the chunks sit where v2 put them), and the loose grit is clustered just outside the
// skirt's edge instead of scattered over the cell. Frame and placement as v2. Role ramps only (R11): stone + outline.
export const meta = { brief: 'terrain-debris', pass: 'r3', notes: 'v2 chunks + low ragged grit skirt to ~2/3 of the diamond, grit clustered at its edge', mirror: false };

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
  // (v3: the 3D bed is drawn as v2, its random draws kept so the chunks land where they did; only its footprint is
  // tightened under the chunks, since the flat 2D skirt below now does the tapering out over the floor)
  const cx = N / 2 + (r() - 0.5) * 1.5, cy = N / 2 + (r() - 0.5) * 1.5, rx = N * 0.44, ry = N * 0.42, BED = 0.5;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
    if (d >= 1) continue;
    const ht = Math.round((1 - d) * 1.8 + (r() - 0.5) * 0.6);
    if (d >= BED) continue;
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
  // grit skirt: a flat, ragged apron under the heap reaching ~3/4 of the floor diamond (half-widths 12.5 x 6.5 px of
  // 15 x 7.5); stone mid with a few stone-dark specks; its ragged floor edge is a 1 px rim (the gate's outer line),
  // the heap's own hard floor outline inside it becomes a stone-dark seam
  const fx0 = w / 2, fy0 = h - 8, A = 12.5, B = 6.5;
  const ph = r() * 6.28, ph2 = r() * 6.28;
  const rad = (x, y) => { const t = Math.atan2((y + 0.5 - fy0) * 2, x + 0.5 - fx0); return 1 + 0.13 * Math.sin(3 * t + ph) + 0.08 * Math.sin(5 * t + ph2); };
  const dia = (x, y) => Math.abs(x + 0.5 - fx0) / A + Math.abs(y + 0.5 - fy0) / B;
  const sk = (x, y) => y < h && y >= h - 16 && x >= 0 && x < w && dia(x, y) <= rad(x, y);
  const heap = new Set();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (op(x, y)) heap.add(y * w + x);
  for (let y = h - 16; y < h; y++) for (let x = 0; x < w; x++) {
    if (!sk(x, y) || heap.has(y * w + x)) continue;
    const rim = !sk(x - 1, y) || !sk(x + 1, y) || !sk(x, y - 1) || !sk(x, y + 1);
    const speck = r();
    g.set(x, y, rim ? ink : speck < 0.07 ? dark : mid);
  }
  // the heap's old floor edge, now inside the skirt, steps down to stone dark instead of ink
  for (let y = h - 16; y < h; y++) for (let x = 0; x < w; x++) {
    if (!heap.has(y * w + x) || (g.get(x, y) || '') !== ink) continue;
    if (op(x - 1, y) && op(x + 1, y) && op(x, y - 1) && op(x, y + 1)) g.set(x, y, dark);
  }
  // loose grit and shards: clustered in a band 1-3 px outside the skirt's edge, not touching it or each other
  const inDia = (x, y) => Math.abs(x + 0.5 - w / 2) / 15 + Math.abs(y + 0.5 - (h - 8)) / 7.5 <= 1;
  const free = (x, y) => !op(x, y) && !op(x - 1, y) && !op(x + 1, y) && !op(x, y - 1) && !op(x, y + 1);
  const want = 6 + v;
  for (let n = 0, tries = 0; n < want && tries < 800; tries++) {
    const x = 1 + Math.floor(r() * (w - 2)), y = h - 16 + Math.floor(r() * 16);
    const dd = dia(x, y) / rad(x, y);
    if (dd < 1.08 || dd > 1.35 || !inDia(x, y) || !free(x, y)) continue;
    g.set(x, y, n % 3 === 2 ? mid : dark);
    n++;
  }
  return g;
}
