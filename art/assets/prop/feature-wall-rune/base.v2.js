// feature-wall-rune base.v2 (r2) — from base.v1. What changed, as the v1 roster asked: the glyph and its edge.
// 1. Glyph: the forked stem with a barbed foot (it read as a sprig, a flame or a crack) is now othala (ᛟ: a diamond whose
//    two lower sides run on as crossing legs), a closed rune that cannot read as a plant or a crack. It is the same glyph
//    as feature-rune base.v2: Spec 06 has one feature, the magical rune, read on a wall or stepped on on the floor, so
//    the two marks share one glyph and one carved style; they differ by where they sit (upright on a wall, flat on a floor).
// 2. Same carving as feature-rune: 1 px strokes drawn as lines; spent is the same cut as the spent floor rune
//    (stone-dark groove, stone-light lip above it, ink ring round the cut).
// 3. Dormant: the strokes glow (accent mid, the light accent step where the bowtie crosses) and the ring round them is
//    the deep accent step, a soft glow edge into the stone, inside the ink ring (v1 had the ink ring right on the strokes). The glow ramp is gone, so
//    it is the same red as feature-rune.
// Placement as v1: the 32 x 40 wall frame, block 24 px above the floor diamond (top diamond centre y 8), cap 4 px (top
// diamond centre y 28); left on the lower-left face, right its mirror, cap flat on the cap's top. Only the mark is
// drawn (the wall is under it). Role ramps only (R11).
export const meta = { brief: 'feature-wall-rune', pass: 'r2', notes: 'othala rune (as feature-rune), carved 1 px strokes; dormant accent glow with a soft deep-red edge; spent cold groove + lip', mirror: false };

export const params = {};

// othala in glyph units (x across, y down, 8 x 11): a diamond, its two lower sides running on as crossing legs
const SEGS = [[4, 0, 8, 4], [4, 0, 0, 4], [8, 4, 1, 11], [0, 4, 7, 11]];
const CROSS = [4, 8];
// the cap: the same glyph as feature-rune lays it on the floor, a square along the floor axes with its front sides run on
const CA0 = -5, CA1 = 1, CL = 5;
const CAP_SEGS = [[CA0, CA0, CA1, CA0], [CA0, CA0, CA0, CA1], [CA0, CA1, CA1 + CL, CA1], [CA1, CA0, CA1, CA1 + CL]];

export function render(ctx) {
  const { pal, outline } = ctx.dir, [w, h] = ctx.size, { Grid } = ctx.lib;
  const spent = String(ctx.state).endsWith('-spent');
  const face = String(ctx.state).replace('-spent', '');
  const g = new Grid(w, h), half = w / 2;
  const ac = pal.accent, st = pal.stone;

  // stroke pixels, per placement ('o' marks the crossing)
  const stroke = new Map();
  const line = (x0, y0, x1, y1, f) => { for (let i = 0; i <= 80; i++) { const t = i / 80; f(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t); } };
  if (face === 'cap') {
    const T = h - 16 - Math.max(2, Math.round((h - 16) / 6)), cy = T + 8; // the cap's top diamond centre
    const put = (a, b) => stroke.set(`${Math.round(half + (a - b))},${Math.round(cy + (a + b) / 2)}`, '#');
    for (const [a0, b0, a1, b1] of CAP_SEGS) line(a0, b0, a1, b1, put);
    stroke.set(`${Math.round(half)},${Math.round(cy + CA1)}`, 'o');
  } else {
    const x0 = 4, v0 = 6; // left face: glyph spans x 4..12, v 6..17 below the block's top edge (y = 8 + x/2)
    const scr = (gx, gy) => { const xl = x0 + Math.round(gx), yl = 8 + Math.floor((xl + 0.5) / 2) + v0 + Math.round(gy);
      return `${face === 'right' ? w - 1 - xl : xl},${yl}`; };
    for (const [a, b, c, d] of SEGS) line(a, b, c, d, (gx, gy) => stroke.set(scr(gx, gy), '#'));
    stroke.set(scr(...CROSS), 'o');
  }
  const has = (x, y) => stroke.has(`${x},${y}`);
  const ring = [];
  for (const k of stroke.keys()) {
    const [x, y] = k.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!has(x + dx, y + dy) && g.inb(x + dx, y + dy)) ring.push([x + dx, y + dy]);
  }
  if (spent) {
    // the cold cut, as feature-rune spent: ink ring, stone-light lip above each stroke, stone-dark groove
    const lip = new Set();
    for (const k of stroke.keys()) { const [x, y] = k.split(',').map(Number); if (!has(x, y - 1)) lip.add(`${x},${y - 1}`); }
    const cut = k => stroke.has(k) || lip.has(k);
    for (const k of [...stroke.keys(), ...lip]) { const [x, y] = k.split(',').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!cut(`${x + dx},${y + dy}`) && g.inb(x + dx, y + dy)) g.set(x + dx, y + dy, outline); }
    for (const k of lip) { const [x, y] = k.split(',').map(Number); g.set(x, y, st[0]); }
    for (const k of stroke.keys()) { const [x, y] = k.split(',').map(Number); g.set(x, y, st[st.length - 1]); }
  } else {
    // glowing: soft deep-red edge round the strokes, then the ink ring outside it (the direction's line)
    const glowEdge = new Set(ring.map(([x, y]) => `${x},${y}`));
    for (const k of glowEdge) { const [x, y] = k.split(',').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = `${x + dx},${y + dy}`;
        if (!has(x + dx, y + dy) && !glowEdge.has(n) && g.inb(x + dx, y + dy)) g.set(x + dx, y + dy, outline); } }
    for (const [x, y] of ring) g.set(x, y, ac[ac.length - 1]);
    for (const [k, ch] of stroke) { const [x, y] = k.split(',').map(Number); g.set(x, y, ch === 'o' ? ac[0] : ac[Math.min(1, ac.length - 1)]); }
  }
  return g;
}
