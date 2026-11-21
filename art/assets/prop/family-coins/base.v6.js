// family-coins base.v6 (x2) — from base.v5 (6.5), the one retry Robert approved after the wave 1 blind miss. Both
// reviewers read v5's loose coins as square-cornered bars (ingots, bricks) and its stack of four as a barrel. Changed,
// all to that note: each loose coin is now a flat iso ellipse (a 6 x 3 body, corner pixels cut, 8 x 5 with the outline)
// with a light gold.0 top, a gold.1 rim and gold.2 only on the underside; one coin is tilted (leaning on a neighbour);
// the coins overlap in a loose spill, not a grid; the stack is three coins, each offset 1 px, rounded ends and a 1 px ink
// line between coins (gold.2 under the bottom one). Kept from v5: the gold ramp, no accent red, the glow.0 rim light and glint, the placement on the
// cell centre (16, 24), the 1 px ink outline, no floor diamond. Ramps and tokens only (R11).
export const meta = { brief: 'family-coins', pass: 'x2', notes: 'gold ramp: round iso coin ellipses overlapping in a loose spill, one tilted, a stack of three offset coins', mirror: false };

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
  // r rim light / glint (glow.0), h top (gold.0), m rim (gold.1), d underside (gold.2)
  const key = { r: pal.glow[0], h: pal.gold[0], m: pal.gold[1], d: pal.gold[2] };
  // one flat coin lying on the floor: an iso ellipse, corners cut
  const coin = [
    '..XXXX..',
    '.XrhhhX.',
    'XhhhhhmX',
    '.XmdddX.',
    '..XXXX..',
  ];
  // a coin tilted, leaning on its neighbour: the ellipse turned up on its right side
  const tilt = [
    '...XXX.',
    '..XrhhX',
    '.XhhhmX',
    'XhhhmdX',
    'XmddX..',
    '.XXX...',
  ];
  // the stack of three, each coin offset 1 px: the top coin's face with a 2 px glint, then the gold.1 rims, ink lines between, gold.2 under the bottom
  const stack = [
    '...XXXX...',
    '..XrrhhX..',
    '.XhhhhhmX.',
    '.XmmmmmdX.',
    '..XXXXXXX.',
    '..XmmmmmdX',
    '.XXXXXXXX.',
    '.XmmmmmdX.',
    '.XddddddX.',
    '..XXXXXX..',
  ];
  // back to front (by the bottom row) so each nearer coin overlaps the one behind it; a loose, uneven spill
  stamp(stack, key, -6, -14);   // the stack at the back-left
  stamp(coin, key, 2, -8);      // back right, lying apart
  stamp(tilt, key, 7, -6);      // leaning on it
  stamp(coin, key, -3, -5);     // against the stack's foot
  stamp(coin, key, -11, -3);    // far left
  stamp(coin, key, 3, -2);      // right, overlapping the back coins
  stamp(coin, key, -3, 0);      // front middle
  return g;
}
