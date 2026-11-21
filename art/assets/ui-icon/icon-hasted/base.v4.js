// icon-hasted base.v4 (x2, from base.v3) — retry: the wing is redrawn as two stepped, curved feathers (long top one curling up, short one below) joined to the back of the shaft, light metal with one shade step and outline-closed tips; the leather body is lifted to the light step, the sole is the mid leather step, the toe is rounded and the corners are clear.
export const meta = { brief: 'icon-hasted', pass: 'x2', notes: 'status icon: an L-shaped leather boot, toe right, with a small two-feather white wing on the back of the ankle', mirror: false };

const KEY = {
  w: 'metal.0',   // feather
  v: 'metal.1',   // feather shade
  h: 'accent.0',  // light shin edge
  b: 'leather.0', // boot body
  m: 'leather.1', // boot shade and sole
};
const ROWS = [
  'oo.oooo..',
  'owohbbo..',
  'owwhbbo..',
  'oovhbboo.',
  'owwhbbbmo',
  '.ovhbbbmo',
  '..ohbbbmo',
  '..ommmmmo',
  '...ooooo.',
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
