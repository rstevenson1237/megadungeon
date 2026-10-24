// fx-frost base.v1 (r1) — shards of ice thrown out from a pale glint, cooling along the cloth ramp
export const meta = { brief: 'fx-frost', pass: 'r1', notes: 'particle bursts: ice shards + glint' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx } = ctx.lib, d = ctx.duration, o = { w, h, t: ctx.t, duration: d };
  return fx.particles([
    { count: 6, mode: 'burst', angle: 180, spread: 360, speed: [60, 95], life: [d * 0.8, d], drag: 1.2, size: [2.1, 1], shape: 'diamond', colors: ['cloth'], band: [0, 0.5], seed: 3 },
    { count: 5, mode: 'burst', angle: 180, spread: 360, speed: [30, 60], life: [d * 0.6, d * 0.9], drag: 1.5, gravity: 25, size: [1.4, 0.6], shape: 'pixel', colors: ['cloth.0'], seed: 5 },
    { count: 1, mode: 'burst', life: d * 0.45, size: [3, 0.5], shape: 'plus', colors: ['glow.0'] },
  ], o);
}
