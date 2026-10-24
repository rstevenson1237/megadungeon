// fx-miss base.v2 (r2) — from base.v1. Roster fix: v1's grey lumps read as rock chips or smoke, so the miss is now a
// whoosh: a pale cloth-ramp crescent swept through the air over the cell (the blow passing through nothing), thick in
// the middle and tapered at both ends, growing along its arc then thinning to a broken tail, with two small dust motes
// kicked off its trailing end. Lighter ramp steps (cloth 0/1) so it reads on dark floors. Cool, curved and open, so it
// never reads as the warm, straight-rayed hit.
export const meta = { brief: 'fx-miss', pass: 'r2', notes: 'whoosh crescent + 2 dust motes, cloth ramp' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx } = ctx.lib, pal = ctx.dir.pal;
  const g = fx.particles([], { w, h, t: ctx.t, duration: 1000 });
  const f = Math.min(3, Math.round(ctx.t * 4));
  const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) g.set(x, y, c); };
  // the arc: centre below the cell centre, flattened 2:1-ish for the iso floor, sweeping left to right over the top
  const cx = 12, cy = 15, rx = 9, ry = 7;
  const A0 = 200, A1 = 340; // degrees, 180 = left, 270 = top (screen up), 360 = right
  // [head, tail] of the visible arc, as fractions of the sweep, per frame
  const [hd, tl] = [[0.5, 0], [0.85, 0], [1, 0.2], [1, 0.55]][f];
  for (let u = tl; u <= hd + 1e-6; u += 0.02) {
    const a = (A0 + (A1 - A0) * u) * Math.PI / 180;
    const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
    const s = (u - tl) / Math.max(0.01, hd - tl);            // 0 at tail, 1 at head
    const thick = s > 0.25 && s < 0.9 ? 2 : 1;
    if (f === 3 && Math.floor(u * 25) % 3 === 0) continue;    // breaking up
    set(x, y, s > 0.6 ? pal.cloth[0] : pal.cloth[1]);
    if (thick === 2) set(x - Math.cos(a), y - Math.sin(a), pal.cloth[1]);
  }
  // dust motes kicked off the trailing end
  if (f >= 2) {
    const k = f - 2;
    set(3 - k, 16 - k, pal.cloth[1]);
    set(6, 19 + k, f === 2 ? pal.cloth[0] : pal.cloth[1]);
  }
  return fx.line(g);
}
