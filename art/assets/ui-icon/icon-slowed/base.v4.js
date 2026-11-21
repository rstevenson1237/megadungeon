// icon-slowed base.v4 (x2, from base.v3) — retry on the reviewers' notes: the grey body is laid flat as a low foot along rows 6-7 sticking out left of the shell (mid stone, no longer the brightest mass), the head rises only 2 px, tapered (1 px top) with a shaded back edge and a thin stalk V (pale tips, dark joint); the brightest value (skin.0) sits only on the shell's top-left highlight; the dark step is redrawn as a hook curling from the shell centre round (5,2)-(7,3)-(5,4). Shell stays round, outlined, terracotta.
export const meta = { brief: 'icon-slowed', pass: 'x2', notes: 'status icon: a round terracotta spiral snail shell on a low flat grey foot, short raised head with two eye stalks', mirror: false };

const KEY = {
  b: 'skin.1',
  a: 'skin.2',
  h: 'skin.0',
  f: 'stone.0',
  e: 'stone.1',
  d: 'stone.2',
};
const ROWS = [
  '....oooo.',
  '...ohhbbo',
  'f.fohaabo',
  '.o.ohbbao',
  'ofoobaabo',
  'oedobbbao',
  'oeeeoooo.',
  'oeeeeeddo',
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
