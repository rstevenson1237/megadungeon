// fx-aura base.v1 (r1) — a ring of motes rising from around a caster
export const meta = { brief: 'fx-aura', pass: 'r1', notes: 'stream-free burst: ring path of rising motes' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx } = ctx.lib, d = ctx.duration, o = { w, h, t: ctx.t, duration: d };
  const ring = Array.from({ length: 9 }, (_, i) => { const a = i / 8 * Math.PI * 2; return [12 + Math.cos(a) * 8, 17 + Math.sin(a) * 4]; });
  return fx.particles([
    { count: 8, mode: 'burst', path: ring, angle: 180, spread: 8, speed: [16, 30], life: d, drag: 0.3, size: [1.8, 0.8], shape: 'diamond', colors: ['accent'], band: [0, 0.7] },
    { count: 5, mode: 'burst', path: ring.slice(1), angle: 180, spread: 8, speed: [24, 38], life: [d * 0.6, d * 0.9], size: [1.4, 0.6], shape: 'pixel', colors: ['glow.0'] },
  ], o);
}
