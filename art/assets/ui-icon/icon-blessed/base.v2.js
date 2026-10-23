// icon-blessed base.v2 (r2) — from base.v1: roster: the four-point star twinned fx-hit and fx-frost; now a round sun disc (cream core, salmon ring) with eight cream rays running through the ring to its rim and four short nubs, so the silhouette is a disc, not a star.
export const meta = { brief: 'icon-blessed', pass: 'r2', notes: "status icon: a sun disc: cream core, salmon ring, eight cream rays", mirror: false };

const KEY = {
  b: 'glow.0',
  s: 'accent.0',
};
const ROWS = [
  '....o....',
  '..ooboo..',
  '.obsbsbo.',
  '.osbbbso.',
  'obbbbbbbo',
  '.osbbbso.',
  '.obsbsbo.',
  '..ooboo..',
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
