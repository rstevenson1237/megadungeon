// family-coins base.v3 (r3) — from base.v1 (7), the best so far (R12): the roster read v1's red-orange bars as bricks
// and v2's cream ovals as bread rolls. Changed: the colour only goes to a warm gold ramp with no accent red (glow.0 lit
// face, wood.0 face shade, wood.1 ochre edge stripes, wood.2 the gaps between stacked coins) and one near-white metal.0
// glint pixel on each coin's face; v1's stacks with edge stripes stay (a stack of three at the back, a stack of two to its
// left) and two flat coins now lie apart in front, so the spill reads as round discs. Placement as v1: centred on the cell
// centre (16, 24), 1 px ink outline; the floor diamond is not drawn. Ramps and tokens only (R11).
export const meta = { brief: 'family-coins', pass: 'r3', notes: "warm gold ramp, a glint pixel per coin, v1's striped stacks plus two flat coins lying apart, no red", mirror: false };

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
  // gold: w glint (metal.0), h lit face (glow.0), g face shade (wood.0), e ochre edge (wood.1), d gap between coins (wood.2)
  const key = { w: pal.metal[0], h: pal.glow[0], g: pal.wood[0], e: pal.wood[1], d: pal.wood[2] };
  const stack3 = [
    '.XXXXXX.',
    'XhwhhhgX',
    'XhhhhggX',
    'XeeeeedX',
    'XddddddX',
    'XeeeeedX',
    'XddddddX',
    'XeeeeedX',
    '.XXXXXX.',
  ];
  const stack2 = [
    '.XXXXXX.',
    'XhwhhggX',
    'XhhhgggX',
    'XeeeeedX',
    'XddddddX',
    'XeeeeedX',
    '.XXXXXX.',
  ];
  const flat = [
    '.XXXX.',
    'XwhhgX',
    'XeeedX',
    '.XXXX.',
  ];
  // painted back to front so each nearer coin overlaps the one behind it
  stamp(stack3, key, -2, -9);
  stamp(stack2, key, -8, -6);
  stamp(flat, key, 4, -2);
  stamp(flat, key, -4, 1);
  return g;
}
