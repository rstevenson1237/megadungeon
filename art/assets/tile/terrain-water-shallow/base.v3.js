// terrain-water-shallow base.v3 (r3) — from base.v2. One change, per the r2 review: restore the stones under the
// water. 3-4 organic stones per tile (3-6 px across, a lumpy outline), dirt light on the upper-left rim, dirt mid body,
// dirt dark underside, drawn the same in every frame (no refraction wobble, no crest tint over them) so the bed holds
// still while the ripple moves. Everything else as base.v2: grass ramp for the water, the same ripple, per-pixel
// (u, v) mapping periodic in u and v so diamonds tile, ripple phase turning once per loop.
export const meta = { brief: 'terrain-water-shallow', pass: 'r3', notes: 'stones restored under the water: 3-4 shaded dirt stones, still in every frame' };

export const params = {
  stones: { type: 'range', min: 3, max: 4, step: 1, default: 4 },
};

const TAU = Math.PI * 2;
const wrap = x => x - Math.floor(x + 0.5); // to [-0.5, 0.5)

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, [w, h] = ctx.size, g = new ctx.lib.Grid(w, h), r = ctx.rng;
  const water = pal.grass, dirt = pal.dirt, wd = water.length - 1, dd = dirt.length - 1;
  const top = h - 16, hw = w / 2, ph = ctx.t * TAU;
  // stones on the bed, in (u, v), spread one per strip of u; sized in screen pixels, flattened by the view, each
  // with a lumpy outline (a few low harmonics on its radius) so none reads as a ruler-drawn ellipse
  const stones = [];
  for (let i = 0; i < P.stones; i++) {
    stones.push({
      u: (i + 0.25 + r() * 0.5) / P.stones, v: 0.2 + ((i * 0.618 + r() * 0.15) % 1) * 0.6,
      rx: 2.3 + r() * 1.0, ry: 1.4 + r() * 0.6,
      h2: 0.12 + r() * 0.1, p2: r() * TAU, h3: 0.08 + r() * 0.08, p3: r() * TAU,
    });
  }
  // a periodic warp so the crests bend organically instead of running ruler-straight
  const warp = (u, v) => 0.07 * Math.sin(TAU * (u + 2 * v) + 1.3) + 0.05 * Math.sin(TAU * (2 * u - v) + 4.1);
  for (let y = top; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = x + 0.5 - hw, sy = y + 0.5 - top;
    const u = sx / w + sy / 16, v = sy / 16 - sx / w;
    if (u < 0 || v < 0 || u >= 1 || v >= 1) continue;
    const wp = warp(u, v);
    // two slow wave trains crossing at an angle, each turning once per loop
    const a = Math.sin(TAU * (u + v + wp) - ph), b = Math.sin(TAU * (u - v + wp * 1.5) - ph + 0.8);
    const wave = 0.6 * a + 0.4 * b; // -1..1
    // breaks each crest into short wavelets, so the ripple reads as broken light on water, not stripes
    const brk = Math.sin(TAU * (3 * u - 2 * v) + 0.7) * Math.sin(TAU * (2 * u + 3 * v) + 2.9);
    let c = null;
    for (const s of stones) {
      const du = wrap(u - s.u), dv = wrap(v - s.v);
      const dx = (du - dv) * hw, dy = (du + dv) * 8;
      const ang = Math.atan2(dy / s.ry, dx / s.rx);
      const rad = 1 + s.h2 * Math.sin(2 * ang + s.p2) + s.h3 * Math.sin(3 * ang + s.p3);
      const q = Math.sqrt((dx / s.rx) ** 2 + (dy / s.ry) ** 2) / rad;
      if (q >= 1) continue;
      // lit from the upper left: a light rim up-left, a dark underside down-right, mid between
      const lit = -(dx / s.rx) * 0.45 - (dy / s.ry) * 0.9; // > 0 toward the light
      if (q > 0.45 && lit > 0.2) c = dirt[0];
      else if (q > 0.7 && lit < -0.45) c = dirt[dd];
      else c = dirt[Math.min(1, dd)];
      break;
    }
    if (!c) {
      c = water[wd];
      if (wave > 0.35 && brk > -0.5) c = water[Math.min(1, wd)];
      // rare glints on the highest crests
      if (wave > 0.9 && brk > 0.55) c = water[0];
    }
    g.set(x, y, c);
  }
  return g;
}
