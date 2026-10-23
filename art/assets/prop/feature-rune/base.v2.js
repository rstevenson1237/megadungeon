// feature-rune base.v2 (r2) — from base.v1. What changed, as the v1 roster asked: the glyph and its light.
// 1. Glyph: no more ring with an X (it read as a 'forbidden' sign or a trap marker and fought feature-trap). The rune is
//    now othala (ᛟ: a square whose two lower sides run on as crossing legs), laid flat with every stroke on a floor axis
//    (clean 2:1 lines), drawn with the same carved stroke style as feature-wall-rune, so the two runes share one style.
// 2. Light: dormant is a carved stone groove first: the stone-light lip stays, the groove is the deep accent step
//    (a dim ember) with the mid accent step only where the legs cross; no glow ramp and no light accent step, so the
//    floor mark is no longer the brightest thing in its row. Spent: the same cut, cold (stone dark).
// Drawn on a Grid: groove, lit lip and a 1 px ink ring round the cut.
// Placement as v1: flat on the cell's bottom diamond, centre (16, h-8), floor undrawn. Role ramps only (R11).
export const meta = { brief: 'feature-rune', pass: 'r2', notes: 'othala rune carved along the floor axes; dormant dim ember groove, joints mid accent; spent dark', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir, g = new ctx.lib.Grid(w, h);
  const dormant = ctx.state !== 'spent', cx = Math.round(w / 2), cy = h - 8;
  const px = (x, y, ramp, band) => g.set(x, y, ramp[Math.min(band, ramp.length - 1)]);
  // floor coords: a runs screen down-right, b down-left (1 unit = 1 px across, 0.5 px down)
  const toScreen = (a, b) => [Math.round(cx + (a - b)), Math.round(cy + (a + b) / 2)];
  // othala (ᛟ): a square laid along the floor axes (it reads as a small diamond) whose two front sides run on past
  // the front corner as crossing legs. Every stroke runs along a floor axis, so each is a clean 2:1 line.
  const A0 = -6, A1 = 1, L = 6; // square a, b in [A0, A1]; legs to A1 + L (all within |a|, |b| <= 8, inside the diamond)
  const segs = [
    [A0, A0, A1, A0], [A0, A0, A0, A1], // back sides
    [A0, A1, A1 + L, A1],               // front-left side, running on as a leg
    [A1, A0, A1, A1 + L],               // front-right side, running on as a leg
  ];
  const joints = [[A1, A1]];
  const seen = new Set(), pts = [];
  const add = ([x, y]) => { const k = x + ',' + y; if (!seen.has(k)) { seen.add(k); pts.push([x, y]); } };
  for (const [a0, b0, a1, b1] of segs) {
    const n = 60;
    for (let i = 0; i <= n; i++) { const t = i / n; add(toScreen(a0 + (a1 - a0) * t, b0 + (b1 - b0) * t)); }
  }
  const jointSet = new Set(joints.map(([a, b]) => toScreen(a, b).join(',')));
  // lip (stone light, 1 px above, lit from up-left), then the groove
  for (const [x, y] of pts) if (!seen.has(x + ',' + (y - 1))) px(x, y - 1, pal.stone, 0);
  for (const [x, y] of pts) {
    if (!dormant) { px(x, y, pal.stone, 2); continue; }
    const j = jointSet.has(x + ',' + y);
    px(x, y, pal.accent, j ? 1 : 2);
  }
  // ink: a 1 px outline ring round the cut (4-neighbours), the direction's line
  const drawn = new Set(); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g.get(x, y)) drawn.add(x + ',' + y);
  for (const k of drawn) { const [x, y] = k.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!drawn.has((x + dx) + ',' + (y + dy)) && g.inb(x + dx, y + dy)) g.set(x + dx, y + dy, ctx.dir.outline); }
  return g;
}
