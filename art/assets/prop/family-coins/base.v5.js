// family-coins base.v5 (x1) — from base.v1 (7), rebuilt to the blind reviewer's note (v1's square red-orange stacks read
// as bricks or meat) in the direction's GOLD ramp (material gold, Spec 01b, October 24, 2026), no accent red: a spill of
// six small flat iso coins (a 5 x 2 face with cut corners over a full-width 1 px underside band, 7 x 5 with the outline)
// scattered unevenly across the floor diamond, and a short stack of four at the back-left. Each coin: gold.0 face, a
// glow.0 rim pixel at the top-left, gold.1 on the far-right edge, gold.2 underside band; the stack's edges alternate
// gold.1 and gold.2; a 2 px glow.0 specular glint on the stack's top coin only. Placement as v1: centred on the cell
// centre (16, 24), 1 px ink outline; the floor diamond is not drawn. Ramps and tokens only (R11).
export const meta = { brief: 'family-coins', pass: 'x1', notes: 'gold ramp: six small iso coin ellipses spilled unevenly, a stack of four at the back, rim light and a glint', mirror: false };

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
  // r rim light / glint (glow.0), h face (gold.0), m edge (gold.1), d underside (gold.2)
  const key = { r: pal.glow[0], h: pal.gold[0], m: pal.gold[1], d: pal.gold[2] };
  // one flat coin lying on the floor
  const coin = [
    '.XXXXX.',
    'XrhhhhX',
    'XhhhhmX',
    'XdddddX',
    '.XXXXX.',
  ];
  // the stack of four: the top coin's face with a 2 px glint, then four coin edges, gold.1 rims with gold.2 seams
  const stack = [
    '.XXXXX.',
    'XrrhhhX',
    'XhhhhmX',
    'XmmmmdX',
    'XdddddX',
    'XmmmmdX',
    'XdddddX',
    'XmmmmdX',
    'XdddddX',
    'XdddddX',
    '.XXXXX.',
  ];
  // back to front (by the bottom row) so each nearer coin overlaps the one behind it; uneven spacing across the diamond
  stamp(stack, key, -5, -16);   // the stack at the back-left
  stamp(coin, key, 2, -7);      // back right, lying apart
  stamp(coin, key, -4, -4);     // against the stack's foot
  stamp(coin, key, -12, -3);    // far left
  stamp(coin, key, 5, -1);      // right
  stamp(coin, key, -6, 2);      // front left
  stamp(coin, key, 1, 3);       // nearest, a little apart
  return g;
}
