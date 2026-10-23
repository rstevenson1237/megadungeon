// icon-hasted base.v2 (r2, from base.v1) — roster: v1 read as a boot-like chunk, wing barely visible, skin-pink boot. Now a low leather boot (toe left) with a white wing sweeping up and right from its heel as the dominant shape.
export const meta = { brief: 'icon-hasted', pass: 'r2', notes: 'status icon: a leather boot with a white wing sweeping up from the heel', mirror: false };

const KEY = {
  w: 'metal.0',
  v: 'metal.1',
  b: 'leather.0',
  a: 'leather.1',
  c: 'leather.2',
};
const ROWS = [
  '......o.o',
  '....oowwo',
  '...owwwwo',
  '..owwvvoo',
  '..ovvoo..',
  '.oooobao.',
  'obbbbbbao',
  'occccccco',
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
