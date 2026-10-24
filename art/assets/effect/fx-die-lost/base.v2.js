// fx-die-lost base.v2 (r2) — from base.v1. Roster v1: the die reads, but as "rolled", not "lost" — add a crack or a
// fade; score note: bolder cream die, a clear downward fall, fewer glow bits.
// Changed: the die is a bolder 9 x 9 cream block (glow.0 face, accent.0 shaded edge, dark cloth pips); a crack
// opens down its middle as it falls, and in the last frame it splits into two dimmer halves; sparks and dashes are gone.
export const meta = { brief: 'fx-die-lost', pass: 'r2', notes: 'drawn die: falls, cracks, splits apart' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx, Grid } = ctx.lib, g = new Grid(w, h);
  const face = fx.colors(['glow.0'])[0];
  const shade = fx.colors(['accent.0'])[0];
  const [, dim, pip] = fx.colors(['cloth']);
  const f = Math.min(3, Math.round(ctx.t * 4));
  const n = 9, top = [2, 6, 10, 13][f], x0 = 7;
  const crack = [[4, 0], [4, 1], [4, 2], [3, 3], [4, 4], [5, 5], [4, 6], [4, 7], [4, 8]]; // zigzag down the middle
  const crackRows = [0, 4, 9, 9][f];
  const pips = [[2, 2], [2, 4], [2, 6], [6, 2], [6, 4], [6, 6]];
  const isCrack = (x, y) => crack.some(([cx, cy]) => cx === x && cy === y && cy < crackRows);
  const leftOf = (x, y) => x < crack[y][0];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (isCrack(x, y)) { if (f < 3) g.set(x0 + x, top + y, pip); continue; }
    let px = x0 + x, py = top + y, c = (y === n - 1 || x === n - 1) ? shade : face;
    if (f === 3) { // split: halves drift apart and drop, dimmed
      const left = leftOf(x, y);
      px += left ? -2 : 2; py += left ? 1 : 3;
      c = (y === n - 1 || x === n - 1 || x === 0) ? dim : shade;
    }
    g.set(px, py, c);
  }
  for (const [px, py] of pips) {
    if (isCrack(px, py)) continue;
    const left = leftOf(px, py);
    g.set(x0 + px + (f === 3 ? (left ? -2 : 2) : 0), top + py + (f === 3 ? (left ? 1 : 3) : 0), pip);
  }
  return fx.line(g);
}
