// fx-frost base.v2 (r2) — from base.v1. Roster v1: too small (~9 px) and a four-point star (twin of fx-hit / icon-blessed).
// Changed: the burst of dots is replaced by a cluster of angular ice crystals that grows up from the floor to ~17 px,
// glints, then shatters into falling shards — a jagged crystal silhouette, not a star. Cloth ramp (cold) + glow glint.
export const meta = { brief: 'fx-frost', pass: 'r2', notes: 'drawn ice-crystal cluster: grow, glint, shatter' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx, Grid } = ctx.lib, g = new Grid(w, h);
  const [lit, mid, dark] = fx.colors(['cloth']);
  const glint = fx.colors(['glow.0'])[0];
  const f = Math.min(3, Math.round(ctx.t * 4));
  const base = h - 3;
  // crystals: base x, height, half-width, lean (tip offset per row from the base); back ones first
  const crystals = [
    { x: 4, ht: 6, hw: 1, lean: -0.5 },
    { x: 20, ht: 7, hw: 1, lean: 0.5 },
    { x: 8, ht: 12, hw: 2, lean: -0.3 },
    { x: 16, ht: 11, hw: 2, lean: 0.3 },
    { x: 12, ht: 17, hw: 3, lean: 0 },
  ];
  const grow = [0.45, 1, 1][f];
  const draw = (c, ht, by, edgeGlint) => {
    for (let i = 0; i < ht; i++) { // i = 0 at the tip
      const half = Math.min(c.hw, i), cx = Math.round(c.x + c.lean * (ht - 1 - i)), y = by - ht + 1 + i;
      for (let x = cx - half; x <= cx + half; x++) g.set(x, y, x < cx ? lit : x === cx ? (edgeGlint && i < ht - 2 ? glint : lit) : mid);
    }
  };
  if (f < 3) {
    for (const c of crystals) draw(c, Math.max(2, Math.round(c.ht * grow)), base, f === 2 && c.ht > 10);
    if (f === 2) { g.set(12, base - 18, glint); g.set(11, base - 17, glint); g.set(13, base - 17, glint); }
  } else {
    // shattered: stubs on the floor and shards flying out and down
    for (const c of crystals) draw({ ...c, lean: 0 }, Math.max(2, Math.round(c.ht * 0.25)), base, false);
    const shards = [[3, 9, -1], [8, 4, -1], [16, 5, 1], [21, 10, 1], [12, 2, 0], [6, 14, -1], [18, 15, 1]];
    for (const [sx, sy, dir] of shards) { g.set(sx, sy, lit); g.set(sx + dir, sy + 1, mid); g.set(sx, sy + 1, dark); }
  }
  return fx.line(g);
}
