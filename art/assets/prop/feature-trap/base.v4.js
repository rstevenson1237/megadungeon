// feature-trap base.v4 (x1) — from base.v1, rebuilt to what the blind reviewer named (v1 read as an eye or gem brooch):
// a slightly raised square metal pressure plate in iso (top lifted 2 px over a 1-2 px side band: left face mid, right
// face dark), its top in metal.0/1 with the lit top-left edges in the lightest step so it stands out from the floor;
// a seam gap (dark inset ring) round the pressing panel; jaw teeth standing up along the two back edges (the
// mechanism); a small 2 x 3 red trigger pin at the centre instead of the big red eye. No corner nubs, no pure-black
// fills (only the direction's outer line is dark). Placement as v1 (floor diamond, centre 16, h - 8).
// Role ramps only (R11): metal, stone, accent, outline.
export const meta = { brief: 'feature-trap', pass: 'x1', notes: 'raised iso pressure plate, seam gap, jaw teeth on two back edges, small red trigger pin', mirror: false };

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size;
  const g = ctx.lib.t2.scene3d({ k: 2 }).render(w, h, { renderer: 'raster', yaw: 45, at: [w / 2, h - 8], shadow: false });
  const cx = w / 2, cy = h - 8, mt = pal.metal, st = pal.stone, ac = pal.accent;
  const RX = 10, RY = 5, LIFT = 2, TY = cy - LIFT;                                   // plate top diamond centre
  const inDia = (x, y, rx, ry, oy) => Math.abs(x + 0.5 - cx) / rx + Math.abs(y + 0.5 - oy) / ry <= 1;
  const each = (fn) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) fn(x, y); };
  // side band: what the lifted top leaves visible of the footprint below it
  each((x, y) => {
    if (!inDia(x, y, RX, RY, cy) || inDia(x, y, RX, RY, TY) || y + 0.5 < TY) return;
    g.set(x, y, x + 0.5 < cx ? mt[2] : st[2]);
  });
  // plate top: mid steel, lit top-left edges in the lightest step, the top-right edge one step down
  each((x, y) => {
    if (!inDia(x, y, RX, RY, TY)) return;
    const back = y + 0.5 < TY && !inDia(x, y - 1, RX, RY, TY);
    g.set(x, y, back && x + 0.5 < cx + 1 ? mt[0] : mt[1]);
  });
  // seam gap: a dark inset ring round the pressing panel, panel lifted to the light step on its far half
  each((x, y) => {
    if (!inDia(x, y, 7, 3.5, TY)) return;
    const rim = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].some(([dx, dy]) => !inDia(x + dx, y + dy, 7, 3.5, TY));
    if (rim) { g.set(x, y, st[2]); return; }
    g.set(x, y, y + 0.5 < TY ? mt[0] : mt[1]);
  });
  // jaw teeth along the two back edges: 3 px points rising off the plate's rim, lit tip, mid root
  const tooth = (x, y) => { g.set(x, y - 3, mt[0]); g.set(x, y - 2, mt[0]); g.set(x, y - 1, mt[1]); };
  for (const t of [0.3, 0.6]) {
    const lx = Math.round(cx - RX + RX * t), ly = Math.round(TY - RY * t);         // top-left edge
    const rx = Math.round(cx + RX - RX * t) - 1, ry = Math.round(TY - RY * t);    // top-right edge
    tooth(lx, ly); tooth(rx, ry);
  }
  tooth(cx - 1, TY - RY + 1);                                                      // back corner
  // trigger pin: 2 x 3 red, lit top-left, shade right and below
  g.set(cx - 1, TY - 2, ac[0]); g.set(cx, TY - 2, ac[1]);
  g.set(cx - 1, TY - 1, ac[1]); g.set(cx, TY - 1, ac[1]);
  g.set(cx - 1, TY, ac[1]); g.set(cx, TY, ac[2]);
  return ctx.lib.fx.line(g);                                                       // the direction's outer line
}
