// family-jewelry base.v2 (r2) — from base.v1 (7), the best so far (R12). One change, the colours, as the v1 roster and
// review asked: the ring beside the necklace read as a red blob and twinned family-ring (a red band), and the red pendant
// matched the coins, ring and potion reds. Now no accent red at all: the chain is silver with depth (its near half the
// metal ramp's light step, its far half the mid step, so it stands off the floor), the pendant a pale-blue cut stone
// (cloth ramp) in a gold mount, and the ring an ochre gold band (two glow.0 lit pixels, wood.1 face, wood.2 underside)
// with an inked hole, darker than the pale coin stacks, so at 1x it reads as a silver loop with a blue drop and a small gold O. Shapes and placement are v1's.
// Ramps and tokens only (R11).
export const meta = { brief: 'family-jewelry', pass: 'r2', notes: 'silver chain with depth, pale-blue stone in a gold mount, an ochre gold ring; no red', mirror: false };

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
  // the pendant hanging at the loop's front: a gold mount and a pale-blue drop
  const gold = { g: pal.glow[0], o: pal.wood[0], u: pal.wood[1] };
  stamp(['.XXX.', 'XbcdX', 'XcceX', '.XeX.', '..X..'], { ...gold, b: pal.glow[0], c: pal.cloth[0], d: pal.cloth[1], e: pal.cloth[2] }, -5, 1);
  stamp(['.XXX.'], gold, -5, 0);
  g.set(cx - 4, cy + 0, pal.wood[0]); g.set(cx - 3, cy + 0, pal.glow[0]); g.set(cx - 2, cy + 0, pal.wood[1]);
  // the ring, lying at the right: a deep-gold band (ochre, two lit pixels), its hole inked dark
  stamp(['.XXXX.', 'XgguuX', 'XuXXuX', 'XudddX', '.XXXX.'], { ...gold, d: pal.wood[2] }, 4, -1);
  return g;
}
