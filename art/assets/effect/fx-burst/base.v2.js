// fx-burst base.v2 (r2) — from base.v1. The roster found it fine; the review asked for a thicker last frame (v1's
// frame 4 ring was thin and dim). One change: a third, late ring is born just inside the main ring in the second half,
// doubling the rim's width in the last frames so the burst ends on a solid ring. Everything else is unchanged.
export const meta = { brief: 'fx-burst', pass: 'r2', notes: 'late inner ring thickens the final rim' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx } = ctx.lib, D = 1000, c = [w / 2, h / 2];
  const t = 0.24 + ctx.t * 0.5;
  const layers = [
    { origin: c, count: 1, speed: 0, life: D * 0.85, shape: 'ring', size: [5, 10.5], band: [0, 0.8], curve: 1.0, seed: 51 },
    { origin: c, count: 1, speed: 0, delay: D * 0.05, life: D * 0.8, shape: 'ring', size: [2, 8], band: [0, 0.4], seed: 52 },
    { origin: c, count: 1, speed: 0, delay: D * 0.42, life: D * 0.55, shape: 'ring', size: [8, 9.5], band: [0.1, 0.5], seed: 54 },
    { origin: c, count: 10, area: 0.5, angle: 0, spread: 360, speed: [16, 24], drag: 0.5, life: [D * 0.7, D * 0.95], shape: 'pixel', band: [0, 0.6], seed: 53 },
  ];
  return fx.particles(layers, { w, h, t, duration: D });
}
