// terrain-lava base.v4 (x1) — from base.v3. One change (form), as the blind re-score asked: the single warped vein
// (which closed into the same oval in every tile, a grid of eyes) and the scattered outline specks are gone. The crust
// is now 3 large irregular plates (6-10 px across: a warped, slightly sheared Voronoi on the tile lattice (32, 0) /
// (16, 8), seeds placed unevenly so no border runs along a diamond edge), two of them fused so the crack between them
// shows only as an open spur and the plates never tile into one repeated closed ring. Plates are accent's darkest, each
// with a slightly lighter irregular patch (accent mid) up and left of its centre, clear of the cracks. Between them run
// continuous 1 px cracks on diagonal slants: glow mid along the body, glow light only where cracks meet and at a
// crack's centre line when the heat wave peaks. No outline colour and no single-pixel sparks in the plates. The surface
// is periodic on the tile lattice, so diamonds tile seamlessly; the 4-frame loop (ctx.t) pulses only the cracks'
// brightness. Ramps: accent and glow only.
export const meta = { brief: 'terrain-lava', pass: 'x1', notes: 'large irregular crust plates with lit upper-left patches, continuous 1 px glowing cracks, open spur, crack-only pulse' };

export const params = {
  heat: { type: 'range', min: 0.6, max: 1.4, step: 0.2, default: 1 },
  warp: { type: 'range', min: 1, max: 4, step: 0.5, default: 2 },
};

// plate seeds in the tile's 32 x 8 period strip (lattice (32, 0), (16, 8)); uneven, so borders cross the edges at slants
const SEEDS = [[4, 1], [13, 5.5], [25, 3]];
const SKEW = 0.25; // the distance metric is sheared so plate borders run on diagonal slants, not upright
// plates 0 and 3 are fused: their shared crack shows only as a spur where the mask allows
const FUSED = [0, 2];

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, [w, h] = ctx.size, N = ctx.lib.tex.noise;
  const S = 16, seed = ctx.seed + 7 * ctx.variant, tau = Math.PI * 2, t = ctx.t || 0;
  const A = pal.accent, G = pal.glow, last = A.length - 1;
  const g = ctx.lib.tex.material('lava', { size: [w, h], seed });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) g.clear(x, y);
  const o = { w: S, h: S };
  const uv = (x, y) => {
    const sx = (x + 0.5 - w / 2) / w, sy = (y + 0.5) / h;
    return [(sx + sy) * S, (sy - sx) * S];
  };
  const memo = new Map();
  // nearest plate (with its seed offset) and the gap to the second nearest, in warped screen space over the lattice
  const cell = (x, y) => {
    const key = x * 1000 + y;
    if (memo.has(key)) return memo.get(key);
    const [u, v] = uv(x, y);
    const wx = P.warp * 2 * (N.gradient(u, v, { ...o, cells: 2, octaves: 2, seed: seed + 3 }) - 0.5);
    const wy = P.warp * (N.gradient(u, v, { ...o, cells: 2, octaves: 2, seed: seed + 4 }) - 0.5);
    const X = x + 0.5 + wx, Y = y + 0.5 + wy;
    let d1 = 1e9, d2 = 1e9, id = -1, du = 0, dv = 0;
    for (let i = 0; i < SEEDS.length; i++) for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
      const px = SEEDS[i][0] + 32 * a + 16 * b, py = SEEDS[i][1] + 8 * b;
      const ex = X - px, ey = Y - py, d = Math.hypot(ex - SKEW * ey, 1.3 * ey);
      if (d < d1) { d2 = d1; d1 = d; id = i; du = X - px; dv = Y - py; } else if (d < d2) d2 = d;
    }
    const r = { id, group: id === FUSED[1] ? FUSED[0] : id, gap: d2 - d1, d1, du, dv, u, v };
    memo.set(key, r);
    return r;
  };
  // the spur mask: where the fused plates' old border still shows as a crack
  const spur = (x, y) => { const c = cell(x, y); return N.gradient(c.u, c.v, { ...o, cells: 2, seed: seed + 21 }) > 0.52; };
  // a crack pixel: its right or lower neighbour lies on another plate (1 px line), the fused border only on the spur
  const crack = (x, y) => {
    const c = cell(x, y);
    for (const [nx, ny] of [[x + 1, y], [x, y + 1]]) {
      const n = cell(nx, ny);
      if (n.id === c.id) continue;
      if (n.group !== c.group) return true;
      if (spur(x, y)) return true;
    }
    return false;
  };
  // a junction: three plate groups meet in the 2 x 2 at a crack pixel
  const junction = (x, y) => {
    const s = new Set();
    for (let j = 0; j <= 1; j++) for (let i = 0; i <= 1; i++) s.add(cell(x + i, y + j).group);
    return s.size >= 3;
  };
  const heat = (u, v) => {
    const ph = N.gradient(u, v, { ...o, cells: 2, octaves: 2, seed: seed + 9 }) * 1.6;
    return 0.5 + 0.5 * Math.sin(tau * (t - ph));
  };
  const k = P.heat;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [u, v] = uv(x, y);
    if (u < 0 || v < 0 || u >= S || v >= S) continue;
    const c = cell(x, y);
    let col;
    if (crack(x, y)) {
      const H = heat(u, v) * k;
      // glow light where cracks meet, and along a crack's centre stretches as the wave peaks; glow mid otherwise
      if ((junction(x, y) && H > 0.45) || (c.gap < 0.4 && H > 0.92)) col = G[0];
      else col = G[G.length - 1];
    } else {
      // the plate's lit patch: an irregular oval set up and left of the plate's centre, kept clear of its cracks
      const ragged = N.gradient(u, v, { ...o, cells: 4, seed: seed + 5 });
      const pr = Math.hypot((c.du + 2.6) / 1.6, c.dv + 1.3);
      if (c.gap / 2 > 1.1 && pr < 1.1 + 1.2 * ragged) col = A[1];
      else col = A[last];
    }
    g.set(x, y, col);
  }
  return g;
}
