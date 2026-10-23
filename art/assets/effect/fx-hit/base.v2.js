// fx-hit base.v2 (r2) — from base.v1. Roster fix: v1's symmetric 8-ray star twinned fx-frost and icon-blessed, so the
// star is gone. Now a lopsided spray of sparks thrown up and to one side from a jagged impact flash, flying out and
// cooling from cream to dark red (red-orange only on the brief hot tips). Frame 0 already shows the flash
// (bigger core than v1), frame 3 keeps thicker falling embers so the fade is not just thin rays.
export const meta = { brief: 'fx-hit', pass: 'r2', notes: 'one-sided spark spray + jagged flash, no star' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx } = ctx.lib, pal = ctx.dir.pal;
  const g = fx.particles([], { w, h, t: ctx.t, duration: 1000 });
  const f = Math.min(3, Math.round(ctx.t * 4));
  const ox = 10, oy = 14;
  const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) g.set(x, y, c); };
  // impact flash: a lopsided jagged blob, shrinking
  const flash = [
    ['..#..', '.###.', '#####', '.####', '..#.#'],
    ['.....', '..#..', '.###.', '..##.', '.....'],
    ['.....', '.....', '..#..', '.....', '.....'],
    null,
  ][f];
  if (flash) flash.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch !== '#') return;
    const edge = (i === 0 || i === 4 || j === 0 || j === 4);
    set(ox - 2 + i, oy - 2 + j, f === 0 && !edge ? pal.glow[0] : f === 0 ? pal.accent[0] : pal.accent[1]);
  }));
  // sparks: straight rays in a lopsided fan (upper right, one low), unequal lengths, flying out and cooling
  const rays = [[100, 1.0], [72, 1.25], [44, 1.1], [18, 1.2], [-14, 0.9], [138, 0.7]];
  const span = [[2, 4], [3, 7], [6, 9], [8, 10]][f];
  for (const [a, k] of rays) {
    const r = a * Math.PI / 180, dx = Math.cos(r), dy = -Math.sin(r);
    const r0 = span[0] * k, r1 = span[1] * k;
    for (let d = r0; d <= r1 + 0.01; d += 0.5) {
      const u = (d - r0) / Math.max(0.5, r1 - r0);
      const c = f === 3 ? (u > 0.5 ? pal.accent[1] : pal.accent[2])
        : u > 0.75 ? pal.glow[0] : u > 0.4 ? pal.accent[0] : pal.accent[1];
      set(ox + dx * d, oy + dy * d + (f === 3 ? 1 : 0), c);
    }
  }
  return fx.line(g);
}
