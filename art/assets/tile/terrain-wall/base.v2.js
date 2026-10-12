// terrain-wall base.v2 (r2) — from base.v1, one change (the r1 review): the top face is redrawn so neighbouring tops
// join into one crown. It is now stone mid (not the loud light stone) with a light rim along its two back edges in
// place of the dark ink line, and one irregular worn crack in place of the mortar cross. Faces unchanged.
// base.v1: a cut-stone wall block one cell
// wide standing on the floor diamond at the frame bottom (32 x 40), 24 px high for `full`, 4 px for `cap` (the
// cut-away near wall). Drawn pixel by pixel from the stone ramp and the direction's outline only: worn, irregular
// courses with staggered joints and chipped corners on both faces, flagstones on the top face. Light from the upper
// left: top face lightest, south-west face mid with lit lips, south-east face darkest. The ink line sits inside the
// shape so the block never spills past its cell.
export const meta = { brief: 'terrain-wall', pass: 'r2', notes: 'cut-stone iso wall block, full and cap; top face joins neighbours into one crown' };

export const params = {
  wear: { type: 'range', min: 0, max: 0.5, step: 0.05, default: 0.3 },
};

export function render(ctx) {
  const { pal, outline } = ctx.dir, P = ctx.params, [w, h] = ctx.size, { Grid } = ctx.lib, r = ctx.rng;
  const st = pal.stone, last = st.length - 1, hi = st[0], mid = st[Math.min(1, last)], lo = st[last];
  const tw = w, th = tw / 2, half = tw / 2;
  const height = ctx.state === 'cap' ? Math.max(2, Math.round((h - th) / 6)) : h - th; // 4 px cap, 24 px full
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

  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const tc = topColor(x, y);
    if (tc !== undefined) { g.set(x, y, tc); continue; }
    const cx = x + 0.5, left = cx < half;
    const edgeY = left ? T + th / 2 + (cx / half) * (th / 2) : T + th - ((cx - half) / half) * (th / 2);
    const dy = y + 0.5 - edgeY;
    if (dy < 0 || dy >= height) continue;
    const vy = Math.floor(dy), u = left ? x : x - half;
    if (vy === 0) { g.set(x, y, left ? lo : outline); continue; } // shadow line under the top's lit rim
    const s = stoneAt(left ? 'L' : 'R', u, vy);
    if (!s || s.mortar || s.corner) { g.set(x, y, left ? lo : outline); continue; }
    if (s.pit) { g.set(x, y, left ? lo : outline); continue; }
    if (left) {
      // south-west face: lit from the left and above — lip along the top and left of each stone
      const lit = vy === s.top || u === s.u0 || x === half - 1;
      g.set(x, y, lit ? hi : mid);
    } else {
      // south-east face: in shade — only a mid lip along each stone's top
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
  const rimOpen = (x, y) => ctx.state !== 'cap' && inTop(x, y) && y < T + th / 2 && x >= 3 && x <= w - 4 && Math.abs(x + 0.5 - half) > 2;
  for (const [x, y] of edge) if (!rimOpen(x, y)) g.set(x, y, outline);
  return g;
}
