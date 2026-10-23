// icon-slowed base.v2 (r2, from base.v1) — roster: v1 read as a square box with a spiral (brown matched walls). Square frame dropped: a round terracotta spiral shell on a small grey foot, head and eye stalk on the left.
export const meta = { brief: 'icon-slowed', pass: 'r2', notes: 'status icon: a round terracotta spiral snail shell on a small foot', mirror: false };

const KEY = {
  b: 'skin.1',
  a: 'skin.2',
  f: 'stone.0',
  e: 'stone.1',
};
const ROWS = [
  '....ooo..',
  '.o.obbbo.',
  'ofobaaabo',
  'ofobababo',
  'ofobbbabo',
  'offobbbo.',
  'offfoooo.',
  'oeeeeeeeo',
  '.ooooooo.',
];

export function render(ctx) {
  const { Grid } = ctx.lib, [w, h] = ctx.size, g = new Grid(w, h), pal = ctx.dir.pal;
  const colour = t => { const [r, i] = t.split('.'); return pal[r][+i]; };
  for (let y = 0; y < ROWS.length; y++)
    for (let x = 0; x < ROWS[y].length; x++) {
      const c = ROWS[y][x];
      if (c === '.') continue;
      g.set(x, y, c === 'o' ? ctx.dir.outline : colour(KEY[c]));
    }
  return g;
}
