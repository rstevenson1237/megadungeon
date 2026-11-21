// feature-rune base.v5 (x1, art redo wave 2) — from base.v3 (the base finish.v1 finishes, the best final at 7), as the
// redo list's approved fix asks (one revision, several named changes):
// 1. Glyph: othala's closed diamond with splayed legs read as a crab. Now an open angular rune of three straight strokes
//    (eihwaz laid down: a 10 px stave on the floor's 2:1 axis with a 2-row hook at each end, the left one bent toward
//    the viewer and the right one away), no closed loop. The stave lies on the floor axis, not upright on screen
//    (base.v4's upright stave read as a twig standing on the cell).
// 2. Flat cue: a faint foreshortened circle round it, the 1 px inner border of a 2:1 ellipse (22 x 11) in the
//    direction's ink, inscribed in the cell diamond, read as a thin line scratched into the floor; the rune keeps 1 px
//    of floor clear of it all round.
// 3. Carved, not outlined: no 8-neighbour ink halo round the strokes. The cut's edge is selective: its inner shadow
//    (the groove wall facing the up-left light) is ink above each stroke and round the hooks; under the stave the far
//    wall catches the light as a 1 px lip one row down (dormant: accent mid, a one-step glow spill; spent: stone mid),
//    in runs of two only (no lone lip pixels), and the lone ink pixels at the hook tips join the edge round the tip.
// 4. Glow: the core is the glow ramp's mid step with only 2 bright pixels (glow light) at the stave's centre.
//    Spent: the same cut, cold and lighter than before: a stone light scar with the stone mid lip (also what keeps the
//    lit side of the cut brighter than its shaded side for the light gate).
// States as the brief: dormant, spent. Placement as v3: flat on the cell's bottom diamond, centre (16, h-8), floor
// undrawn, drawn as is (not recoloured). Role ramps and tokens only (R11).
export const meta = { brief: 'feature-rune', pass: 'x1', notes: 'open eihwaz on the 2:1 floor axes in a faint ink ellipse; selective carved edge (ink inner shadow, light lower lip); 2 px glow core', mirror: false };

// the rune, point-symmetric about its centre run (15.5, h-7.5), 1 px clear of the circle all round: a stave on the
// floor's 2:1 axis (2 px runs, one row a step) with a short hook at each end, the left one toward the viewer and the
// right one away (eihwaz laid down)
const STAVE = [[-5, -2], [4, 2]]; // pixel offsets from (16, h-8) of the stave's ends: 10 px in five 2 px runs
const HOOK = 2; // the hooks' length in rows
const RX = 11, RY = 5.5; // the circle, inscribed in the 32 x 16 cell diamond

export function render(ctx) {
  const [w, h] = ctx.size, g = new ctx.lib.Grid(w, h);
  const { pal, outline } = ctx.dir, gl = pal.glow, st = pal.stone, ac = pal.accent;
  const spent = ctx.state === 'spent';
  const cx = Math.floor(w / 2), cy = h - 8;
  const K = (x, y) => x + ',' + y, N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // strokes: the stave as clean 2 px runs, the hooks as 1 px columns
  const G = new Map(), S = new Set();
  const [[ax, ay], [bx]] = STAVE;
  for (let i = 0; i <= bx - ax; i++) { const x = cx + ax + i, y = cy + ay + (i >> 1); G.set(K(x, y), [x, y]); S.add(K(x, y)); }
  const x0 = cx + ax, y0 = cy + ay, x1 = cx + bx, y1 = cy + ay + ((bx - ax) >> 1);
  for (let j = 1; j <= HOOK; j++) { G.set(K(x0, y0 + j), [x0, y0 + j]); G.set(K(x1, y1 - j), [x1, y1 - j]); }

  // the faint circle: the 1 px inner border of a 2:1 ellipse centred on the cell
  const inE = (x, y) => ((x + 0.5 - cx) / RX) ** 2 + ((y + 0.5 - cy) / RY) ** 2 <= 1;
  const R = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inE(x, y) && N4.some(([a, b]) => !inE(x + a, y + b))) R.push([x, y]);

  // the cut's edge: under the stave the lit far wall, a 1 px lip one row down; ink everywhere else round the strokes
  const lip = new Map(), edge = new Map();
  for (const k of S) { const [x, y] = G.get(k); if (!G.has(K(x, y + 1))) lip.set(K(x, y + 1), [x, y + 1]); }
  // no lone lip pixel (an orphan): a lip stays only as part of a run of two
  for (const [k, [x, y]] of [...lip]) if (!lip.has(K(x - 1, y)) && !lip.has(K(x + 1, y))) lip.delete(k);
  for (const [x, y] of G.values()) for (const [a, b] of N4) { const k = K(x + a, y + b); if (!G.has(k) && !lip.has(k)) edge.set(k, [x + a, y + b]); }
  // no lone ink at the hook tips: an edge pixel with no edge neighbour joins the next edge pixel round the tip through a
  // free corner, so the cut's edge runs unbroken
  const used = (x, y) => G.has(K(x, y)) || lip.has(K(x, y)) || edge.has(K(x, y));
  for (const [x, y] of [...edge.values()]) {
    if (N4.some(([a, b]) => edge.has(K(x + a, y + b)))) continue;
    for (const [a, b] of N4) { const p = x + a, q = y + b;
      if (!used(p, q) && N4.some(([c, d]) => (p + c !== x || q + d !== y) && edge.has(K(p + c, q + d)))) { edge.set(K(p, q), [p, q]); break; } }
  }

  const core = spent ? st[0] : gl[gl.length - 1];
  const lipC = spent ? st[Math.min(1, st.length - 1)] : ac[Math.min(1, ac.length - 1)];
  for (const [x, y] of R) if (g.inb(x, y)) g.set(x, y, outline);
  for (const [x, y] of edge.values()) if (g.inb(x, y)) g.set(x, y, outline);
  for (const [x, y] of lip.values()) if (g.inb(x, y)) g.set(x, y, lipC);
  for (const [x, y] of G.values()) if (g.inb(x, y)) g.set(x, y, core);
  // the glow core: the stave's two centre pixels only
  if (!spent) for (const [x, y] of [[cx - 1, cy], [cx, cy]]) if (G.has(K(x, y))) g.set(x, y, gl[0]);
  return g;
}
