// family-gems base.v2 (r2) — from base.v1 (6.5): the reviewer and roster read v1's lozenges as pills or a notched heart,
// stones but not cut gems. Changed: the shapes only become cut stones (a flat table on top, a girdle, a crown split into
// a lit left and a shaded right facet, a pavilion that narrows to a point), each with a near-white metal.0 glint on the
// table, and a 4-point sparkle above the largest; the colours leave the red that potion, ring and jewelry share: a large
// blue stone (cloth), a clear white one (metal) and a small garnet (leather). Placement as v1: centred on the cell centre
// (16, 24), 1 px ink outline; the floor diamond is not drawn. Ramps and tokens only (R11).
export const meta = { brief: 'family-gems', pass: 'r2', notes: "cut-stone silhouettes (table, crown facets, pointed pavilion) with a glint and a sparkle; blue, white and garnet, no accent red", mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir, ink = ctx.dir.outline;
  const g = ctx.lib.t2.scene3d({ k: 2 }).render(w, h, { renderer: 'raster', yaw: 45, pivot: [0, 0, 0], at: [w / 2, h - 8], shadow: false });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g.alpha(x, y) > 0) g.clear(x, y);
  const cx = w >> 1, cy = h - 8; // the cell centre
  // stamp a map: rows of characters, '.' empty, 'X' ink, other characters through the key; (ox, oy) is the top-left, from the centre
  const stamp = (map, key, ox, oy) => map.forEach((row, j) => [...row].forEach((c, i) => {
    const col = c === 'X' ? ink : key[c];
    if (col) g.set(cx + ox + i, cy + oy + j, col);
  }));
  // per stone: w glint, h lit facet, e mid facet, d shaded facet
  const blue = { w: pal.metal[0], h: pal.cloth[0], e: pal.cloth[1], d: pal.cloth[2] };
  const white = { w: pal.glow[0], h: pal.metal[0], e: pal.metal[1], d: pal.metal[2] };
  const garnet = { w: pal.metal[0], h: pal.leather[0], e: pal.leather[1], d: pal.leather[2] };
  const large = [
    '..XXXXX..',
    '.XwhhheX.',
    'XhhhheeeX',
    '.XhheedX.',
    '..XhedX..',
    '...XdX...',
    '....X....',
  ];
  const medium = [
    '.XXXXX.',
    'XwhheeX',
    '.XhedX.',
    '..XdX..',
    '...X...',
  ];
  const small = [
    '.XXX.',
    'XwheX',
    '.XdX.',
    '..X..',
  ];
  // painted back to front so each nearer stone overlaps the one behind it
  stamp(large, blue, -2, -7);
  stamp(medium, white, -8, -3);
  stamp(small, garnet, 4, -1);
  // a 4-point sparkle at the large stone's top-right corner
  const spark = ['.w.', 'www', '.w.'];
  stamp(spark, { w: pal.metal[0] }, 5, -9);
  return g;
}
