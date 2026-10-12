// terrain-water-shallow base.v4 (x1, extra revision after the blind re-score) — from base.v3. One change, colour and
// stone layout, per both reviews of finish.v1 (read as speckled granite: a light grass-mid fill over the same evenly
// spaced dark stones in every tile):
//  - the stream bed shows through: the body is a grass-dark wash over soft, two-scale silt patches of dirt dark (about
//    60% of the diamond is grass.2 or dirt.2), grass-mid only in thin, broken, near-level ripple dashes (about 22-26% of
//    the diamond) and at most 4 single, separated grass-light glints, so the value sits far closer to the
//    floor's (mean luma about 90, was about 127; floor 73, deep 81);
//  - stones cut to 3 per tile, varied in size (one large, one middling, one small), placed irregularly in (u, v) and
//    wrapped on the lattice so tiling stays seamless; drawn submerged: no dark rim under them (upper body dirt light,
//    lower body dirt mid), the top edge dithered with the water's grass-dark tint, and the ripple lines run over them.
// The ripple is now one slow train of near-level dashes (one wavelength drift over the 4-frame loop, bent by the warp)
// instead of two crossing trains, so it reads as light lines on water, not crests in blobs.
// Everything else as base.v3: grass ramp for the water, dirt for the bed and stones, per-pixel (u, v) mapping periodic
// in u and v so diamonds tile, a gentle ripple whose phase turns once over the 4-frame loop. Colours from ctx.dir (R11).
export const meta = { brief: 'terrain-water-shallow', pass: 'x1', notes: 'bed shows through: grass-dark wash over dirt bed, sparse near-level grass-mid ripple dashes, 3 submerged irregular stones' };

export const params = {
  ripple: { type: 'range', min: 0.2, max: 0.7, step: 0.05, default: 0.35 },
};

const TAU = Math.PI * 2;
const wrap = x => x - Math.floor(x + 0.5); // to [-0.5, 0.5)

// stones on the bed in (u, v): irregular spots, varied sizes (screen px radii), lumpy outlines
const STONES = [
  { u: 0.31, v: 0.62, rx: 4.6, ry: 2.4, h2: 0.16, p2: 0.9, h3: 0.10, p3: 2.2 },
  { u: 0.74, v: 0.21, rx: 2.8, ry: 1.6, h2: 0.12, p2: 2.6, h3: 0.08, p3: 0.4 },
  { u: 0.86, v: 0.83, rx: 1.9, ry: 1.2, h2: 0.10, p2: 4.0, h3: 0.06, p3: 1.7 },
];

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, [w, h] = ctx.size, g = new ctx.lib.Grid(w, h);
  const water = pal.grass, dirt = pal.dirt, wd = water.length - 1, dd = dirt.length - 1;
  const top = h - 16, hw = w / 2, ph = (ctx.t || 0) * TAU;
  const warp = (u, v) => 0.07 * Math.sin(TAU * (u + 2 * v) + 1.3) + 0.05 * Math.sin(TAU * (2 * u - v) + 4.1);
  // the bed: a soft periodic field, dark silt where low, paler gravel where high, the water wash between
  // the bed: soft periodic silt patches (two scales, two directions) so no single blot repeats on the tile grid
  const bed = (u, v) => 0.5 * Math.sin(TAU * (u - 2 * v) + 0.4) + 0.3 * Math.sin(TAU * (2 * u + v) + 2.7) + 0.2 * Math.sin(TAU * (3 * u + 2 * v) + 5.1);
  const glints = [];
  for (let y = top; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = x + 0.5 - hw, sy = y + 0.5 - top;
    const u = sx / w + sy / 16, v = sy / 16 - sx / w;
    if (u < 0 || v < 0 || u >= 1 || v >= 1) continue;
    const wp = warp(u, v);
    // thin ripple dashes: one slow near-level train (a line every 4 rows, 1-2 px thick), bent by the warp and
    // broken into wavelets; it drifts one wavelength over the loop
    const a = Math.sin(TAU * (2 * u + 2 * v + 2 * wp) - ph);
    const brk = Math.sin(TAU * (u - 2 * v) + 0.7) + 0.6 * Math.sin(TAU * (2 * u + v) + 2.9);
    const wave = a;
    const ripple = a > P.ripple && brk > -0.35;
    // base: the bed under a grass-dark wash
    const n = bed(u, v);
    let c = water[wd];
    if (n < -0.1) c = dirt[dd];
    // submerged stones: no dark rim, body dirt mid, upper-left top dithered toward the water
    for (const s of STONES) {
      const du = wrap(u - s.u), dv = wrap(v - s.v);
      const dx = (du - dv) * hw, dy = (du + dv) * 8;
      const ang = Math.atan2(dy / s.ry, dx / s.rx);
      const rad = 1 + s.h2 * Math.sin(2 * ang + s.p2) + s.h3 * Math.sin(3 * ang + s.p3);
      const q = Math.sqrt((dx / s.rx) ** 2 + (dy / s.ry) ** 2) / rad;
      if (q >= 1) continue;
      const lit = -(dx / s.rx) * 0.45 - (dy / s.ry) * 0.9;
      // upper body dirt light, lower body dirt mid (no dark rim); the top edge dithered with the water's tint
      c = lit > -0.15 ? dirt[0] : dirt[Math.min(1, dd)];
      if (lit > 0.35 && q > 0.6 && ((x + y) & 1)) c = water[wd];
      break;
    }
    // ripple bands over everything (water and stones alike)
    if (ripple) {
      c = water[Math.min(1, wd)];
      if (wave > 0.9 && brk > 0.7) glints.push({ x, y, k: wave + brk * 0.3 });
    }
    g.set(x, y, c);
  }
  // at most 4 grass-light glints, the strongest crest points
  glints.sort((p, q) => q.k - p.k);
  // single, separated pixels (sparkles, not marks)
  const kept = [];
  for (const p of glints) {
    if (kept.length >= 4) break;
    if (kept.some(k => Math.abs(k.x - p.x) <= 2 && Math.abs(k.y - p.y) <= 1)) continue;
    kept.push(p);
    g.set(p.x, p.y, water[0]);
  }
  return g;
}
