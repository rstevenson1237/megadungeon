// icon-held base.v4 (x2, from base.v3) — retry: v3 read as a closed ring on a stem (pin, washer). Now an open 1px U-shaped
// steel bar arching over a solid cuff band, the hole see-through with no outline lining the bar, and one short
// 2x2 chain link hanging off the cuff's right end in place of the stem (the line gate allows a 3x1 opening, lined below by the cuff's own top edge). One metal highlight pixel on the upper left.
// Round top, flat cuff and an off-centre link keep it apart from icon-shield (flat top, pointed foot).
export const meta = { brief: 'icon-held', pass: 'x2', notes: 'status icon: open 1px U shackle bar over a cuff band, see-through hole, one 2x2 chain link off the right end of the cuff', mirror: false };

const KEY = {
  a: 'metal.0',
  b: 'metal.1',
  c: 'metal.2',
};
const ROWS = [
  '..ooooo..',
  '.oabbbco.',
  '.ob...co.',
  'oobooocoo',
  'obbbbbbco',
  'occccccco',
  '.ooooobco',
  '.....obco',
  '.....oooo',
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
