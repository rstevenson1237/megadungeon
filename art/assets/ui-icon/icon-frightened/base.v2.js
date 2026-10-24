// icon-frightened base.v2 (r2) — from base.v1: bone-white tint (wood.0 bone with stone.1 shade, was grey stone.0) and the jaw's stray right-hand step at row 6 removed (review note); shape otherwise unchanged.
export const meta = { brief: 'icon-frightened', pass: 'r2', notes: "status icon: a skull: bone-white, dark sockets and teeth gaps", mirror: false };

const KEY = {
  b: 'wood.0',
  a: 'stone.1',
  c: 'stone.1',
};
const ROWS = [
  '..ooooo..',
  '.obbbbao.',
  'obbbbbbco',
  'oboobooco',
  'oboobooco',
  '.obbabco.',
  '..obbco..',
  '..obobo..',
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
