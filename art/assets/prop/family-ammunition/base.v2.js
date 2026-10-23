// family-ammunition base.v2 (r2) — from base.v1, changed what the v1 roster and review asked: v1 was one olive bar on
// the shared down-right diagonal, read as a stick. v2 is a sheaf of three arrows fanned through a leather tie: three
// thin shafts crossing at the tie, three bright metal heads spread across the top and three pale fletchings (cloth.0)
// spread across the bottom, so it reads as a bundle of arrows and lies on no diagonal the rod, sword or key use.
// Hand-placed pixels centred on the cell centre (16, 24), a 1 px ink outline traced around every part; the floor
// diamond is not drawn. Ramps and tokens only (R11).
export const meta = { brief: 'family-ammunition', pass: 'r2', notes: 'sheaf of three arrows fanned through a tie: metal heads up, pale fletching down', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir, ink = ctx.dir.outline;
  const g = ctx.lib.t2.scene3d({ k: 2 }).render(w, h, { renderer: 'raster', yaw: 45, pivot: [0, 0, 0], at: [w / 2, h - 8], shadow: false });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g.alpha(x, y) > 0) g.clear(x, y);
  const cx = w >> 1, cy = h - 8; // the cell centre
  const px = new Map(); // "x,y" -> colour, relative to the tie at (cx, cy - 5)
  const put = (x, y, c) => px.set(x + ',' + y, c);
  for (const s of [-1, 0, 1]) {
    const at = (y) => Math.round(-s * y * 0.55); // x of the shaft at row y (y < 0 above the tie)
    for (let y = -8; y <= 6; y++) put(at(y), y, pal.wood[1]);
    // head: a tip pixel and a 3 wide barb row under it
    const hx = at(-9);
    put(hx, -10, pal.metal[0]); put(hx - 1, -9, pal.metal[0]); put(hx, -9, pal.metal[0]); put(hx + 1, -9, pal.metal[1]);
    // fletching: two vanes either side of the shaft's last three rows
    for (let y = 4; y <= 6; y++) { put(at(y) - 1, y, pal.cloth[0]); put(at(y) + 1, y, y === 6 ? pal.cloth[1] : pal.cloth[0]); }
  }
  for (let x = -3; x <= 3; x++) put(x, 0, x < 1 ? pal.leather[0] : pal.leather[1]); // the tie
  const ox = cx, oy = cy - 5;
  for (const k of px.keys()) {
    const [x, y] = k.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!px.has((x + dx) + ',' + (y + dy))) g.set(ox + x + dx, oy + y + dy, ink);
  }
  for (const [k, c] of px) { const [x, y] = k.split(',').map(Number); g.set(ox + x, oy + y, c); }
  return g;
}
