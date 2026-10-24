// icon-asleep base.v2 (r2, from base.v1) — roster: v1 closed eye read as a slot, coin or blob with drips. Now a downward-curved pale-blue lid arc (a closed eye) with three lashes hanging below.
export const meta = { brief: 'icon-asleep', pass: 'r2', notes: 'status icon: a closed eye: curved lid with lashes', mirror: false };

const KEY = {
  b: 'cloth.0',
  a: 'cloth.1',
};
const ROWS = [
  '.........',
  '.........',
  'oo.....oo',
  'obo...obo',
  'oabooobao',
  '.oaaaaao.',
  '.obobobo.',
  '.obobobo.',
  '..o.o.o..',
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
