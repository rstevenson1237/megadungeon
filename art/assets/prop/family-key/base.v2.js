// family-key base.v2 (r2) — from base.v1, changed what the v1 roster and review asked: v1 lay on the same down-right
// diagonal as the rod, sword and arrows, with teeth too small to see. v2 lies flat across the screen (horizontal), a
// hand-placed drawing: a big round bow with an open hole at the left, a two-pixel shaft, and two large teeth (2 x 2 each)
// hanging under its right end. Brighter iron: the metal ramp's light step on the lit top, the mid step below, the dark
// step on the right ends. Centred on the cell centre (16, 24), 1 px ink outline; the floor diamond is not drawn (R11).
export const meta = { brief: 'family-key', pass: 'r2', notes: 'horizontal iron key: round bow with a hole, shaft, two big teeth', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir, ink = ctx.dir.outline;
  const g = ctx.lib.t2.scene3d({ k: 2 }).render(w, h, { renderer: 'raster', yaw: 45, pivot: [0, 0, 0], at: [w / 2, h - 8], shadow: false });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g.alpha(x, y) > 0) g.clear(x, y);
  const cx = w >> 1, cy = h - 8; // the cell centre
  const stamp = (map, key, ox, oy) => map.forEach((row, j) => [...row].forEach((c, i) => {
    const col = c === 'X' ? ink : key[c];
    if (col) g.set(cx + ox + i, cy + oy + j, col);
  }));
  stamp([
    '.XXXXX...........',
    'XaabbcX..........',
    'XaX.XcXXXXXXXXXX.',
    'XaX.XaaaaaaaaaabX',
    'XbXXXbbbbbbbbbccX',
    'XbbccXXXXXbcXbcX.',
    '.XXXX....XbcXbcX.',
    '.........XXXXXXX.',
  ], { a: pal.metal[0], b: pal.metal[1], c: pal.metal[2] }, -8, -5);
  return g;
}
