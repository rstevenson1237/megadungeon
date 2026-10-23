// family-coins base.v2 (r2) — from base.v1 (7): the roster found red-orange bars that read as bricks; the coins are now
// round pale-gold discs (wood ramp face and rim, glow.0 highlight, no accent red) in a small spill about 16 px across:
// a short stack of two at the back and two flat coins in front. One family of floor items: a hand-placed pixel drawing
// centred on the cell centre (16, 24), 1 px ink outline, lit top edge and dark rim; the floor diamond is not drawn. Ramps
// and tokens only (R11).
export const meta = { brief: 'family-coins', pass: 'r2', notes: "round pale-gold discs: a stack of two and two flat coins, glow highlight, no red", mirror: false };

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
  // pale gold: glow.0 face and highlight, wood.0 lower face and lit edge, wood.1 shade and edge, wood.2 the gaps between stacked coins
  const key = { h: pal.glow[0], g: pal.wood[0], e: pal.wood[1], d: pal.wood[2] };
  const disc = [
    '..XXXXX..',
    '.XhhhhgX.',
    'XhhhhggeX',
    '.XggeeeX.',
    '..XXXXX..',
  ];
  const stack = [
    '..XXXXX..',
    '.XhhhhgX.',
    'XhhhhggeX',
    'XgggeeedX',
    'XdddddddX',
    'XgggeeedX',
    '.XXXXXXX.',
  ];
  // painted back to front so each nearer coin overlaps the one behind it
  stamp(stack, key, -1, -8);
  stamp(disc, key, -8, -4);
  stamp(disc, key, -4, -1);
  return g;
}
