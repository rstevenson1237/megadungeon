// fx-arrow base.v2 (r2) — from base.v1. Roster fix: the two speed streaks above and below the shaft read as debris or
// a second arrow, so they are gone; and the blunt 3-row block head is now a sharp barbed point (a 5-row triangle
// tapering to a 1 px tip). Shaft, red fletching and the 1 px-a-frame drift are unchanged.
export const meta = { brief: 'fx-arrow', pass: 'r2', notes: 'no streaks, sharp barbed head' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx } = ctx.lib, pal = ctx.dir.pal;
  const g = fx.particles([], { w, h, t: ctx.t, duration: 1000 });
  const f = Math.round(ctx.t * 4), ox = f - 2, cy = 12;
  const px = (x, y, c) => g.set(x + ox, y, c);
  // shaft
  for (let x = 6; x <= 16; x++) px(x, cy, pal.cloth[0]);
  // head: a barbed triangle, 5 rows at its back edge, tapering to a 1 px point
  for (let x = 15; x <= 20; x++) {
    const half = x <= 16 ? 2 : x <= 18 ? 1 : 0;
    for (let y = -half; y <= half; y++) px(x, cy + y, y > 0 ? pal.cloth[1] : pal.cloth[0]);
  }
  // fletching: two swept feathers, red
  const fc = f % 2 ? pal.accent[0] : pal.accent[1];
  px(5, cy - 1, pal.accent[1]); px(6, cy - 2, fc); px(4, cy - 2, pal.accent[1]);
  px(5, cy + 1, pal.accent[2]); px(6, cy + 2, pal.accent[1]); px(4, cy + 2, pal.accent[2]);
  return fx.line(g);
}
