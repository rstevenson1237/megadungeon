// fx-push base.v2 (r2) — from base.v1. Roster v1: too tall (~21 px) and a vertical wavy crescent that reads as a
// feather or fish; score note: clean arc, wider travel between frames, drop the ticks inside.
// Changed: one clean ")" shock-wave arc, ~13 px tall, that travels right across the frame with wide spacing,
// trailed by three horizontal motion lines in the push direction; the hatching ticks are gone.
export const meta = { brief: 'fx-push', pass: 'r2', notes: 'drawn shock arc + motion lines, travelling right' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx, Grid } = ctx.lib, g = new Grid(w, h);
  const [lit, mid] = fx.colors(['cloth']);
  const edge = fx.colors(['glow.0'])[0];
  const f = Math.min(3, Math.round(ctx.t * 4));
  // per frame: arc front x, arc half-height, motion-line length, arc thickness
  const k = [
    { x: 9, r: 4, len: 3, th: 2 },
    { x: 14, r: 6, len: 5, th: 2 },
    { x: 19, r: 6, len: 6, th: 2 },
    { x: 22, r: 5, len: 3, th: 1 },
  ][f];
  const cy = 12;
  const bulge = (dy) => Math.round((dy * dy) / (k.r * k.r) * 3); // how far the arc's ends lag behind its middle
  for (let dy = -k.r; dy <= k.r; dy++) {
    const fx0 = k.x - bulge(dy);
    for (let t = 0; t < k.th; t++) g.set(fx0 - t, cy + dy, t === 0 ? (f < 3 ? edge : lit) : lit);
  }
  // motion lines behind the arc, in the push direction
  for (const dy of [-4, 0, 4]) {
    const end = k.x - bulge(dy) - k.th - 3, len = dy === 0 ? k.len : k.len - 2;
    for (let i = 0; i < len; i++) g.set(end - i, cy + dy, f === 3 ? mid : (i < 2 ? lit : mid));
  }
  return fx.line(g);
}
