// family-gems base.v1 (r1) — a few cut gems: a red, a blue and a small pale one, each a faceted lozenge with a lit corner
// One family of floor items: a hand-placed pixel drawing centred on the cell centre (16, 24), 1 px ink outline, 2-3 ramp
// steps per material, lit top edge and dark underside; the floor diamond is not drawn. Ramps and tokens only (R11).
export const meta = { brief: 'family-gems', pass: 'r1', notes: "a few cut gems: a red, a blue and a small pale one, each a faceted lozenge with a lit corner", mirror: false };

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
  const red = { g: pal.glow[0], h: pal.accent[0], e: pal.accent[1], d: pal.accent[2] };
  const blue = { g: pal.glow[0], h: pal.cloth[0], e: pal.cloth[1], d: pal.cloth[2] };
  const gem = [
    '..XXX..',
    '.XghhX.',
    'XghheeX',
    'XhheedX',
    '.XeddX.',
    '..XXX..',
  ];
  stamp(gem, red, -7, -4);
  stamp(gem, blue, 0, -5);
  const pale = { g: pal.glow[0], h: pal.metal[0], e: pal.metal[1], d: pal.metal[2] };
  stamp(['.XXX.', 'XghhX', 'XhmeX', '.XeX.', '..X..'].map((r) => r.replace('m', 'h')), pale, -3, -1);
  return g;
}
