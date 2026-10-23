// fx-hit base.v1 (r1) — a star of sparks: a hot flash that shrinks while eight rays (long on the axes, short on the
// diagonals) fly out from it and cool. The simulation clock starts a little in so frame 0 already shows a star.
export const meta = { brief: 'fx-hit', pass: 'r1', notes: 'sparks star: flash + 8 explicit rays' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx } = ctx.lib, D = 1000, c = [w / 2, h / 2];
  const t = 0.2 + ctx.t * 0.58;
  const layers = [{ origin: c, count: 1, speed: 0, life: D * 0.6, size: [4, 1], band: [0, 0.35] }];
  for (let i = 0; i < 8; i++) {
    const axis = i % 2 === 0;
    layers.push({
      origin: c, count: 1, area: 0, angle: 90 + i * 45, spread: 0, speed: axis ? 15 : 11, drag: 0,
      life: D * 0.9, shape: 'streak', streak: axis ? 0.26 : 0.2, band: [0, 0.7], curve: 1.0, seed: 30 + i,
    });
  }
  return fx.particles(layers, { w, h, t, duration: D });
}
