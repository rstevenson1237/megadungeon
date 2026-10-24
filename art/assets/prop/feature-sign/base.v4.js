// feature-sign base.v4 (x1) — from base.v3, one change, as the blind review asked: the wall-face plaque. The hanging
// cord-and-nail loop (it read as a handbag) is gone; the plaque is now nailed flush to the face, a parallelogram whose
// top and bottom run along the face's true 2:1 slope (the left face rises to the left, the right face to the right),
// 25 % wider (14 px, so 7 px of skew) with two light metal nail heads along its top, and its face clean like finish.v1
// (no grain flecks, only a light left edge on the lit face) with three scratched letter strokes in the darkest wood step, each with a light lower lip so they
// survive at 1x. The cap state and the wood ramp are as base.v3.
// v3 header: feature-sign base.v3 (r3) — from base.v2 (best so far, 6.5). One change, as the v2 review asked: the hanging cord. v2
// drew it in the mid leather step, which is a dark red and read as a magic or blood mark; the cord is now the light
// leather step, a pale tan rope that reads apart from the wood plaque and the metal nail. Everything else is as v2.
// v2 header: feature-sign base.v2 (r2) — from base.v1. One change, the silhouette, as the v1 roster asked (it read as a slanted
// slab: plaque, book or scroll): on the wall faces the plaque now hangs from a nail by a cord, an inverted V above it
// (a light metal nail head, the cord in the mid leather step, both inked), so it reads as a sign hung flat on the face
// plane, not a wedge standing on the floor. Plaque, letters, placement and the cap state are as v1.
// v1 header: a weathered wooden plaque with scratched letters,
// a wall mark in the 32 x 40 wall frame. The wall block is 24 px above the floor diamond (rows 0-16 top, T = 0) and the
// cap 4 px (T = 20), as in terrain-wall. State left: the plaque on the block's lower-left face (lit: wood light edge),
// right: on the lower-right face (the mirror, one step darker), cap: lying flat on the top of the 4 px cap, on the diamond
// centre. Drawn pixel by pixel from the wood ramp and the outline only; only the mark is drawn (the wall is under it).
export const meta = { brief: 'feature-sign', pass: 'x1', notes: 'plaque nailed flush on the face, skewed to the 2:1 slope, 25% wider, three clear letter strokes; no hanging loop', mirror: false };

export const params = {
  wear: { type: 'range', min: 0, max: 0.5, step: 0.05, default: 0.25 },
};

export function render(ctx) {
  const { pal, outline } = ctx.dir, P = ctx.params, [w, h] = ctx.size, { Grid } = ctx.lib, r = ctx.rng;
  const wd = pal.wood, hi = wd[0], mid = wd[Math.min(1, wd.length - 1)], lo = wd[wd.length - 1];
  const g = new Grid(w, h), half = w / 2;
  const state = ctx.state;

  // Plaque in face space: (u, v), u across the face (0..W-1), v down. Rows of scratched letters inside.
  const W = 14, H = 9;
  // three scratched strokes: a dark groove (darkest wood) with a light lower lip (light wood)
  const STROKES = [[3, 3, 6], [3, 8, 10], [6, 3, 8]]; // [v, u from, u to]
  const letters = (u, v) => {
    for (const [sv, a, b] of STROKES) {
      if (v === sv && u >= a && u <= b) return 'groove';
      if (v === sv + 1 && u >= a && u <= b) return 'lip';
    }
    return false;
  };
  const cell = (u, v, shade) => {
    // returns the colour of plaque pixel (u,v), or undefined outside; shade 0 lit, 1 dim
    if (u < 0 || v < 0 || u >= W || v >= H) return undefined;
    const corner = (u === 0 || u === W - 1) && (v === 0 || v === H - 1);
    if (corner) return undefined;
    const edge = u === 0 || v === 0 || u === W - 1 || v === H - 1;
    if (edge) return outline;
    const l = letters(u, v);
    if (l === 'groove') return lo;
    if (l === 'lip') return hi;
    return u === 1 && !shade ? hi : mid; // the lit left face gets a light left edge; the right face stays mid (no flecks)
  };

  if (state === 'cap') {
    // flat on the cap's top diamond (rows 20-36, centre (16, 28)): a plank lying along the diamond's long axis
    const T = h - 16 - Math.max(2, Math.round((h - 16) / 6)), cy = T + 8;
    const L = 15, Wd = 8; // along the NW-SE axis (u) and across it (v), in iso pixels
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const sx = x + 0.5 - half, sy = y + 0.5 - cy;
      const a = sx / 2 + sy, b = sy - sx / 2; // iso axes in px
      // plank spans a in [-L/2, L/2) * 1 and b in [-Wd/2, Wd/2)
      const ia = Math.floor(a + L / 2), ib = Math.floor(b + Wd / 2);
      if (ia < 0 || ib < 0 || ia >= L || ib >= Wd) continue;
      const edge = ia === 0 || ib === 0 || ia === L - 1 || ib === Wd - 1;
      if (edge) { g.set(x, y, outline); continue; }
      if (ib === 1 || ia === 1) { g.set(x, y, hi); continue; }
      if ((ib === 3 || ib === 5) && ia >= 3 && ia <= L - 4 && (ia - 3) % 3 !== 2) { g.set(x, y, lo); continue; }
      g.set(x, y, mid);
    }
    return g;
  }

  const shade = state === 'right' ? 1 : 0;
  const x0 = 1; // plaque spans face x 1..14; face rows v0..v0+H-1 below the block's top edge (y = 8 + x/2)
  const v0 = 7;
  const put = (u, v, c) => {
    const xl = x0 + u, yl = 8 + Math.floor((xl + 0.5) / 2) + v0 + v;
    g.set(state === 'right' ? w - 1 - xl : xl, yl, c);
  };
  const nail = ctx.dir.pal.metal[0];
  for (let v = 0; v < H; v++) for (let u = 0; u < W; u++) {
    let c = cell(u, v, shade);
    if (c === undefined) continue;
    if ((u === 2 || u === W - 3) && v === 1) c = nail; // flush nail heads at the upper corners
    put(u, v, c);
  }
  return g;
}
