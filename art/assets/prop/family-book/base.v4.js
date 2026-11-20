// family-book base.v4 (x2) — from base.v1 (best, 7); v3's rounded oval read as a pouch. Changed (the wave 1 retry's
// named list): a flat iso slab drawn pixel-exact in 2D (straight 2:1 cover edges and square corners, like the prop
// anchor) in place of the fine-voxel raster model, which rounded the corners; about 13 x 10 px with the outline (v1
// was 16 x 11); the cover top one leather step lighter than its sides (leather.1 top, leather.2 cover rim and back
// board, no pale pink leather.0); one unbroken 1 px cream page band (wood.0) along the two visible sides under the
// cover; a darker spine (leather.2) across the far short end, one pixel in from its lit edge; a small gold clasp on the
// near short end; the red accent boss is gone. Role ramps only (R11).
export const meta = { brief: 'family-book', pass: 'x2', notes: 'flat closed book slab: brown cover, cream page band, dark spine, gold clasp', mirror: false };
// top face of the closed book, one span per row [x0, x1] on an 11 px wide grid: long edges 6 px, short edges 4 px, 2:1
const TOP = [[2, 4], [0, 6], [0, 8], [2, 10], [4, 8], [6, 6]];
export function render(ctx) {
  const [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h, { mode: 'direct' });
  const ox = Math.round(w / 2) - 5, oy = h - 8 - 4; // grid centre on the cell's floor diamond centre (16, h-8)
  const px = (x, y, color, name) => s.add({ type: 'rect', name, x: ox + x, y: oy + y, w: 1, h: 1, color });
  const bottom = []; // lowest top-face row per column
  TOP.forEach(([a, b], y) => { for (let x = a; x <= b; x++) bottom[x] = y; });
  TOP.forEach(([a, b], y) => {
    for (let x = a; x <= b; x++) {
      const spine = x + 2 * y === 5 || x + 2 * y === 6;     // the band across the far short end, inside its lit edge
      const rim = y === bottom[x];                         // the cover's edge on the two near sides
      px(x, y, spine || rim ? 'leather.2' : 'leather.1', spine ? 'spine' : 'cover');
    }
  });
  for (let x = 0; x <= 10; x++) {
    const y = bottom[x] + 1, clasp = x === 7 || x === 8;
    px(x, y, clasp ? 'gold.1' : 'wood.0', clasp ? 'clasp' : 'pages');  // one unbroken page band round both near sides
    px(x, y + 1, 'leather.2', 'back');
  }
  px(7, bottom[7], 'gold.0', 'clasp'); px(8, bottom[8], 'gold.0', 'clasp'); // the clasp's tongue over the cover rim
  return ctx.lib.proc(s).render();
}
