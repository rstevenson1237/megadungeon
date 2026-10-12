// finish.v1 (f) on base.v4 — the one direct-pixel pass (R2), as the 6.5 review asked (heap too tall and too dark):
//  1) lower heap: the base heap's crown above h-8 is cut away, keeping its footprint, and a crown of single stones
//     1-3 px proud of the cut (tallest mid-heap) is laid on it, so the heap stands ~8-10 px instead of 15-17;
//  2) side faces in stone mid: stone's darkest step is left only for 1 px joints between stones and the outline;
//  3) the 1 px spike under the heap's front is cleared;
//  4) loose grit in stone mid (was stone dark, lost on the dark floor);
//  5) cut masonry: the two widest crown stones and the widest front-course stone get a straight top course and a
//     square dark corner; the rest are worn (near top corner rounded off).
// Every op reads the base grid (no per-variant coordinates; the layout is seeded from the heap's own footprint), so it
// re-applies to all three variants. Colours are direction tokens (stone ramp + outline only), never hex (R11).
export const base = 'base.v4';
export const meta = { notes: 'low heap (~8-10 px): tall crown cut, a crown of separate stones re-laid; faces stone mid, darkest step only in joints and outline; spike cleared; grit in mid; 3 cut-masonry stones with square corners' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const W = g.w, H = g.h;
  const L = px.color('stone.0'), M = px.color('stone.1'), D = px.color('stone.2'), K = px.color('outline');
  const op = (x, y) => x >= 0 && y >= 0 && x < W && y < H && g.alpha(x, y) === 255;
  const tok = (x, y) => (op(x, y) ? g.get(x, y) : null);

  // components (8-connected): the biggest is the heap, the rest are loose grit
  const comp = new Int32Array(W * H).fill(-1), sizes = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!op(x, y) || comp[y * W + x] >= 0) continue;
    const id = sizes.length, st = [[x, y]];
    comp[y * W + x] = id; let n = 0;
    while (st.length) {
      const [cx, cy] = st.pop(); n++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (op(nx, ny) && comp[ny * W + nx] < 0) { comp[ny * W + nx] = id; st.push([nx, ny]); }
      }
    }
    sizes.push(n);
  }
  const heapId = sizes.indexOf(Math.max(...sizes));
  const inHeap = (x, y) => op(x, y) && comp[y * W + x] === heapId;

  // 4) loose grit: its stone-dark pixels become stone mid
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (op(x, y) && !inHeap(x, y) && g.get(x, y) === D) g.set(x, y, M);

  // 3) the bottom spike: heap pixels in its lowest rows with no heap pixel left or right of them
  for (let pass = 0; pass < 2; pass++) for (let y = H - 1; y >= H - 4; y--) for (let x = 0; x < W; x++) {
    if (inHeap(x, y) && !inHeap(x - 1, y) && !inHeap(x + 1, y) && !inHeap(x, y + 1)) g.clear(x, y);
  }

  // 1) a low heap: the base heap's tall crown (every row above h-8) is cut away, leaving its wide footprint; a crown of
  //    single stones, 1-3 px proud of the cut and tallest at the middle, is laid back on it, so the silhouette is a low
  //    bumpy run of separate stones (~10 px high) instead of a tall boulder
  const Y0 = H - 8;
  const S = new Set();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inHeap(x, y)) { if (y >= Y0) S.add(y * W + x); else g.clear(x, y); }
  const inS = (x, y) => x >= 0 && y >= 0 && x < W && y < H && S.has(y * W + x);
  let seed = 0x9e3779b9;
  for (const i of [...S].sort((p, q) => p - q)) seed = Math.imul(seed ^ i, 0x85ebca6b) ^ (seed >>> 13);
  const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let a0 = -1, b0 = -1;
  for (let x = 0; x < W; x++) if (inS(x, Y0)) { if (a0 < 0) a0 = x; b0 = x; }
  const mid = (a0 + b0) / 2, half = Math.max(1, (b0 - a0) / 2);
  const crown = [];
  for (let x = a0 + 1; x < b0 - 1;) {
    let w = 4 + Math.floor(rnd() * 4);
    if (b0 - 1 - (x + w) < 4) w = b0 - 1 - x;
    if (w < 4 && crown.length) { crown[crown.length - 1].w += w; break; }
    const p = 1 - Math.abs(x + w / 2 - mid) / half;
    const hgt = Math.max(1, Math.min(3, Math.round(p * 3 + (rnd() - 0.5) * 1.2)));
    crown.push({ x, w, top: Y0 - hgt - 1, round: w >= 5 });
    x += w;
  }
  // the two widest crown stones are cut masonry: square corners, a flat top course
  crown.slice().sort((p, q) => q.w - p.w).slice(0, 2).forEach((s) => (s.round = false));
  for (const s of crown) for (let y = s.top; y <= Y0 + 1; y++) for (let x = s.x; x < s.x + s.w; x++) {
    if (s.round && y === s.top && (x === s.x || x === s.x + s.w - 1)) continue;
    S.add(y * W + x);
  }
  const edgeOf = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !inS(x + dx, y + dy));
  const inner = (x, y) => inS(x, y) && !edgeOf(x, y);
  for (const i of S) g.set(i % W, Math.floor(i / W), M);
  const paint = (x, y, c) => { if (inner(x, y)) g.set(x, y, c); };
  const colTop = (x, from) => { for (let y = from; y < H; y++) if (inner(x, y)) return y; return H; };

  // 2) + 5) the stones' faces: each a lit top course (stone light), a front face in stone mid and a 1 px joint in
  //    stone's darkest step where it turns from the light; that step is used only for these cracks and the outline.
  //    Cut stones keep a straight top course and a square dark corner; worn ones have the near top corner rounded off.
  const stone = (x0, w, y0, fh, cut, faceRows = 1) => {
    for (let i = 0; i < w; i++) {
      const x = x0 + i, y = colTop(x, y0), last = i === w - 1;
      if (y >= H) continue;
      for (let j = 0; j < faceRows; j++) paint(x, y + j, last ? (cut ? D : M) : !cut && i === 0 && w > 2 ? M : L);
      for (let j = faceRows; j < faceRows + fh; j++) paint(x, y + j, last ? D : M);
    }
  };
  for (const s of crown) stone(s.x, s.w, s.top, Y0 + 1 - s.top, !s.round, s.w >= 6 && Y0 - s.top >= 4 ? 2 : 1);
  // a staggered front course on the heap's lower slope, then small grit stones at its foot
  const joints = new Set(crown.map((s) => s.x + s.w - 1));
  const course = (y, wmin, wmax, fh, cutOne) => {
    let a = -1, b = -1;
    for (let x = 0; x < W; x++) if (inner(x, y + 1)) { if (a < 0) a = x; b = x; }
    if (a < 0) return;
    const row = [];
    for (let x = a - 1 - Math.floor(rnd() * 2); x <= b;) {
      let w = wmin + Math.floor(rnd() * (wmax - wmin + 1));
      if (joints.has(x + w - 1)) w += 1;                 // stagger: never continue a joint of the course behind
      joints.add(x + w - 1);
      row.push({ x, w });
      x += w + (wmax <= 3 && rnd() < 0.5 ? 1 : 0);
    }
    const widest = cutOne ? row.reduce((p, q) => (q.w > p.w ? q : p), row[0]) : null;
    for (const s of row) stone(s.x, s.w, y, fh, s === widest);
  };
  course(Y0 + 2, 4, 6, 2, true);
  for (let y = Y0 + 5; y < H; y += 2) course(y, 2, 3, 1, false);

  // light from the upper left: inside the silhouette, never darkest along its top/left, never lightest along its foot
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inner(x, y)) continue;
    const upL = !inner(x - 1, y) || !inner(x, y - 1), dnR = !inner(x + 1, y) || !inner(x, y + 1);
    if (upL && !dnR && g.get(x, y) === D) g.set(x, y, M);
    if (dnR && !upL && g.get(x, y) === L) g.set(x, y, M);
  }
  // silhouette: every heap pixel touching the outside is outline
  for (const i of S) { const x = i % W, y = Math.floor(i / W); if (edgeOf(x, y)) g.set(x, y, K); }
  return g;
}
