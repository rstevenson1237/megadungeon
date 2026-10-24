// icon-cursed base.v1 (r1) — a broken circle: red ring with a gap and a loose shard. Flat front-on 9 x 9 pixel drawing, no iso box: one bold shape, the direction's outline, ramp colours only (R11).
export const meta = { brief: 'icon-cursed', pass: 'r1', notes: 'status icon: a broken circle: red ring with a gap and a loose shard', mirror: false };

const KEY = {
  b: 'accent.1',
  a: 'accent.2',
};
const ROWS = [
  '..ooo.oo.',
  '.obbbo.bo',
  'obbbbbo.o',
  'obbooob.o',
  'obbooo..o',
  'obbooobbo',
  'obbbbbbao',
  '.obbaaao.',
  '..ooooo..',
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
