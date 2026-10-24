// icon-held base.v1 (r1) — a shackle: steel cuff ring over a brown lock block. Flat front-on 9 x 9 pixel drawing, no iso box: one bold shape, the direction's outline, ramp colours only (R11).
export const meta = { brief: 'icon-held', pass: 'r1', notes: 'status icon: a shackle: steel cuff ring over a brown lock block', mirror: false };

const KEY = {
  b: 'metal.0',
  a: 'metal.1',
  c: 'metal.2',
  d: 'leather.1',
  e: 'leather.2',
};
const ROWS = [
  '..ooooo..',
  '.obbbbco.',
  'obbooocco',
  'obo...oco',
  'obbooocco',
  '.obbbcco.',
  '..odddo..',
  '..odeeo..',
  '...ooo...',
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
