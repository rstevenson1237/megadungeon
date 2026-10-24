// feature-rune base.v4 (x1) — from base.v3, as the blind re-score asked (one change: the glyph and how it is cut).
// 1. Glyph: othala's closed diamond with splayed legs read as a crab at 1x. Now an open, angular bind rune of straight
//    strokes only (algiz's raised arms on a stave, crossed low by naudiz's slanted bar), defined once in glyph units and
//    shared exactly with feature-wall-rune base.v4; laid flat by one affine map (x across at 2 px a unit, y into the floor
//    at 1), so its 45-degree strokes lie as clean 2:1 floor lines. No ring: at this size it crowded the glyph.
// 2. Carved, not raised: the 1-2 px ink halo is gone. Each 1 px stroke is the groove's core in a thin side-on (4-neighbour)
//    ink edge (the line gate's dark edge), so the floor shows through on the diagonals, and under every near-level
//    stroke the cut's far wall catches the light as a 1 px light lip. Dormant: the glow stays in the core (glow mid,
//    2 bright pixels at the crossing), the lip on the accent ramp (a one-step halo).
//    Spent: a cold stone-mid groove with a stone-light lower lip.
// Placement as v3: flat on the cell's bottom diamond, centre (16, h-8), floor undrawn. Role ramps only (R11).
export const meta = { brief: 'feature-rune', pass: 'x1', notes: 'open angular bind rune (algiz + naudiz, shared with feature-wall-rune); carved groove with shadow edge and light lip, no outline', mirror: false };

// algiz + naudiz bind rune in glyph units (x across 0..8, y down 0..10), shared with feature-wall-rune
const SEGS = [[4, 1, 4, 10], [1, 0, 4, 3], [7, 0, 4, 3], [2, 10, 6, 6]];
const HOT = [[4, 8]]; // the crossing: the glow core's bright pixels (and the one above it)
const SX = 2, SY = 1; // floor scale: glyph y runs into the floor at half its width scale, so 45-degree strokes lie as clean 2:1 floor lines

function line(x0, y0, x1, y1, f) {
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
  for (;;) { f(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}

// the shared carving: 1 px core strokes through `map` inside a thin side-on (4-neighbour) groove edge in ink, so the
// floor shows through on the diagonals; under each near-level stroke the cut's far wall catches the light as a 1 px
// light lip below the groove edge. Dormant: glow mid core, 2 bright pixels at the crossing, the lip on the accent
// mid step (the one-step halo). Spent: stone mid core, stone light lip.
function carve(ctx, g, map, spent) {
  const { pal, outline } = ctx.dir, gl = pal.glow, st = pal.stone, ac = pal.accent;
  const G = new Map(), K = (x, y) => x + ',' + y, N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  // 4-connected strokes: a diagonal step gets its corner pixel, so no stroke pixel touches its neighbour only at a corner
  for (const [a, b, c, d] of SEGS) { const p = map(a, b), q = map(c, d); let last = null;
    line(p[0], p[1], q[0], q[1], (x, y) => { if (last && last[0] !== x && last[1] !== y) G.set(K(x, last[1]), [x, last[1]]); G.set(K(x, y), [x, y]); last = [x, y]; }); }
  const core = spent ? st[Math.min(1, st.length - 1)] : gl[gl.length - 1];
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
  const cx = w / 2, cy = h - 8, spent = ctx.state === 'spent';
  // flat on the floor: glyph x across, glyph y into the floor foreshortened to half (2:1)
  const map = (gx, gy) => [Math.round(cx - 0.5 + (gx - 4) * SX), Math.round(cy - 0.5 + (gy - 5) * SY)];
  carve(ctx, g, map, spent);
  return g;
}
