// icon-poisoned base.v1 (r1) — a dripping fang: bone-coloured fang, one green drop. Flat front-on 9 x 9 pixel drawing, no iso box: one bold shape, the direction's outline, ramp colours only (R11).
export const meta = { brief: 'icon-poisoned', pass: 'r1', notes: 'status icon: a dripping fang: bone-coloured fang, one green drop', mirror: false };

const KEY = {
  b: 'wood.0',
  a: 'wood.1',
  g: 'grass.1',
};
const ROWS = [
  '.ooooooo.',
  'obbbbbbao',
  '.obbgbao.',
  '.obbgbao.',
  '..obgao..',
  '..obgao..',
  '...obo...',
  '...ogo...',
  '....o....',
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
