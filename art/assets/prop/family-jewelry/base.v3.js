// family-jewelry base.v3 (r3) — from base.v1 (7), the best so far (R12), keeping base.v2's silver chain (its review: the
// silver loop reads as a necklace at 1x). One change, the ring and the pendant, as the v1 roster ("the ring beside it is
// a red blob") and the v2 review ("ochre ring reads as a dull olive square block, pendant tiny and muddy") asked:
// - the ring is now a round band lying flat, 8 x 6 px, with a clear 2 x 2 hole the floor shows through, its top arc
//   lit pale gold (glow.0), its sides wood.0 and only its underside wood.1, so it reads as a bright gold O, not a block;
// - the pendant is larger (7 x 6 px plus a gold bail on the chain), a cut drop in the deeper blue (cloth.1 body,
//   cloth.0 crown, a metal.0 glint, cloth.2 point), so it stands apart from the pale silver chain at 1x.
// No accent red. Chain and placement are base.v2's. Ramps and tokens only (R11).
export const meta = { brief: 'family-jewelry', pass: 'r3', notes: 'v2 silver chain; round gold ring with a clear hole and bright highlights; larger blue pendant', mirror: false };

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
  // the chain: an oval loop of single links with an ink line on both sides; near half bright, far half mid
  const loop = [];
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; loop.push([Math.round(Math.cos(a) * 6), Math.round(Math.sin(a) * 3.2), i]); }
  const taken = new Set(loop.map(([x, y]) => x + ',' + y));
  for (const [x, y] of loop) for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) if (!taken.has((x + dx) + ',' + (y + dy))) g.set(cx - 3 + x + dx, cy - 2 + y + dy, ink);
  for (const [x, y, i] of loop) g.set(cx - 3 + x, cy - 2 + y, y > 0 ? pal.metal[0] : y < 0 ? pal.metal[1] : pal.metal[i % 2]);
  // the pendant hanging at the loop's front: a gold bail on the chain and a larger blue cut drop under it
  stamp([
    '...b...',
    '.XXXXX.',
    'XGhhccX',
    'XhcccEX',
    '.XccEX.',
    '..XEX..',
    '...X...',
  ], { b: pal.glow[0], G: pal.metal[0], h: pal.cloth[0], c: pal.cloth[1], E: pal.cloth[2] }, -6, 1);
  // the ring, lying flat at the right: a round gold band, its top arc lit, a clear hole the floor shows through
  stamp([
    '..XXXX..',
    '.XGggyX.',
    'XgX..XyX',
    'XyX..XoX',
    '.XyyooX.',
    '..XXXX..',
  ], { G: pal.glow[0], g: pal.glow[0], y: pal.wood[0], o: pal.wood[1] }, 5, -1);
  return g;
}
