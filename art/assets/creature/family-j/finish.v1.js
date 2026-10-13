// family-j finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), for the review of base.v3: "reads as a hard
// stone/ice block or fish tank: rigid hexagon silhouette, straight waterline" — "bulge the side faces 1-2 px outward
// and let the top rim sag/wobble per frame so the silhouette is a soft quivering jelly, not a hard hexagon".
// - the two vertical side edges bow outward on a sine, 0 px at the top corner and the bottom, 2 px at the middle
//   (1-3 px, breathing with the frame), each new pixel filled with the face's own colour and re-inked at the edge;
// - the top rim's outline wobbles column by column (a sine of x shifted per frame: 1 px sags and 1 px swells), so
//   the top's straight diagonals become a soft trembling skin.
// Coordinates are found per frame from the silhouette; colours are copied from the pixels beside (R11: tokens only).
export const base = 'base.v3';
export const meta = { notes: 'side faces bow out 1-3 px, the top rim wobbles 1 px per frame' };

export function finish(g, ctx) {
  const { px } = ctx.lib, W = g.w, H = g.h, f = ctx.frame;
  const op = (x, y) => g.alpha(x, y) === 255;
  const tok = (x, y) => px.tokenAt(g, [x, y]);
  // silhouette per row
  const rows = [];
  for (let y = 0; y < H; y++) {
    let l = -1, r = -1;
    for (let x = 0; x < W; x++) if (op(x, y)) { if (l < 0) l = x; r = x; }
    rows[y] = l < 0 ? null : [l, r];
  }
  const ys = rows.map((v, y) => (v ? y : -1)).filter(y => y >= 0);
  if (!ys.length) return g;
  // the top rim: column by column, before the sides move
  const xL = Math.min(...ys.map(y => rows[y][0])), xR = Math.max(...ys.map(y => rows[y][1]));
  const xc = (xL + xR) / 2;
  for (let x = xL + 4; x <= xR - 4; x++) {
    if (Math.abs(x - xc) <= 3) continue; // the back corner stays put
    let yt = -1;
    for (let y = 0; y < H; y++) if (op(x, y)) { yt = y; break; }
    if (yt < 0 || tok(x, yt) !== 'outline') continue;
    const d = Math.round(Math.sin(x * 0.22 + f * 1.7) * 0.9);
    if (d > 0) { const under = tok(x, yt + 2) ?? 'grass.0'; g.clear(x, yt); px.set(g, [x, yt + 1], 'outline'); px.set(g, [x, yt + 2], under); }
    else if (d < 0) { px.set(g, [x, yt - 1], 'outline'); px.set(g, [x, yt], tok(x, yt + 1) ?? 'grass.0'); }
  }
  // the side faces: rows whose edge sits on the vertical side (within 1 px of the extreme column)
  for (const side of [-1, 1]) {
    const edge = y => rows[y][side < 0 ? 0 : 1], ext = side < 0 ? xL : xR;
    const vy = ys.filter(y => Math.abs(edge(y) - ext) <= 1);
    if (vy.length < 6) continue;
    const y0 = Math.min(...vy), y1 = Math.max(...vy), amp = 2 + Math.round(Math.sin(f * Math.PI / 2 + (side > 0 ? 1 : 0)));
    for (let y = y0; y <= y1; y++) {
      const b = Math.round(amp * Math.sin(Math.PI * (y - y0) / (y1 - y0)));
      if (b <= 0) continue;
      const e = edge(y), fill = tok(e - side * 2, y) ?? tok(e - side, y) ?? 'grass.1';
      for (let k = 0; k < b; k++) px.set(g, [e + side * k, y], fill === 'outline' ? 'outline' : fill);
      px.set(g, [e + side * b, y], 'outline');
    }
  }
  return g;
}
