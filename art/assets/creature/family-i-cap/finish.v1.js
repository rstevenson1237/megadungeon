// family-i-cap finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), for the review of base.v3: "each 5x4 wasp
// reads as a tiny face/beetle (two pale wing pixels look like eyes)". Each wasp is repainted at final resolution as
// a 7 x 3 side-on body heading the way the swarm faces: a small dark head, a thorax, a pinched waist and a striped
// abdomen (light, dark, light) tapering back to a sting, with ONE pale wing pair raised above the thorax (beating: level on up-beat frames, swept back on the
// down-beat), inked round. The base's wasps are found per frame as separate blobs, cleared (the floor shadow under
// them is put back) and the new wasp is stamped on the old one's body row, so the drift and the attack surge of the
// base are kept. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'each wasp repainted as a 7x3 side-on body, pinched waist, striped abdomen, with a raised wing pair' };

// heading left: [dx, dy, token] — dy 0..2 the body, dy -1 the wings
const BODY = [
  [1, 0, 'accent.1'], [2, 0, 'accent.0'], [4, 0, 'accent.0'], [5, 0, 'accent.2'],
  [0, 1, 'accent.2'], [1, 1, 'accent.1'], [2, 1, 'accent.1'], [3, 1, 'accent.2'], [4, 1, 'accent.0'], [5, 1, 'accent.2'], [6, 1, 'accent.0'],
  [1, 2, 'accent.2'], [2, 2, 'accent.2'], [4, 2, 'accent.1'], [5, 2, 'accent.2'],
];
const WINGS = { up: [[1, -1], [2, -1]], down: [[2, -1], [3, -1]] };

export function finish(g, ctx) {
  const { px } = ctx.lib, W = g.w, H = g.h, flip = ctx.facing === 'e' || ctx.facing === 'w';
  const op = (x, y) => g.alpha(x, y) === 255;
  // the floor shadow: per row, its x extent and its pixel, to put back under a cleared wasp
  const shade = {};
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = g.alpha(x, y);
    if (a > 0 && a < 255) { const i = (y * W + x) * 4, s = shade[y] ??= { x0: x, x1: x, rgba: [...g.d.slice(i, i + 4)] }; s.x0 = Math.min(s.x0, x); s.x1 = Math.max(s.x1, x); }
  }
  // the wasps: 4-connected blobs of opaque pixels
  const seen = new Set(), blobs = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!op(x, y) || seen.has(y * W + x)) continue;
    const pts = [], st = [[x, y]]; seen.add(y * W + x);
    while (st.length) {
      const [a, b] = st.pop(); pts.push([a, b]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const u = a + dx, v = b + dy;
        if (op(u, v) && !seen.has(v * W + u)) { seen.add(v * W + u); st.push([u, v]); }
      }
    }
    blobs.push(pts);
  }
  const stamps = [];
  for (const pts of blobs) {
    const toks = pts.map(p => px.tokenAt(g, p)), body = pts.filter((p, i) => toks[i] === 'accent.0');
    if (!body.length) continue;
    const wings = toks.filter(t => t === 'cloth.0').length, xs = pts.map(p => p[0]);
    const bx0 = Math.min(...xs), bx1 = Math.max(...xs), by = Math.min(...body.map(p => p[1]));
    stamps.push({ bx0, bx1, by, beat: wings >= 4 ? 'up' : 'down' });
    for (const [x, y] of pts) {
      g.clear(x, y);
      const s = shade[y];
      if (s && x >= s.x0 && x <= s.x1) g.d.set(s.rgba, (y * W + x) * 4);
    }
  }
  for (const { bx0, bx1, by, beat } of stamps) {
    // heading left in s/n: the head at the blob's left; mirrored (heading right) in e/w
    const P = (dx, dy) => [flip ? bx1 - dx : bx0 + dx, by + dy];
    const own = new Set(), put = [];
    for (const [dx, dy, t] of BODY) put.push([...P(dx, dy), t]);
    for (const [dx, dy] of WINGS[beat]) put.push([...P(dx, dy), 'cloth.0']);
    for (const [x, y] of put) own.add(`${x},${y}`);
    for (const [x, y] of put) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const u = x + dx, v = y + dy;
      if (!own.has(`${u},${v}`) && !op(u, v)) px.set(g, [u, v], 'outline');
    }
    for (const [x, y, t] of put) px.set(g, [x, y], t);
  }
  return g;
}
