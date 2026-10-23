// icon-hasted base.v1 (r1) — a winged boot: pale wing, brown boot. Flat front-on 9 x 9 pixel drawing, no iso box: one bold shape, the direction's outline, ramp colours only (R11).
export const meta = { brief: 'icon-hasted', pass: 'r1', notes: 'status icon: a winged boot: pale wing, brown boot', mirror: false };

const KEY = {
  w: 'glow.0',
  x: 'accent.0',
  a: 'leather.1',
  b: 'leather.0',
  c: 'leather.2',
};
const ROWS = [
  'o.o.ooooo',
  'owowobbbo',
  'owwwobabo',
  '.owwooabo',
  '..ooobbbo',
  '...obbbbo',
  '...oaaaao',
  '...occcco',
  '....oooo.',
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
