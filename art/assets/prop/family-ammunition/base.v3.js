// family-ammunition base.v3 (x1) — from base.v2, the approved redo (art/redo.md): v2's sheaf stood upright, fanned
// through a tie. v3 lays the bundle flat along the iso diagonal (2:1, heads up-right, fletching down-left): four
// shafts in two wood shades, bunched where the cord binds them and splayed slightly towards both ends, each with a
// staggered bright-metal head and pale cloth fletching, and the cord as a 1 px light-leather (leather.0) band across
// the middle. Material colours only (wood, metal, cloth, leather), no accent red, so it reads apart from the other
// floor items at 1x. Hand-placed pixels on the cell centre (16, h-8), a 1 px ink outline traced around the whole
// bundle; the floor diamond is not drawn. Ramps and tokens only (R11).
export const meta = { brief: 'family-ammunition', pass: 'x1', notes: 'flat bundle of four arrows on the iso diagonal, splayed ends, light-leather cord band', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir, ink = ctx.dir.outline;
  const g = ctx.lib.t2.scene3d({ k: 2 }).render(w, h, { renderer: 'raster', yaw: 45, pivot: [0, 0, 0], at: [w / 2, h - 8], shadow: false });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g.alpha(x, y) > 0) g.clear(x, y);
  const cx = w >> 1, cy = h - 8; // the cell centre
  const px = new Map(); // "x,y" -> colour, relative to the cord at (cx, cy - 4)
  const put = (x, y, c) => px.set(x + ',' + y, c);
  const L = 9; // half length in screen x
  // four shafts: lane offset at the cord (1 px apart, bunched) grows towards the ends (splay)
  const shafts = [
    { lane: -1.5, head: 0, tail: 0, c: pal.wood[0] },
    { lane: -0.5, head: -1, tail: 1, c: pal.wood[1] },
    { lane: 0.5, head: 1, tail: -1, c: pal.wood[0] },
    { lane: 1.5, head: 0, tail: 0, c: pal.wood[1] },
  ];
  for (const s of shafts) {
    const yAt = (x) => Math.round(-x / 2 + s.lane * (1 + 1.2 * Math.abs(x) / L) - 0.01);
    const x0 = -L + s.tail, x1 = L + s.head;
    for (let x = x0; x <= x1; x++) put(x, yAt(x), s.c);
    // head: a tip beyond the shaft end, flanked by barbs above and below
    const hx = x1 + 1, hy = yAt(x1);
    put(hx, hy, pal.metal[1]); put(hx + 1, hy - 1, pal.metal[0]); put(hx, hy - 1, pal.metal[0]); put(hx - 1, hy + 1, pal.metal[1]);
    // fletching: vanes above and below the last three shaft pixels
    for (let x = x0; x < x0 + 3; x++) { const y = yAt(x); put(x, y - 1, pal.cloth[0]); if (!px.has(x + ',' + (y + 1))) put(x, y + 1, pal.cloth[1]); }
  }
  // the cord: a 1 px light-leather band across the bundle
  const ys = [...px.keys()].map((k) => k.split(',').map(Number)).filter(([x]) => x === 0).map(([, y]) => y);
  for (let y = Math.min(...ys); y <= Math.max(...ys); y++) put(0, y, pal.leather[0]);
  const ox = cx, oy = cy - 4;
  for (const k of px.keys()) {
    const [x, y] = k.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!px.has((x + dx) + ',' + (y + dy))) g.set(ox + x + dx, oy + y + dy, ink);
  }
  for (const [k, c] of px) { const [x, y] = k.split(',').map(Number); g.set(ox + x, oy + y, c); }
  return g;
}
