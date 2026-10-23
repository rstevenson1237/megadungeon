// family-potion base.v2 (r2) — from base.v1 (7.5). One change, the roster note: the squat voxel bottle read as "a red
// cherry or apple" and twinned family-ring (both small red blobs). The bottle is now an upright hand-placed pixel drawing
// (the fine-voxel model cannot hold a 1 px neck or a glass highlight at this size): a wide cork, a narrow glass neck,
// sloped shoulders of clear glass with a bright glow.0 highlight down the left, and red liquid only in the lower belly,
// so it reads as a glass bottle by silhouette (tall, necked) and by colour (pale glass over red) at 1x.
// It stands on the cell centre (16, 24); the floor diamond is not drawn. Role ramps and tokens only (R11):
// cloth (glass), accent (liquid), glow (highlight), wood (cork) and the outline.
export const meta = { brief: 'family-potion', pass: 'r2', notes: 'upright necked bottle: cork, glass neck and shoulders with highlight, red liquid below', mirror: false };

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
  stamp([
    '...XXX...',
    '..XwwWX..',
    '...XWX...',
    '...XcX...',
    '..XGcbX..',
    '.XGccbbX.',
    'XcGcccbKX',
    'XrRRRRRDX',
    'XrRRRRDDX',
    '.XRRRDDX.',
    '..XXXXX..',
  ], {
    w: pal.wood[0], W: pal.wood[1],
    G: pal.glow[0], c: pal.cloth[0], b: pal.cloth[1], K: pal.cloth[2],
    r: pal.accent[0], R: pal.accent[1], D: pal.accent[2],
  }, -4, -9);
  return g;
}
