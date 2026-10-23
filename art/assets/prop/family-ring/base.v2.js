// family-ring base.v2 (r2) — from base.v1, changed what the v1 roster and review asked: v1 was a 7 x 6 filled red dome
// that twinned the potion. v2 is an 11 x 11 ring standing on its edge: an open band (a transparent hole lined in ink, so
// the floor shows through as a dark centre) in brass (the wood ramp: lit left, dark right), with a pale blue stone
// (cloth ramp) and one glow.0 glint set on top. No red-orange (kept for magic and lights). Placement as v1: standing on
// the cell centre (16, 24), 1 px ink outline; the floor diamond is not drawn. Ramps and tokens only (R11).
export const meta = { brief: 'family-ring', pass: 'r2', notes: 'a brass ring on its edge with an open centre and a pale blue stone on top', mirror: false };

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
    '....XXX....',
    '...XgssX...',
    '..XXsttXX..',
    '..XabbbcX..',
    '.XabXXXbcX.',
    'XabX...XbcX',
    'XabX...XbcX',
    'XabX...XbcX',
    '.XbbXXXccX.',
    '..XbccccX..',
    '...XXXXX...',
  ], { a: pal.wood[0], b: pal.wood[1], c: pal.wood[2], s: pal.cloth[0], t: pal.cloth[1], g: pal.glow[0] }, -5, -9);
  return g;
}
