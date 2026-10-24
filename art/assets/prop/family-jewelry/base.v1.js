// family-jewelry base.v1 (r1) — a necklace and a ring: a loop of chain with a red pendant, a gold ring beside it
// One family of floor items: a hand-placed pixel drawing centred on the cell centre (16, 24), 1 px ink outline, 2-3 ramp
// steps per material, lit top edge and dark underside; the floor diamond is not drawn. Ramps and tokens only (R11).
export const meta = { brief: 'family-jewelry', pass: 'r1', notes: "a necklace and a ring: a loop of chain with a red pendant, a gold ring beside it", mirror: false };

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
  const steel = [pal.metal[0], pal.metal[1]];
  // the chain: an oval loop of single links (lit and dim alternating) with an ink shadow row under it
  const loop = [];
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; loop.push([Math.round(Math.cos(a) * 6), Math.round(Math.sin(a) * 3.2), i]); }
  const taken = new Set(loop.map(([x, y]) => x + ',' + y));
  for (const [x, y] of loop) for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) if (!taken.has((x + dx) + ',' + (y + dy))) g.set(cx - 3 + x + dx, cy - 2 + y + dy, ink);
  for (const [x, y, i] of loop) g.set(cx - 3 + x, cy - 2 + y, steel[(i >> 1) % 2]);
  // the pendant hanging at the loop's front
  stamp(['.XXX.', 'XghhX', 'XheeX', '.XdX.'], { g: pal.glow[0], h: pal.accent[0], e: pal.accent[1], d: pal.accent[2] }, -5, 1);
  // the ring, standing at the right
  stamp(['.XXXX.', 'XggheX', 'XeXXeX', 'XedddX', '.XXXX.'], { g: pal.glow[0], h: pal.accent[0], e: pal.accent[1], d: pal.accent[2] }, 4, -1);
  return g;
}
