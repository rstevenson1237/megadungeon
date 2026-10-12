// terrain-debris base.v4 (r4, extra revision) — from base.v3. One change, as the v3 review asked: the grit skirt's edge. Its left and
// right tips no longer end in hard outlined spurs (the dark halo / right-hand fin of variant 1): the skirt's solid part
// stops at a ragged cut ~4/5 of the way out and its tips taper into 1 px-high stone-dark grit pairs; the outline runs
// only along the skirt's front (lower) edge, its back rim is stone dark; and the specks and loose grit are laid as 2-3 px
// clusters (loose chips: a stone-dark pixel over an outlined pair) instead of single pixels, so the edge is not noisy with orphans. Heap, chunks, frame and placement as v3.
// Role ramps only (R11): stone + outline.
export const meta = { brief: 'terrain-debris', pass: 'r4', notes: 'v3 with the skirt tips tapered to stone-dark grit, outline only on the front-bottom edge, grit in 2-3 px clusters', mirror: false };

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
  // v4: the solid skirt stops at a ragged per-row cut ~4/5 of the way out; past it, the tips are grit only
  const cut = [];
  for (let y = 0; y < 16; y++) cut.push([A * (0.8 + r() * 0.12), A * (0.8 + r() * 0.12)]);
  const solid = (x, y) => sk(x, y) && Math.abs(x + 0.5 - fx0) <= cut[y - (h - 16)][x + 0.5 < fx0 ? 0 : 1];
  const front = (x, y) => y + 0.5 >= fy0;
  const grit = new Map();   // planned grit pixels: index -> colour, laid in 2-3 px clusters
  const clump = (x, y, col, n) => {
    const cl = [[x, y], [x + 1, y], [x + (r() < 0.5 ? 0 : 1), y + 1]].slice(0, n);
    for (const [px, py] of cl) if (px >= 0 && px < w && py >= h - 16 && py < h) grit.set(py * w + px, col);
  };
  for (let y = h - 16; y < h; y++) for (let x = 0; x < w; x++) {
    if (!solid(x, y) || heap.has(y * w + x)) continue;
    const rim = !solid(x - 1, y) || !solid(x + 1, y) || !solid(x, y - 1) || !solid(x, y + 1);
    g.set(x, y, rim ? (front(x, y) ? ink : dark) : mid);
  }
  // specks inside the skirt: a few stone-dark pairs on its mid, never on its rim
  for (let n = 0, tries = 0; n < 3 && tries < 200; tries++) {
    const x = Math.floor(r() * (w - 1)), y = h - 16 + Math.floor(r() * 15);
    if (![[x, y], [x + 1, y]].every(([px, py]) => g.get(px, py) === mid && !heap.has(py * w + px))) continue;
    g.set(x, y, dark); g.set(x + 1, y, dark); n++;
  }
  // the heap's old floor edge, now inside the skirt, steps down to stone dark instead of ink
  for (let y = h - 16; y < h; y++) for (let x = 0; x < w; x++) {
    if (!heap.has(y * w + x) || (g.get(x, y) || '') !== ink) continue;
    if (op(x - 1, y) && op(x + 1, y) && op(x, y - 1) && op(x, y + 1)) g.set(x, y, dark);
  }
  // the tapered tips: past the cut, the skirt's footprint is a few 1 px-high stone-dark grit pairs, thinning outward
  const inDia = (x, y) => Math.abs(x + 0.5 - w / 2) / 15 + Math.abs(y + 0.5 - (h - 8)) / 7.5 <= 1;
  const free = (x, y) => [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [2, 0], [1, -1], [1, 1]].every(([dx, dy]) => !op(x + dx, y + dy) && !grit.has((y + dy) * w + x + dx));
  for (const side of [-1, 1]) for (let n = 0, tries = 0; n < 1 && tries < 300; tries++) {
    const x = Math.floor(fx0 + side * (A * 0.85 + r() * A * 0.25)), y = h - 16 + Math.floor(r() * 16);
    if (!sk(x, y) || solid(x, y) || !inDia(x + 1, y) || !free(x, y)) continue;
    clump(x, y, dark, 2); n++;
  }
  // loose grit and shards: a few 2-3 px clusters in a band just outside the skirt's edge, not touching it or each other
  const want = 3 + (v === 2 ? 1 : 0);
  for (let n = 0, tries = 0; n < want && tries < 800; tries++) {
    const x = 1 + Math.floor(r() * (w - 3)), y = h - 16 + Math.floor(r() * 15);
    const dd = dia(x, y) / rad(x, y);
    if (dd < 1.08 || dd > 1.35 || !inDia(x, y) || !inDia(x + 1, y + 1) || !free(x, y) || !free(x, y + 1) || !free(x + 1, y + 1)) continue;
    // a 3 px chip: one stone-dark pixel over a pair outlined along its front-bottom edge
    const dx = r() < 0.5 ? 0 : 1;
    grit.set(y * w + x + dx, dark); grit.set((y + 1) * w + x, ink); grit.set((y + 1) * w + x + 1, ink); n++;
  }
  for (const [i, col] of grit) g.set(i % w, Math.floor(i / w), col);
  return g;
}
