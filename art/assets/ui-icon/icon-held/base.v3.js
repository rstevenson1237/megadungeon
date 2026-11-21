// icon-held base.v3 (x1, from base.v2) — redo wave 2: the two square cuffs read as a percent sign at 1x. Now a U-shaped
// shackle: a rounded 1px steel bow arching over the open cuff (a see-through hole) closed by a pin bar, with one
// short chain link hanging from the pin's middle; rounded ring corners, one metal highlight pixel on the upper left.
// A see-through ring with a hanging link keeps it apart from icon-shield (solid, flat top, pointed foot) and icon-frightened (solid tapered skull).
export const meta = { brief: 'icon-held', pass: 'x1', notes: 'status icon: U-shaped shackle: rounded 1px bow over an open cuff, pin bar below, one short chain link', mirror: false };

const KEY = {
  a: 'metal.0',
  b: 'metal.1',
  c: 'metal.2',
};
const ROWS = [
  '..ooooo..',
  '.oabbbco.',
  'oboooooco',
  'obo...oco',
  'obo...oco',
  'oboooooco',
  '.obbbbco.',
  '..ooboo..',
  '...oco...',
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
