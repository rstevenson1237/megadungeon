// finish.v2 (f) on base.v4 — the one direct-pixel pass (R2), as the base.v4 review asked: at 1x the tiled strip was a
// busy, even orange mesh (every crack pixel glow.1), the 4 frames barely differed, the lit plate patches were flat
// salmon blobs and lone cream specks read as noise. So, within the diamond and never on its edge pixels (the first and
// last pixel of each row stay exactly as the base drew them, so the seams and the diamond shape are untouched):
// 1) cracks dim: every crack pixel (the base's glow tokens) becomes accent.1, the mid step, except near junctions
//    (crack pixels whose 8-ring holds 3 or more separate crack runs, found on the tiled plane so it wraps);
// 2) the glow pulses mid -> bright -> mid over the 4 frames (ctx.frame): frame 0 only the junctions glow (glow.1),
//    frame 1 and 3 the cracks within 2 px of a junction (along the crack) glow.1, frame 2 within 4 px glow.1 and the
//    junction itself glow.0 — the only cream left;
// 3) the base's lone glow.0 specks go with step 1 (no cream outside a junction at the peak);
// 4) each lit plate patch (accent.1 off the cracks) gets a 2-step shade toward the light (upper left): its lit third
//    stays accent.1, the middle third breaks to a checker of accent.1 / accent.2, the far third falls to crust.
// Ramps: accent and glow only (R11); the crust (accent.2) stays the most-used step for the game's lava recolour.
export const base = 'base.v4';
export const meta = { notes: 'lava finish: cracks dimmed to accent.1, junction-centred mid-bright-mid glow pulse, cream only at junction peak, plate patches shaded in 2 steps, edge pixels untouched' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const f = ((ctx.frame ?? 0) % 4 + 4) % 4, top = g.h - 16;
  const level = [0, 1, 2, 1][f];
  const reach = [0, 2, 4][level];
  // the base's tokens, read once before any write
  const src = [];
  for (let y = 0; y < g.h; y++) { src.push([]); for (let x = 0; x < g.w; x++) src[y].push(px.tokenAt(g, [x, y])); }
  const isGlow = (tk) => tk === 'glow.0' || tk === 'glow.1';
  // edge pixels: the first and last filled pixel of every row
  const edge = new Set();
  for (let y = 0; y < g.h; y++) {
    let a = -1, b = -1;
    for (let x = 0; x < g.w; x++) if (src[y][x]) { if (a < 0) a = x; b = x; }
    if (a >= 0) { edge.add(a + ',' + y); edge.add(b + ',' + y); }
  }
  // the tiled plane: lattice (32, 0), (16, 8); a plane point maps to its tile pixel inside the diamond
  const home = (X, Y) => {
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
      const x = X - (i - j) * g.w / 2, y = Y - (i + j) * 8;
      if (x >= 0 && x < g.w && y >= 0 && y < g.h && src[y][x]) return [x, y];
    }
    return null;
  };
  const crackAt = (X, Y) => { const p = home(X, Y); return !!p && isGlow(src[p[1]][p[0]]); };
  const RING = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
  const cracks = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (isGlow(src[y][x])) cracks.push([x, y]);
  const key = (x, y) => x + ',' + y;
  // junctions: 3 or more separate crack runs round the pixel
  const junction = new Set();
  for (const [x, y] of cracks) {
    const r = RING.map(([dx, dy]) => crackAt(x + dx, y + dy));
    let runs = 0;
    for (let i = 0; i < 8; i++) if (r[i] && !r[(i + 7) % 8]) runs++;
    if (runs >= 3) junction.add(key(x, y));
  }
  // distance along the cracks from the nearest junction, on the tiled plane (BFS over 8-neighbours)
  const dist = new Map();
  const q = [];
  for (const k of junction) { dist.set(k, 0); q.push(k.split(',').map(Number)); }
  while (q.length) {
    const [x, y] = q.shift(), d = dist.get(key(x, y));
    if (d >= 6) continue;
    for (const [dx, dy] of RING) {
      const p = home(x + dx, y + dy);
      if (!p || !isGlow(src[p[1]][p[0]])) continue;
      const k = key(p[0], p[1]);
      if (dist.has(k)) continue;
      dist.set(k, d + 1); q.push(p);
    }
  }
  const put = (x, y, tk) => { if (!edge.has(key(x, y))) px.set(g, [x, y], tk); };
  // 1-3) cracks
  for (const [x, y] of cracks) {
    const d = dist.has(key(x, y)) ? dist.get(key(x, y)) : 99;
    let tk = 'accent.1';
    if (d === 0) tk = level === 2 ? 'glow.0' : 'glow.1';
    else if (d <= reach) tk = 'glow.1';
    put(x, y, tk);
  }
  // 4) plate patches: connected accent.1 blobs off the cracks, shaded toward the upper-left light
  const seen = new Set();
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (src[y][x] !== 'accent.1' || seen.has(key(x, y))) continue;
    const blob = [], st = [[x, y]];
    seen.add(key(x, y));
    while (st.length) {
      const [cx, cy] = st.pop(); blob.push([cx, cy]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h || src[ny][nx] !== 'accent.1' || seen.has(key(nx, ny))) continue;
        seen.add(key(nx, ny)); st.push([nx, ny]);
      }
    }
    if (blob.length < 4) continue;
    const s = blob.map(([bx, by]) => bx + 2 * by);
    const lo = Math.min(...s), hi = Math.max(...s), span = Math.max(1, hi - lo);
    blob.forEach(([bx, by], i) => {
      const r = (s[i] - lo) / span;
      if (r < 0.4) return;
      if (r < 0.75) { if ((bx + by) % 2) put(bx, by, 'accent.2'); }
      else put(bx, by, 'accent.2');
    });
  }
  return g;
}
