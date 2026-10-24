// icon-blessed base.v1 (r1) — a sunburst: cream disc with salmon shade, cream rays. Flat front-on 9 x 9 pixel drawing, no iso box: one bold shape, the direction's outline, ramp colours only (R11).
export const meta = { brief: 'icon-blessed', pass: 'r1', notes: 'status icon: a sunburst: cream disc with salmon shade, cream rays', mirror: false };

const KEY = {
  b: 'glow.0',
  y: 'accent.0',
  s: 'accent.0',
};
const ROWS = [
  '....o....',
  '...obo...',
  '..ooboo..',
  '.obbbbbo.',
  'obbbybbbo',
  '.obbbsbo.',
  '..ooboo..',
  '...obo...',
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
