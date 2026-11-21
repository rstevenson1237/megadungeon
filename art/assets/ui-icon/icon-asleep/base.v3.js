// icon-asleep base.v3 (x1, from base.v1) — redo: cut to a downward-curving lid arc (top half only, open below), the lash line one curved dark row with 3 ticks, top edge lifted to the highlight step so the lid shape leads. Flat front-on 9 x 9 pixel drawing, no iso box: one bold shape, the direction's outline, ramp colours only (R11).
export const meta = { brief: 'icon-asleep', pass: 'x1', notes: 'status icon: a closed eye: highlighted lid arc over a curved lash line with 3 ticks', mirror: false };

const KEY = {
  b: 'cloth.0',
  a: 'cloth.1',
};
const ROWS = [
  '.........',
  '..ooooo..',
  '.obbbbbo.',
  'obaaaaabo',
  'oaaaaaaao',
  '.ooaaaoo.',
  'o..ooo..o',
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
