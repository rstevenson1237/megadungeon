// finish.v2 (f2) on base.v4 — the one direct-pixel pass (R2), as base.v4's review asked: its three stones were spread
// across the cell with no contact under the blue one (it floated) and the small gold stone was a muddy olive pebble.
// This pass repaints the cluster with the same three cuts, pulled close around the cell centre: the blue stone behind
// in the middle with its point nestled between the two front stones (sharing one ink pixel with the red), the red in
// front at the left and the gold 1 px to its right. Each has a 1 px dark contact shadow (stone.2) under its point,
// falling to the lower right, away from the top-left light. The gold is warmed onto the direction's gold role (accent):
// a glow.0 facet highlight on the table, an accent.0 face and a wood.1 lower side, so it reads gold, not pearl.
// Tokens only (R11).
export const base = 'base.v4';
export const meta = { notes: 'tight cluster around the cell centre, 1px contact shadow under each stone, warm gold stone with bright facet' };

// blue, behind; red, front left; gold, front right (patched in that order so the front stones' ink wins)
const BLUE = [
  '.....XXXX.',
  '....XGcchX',
  '....XccbkX',
  '.....XbkX.',
  '......XX..',
  '.......s..',
];
const RED = [
  '.XXXXX.',
  'XGarrrX',
  'XrrrrdX',
  '.XrrdX.',
  '..XdX..',
  '...X...',
  '...ss..',
];
const GOLD = [
  '.XXX.',
  'XGyyX',
  'XyooX',
  '.XoX.',
  '..X..',
  '..ss.',
];

export function finish(g, ctx) {
  const { px } = ctx.lib;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (g.alpha(x, y) > 0) g.clear(x, y);
  // the cluster's 13 x 10 box: its middle column on the cell centre (16, h - 8), its shadow row one row below it
  const ox = (g.w >> 1) - 6, oy = g.h - 8 + 1 - 9;
  const opt = { anchor: 'topleft' };
  px.patch(g, [ox, oy], BLUE, { X: 'outline', G: 'metal.0', c: 'cloth.0', h: 'cloth.1', b: 'cloth.1', k: 'cloth.2', s: 'stone.2' }, opt);
  px.patch(g, [ox, oy + 3], RED, { X: 'outline', G: 'glow.0', a: 'accent.0', r: 'accent.1', d: 'accent.2', s: 'stone.2' }, opt);
  px.patch(g, [ox + 8, oy + 4], GOLD, { X: 'outline', G: 'glow.0', y: 'accent.0', o: 'wood.1', s: 'stone.2' }, opt);
  return g;
}
