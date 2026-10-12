// terrain-door base.v1 (r1) — a plank door set in its wall cell, drawn straight to pixels on the iso block geometry:
// a cut-stone block on the bottom 32 x 16 diamond (24 px high, 4 px for every -cap state), lit from the upper left
// (top lightest, south-west face lighter than south-east), with an arched plank door in each front face. States:
// closed (planks, iron bands), open (dark doorway, door swung back against the jamb), locked (+ iron lock plate),
// sealed (+ chain and wax seal), broken (split, hanging planks). A -cap is the same door cut to 4 px; its state is
// shown on the cap's top face. Ramps: stone (wall), wood (door), metal (iron), accent (wax only), plus the outline.
// base.v2 (r2), from base.v1 — one change: every state reads apart at 1x. Locked gets an outlined 3x4 iron plate with a
// dark keyhole on each leaf (and an outlined plate across the cap's strip); sealed gets an iron chain crossing the leaf
// in an X with a shadow under each link and the wax seal at the crossing (cap: a link chain along the strip, the seal
// on it); broken-cap gets a jagged dark split and dark holes where planks are gone; intact caps get two iron bands.
// base.v3 (r3), from base.v2 — one change (the r2 review: flat block lighting, loud top): the stone block is now
// terrain-wall base.v2's block, so a door sits in a wall run without a seam: the same courses, mortar and chipped
// stones, the south-west face stone mid with light lips over dark mortar, the south-east face stone dark with mid lips
// over ink mortar (one step darker), a shadow row under the top, and the top face stone mid with a light rim on its
// back edges (no ink there, so it joins the wall crown), one worn crack and sparse wear. Doors and states as in v2.
export const meta = { brief: 'terrain-door', pass: 'r3', notes: 'v2 + the stone block matches terrain-wall v2 (face values, mortar, top)' };

export const params = {
  wear: { type: 'range', min: 0, max: 0.5, step: 0.05, default: 0.3 },
};

export function render(ctx) {
  const { pal, outline } = ctx.dir, OUT = outline, P = ctx.params, [w, h] = ctx.size, { Grid } = ctx.lib, r = ctx.rng;
  const state = String(ctx.state || 'closed'), cap = state.endsWith('-cap'), kind = state.replace(/-cap$/, '');
  const S = pal.stone, Wd = pal.wood, M = pal.metal, A = pal.accent;
  const cx = w / 2;
  const st = pal.stone, last = st.length - 1, hi = st[0], mid = st[Math.min(1, last)], lo = st[last];
  const tw = w, th = tw / 2, half = tw / 2;
  const height = cap ? Math.max(2, Math.round((h - th) / 6)) : h - th; // 4 px cap, 24 px full
  const T = h - th - height; // top row of the block's top diamond
  const g = new Grid(w, h);

  // Courses: heights 4..7 px (face rows), summing to the block height; one mortar row starts each course.
  const courses = [];
  if (height <= 6) courses.push({ v0: 0, v1: height });
  else {
    let v = 0;
    while (v < height) {
      let c = 4 + Math.floor(r() * 4);
      if (height - (v + c) < 4) c = height - v;
      courses.push({ v0: v, v1: v + c });
      v += c;
    }
  }
  // Vertical joints along each face (u in 0..half), staggered course to course.
  const joints = courses.map((c, i) => {
    const js = [], off = (i % 2 ? 3 : 0) + Math.floor(r() * 3);
    for (let u = off + 4 + Math.floor(r() * 3); u < half - 2; u += 6 + Math.floor(r() * 4)) js.push(u);
    return js;
  });
  const chip = new Map(); // per stone, which corners are worn away
  const pit = new Map();
  const stoneKey = (face, ci, si) => `${face}:${ci}:${si}`;
  const stoneAt = (face, u, vy) => {
    const ci = courses.findIndex(c => vy >= c.v0 && vy < c.v1);
    if (ci < 0) return null;
    const c = courses[ci], js = joints[ci];
    if (vy === c.v0 && height > 6) return { mortar: true };
    if (js.includes(u)) return { mortar: true };
    let si = 0, u0 = 0;
    for (const j of js) if (u > j) { si++; u0 = j + 1; }
    const u1 = si < js.length ? js[si] - 1 : half - 1;
    const key = stoneKey(face, ci, si);
    if (!chip.has(key)) {
      chip.set(key, [0, 1, 2, 3].map(() => r() < P.wear));
      pit.set(key, r() < P.wear * 1.5 ? [u0 + 1 + Math.floor(r() * Math.max(1, u1 - u0 - 1)), c.v0 + 2 + Math.floor(r() * Math.max(1, c.v1 - c.v0 - 3))] : null);
    }
    const top = height > 6 ? c.v0 + 1 : c.v0, bot = c.v1 - 1, k = chip.get(key), p = pit.get(key);
    const corner = (u === u0 && vy === top && k[0]) || (u === u1 && vy === top && k[1]) || (u === u0 && vy === bot && k[2]) || (u === u1 && vy === bot && k[3]);
    return { u0, u1, top, bot, corner, pit: p && p[0] === u && p[1] === vy };
  };

  // Top face: stone mid, a light rim on its two back edges (no ink there, so neighbouring tops run together into one
  // crown), and a single worn crack wandering across it instead of a slab grid.
  const inTop = (x, y) => {
    const sx = x + 0.5 - half, sy = y + 0.5 - T;
    const u = sx / tw + sy / th, v = sy / th - sx / tw; // both 0..1 inside the diamond
    return u >= 0 && v >= 0 && u < 1 && v < 1;
  };
  const crack = new Set();
  {
    let x = Math.round(half - 7 + r() * 4), y = Math.round(T + th / 2 - 1 + r() * 2);
    const n = 8 + Math.floor(r() * 5);
    for (let i = 0; i < n; i++) {
      if (inTop(x, y)) crack.add(`${x},${y}`);
      x += 1; if (r() < 0.45) y += r() < 0.6 ? 1 : -1;
    }
  }
  const topColor = (x, y) => {
    if (!inTop(x, y)) return undefined;
    if (y < T + th / 2 && (!inTop(x, y - 1) || !inTop(x - 1, y) || !inTop(x + 1, y))) return hi; // back-edge rim
    if (crack.has(`${x},${y}`)) return lo;
    return r() < P.wear * 0.1 ? hi : mid; // sparse lighter wear
  };

  const top = T + th / 2;                                            // the top diamond's centre row (for the cap's strip)

  // The door opening in a face: u in [u0, u1], an arch on top.
  const u0 = 0.27, u1 = 0.77, um = (u0 + u1) / 2, rad = (u1 - u0) / 2, spring = 13;
  const archTop = u => spring + 4 * Math.sqrt(Math.max(0, 1 - ((u - um) / rad) ** 2));
  const inDoor = (u, z) => u >= u0 && u < u1 && z >= 0 && z < archTop(u);
  const onJamb = (u, z) => !inDoor(u, z) && u >= u0 - 1 / 16 && u < u1 + 1 / 16 && z >= 0 && z < archTop(Math.min(Math.max(u, u0), u1 - 0.001)) + 1.2;
  // Broken door: each plank snapped at its own height.
  const snaps = [0.5, 1, 0.3].map(f => f * (spring + 2) + r() * 2);

  const door = (u, z, light, uf) => {
    // uf: u measured from the hinge side (0) to the handle side (1), both faces mirrored.
    const pu = (uf - u0) / (u1 - u0), du = (uf - u0) * 16, plank = Math.min(2, Math.floor(du / 2.7)), seam = (du % 2.7) / 2.7;
    if (kind === 'open') {
      if (pu < 0.22) return seam < 0.4 || pu > 0.16 ? (light ? Wd[0] : Wd[1]) : Wd[1];                  // the door, edge-on against the jamb
      if (z < 1.5) return S[1];                                                                          // threshold
      return z > archTop(u) - 2 ? OUT : S[2];                                                            // dark passage
    }
    if (kind === 'broken' && z > snaps[plank] - (seam < 0.5 ? 0 : 1)) return z > snaps[plank] + 1.5 || plank % 2 ? S[2] : OUT;
    let c = seam < 0.37 ? Wd[2] : seam < 0.74 && light ? Wd[0] : Wd[1];
    const band = (z >= 3 && z < 4.5) || (z >= 10 && z < 11.5);
    if (band && !(kind === 'broken' && plank === 2 && z > 9)) c = (pu < 0.1 || (pu > 0.45 && pu < 0.55)) ? M[0] : light ? M[1] : M[2];
    const dc = Math.floor(du), zi = Math.floor(z);                  // door column 0..7 from the hinge, z row
    if (kind === 'locked') {
      // 3 x 4 iron plate (columns 4-6, rows 5-8) ringed in outline, keyhole dark in its middle column.
      if (dc >= 3 && dc <= 7 && zi >= 4 && zi <= 9) {
        const inner = dc >= 4 && dc <= 6 && zi >= 5 && zi <= 8;
        c = !inner ? OUT : dc === 5 && (zi === 6 || zi === 7) ? OUT : zi === 8 || dc === 4 ? M[0] : M[1];
      }
    }
    if (kind === 'sealed') {
      // An iron chain crossing the leaf in an X, each link with a dark shadow under it; the wax seal at the crossing.
      for (const zc of [2 + dc * 1.4, 2 + (7 - dc) * 1.4]) {
        if (zi === Math.floor(zc)) c = dc % 2 ? M[1] : M[0];
        else if (zi === Math.floor(zc) - 1) c = OUT;
      }
      if (dc >= 3 && dc <= 4 && zi >= 6 && zi <= 8) c = zi === 8 && dc === 3 ? A[0] : zi === 6 ? A[2] : A[1];
    }
    if (kind === 'broken' && plank === 1 && seam > 0.5 && z > 1 && z < 5) c = OUT;                                    // a split in a plank
    return c;
  };

  // Top face of a cap: the door seen from above as a cut slab through the cell's middle.
  const capTop = (x, y) => {
    const dx = x + 0.5 - cx, dy = y + 0.5 - top;
    // a strip along the cell's long axis (from the left to the right corner), 3 px deep
    const plate = kind === 'locked' && Math.abs(dy) <= 2.6 && dx >= -3 && dx < 3;    // the lock plate overhangs the strip
    if ((Math.abs(dy) > 1.6 && !plate) || Math.abs(dx) > 11) return null;
    const pu = (dx + 11) / 22, k = Math.floor(pu * 7);
    if (kind === 'open') return Math.abs(dx) > 7.5 && dx < 0 ? Wd[1] : S[2];
    const ix = Math.floor(dx), iy = Math.floor(dy);                 // integer cell on the strip (iy -2..1)
    if (kind === 'broken') {
      // A jagged dark split through the middle and dark holes where plank ends are gone; pale splinters on the break.
      const zig = [1, -1, 2, 0][iy + 2] ?? 0;
      if (ix >= zig - 1 && ix <= zig + 1) return OUT;
      if (ix === zig - 2 || ix === zig + 2) return Wd[0];
      if ((ix >= 5 && ix <= 8 && iy >= -1) || (ix <= -7 && ix >= -10 && iy < 0)) return OUT;
      return Math.abs(dy) > 1 ? Wd[2] : Wd[1];                       // splintered planks, no clean seams
    }
    if (kind !== 'broken' && (ix === -7 || ix === 7)) return M[1];  // iron bands on an intact door
    if (kind === 'locked' && Math.abs(dy) <= 2.6 && ix >= -3 && ix <= 2) {
      // an iron plate across the strip, ringed in outline, keyhole dark in its middle
      const inner = ix >= -2 && ix <= 1 && Math.abs(dy) < 1.6;
      return !inner ? OUT : (ix === -1 || ix === 0) && (iy === -1 || iy === 0) && !(ix === 0 && iy === 0) ? OUT : M[0];
    }
    if (kind === 'sealed') {
      if (Math.abs(dx) < 2 && Math.abs(dy) < 1.6) return iy === -2 ? A[0] : ix === 1 ? A[2] : A[1];
      if (iy === -1) return ix % 2 ? M[0] : OUT;
      if (iy === 0) return ix % 2 ? OUT : M[1];
    }
    if (Math.abs(dy) > 1) return Wd[2];
    return (Math.floor(dx + 11) % 3 === 0) ? Wd[2] : dy < 0 ? Wd[0] : Wd[1];
  };

  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let tc = topColor(x, y);
    if (tc !== undefined) {
      if (cap) tc = capTop(x, y) ?? tc;
      g.set(x, y, tc); continue;
    }
    const px = x + 0.5, left = px < half;
    const edgeY = left ? T + th / 2 + (px / half) * (th / 2) : T + th - ((px - half) / half) * (th / 2);
    const dy = y + 0.5 - edgeY;
    if (dy < 0 || dy >= height) continue;
    // The door in each front face: u from the side corner (0) to the front corner (1), z up from the floor edge.
    const ud = left ? px / half : (w - px) / half, z = height - dy;
    if (inDoor(ud, z)) { g.set(x, y, door(ud, z, left, ud)); continue; }
    if (onJamb(ud, z) && Math.floor(dy) > 0) { g.set(x, y, left ? hi : mid); continue; } // cut-stone jamb and arch, lit like the lips
    const vy = Math.floor(dy), u = left ? x : x - half;
    if (vy === 0) { g.set(x, y, left ? lo : outline); continue; } // shadow line under the top's lit rim
    const s = stoneAt(left ? 'L' : 'R', u, vy);
    if (!s || s.mortar || s.corner) { g.set(x, y, left ? lo : outline); continue; }
    if (s.pit) { g.set(x, y, left ? lo : outline); continue; }
    if (left) {
      const lit = vy === s.top || u === s.u0 || x === half - 1;
      g.set(x, y, lit ? hi : mid);
    } else {
      g.set(x, y, vy === s.top ? mid : lo);
    }
  }

  // Ink line on the silhouette, kept inside the shape so the block stays within its cell.
  const solid = (x, y) => g.inb(x, y) && g.alpha(x, y) > 127;
  const edge = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
    if (solid(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !solid(x + a, y + b))) edge.push([x, y]);
  // On the full block the top's two back edges keep the light rim (no ink) between the corners, so a run of wall
  // tops reads as one crown; the corners keep their ink to hold the block's shape. The low cap keeps a full ink line.
  const rimOpen = (x, y) => !cap && inTop(x, y) && y < T + th / 2 && x >= 3 && x <= w - 4 && Math.abs(x + 0.5 - half) > 2;
  for (const [x, y] of edge) if (!rimOpen(x, y)) g.set(x, y, outline);
  return g;
}
