// icon-slowed base.v1 (r1) — a snail shell: brown spiral shell on a pale body, one eye stalk. Flat front-on 9 x 9 pixel drawing, no iso box: one bold shape, the direction's outline, ramp colours only (R11).
export const meta = { brief: 'icon-slowed', pass: 'r1', notes: 'status icon: a snail shell: brown spiral shell on a pale body, one eye stalk', mirror: false };

const KEY = {
  b: 'leather.0',
  a: 'leather.1',
  c: 'leather.2',
  d: 'cloth.0',
  e: 'cloth.1',
};
const ROWS = [
  '.ooooo.o.',
  'obbbbbodo',
  'obaaabodo',
  'obacacodo',
  'obaccaodo',
  'obbbbbddo',
  'oddddddeo',
  '.oooooooo',
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
