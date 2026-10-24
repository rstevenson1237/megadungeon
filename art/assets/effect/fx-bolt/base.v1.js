// fx-bolt base.v1 (r1) — an arcane dart, pointing to screen right: a pale glowing lozenge head with a red-orange
// tapering tail and two cold (cloth) motes that orbit it, so it reads as magic, not as the arrow. The head pulses 1 px
// per frame. Drawn point-by-point, outlined by the line pass.
export const meta = { brief: 'fx-bolt', pass: 'r1', notes: 'direct-drawn lozenge dart, tapered tail, cold motes' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx } = ctx.lib, pal = ctx.dir.pal;
  const g = fx.particles([], { w, h, t: ctx.t, duration: 1000 });
  const f = Math.round(ctx.t * 4), ox = f - 2, cy = 12;
  const px = (x, y, c) => g.set(x + ox, y, c);
  // tail: a taper of accent colours, longer on even frames
  const tl = f % 2 ? 7 : 9;
  for (let i = 0; i < tl; i++) {
    const x = 12 - i, half = i < 3 ? 1 : 0;
    const c = i < 2 ? pal.glow[1] : i < 5 ? pal.accent[1] : pal.accent[2];
    for (let y = -half; y <= half; y++) px(x, cy + y, c);
  }
  // head: lozenge, 3 rows tall, 7 long, pointed
  for (let x = 13; x <= 19; x++) {
    const half = x < 15 ? 1 : x < 18 ? 2 : x < 19 ? 1 : 0;
    for (let y = -half; y <= half; y++) px(x, cy + y, Math.abs(y) === half && half > 0 ? pal.glow[1] : pal.glow[0]);
  }
  // cold motes circling the head
  const m = [[14, -4], [17, 4], [15, 4], [18, -4]];
  px(m[f][0], cy + m[f][1], pal.cloth[0]);
  px(m[(f + 2) % 4][0], cy + m[(f + 2) % 4][1], pal.cloth[1]);
  return fx.line(g);
}
