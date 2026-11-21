// feature-sign base.v5 (x1, art redo wave 2) — from base.v4 (the base finish.v2 finishes; finish.v2's cream face and
// metal-light letter clusters are dropped). One base revision, as the blind re-score of finish.v2 asked:
// - the face is on the mid wood step (no light or cream centre), with one broken darker grain line (wood dark) under
//   the lettering, so it reads as weathered wood, not parchment, and is no longer the brightest thing in the scene;
// - the letters are cut as 2 rows of 1 px dark strokes (outline ink) running along the plane (the face's 2:1 slope on
//   the walls, the plank's long axis on the cap), the second row shorter, like text;
// - the rim is 2 px inside the ink line, a bevelled frame (wood light on the lit sides, wood dark on the shaded ones),
//   with a metal nail head at each corner.
// To fit the 2 px rim and two letter rows the wall plaque is 15 x 13 (was 14 x 9) and the cap plank 15 x 11 (was
// 15 x 8). Placement, states (left, right, cap) and the wood ramp are as base.v4.
// v4 header: from base.v3, the plaque nailed flush to the face, a parallelogram along the face's 2:1 slope, three
// scratched letter strokes; the hanging cord loop removed.
// v1 header: a weathered wooden plaque with scratched letters, a wall mark in the 32 x 40 wall frame. The wall block
// is 24 px above the floor diamond (rows 0-16 top) and the cap 4 px, as in terrain-wall. left: the plaque on the
// block's lower-left face (lit), right: on the lower-right face (the mirror, one step darker), cap: lying flat on top
// of the 4 px cap, on the diamond centre. Drawn pixel by pixel from the wood and metal ramps and the outline only.
export const meta = { brief: 'feature-sign', pass: 'x1', notes: 'mid-wood face with a dark grain line, 2 rows of 1 px dark letter strokes along the plane, 2 px rim with corner nails', mirror: false };

export const params = {
  wear: { type: 'range', min: 0, max: 0.5, step: 0.05, default: 0.25 },
};

export function render(ctx) {
  const { pal, outline } = ctx.dir, [w, h] = ctx.size, { Grid } = ctx.lib;
  const wd = pal.wood, hi = wd[0], mid = wd[Math.min(1, wd.length - 1)], lo = wd[wd.length - 1];
  const mt = pal.metal, nailHi = mt[0], nailLo = mt[Math.min(1, mt.length - 1)];
  const g = new Grid(w, h), half = w / 2;
  const state = ctx.state;

  // One board, in board space (u along, v across), for every state: ink line, 2 px rim, mid-wood face, letters.
  // rows: 'x' = a 1 px dark letter stroke, '-' = grain (wood dark); indices relative to the face's first column.
  const board = (W, H, LET, shade) => (u, v) => {
    if (u < 0 || v < 0 || u >= W || v >= H) return undefined;
    const cu = u === 0 || u === W - 1, cv = v === 0 || v === H - 1;
    if (cu && cv) return undefined;                       // cut ink corners
    if (cu || cv) return outline;                         // the ink line
    const nu = u === 2 || u === W - 3, nv = v === 2 || v === H - 3;
    if (nu && nv) return v === 2 ? 'nailTop' : 'nail';    // a nail head at each corner of the rim (metal mid on the lit top)
    // the 2 px rim, a bevelled frame: lit along the top (and the near side on the lit face), dark below and beyond
    const top = v <= 2, bot = v >= H - 3, near = u <= 2, far = u >= W - 3;
    if (top && !(far && v === 2)) return hi;
    if (near && !bot) return shade ? lo : hi;
    if (bot || far) return lo;
    const row = LET[v], i = u - 3;
    if (row && i >= 0 && i < row.length) {
      if (row[i] === 'x') return outline;
      if (row[i] === '-') return lo;
    }
    return mid;                                           // the face: mid wood
  };

  if (state === 'cap') {
    // flat on the cap's top diamond (centre (16, 28)): a plank lying along the diamond's long axis
    const T = h - 16 - Math.max(2, Math.round((h - 16) / 6)), cy = T + 8;
    const L = 15, Wd = 11;
    const LET = { 4: 'xx.xxx.xx', 6: 'xxx.xx...', 7: '.--.----.' };
    const at = board(L, Wd, LET, 0);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const sx = x + 0.5 - half, sy = y + 0.5 - cy;
      const a = sx / 2 + sy, b = sy - sx / 2;
      const c = at(Math.floor(a + L / 2), Math.floor(b + Wd / 2));
      if (c === undefined) continue;
      g.set(x, y, c === 'nailTop' ? nailLo : c === 'nail' ? nailHi : c);
    }
    return g;
  }

  const shade = state === 'right' ? 1 : 0;
  const W = 15, H = 13, x0 = 1, v0 = 5;    // plaque spans face x 1..15, face rows v0.. below the block's top edge (y = 8 + x/2)
  const LET = { 4: 'xx.xxx.xx', 6: 'xxx.xx...', 8: '.--.----.' };
  const at = board(W, H, LET, shade);
  for (let v = 0; v < H; v++) for (let u = 0; u < W; u++) {
    const c = at(u, v);
    if (c === undefined) continue;
    const xl = x0 + u, yl = 8 + Math.floor((xl + 0.5) / 2) + v0 + v;
    g.set(state === 'right' ? w - 1 - xl : xl, yl, c === 'nailTop' ? nailLo : c === 'nail' ? nailHi : c);
  }
  return g;
}
