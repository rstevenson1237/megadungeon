// family-k finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), for the review of base.v3: "head reads as a flat
// slab/duck bill and the pick head sits beside the snout at chin height, doubling it into one block". Lowering the
// pick is a form change (a base revision), so it is left; this pass does the pixel part of reading the snout alone:
// - the snout's top-front corner is cut on a 2 px slope (ink, then clear), so the muzzle tapers to its tip instead of
//   ending square like a bill;
// - the pick's head gets a light glint along its upper edge (cloth light step), so it reads as iron, apart from the
//   skin-toned snout above it.
// Coordinates are found per frame (s/n frame, mirrored for e/w). The base's own eye and mouth line are kept, so the
// template's face paint is left out. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'snout tip tapered 2 px, light glint on the pick head' };

export function finish(g, ctx) {
  const { px } = ctx.lib, W = g.w, flip = ctx.facing === 'e' || ctx.facing === 'w', back = ctx.facing === 'n' || ctx.facing === 'w';
  const X = x => (flip ? W - 1 - x : x);
  const at = (x, y) => px.tokenAt(g, [X(x), y]);
  const skin = t => t && t.startsWith('skin.');
  if (!back) {
    // the snout: the leftmost skin pixel in the two rows at the head anchor's height and the one above
    const hy = ctx.anchors.head[1];
    let top = null;
    for (const y of [hy - 1, hy - 2]) for (let x = 0; x < W; x++) if (skin(at(x, y))) { if (!top || x < top[0] - 1) top = [x, y]; break; }
    if (top) {
      const [x, y] = top;
      if (at(x - 1, y) === 'outline') g.clear(X(x - 1), y);   // the old square corner's ink
      px.set(g, [X(x), y], 'outline');                         // the new sloped edge
      if (at(x + 1, y - 1) === 'outline' && !skin(at(x, y - 1))) g.clear(X(x), y - 1);
    }
  }
  // the pick head: the first cloth pixel of each column gets the light step
  for (let x = 0; x < W; x++) for (let y = 0; y < g.h; y++) {
    const t = at(x, y);
    if (t && t.startsWith('cloth.')) { if (at(x, y - 1) === 'outline') px.set(g, [X(x), y], 'cloth.0'); break; }
  }
  return g;
}
