// feature-sign base.v2 (r2) — from base.v1. One change, the silhouette, as the v1 roster asked (it read as a slanted
// slab: plaque, book or scroll): on the wall faces the plaque now hangs from a nail by a cord, an inverted V above it
// (a light metal nail head, the cord in the mid leather step, both inked), so it reads as a sign hung flat on the face
// plane, not a wedge standing on the floor. Plaque, letters, placement and the cap state are as v1.
// v1 header: a weathered wooden plaque with scratched letters,
// a wall mark in the 32 x 40 wall frame. The wall block is 24 px above the floor diamond (rows 0-16 top, T = 0) and the
// cap 4 px (T = 20), as in terrain-wall. State left: the plaque on the block's lower-left face (lit: wood light edge),
// right: on the lower-right face (the mirror, one step darker), cap: lying flat on the top of the 4 px cap, on the diamond
// centre. Drawn pixel by pixel from the wood ramp and the outline only; only the mark is drawn (the wall is under it).
export const meta = { brief: 'feature-sign', pass: 'r2', notes: 'v1 plaque hung from a nail by a cord (inverted V) on the wall faces; cap as v1', mirror: false };

export const params = {
  wear: { type: 'range', min: 0, max: 0.5, step: 0.05, default: 0.25 },
};

export function render(ctx) {
  const { pal, outline } = ctx.dir, P = ctx.params, [w, h] = ctx.size, { Grid } = ctx.lib, r = ctx.rng;
  const wd = pal.wood, hi = wd[0], mid = wd[Math.min(1, wd.length - 1)], lo = wd[wd.length - 1];
  const g = new Grid(w, h), half = w / 2;
  const state = ctx.state;

  // Plaque in face space: (u, v), u across the face (0..W-1), v down. Rows of scratched letters inside.
  const W = 11, H = 8;
  const letters = (u, v) => {
    // two lines of scratched letters: short dashes with gaps, between the plank's rim and its bottom
    if (v === 2 || v === 5) return u >= 2 && u <= W - 3 && (u - 2) % 3 !== 2;
    if (v === 3 && (u === 3 || u === 6 || u === 8)) return true;
    return false;
  };
  const cell = (u, v, shade) => {
    // returns the colour of plaque pixel (u,v), or undefined outside; shade 0 lit, 1 dim
    if (u < 0 || v < 0 || u >= W || v >= H) return undefined;
    const corner = (u === 0 || u === W - 1) && (v === 0 || v === H - 1);
    if (corner) return undefined;
    const edge = u === 0 || v === 0 || u === W - 1 || v === H - 1;
    if (edge) return outline;
    if (letters(u, v)) return lo;
    const rimLit = u === 1 || v === 1;
    let c = rimLit && !shade ? hi : mid; // the lit left face gets a light rim; the right face stays mid
    if (!rimLit && (u * 7 + v * 13) % 11 < P.wear * 10) c = lo; // weathered grain flecks
    return c;
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
  const x0 = 3; // left face: plaque spans x 3..13, hanging at v 12..19 below the block's top edge
  const v0 = 12;
  const put = (u, v, c) => {
    const xl = x0 + u, yl = 8 + Math.floor((xl + 0.5) / 2) + v0 + v; // left edge line: y = 8 + x/2
    g.set(state === 'right' ? w - 1 - xl : xl, yl, c);
  };
  // the hanger: a nail 4 rows above the plaque's middle, a cord from it to the plaque's top corners (face space)
  const lt = ctx.dir.pal.leather, cord = lt[Math.min(1, lt.length - 1)], mt = ctx.dir.pal.metal;
  const nu = (W - 1) / 2, nv = -5, hang = new Map();
  for (const tu of [1, W - 2]) for (let i = 0; i <= 24; i++) { const t = i / 24; hang.set(Math.round(nu + (tu - nu) * t) + ',' + Math.round(nv * (1 - t)), cord); }
  hang.set(nu + ',' + nv, mt[0]);
  // ink ring round the cord and nail (the plaque's own rim covers the bottom)
  for (const k of hang.keys()) { const [u, v] = k.split(',').map(Number);
    for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!hang.has((u + du) + ',' + (v + dv))) put(u + du, v + dv, outline); }
  for (const [k, c] of hang) { const [u, v] = k.split(',').map(Number); put(u, v, c); }
  for (let v = 0; v < H; v++) for (let u = 0; u < W; u++) {
    const c = cell(u, v, shade);
    if (c === undefined) continue;
    put(u, v, c);
  }
  return g;
}
