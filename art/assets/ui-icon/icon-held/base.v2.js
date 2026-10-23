// icon-held base.v2 (r2, from base.v1) — roster: v1 shackle loop read as a broken ring, twinning icon-cursed. Now two closed steel cuffs linked on a diagonal (handcuffs), no gap in any ring.
export const meta = { brief: 'icon-held', pass: 'r2', notes: 'status icon: two closed steel cuffs linked on a diagonal', mirror: false };

const KEY = {
  b: 'metal.0',
  a: 'metal.1',
  c: 'metal.2',
};
const ROWS = [
  '.ooo.....',
  'obbbo....',
  'obobo....',
  'obbaoooo.',
  '.ooaobbbo',
  '...oobobo',
  '....obbao',
  '....oaaao',
  '.....ooo.',
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
