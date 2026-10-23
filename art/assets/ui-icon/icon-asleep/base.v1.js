// icon-asleep base.v1 (r1) — a closed eye: pale blue lid, lashes. Flat front-on 9 x 9 pixel drawing, no iso box: one bold shape, the direction's outline, ramp colours only (R11).
export const meta = { brief: 'icon-asleep', pass: 'r1', notes: 'status icon: a closed eye: pale blue lid, lashes', mirror: false };

const KEY = {
  b: 'cloth.0',
  a: 'cloth.1',
};
const ROWS = [
  '.........',
  '..ooooo..',
  '.obbbbao.',
  'obbbbbaao',
  'ooooooooo',
  'obbaaaaao',
  '.obbaaao.',
  '..ooooo..',
  'o..o.o..o',
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
