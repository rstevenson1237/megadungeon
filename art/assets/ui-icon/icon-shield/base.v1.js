// icon-shield base.v1 (r1) — a kite shield: steel rim, blue field, red cross. Flat front-on 9 x 9 pixel drawing, no iso box: one bold shape, the direction's outline, ramp colours only (R11).
export const meta = { brief: 'icon-shield', pass: 'r1', notes: 'status icon: a kite shield: steel rim, blue field, red cross', mirror: false };

const KEY = {
  b: 'metal.0',
  f: 'cloth.1',
  e: 'accent.1',
  c: 'metal.1',
};
const ROWS = [
  'ooooooooo',
  'obbbbbbbo',
  'obfffefbo',
  'obeeeeebo',
  '.obfefco.',
  '.obfefco.',
  '..obfco..',
  '...oco...',
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
