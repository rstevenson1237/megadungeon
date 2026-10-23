// fx-miss base.v1 (r1) — a puff of dust: separate cloth-ramp puffs kicked up at the cell centre that spread
// sideways and rise, thinning to specks. Cool colours, so it never reads as the hot hit.
export const meta = { brief: 'fx-miss', pass: 'r1', notes: 'dust: 6 separate puffs spreading, then specks' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx } = ctx.lib, D = 1000, c = [w / 2, h * 0.62];
  const t = 0.22 + ctx.t * 0.5;
  const layers = [
    { origin: c, count: 7, area: [1.5, 0.5], angle: 180, spread: 230, speed: [16, 26], drag: 1.6, gravity: -3, life: [D * 0.85, D], size: [2.2, 1.7], band: [0.1, 0.8], colors: ['cloth'], seed: 41 },
    { origin: c, count: 3, area: [1, 0.5], angle: 180, spread: 230, speed: [22, 30], drag: 2.5, life: [D * 0.6, D * 0.9], shape: 'pixel', band: [0.2, 0.7], colors: ['cloth'], seed: 42 },
  ];
  return fx.particles(layers, { w, h, t, duration: D });
}
