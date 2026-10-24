// fx-alert base.v2 (r2) — from base.v1. Roster v1: too small (~4 x 8 px) and too thin to read at 1x above a head.
// Changed: the mark is bolder and taller — a 3 px stroke (the overshoot stretches taller) and ~16 px tall instead of 8,
// and frame 1 starts already readable (half height) rather than as a tiny blob. Same pop, overshoot, settle, flash.
export const meta = { brief: 'fx-alert', pass: 'r2', notes: 'drawn mark: pop, overshoot, settle — bold 3 px stroke' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx, Grid } = ctx.lib, g = new Grid(w, h);
  const [hi, body] = fx.colors(['accent']);
  const glint = fx.colors(['glow.0'])[0];
  // per frame: [bar height, bar width, bottom y of the dot]
  const f = Math.min(3, Math.round(ctx.t * 4));
  const keys = [
    { bh: 6, bw: 3, base: 20 },
    { bh: 13, bw: 3, base: 18 },
    { bh: 11, bw: 3, base: 20 },
    { bh: 11, bw: 3, base: 20 },
  ][f];
  const cx = Math.floor(w / 2), x0 = cx - Math.floor(keys.bw / 2);
  const dotH = 3, dotTop = keys.base - dotH + 1, barBottom = dotTop - 2, barTop = barBottom - keys.bh + 1;
  for (let y = barTop; y <= barBottom; y++) {
    const taper = keys.bw >= 4 && y > barBottom - 3 ? 1 : 0; // the wide overshoot bar narrows toward the dot
    for (let x = x0 + taper; x < x0 + keys.bw - taper; x++) g.set(x, y, x === x0 + taper ? hi : body);
  }
  for (let y = dotTop; y < dotTop + dotH; y++) for (let x = x0; x < x0 + Math.min(3, keys.bw); x++) g.set(x, y, x === x0 ? hi : body);
  if (f === 3) { g.set(x0 + 1, barTop + 1, glint); g.set(x0 + 1, barTop + 2, glint); }
  // pop sparks around the mark
  const sp = [[], [[cx - 7, barTop + 1], [cx + 7, barTop + 1], [cx - 6, barTop + 8], [cx + 7, barTop + 8]], [[cx - 7, barTop - 1], [cx + 7, barTop - 1]], []][f];
  for (const [sx, sy] of sp) g.set(sx, sy, glint);
  return fx.line(g);
}
