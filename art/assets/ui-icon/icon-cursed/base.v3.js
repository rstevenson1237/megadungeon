// icon-cursed base.v3 (x1) — from base.v1: blind review fix: ring corners rounded, both arcs end cleanly at a diagonal gap at upper right with an outline cap closing each end, no outline around the empty gap (loose shard and the framed hole dropped); lit top-left (accent.0), shaded bottom-right (accent.2).
export const meta = { brief: 'icon-cursed', pass: 'x1', notes: 'status icon: a broken circle: red ring with a clean diagonal break at upper right', mirror: false };

const KEY = {
  a: 'accent.0',
  b: 'accent.1',
  c: 'accent.2',
};
const ROWS = [
  '..ooo....',
  '.oabbo...',
  'obboo....',
  'obo...oo.',
  'obo...obo',
  'obo...oco',
  'obbooocco',
  '.obbbcco.',
  '..ooooo..',
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
