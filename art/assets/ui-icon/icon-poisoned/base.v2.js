// icon-poisoned base.v2 (r2, from base.v1) — roster: v1 was an olive inverted triangle twinning icon-shield, drip invisible. Now a curved bone fang hooking down-left (no triangle) with a separate teal-green drop on the right; olive dropped.
export const meta = { brief: 'icon-poisoned', pass: 'r2', notes: 'status icon: a curved bone fang with a separate green drop', mirror: false };

const KEY = {
  b: 'skin.0',
  a: 'hair.0',
  g: 'grass.0',
  G: 'grass.1',
};
const ROWS = [
  '..oooo...',
  '.obbbbo..',
  '.obbbao..',
  '.obbao...',
  'obbao..o.',
  'obao..ogo',
  'oao..ogGo',
  'oo...oGGo',
  'o.....oo.',
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
