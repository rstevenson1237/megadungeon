// icon-blessed base.v3 (x1) — from base.v1: art redo wave 2: the four-point star twinned fx-hit; now a small sun: a bright cream disc (glow.0) with eight short salmon rays (accent.0), four straight and four diagonal, each ray outlined so the whole silhouette keeps the direction's dark edge. Same 9 x 9 frame, blessed colours and outline.
export const meta = { brief: 'icon-blessed', pass: 'x1', notes: 'status icon: a sun: bright cream disc, eight short salmon rays', mirror: false };

const KEY = {
  b: 'glow.0',
  s: 'accent.0',
};
const ROWS = [
  '.o..o..o.',
  'osoosooso',
  '.osososo.',
  '.oobbboo.',
  'ossbbbsso',
  '.oobbboo.',
  '.osososo.',
  'osoosooso',
  '.o..o..o.',
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
