// feature-altar base.v6 (x1, redo wave 2) — from base.v3 (6; blind re-score 5.5: "reads as a squat stone cube/crate ...
// no overhanging mensa slab, no recessed pedestal, the brown-red patch reads as rust ... silhouette is a rounded hexagon
// blob ... widen and lower into a long slab, a clear draped runner with a hanging fold on the front face, offerings small
// candles/bowl rather than square blocks"). The approved redo, one revision that changes what the fix names:
// (1) shape: a long, low altar, wider than deep (body 14 x 8 units, 1 px per unit, painted in the 2:1 projection as v5 is,
//     since v3's 2-px voxels could not hold a step): a solid body with straight sides (no waist: v4 read as a crate, v5's
//     waist as an anvil) under a 3-px mensa slab that overhangs it by 1 unit with a dark shadow line beneath, on a 2-px plinth step as wide as the slab;
// (2) cloth: a red altar cloth (accent ramp, not the leather that read as rust) laid over the front edge of the top only
//     and hanging straight down the long front face, with one fold and a gold fringe at its hem — not wrapped like a ribbon;
// (3) offered: two candles 2 px wide and 4 px tall (pale wax, lit side and shaded side) at the slab's back corners, each
//     with a 2-px flame on top (glow, the bright step uppermost), and a small metal bowl between them on the bare stone.
// Placement: the footprint is centred on the floor diamond's centre, (16, h - 8). Role ramps from ctx.dir.pal only (R11);
// the outline is the direction's line pass.
// base.v3 notes: stepped body (dark plinth, set-back block, overhanging slab top); leather cloth; two lit candles when offered.
export const meta = { brief: 'feature-altar', pass: 'x1', notes: 'long low altar: straight-sided body, mensa slab joint and lip, plinth step; red cloth over the front edge with fold and gold fringe; two 2-px candles and a bowl when offered', mirror: false };

export const params = {
  body: { type: 'swap', options: ['stone'], default: 'stone' },
};

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir, P = ctx.params, offered = ctx.state === 'offered';
  const g = new ctx.lib.Grid(w, h), CX = w / 2, CY = h - 8;
  const S = pal[P.body], DK = pal.dirt, C = pal.accent, L = pal.leather, Wd = pal.wood, M = pal.metal, G = pal.glow, Au = pal.gold;
  const sx = (X, Y) => CX + X - Y, sy = (X, Y, Z) => CY + (X + Y) / 2 - Z;
  const inPoly = (pts, x, y) => {
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
  const box = (x0, x1, y0, y1, z0, z1, top, left, right) => {
    fill([P3(x1, y1, z1), P3(x1, y1, z0), P3(x0, y1, z0), P3(x0, y1, z1)], left);   // +Y face: the long front, lit
    fill([P3(x1, y0, z1), P3(x1, y0, z0), P3(x1, y1, z0), P3(x1, y1, z1)], right);  // +X face: the short end, shaded
    fill([P3(x0, y0, z1), P3(x1, y0, z1), P3(x1, y1, z1), P3(x0, y1, z1)], top);
  };
  const ZP = 2, ZJ = 9, ZT = 12;                 // plinth top, slab underside, slab top (12 px + the top face's depth)
  const X0 = -7, X1 = 7, Y0 = -4, Y1 = 4;        // the body; the slab and the plinth step stand 1 unit out from it
  box(X0 - 1, X1 + 1, Y0 - 1, Y1 + 1, 0, ZP, S[0], DK[0], S[2]);  // plinth step, its lit tread showing
  box(X0, X1, Y0, Y1, ZP, ZJ, S[1], S[1], DK[1]);                  // the straight-sided body
  // the shadow the slab casts on the body: one dark line under the lip on both faces we see
  fill([P3(X1, Y1, ZJ), P3(X1, Y1, ZJ - 1), P3(X0, Y1, ZJ - 1), P3(X0, Y1, ZJ)], DK[2]);
  fill([P3(X1, Y0, ZJ), P3(X1, Y0, ZJ - 1), P3(X1, Y1, ZJ - 1), P3(X1, Y1, ZJ)], S[2]);
  box(X0 - 1, X1 + 1, Y0 - 1, Y1 + 1, ZJ, ZT, S[0], S[1], DK[1]);  // the mensa slab
  // the cloth: over the front edge of the top, then straight down the long front face to just above the plinth
  const R0 = -4, R1 = 3, FY = Y1 + 1, HEM = ZP + 2;
  fill([P3(R0, 1, ZT), P3(R1, 1, ZT), P3(R1, FY, ZT), P3(R0, FY, ZT)], C[1]);
  fill([P3(R1, FY, ZT), P3(R1, FY, HEM), P3(R0, FY, HEM), P3(R0, FY, ZT)], (x) => {
    const u = x + 0.5 - sx(R0, FY);              // 0..7 across the hanging cloth
    return u > 3 && u < 4 ? L[2] : C[2];         // one fold down its middle
  });
  for (let X = R0; X < R1; X++) {                // gold fringe at the hem, its tassels in the dark step
    const x = Math.floor(sx(X + 0.5, FY)), y = Math.floor(sy(X + 0.5, FY, HEM) - 0.5);
    g.set(x, y + 1, Au[1]);
    if ((X - R0) % 2 === 0) g.set(x, y + 1, Au[2]);
  }
  if (offered) {
    for (const [X, Y] of [[X0, Y0], [X1, Y0]]) {   // the slab's two back corners
      const x = Math.floor(sx(X, Y)), y = Math.floor(sy(X, Y, ZT));
      for (let k = 0; k < 4; k++) { g.set(x, y - k, Wd[0]); g.set(x + 1, y - k, Wd[1]); }
      g.set(x, y - 4, G[1]); g.set(x, y - 5, G[0]);                       // the flame, its bright tip on top
    }
    const bx = Math.floor(sx(0, Y0)), by = Math.floor(sy(0, Y0, ZT));   // a small bowl between them
    for (let i = -2; i < 2; i++) g.set(bx + i, by - 1, M[1]);
    g.set(bx - 1, by - 1, M[2]); g.set(bx, by - 1, M[2]);   // its dark hollow
    g.set(bx - 1, by, M[1]); g.set(bx, by, M[2]);
  }
  return ctx.lib.line(g);
}
