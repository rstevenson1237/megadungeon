// family-e finish.v2 (f) on base.v4 — the one direct-pixel pass (R2), re-finishing the best base (R12; finish.v1
// finished base.v3). Review of base.v4: "the coil is broken into noisy highlight shards (orph 8.9%) ... redraw n/w as
// the same low coil seen from behind". Redrawing n/w is a form change (a base revision), so it is left; this pass does
// the pixel part: the highlight shards are merged. Every body pixel (grass and cloth ramps) that shares its colour with
// none of its four neighbours takes the colour most of its body neighbours have (2 or more agreeing, outline never),
// in two sweeps, so single lit and dark specks join the tone around them and the coil shades in runs. The 1 px eye
// (accent) and the ink are untouched. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { pass: 'f', notes: 'isolated highlight/shadow specks on the coil merged into the surrounding tone (two sweeps)' };

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const body = t => !!t && (t.startsWith('grass.') || t.startsWith('cloth.'));

function despeckle(g, px) {
  const w = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const c = px.tokenAt(g, [x, y]);
    if (!body(c)) continue;
    const n = N4.map(([dx, dy]) => px.tokenAt(g, [x + dx, y + dy]));
    if (n.some(v => v === c)) continue;
    const counts = new Map();
    for (const v of n) if (body(v)) counts.set(v, (counts.get(v) ?? 0) + 1);
    const best = [...counts].sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] >= 2) w.push([x, y, best[0]]);
  }
  for (const [x, y, t] of w) px.set(g, [x, y], t);
}

export function finish(g, ctx) {
  const { px } = ctx.lib;
  px.fix.jaggies(g);
  despeckle(g, px);
  despeckle(g, px);
  return g;
}
