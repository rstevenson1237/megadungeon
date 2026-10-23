// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), on the base.v3 review's finish-level notes:
// 1. Spent stays findable: base.v3 cuts the spent groove in the darkest stone step inside the ink ring, so on the dark
//    wall it merges with the mortar lines and on the cap it is a dark blob. The groove's inside is now the cold stone
//    mid step, one step lighter than the ink edge round it.
// 2. Stray cream cluster: the cap's 3 px glow.0 bar at the glyph's bottom goes back to the stroke's glow step; the lit
//    core is two diagonal glow.0 pixels at the crossing's centre, as the floor rune's finish.v1 has it.
// 3. One ink weight with the floor rune on the cap: the 1-2 px ink halo is thinned to a 1 px edge (ink stays only where
//    it touches a stroke side-on), so the flat glyph reads as cut into the stone, not a dark badge on it. The faces keep
//    base.v3's ring: their glyph is drawn in diagonal 1 px strokes, and a thinned ring breaks them into orphan pixels.
// Rule-based ops over each frame (re-apply after re-renders); tokens only (R11). The face glyph's shape is base.v3's.
export const base = 'base.v3';
export const meta = { notes: 'spent groove on stone mid; cap cream bar replaced by a 2 px core; ink halo thinned to 1 px on the cap' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const state = String(ctx.state), spent = state.endsWith('-spent'), face = state.replace('-spent', '');
  const ink = px.color('outline');
  const opaque = (x, y) => g.inb(x, y) && g.alpha(x, y) === 255;
  const isStroke = (x, y) => opaque(x, y) && g.get(x, y) !== ink;

  // 3. on the cap, thin the halo: keep ink only where it touches a stroke side-on (4-neighbour)
  if (face === 'cap') {
    const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const clear = [];
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++)
      if (opaque(x, y) && g.get(x, y) === ink && !N4.some(([dx, dy]) => isStroke(x + dx, y + dy))) clear.push([x, y]);
    for (const [x, y] of clear) g.clear(x, y);
  }

  if (spent) {
    // 1. the groove's inside one step lighter than its ink edge
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++)
      if (isStroke(x, y)) px.set(g, [x, y], 'stone.1');
  } else if (face === 'cap') {
    // 2. no cream cluster on the cap; a 2 px core at the crossing (cap top diamond centre as base.v3 places it)
    const hot = px.color('glow.0');
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++)
      if (opaque(x, y) && g.get(x, y) === hot) px.set(g, [x, y], 'glow.1');
    const T = g.h - 16 - Math.max(2, Math.round((g.h - 16) / 6)), cx = g.w / 2, cy = T + 8;
    px.set(g, [cx - 1, cy + 1], 'glow.0');
    px.set(g, [cx, cy + 2], 'glow.0');
  }
  return g;
}
