// fx-die-lost base.v1 (r1) — a small six-sided die (six pips) that drops away from a pool: it falls and slips out through the bottom of the frame.
// Drawn directly on a Grid with the effect ramps (cloth for the die, accent for a spark of loss), outlined by fx.line.
export const meta = { brief: 'fx-die-lost', pass: 'r1', notes: 'drawn die: drop out of frame' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx, Grid } = ctx.lib, g = new Grid(w, h);
  const [light, mid, dark] = fx.colors(['cloth']);
  const spark = fx.colors(['accent.0'])[0];
  const f = Math.min(3, Math.round(ctx.t * 4));
  const top = [2, 7, 13, 19][f], x0 = [8, 8, 9, 9][f], n = 8;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const edge = y === n - 1 || x === n - 1; // lit top-left, shaded bottom-right
    g.set(x0 + x, top + y, edge ? mid : light);
  }
  for (const [px, py] of [[1, 1], [1, 3], [1, 5], [5, 1], [5, 3], [5, 5]]) g.set(x0 + px + (f === 2 ? 1 : 0), top + py, dark);
  // motion dashes above the falling die
  if (f > 0) { g.set(x0 + 2, top - 3, mid); g.set(x0 + 5, top - 4, mid); }
  if (f === 0) { g.set(x0 - 3, top + 3, spark); g.set(x0 + n + 2, top + 3, spark); g.set(x0 + 3, top - 3, spark); }
  return fx.line(g);
}
