// fx-alert base.v1 (r1) — an exclamation mark that pops up over a creature: small, overshoots high, settles, flashes.
// Drawn directly on a Grid with the effect ramps (accent for the mark, glow for the glint), outlined by fx.line.
export const meta = { brief: 'fx-alert', pass: 'r1', notes: 'drawn mark: pop, overshoot, settle' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx, Grid } = ctx.lib, g = new Grid(w, h);
  const [hi, body, dark] = fx.colors(['accent']);
  const glint = fx.colors(['glow.0'])[0];
  // per frame: [bar height, bar width, bottom y of the dot, spark]
  const f = Math.min(3, Math.round(ctx.t * 4));
  const keys = [
    { bh: 3, bw: 2, base: 20, spark: 0 },
    { bh: 9, bw: 4, base: 16, spark: 1 },
    { bh: 8, bw: 3, base: 17, spark: 2 },
    { bh: 8, bw: 3, base: 17, spark: 0 },
  ][f];
  const cx = Math.floor(w / 2), x0 = cx - Math.floor(keys.bw / 2);
  const dotH = keys.bw >= 4 ? 3 : 2, dotTop = keys.base - dotH + 1, barBottom = dotTop - 2, barTop = barBottom - keys.bh + 1;
  for (let y = barTop; y <= barBottom; y++) {
    const taper = keys.bw >= 3 && y > barBottom - 2 ? 1 : 0; // the bar narrows toward the dot
    for (let x = x0 + taper; x < x0 + keys.bw - taper; x++) g.set(x, y, x === x0 + taper ? hi : body);
  }
  for (let y = dotTop; y < dotTop + dotH; y++) for (let x = x0; x < x0 + keys.bw; x++) g.set(x, y, x === x0 ? hi : body);
  if (f === 3) { g.set(x0 + 1, barTop + 1, glint); g.set(x0 + 1, barTop + 2, glint); }
  // pop sparks around the mark
  const sp = [[], [[cx - 6, barTop + 1], [cx + 6, barTop + 1], [cx - 5, barTop + 6], [cx + 5, barTop + 6]], [[cx - 6, barTop - 1], [cx + 6, barTop - 1]], []][f];
  for (const [sx, sy] of sp) g.set(sx, sy, glint);
  return fx.line(g);
}
