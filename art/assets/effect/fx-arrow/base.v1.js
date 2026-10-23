// fx-arrow base.v1 (r1) — an arrow in flight, pointing to screen right: pale cloth shaft and head, red accent
// fletching, and two cold speed streaks beside it that change length each frame. The arrow drifts 1 px a frame
// (the game moves it across cells). Drawn point-by-point, outlined by the line pass.
export const meta = { brief: 'fx-arrow', pass: 'r1', notes: 'direct-drawn arrow, fletching, two streaks' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx } = ctx.lib, pal = ctx.dir.pal;
  const g = fx.particles([], { w, h, t: ctx.t, duration: 1000 });
  const f = Math.round(ctx.t * 4), ox = f - 2, cy = 12;
  const px = (x, y, c) => g.set(x + ox, y, c);
  // speed streaks above and below, alternating length
  const lens = [[7, 3], [4, 6], [8, 2], [5, 5]][f];
  for (let x = 0; x < lens[0]; x++) g.set(2 + x, cy - 5, x > lens[0] - 3 ? pal.cloth[0] : pal.cloth[1]);
  for (let x = 0; x < lens[1]; x++) g.set(4 + x, cy + 5, x > lens[1] - 3 ? pal.cloth[0] : pal.cloth[1]);
  // shaft
  for (let x = 6; x <= 16; x++) px(x, cy, pal.cloth[0]);
  // head: widens to 3 rows then a point
  for (let y = -1; y <= 1; y++) px(17, cy + y, y === 1 ? pal.cloth[1] : pal.cloth[0]);
  for (let y = -1; y <= 1; y++) px(18, cy + y, y === 1 ? pal.cloth[1] : pal.cloth[0]);
  px(19, cy, pal.cloth[0]); px(20, cy, pal.cloth[0]);
  // fletching: two swept feathers, red
  const fc = f % 2 ? pal.accent[0] : pal.accent[1];
  px(5, cy - 1, pal.accent[1]); px(6, cy - 2, fc); px(4, cy - 2, pal.accent[1]);
  px(5, cy + 1, pal.accent[2]); px(6, cy + 2, pal.accent[1]); px(4, cy + 2, pal.accent[2]);
  return fx.line(g);
}
