// icon-slowed base.v3 (x1, from base.v2) — redo fix: shell corners rounded (top-left and bottom-right cut to outline, tail tucks under), body lengthened forward under the head, and a 1px pale eye-stalk pair above the head (tips x0,x2 y0, joined at x1 y1).
export const meta = { brief: 'icon-slowed', pass: 'x1', notes: 'status icon: a round terracotta spiral snail shell on a long grey foot, two eye stalks', mirror: false };

const KEY = {
  b: 'skin.1',
  a: 'skin.2',
  h: 'skin.0',
  f: 'stone.0',
  e: 'stone.1',
};
const ROWS = [
  'f.f.ooo..',
  '.f.ohbbo.',
  'offohaabo',
  'offobabbo',
  'offobbabo',
  'offfobbo.',
  'offffooo.',
  'offeeeeeo',
  '.ooooooo.',
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
