// finish.v2 (f2) on base.v4 — the one direct-pixel pass (R2), doing what the base.v4 review named. (1) The post's
// faces: the supersampled seams, joints and chips came out as stray pixels and noisy stone.2 clusters (orphans 5.1%).
// Every stone pixel on the two faces is repainted from one clean pattern: stone.1 fill, one course seam a single
// stone.2 pixel line on the 2:1 slope across both faces, one stone.2 vertical joint per face (upper course on the left, lower on the right, so they stagger),
// the front corner a stone.2 column and a stone.0 lit rim on the left face's outer edge (light from the upper left).
// The top face, bracket, rod and outline are not touched (only stone pixels below the top edge change). (2) The knob:
// its dark accent.2 fill turns accent.1 (the bright red) except its shaded lower-right rim, and its lit pixel becomes a
// one-pixel accent.0 highlight, so the red reads at 1x. Silhouette, states and placement unchanged.
export const base = 'base.v4';
export const meta = { notes: 'post faces repainted clean (one seam, staggered joints, corner, lit rim); knob brightened with a 1 px highlight' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const S = v => Math.round((v * g.w) / 32);
  const cx = S(16), x0 = cx - S(6), x1 = cx + S(6) - 1;           // left face x0..cx-1, right face cx..x1
  const cy = g.h - 8, top = cy - S(8);
  // first face row under the top face's outline, per column
  const edge = x => (x < cx ? top + 1 + Math.ceil((x - x0) / 2) : top + 1 + Math.floor((x1 + 1 - x) / 2));
  const isStone = t => typeof t === 'string' && t.startsWith('stone');
  const seam = x => edge(x) + 3;                                   // the course seam: 3 rows under the top edge
  const joints = { [x0 + 3]: 'up', [x1 - 2]: 'low' };     // one joint per face, staggered between courses
  for (let x = x0; x <= x1; x++) {
    for (let y = edge(x); y < g.h; y++) {
      const t = px.tokenAt(g, [x, y]);
      if (!isStone(t)) { if (t === 'outline' && y > seam(x)) break; continue; }
      let tok = 'stone.1';
      if (y === seam(x)) tok = 'stone.2';
      else if (x === cx) tok = 'stone.2';                           // the front corner
      else if (joints[x] === 'up' && y < seam(x)) tok = 'stone.2';
      else if (joints[x] === 'low' && y > seam(x)) tok = 'stone.2';
      else if (x === x0) tok = 'stone.0';                           // lit rim, left face's outer edge
      px.set(g, [x, y], tok);
    }
  }
  // knob: bright red body, dark rim on the lower right, one pale highlight
  const out = (x, y) => px.tokenAt(g, [x, y]) === 'outline';
  const knob = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const t = px.tokenAt(g, [x, y]);
    if (t === 'accent.2' || t === 'accent.1') knob.push([x, y, t]);
  }
  for (const [x, y, t] of knob) {
    if (t === 'accent.1') px.set(g, [x, y], 'accent.0');
    else if (!(out(x + 1, y) || out(x, y + 1))) px.set(g, [x, y], 'accent.1');
  }
  return g;
}
