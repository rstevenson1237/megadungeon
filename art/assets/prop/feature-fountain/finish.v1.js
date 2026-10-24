// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), on what the r3 review named at pixel level:
// - the flowing falls were 1 px light + 1 px dark strands boxed in by outline (they read as cage bars): each fall is
//   merged into a 3 px sheet (two cloth.0 columns, one cloth.1 on its shaded inner side) from under the bowl's lip to
//   the pool, and a small cloth.0 splash cluster sits where each lands;
// - stray pixels: the lone stone.1 pixel on the upper bowl's lit rim (both states) takes the rim's light step.
// Swaps check the token already there (tokenAt), so a re-render that moves a part leaves it alone. Form unchanged.
export const base = 'base.v3';
export const meta = { notes: 'falls merged into 3 px sheets with splash highlights; bowl-rim stray pixel cleaned' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const tok = (x, y) => px.tokenAt(g, [x, y]);
  const swap = (x, y, from, to) => { if (from.includes(tok(x, y))) px.set(g, [x, y], to); };
  const pool = ['outline', 'stone.0', 'stone.1', 'stone.2', 'cloth.0', 'cloth.1'];

  swap(10, 11, ['stone.1'], 'stone.0');                   // upper bowl's lit rim: lone stray pixel
  if (ctx.state === 'dry') return g;

  for (let y = 14; y <= 20; y++) {
    // left fall (lit side): x 9-10 light, x 11 its shaded inner edge
    swap(9, y, ['cloth.1'], 'cloth.0');
    swap(10, y, ['cloth.1'], 'cloth.0');
    if (y >= 15) swap(11, y, pool, 'cloth.1');
    // right fall: x 21-22 light, x 23 its shaded outer edge
    if (y >= 15) swap(21, y, pool, 'cloth.0');
    swap(22, y, ['cloth.1'], 'cloth.0');
  }
  swap(9, 13, ['cloth.1'], 'cloth.0');
  // splash clusters where the falls meet the pool
  for (const [x, y] of [[9, 21], [10, 21], [10, 22], [22, 21], [21, 22], [20, 22]]) swap(x, y, pool, 'cloth.0');
  return g;
}
