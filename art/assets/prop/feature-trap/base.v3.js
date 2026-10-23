// feature-trap base.v3 (r3) — from base.v1 (6.5, the best so far), keeping base.v2's hinged two-leaf plate (the
// roster's "plate seam and a hint of mechanism") but bringing back v1's contrast, which v2 lost (it read as a dark
// drain grate at 1x). One change, what the v2 review asked: contrast. The stone rim is lighter (its far lip and sides
// in the lightest stone step, only the front lip mid); the plate sits in a deeper, wider dark gap; the plate itself is
// mid steel, not dark; steel spike points stand in the gap at the back and both corners with tips in the lightest
// metal step, tall enough to stick up past the rim's edge; and a small warm rust stud (the trigger) sits off-centre on
// the right leaf — no centred red eye. No stray pixel right of the plate. Placement as v1 (floor diamond, centre 16, h - 8).
// Role ramps only (R11): metal, stone, accent, outline.
export const meta = { brief: 'feature-trap', pass: 'r3', notes: 'v1 contrast + v2 hinged plate: light rim, deep gap, bright spike tips past the rim, small warm trigger stud', mirror: false };

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, ink = ctx.dir.outline;
  const g = ctx.lib.t2.scene3d({ k: 2 }).render(w, h, { renderer: 'raster', yaw: 45, at: [w / 2, h - 8], shadow: false });
  const cx = w / 2, cy = h - 8, st = pal.stone, mt = pal.metal, ac = pal.accent;
  const inDia = (x, y, rx, ry, oy = 0) => Math.abs(x + 0.5 - cx) / rx + Math.abs(y + 0.5 - cy - oy) / ry <= 1;
  const each = (fn) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) fn(x, y); };
  // stone rim, lighter than v2: lit far lip and sides, mid front lip; then the deep dark gap round the plate
  each((x, y) => {
    if (inDia(x, y, 13, 6.5)) g.set(x, y, y + 0.5 < cy + 2 ? st[0] : st[1]);
    if (inDia(x, y, 10, 5)) g.set(x, y, ink);
  });
  // pressure plate, raised a pixel and smaller than v2 so the gap reads deeper: mid steel top, lit far-left edge,
  // dark front face
  each((x, y) => { if (inDia(x, y, 6.5, 3.25, 0) && !inDia(x, y, 6.5, 3.25, -1)) g.set(x, y, mt[2]); });
  each((x, y) => {
    if (!inDia(x, y, 6.5, 3.25, -1)) return;
    const edge = !inDia(x, y - 1, 6.5, 3.25, -1);
    g.set(x, y, edge && x < cx ? mt[0] : mt[1]);
  });
  // hinge seam: two leaves split down the middle
  for (let y = cy - 5; y <= cy + 4; y++) if (inDia(cx - 1, y, 6.5, 3.25, -1) || inDia(cx - 1, y, 6.5, 3.25, 0)) g.set(cx - 1, y, ink);
  // a hole in the left leaf (a hint of the mechanism)
  g.set(cx - 4, cy - 1, ink); g.set(cx - 3, cy - 1, ink);
  // the trigger: a small warm rust stud on the right leaf, off-centre
  g.set(cx + 2, cy - 1, ac[1]); g.set(cx + 3, cy - 1, ac[2]); g.set(cx + 2, cy, ac[2]);
  // spike points standing in the gap: lightest-step tip, mid shank, dark right side; tall enough that the tips
  // stand above the rim's edge
  const spike = (x, base, tall) => {
    g.set(x, base - tall, mt[0]);
    for (let y = base - tall + 1; y <= base; y++) { g.set(x, y, y < base - tall + 2 ? mt[0] : mt[1]); g.set(x + 1, y, mt[2]); }
  };
  for (const [dx, dy, tall] of [[-9, 0, 4], [8, 0, 4], [-4, -3, 5], [-1, -4, 6], [2, -4, 5]]) spike(cx + dx, cy + dy, tall);
  return ctx.lib.fx.line(g);                                                      // the direction's outer line
}
