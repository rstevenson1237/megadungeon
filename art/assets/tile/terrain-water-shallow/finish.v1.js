// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), per the r3 review:
//  - stones: each stone (a connected run of dirt pixels) repainted in dirt mid/light, upper-left body dirt.0, lower
//    right edge dirt.2, and one lit top-left pixel (a wet sheen in grass.0, the only step above dirt.0 in the ramps
//    this asset may use); identical in every frame.
//  - water: the fill lifted one grass step above deep's (grass.1 instead of grass.2), so shallow reads paler and
//    see-through; the base's blobby crest patches are dropped.
//  - ripple: a few thin 2-3 px grass.2 trough streaks (one with a 2 px grass.0 crest) along the iso slope, drifting
//    1 px a frame and ping-ponging over the loop, laid on the tile lattice so they continue across seams; never over
//    a stone, and no isolated single pixels.
// Colours are direction tokens (ramp.index), never hex (R11).
export const base = 'base.v3';
export const meta = { notes: 'stones dirt mid/light with lit top-left + dark lower-right; water grass.1 (one step above deep); ripples as thin 2-3 px streaks' };

// streaks: [x, y, len, crest] in diamond-local coords (y from the diamond's top row); crest = grass.0 run above
const STREAKS = [
  [6, 5, 3, false],
  [20, 4, 3, true],
  [8, 10, 3, false],
  [21, 11, 2, false],
];

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const w = g.w, h = g.h, top = h - 16;
  const tok = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? null : px.tokenAt(g, [x, y]);
  const isStone = new Uint8Array(w * h), isWater = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = tok(x, y);
    if (!t) continue;
    if (t.startsWith('dirt')) isStone[y * w + x] = 1; else isWater[y * w + x] = 1;
  }
  // drop single stray dirt pixels (they read as specks, not stones)
  const stone = (x, y) => x >= 0 && y >= 0 && x < w && y < h && isStone[y * w + x] === 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (stone(x, y) && !stone(x - 1, y) && !stone(x + 1, y) && !stone(x, y - 1) && !stone(x, y + 1)) {
      isStone[y * w + x] = 0; isWater[y * w + x] = 1;
    }
  }
  // water fill: grass.1
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (isWater[y * w + x]) px.set(g, [x, y], 'grass.1');
  // stones: label 4-connected components, shade each from the upper left
  const seen = new Uint8Array(w * h);
  for (let y0 = 0; y0 < h; y0++) for (let x0 = 0; x0 < w; x0++) {
    if (!stone(x0, y0) || seen[y0 * w + x0]) continue;
    const comp = [], q = [[x0, y0]];
    seen[y0 * w + x0] = 1;
    while (q.length) {
      const [x, y] = q.pop();
      comp.push([x, y]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (stone(nx, ny) && !seen[ny * w + nx]) { seen[ny * w + nx] = 1; q.push([nx, ny]); }
      }
    }
    let cx = 0, cy = 0;
    for (const [x, y] of comp) { cx += x; cy += y; }
    cx /= comp.length; cy /= comp.length;
    let lit = null;
    for (const [x, y] of comp) {
      const d = (x - cx) * 0.5 + (y - cy); // > 0 toward the lower right
      // dark only on the true lower-right rim: the bottom row's right half, the right side's lower half
      const edgeLR = (!stone(x, y + 1) && x >= cx) || (!stone(x + 1, y) && y >= cy + 0.5);
      let t = d < 0.2 ? 'dirt.0' : 'dirt.1';
      if (edgeLR) t = 'dirt.2';
      px.set(g, [x, y], t);
      if (!lit || x + 2 * y < lit[0] + 2 * lit[1]) lit = [x, y];
    }
    if (comp.length >= 6) px.set(g, lit, 'grass.0');
  }
  // ripple streaks, drifting 1 px a frame (0, 1, 2, 1) and laid on the tile lattice so they cross seams
  const f = (ctx.frame ?? 0) % 4;
  const dx = [0, 1, 2, 1][f];
  const water = (x, y) => x >= 0 && y >= 0 && x < w && y < h && isWater[y * w + x] === 1;
  for (const [sx, sy, len, crest] of STREAKS) {
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      const ox = (i - j) * w / 2, oy = (i + j) * 8;
      const x = sx + dx + ox, y = top + sy + oy;
      if (y < top || y >= h) continue;
      // draw only the in-water part, and only if at least 2 px of it land (no isolated pixels)
      const run = [];
      for (let k = 0; k < len; k++) if (water(x + k, y)) run.push(x + k);
      if (run.length < 2) continue;
      for (const rx of run) px.set(g, [rx, y], 'grass.2');
      if (crest) {
        const cr = run.slice(0, 2).map(rx => rx + 1).filter(rx => water(rx, y - 1));
        if (cr.length === 2) for (const rx of cr) px.set(g, [rx, y - 1], 'grass.0');
      }
    }
  }
  return g;
}
