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
export const meta = { brief: 'terrain-door', pass: 'r2', notes: 'v1 + every door state legible at 1x (lock plate, chain, split)' };

export const params = {
  course: { type: 'range', min: 5, max: 7, step: 1, default: 6 },
};

export function render(ctx) {
  const { pal } = ctx.dir, OUT = ctx.dir.outline, [w, h] = ctx.size, r = ctx.rng, P = ctx.params;
  const state = String(ctx.state || 'closed'), cap = state.endsWith('-cap'), kind = state.replace(/-cap$/, '');
  const S = pal.stone, Wd = pal.wood, M = pal.metal, A = pal.accent;
  const g = new ctx.lib.Grid(w, h);
  const cx = w / 2, hw = w / 2, hh = 8, cy = h - 8, H = cap ? 4 : 24, top = cy - H, E = 1.04;

  // Shape: the bottom diamond swept up H px.
  const inDia = (px, py, c) => Math.abs(px - cx) / hw + Math.abs(py - c) / hh <= E;
  const inMask = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    const px = x + 0.5, py = y + 0.5, d = py < top ? top - py : py > cy ? py - cy : 0;
    return Math.abs(px - cx) / hw + d / hh <= E;
  };

  // Masonry: courses along z, staggered head joints 5-8 px apart with a little seeded wobble (worn, not ruled).
  const C = P.course, joints = [];
  for (let k = 0; k < 6; k++) {
    const row = [];
    for (let u = (k % 2 ? 0.12 : 0.34) + (r() - 0.5) * 0.08; u < 1.1; u += 0.36 + r() * 0.14) row.push(u);
    joints.push(row);
  }
  const masonry = (u, z, light) => {
    const k = Math.floor(z / C), zc = z - k * C, J = joints[k % joints.length];
    if (zc < 1 && z > 0.5) return light ? S[2] : OUT;                    // bed joint
    for (const j of J) if (Math.abs((u - j) * 16) < 0.5) return light ? S[2] : OUT; // head joint
    if (zc >= C - 1 && light) return S[0];                               // lit top row of each stone
    return light ? S[1] : S[2];
  };

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
    if (!inMask(x, y)) continue;
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !inMask(x + a, y + b));
    if (edge) { g.set(x, y, OUT); continue; }
    const px = x + 0.5, py = y + 0.5;
    if (inDia(px, py, top)) {
      // Top face: worn slab, lightest; a darker rim on the front edges where it meets the faces.
      const frontEdge = !inDia(px, py + 1, top);
      let c = frontEdge ? S[1] : S[0];
      const ddx = px - cx + 4, ddy = py - top + 1;                  // a hairline crack in the worn slab
      if (!frontEdge && !cap && Math.abs(ddy - ddx * 0.5) < 0.5 && ddx > -1 && ddx < 5) c = S[1];
      if (cap) c = capTop(x, y) ?? c;
      g.set(x, y, c);
      continue;
    }
    const left = px < cx, u = left ? px / hw : (w - px) / hw;      // u: 0 at the side corner, 1 at the front corner
    const z = (left ? cy + px / 2 : cy + (w - px) / 2) - py;
    const uf = left ? u : u;                                         // mirrored: hinge at the side corner on both faces
    let c;
    if (inDoor(u, z)) c = door(u, z, left, uf);
    else if (onJamb(u, z)) c = left ? S[0] : S[1];                   // cut-stone jamb and arch
    else c = masonry(u, z, left);
    if (Math.abs(px - cx) < 0.6) c = left ? S[0] : c;                // the front arris catches the light
    g.set(x, y, c);
  }
  return g;
}
