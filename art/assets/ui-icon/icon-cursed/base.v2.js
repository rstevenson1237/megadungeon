// icon-cursed base.v2 (r2) — from base.v1: roster/brief: the broken C twinned icon-held's broken ring; now a red heart split by a jagged dark crack (accent ramp), a two-lobed silhouette no other icon has.
export const meta = { brief: 'icon-cursed', pass: 'r2', notes: "status icon: a broken heart: red heart split by a jagged crack", mirror: false };

const KEY = {
  a: 'accent.0',
  b: 'accent.1',
  c: 'accent.2',
};
const ROWS = [
  '.ooo.ooo.',
  'oabbobbbo',
  'oabbbobbo',
  'obbbobbco',
  '.obbboco.',
  '..oboco..',
  '...oco...',
  '....o....',
  '.........',
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
