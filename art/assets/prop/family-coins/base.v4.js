// family-coins base.v4 (x1) — from base.v1, rebuilt to what the blind reviewer named (v1's square stacks read as bricks
// or meat): a spill of six flat, round iso coins (a 7 x 3 face with cut corners, so each reads as an ellipse) scattered
// unevenly across the floor diamond, and a short stack of four at the back. Gold is the direction's accent ramp
// (palette.materials gold -> accent): face in the light step with a lit top-left rim, the mid step on the far-right edge
// and the dark step for the underside band; the stack's rims alternate light and mid; one glow.0 glint on the top coin of the stack only. Placement as v1:
// centred on the cell centre (16, 24), 1 px ink outline; the floor diamond is not drawn. Ramps and tokens only (R11).
export const meta = { brief: 'family-coins', pass: 'x1', notes: 'round iso coin ellipses spilled across the diamond, stack of four at the back, accent-gold faces, one glint', mirror: false };

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
  // one flat coin: a rounded 2:1 face (light, mid on the far-right edge) over a dark underside band
  const coin = [
    '..XXXXX..',
    '.XhhhhhX.',
    'XhhhhhheX',
    '.XdddddX.',
    '..XXXXX..',
  ];
  // the stack of four: the top coin's face with its glint, then the coins' rims, alternating light and mid steps (the dark step only at the foot)
  const stack = [
    '..XXXXX..',
    '.XhhgghX.',
    'XhhhhhheX',
    'XeeeeeedX',
    'XhhhhhheX',
    'XeeeeeedX',
    'XhhhhhheX',
    'XeeeeeedX',
    '.XdddddX.',
    '..XXXXX..',
  ];
  // back to front (by the coin's bottom row) so each nearer coin overlaps the one behind it; uneven spacing
  stamp(coin, key, 4, -9);       // far right, lying apart
  stamp(stack, key, -4, -13);    // the stack at the back
  stamp(coin, key, -13, -5);     // far left
  stamp(coin, key, 5, -4);       // right
  stamp(coin, key, -7, -2);      // left of centre, leaning on the stack
  stamp(coin, key, 0, 0);        // centre front
  stamp(coin, key, -4, 3);       // nearest
  return g;
}
