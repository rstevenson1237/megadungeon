// finish.v1 (f) on base.v2 — the one direct-pixel pass (R2), as the v2 and v3 reviews asked: the base's three
// identical per-cell marks read as a dotted lattice when tiled, so the surface is repainted at final resolution.
// The body is reset to the grass ramp's darkest step, then four short ripple arcs of mixed length (5, 4, 3, 2 px,
// curved, along both iso slopes, placed off any even grid and wrapped across the seams at the tile's lattice images)
// are drawn in grass.1 (no outline troughs: tiled they read as dark specks), and each arc rocks 1 px on its own
// phase so the field never moves in lock-step. One grass.0 glint on one frame only. Grass ramp only (R11).
export const base = 'base.v2';
export const meta = { notes: 'deep water finish: repaint body, 4 mixed-length ripple arcs with own phases, one glint on one frame' };

// Arcs: anchor [x, y] (y from the diamond's top row), crest pixels, trough pixels, per-frame x offset.
const ARCS = [
  { at: [9, 5], crest: [[0, 1], [1, 0], [2, 0], [3, 0], [4, 1]], trough: [], dx: [0, 1, 1, 0] },
  { at: [16, 10], crest: [[0, 1], [1, 1], [2, 0], [3, 0]], trough: [], dx: [0, 0, 1, 1] },
  { at: [22, 7], crest: [[0, 0], [1, 0], [2, 1]], trough: [], dx: [-1, -1, 0, 0] },
  { at: [4, 8], crest: [[0, 0], [1, 0]], trough: [], dx: [1, 0, 0, 1] },
];

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const f = ((ctx.frame ?? 0) % 4 + 4) % 4, top = g.h - 16;
  // reset the surface: every opaque pixel back to the body tone
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (px.tokenAt(g, [x, y])) px.set(g, [x, y], 'grass.2');
  // paint a pixel at all of its lattice images ((+-w/2, 8) steps) that land inside the diamond, so the tile wraps
  const put = (x, y, token) => {
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      const X = x + (i - j) * g.w / 2, Y = top + y + (i + j) * 8;
      if (X >= 0 && X < g.w && Y >= 0 && Y < g.h && px.tokenAt(g, [X, Y])) px.set(g, [X, Y], token);
    }
  };
  for (const a of ARCS) {
    const ox = a.at[0] + a.dx[f], oy = a.at[1];
    for (const [x, y] of a.trough) put(ox + x, oy + y, 'outline');
    for (const [x, y] of a.crest) put(ox + x, oy + y, 'grass.1');
  }
  // one glint, on the long arc's crest, on one frame
  if (f === 2) put(ARCS[0].at[0] + ARCS[0].dx[f] + 2, ARCS[0].at[1], 'grass.0');
  return g;
}
