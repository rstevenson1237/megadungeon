// family-f-cap finish.v1 (f) on base.v3 — the one direct-pixel pass (R2). Review of base.v3: the huge pale shoulder
// plate is the brightest, largest area, so it reads as a beetle shell and weakens the recoloured ramp's dominance.
// This pass cuts the plate's pale fill (skin.0) to a 2 px highlight rim along its top edge (the spine side) and fills
// the rest with the mid skin tone (skin.1); the ribs (skin.2) and the small pale runs on the limbs are untouched. The
// plate is found as the largest connected skin.0 area of each frame, so it follows every pose. Tokens only (R11).
export const base = 'base.v3';
export const meta = { pass: 'f', notes: 'pale back plate cut to a 2 px top rim, the rest mid skin' };

export function finish(g, ctx) {
  const { px } = ctx.lib, W = g.w, H = g.h;
  const tok = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) tok.push(px.tokenAt(g, [x, y]));
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : tok[y * W + x]);
  const fill = (x, y) => { const t = at(x, y); return !!t && t !== 'outline'; };
  // the connected skin.0 areas (4-neighbour); the plate is the largest
  const seen = new Uint8Array(W * H);
  let plate = [];
  for (let i = 0; i < W * H; i++) {
    if (seen[i] || tok[i] !== 'skin.0') continue;
    const comp = [], stack = [i]; seen[i] = 1;
    while (stack.length) {
      const j = stack.pop(), x = j % W, y = (j / W) | 0; comp.push([x, y]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = ny * W + nx;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && !seen[k] && tok[k] === 'skin.0') { seen[k] = 1; stack.push(k); }
      }
    }
    if (comp.length > plate.length) plate = comp;
  }
  if (plate.length < 30) return g;
  // keep a 2 px rim under the top edge; everything deeper goes to the mid tone
  for (const [x, y] of plate) if (fill(x, y - 1) && fill(x, y - 2)) px.set(g, [x, y], 'skin.1');
  return g;
}
