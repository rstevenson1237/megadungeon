// icon-poisoned base.v4 (x2, from base.v3) — wave 2 retry: v3's curved bone fang and bone ramp are kept; the venom now coats the tip and hangs from it as a 2 px drip in the direction's greenest ramp (wood: its light step on the tip, its saturated olive step below it), with one detached 1 px drop in the light step a pixel under the drip; the dark outline around the tip is cut to 1 px on the left only, so the venom is not swallowed by the line. The direction holds no bright green, so wood (yellow-olive) is the nearest in-palette venom.
export const meta = { brief: 'icon-poisoned', pass: 'x2', notes: 'status icon: a curved, hooked bone fang with venom on its tip, a drip and one falling drop', mirror: false };

const KEY = {
  b: 'skin.0',
  a: 'hair.0',
  v: 'wood.0',
  d: 'wood.1',
};
const ROWS = [
  'oooo.....',
  'obbbo....',
  '.obbbo...',
  '..obbao..',
  '...obao..',
  '...oavo..',
  '....od...',
  '.........',
  '.....v...',
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
