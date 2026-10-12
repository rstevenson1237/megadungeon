// terrain-debris base.v5 (extra revision) — from base.v4. One change, the form, as the blind review asked: the heap is
// no longer one mound (v4) or one horizontal bar (finish.v1) but 4-5 separate chunks of broken masonry laid over the
// cell's floor diamond (its lower ~24 x 12 px): back chunks higher on screen, front ones lower, so the pile follows the
// 2:1 diamond with depth; a 1 px outline/floor gap between chunks keeps the silhouette notched; one off-centre taller
// chunk (~9-10 px), the rest 4-7 px; some square-cut blocks, some with a broken, sloping (angled) face cut through a
// top corner; lit tops stone light, side faces stone mid (as finish.v1's cleaner faces), stone dark only in the
// cracks and joints; 2-3 small chips inside the footprint. Each of the 3 variants is its own arrangement.
// The chunks are solids (boxes with an optional cut plane) ray-cast in the fixed 2:1 projection, so occlusion and depth
// come from the model. Frame, placement (standing on the bottom diamond, which is left undrawn) and ramps as v4.
// Role ramps only (R11): stone + outline.
export const meta = { brief: 'terrain-debris', pass: 'r5', notes: 'v4 re-formed as 4-5 separate masonry chunks spread over the floor diamond with depth, one taller off-centre block, faces light/mid, dark only in joints and cracks, 2-3 chips', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir, v = ((ctx.variant | 0) % 3 + 3) % 3;
  const s = pal.stone, L = s[0], M = s[Math.min(1, s.length - 1)], D = s[s.length - 1], ink = ctx.dir.outline;
  // floor coordinates: u runs down-right, v down-left; 1 unit = 1 px across and 0.5 px down; z is px up.
  // The cell's floor diamond is u, v in [-8, 8]; the heap keeps to its lower 24 x 12 px, u, v in about [-6, 6].
  // chunk: [u0, v0, du, dv, hz, cut] — cut: 0 square-cut; 1 the top right corner broken off on a slope;
  //        2 the top left corner broken off; 3 the top sloping down toward the front
  const layouts = [
    [[-6.5, -6.5, 5, 3.5, 2.5, 1], [1, -6, 4, 4, 5, 1], [-6.5, -1.5, 3.5, 5, 3, 0], [0, 1.5, 4.5, 4, 3, 2], [-2.5, 3.5, 2, 3, 2, 0]],
    [[-6, -6.5, 3.5, 4.5, 2.5, 0], [-1.5, -6.5, 5, 3.5, 3, 2], [-6.5, -0.5, 4, 4, 5, 1], [0, -1.5, 4.5, 4, 2.5, 1], [-1.5, 4, 4.5, 2.5, 2.5, 0]],
    [[-6.5, -6.5, 4.5, 4, 3, 2], [-0.5, -6.5, 4, 3.5, 2.5, 0], [-6.5, -1, 3.5, 5, 2.5, 1], [0, -1.5, 4, 4, 5, 2], [-2, 4, 4, 2.5, 2, 0]],
  ][v];
  const chunks = layouts.map(([u0, v0, du, dv, hz, cut]) => ({ u0, v0, u1: u0 + du, v1: v0 + dv, hz, cut }));
  // the cut plane of a broken chunk: points above it are gone; returns how far above (> 0 = removed)
  const over = (c, u, vv, z) => {
    const fu = (u - c.u0) / (c.u1 - c.u0), fv = (vv - c.v0) / (c.v1 - c.v0), fz = z / c.hz;
    if (c.cut === 1) return fu * 0.8 + fz * 0.8 - 1.3;
    if (c.cut === 2) return fv * 0.8 + fz * 0.8 - 1.3;
    if (c.cut === 3) return (fu + fv) * 0.2 + fz - 1.0;
    return -1;
  };
  const inside = (c, u, vv, z) => u >= c.u0 && u <= c.u1 && vv >= c.v0 && vv <= c.v1 && z >= 0 && z <= c.hz && over(c, u, vv, z) <= 0;
  // ray-cast each pixel: along a view ray u - v = sx and (u + v) / 2 - z = sy, march from the viewer (large u + v) back
  const ox = w / 2, oy = h - 8, id = new Int8Array(w * h).fill(-1), face = new Array(w * h).fill(null), depth = new Float32Array(w * h);
  const at = (t, sx, sy) => [(t + sx) / 2, (t - sx) / 2, t / 2 - sy];
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const sx = px + 0.5 - ox, sy = py + 0.5 - oy;
    for (let t = 24; t > -24; t -= 0.05) {
      const [u, vv, z] = at(t, sx, sy);
      const ci = chunks.findIndex((c) => inside(c, u, vv, z));
      if (ci < 0) continue;
      const c = chunks[ci], [pu, pv, pz] = at(t + 0.05, sx, sy);
      // which bound did the ray cross: top, the +v (left) face, the +u (right) face, or the cut plane
      let f;
      if (over(c, pu, pv, pz) > 0 && pz <= c.hz && pu <= c.u1 && pv <= c.v1) f = 'cut';
      else if (pz > c.hz) f = 'top';
      else if (pv > c.v1) f = 'left';
      else f = 'right';
      id[py * w + px] = ci; face[py * w + px] = f; depth[py * w + px] = t;
      break;
    }
  }
  const out = new Array(w * h).fill(null);
  const get = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? -1 : id[y * w + x]);
  for (let i = 0; i < w * h; i++) {
    if (id[i] < 0) continue;
    const f = face[i], c = chunks[id[i]];
    // the sloping break faces the light when it cuts back toward the upper left (cut 2, 3), else it turns away
    out[i] = f === 'top' ? L : f === 'cut' ? (c.cut === 1 ? M : L) : M;
  }
  // joints: the front vertical corner of each block (where its left and right faces meet) in stone dark
  for (let y = 0; y < h; y++) for (let x = 0; x < w - 1; x++) {
    const i = y * w + x;
    if (id[i] < 0) continue;
    if (face[i] === 'left' && id[i + 1] === id[i] && face[i + 1] === 'right' && chunks[id[i]].hz >= 3) out[i] = D;
  }
  // a crack down the tall block's left face
  const tall = chunks.reduce((a, c, i) => (c.hz > chunks[a].hz ? i : a), 0);
  {
    const pts = { left: [], right: [] };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const f = face[y * w + x]; if (id[y * w + x] === tall && pts[f]) pts[f].push([x, y]); }
    const side = pts.left.length >= pts.right.length ? pts.left : pts.right, fname = side === pts.left ? 'left' : 'right';
    if (side.length > 6) {
      const xs = side.map((p) => p[0]), xm = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
      const col = side.filter((p) => p[0] === xm).map((p) => p[1]).sort((a, b) => a - b);
      if (col.length >= 4) {
        const y0 = col[1];
        for (let k = 0; k < 3; k++) {
          const x = xm + (k === 2 ? 1 : 0), y = y0 + k, i = y * w + x;
          if (id[i] === tall && face[i] === fname && get(x, y + 1) === tall) out[i] = D;
        }
      }
    }
  }
  // outline: the silhouette, and the edge of a back chunk where a nearer one overlaps it (the 1 px gap between chunks)
  const ol = new Array(w * h).fill(false);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (id[i] < 0) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = get(x + dx, y + dy);
      if (n < 0 || (n !== id[i] && depth[(y + dy) * w + x + dx] > depth[i])) { ol[i] = true; break; }
    }
  }
  for (let i = 0; i < w * h; i++) if (ol[i]) out[i] = ink;
  // clean-up: outline pixels that edge no stone (slivers of a ray-cast corner) are cleared, and so are lone stone
  // pixels left between them
  for (let pass = 0; pass < 2; pass++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!out[i]) continue;
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => (x + dx < 0 || y + dy < 0 || x + dx >= w || y + dy >= h ? null : out[(y + dy) * w + x + dx]));
    const stoneN = nb.filter((c) => c && c !== ink).length, anyN = nb.filter(Boolean).length;
    if ((out[i] === ink && stoneN === 0) || (out[i] !== ink && anyN <= 1)) { out[i] = null; id[i] = -1; continue; }
    // a 1 px sliver of a chunk peeking between nearer ones becomes part of the joint line
    if (out[i] !== ink && stoneN <= 1 && pass === 0) out[i] = ink;
  }
  // chips: 2-3 small stones on the floor inside the footprint, clear of the chunks: a lit or mid pixel, a mid one, ink under
  const fx = (x, y) => Math.abs(x + 0.5 - ox) / 13 + Math.abs(y + 0.5 - oy) / 6.5 <= 1;
  const clear = (x, y) => { for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 2; dx++) { if ((dx === -1 || dx === 2) && (dy === -1 || dy === 2)) continue; const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h || out[yy * w + xx]) return false; } return true; };
  // candidate spots: every clear place on the lower diamond, taken in a fixed per-variant order, kept apart
  const cand = [];
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) if (fx(x, y) && fx(x + 1, y + 1) && clear(x, y)) cand.push([x, y, ((x * 73856093) ^ (y * 19349663) ^ (v * 83492791)) >>> 0]);
  cand.sort((p, q) => p[2] - q[2]);
  const placed = [];
  for (const [x, y] of cand) {
    if (placed.length >= 3) break;
    if (!clear(x, y) || placed.some(([a2, b2]) => Math.abs(a2 - x) + Math.abs(b2 - y) < 6)) continue;
    const n = placed.length;
    out[y * w + x] = n % 2 ? M : L; out[y * w + x + 1] = M; out[(y + 1) * w + x + 1] = ink;
    placed.push([x, y]);
  }
  // paint into an (empty) scene grid
  const g = ctx.lib.t2.scene3d({ k: 2 }).render(w, h, { renderer: 'raster', yaw: 45, pivot: [0, 0, 0], at: [w / 2, h - 8], shadow: false });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = out[y * w + x]; if (c) g.set(x, y, c); else if (g.alpha(x, y) > 0) g.clear(x, y); }
  return g;
}
