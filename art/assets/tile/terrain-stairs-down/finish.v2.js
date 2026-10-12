// finish.v2 (f) on base.v4 — the one direct-pixel pass (R2), doing what review 7 of base.v4 asked, in its order:
// 1) a side cheek wall down the near-left (west, u = U0) edge of the opening in stone dark, drawn as the wall's
//    inner face hanging below the rim: 1 px tall beside the near step, 2 px beside the lower steps, so each tread's
//    left end stops a pixel lower against it and the treads step down the wall;
// 2) the mouth darkened: the last nosing goes to stone darkest except a 2 px dim stub at its lit west end, so the
//    stone-darkest mouth runs ~2 px further toward the far rim; outline colour only in the very last row by the far
//    rim lip (no pure-black fill);
// 3) the near-white front nosing shortened to its 4 px west (lit) end, the rest one step down (stone.1); stray single
//    pixels in the dirt round the stair cleaned with fix.orphans restricted to the dirt ramp, plus four named strays.
// The stairwell is re-laid with base.v4's own cell maths, so it follows the base. Ramps: stone, dirt, outline only.
export const base = 'base.v4';
export const meta = { notes: 'west cheek wall with stepped tread ends, darker mouth, shortened front nosing, dirt orphans cleaned' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const w = g.w, h = g.h, cx = w / 2, top = h - 16, hw = w / 2, hh = 8;
  const toUQ = (x, y) => { const a = (x - cx) / hw, b = (y - top) / hh; return [(a + b) / 2, (b - a) / 2]; };
  const U0 = 0.18, U1 = 0.84, Q1 = 0.92, Q0 = Q1 - 14 / 16;
  // band o = px from the near rim (as base.v4): tread, nosing, riser per step, then the mouth and the far rim lip
  const tok = (o, du0) => {
    if (o <= 1) return 'stone.1';
    if (o === 2) return du0 < 5 ? 'stone.0' : 'stone.1';           // 3) front nosing: 4 px lit west end only
    if (o === 3 || o === 7) return 'stone.2';
    if (o === 4 || o === 5) return 'dirt.2';
    if (o === 6) return 'stone.1';
    if (o === 10) return du0 < 5 ? 'dirt.2' : 'stone.2';            // 2) last nosing: a dim stub, then the mouth
    if (o === 12) return 'outline';                                  // 2) outline only in the very last row
    if (o === 13) return 'stone.1';                                  // far rim lip
    return 'stone.2';                                                // tread 3, risers, the mouth
  };
  const eastW = o => (o <= 3 ? 0 : 1);                              // as base.v4
  const band = q => Math.min(13, Math.floor((Q1 - q) * 16));
  const inside = (u, q) => !(u < U0 || u >= U1 || q < Q0 || q >= Q1);
  for (let x = 0; x < w; x++) {
    let wall = 0;                                                    // 1) cheek pixels left in this column
    for (let y = 0; y < h; y++) {
      const [u, q] = toUQ(x + 0.5, y + 0.5);
      if (!inside(u, q)) continue;
      const o = band(q), du0 = (u - U0) * 16, du1 = (U1 - u) * 16;
      if (du0 < 1 && o < 13) wall = o <= 3 ? 1 : 2;                  // the column's top pixel on the west edge
      if (wall > 0) { wall--; px.set(g, [x, y], 'stone.2'); continue; }
      if (o < 13 && du1 < eastW(o)) { px.set(g, [x, y], 'stone.2'); continue; }
      px.set(g, [x, y], tok(o, du0));
    }
  }
  // 3) stray single pixels in the floor's dirt
  px.fix.orphans(g, { ramps: ['dirt'] });
  // the singles fix.orphans leaves (it needs 3 agreeing neighbours): the far rim's stray dark joint pixel, the old
  // light floor speck, a dark dot on the opening's east edge, and the nosing pixel cut off by the new cheek
  const strays = [[[16, 2], 'dirt.2', 'dirt.1'], [[3, 7], 'dirt.0', 'dirt.1'], [[20, 11], 'dirt.2', 'dirt.1'], [[13, 6], 'stone.1', 'stone.2']];
  for (const [at, from, to] of strays) if (px.tokenAt(g, at) === from) px.set(g, at, to);
  return g;
}
