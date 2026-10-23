// finish.v2 (f2) on base.v4 — the one direct-pixel pass (R2), on what the x1 review of base.v4 named (its letters were
// one row of faint light dashes that vanished at 1x, and the cap plank had almost no lettering):
// - wall faces (left, right): the plaque's inside is repainted in base.v4's own face space. Its top row becomes a
//   lighter rim (wood light), the nail heads on it turn metal mid so they still read on the rim; the centre goes one
//   step darker (wood dark) inside a wood mid ring; on it, two rows of bold 1 x 2 letter clusters in the metal light
//   step (the second line shorter, like text), so the lettering reads at 1x as light marks on a dark board;
// - cap: the same treatment on the flat plank, in base.v4's iso plank space: the centre goes wood dark and two lines of
//   metal-light letter clusters run along the plank's long axis.
// The ink rim and the silhouette are base.v4's; tokens only (R11).
export const base = 'base.v4';
export const meta = { notes: 'lighter top rim, darker plaque centre, two rows of bold metal-light 1x2 letter clusters on faces and cap' };

// letters in the face's centre, u 3..10: line 1 on rows v 2-3, line 2 on rows v 5-6 (x = a letter pixel). Face
// columns step down the 2:1 slope, so each line runs along the plaque as dense words of 1 x 2 strokes with 1 px
// word gaps; line 2 is shorter, like text.
const FACE = { 2: 'xx.xx.xx', 3: 'xx.xx.xx', 5: 'xxx.xx..', 6: 'xxx.xx..' };
// letters on the cap plank, along its long axis ia 3..11: line 1 at ib 2-3, line 2 at ib 5-6
const CAP = { 2: 'xx.xx.xxx', 3: 'xx.xx.xxx', 5: 'xxx.xx...', 6: 'xxx.xx...' };

export function finish(g, ctx) {
  const { px } = ctx.lib, st = ctx.state;
  if (st === 'cap') {
    const half = g.w / 2, T = g.h - 16 - Math.max(2, Math.round((g.h - 16) / 6)), cy = T + 8, L = 15, Wd = 8;
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const sx = x + 0.5 - half, sy = y + 0.5 - cy, a = sx / 2 + sy, b = sy - sx / 2;
      const ia = Math.floor(a + L / 2), ib = Math.floor(b + Wd / 2);
      if (ia < 2 || ib < 2 || ia > L - 3 || ib > Wd - 2) continue;   // the ink rim and the light rim stay
      const row = CAP[ib], li = ia - 3;
      px.set(g, [x, y], row && li >= 0 && li < row.length && row[li] === 'x' ? 'metal.0' : 'wood.2');
    }
    return g;
  }
  const right = st === 'right', W = 14, H = 9, x0 = 1, v0 = 7;      // base.v4's plaque size and placement on the face
  const at = (u, v) => { const xl = x0 + u, yl = 8 + Math.floor((xl + 0.5) / 2) + v0 + v; return [right ? g.w - 1 - xl : xl, yl]; };
  for (let v = 1; v < H - 1; v++) for (let u = 1; u < W - 1; u++) {
    let t;
    if (v === 1) t = (u === 2 || u === W - 3) ? 'metal.1' : 'wood.0';           // the lighter top rim, nail heads on it
    else if (u === 1 || u === W - 2 || v === H - 2) t = 'wood.1';               // the mid ring
    else {
      const row = FACE[v], li = u - 3;
      t = row && li >= 0 && li < row.length && row[li] === 'x' ? 'metal.0' : 'wood.2';
    }
    px.set(g, at(u, v), t);
  }
  return g;
}
