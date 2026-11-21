// feature-wall-rune base.v6 (x1, art redo wave 2) — from finish.v1's base, base.v3 (best line, 7.5 with its finish), on
// finish.v1's blind re-score note: cut the rune in so spent reads as an engraving on stone, a more angular multi-stroke
// rune, and the dormant glow kept to the groove core with a one-step accent halo. The redo names these three, so:
// 1. Glyph: othala (read as a loop on a stick, and as the floor rune's crab on the cap) is now dagaz, two staves bound
//    by a full X: four straight strokes, closed and crossed, unlike the floor rune. Drawn in integer face units with
//    4-connected 1 px strokes; on a face every column drops by x/2 with the face's slope (staves stay upright, the
//    X leans with the face); on the cap it lies flat (half height, the X's arms as clean 2:1 lines), clipped to the
//    cap's top diamond, so the flat rune is the same bowtie, not the floor rune's shape.
// 2. Spent, cut in: no outer outline. The stroke itself is the groove's dark inside (ink), and the groove wall that
//    faces the light (up-left) catches it as a 1 px stone-light lip: right of each stave, under a level or rising
//    stroke; none on the falling arm, nor squeezed inside the X's wedges. A dark cut with a lit edge on any stone.
// 3. Dormant: the same cut, its core lit: glow mid core with 2 glow light pixels at the X's crossing, the groove's
//    walls in ink (a thin 4-neighbour edge, not a halo ring), and a one-step accent halo where the glow spills onto
//    the lit lip round the crossing.
// Placement as v3: the 32 x 40 wall frame, top diamond centre y 8, cap top diamond centre y 28. Only the mark is drawn
// (the wall is under it). Role ramps only (R11).
export const meta = { brief: 'feature-wall-rune', pass: 'x1', notes: 'dagaz; cut in: ink groove + 1 px lit lip on the light-facing wall, no outline; dormant glow core, accent halo at the crossing', mirror: false };

export const params = {};

// dagaz in glyph units (u across 0..8, v down 0..12): two staves and the X between their ends. The faces stand it
// upright; the cap lays it flat (v at half scale, u at 1.5 px, so the X's arms lie as clean 2:1 lines).
const GLYPH = { segs: [[0, 0, 0, 12], [8, 0, 8, 12], [0, 0, 8, 12], [8, 0, 0, 12]], hot: [4, 6] };

function line(x0, y0, x1, y1, f) {
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
  for (;;) { f(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}

const K = (x, y) => x + ',' + y;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// the carving: 4-connected 1 px strokes through `map` (screen coords), clipped by `inside`. Each stroke's lip is the
// groove wall that faces the light (up-left): right of an upright stave, under a level or rising (/) stroke; a
// falling (\) stroke's lit wall is its own far side, so it has none.
function carve(ctx, g, glyph, map, { spent, lipStep, inside }) {
  const { pal, outline } = ctx.dir, gl = pal.glow, st = pal.stone, ac = pal.accent;
  const G = new Map(), want = [];
  for (const [a, b, c, d] of glyph.segs) {
    const p = map(a, b), q = map(c, d), dx = q[0] - p[0], dy = q[1] - p[1];
    const off = dx === 0 ? [1, 0] : dy === 0 || Math.sign(dx) !== Math.sign(dy) ? [0, 1] : null;
    let last = null;
    const put = (x, y) => { G.set(K(x, y), [x, y]); if (off) want.push([x + off[0], y + off[1]]); };
    line(p[0], p[1], q[0], q[1], (x, y) => {
      // a diagonal step gets the pixel under its corner, so the stroke is 4-connected (a cut, not a dotted line)
      if (last && last[0] !== x && last[1] !== y) put(last[1] < y ? last[0] : x, Math.max(last[1], y));
      put(x, y); last = [x, y]; });
  }
  const ok = (x, y) => !inside || inside(x, y);
  for (const [k, [x, y]] of [...G]) if (!ok(x, y)) G.delete(k);
  const lip = new Map();
  // a lip squeezed between two strokes (inside the X's wedges) is left as stone: it would read as a stray light pixel
  const touch = (x, y) => N4.filter(([a, b]) => G.has(K(x + a, y + b))).length;
  for (const [x, y] of want) if (!G.has(K(x, y)) && ok(x, y) && touch(x, y) === 1) lip.set(K(x, y), [x, y]);
  // no lone lip pixels: a lip is kept only in a run of two or more
  for (const [k, [x, y]] of [...lip]) if (!N4.some(([a, b]) => lip.has(K(x + a, y + b)))) lip.delete(k);
  const [hx, hy] = map(...glyph.hot).map(Math.round);
  if (spent) {
    // spent: the cut's dark inside in ink, its lit wall in stone; no outline round it
    for (const [x, y] of lip.values()) if (g.inb(x, y)) g.set(x, y, st[Math.min(lipStep, st.length - 1)]);
    for (const [x, y] of G.values()) if (g.inb(x, y)) g.set(x, y, outline);
    return;
  }
  // dormant: the groove's walls in ink (side-on neighbours of the core), the glow in the core
  const E = new Map();
  for (const [x, y] of G.values()) for (const [a, b] of N4) { const k = K(x + a, y + b); if (!G.has(k)) E.set(k, [x + a, y + b]); }
  for (const [x, y] of E.values()) if (g.inb(x, y)) g.set(x, y, outline);
  // the one-step halo: round the crossing the glow spills onto the lit wall in accent
  for (const [x, y] of lip.values()) if (Math.abs(x - hx) <= 3 && Math.abs(y - hy) <= 3 && g.inb(x, y)) g.set(x, y, ac[Math.min(1, ac.length - 1)]);
  for (const [x, y] of G.values()) if (g.inb(x, y)) g.set(x, y, gl[gl.length - 1]);
  // the lit core: the crossing and the pixel above it
  for (const [x, y] of [[hx, hy], [hx, hy - 1]]) if (G.has(K(x, y))) g.set(x, y, gl[0]);
}

export function render(ctx) {
  const [w, h] = ctx.size, g = new ctx.lib.Grid(w, h);
  const spent = String(ctx.state).endsWith('-spent'), face = String(ctx.state).replace('-spent', '');
  if (face === 'cap') {
    const T = h - 16 - Math.max(2, Math.round((h - 16) / 6)), cx = w / 2, cy = T + 8; // the cap's top diamond centre
    const map = (u, v) => [Math.round(cx + (u - 4) * 1.5), cy - 3 + Math.round(v / 2)];
    const inside = (x, y) => Math.abs(x + 0.5 - cx) / (w / 2) + Math.abs(y + 0.5 - cy) / 8 <= 0.94;
    carve(ctx, g, GLYPH, map, { spent, lipStep: 0, inside });
  } else {
    // left face: x 0..15, top edge y = 8 + x/2; the glyph at x 3..11, 5 px under the edge, each column dropped by x/2.
    // The right face mirrors the placement (dagaz is symmetric, so it reads the same way round).
    const x0 = 3, v0 = 5, right = face === 'right';
    const map = (u, v) => { const x = x0 + u, y = 8 + Math.floor(x / 2) + v0 + v; return [right ? w - 1 - x : x, y]; };
    carve(ctx, g, GLYPH, map, { spent, lipStep: 0, inside: null });
  }
  return g;
}
