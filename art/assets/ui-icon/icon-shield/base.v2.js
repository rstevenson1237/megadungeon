// icon-shield base.v2 (r2) — from base.v1: roster: the kite's triangle twinned icon-poisoned; now a heater shield with a wide flat steel rim on top, straight sides and a round bottom, blue field split by a steel pale (red cross dropped: red is kept for magic).
export const meta = { brief: 'icon-shield', pass: 'r2', notes: "status icon: a heater shield: flat steel rim, straight sides, round bottom, blue field, steel pale", mirror: false };

const KEY = {
  b: 'metal.0',
  c: 'metal.1',
  f: 'cloth.1',
  d: 'cloth.2',
  m: 'metal.0',
};
const ROWS = [
  'ooooooooo',
  'obbbbbbco',
  'obffmffco',
  'obffmffco',
  'obffmfdco',
  'obffmddco',
  '.obfcdco.',
  '..occco..',
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
