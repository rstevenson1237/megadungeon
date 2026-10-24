// family-gems base.v3 (r3) — from base.v1 (6.5), the best so far (R12). The v2 review (5.5) and the v1 roster asked for
// one tight cluster that reads as cut gems at 1x. Changed: the shapes only. v1's three spread lozenges (about 14 px wide)
// become two overlapping cut gems in one cluster about 7 px of colour wide: a blue stone (cloth) behind and a red stone
// (accent) in front, kept apart from coins (cream-gold stacks), potion and ring by the red/blue pair. Each gem has 2 px
// facets (a mid left facet, a dark right facet, a pointed pavilion), the red one a 1 px pale highlight, and the blue one
// a single 1 px glow sparkle (no cross). Placement as v1: centred on the cell centre (16, 24), 1 px ink outline; the floor
// diamond is not drawn. Ramps and tokens only (R11).
export const meta = { brief: 'family-gems', pass: 'r3', notes: "one tight cluster of two cut gems, red in front of blue, 2 px facets, a 1 px sparkle", mirror: false };

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
  // per gem: s sparkle / highlight, h lit facet, e mid facet, d dark facet
  const red = { s: pal.accent[0], e: pal.accent[1], d: pal.accent[2] };
  const blue = { s: pal.glow[0], h: pal.cloth[0], e: pal.cloth[1], d: pal.cloth[2] };
  const blueGem = [
    '.XXXX.',
    'XshheX',
    'XhhedX',
    '.XedX.',
    '..XX..',
  ];
  const redGem = [
    '.XXXX.',
    'XseedX',
    'XeeddX',
    '.XedX.',
    '..XX..',
  ];
  // painted back to front: the red gem overlaps the blue one's lower left
  stamp(blueGem, blue, -1, -5);
  stamp(redGem, red, -4, -3);
  return g;
}
