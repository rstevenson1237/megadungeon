// terrain-lava base.v1 (r1) — adapted from the iso floor tile template: a 32 x 16 diamond of molten rock under a
// cracked cooling crust. The surface is computed in the tile's own (u, v) square with periodic noise, so diamonds tile
// seamlessly in the iso lattice. Crust plates (accent's darkest, shadow side in the outline colour) are split by
// glowing cracks (glow ramp, accent mid on the heated lips); a slow heat wave runs through the cracks over the 4-frame
// idle loop (ctx.t), widening them and lighting their cores. Ramps: accent and glow only, plus the outline.
export const meta = { brief: 'terrain-lava', pass: 'r1', notes: 'cracked cooling crust over molten rock, 4-frame glow loop' };

export const params = {
  plates: { type: 'range', min: 2, max: 3, step: 1, default: 2 },
  heat: { type: 'range', min: 0.6, max: 1.4, step: 0.2, default: 1 },
};

export function render(ctx) {
  const { pal, outline } = ctx.dir, P = ctx.params, [w, h] = ctx.size, N = ctx.lib.tex.noise;
  const S = 16, seed = ctx.seed + 7 * ctx.variant, tau = Math.PI * 2, t = ctx.t || 0;
  const A = pal.accent, G = pal.glow, last = A.length - 1;
  // canvas of the frame size, cleared (the material call only supplies a grid of the right size)
  const g = ctx.lib.tex.material('lava', { size: [w, h], seed });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) g.clear(x, y);
  const o = { w: S, h: S };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    // diamond (u, v) in [0, S): the same mapping as the iso floor tile, kept continuous
    const sx = (x + 0.5 - w / 2) / w, sy = (y + 0.5) / h, u = (sx + sy) * S, v = (sy - sx) * S;
    if (u < 0 || v < 0 || u >= S || v >= S) continue;
    const wu = u + 0.8 * (N.gradient(u, v, { ...o, cells: 2, seed: seed + 3 }) - 0.5);
    const wv = v + 0.8 * (N.gradient(u, v, { ...o, cells: 2, seed: seed + 4 }) - 0.5);
    const cell = N.worley(wu, wv, { ...o, cells: P.plates, seed, jitter: 0.85 }), edge = cell.f2 - cell.f1;
    // a slow heat wave: phase from low-frequency noise, one full cycle over the loop
    const phase = N.gradient(u, v, { ...o, cells: 2, octaves: 2, seed: seed + 9 }) * 1.6;
    const H = 0.5 + 0.5 * Math.sin(tau * (t - phase));
    const k = P.heat, crack = (0.05 + 0.04 * H) * k, core = (0.008 + 0.03 * H * H) * k, lip = crack + 0.04 + 0.03 * H;
    let c;
    if (edge < core) c = G[0];
    else if (edge < crack) c = G[G.length - 1];
    else if (edge < lip) c = A[1];
    else {
      // crust plate: dark red; its lower-right (shadow) side, away from the light and the crack glow, darker
      let du = u - cell.cx, dv = v - cell.cy;
      du -= S * Math.round(du / S); dv -= S * Math.round(dv / S);
      const away = (du * 0.75 + dv * 0.25) / (S / P.plates), grain = N.value(u, v, { ...o, cells: 8, seed: seed + 5 });
      c = away + 0.25 * (grain - 0.5) > 0.32 && edge > lip + 0.05 ? outline : A[last];
    }
    g.set(x, y, c);
  }
  return g;
}
