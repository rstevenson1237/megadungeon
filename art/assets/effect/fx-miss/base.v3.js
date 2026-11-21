// fx-miss base.v3 (x1) — from base.v2. Blind-review fix: v2's crescent read as a blade swoosh in cold slate that
// vanished on dark floors, not the brief's puff of dust. The arc is gone: the miss is now a rounded dust cloud of three
// overlapping blobs kicked up at the target's feet, lit from the upper left, growing f1-f3 and thinning into broken,
// drifting wisps on f4, with a spray of 1 px grit thrown up and out of its top (2 specks, 3 on f4). Colours: the effect kind may only use
// accent/glow/cloth (the gate refuses stone and dirt), so the dirt tone comes from their two lightest steps: a pale
// tan body (accent 0) with a pale grey lower-right shade (cloth 0). Both are light values, so it reads on dark floors.
export const meta = { brief: 'fx-miss', pass: 'x1', notes: 'dust cloud: 3 overlapping blobs grow f1-f3, break apart f4; grit spray; accent0 body, cloth0 shade' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx } = ctx.lib, P = ctx.dir.pal, R = [P.accent[0], P.cloth[0]];
  const g = fx.particles([], { w, h, t: ctx.t, duration: 1000 });
  const f = Math.min(3, Math.round(ctx.t * 4));
  const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) g.set(x, y, c); };
  const cx = w / 2, base = Math.round(h * 0.68);
  // blobs: [dx, dy, radius per frame], centre blob rises highest; side blobs low and wide (2:1-ish floor puff)
  const blobs = [
    { dx: 0, dy: [-1, -2, -3, -4], r: [2, 3, 4, 4.5] },
    { dx: -1, dy: [0, 0, -1, -2], r: [1.5, 2.5, 3, 3.5], sx: [-1, -3, -5, -6] },
    { dx: 1, dy: [0, 0, -1, -2], r: [1.5, 2.5, 3, 3.5], sx: [1, 3, 5, 6] },
  ];
  const hash = (x, y) => ((x * 73856093) ^ (y * 19349663) ^ 0x5bd1) >>> 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let inside = false, shade = false;
    for (const b of blobs) {
      const bx = cx + b.dx + (b.sx ? b.sx[f] : 0), by = base + b.dy[f], r = b.r[f];
      const ex = (x + 0.5 - bx) / r, ey = (y + 0.5 - by) / (r * 0.85);
      const d = ex * ex + ey * ey;
      if (d <= 1) { inside = true; if (ex + ey > 0.55) shade = true; }
    }
    if (!inside) continue;
    if (f === 3 && hash(x, y) % 5 < 2) continue; // thinning, breaking apart
    set(x, y, shade ? R[1] : R[0]);
  }
  // grit: two 1 px specks thrown up and out of the cloud's top, clear of its outline, then a third on f4
  if (f >= 1) {
    const top = base - 2 - [2, 3, 4, 5][f] - 2;
    set(cx - 3 - f * 2, top + 1 - f, R[0]);
    set(cx + 2 + f * 2, top - f, R[0]);
    if (f === 3) set(cx - 1, top - 4, R[1]);
  }
  return fx.line(g);
}
