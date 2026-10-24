// feature-wall-rune base.v5 (x2) — from base.v4 (the coordinator's notes on base.v4's x1 review; base.v4 already made the
// angular, cut-in rune the packet's base.v3 note asked for). One change: how the mark sits on the wall's stone.
// 1. Spent: the groove's core is the stone's dark step (one step darker than the lit face), not stone light, so it
//    reads as a cold cut in the wall rather than a painted white mark; on the shaded right face it sinks to the face's
//    own step and the cut shows as its two dark walls.
// 2. Cap: the glyph is clipped to the cap's top diamond (a core pixel stays only while its groove edge stays on the cap),
//    so the naudiz foot no longer hangs past the cap's rim onto the 4 px side.
// 3. No lip pixels: base.v4's light lips only survived as 2 px runs at stroke tips (they read as stray accent dots),
//    so the lip pass is dropped in every state.
// The dormant faces are otherwise unchanged (same glyph, same glow core). Placement as v4. Role ramps only (R11).
export const meta = { brief: 'feature-wall-rune', pass: 'x2', notes: 'v4 rune; spent core stone dark, cap glyph clipped to the cap diamond, no tip lips', mirror: false };

export const params = {};

// algiz + naudiz bind rune in glyph units (x across 0..8, y down 0..10), shared with feature-wall-rune
const SEGS = [[4, 1, 4, 10], [1, 0, 4, 3], [7, 0, 4, 3], [2, 10, 6, 6]];
const HOT = [[4, 8]]; // the crossing: the glow core's bright pixels (and the one above it)
const SX = 2, SY = 1; // flat scale (floor and cap): glyph y runs into the floor at half its width scale, so 45-degree strokes lie as clean 2:1 lines
const FX = 1.25, FY = 1.2; // upright scale on a face: 10 px across, 12 px tall before the face's slant

function line(x0, y0, x1, y1, f) {
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
  for (;;) { f(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}

// the shared carving: 1 px core strokes through `map` inside a thin side-on (4-neighbour) groove edge in ink, so the
// floor shows through on the diagonals; under each near-level stroke the cut's far wall catches the light as a 1 px
// light lip below the groove edge. Dormant: glow mid core, 2 bright pixels at the crossing, the lip on the accent
// mid step (the one-step halo). Spent: the stone step given as core (no lip when that is stone light).
function carve(ctx, g, map, spent, step = 1, inside = null) {
  const { pal, outline } = ctx.dir, gl = pal.glow, st = pal.stone, ac = pal.accent;
  const G = new Map(), K = (x, y) => x + ',' + y, N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  // 4-connected strokes: a diagonal step gets its corner pixel, so no stroke pixel touches its neighbour only at a corner
  for (const [a, b, c, d] of SEGS) { const p = map(a, b), q = map(c, d); let last = null;
    line(p[0], p[1], q[0], q[1], (x, y) => { if (last && last[0] !== x && last[1] !== y) G.set(K(x, last[1]), [x, last[1]]); G.set(K(x, y), [x, y]); last = [x, y]; }); }
  // clip: a core pixel stays only while it and its groove edge (its 4 neighbours) lie inside the surface
  if (inside) for (const [k, [x, y]] of [...G]) if (!inside(x, y) || N4.some(([a, b]) => !inside(x + a, y + b))) G.delete(k);
  const core = spent ? st[Math.min(step, st.length - 1)] : gl[gl.length - 1];
  const lip = spent ? st[0] : ac[Math.min(1, ac.length - 1)];
  const E = new Map();
  for (const [x, y] of G.values()) for (const [a, b] of N4) if (!G.has(K(x + a, y + b))) E.set(K(x + a, y + b), [x + a, y + b]);
  // lips, nearest the viewer first, kept while the silhouette edge stays at least 87 % ink (the direction's dark outer line)
  const L = new Map(), occ = (x, y) => G.has(K(x, y)) || E.has(K(x, y)) || L.has(K(x, y));
  const share = () => { let e = 0, ink = 0;
    for (const m of [E, L]) for (const [x, y] of m.values()) if (N4.some(([a, b]) => !occ(x + a, y + b))) { e++; if (m === E) ink++; }
    return e ? ink / e : 1; };
  const cand = [...G.values()].filter(([x, y]) => (G.has(K(x - 1, y)) || G.has(K(x + 1, y))) && E.has(K(x, y + 1)) && !occ(x, y + 2))
    .sort((p, q) => q[1] - p[1] || p[0] - q[0]);
  cand.length = 0; // base.v5: no lips (they only survived as stray 2 px runs at stroke tips)
  for (const [x, y] of cand) { if (occ(x, y + 2)) continue; L.set(K(x, y + 2), [x, y + 2]); if (share() < 0.87) L.delete(K(x, y + 2)); }
  // no lone lip pixels (orphans): a lip stays only as part of a run of two or more
  for (const [k, [x, y]] of [...L]) if (!L.has(K(x - 1, y)) && !L.has(K(x + 1, y))) L.delete(k);
  // no lone ink pixels at the stroke tips: an edge pixel with no edge neighbour is joined to the next edge pixel round
  // the tip through a free corner, so the groove's edge runs unbroken
  for (const [x, y] of [...E.values()]) {
    if (N4.some(([a, b]) => E.has(K(x + a, y + b)))) continue;
    for (const [a, b] of N4) { const p = x + a, q = y + b;
      if (!occ(p, q) && N4.some(([c, d]) => (p + c !== x || q + d !== y) && E.has(K(p + c, q + d)))) E.set(K(p, q), [p, q]); }
  }
  for (const [x, y] of L.values()) if (g.inb(x, y)) g.set(x, y, lip);
  for (const [x, y] of E.values()) if (g.inb(x, y)) g.set(x, y, outline);
  for (const [x, y] of G.values()) if (g.inb(x, y)) g.set(x, y, core);
  if (!spent) for (const [a, b] of HOT) { const [x, y] = map(a, b); for (const [p, q] of [[x, y], [x, y - 1]]) if (G.has(K(p, q))) g.set(p, q, gl[0]); }
}

export function render(ctx) {
  const [w, h] = ctx.size, g = new ctx.lib.Grid(w, h);
  const spent = String(ctx.state).endsWith('-spent'), face = String(ctx.state).replace('-spent', '');
  let map, inside = null;
  if (face === 'cap') {
    const T = h - 16 - Math.max(2, Math.round((h - 16) / 6)), cx = w / 2, cy = T + 8; // the cap's top diamond centre
    map = (gx, gy) => [Math.round(cx - 0.5 + (gx - 4) * SX), Math.round(cy - 0.5 + (gy - 5) * SY)];
    // the cap's 32 x 16 top diamond, less its 1 px rim
    inside = (x, y) => Math.abs(x + 0.5 - cx) / (w / 2) + Math.abs(y + 0.5 - cy) / 8 <= 0.97;
  } else {
    // left face: x 0..15, top edge y = 8 + x/2; glyph x 3..13, top 5 px under the edge, sheared with the face.
    // The right face mirrors the placement (x and the slope), with the glyph's x flipped first so it is not mirrored.
    const x0 = 3, v0 = 5, right = face === 'right';
    map = (gx, gy) => { const x = x0 + (right ? 8 - gx : gx) * FX, y = 8 + (x + 0.5) / 2 + v0 + gy * FY;
      const xl = Math.round(x); return [right ? w - 1 - xl : xl, Math.round(y)]; };
  }
  // spent groove on the stone's dark step, one step darker than the lit face, so it reads as a cold cut
  carve(ctx, g, map, spent, 2, inside);
  return g;
}
