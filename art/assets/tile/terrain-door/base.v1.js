// terrain-door base.v1 (r1) — a plank door set in its wall cell, drawn straight to pixels on the iso block geometry:
// a cut-stone block on the bottom 32 x 16 diamond (24 px high, 4 px for every -cap state), lit from the upper left
// (top lightest, south-west face lighter than south-east), with an arched plank door in each front face. States:
// closed (planks, iron bands), open (dark doorway, door swung back against the jamb), locked (+ iron lock plate),
// sealed (+ chain and wax seal), broken (split, hanging planks). A -cap is the same door cut to 4 px; its state is
// shown on the cap's top face. Ramps: stone (wall), wood (door), metal (iron), accent (wax only), plus the outline.
export const meta = { brief: 'terrain-door', pass: 'r1', notes: 'door in a cut-stone wall block, 5 states + caps' };

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
    if (kind === 'locked' && pu > 0.6 && pu < 0.98 && z >= 5.5 && z < 10) c = pu > 0.72 && pu < 0.86 && z >= 6.5 && z < 8.5 ? OUT : light ? M[0] : M[1];
    if (kind === 'sealed') {
      const zc = 8 + (pu - 0.5) * 1.2;
      if (Math.abs(z - zc) < 0.8) c = Math.floor(pu * 10) % 2 ? M[0] : M[2];
      if (pu > 0.4 && pu < 0.62 && z >= 6.5 && z < 9.5) c = pu < 0.5 && z >= 8 ? A[0] : A[1];
    }
    if (kind === 'broken' && plank === 1 && seam > 0.5 && z > 1 && z < 5) c = OUT;                                    // a split in a plank
    return c;
  };

  // Top face of a cap: the door seen from above as a cut slab through the cell's middle.
  const capTop = (x, y) => {
    const dx = x + 0.5 - cx, dy = y + 0.5 - top;
    // a strip along the cell's long axis (from the left to the right corner), 3 px deep
    if (Math.abs(dy) > 1.6 || Math.abs(dx) > 11) return null;
    const pu = (dx + 11) / 22, k = Math.floor(pu * 7);
    if (kind === 'open') return Math.abs(dx) > 7.5 && dx < 0 ? Wd[1] : S[2];
    if (kind === 'broken' && (k === 1 || k === 4 || (k === 5 && dy > 0))) return S[2];
    if (kind === 'locked' && Math.abs(dx - 4) < 1.6) return Math.abs(dx - 4) < 0.6 && Math.abs(dy) < 0.6 ? OUT : M[0];
    if (kind === 'sealed') {
      if (Math.abs(dx) < 1.6) return dx < 0 && dy < 0 ? A[0] : A[1];
      if (Math.abs(dy) < 0.6) return k % 2 ? M[0] : M[2];
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
