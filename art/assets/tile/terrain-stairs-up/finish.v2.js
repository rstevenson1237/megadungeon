// finish.v2 (f) on base.v4 — the one direct-pixel pass (R2), as the base.v4 review asked:
// 1) clean tread lips: every stone mid/dark pixel sitting inside a stone-light tread band (the mortar-joint dots, and
//    the riser-corner pixel at each tread's left end, under the outline) becomes stone light, so each lip is one
//    continuous stone-light run from the outline;
// 2) a continuous stone-dark contact line along the south-east foot: the base's contact shade was one dot per outline
//    step; it is now one pixel per column, so the line runs unbroken 1 px under the outline
//    along the middle of the foot, never round the bottom corner or past the flight's right edge (no plinth, no ring).
// Width left as base.v4 (widening is a silhouette change: a base revision, not a finish). Tokens only (R11).
export const base = 'base.v4';
export const meta = { notes: 'clean tread lips (no stray mid/dark pixels in the light bands); continuous stone-dark contact line under the south-east foot' };

export function finish(g, ctx) {
  const { px } = ctx.lib, w = g.w, h = g.h;
  const tok = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? null : px.tokenAt(g, [x, y]);
  const LIGHT = 'stone.0';
  const isStone = t => !!t && t.startsWith('stone.');
  const sets = [];

  // 1a) joint dots: a non-light stone pixel with light stone left and right in its row (1-2 px gaps)
  for (let y = 0; y < h; y++) for (let x = 1; x < w - 1; x++) {
    const t = tok(x, y);
    if (!isStone(t) || t === LIGHT) continue;
    if (tok(x - 1, y) === LIGHT && (tok(x + 1, y) === LIGHT || (isStone(tok(x + 1, y)) && tok(x + 2, y) === LIGHT))) sets.push([x, y]);
  }
  // 1b) left ends: a non-light stone pixel between the outline (left and above) and the light band (right)
  for (let y = 1; y < h; y++) for (let x = 1; x < w - 1; x++) {
    const t = tok(x, y);
    if (!isStone(t) || t === LIGHT) continue;
    if (tok(x - 1, y) === 'outline' && tok(x, y - 1) === 'outline' && tok(x + 1, y) === LIGHT) sets.push([x, y]);
  }
  for (const p of sets) px.set(g, p, LIGHT);

  // 2) contact line, one stone-dark pixel per column directly under the south-east foot's outline (the base drew one
  //    per 2 px outline step), over the middle of the foot: two columns are left bare at each end, so it neither
  //    wraps the bottom corner nor runs past the right edge (no ring), and the silhouette stays 85%+ outline.
  const dark = `stone.${ctx.dir.palette.ramps.stone.length - 1}`;
  let bx = 0, by = -1; // the flight's bottom corner: the lowest, leftmost outline pixel
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (tok(x, y) === 'outline' && (y > by || (y === by && x < bx))) { by = y; bx = x; }
  const foot = []; // per column right of the corner: the pixel under the foot's lowest outline pixel
  for (let x = bx; x < w; x++) {
    let ly = -1;
    for (let y = h - 1; y >= h - 16; y--) if (tok(x, y) === 'outline') { ly = y; break; }
    if (ly >= 0 && ly + 1 < h) foot.push([x, ly + 1]);
  }
  foot.forEach(([x, y], i) => {
    if (i >= 2 && i < foot.length - 2) px.set(g, [x, y], dark);
    else if (tok(x, y) === dark) g.clear(x, y);
  });
  return g;
}
