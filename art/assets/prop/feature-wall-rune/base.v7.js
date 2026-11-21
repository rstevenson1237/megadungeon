// feature-wall-rune base.v7 (x2, art redo wave 2 retry) — from base.v6, on both reviewers' notes on v6 (the retry names
// several changes; nothing else changed: same 32 x 40 wall frame, same six states, same placement, mark only):
// 1. Glyph: the symmetric dagaz bowtie is now fehu (one upright stave, two branches rising to the right off it):
//    asymmetric, not the floor rune's shape. On the left and right faces every column drops with that face's 2:1
//    slope (the stave stays upright, the branches shear with the face; the glyph is never mirrored); on the cap it
//    lies flat in the top face as a groove along the floor axes, clipped to the cap's top diamond.
// 2. Carved, not pasted: inside the ink edge the groove is two pixels, its core and a stone-dark floor down-right of
//    it, and its lit far wall is a 1 px stone-light lip in place of the ink on the down-right side (lower stave,
//    under the branches), in every state. The line gate counts only the outline colour as a dark edge (line.outer
//    'dark', not selout), so ink still closes the rest of the cut; lips are laid in runs of 2+ while each frame's
//    edge stays >= 85.5 % ink.
// 3. Dormant: glow only in the 1 px groove core (glow mid, the 2 glow-light pixels at the upper branch's joint); the
//    one accent halo step is the groove floor next to that joint (accent dark); the rest of the floor is stone dark.
// 4. Spent: the light-grey strip is folded into the groove: the lip sits right against the groove floor (stone mid
//    core, stone dark floor, stone light lip), no ink between, so there is no detached band.
// 5. Orphans: any pixel left with no same-coloured 4-neighbour takes its neighbours' colour (or ink).
// Role ramps only (R11).
export const meta = { brief: 'feature-wall-rune', pass: 'x2', notes: 'fehu stave + 2 branches, sheared per face, flat groove on cap; stone-dark groove floor + lit lip in the ink edge; dormant glow core + accent-dark halo; spent lip folded in', mirror: false };

export const params = {};

// fehu in glyph units (u right 0..5, v down 0..18): the stave and two branches rising right. hot: the upper joint.
const GLYPH = { segs: [[0, 0, 0, 18], [0, 6, 5, 0], [0, 12, 5, 6]], hot: [[0, 6], [0, 7]] };

function line(x0, y0, x1, y1, f) {
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
  for (;;) { f(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}

const K = (x, y) => x + ',' + y;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function carve(ctx, g, map, { spent, inside }) {
  const { pal, outline } = ctx.dir, gl = pal.glow, st = pal.stone, ac = pal.accent;
  const ok = (x, y) => g.inb(x, y) && (!inside || inside(x, y));
  const xy = (k) => k.split(',').map(Number);
  // the core: 4-connected 1 px strokes (a diagonal step gets the pixel under its corner)
  const G = new Set();
  for (const [a, b, c, d] of GLYPH.segs) {
    const p = map(a, b), q = map(c, d); let last = null;
    line(p[0], p[1], q[0], q[1], (x, y) => {
      if (last && last[0] !== x && last[1] !== y) G.add(K(last[1] < y ? last[0] : x, Math.max(last[1], y)));
      G.add(K(x, y)); last = [x, y]; });
  }
  for (const k of [...G]) if (!ok(...xy(k))) G.delete(k);
  const DR = [[1, 0], [0, 1]];
  // the groove's floor: one stone-dark pixel down-right of the core, where the cut runs on past the glow
  const D = new Set();
  for (const k of G) { const [x, y] = xy(k); for (const [a, b] of DR) { const n = K(x + a, y + b); if (!G.has(n) && ok(x + a, y + b)) D.add(n); } }
  // the groove's edge in ink: every free 4-neighbour of the cut
  const col = new Map(), hot = new Set(GLYPH.hot.map(([a, b]) => K(...map(a, b))));
  for (const k of [...G, ...D]) { const [x, y] = xy(k); for (const [a, b] of N4) { const n = K(x + a, y + b); if (!G.has(n) && !D.has(n) && g.inb(x + a, y + b)) col.set(n, outline); } }
  const nearHot = (k) => { const [x, y] = xy(k); return [...hot].some((h) => { const [p, q] = xy(h); return Math.abs(p - x) + Math.abs(q - y) <= 2; }); };
  for (const k of D) col.set(k, !spent && nearHot(k) ? ac[ac.length - 1] : st[st.length - 1]);
  for (const k of G) col.set(k, spent ? st[1] : hot.has(k) ? gl[0] : gl[gl.length - 1]);
  // the lit far wall: a 1 px stone-light lip in place of the ink just down-right of the groove's floor (so it is part
  // of the cut, not a strip beside it), laid (stave first, bottom up) while the frame's edge stays >= 85.5 % ink
  const cand = [];
  for (const k of D) { const [x, y] = xy(k); for (const [a, b] of DR) { const e = K(x + a, y + b); if (col.get(e) !== outline || cand.includes(e)) continue;
    if (!col.has(K(x + 2 * a, y + 2 * b))) cand.push(e); } }
  // the stave's own lower lit side first (its right, bottom up: a lower lip), then the rest nearest the viewer
  const sx = Math.min(...[...G].map((k) => xy(k)[0])), sv = map(0, 18)[1];
  const rank = (k) => { const [x, y] = xy(k); return x <= sx + 3 && y <= sv + 1 ? -y : 1000 - y; };
  cand.sort((p, q) => rank(p) - rank(q));
  const share = () => { let e = 0, ink = 0;
    for (const [k, c] of col) { const [x, y] = xy(k); if (N4.some(([a, b]) => !col.has(K(x + a, y + b)))) { e++; if (c === outline) ink++; } }
    return e ? ink / e : 1; };
  // laid as whole runs (a run is a connected stretch of rim), the best-ranked first; a run that would break the budget
  // is laid only as far as it fits
  const runs = [], seen = new Set();
  for (const n of cand) { if (seen.has(n)) continue; const run = [], todo = [n]; seen.add(n);
    while (todo.length) { const m = todo.shift(); run.push(m); const [x, y] = xy(m);
      for (const [a, b] of N4) { const o = K(x + a, y + b); if (!seen.has(o) && cand.includes(o)) { seen.add(o); todo.push(o); } } }
    run.sort((p, q) => rank(p) - rank(q)); runs.push(run); }
  // a lone rim pixel would read as a stray dot, so only runs of two or more are laid
  for (let i = runs.length - 1; i >= 0; i--) if (runs[i].length < 2) runs.splice(i, 1);
  runs.sort((p, q) => rank(p[0]) - rank(q[0]) || q.length - p.length);
  for (const run of runs) { for (const n of run) col.set(n, st[0]); if (share() >= 0.855) continue;
    for (const n of run) col.set(n, outline); for (const n of run) { col.set(n, st[0]); if (share() < 0.855) { col.set(n, outline); break; } } }
  for (const run of runs) if (run.filter((n) => col.get(n) === st[0]).length === 1) for (const n of run) col.set(n, outline);
  // a lip pixel with no lip neighbour reads as a stray dot: back to ink
  for (const n of cand) { const [x, y] = xy(n); if (col.get(n) === st[0] && !N4.some(([a, b]) => col.get(K(x + a, y + b)) === st[0])) col.set(n, outline); }
  // orphans: a groove pixel with no same-coloured 4-neighbour takes its neighbours' most common non-glow colour
  for (let pass = 0; pass < 2; pass++) for (const [k, c] of [...col]) {
    if (G.has(k) || c === outline) continue;
    const [x, y] = xy(k), n = N4.map(([a, b]) => col.get(K(x + a, y + b))).filter(Boolean);
    if (n.includes(c)) continue;
    const cnt = new Map(); for (const v of n) if (v !== gl[0] && v !== gl[gl.length - 1] && v !== st[0]) cnt.set(v, (cnt.get(v) || 0) + 1);
    let best = outline, bn = 0; for (const [v, m] of cnt) if (m > bn) { best = v; bn = m; }
    col.set(k, best);
  }
  for (const [k, c] of col) { const [x, y] = xy(k); g.set(x, y, c); }
}

export function render(ctx) {
  const [w, h] = ctx.size, g = new ctx.lib.Grid(w, h);
  const spent = String(ctx.state).endsWith('-spent'), face = String(ctx.state).replace('-spent', '');
  if (face === 'cap') {
    const T = h - 16 - Math.max(2, Math.round((h - 16) / 6)), cx = w / 2, cy = T + 8; // the cap's top diamond centre
    // flat on the top face, seen at the 2:1 view: the stave at 0.6 height, so the branches lie near 2:1
    const map = (u, v) => [Math.round(cx - 4 + u), Math.round(cy - 5 + 0.6 * v)];
    const inside = (x, y) => Math.abs(x + 0.5 - cx) / (w / 2) + Math.abs(y + 0.5 - cy) / 8 <= 0.9;
    carve(ctx, g, map, { spent, inside });
  } else {
    // left face: x 0..15, top edge y = 8 + x/2; right face: x 16..31, top edge y = 8 + (31 - x)/2. The glyph sits
    // 5 px under the edge with each column dropped by the face's slope; it reads left to right on both faces.
    const right = face === 'right', x0 = right ? w - 1 - 3 - 9 : 4, v0 = 2;
    const map = (u, v) => { const x = x0 + u, y = 8 + Math.floor((right ? w - 1 - x : x) / 2) + v0 + v; return [x, y]; };
    carve(ctx, g, map, { spent, inside: null });
  }
  return g;
}
