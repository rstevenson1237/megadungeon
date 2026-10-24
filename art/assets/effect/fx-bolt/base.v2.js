// fx-bolt base.v2 (r2) — from base.v1. The roster kept the red-orange glow (real magic), but v1 was a near-twin of the
// arrow at 1x (long thin shape with a pointed head), so the silhouette changes: the head is a round 5-row orb instead
// of a pointed lozenge, and the tail is shorter (4-5 px, not 7-9), giving a comet blob rather than a shaft. Colours,
// cold motes and the 1 px-a-frame drift are unchanged.
export const meta = { brief: 'fx-bolt', pass: 'r2', notes: 'round orb head, shorter tail (comet, not shaft)' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx } = ctx.lib, pal = ctx.dir.pal;
  const g = fx.particles([], { w, h, t: ctx.t, duration: 1000 });
  const f = Math.round(ctx.t * 4), ox = f - 2, cy = 12;
  const px = (x, y, c) => g.set(x + ox, y, c);
  // tail: a taper of accent colours, longer on even frames
  const tl = f % 2 ? 4 : 5;
  for (let i = 0; i < tl; i++) {
    const x = 12 - i, half = i < 3 ? 1 : 0;
    const c = i < 2 ? pal.glow[1] : i < 5 ? pal.accent[1] : pal.accent[2];
    for (let y = -half; y <= half; y++) px(x, cy + y, c);
  }
  // head: a round orb, 5 rows tall and 5 long
  for (let x = 13; x <= 17; x++) {
    const half = x === 13 || x === 17 ? 1 : 2;
    for (let y = -half; y <= half; y++) px(x, cy + y, Math.abs(y) === half && half > 0 ? pal.glow[1] : pal.glow[0]);
  }
  // cold motes circling the head
  const m = [[14, -4], [17, 4], [15, 4], [18, -4]];
  px(m[f][0], cy + m[f][1], pal.cloth[0]);
  px(m[(f + 2) % 4][0], cy + m[(f + 2) % 4][1], pal.cloth[1]);
  return fx.line(g);
}
