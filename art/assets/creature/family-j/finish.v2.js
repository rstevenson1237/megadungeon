// family-j finish.v2 (f) on base.v4 — the one direct-pixel pass (R2), re-finishing the best base (R12), for the
// review of base.v4: "reads as a solid glassy block: no translucency or wobble, attack barely changes the shape" —
// "lighten the lower third of each face to a see-through gradient with the floor shadow showing, and bulge the front
// face 3 px forward in attack contact frames".
// - the lower third of each side face lightens downward in an ordered dither (grass.2 -> grass.1 -> grass.0), so the
//   jelly thins to see-through at its foot, with a 1-2 px dark band just above the bottom ink: the floor shadow seen
//   through it;
// - in the attack, the lower body swells toward the viewer: the bottom edge bows down (3 px at the front corner in
//   the contact frame, 1 px either side of it) and the side faces swell out by 2 px, the new pixels copied from the
//   jelly beside them and re-inked at the edge.
// The cube has no face, so the template's face painting is left out. Colours come from the pixels beside (R11).
export const base = 'base.v4';
export const meta = { notes: 'see-through dithered lower third with the floor shadow; the front bulges 3 px in the attack contact frame' };

const BAYER = [[0, 2], [3, 1]];

export function finish(g, ctx) {
  const { px } = ctx.lib, W = g.w, H = g.h, f = ctx.frame;
  const op = (x, y) => g.alpha(x, y) === 255;
  const tok = (x, y) => px.tokenAt(g, [x, y]);
  px.fix.orphans(g);

  // per column: the bottom ink and the column's top
  const cols = [];
  for (let x = 0; x < W; x++) {
    let t = -1, b = -1;
    for (let y = 0; y < H; y++) if (op(x, y)) { if (t < 0) t = y; b = y; }
    cols[x] = t < 0 ? null : [t, b];
  }
  const xs = cols.map((c, x) => (c ? x : -1)).filter(x => x >= 0);
  if (!xs.length) return g;
  const xL = Math.min(...xs), xR = Math.max(...xs);

  // 1. the see-through lower third, the floor shadow at its foot
  const band = 12;
  for (let x = xL + 1; x < xR; x++) {
    const [, yb] = cols[x];
    for (let d = 1; d <= band; d++) {
      const y = yb - d, t0 = tok(x, y);
      if (t0 !== 'grass.1' && t0 !== 'grass.2') continue;
      if (d <= 2) { if (d === 1 || (x + y) % 2 === 0) px.set(g, [x, y], 'grass.2'); continue; } // the floor shadow
      const t = 1 - (d - 3) / (band - 3), th = (BAYER[y & 1][x & 1] + 0.5) / 4; // t: 0 at the band top, 1 at the foot
      if (t0 === 'grass.2' && th < t * 1.5) px.set(g, [x, y], 'grass.1');
      else if (t0 === 'grass.1' && th < (t - 0.45) * 1.3) px.set(g, [x, y], 'grass.0');
    }
  }

  // 2. the attack bulge toward the viewer
  const B = ctx.state === 'attack' ? [0, 1, 3, 1][f] ?? 0 : 0;
  if (B > 0) {
    const src = g.clone(), span = 10, xc = (xL + xR) / 2;
    // the bottom bows down, strongest at the front corner: stretch each column's lower rows
    for (let x = xL; x <= xR; x++) {
      if (!cols[x]) continue;
      const b = Math.round(B * Math.cos((Math.PI / 2) * Math.min(1, Math.abs(x - xc) / ((xR - xL) / 2))));
      if (b <= 0) continue;
      const yb = cols[x][1], y0 = Math.max(cols[x][0], yb - span);
      for (let y = yb + b; y >= y0; y--) {
        const sy = Math.round(y0 + (y - y0) * (yb - y0) / (yb + b - y0));
        const c = src.get(x, sy);
        if (c) g.set(x, y, c);
      }
    }
    // the side faces swell out in their lower half
    const rows = [];
    for (let y = 0; y < H; y++) {
      let l = -1, r = -1;
      for (let x = 0; x < W; x++) if (op(x, y)) { if (l < 0) l = x; r = x; }
      rows[y] = l < 0 ? null : [l, r];
    }
    const ys = rows.map((v, y) => (v ? y : -1)).filter(y => y >= 0);
    for (const side of [-1, 1]) {
      const edge = y => rows[y][side < 0 ? 0 : 1], ext = side < 0 ? xL : xR;
      const vy = ys.filter(y => Math.abs(edge(y) - ext) <= 1);
      if (vy.length < 6) continue;
      const y0 = Math.min(...vy), y1 = Math.max(...vy), amp = Math.max(1, B - 1);
      for (let y = y0; y <= y1; y++) {
        const b = Math.round(amp * Math.sin(Math.PI * Math.max(0, (y - y0) / (y1 - y0) - 0.3) / 0.7));
        if (b <= 0) continue;
        const e = edge(y), fill = tok(e - side * 2, y) ?? 'grass.1';
        for (let k = 0; k < b; k++) px.set(g, [e + side * k, y], fill === 'outline' ? 'grass.1' : fill);
        px.set(g, [e + side * b, y], 'outline');
      }
    }
  }
  return g;
}
