// feature-trap base.v2 (r2) — from base.v1 (6.5, the best so far). One change, what the v1 roster asked: the trap reads
// as a mechanism, not an eye. The red accent warning mark and its dark pupil are gone (no red: this is no magic), and
// so are v1's three pale spike tips round the rim (the stray pale block at the right). Instead the metal pressure plate
// sits in a dark recessed gap, split down the middle by a hinge seam into two leaves, and a row of spike points pokes
// up through dark holes along each leaf. Slot, stone rim, placement (the cell's floor diamond, centre 16, h - 8) as v1.
// Drawn pixel by pixel so the 1-2 px mechanism parts stay crisp. Role ramps only (R11): metal, stone, outline.
export const meta = { brief: 'feature-trap', pass: 'r2', notes: 'v1 without the red eye: hinged two-leaf plate in a dark recessed gap, spike points through holes', mirror: false };

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, ink = ctx.dir.outline;
  const g = ctx.lib.t2.scene3d({ k: 2 }).render(w, h, { renderer: 'raster', yaw: 45, at: [w / 2, h - 8], shadow: false });
  const cx = w / 2, cy = h - 8, st = pal.stone, mt = pal.metal;
  const inDia = (x, y, rx, ry, oy = 0) => Math.abs(x + 0.5 - cx) / rx + Math.abs(y + 0.5 - cy - oy) / ry <= 1;
  const each = (fn) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) fn(x, y); };
  each((x, y) => {
        if (inDia(x, y, 13, 6.5)) g.set(x, y, y + 0.5 < cy - 2 ? st[0] : st[1]);   // stone rim: its far lip lit, the rest mid
    if (inDia(x, y, 9.5, 4.75)) g.set(x, y, ink);                                  // the dark recessed gap round the plate
  });
  // (the direction's outer line, added last, is the slot cut into the floor)
  // pressure plate, raised a pixel: lit top in the metal mid step (light step on its far, lit edges), dark front faces
  each((x, y) => { if (inDia(x, y, 7, 3.5, 0) && !inDia(x, y, 7, 3.5, -1)) g.set(x, y, mt[mt.length - 1]); });
  each((x, y) => {
    if (!inDia(x, y, 7, 3.5, -1)) return;
    const edge = !inDia(x, y - 1, 7, 3.5, -1);                                // the far rim of the plate
    g.set(x, y, edge && x < cx - 1 ? mt[1] : mt[mt.length - 1]);                 // dark steel, its far-left edge lit
  });
  // hinge seam: the plate is two leaves, split down the middle, a pin at each end
  for (let y = cy - 5; y <= cy + 4; y++) if (inDia(cx - 1, y, 7, 3.5, -1) || inDia(cx - 1, y, 7, 3.5, 0)) g.set(cx - 1, y, ink);
  // spike points through holes, two per leaf: a dark hole with a 2 px steel point standing in it (lit tip, mid
  // shank, its shadow on the right), bright on the dark plate
  for (const [dx, dy] of [[-5, 0], [-3, 2], [2, 0], [4, 2]]) {
    const x = cx + dx, y = cy + dy;
    g.fill(x - 1, y, 3, 1, ink); g.set(x, y - 2, mt[0]); g.set(x, y - 1, mt[1]); g.set(x + 1, y - 1, ink);
  }
  return ctx.lib.fx.line(g);                                                      // the direction's outer line
}
