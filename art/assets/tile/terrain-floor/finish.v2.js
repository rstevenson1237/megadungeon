// finish.v2 (f) on base.v4 — the one direct-pixel pass (R2), doing what base.v4's review asked, in its order:
// 1) junction ticks thinned: where joints meet or cross, the base stacks its 2 px joint runs into 2 px vertical
//    ticks (a regular dot lattice at 1x); every joint pixel that is not needed to keep two stones apart is given
//    back to the stone face, so a junction is a single dark pixel and every stone stays closed;
// 2) one or two short joints between small neighbouring stones erased per variant (stone face over them), merging
//    them into a larger flag, so each variant has a bigger slab or two and mixed stone sizes;
// 3) the base's 2-4 px worn dashes replaced by a 1 px dirt-lightest lip along most of each larger stone's upper-left
//    edge (the iso diagonal, lit from the upper left); small stones get none.
// Ops only touch pixels whose whole 3 x 3 neighbourhood lies inside the cell's diamond, so the seam ports and every
// joint crossing a cell edge stay exactly as the base drew them and the 4 variants still tile. Choices are seeded
// from each variant's own pixels; dirt tokens only.
export const base = 'base.v4';
export const meta = { notes: 'thinned junction ticks, merged small stones into slabs, 1 px upper-left lips on large stones' };

const J = 'dirt.2', F = 'dirt.1', L = 'dirt.0';
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const N8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

export function finish(g, ctx) {
  const { px } = ctx.lib, W = g.w, H = g.h;
  const tok = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : px.tokenAt(g, [x, y]));
  const dark = (x, y) => tok(x, y) === J;
  const face = (x, y) => { const t = tok(x, y); return t === F || t === L; };
  const put = (x, y, t) => { if (tok(x, y)) px.set(g, [x, y], t); };
  const interior = (x, y) => tok(x, y) && N8.every(([dx, dy]) => tok(x + dx, y + dy));
  // the cell's top row: the diamond's bottom 16 rows
  let top = 0; while (top < H && ![...Array(W).keys()].some(x => tok(x, top))) top++;

  // a seed from the cell's own pixels: each variant differs, re-renders repeat
  let a = 11;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const t = tok(x, y); a = Math.imul(a ^ (t === J ? 3 : t === L ? 5 : t ? 1 : 0), 2654435761) ^ (x * 31 + y * 7); }
  const r = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

  // the base's worn dashes go: the lips are redrawn in 3)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (tok(x, y) === L) put(x, y, F);

  // stones: 4-connected face pixels
  let lab, stones;
  const label = () => {
    lab = new Map(); stones = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!face(x, y) || lab.has(`${x},${y}`)) continue;
      const id = stones.length, pts = [], st = [[x, y]]; lab.set(`${x},${y}`, id);
      while (st.length) {
        const [qx, qy] = st.pop(); pts.push([qx, qy]);
        for (const [dx, dy] of N4) { const k = `${qx + dx},${qy + dy}`; if (face(qx + dx, qy + dy) && !lab.has(k)) { lab.set(k, id); st.push([qx + dx, qy + dy]); } }
      }
      stones.push({ id, pts, edge: pts.some(([px_, py]) => !interior(px_, py)) });
    }
  };
  const labelAt = (x, y) => lab.get(`${x},${y}`);
  // a joint pixel may become face when its face neighbours all belong to one stone (no two stones join, no pocket)
  const spare = (x, y) => {
    if (!dark(x, y) || !interior(x, y)) return false;
    const ids = new Set(N4.filter(([dx, dy]) => face(x + dx, y + dy)).map(([dx, dy]) => labelAt(x + dx, y + dy)));
    return ids.size === 1;
  };

  // --- 1) thin the vertical ticks: joint pixels stacked over / under another joint pixel
  const tick = (x, y) => dark(x, y) && (dark(x, y - 1) || dark(x, y + 1));
  for (let pass = 0; pass < 6; pass++) {
    label();
    let changed = false;
    // corners first: a tick pixel with face on two sides goes before one sitting inside the joint
    const cand = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (tick(x, y) && spare(x, y)) {
      const open = N4.filter(([dx, dy]) => face(x + dx, y + dy)).length;
      cand.push({ x, y, open });
    }
    cand.sort((p, q) => q.open - p.open || p.y - q.y || p.x - q.x);
    for (const { x, y } of cand) {
      if (!tick(x, y)) continue;
      label();
      if (!spare(x, y)) continue;
      put(x, y, F); changed = true;
    }
    if (!changed) break;
  }
  // any joint pixel left with face on three sides is a stub poking into a stone: give it back too
  label();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (dark(x, y) && interior(x, y) && N4.filter(([dx, dy]) => face(x + dx, y + dy)).length >= 3 && spare(x, y)) { put(x, y, F); label(); }
  }

  // --- 2) merge small neighbouring stones over their short shared joint
  const merges = 1 + (r() < 0.6 ? 1 : 0);
  for (let m = 0; m < merges; m++) {
    label();
    const pairs = new Map();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!dark(x, y)) continue;
      // the stones within one pixel (a joint is up to 2 px wide)
      const ids = new Set();
      for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) { const id = labelAt(x + dx, y + dy); if (id !== undefined) ids.add(id); }
      if (ids.size !== 2) continue;
      const [p, q] = [...ids].sort((u, v) => u - v), k = `${p},${q}`;
      if (!pairs.has(k)) pairs.set(k, { p, q, px: [] });
      pairs.get(k).px.push([x, y]);
    }
    const ok = [...pairs.values()].filter(P => {
      const sp = stones[P.p], sq = stones[P.q];
      if (sp.pts.length > 70 || sq.pts.length > 70 || sp.pts.length + sq.pts.length > 90) return false;
      if (P.px.length > 10) return false;
      return P.px.every(([x, y]) => interior(x, y));
    });
    if (!ok.length) break;
    // smallest pairs first, a little shuffled
    shuffle(ok).sort((u, v) => (stones[u.p].pts.length + stones[u.q].pts.length) - (stones[v.p].pts.length + stones[v.q].pts.length));
    const pick = ok[Math.floor(r() * Math.min(2, ok.length))];
    const before = stones.length;
    const saved = pick.px.map(([x, y]) => [x, y, tok(x, y)]);
    pick.px.forEach(([x, y]) => put(x, y, F));
    label();
    // exactly the two stones joined: nothing else opened
    if (stones.length !== before - 1) { saved.forEach(([x, y, t]) => put(x, y, t)); m--; ok.splice(ok.indexOf(pick), 1); if (!ok.length) break; continue; }
    // a merge can leave a lone joint pixel standing in the new slab: clear it
    for (const [x, y] of pick.px) for (const [dx, dy] of N8) {
      const qx = x + dx, qy = y + dy;
      if (dark(qx, qy) && interior(qx, qy) && N8.filter(([ex, ey]) => dark(qx + ex, qy + ey)).length <= 1 && spare(qx, qy)) put(qx, qy, F);
    }
  }

  // --- 3) the worn lip: a 1 px dirt-lightest line under each larger stone's upper-left joint (the constant-a joint
  //     rising to the right), wrapping 2-3 px round the stone's top-left corner onto its upper edge
  label();
  for (const s of stones) {
    if (s.pts.length < 22) continue;
    const mine = (x, y) => labelAt(x, y) === s.id;
    const pts = s.pts.filter(([x, y]) => dark(x, y - 1) && !dark(x + 1, y) && (dark(x - 1, y) || (face(x - 1, y) && dark(x - 1, y - 1) && dark(x - 2, y))))
      .sort((p, q) => p[1] - q[1] || p[0] - q[0]);
    if (pts.length < 2) continue;
    // most of it: the lowest pixel (the stone's left corner) stays plain on long edges
    const keep = pts.length >= 6 && r() < 0.6 ? pts.slice(0, pts.length - 1) : pts;
    // the corner wrap: from the topmost lip pixel, on along the upper edge while the joint stays overhead
    let [cx, cy] = pts.filter(p => p[1] === pts[0][1]).pop();
    const wrap = 2 + (r() < 0.5 ? 1 : 0);
    for (let i = 0; i < wrap; i++) {
      if (!(mine(cx + 1, cy) && dark(cx + 1, cy - 1))) break;
      cx++;
      keep.push([cx, cy]);
    }
    keep.forEach(([x, y]) => put(x, y, L));
  }
  return g;
}
