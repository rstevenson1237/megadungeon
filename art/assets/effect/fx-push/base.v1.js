// fx-push base.v1 (r1) — a curved shock wave sweeping outward, with dust streaks trailing it
export const meta = { brief: 'fx-push', pass: 'r1', notes: 'particle bursts: arc of shock motes + streaks' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx } = ctx.lib, d = ctx.duration, o = { w, h, t: ctx.t, duration: d };
  const arc = Array.from({ length: 7 }, (_, i) => { const a = (-66 + i * 22) * Math.PI / 180; return [5 + Math.cos(a) * 5, 12 + Math.sin(a) * 9]; });
  return fx.particles([
    { count: 7, mode: 'burst', path: arc, angle: 90, spread: 0, speed: [40, 40], life: d, drag: 0.6, size: [2.2, 1.2], shape: 'diamond', colors: ['cloth.0', 'glow.0'], band: [0, 1] },
    { count: 3, mode: 'burst', path: [arc[1], arc[3], arc[5]], angle: 90, spread: 0, speed: [30, 30], life: d * 0.8, size: [2, 1], shape: 'streak', streak: 0.12, colors: ['cloth.1'] },
  ], o);
}
