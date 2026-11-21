// icon-asleep base.v4 (x2, from base.v3) — retry per the v3 review: the filled dome body is deleted; a thin closed-lid arc that curves DOWN like a smile (x1-2 y5, x3-5 y6, x6-7 y5) on the bright grass.0 step, outlined above and below (the gate's 85% dark-edge line rule needs the ring); 3 lash ticks at x2, x4, x6 joined to the arc; the low-contrast grey cloth ramp swapped for the brighter grass ramp; a small 3 x 4 "z" (a 3 x 3 z reads as an I) in accent on its outline plate at the top right as the sleep cue. Flat front-on 9 x 9 pixel drawing, no iso box, ramp colours only (R11).
export const meta = { brief: 'icon-asleep', pass: 'x2', notes: 'status icon: a closed eye: thin smile-shaped lid arc with 3 lash ticks, small accent z top right', mirror: false };

const KEY = {
  b: 'grass.0',
  a: 'grass.1',
  z: 'accent.0',
};
const ROWS = [
  '....ozzzo',
  '....ooozo',
  '....oozoo',
  '....ozzzo',
  '.oo.ooooo',
  'obbooobbo',
  '.oabbbao.',
  '..ooaoo..',
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
