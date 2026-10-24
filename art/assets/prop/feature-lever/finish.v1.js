// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2). The v3 review: the post reads as a squat barrel, with
// banding stripes on its faces. A finish cannot change the silhouette, so it spends the pass on the two faces: the
// shaded right face (right of the front corner, below the top) steps down from stone.1 to dirt.1, so the post shows a
// lit face and a shaded face and reads as a square cut block, not a round barrel; the lit left face gets a stone.0 rim
// on its outer edge. The masonry seam stays stone.2. Up state, lever, knob and placement unchanged.
export const base = 'base.v3';
export const meta = { notes: 'shaded right face (stone.1 -> dirt.1) and a lit rim on the left face, so the post reads as a block' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const S = v => Math.round((v * g.w) / 32);
  const cx = S(16), cy = g.h - 8, top = cy - S(8), hd = S(3);
  // shaded right face: every stone.1 pixel right of the front corner, below the top face's front vertex
  for (let y = top + hd; y <= cy + hd; y++) {
    for (let x = cx + 1; x <= cx + S(6); x++) if (px.tokenAt(g, [x, y]) === 'stone.1') px.set(g, [x, y], 'dirt.1');
  }
  // lit rim: the left face's outer column, from under the top face down to the foot
  const lx = cx - S(6);
  for (let y = top + 1; y <= cy - 1; y++) if (px.tokenAt(g, [lx, y]) === 'stone.1') px.set(g, [lx, y], 'stone.0');
  return g;
}
