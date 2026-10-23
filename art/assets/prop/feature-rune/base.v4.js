// feature-rune base.v4 (x1) — from base.v3, as the blind re-score asked (one change: the glyph and how it is cut).
// 1. Glyph: othala's closed diamond with splayed legs read as a crab at 1x. Now an open, angular bind rune of straight
//    strokes only (algiz's raised arms on a stave, crossed low by naudiz's slanted bar), defined once in glyph units and
//    shared exactly with feature-wall-rune base.v4; laid flat by the same affine map (x across, y into the floor at 2:1)
//    inside a faint foreshortened 2:1 ring.
// 2. Carved, not raised: the 1-2 px ink halo is gone. Each 1 px stroke is the groove's core in a thin side-on (4-neighbour)
//    ink edge (the line gate's dark edge), so the floor shows through on the diagonals, and under every near-level
//    stroke the cut's far wall catches the light as a 1 px light lip. Dormant: the glow stays in the core (glow mid,
//    2 bright pixels at the crossing), enclosed edge pixels and the lip on the accent ramp (a one-step halo).
//    Spent: a cold stone-mid groove with a stone-light lower lip. The faint ring is a 1 px ink cut.
// Placement as v3: flat on the cell's bottom diamond, centre (16, h-8), floor undrawn. Role ramps only (R11).
export const meta = { brief: 'feature-rune', pass: 'x1', notes: 'open angular bind rune (algiz + naudiz, shared with feature-wall-rune) in a faint ring; carved groove with shadow edge and light lip, no outline', mirror: false };

// algiz + naudiz bind rune in glyph units (x across 0..8, y down 0..12), shared with feature-wall-rune
const SEGS = [[4, 1, 4, 12], [0, 0, 4, 4], [8, 0, 4, 4], [1, 10, 7, 6]];
const HOT = [[4, 8]]; // the crossing: the glow core's bright pixels (and the one above it)
const S = 1.4; // floor scale: ~11 px across, ~8 px deep

function line(x0, y0, x1, y1, f) {
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
  for (;;) { f(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}

// faint 1 px ring: the edge pixels of a filled 2:1 ellipse
function ring(g, cx, cy, rx, ry, c) {
  const inside = (x, y) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
  for (let y = Math.floor(cy - ry) - 1; y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx) - 1; x <= cx + rx + 1; x++)
    if (inside(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !inside(x + a, y + b)) && g.inb(x, y)) g.set(x, y, c);
}

// the shared carving: 1 px core strokes through `map` inside a thin side-on (4-neighbour) groove edge in ink, so the
// floor shows through on the diagonals; under each near-level stroke the cut's far wall catches the light as a 1 px
// light lip below the groove edge. Dormant: glow mid core, 2 bright pixels at the crossing, enclosed edge pixels on
// the accent dark step (the one-step halo). Spent: stone mid core, stone light lip.
function carve(ctx, g, map, spent) {
  const { pal, outline } = ctx.dir, gl = pal.glow, st = pal.stone, ac = pal.accent;
  const G = new Map(), K = (x, y) => x + ',' + y, N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [a, b, c, d] of SEGS) { const p = map(a, b), q = map(c, d); line(p[0], p[1], q[0], q[1], (x, y) => G.set(K(x, y), [x, y])); }
  const core = spent ? st[Math.min(1, st.length - 1)] : gl[gl.length - 1];
  const lip = spent ? st[0] : ac[Math.min(1, ac.length - 1)];
  const E = new Map();
  for (const [x, y] of G.values()) for (const [a, b] of N4) if (!G.has(K(x + a, y + b))) E.set(K(x + a, y + b), [x + a, y + b]);
  const L = new Map();
  for (const [x, y] of G.values()) {
    const level = G.has(K(x - 1, y)) || G.has(K(x + 1, y));
    if (level && E.has(K(x, y + 1)) && !G.has(K(x, y + 2)) && !E.has(K(x, y + 2))) L.set(K(x, y + 2), [x, y + 2]);
  }
  const used = (x, y) => G.has(K(x, y)) || E.has(K(x, y)) || L.has(K(x, y));
  for (const [x, y] of L.values()) if (g.inb(x, y)) g.set(x, y, lip);
  for (const [x, y] of E.values()) if (g.inb(x, y)) {
    const enclosed = N4.every(([a, b]) => used(x + a, y + b));
    g.set(x, y, !spent && enclosed ? ac[ac.length - 1] : outline);
  }
  for (const [x, y] of G.values()) if (g.inb(x, y)) g.set(x, y, core);
  if (!spent) for (const [a, b] of HOT) { const [x, y] = map(a, b); for (const [p, q] of [[x, y], [x, y - 1]]) if (G.has(K(p, q))) g.set(p, q, gl[0]); }
}

export function render(ctx) {
  const [w, h] = ctx.size, g = new ctx.lib.Grid(w, h);
  const cx = w / 2, cy = h - 8, spent = ctx.state === 'spent';
  ring(g, cx, cy, 10, 5, ctx.dir.outline);
  const map = (gx, gy) => [Math.round(cx - 0.5 + (gx - 4) * S), Math.round(cy - 0.5 + (gy - 6) * S / 2)];
  carve(ctx, g, map, spent);
  return g;
}
