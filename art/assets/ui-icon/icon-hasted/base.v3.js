// icon-hasted base.v3 (x1, from base.v2) — redo: an L-shaped leather boot (3px shaft up the left, toe pointing right along the bottom) with a small three-feather white wing on the back of the shaft.
export const meta = { brief: 'icon-hasted', pass: 'x1', notes: 'status icon: an L-shaped leather boot, toe right, with a small white wing on the heel', mirror: false };

const KEY = {
  w: 'metal.0',
  v: 'metal.1',
  b: 'leather.0',
  a: 'leather.1',
  c: 'leather.2',
};
const ROWS = [
  'ooooooo..',
  'wwobaao..',
  'oowbaao..',
  'wwwbaao..',
  'oovbaaooo',
  '.oobaaaao',
  '..obaaaao',
  '..occccco',
  '..ooooooo',
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
