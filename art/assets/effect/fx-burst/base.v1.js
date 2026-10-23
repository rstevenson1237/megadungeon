// fx-burst base.v1 (r1) — a ring of fire: a flame-coloured ring grows to the cell's width over the four frames while
// a second, thinner ring chases it and embers are thrown off the rim; the last frame is a thin broken ring. The
// clock starts a little in so frame 0 is already a ring.
export const meta = { brief: 'fx-burst', pass: 'r1', notes: 'two rings + rim embers via particles' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx } = ctx.lib, D = 1000, c = [w / 2, h / 2];
  const t = 0.24 + ctx.t * 0.5;
  const layers = [
    { origin: c, count: 1, speed: 0, life: D * 0.85, shape: 'ring', size: [5, 10.5], band: [0, 0.8], curve: 1.0, seed: 51 },
    { origin: c, count: 1, speed: 0, delay: D * 0.05, life: D * 0.8, shape: 'ring', size: [2, 8], band: [0, 0.4], seed: 52 },
    { origin: c, count: 10, area: 0.5, angle: 0, spread: 360, speed: [16, 24], drag: 0.5, life: [D * 0.7, D * 0.95], shape: 'pixel', band: [0, 0.6], seed: 53 },
  ];
  return fx.particles(layers, { w, h, t, duration: D });
}
