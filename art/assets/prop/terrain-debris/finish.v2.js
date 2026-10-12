// finish.v2 (f) on base.v5 — the one direct-pixel pass (R2), as the base.v5 review asked (a scatter of round,
// fully outlined pebbles; no contact shadow; 1 px grit as noise; variant-2's tight cluster is the model):
//  1) grit: loose flecks clear of the heap (components of a few pixels) are removed;
//  2) one mass: small floor gaps enclosed between chunks (stone on both sides across and up/down) are filled in stone
//     mid, and every outline pixel that no longer touches the outside becomes stone dark — the outline stays only on
//     the outer silhouette, the joints between stones read as dark cracks in one heap;
//  3) contact: along the heap's foot the stone just above the bottom outline is stone dark, a dark/outline contact
//     line that sits the heap on the floor;
//  4) broken masonry: the lit rim of each chunk's left face (stone mid beside the outer outline, under a lit top) is
//     stone light, and the top-left corner pixel of the lit tops is cut back to outline, giving angular facets.
// Every op reads the base grid (no per-variant coordinates), so it re-applies to all three variants.
// Colours are direction tokens (stone ramp + outline only), never hex (R11).
export const base = 'base.v5';
export const meta = { notes: 'one mass: grit flecks removed, enclosed gaps filled and inner outlines turned stone dark (outline only on the silhouette), dark/outline contact line, lit left rims and cut top-left corners for broken masonry' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const W = g.w, H = g.h;
  const L = px.color('stone.0'), M = px.color('stone.1'), D = px.color('stone.2'), K = px.color('outline');
  const op = (x, y) => x >= 0 && y >= 0 && x < W && y < H && g.alpha(x, y) === 255;
  const tok = (x, y) => (op(x, y) ? g.get(x, y) : null);
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // 1) components (4-connected); small ones (grit flecks) are removed
  const comps = () => {
    const comp = new Int32Array(W * H).fill(-1), list = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!op(x, y) || comp[y * W + x] >= 0) continue;
      const id = list.length, st = [[x, y]], px0 = [];
      comp[y * W + x] = id;
      while (st.length) {
        const [cx, cy] = st.pop(); px0.push([cx, cy]);
        for (const [dx, dy] of N4) {
          const nx = cx + dx, ny = cy + dy;
          if (op(nx, ny) && comp[ny * W + nx] < 0) { comp[ny * W + nx] = id; st.push([nx, ny]); }
        }
      }
      list.push(px0);
    }
    return list;
  };
  for (const c of comps()) if (c.length <= 6) for (const [x, y] of c) g.clear(x, y);

  // 2) fill enclosed gaps: a clear pixel with stone within 3 px left and right, and within 3 px above and below
  const near = (x, y, dx, dy, n) => { for (let k = 1; k <= n; k++) if (op(x + dx * k, y + dy * k)) return true; return false; };
  for (let pass = 0; pass < 3; pass++) {
    const add = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (op(x, y)) continue;
      if (near(x, y, -1, 0, 3) && near(x, y, 1, 0, 3) && near(x, y, 0, -1, 3) && near(x, y, 0, 1, 3)) add.push([x, y]);
    }
    for (const [x, y] of add) g.set(x, y, M);
    if (!add.length) break;
  }
  // components that remain apart from the biggest are joined only if they touch; otherwise left as they are
  const edge = (x, y) => N4.some(([dx, dy]) => !op(x + dx, y + dy));
  // inner outline -> stone dark; silhouette -> outline
  const snap = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (op(x, y)) snap.push([x, y, edge(x, y)]);
  for (const [x, y, e] of snap) {
    const t = g.get(x, y);
    if (e) g.set(x, y, K);
    else if (t === K) g.set(x, y, D);
  }
  // a stone-dark pixel sealed between two outline pixels of the silhouette top (a filled notch) stays dark: fine

  // 4) broken masonry facets
  //    a) the lit rim: a stone-mid pixel right of the outer outline, under a lit or outline pixel, becomes light
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (tok(x, y) !== M) continue;
    const lft = tok(x - 1, y), up = tok(x, y - 1);
    if (lft === K && edge(x - 1, y) && (up === L || up === K) && tok(x, y + 1) !== null) g.set(x, y, L);
  }
  //    b) cut corners: a lit pixel whose up and left neighbours are both silhouette outline, and whose up-left is clear,
  //       is cut back to outline (the old outline corner pixel beyond it then edges nothing and is cleared)
  const cuts = [];
  for (let y = 1; y < H; y++) for (let x = 1; x < W; x++) {
    if (tok(x, y) !== L) continue;
    if (tok(x - 1, y) === K && tok(x, y - 1) === K && tok(x + 1, y) === L && tok(x, y + 1) !== null && !op(x - 1, y - 1)) cuts.push([x, y]);
  }
  for (const [x, y] of cuts) {
    g.set(x, y, K);
    for (const [ax, ay] of [[x - 1, y], [x, y - 1]]) {
      // the outline pixel no longer borders any stone: clear it
      if (!N4.some(([dx, dy]) => { const t = tok(ax + dx, ay + dy); return t && t !== K; })) g.clear(ax, ay);
    }
  }

  // 3) contact: for each column, the stone pixel just above the lowest (outline) pixel is stone dark
  for (let x = 0; x < W; x++) {
    let yb = -1;
    for (let y = H - 1; y >= 0; y--) if (op(x, y)) { yb = y; break; }
    if (yb < 0) continue;
    const t = tok(x, yb - 1);
    if (t === L || t === M) g.set(x, yb - 1, D);
  }
  return g;
}
