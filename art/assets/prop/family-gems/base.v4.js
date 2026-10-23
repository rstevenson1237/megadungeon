// family-gems base.v4 (x1) — from base.v1 (6.5), the best base (R12). One change, the cluster's layout and cut, as the
// blind re-score of finish.v1 asked: its two touching stones merged into a heart/berry blob standing upright. Now three
// separate cut stones, each a flat table, an angled crown and a pointed pavilion with one ink outline, set apart by
// 1 px gaps so every silhouette stays its own: a red stone in front at the left (the largest), a blue one behind in
// the middle (its highlight lifted a step: metal.0 table glint over cloth.0, so it separates from the floor at 1x) and
// a small gold one in front at the right (wood ramp, glow.0 glint). Each lies on the floor diamond with a 1-row dark
// contact shadow (stone.2, 2 px) under its point, falling away from the top-left light. About 13 px wide.
// Ramps and tokens only (R11).
export const meta = { brief: 'family-gems', pass: 'x1', notes: 'three separate cut stones (red, blue, gold) with 1px gaps, table/crown/pavilion cut, contact shadows', mirror: false };

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
  const s = pal.stone[2]; // contact shadow
  // the cluster on a 13 x 13 grid; its ground row (12) sits one row under the cell centre, its middle column on it
  const ox = -6, oy = -11;
  // blue, behind in the middle: table glint metal.0, crown cloth.0, body cloth.1, dark side cloth.2
  stamp([
    '.XXXX.',
    'XGcchX',
    'XccbkX',
    '.XbkX.',
    '..XX..',
    '...ss.',
  ], { G: pal.metal[0], c: pal.cloth[0], h: pal.cloth[1], b: pal.cloth[1], k: pal.cloth[2], s }, ox + 4, oy + 0);
  // red, in front at the left (the largest): table glint glow.0 and accent.0, body accent.1, dark side accent.2
  stamp([
    '.XXXXX.',
    'XGarrrX',
    'XrrrrdX',
    '.XrrdX.',
    '..XdX..',
    '...X...',
    '...ss..',
  ], { G: pal.glow[0], a: pal.accent[0], r: pal.accent[1], d: pal.accent[2], s }, ox + 0, oy + 6);
  // gold, in front at the right (the smallest): glint glow.0, face wood.0, dark side wood.1
  stamp([
    '.XXX.',
    'XGyoX',
    'XyooX',
    '.XoX.',
    '..X..',
    '..ss.',
  ], { G: pal.glow[0], y: pal.wood[0], o: pal.wood[1], s }, ox + 8, oy + 7);
  return g;
}
