// terrain-water-shallow base.v1 (r1) — Megadungeon's shallow water: a 32 x 16 iso diamond of still, shallow water
// over a scatter of worn stones, with a slow 4-frame ripple loop (ctx.t). Grass ramp for the water (the theme's
// shallow-water token), dirt ramp for the stones seen under it (the floor token); nothing else. Drawn per pixel in
// the cell's own (u, v) square, the same mapping the game's iso floor uses, and every pattern is periodic in u and v
// with whole-number frequencies, so diamonds tile without a seam; the ripple phase turns once over the loop, so frame 4
// runs back into frame 1. Low in contrast: dark water, broken mid-ramp wavelets on the crests, rare light glints. No outline: a liquid
// has no seam.
export const meta = { brief: 'terrain-water-shallow', pass: 'r1', notes: 'shallow water over stones, periodic ripple loop' };

export const params = {
  stones: { type: 'range', min: 2, max: 5, step: 1, default: 3 },
};

const TAU = Math.PI * 2;
const wrap = x => x - Math.floor(x + 0.5); // to [-0.5, 0.5)

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, [w, h] = ctx.size, g = new ctx.lib.Grid(w, h), r = ctx.rng;
  const water = pal.grass, dirt = pal.dirt, wd = water.length - 1, dd = dirt.length - 1;
  const top = h - 16, hw = w / 2, ph = ctx.t * TAU;
  // stones on the bed, in (u, v); sized in screen pixels, a little flattened by the view
  const stones = [];
  for (let i = 0; i < P.stones; i++) {
    stones.push({ u: (i + 0.15 + r() * 0.7) / P.stones, v: r(), rx: 2.6 + r() * 1.8, ry: 1.5 + r() * 0.8, ph: r() * TAU });
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
    // refraction: the bed wobbles half a pixel with the ripple
    const ox = 0.45 * Math.sin(TAU * (u - v) * 2 - ph), oy = 0.3 * Math.cos(TAU * (u + v) * 2 - ph);
    let c = null;
    for (const s of stones) {
      const du = wrap(u - s.u), dv = wrap(v - s.v);
      const dx = (du - dv) * hw + ox, dy = (du + dv) * 8 + oy;
      const q = (dx / s.rx) ** 2 + (dy / s.ry) ** 2;
      if (q >= 1) continue;
      // lit from the upper left: a light cap, a mid body, a dark lower-right edge
      const lit = (dx / s.rx + dy / s.ry) / Math.SQRT2;
      c = lit < -0.35 && q < 0.75 ? dirt[0] : q > 0.6 && lit > 0.15 ? dirt[dd] : dirt[Math.min(1, dd)];
      break;
    }
    if (c) {
      // a crest passing over a stone dims it rather than hiding it, so the stones stay visible through the water
      if (wave > 0.85 && brk > 0.1) c = water[Math.min(1, wd)];
    } else {
      c = water[wd];
      if (wave > 0.7 && brk > -0.05) c = water[Math.min(1, wd)];
      // rare glints on the highest crests
      if (wave > 0.9 && brk > 0.55) c = water[0];
    }
    g.set(x, y, c);
  }
  return g;
}
