// feature-rune base.v6 (x2, art redo wave 2 retry) — from base.v5 (6.5; blind 5.5), on both reviewers' notes, the
// changes the retry names and nothing else:
// 1. Sigil: v5's one zigzag stroke read as a crack, squiggle or bolt. Now an angular rune of four straight strokes
//    in clean lines only (level, upright and 2:1 runs of 2 px, so no jaggy bends): a level stave across the ring, an
//    upright crossbar through its left third and a tiwaz head of two 2:1 strokes back from its right end. It spans
//    the ring's width, centred, with 2 px of floor to the ring's inner line at its ends and 1 px above and below
//    (all the 2:1 ellipse's height allows for a carved stroke with its two edges).
// 2. Ring: no longer outline-dark only. The ellipse keeps its 1 px ink outer line and gains a 1 px stone-mid inner
//    line just inside it, a step that shows on dark floors at 1x. To keep the ink outer line the only silhouette edge
//    (the line gate), the floor inside the ring is filled in the floor's own mid step (dirt), a flush inlaid circle;
//    the ellipse is 1 px larger each way (24 x 12, still inside the cell diamond) to make room for the 2 px ring.
// 3. Carved: each stroke is a groove with its dark edge (ink) on the far side (above, and left of the crossbar) and a
//    stone-light lip on the near side (below, and right of the crossbar below the stave). Lips run in pairs or more
//    (no lone pixels), none inside the head's wedges or against the ring, so the strokes stay apart.
// Kept from v5: the flat 2:1 floor ellipse; dormant glow core (glow mid, 2 glow light pixels at the stave's centre)
// vs spent cold grey stone (stone mid groove). Placement as v3/v5: flat on the cell's bottom diamond, centre
// (16, h-8), drawn as is (not recoloured). Role ramps and tokens only (R11).
export const meta = { brief: 'feature-rune', pass: 'x2', notes: 'four-stroke angular rune (stave, crossbar, tiwaz head) carved: ink far edge, stone-light near lip; ring with ink outer and stone-mid inner line round a flush dirt-filled circle', mirror: false };

const RX = 12, RY = 6; // the ring's outer ellipse, inside the 32 x 16 cell diamond

// the rune's strokes, pixel offsets from (16, h-8)
const STAVE = { y: 0, x0: -8, x1: 6 }; // level stave, 15 px
const BAR = { x: -5, y0: -1, y1: 1 }; // upright crossbar through the stave's left third
// the tiwaz head: two 2:1 strokes in 2 px runs back from the stave's right end, one toward the far side, one toward
// the near side
const BRANCH = [[4, -1], [5, -1], [2, -2], [3, -2], [4, 1], [5, 1], [2, 2], [3, 2]];

export function render(ctx) {
  const [w, h] = ctx.size, g = new ctx.lib.Grid(w, h);
  const { pal, outline } = ctx.dir, gl = pal.glow, st = pal.stone;
  const spent = ctx.state === 'spent';
  const cx = Math.floor(w / 2), cy = h - 8;
  const K = (x, y) => x + ',' + y;

  // strokes
  const G = new Map();
  const put = (dx, dy) => G.set(K(cx + dx, cy + dy), [cx + dx, cy + dy]);
  for (let x = STAVE.x0; x <= STAVE.x1; x++) put(x, STAVE.y);
  for (let y = BAR.y0; y <= BAR.y1; y++) put(BAR.x, y);
  for (const [x, y] of BRANCH) put(x, y);

  // the groove's edges: far side (above; left of the crossbar) ink, near side (below; right of the crossbar) stone-light lip
  const ink = new Map(), lip = new Map();
  const free = (x, y) => !G.has(K(x, y));
  for (const [x, y] of G.values()) {
    if (free(x, y - 1)) ink.set(K(x, y - 1), [x, y - 1]);
    if (free(x, y + 1)) lip.set(K(x, y + 1), [x, y + 1]);
  }
  // the crossbar's sides: ink left (its rows off the stave); its lit right wall below the stave, where it runs on
  // into the stave's lip
  for (let y = BAR.y0; y <= BAR.y1; y++) if (y !== STAVE.y) {
    ink.set(K(cx + BAR.x - 1, cy + y), [cx + BAR.x - 1, cy + y]);
    if (y > STAVE.y) lip.set(K(cx + BAR.x + 1, cy + y), [cx + BAR.x + 1, cy + y]);
  }
  // the stave's left end: its far-side corner in ink, joined to the edge above it (the tip on the right stays clean)
  for (const dy of [0, -1]) ink.set(K(cx + STAVE.x0 - 1, cy + STAVE.y + dy), [cx + STAVE.x0 - 1, cy + STAVE.y + dy]);
  // inside the head's wedges a lip would close the gap between stroke and stave: none there (the far edge of the
  // stroke below stays ink), so the strokes stay apart
  for (const [k, [x, y]] of [...lip]) if (G.has(K(x, y + 1))) lip.delete(k);
  for (const k of lip.keys()) ink.delete(k);

  // the ring: the 1 px border of the outer ellipse in ink (the dark outer line), the next px in its stone inner line,
  // and the floor inside it filled in the floor's own mid step, so the ellipse is one flat inlaid circle whose only
  // edge is its ink line (the grooves inside are inner lines)
  const inE = (x, y) => ((x + 0.5 - cx) / RX) ** 2 + ((y + 0.5 - cy) / RY) ** 2 <= 1;
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const disc = [], outer = new Set();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!inE(x, y)) continue;
    disc.push([x, y]);
    if (N4.some(([a, b]) => !inE(x + a, y + b))) outer.add(K(x, y));
  }
  const inner = disc.filter(([x, y]) => !outer.has(K(x, y)) && N4.some(([a, b]) => outer.has(K(x + a, y + b))));

  const dt = pal.dirt, fill = dt[Math.min(1, dt.length - 1)];
  const groove = spent ? st[Math.min(1, st.length - 1)] : gl[gl.length - 1];
  const lipC = st[0];
  for (const [x, y] of disc) g.set(x, y, outer.has(K(x, y)) ? outline : fill);
  // the inner line: stone mid all round
  for (const [x, y] of inner) g.set(x, y, st[Math.min(1, st.length - 1)]);
  for (const [x, y] of ink.values()) g.set(x, y, outline);
  // a lip right against the ring's inner line is left as floor, so 1 px of floor always parts rune and ring
  const ring = new Set([...outer, ...inner.map(([x, y]) => K(x, y))]);
  for (const [k, [x, y]] of [...lip]) if (ring.has(K(x, y + 1)) || ring.has(k)) lip.delete(k);
  // no lone lip pixels: a lip stays only in a run of two or more
  for (const [k, [x, y]] of [...lip]) if (!N4.some(([a, b]) => lip.has(K(x + a, y + b)))) lip.delete(k);
  for (const [x, y] of lip.values()) g.set(x, y, lipC);
  for (const [x, y] of G.values()) g.set(x, y, groove);
  // the glow core: two bright pixels at the stave's centre
  if (!spent) for (const [x, y] of [[cx - 1, cy], [cx, cy]]) g.set(x, y, gl[0]);
  return g;
}
