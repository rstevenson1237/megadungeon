// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), for the review's "wide-open round eye plus even grin
// reads goofy in idle and walk". Two ops, found on the drawn pixels (the base exports no face anchors):
// 1. a heavy upper lid: wherever the great eye is still fully open (its top rows are eye-white cloth — idle, walk,
//    hurt; the attack keeps its own), the attack's lid is painted over it: hide (skin.1) down to a line slanting
//    lower toward the face's turned side, edged with an outline row, so the eye glares in every state.
// 2. uneven fangs: the upper fangs (cloth.0 runs hanging from the top of the maw) are lengthened or cut back by a
//    fixed pattern (+2, -1, +1, -1, +2 px), so the grin reads ragged, not even.
// Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'heavy upper lid over the great eye in every frame; ragged uneven upper fangs' };

const is = (t, ...ramps) => t && ramps.some(r => t === r || t.startsWith(r + '.'));

export function finish(g, ctx) {
  const { px } = ctx.lib, back = ctx.facing === 'n' || ctx.facing === 'w', flip = ctx.facing === 'e';
  px.fix.orphans(g);
  if (back) return g;
  const tok = (x, y) => px.tokenAt(g, [x, y]);
  // the iris: the accent pixels (only the great eye uses the accent ramp)
  let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (is(tok(x, y), 'accent')) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return g;
  const ex = Math.round((x0 + x1) / 2) + (flip ? -1 : 1), ey = Math.round((y0 + y1) / 2), rx = 8, ry = 7;
  // the eye's top: the highest eye-white pixel in the eye's centre column
  let top = ey - ry - 2;
  while (top < ey && !is(tok(ex, top), 'cloth')) top++;
  const open = ctx.state !== 'attack' && top < ey - 3; // fully open (the attack draws its own lid)
  if (open) {
    // the lid line, deeper on the face's turned side (viewer's left in s, right in e)
    const deep = 2.8, shallow = 1.2;
    for (let x = ex - rx; x <= ex + rx; x++) {
      const t = (x - (ex - rx)) / (2 * rx), d = flip ? shallow + (deep - shallow) * t : deep + (shallow - deep) * t;
      const cut = Math.round(top + d);
      for (let y = ey - ry - 2; y <= cut + 1; y++) {
        const c = tok(x, y);
        if (!(is(c, 'cloth', 'accent') || (c === 'outline' && y > top && Math.abs(x - ex) < rx - 1))) continue;
        px.set(g, [x, y], y <= cut ? 'skin.1' : 'outline');
      }
    }
  }
  // the upper fangs: cloth.0 runs below the eye, grouped by column
  const below = ey + ry - 1, cols = [];
  for (let x = 0; x < g.w; x++) {
    let lo = -1, hi = -1;
    for (let y = below; y < g.h; y++) if (tok(x, y) === 'cloth.0') { if (lo < 0) lo = y; hi = y; } else if (lo >= 0) break;
    if (lo >= 0) cols.push([x, lo, hi]);
  }
  if (!cols.length) return g;
  const mawTop = Math.min(...cols.map(c => c[1]));
  const fangs = [];
  for (const c of cols.filter(c => c[1] <= mawTop + 2)) {
    const f = fangs[fangs.length - 1];
    if (f && c[0] === f[f.length - 1][0] + 1) f.push(c); else fangs.push([c]);
  }
  const pattern = [2, -1, 1, -1, 2];
  (flip ? fangs.slice().reverse() : fangs).forEach((f, i) => {
    const by = pattern[i % pattern.length], [tx, , ty] = f.reduce((a, c) => (c[2] > a[2] ? c : a));
    if (by > 0) { for (let j = 1; j <= by; j++) if (tok(tx, ty + j) === 'outline') px.set(g, [tx, ty + j], 'cloth.0'); }
    else for (const [x, lo, hi] of f) if (hi > lo && hi >= ty - 0) px.set(g, [x, hi], 'outline');
  });
  return g;
}
