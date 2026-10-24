// fx-aura base.v2 (r2) — from base.v1. Roster v1: a ring of separate pink beads reads as a necklace (twin of
// family-jewelry); score note: motes should visibly rise and fade in one hue, keep the ring shape.
// Changed: the beads become one soft, unbroken ellipse of glow around the feet that lifts and narrows, with short
// streaks rising from it (a rising curtain of light), all in the glow ramp; no separate beads, no pink.
export const meta = { brief: 'fx-aura', pass: 'r2', notes: 'drawn glow ring at the feet + rising streaks, glow ramp' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx, Grid } = ctx.lib, g = new Grid(w, h);
  const [pale, warm] = fx.colors(['glow']);
  const f = Math.min(3, Math.round(ctx.t * 4));
  // per frame: ring centre y, radii, streak length, streak lift above the ring, ring drawn?
  const k = [
    { cy: 19, rx: 9, ry: 3, len: 2, lift: 0, ring: true },
    { cy: 18, rx: 9, ry: 3, len: 4, lift: 1, ring: true },
    { cy: 16, rx: 8, ry: 3, len: 5, lift: 3, ring: true },
    { cy: 13, rx: 7, ry: 2, len: 3, lift: 6, ring: false },
  ][f];
  const cx = 12;
  if (k.ring) {
    for (let a = 0; a < 64; a++) {
      const t = a / 64 * Math.PI * 2, x = Math.round(cx + Math.cos(t) * k.rx), y = Math.round(k.cy + Math.sin(t) * k.ry);
      g.set(x, y, Math.sin(t) > -0.35 ? pale : warm); // near half and sides bright, far arc warm
    }
  }
  // streaks rising from the sides and the far half of the ring, so they never cross the near half
  for (const [ang, extra] of [[1.0, 0], [1.25, 2], [1.5, 0], [1.75, 2], [2.0, 0]]) {
    const t = ang * Math.PI, x = Math.round(cx + Math.cos(t) * k.rx), y0 = Math.round(k.cy + Math.sin(t) * k.ry) - 3 - k.lift - extra;
    const len = Math.max(1, k.len - (f === 0 ? 0 : extra));
    for (let i = 0; i < len; i++) g.set(x, y0 - i, f === 3 && i === 0 ? warm : pale);
  }
  return fx.line(g);
}
