// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), on the base.v3 review's finish-level notes:
// 1. Carved, not raised: the base rings every stroke in a 1-2 px ink halo and fills the diamond's hollow with ink, so
//    the glyph reads as a dark badge sitting on the floor. The halo is thinned to a 1 px groove edge: ink stays only
//    where it touches a stroke side-on (the line gate needs the dark edge), every diagonal-only or loose ink pixel is
//    cleared, so the floor shows through between the legs and the edge reads as a cut, not a rim.
// 2. Stray core: the cream 3 px bar at the crossing (dormant) goes back to the stroke's glow step; the lit core is now
//    two diagonal glow.0 pixels at the crossing's centre.
// 3. Spent: with the halo gone the cold groove no longer sinks into a dark blob; its strokes keep the stone mid step.
// Rule-based ops over the frame (re-apply after re-renders); tokens only (R11).
export const base = 'base.v3';
export const meta = { notes: 'ink halo thinned to a 1 px groove edge; cream bar replaced by a 2 px core at the crossing' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const ink = px.color('outline');
  const isInk = (x, y) => g.inb(x, y) && g.alpha(x, y) === 255 && g.get(x, y) === ink;
  const isStroke = (x, y) => g.inb(x, y) && g.alpha(x, y) === 255 && g.get(x, y) !== ink;

  // 1. thin the halo to a 1 px groove edge: keep ink only where it touches a stroke side-on (4-neighbour)
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const clear = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++)
    if (isInk(x, y) && !N4.some(([dx, dy]) => isStroke(x + dx, y + dy))) clear.push([x, y]);
  for (const [x, y] of clear) g.clear(x, y);

  // 2. dormant: no cream cluster; a 2 px lit core at the crossing
  if (ctx.state !== 'spent') {
    const hot = px.color('glow.0');
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++)
      if (g.alpha(x, y) === 255 && g.get(x, y) === hot) px.set(g, [x, y], 'glow.1');
    const cx = g.w / 2, cy = g.h - 8;
    // the crossing of the legs sits 2.5 px below the floor centre in base.v3's glyph map
    px.set(g, [cx - 1, cy + 1], 'glow.0');
    px.set(g, [cx, cy + 2], 'glow.0');
  }
  return g;
}
