// icon-poisoned base.v3 (x1, from base.v2) — redo list: the fang is now a curved crescent (root 1px narrower, 3 px, bowing right and hooking its tip back left) and the venom is two separate drips in the brightest grass step (grass.0), each kept 1px of outline away from the tip, so it reads as poison at 9 x 9.
export const meta = { brief: 'icon-poisoned', pass: 'x1', notes: 'status icon: a curved, hooked bone fang with two venom drips below its tip', mirror: false };

const KEY = {
  b: 'skin.0',
  a: 'hair.0',
  g: 'grass.0',
};
const ROWS = [
  'oooo.....',
  'obbbo....',
  '.obbbo...',
  '..obbao..',
  '...obao..',
  '...oaooo.',
  '...ooogo.',
  '...ogogo.',
  '....o.o..',
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
