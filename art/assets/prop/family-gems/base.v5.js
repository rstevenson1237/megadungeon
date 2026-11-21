// family-gems base.v5 (x1) — from base.v4 (6.5). The blind re-score named two faults: the tan stone read as a mushroom
// or acorn (round cap on a dark stalk) and at 1x the pile was one red speck with little facet structure. Changes:
// - the tan stone becomes a topaz on the gold ramp (gold.0 table, gold.1 light pavilion facet, gold.2 dark facet),
//   cut 6 px wide with a pointed pavilion, so no dark stalk is left;
// - every stone gets the same readable cut: a bright table row (ramp step 0), then a pavilion split into a lighter
//   left facet (step 1) and a darker right facet (step 2) down to an ink point;
// - every table carries a 1 px sparkle (glow.0 on the blue and red, metal.0 on the gold) so the pile glints at 1x;
// - per the floor-item lineup note (too much accent red), the large front stone is now the pale blue (cloth ramp)
//   and the red moves to the smaller stone behind, so the pile reads blue/gold first, not as a red speck.
// Contact shadows (stone.2) under each point as before. Ramps and tokens only (R11).
export const meta = { brief: 'family-gems', pass: 'x1', notes: 'topaz replaces the tan stone; table/light/dark facets and a 1px sparkle on each gem; blue is the large front stone, red behind', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir, ink = ctx.dir.outline;
  const g = ctx.lib.t2.scene3d({ k: 2 }).render(w, h, { renderer: 'raster', yaw: 45, pivot: [0, 0, 0], at: [w / 2, h - 8], shadow: false });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g.alpha(x, y) > 0) g.clear(x, y);
  const cx = w >> 1, cy = h - 8; // the cell centre
  // stamp a map: '.' empty, 'X' ink, other characters through the key; (ox, oy) is the top-left, from the centre
  const stamp = (map, key, ox, oy) => map.forEach((row, j) => [...row].forEach((c, i) => {
    const col = c === 'X' ? ink : key[c];
    if (col) g.set(cx + ox + i, cy + oy + j, col);
  }));
  const s = pal.stone[2]; // contact shadow
  const ox = -7, oy = -11;
  // red, behind in the middle (smaller): table accent.0 with a glow.0 sparkle, light facet accent.1, dark facet accent.2
  stamp([
    '.XXXX.',
    'XtGttX',
    'XlllkX',
    '.XlkX.',
    '..XX..',
    '...ss.',
  ], { t: pal.accent[0], G: pal.glow[0], l: pal.accent[1], k: pal.accent[2], s }, ox + 4, oy + 0);
  // blue, in front at the left (the largest): table cloth.0 with a glow.0 sparkle, light facet cloth.1, dark cloth.2
  stamp([
    '.XXXXX.',
    'XtGtttX',
    'XllllkX',
    '.XllkX.',
    '..XlkX.',
    '...XX..',
    '....ss.',
  ], { t: pal.cloth[0], G: pal.glow[0], l: pal.cloth[1], k: pal.cloth[2], s }, ox + 0, oy + 6);
  // topaz, in front at the right: table gold.0 with a metal.0 sparkle, light facet gold.1, dark facet gold.2
  stamp([
    '.XXXX.',
    'XtGttX',
    'XlllkX',
    '.XlkX.',
    '..XX..',
    '...ss.',
  ], { t: pal.gold[0], G: pal.metal[0], l: pal.gold[1], k: pal.gold[2], s }, ox + 8, oy + 7);
  return g;
}
