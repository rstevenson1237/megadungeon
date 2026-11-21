// fx-push base.v3 (x1) — from base.v1 (best, 6.5). Blind re-score: the thick solid crescent with evenly spaced dark
// streaks read as a comb / ribcage, and it barely travelled across the 4 frames.
// Changed: the wave is now a thin 2 px ")" arc (cream leading edge, slate trailing band) with fainter, broken echo
// arcs behind it; it widens and moves 4 px a frame across the frame, and breaks up and fades on f4. The regular
// horizontal streaks are gone.
export const meta = { brief: 'fx-push', pass: 'x1', notes: 'thin travelling shock arc + fading echo arcs' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx, Grid } = ctx.lib, g = new Grid(w, h);
  const [pale, slate] = fx.colors(['cloth']);
  const cream = fx.colors(['glow.0'])[0];
  const f = Math.min(3, Math.round(ctx.t * 4));
  const cy = Math.round(h / 2);
  // per frame: front x, half-height, echo arcs drawn behind (spacing 4 px)
  const k = [
    { x: 7, r: 4, echoes: 0 },
    { x: 11, r: 6, echoes: 1 },
    { x: 15, r: 8, echoes: 2 },
    { x: 19, r: 9, echoes: 1 },
  ][f];
  const lag = (dy, r) => Math.round((dy * dy) / (r * r) * 4); // ends trail behind the middle
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const put = (x, y, c) => { if (inside(x, y)) g.set(x, y, c); };

  // main front: 2 px thick, cream edge + slate band; on f4 it breaks into segments and the edge cools
  for (let dy = -k.r; dy <= k.r; dy++) {
    if (f === 3 && (Math.abs(dy) === 2 || Math.abs(dy) === 6 || Math.abs(dy) === 9)) continue; // gaps: breaking up
    const x = k.x - lag(dy, k.r);
    put(x, cy + dy, f === 3 ? pale : cream);
    put(x - 1, cy + dy, slate);
  }
  // echo arcs: 1 px slate, broken, shorter and fainter the further back
  for (let e = 1; e <= k.echoes; e++) {
    const r = Math.max(3, k.r - 2 * e), ex = k.x - 4 * e - 1;
    for (let dy = -r; dy <= r; dy++) {
      if ((dy + e) % (e + 2) === 0) continue; // dashed: more gaps further back
      put(ex - lag(dy, r), cy + dy, slate);
    }
  }
  return fx.line(g);
}
