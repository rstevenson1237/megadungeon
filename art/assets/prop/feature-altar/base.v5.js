// feature-altar base.v5 (x2) — from base.v3 (6; blind re-score 5.5: "reads as a squat stone cube/crate ... no overhanging
// mensa slab, no recessed pedestal, the brown-red patch reads as rust ... offerings should be small candles/bowl"). One
// change, the blind reviewer's point: the silhouette. The 2-px voxel model could not make an overhang read (v1 anvil,
// v2-v3 crate, v4 long sarcophagus), so the altar is now painted pixel by pixel in the same 2:1 projection: a thick top
// slab (16 x 10 px, about 1.6 : 1, 4 px thick) overhanging a recessed body by 2 px on both visible faces, with a dark
// shadow band (stone's darkest step) under the overhang on each face, standing on a wider plinth step. The cloth is a
// warm runner (accent's darkest step, folds in leather's darkest) laid across the slab and hanging over the long front
// edge below the slab, in front of the recessed body. Offered: two 1-px pale wax stems with one bright glow flame pixel
// each, and a small dark metal bowl on the bare stone between them. Placement is v3's: the footprint is centred on the floor diamond's
// centre, (16, h - 8). Role ramps from ctx.dir.pal only (R11); the outline is the direction's line pass.
// base.v3 notes follow.
// feature-altar base.v3 (r3) — from base.v2: stepped body (dark plinth, set-back block, overhanging slab top); leather
// cloth; two lit candles when offered.
export const meta = { brief: 'feature-altar', pass: 'x2', notes: 'pixel-painted: thick overhanging slab, shadowed recessed body, plinth step; warm cloth over the front edge; candle stems + bowl when offered', mirror: false };

export const params = {
  body: { type: 'swap', options: ['stone'], default: 'stone' },
};

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir, P = ctx.params, offered = ctx.state === 'offered';
  const g = new ctx.lib.Grid(w, h), CX = w / 2, CY = h - 8;
  const S = pal[P.body], DK = pal.dirt, C = pal.accent, L = pal.leather, Wd = pal.wood, M = pal.metal, G = pal.glow;
  // model (X down-right, Y down-left, Z up; 1 px per unit) to screen
  const sx = (X, Y) => CX + X - Y, sy = (X, Y, Z) => CY + (X + Y) / 2 - Z;
  const inPoly = (pts, x, y) => {             // pixel centre inside a convex polygon (either winding)
    let pos = 0, neg = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
      const c = (x1 - x0) * (y - y0) - (y1 - y0) * (x - x0);
      if (c > 1e-9) pos++; else if (c < -1e-9) neg++;
    }
    return !(pos && neg);
  };
  const fill = (pts, col) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = typeof col === 'function' ? col(x, y) : col;
      if (c && inPoly(pts, x + 0.5, y + 0.5)) g.set(x, y, c);
    }
  };
  const P3 = (X, Y, Z) => [sx(X, Y), sy(X, Y, Z)];
  // a box: top, the +Y face (lower left, mid) and the +X face (lower right, dark); `band` px of shadow under an overhang
  const box = (x0, x1, y0, y1, z0, z1, top, left, right, band = 0, bandCol) => {
    fill([P3(x1, y1, z1), P3(x1, y1, z0), P3(x0, y1, z0), P3(x0, y1, z1)], left);
    fill([P3(x1, y0, z1), P3(x1, y0, z0), P3(x1, y1, z0), P3(x1, y1, z1)], right);
    fill([P3(x0, y0, z1), P3(x1, y0, z1), P3(x1, y1, z1), P3(x0, y1, z1)], top);
    if (band) {
      fill([P3(x1, y1, z1), P3(x1, y1, z1 - band), P3(x0, y1, z1 - band), P3(x0, y1, z1)], bandCol[0]);
      fill([P3(x1, y0, z1), P3(x1, y0, z1 - band), P3(x1, y1, z1 - band), P3(x1, y1, z1)], bandCol[1]);
    }
  };
  const ZB = 3, ZS = 11, ZT = 15;               // plinth top, slab underside, slab top (15 px: 0.94 m + candles)
  box(-7, 7, -4, 4, 0, ZB, S[1], S[1], DK[1]);                           // plinth step
  box(-6, 6, -3, 3, ZB, ZS, S[1], DK[0], DK[2], 4, [S[2], ctx.dir.outline]); // recessed body: 2 px hide under the slab, 2 px of shadow show
  box(-8, 8, -5, 5, ZS, ZT, S[0], S[1], DK[1]);                          // the thick mensa slab
  // the cloth: across the slab top, over the long front edge, hanging free below it in front of the body
  const R0 = -2, R1 = 2;
  fill([P3(R0, -5, ZT), P3(R1, -5, ZT), P3(R1, 5, ZT), P3(R0, 5, ZT)], C[2]);
  fill([P3(R1, 5, ZT), P3(R1, 5, ZS - 3), P3(R0, 5, ZS - 3), P3(R0, 5, ZT)], (x, y) => {
    const u = x + 0.5 - sx(R0, 5);                                      // 0..4 across the hanging cloth
    return u > 1.4 && u < 2.6 && y + 0.5 > sy(0, 5, ZS) - 1 ? L[2] : C[2];  // one fold down its middle
  });
  for (const X of [R0, R1 - 1]) {                                       // a ragged hem: the two hanging corners drop 1 px
    const x = Math.floor(sx(X, 5) + 0.5), y = Math.floor(sy(X + 0.5, 5, ZS - 3) + 0.5);
    g.set(x, y, C[2]);
  }
  if (offered) {
    for (const X of [-6, 5]) {                                          // candles near the slab's ends, on its back half
      const x = Math.floor(sx(X, -2)), y = Math.floor(sy(X, -2, ZT));
      for (let k = 1; k <= 3; k++) g.set(x, y - k, Wd[0]);              // 1-px wax stem
      g.set(x, y - 4, G[G.length - 1]);                                 // one bright flame pixel
    }
    const bx = Math.floor(sx(4, 0)), by = Math.floor(sy(4, 0, ZT));     // a small dark bowl on the bare stone, right of the cloth
    g.set(bx - 1, by - 1, M[1]); g.set(bx, by - 1, M[2]); g.set(bx + 1, by - 1, M[1]);
    g.set(bx - 1, by, M[2]); g.set(bx, by, M[2]); g.set(bx + 1, by, M[2]);
  }
  return ctx.lib.line(g);
}
