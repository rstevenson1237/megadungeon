// family-coins base.v1 (r1) — a spill of coins: three overlapping gold discs and a short stack, light faces, darker rims
// One family of floor items: a hand-placed pixel drawing centred on the cell centre (16, 24), 1 px ink outline, 2-3 ramp
// steps per material, lit top edge and dark underside; the floor diamond is not drawn. Ramps and tokens only (R11).
export const meta = { brief: 'family-coins', pass: 'r1', notes: "a spill of coins: three overlapping gold discs and a short stack, light faces, darker rims", mirror: false };

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
  const key = { g: pal.glow[0], h: pal.accent[0], e: pal.accent[1], d: pal.accent[2] };
  const disc = [
    '.XXXXX.',
    'XgggheX',
    'XghheeX',
    'XeeeddX',
    '.XXXXX.',
  ];
  // painted back to front so each nearer coin overlaps the one behind it; the stack is two coins high
  stamp(disc, key, -7, -4);
  stamp(disc, key, 0, -3);
  stamp(disc, key, -3, -1);
  stamp(['.XXXXX.', 'XgggheX', 'XeeeddX', 'XghheeX', 'XeeeddX', '.XXXXX.'], key, 1, -5);
  return g;
}
