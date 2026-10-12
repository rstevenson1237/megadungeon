// terrain-lava base.v2 (r2) — from base.v1. One change, as the r1 review asked: the crust now reads as a few large
// dark cooling plates split by continuous 1 px glowing cracks, with sparse glow. A pixel is crack where its crust plate
// differs from the plate to its right or below (so every crack is exactly 1 px and unbroken); plates are accent's
// darkest, their heated lips beside a crack accent mid only while the heat wave passes; the cream glow core shows only
// at crack junctions at the wave's peak. The outline-colour shadow blobs are gone. The surface stays periodic in the
// tile's (u, v) square, so diamonds tile seamlessly; the 4-frame loop (ctx.t) still moves only the cracks' heat.
// Ramps: accent and glow only.
export const meta = { brief: 'terrain-lava', pass: 'r2', notes: 'few large dark crust plates, continuous 1 px glowing cracks, sparse glow' };

export const params = {
  plates: { type: 'range', min: 2, max: 3, step: 1, default: 2 },
  heat: { type: 'range', min: 0.6, max: 1.4, step: 0.2, default: 1 },
};

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, [w, h] = ctx.size, N = ctx.lib.tex.noise;
  const S = 16, seed = ctx.seed + 7 * ctx.variant, tau = Math.PI * 2, t = ctx.t || 0;
  const A = pal.accent, G = pal.glow, last = A.length - 1;
  const g = ctx.lib.tex.material('lava', { size: [w, h], seed });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) g.clear(x, y);
  const o = { w: S, h: S };
  // the tile's (u, v) for a pixel centre (any x, y: the mapping is linear, the noise periodic, so neighbours wrap)
  const uv = (x, y) => {
    const sx = (x + 0.5 - w / 2) / w, sy = (y + 0.5) / h;
    return [(sx + sy) * S, (sy - sx) * S];
  };
  const plate = (x, y) => {
    const [u, v] = uv(x, y);
    const wu = u + 1.2 * (N.gradient(u, v, { ...o, cells: 2, seed: seed + 3 }) - 0.5);
    const wv = v + 1.2 * (N.gradient(u, v, { ...o, cells: 2, seed: seed + 4 }) - 0.5);
    return N.worley(wu, wv, { ...o, cells: P.plates, seed, jitter: 0.8 }).id;
  };
  const heat = (x, y) => {
    const [u, v] = uv(x, y);
    const phase = N.gradient(u, v, { ...o, cells: 2, octaves: 2, seed: seed + 9 }) * 1.6;
    return 0.5 + 0.5 * Math.sin(tau * (t - phase));
  };
  const isCrack = (x, y) => {
    const p = plate(x, y);
    return plate(x + 1, y) !== p || plate(x, y + 1) !== p;
  };
  const k = P.heat;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [u, v] = uv(x, y);
    if (u < 0 || v < 0 || u >= S || v >= S) continue;
    const H = heat(x, y) * k;
    let c;
    if (isCrack(x, y)) {
      // junction: three plates meet within the 2 x 2 block
      const ids = new Set([plate(x, y), plate(x + 1, y), plate(x, y + 1), plate(x + 1, y + 1)]);
      if (ids.size >= 3 && H > 0.55) c = G[0];
      else if (H > 0.25) c = G[G.length - 1];
      else c = A[1];
    } else {
      // heated lip: the crust pixel just above / left of a crack warms to accent mid near the wave's peak, sparsely
      const nearCrack = isCrack(x - 1, y) || isCrack(x, y - 1);
      const grain = N.value(u, v, { ...o, cells: 8, seed: seed + 5 });
      c = nearCrack && H > 0.8 && grain > 0.55 ? A[1] : A[last];
    }
    g.set(x, y, c);
  }
  return g;
}
