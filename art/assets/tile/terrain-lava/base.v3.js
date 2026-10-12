// terrain-lava base.v3 (r3) — from base.v2. One change, as the r2 review asked: break the tile-edge lattice. The cracks
// are no longer Worley plate borders (which, at 2 cells a tile, ran along the diamond edges and tiled into a red
// fishnet); they are 2-3 irregular veins drawn as the 1 px contour of a warped periodic noise field, which wander
// across the diamond edges at varied points, with short one-sided forks (the contour of a second field, kept only
// beside a main vein) and plates of unequal size between them. The crust drops darker: accent's darkest, with a second,
// darker crust tone (the direction's outline) mottling the plates away from the veins, so only the veins glow. The
// surface stays periodic in the tile's (u, v) square, so diamonds tile seamlessly; the 4-frame loop (ctx.t) still
// moves only the veins' heat. Ramps: accent and glow only, plus the outline.
export const meta = { brief: 'terrain-lava', pass: 'r3', notes: 'irregular forked veins crossing the diamond edges, darker two-tone crust' };

export const params = {
  heat: { type: 'range', min: 0.6, max: 1.4, step: 0.2, default: 1 },
  forks: { type: 'range', min: 0.2, max: 0.4, step: 0.05, default: 0.3 },
};

export function render(ctx) {
  const { pal, outline } = ctx.dir, P = ctx.params, [w, h] = ctx.size, N = ctx.lib.tex.noise;
  const S = 16, seed = ctx.seed + 7 * ctx.variant, tau = Math.PI * 2, t = ctx.t || 0;
  const A = pal.accent, G = pal.glow, last = A.length - 1;
  const g = ctx.lib.tex.material('lava', { size: [w, h], seed });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) g.clear(x, y);
  const o = { w: S, h: S };
  const uv = (x, y) => {
    const sx = (x + 0.5 - w / 2) / w, sy = (y + 0.5) / h;
    return [(sx + sy) * S, (sy - sx) * S];
  };
  const warp = (u, v) => [
    u + 2.4 * (N.gradient(u, v, { ...o, cells: 2, seed: seed + 3 }) - 0.5),
    v + 2.4 * (N.gradient(u, v, { ...o, cells: 2, seed: seed + 4 }) - 0.5),
  ];
  // vein phase: one wandering vein every 16 px across the field, running at a steep slant the diamond edges never take
  // ((1, -1) in u, v), pushed about by warped noise so it crosses the tile's edges at varied points
  const phase = (x, y) => {
    const [a, b] = warp(...uv(x, y));
    const wob = N.gradient(a, b, { ...o, cells: 2, octaves: 2, seed: seed + 11 }) - 0.5;
    return tau * (a - b) / S + 9 * wob;
  };
  const fork = (x, y) => { const [a, b] = warp(...uv(x, y)); return N.value(a, b, { ...o, cells: 3, octaves: 1, seed: seed + 17 }) >= 0.5; };
  // a vein is the rising zero of sin(phase): one 1 px unbroken line a period
  const veinAt = (x, y) => {
    const p = phase(x, y), s = Math.sin(p) >= 0;
    if (Math.cos(p) <= 0) return false;
    return (Math.sin(phase(x + 1, y)) >= 0) !== s || (Math.sin(phase(x, y + 1)) >= 0) !== s;
  };
  // how far past the vein (0..1 of a period) a pixel lies, on its right-hand side
  const past = (x, y) => { const p = phase(x, y) / tau; return p - Math.floor(p); };
  const F = P.forks;
  const isVein = (x, y) => {
    if (veinAt(x, y)) return 2;
    const f = fork(x, y);
    if (past(x, y) < F && (fork(x + 1, y) !== f || fork(x, y + 1) !== f)) return 1; // a fork springing off the vein
    return 0;
  };
  const heat = (x, y) => {
    const [u, v] = uv(x, y);
    const phase = N.gradient(u, v, { ...o, cells: 2, octaves: 2, seed: seed + 9 }) * 1.6;
    return 0.5 + 0.5 * Math.sin(tau * (t - phase));
  };
  const k = P.heat;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [u, v] = uv(x, y);
    if (u < 0 || v < 0 || u >= S || v >= S) continue;
    const H = heat(x, y) * k;
    const vein = isVein(x, y);
    let c;
    if (vein) {
      // the vein's hottest points (where a fork meets it) show the cream core at the wave's peak
      const junction = vein === 2 && (isVein(x - 1, y) === 1 || isVein(x + 1, y) === 1 || isVein(x, y - 1) === 1 || isVein(x, y + 1) === 1);
      if (junction && H > 0.6) c = G[0];
      else if (H > (vein === 2 ? 0.25 : 0.45)) c = G[G.length - 1];
      else c = A[1];
    } else {
      const near = isVein(x - 1, y) || isVein(x + 1, y) || isVein(x, y - 1) || isVein(x, y + 1);
      const q = past(x, y), dist = Math.min(q, 1 - q);
      const grain = N.value(u, v, { ...o, cells: 8, seed: seed + 5 });
      const fine = N.value(u, v, { ...o, cells: 16, seed: seed + 6 });
      if (near && H > 0.8 && grain > 0.55) c = A[1];             // heated lip, sparse, only at the wave's peak
      else if (!near && dist > 0.22 && fine > 0.6) c = outline;   // cold, darker crust grain away from the veins
      else c = A[last];
    }
    g.set(x, y, c);
  }
  return g;
}
