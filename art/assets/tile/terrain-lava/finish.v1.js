// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), as the base.v3 review asked. Tiled, the base's single
// vein closed into the same oval ring in every cell (a grid of eyes), 1-2 px thick, and a fixed outline speck sat by
// (26-27, 7) in all four frames. So: 1) every vein, heated-lip and outline pixel goes back to crust (accent's darkest), so the
// fixed speck goes; 2) four open 1 px crack segments of unequal length are redrawn at final resolution, at different
// slants, with gaps between them so no run closes into a ring once tiled, plus four short forks, and the outline
// returns only as cold scabs in the plate cores away from every crack (same in all frames; crust ~80%); 3) where a fork meets a crack a glow.0 hot pixel shows. Each crack pixel takes its
// heat from its own phase along the crack (the 4-frame loop, ctx.frame), so the cracks pulse glow.1 / accent.1 and
// never in lock-step. Every pixel is written at its lattice image inside the diamond, so the tile wraps seamlessly.
// Ramps: accent and glow, plus the outline (R11).
export const base = 'base.v3';
export const meta = { notes: 'lava finish: crust reset, 4 open 1 px crack segments + 4 forks, cold scabs off the cracks, glow.0 junctions, own-phase heat loop' };

// Crack polylines in the tile's pixel plane. The tile's lattice is (32, 0) and (16, 8), so the 32 x 8 strip at the
// diamond's top is one whole period: the cracks are laid out there and every pixel lands on its image in the diamond.
// Three open runs at three slants (rising, falling, a short hook) and a short split, 3-4 px gaps between their ends and their images,
// so none closes into a ring. `ph` is each crack's heat phase offset (0..1).
const CRACKS = [
  { pts: [[0, 6], [3, 5], [5, 3], [7, 2], [9, 3], [12, 2], [13, 1]], ph: 0 },       // rising crack with a kink
  { pts: [[15, 0], [16, 2], [18, 4], [19, 6], [22, 7], [23, 7]], ph: 0.35 },          // falling crack
  { pts: [[24, 5], [26, 4], [27, 2], [29, 1], [31, 1]], ph: 0.65 },                   // short hook
  { pts: [[11, 7], [13, 6], [15, 7]], ph: 0.85 },                                     // a short split
];
// Forks: a short branch from a point on a crack (the junction, pts[0]) outward; `of` names the crack it springs from.
const FORKS = [
  { of: 0, pts: [[5, 3], [7, 5], [9, 6]] },
  { of: 1, pts: [[18, 4], [20, 3], [21, 2]] },
  { of: 2, pts: [[27, 2], [29, 4], [30, 5]] },
  { of: 0, pts: [[9, 3], [10, 5]] },
];

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const f = ((ctx.frame ?? 0) % 4 + 4) % 4, t = f / 4, top = g.h - 16, tau = Math.PI * 2;
  const crust = 'accent.2';
  // lattice images of a pixel that fall inside the diamond
  const images = (x, y) => {
    const out = [];
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      const X = x + (i - j) * g.w / 2, Y = top + y + (i + j) * 8;
      if (X >= 0 && X < g.w && Y >= 0 && Y < g.h && px.tokenAt(g, [X, Y])) out.push([X, Y]);
    }
    return out;
  };
  const tokenW = (x, y) => { const im = images(x, y - top); return im.length ? px.tokenAt(g, im[0]) : null; };
  // 1) reset: every vein, heated-lip and outline pixel goes back to crust (the base's outline grain sat in the same
  // spots in all four frames, one speck by (26-27, 7) reading as a fixed dot; it is redrawn below, from the new cracks)
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const tk = px.tokenAt(g, [x, y]);
    if (tk && tk !== crust) px.set(g, [x, y], crust);
  }
  // 2) cracks: 1 px Bresenham runs through the points, each pixel at all its lattice images
  const put = (x, y, token) => { for (const p of images(x, y)) px.set(g, p, token); };
  const run = (pts) => {
    const out = [];
    for (let k = 0; k + 1 < pts.length; k++) {
      let [x0, y0] = pts[k];
      const [x1, y1] = pts[k + 1], dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let e = dx + dy;
      for (;;) {
        if (!out.length || out[out.length - 1][0] !== x0 || out[out.length - 1][1] !== y0) out.push([x0, y0]);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * e;
        if (e2 >= dy) { e += dy; x0 += sx; }
        if (e2 <= dx) { e += dx; y0 += sy; }
      }
    }
    return out;
  };
  const heatTok = (H) => (H > 0.55 ? 'glow.1' : 'accent.1');
  CRACKS.forEach((c) => {
    const p = run(c.pts);
    p.forEach(([x, y], i) => put(x, y, heatTok(0.5 + 0.5 * Math.sin(tau * (t - c.ph - i / 28)))));
  });
  FORKS.forEach((fk) => {
    const p = run(fk.pts), ph = CRACKS[fk.of].ph;
    p.slice(1).forEach(([x, y], i) => put(x, y, heatTok(0.5 + 0.5 * Math.sin(tau * (t - ph - 0.25 - i / 16)) - 0.1)));
  });
  // cold crust: plate cores well away from every crack (iso distance, x counts half) darken to the outline, broken by
  // a fixed hash so they read as cooled scabs, not rings; a pure function of the pixel, so the same in every frame
  const hot = (tk) => tk && tk !== crust && tk !== 'outline';
  const far = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -3; dx <= 3; dx++) {
      if ((dx / 2) * (dx / 2) + dy * dy > 2.5) continue;
      if (hot(tokenW(x + dx, y + dy))) return false;
    }
    return true;
  };
  const hash = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 7;
  const cold = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (px.tokenAt(g, [x, y]) === crust && far(x, y) && hash(x, y) > 1) cold.push([x, y]);
  for (const p of cold) px.set(g, p, 'outline');
  // 3) junctions: the fork's root on the crack runs hottest
  FORKS.forEach((fk) => {
    const [x, y] = fk.pts[0], H = 0.5 + 0.5 * Math.sin(tau * (t - CRACKS[fk.of].ph));
    put(x, y, H > 0.25 ? 'glow.0' : 'glow.1');
  });
  return g;
}
