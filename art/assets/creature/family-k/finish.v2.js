// family-k finish.v2 (f) on base.v4 — the one direct-pixel pass (R2), re-finishing the best base (R12), for the
// review of base.v4: "reads as a rat-man or dog, not a reptilian kobold, and a heavy dark mass down its left side
// muddies the 1x read" — "give the head a forward reptile snout (3-4 px) with two small back-swept horns in place of
// the round ears, and cut the dark left-side mass to a 1 px outline".
// - the head is repainted at final resolution at the `head` anchor (so it follows the bob and the attack): a broad
//   egg skull, a flat reptile snout running 4 px forward from it with a lit top, a dark underjaw and an ink mouth corner,
//   the two eyes set on the head's sides; from behind, the skull with the snout's root showing past it. The round
//   ears are cleared and two thin horns rise from the crown, swept back (1 px leather strokes, light at the tip),
//   ringed in ink;
// - below the head, on the pick-hand side, every run of 3 or more ink pixels along the silhouette's edge is cut to
//   a 1 px outline: the inner pixels become the shaded scales (skin.2), so the arm reads instead of a black mass.
// Front views draw `s` (mirrored for `e`); back views `w` (mirrored for `n`). Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { notes: 'reptile snout 4 px and two back-swept horns repainted at the head anchor; left-side ink mass cut to a 1 px outline' };

// [dx, dy, token] from the head anchor, for s (heading screen-left); e and n mirror them
const HORNS = [[-1, -5, 'leather.1'], [0, -6, 'leather.0'], [2, -5, 'leather.1'], [3, -6, 'leather.1'], [4, -6, 'leather.0']];
const rows = (spec) => spec.flatMap(([dy, x0, toks]) => toks.split(' ').map((t, i) => [x0 + i, dy, t]));
const T = { a: 'skin.0', b: 'skin.1', c: 'skin.2', e: 'accent.1', o: 'outline' };
// [dy, first dx, tokens left to right]
const FRONT = rows([
  [-4, -1, 'a a b b'],
  [-3, -2, 'a a b b c c'],
  [-2, -2, 'a b b b c c'],
  [-1, -5, 'a a a e b b c e c'],
  [0, -6, 'b b b b b b c b c'],
  [1, -5, 'c c c o c c c c'],
]);
const BACK = rows([
  [-4, -1, 'a a b b'],
  [-3, -2, 'a b b b c c'],
  [-2, -4, 'b b a b b b c c'],
  [-1, -4, 'c c b b b c c c'],
  [0, -2, 'b b c c c c'],
  [1, -1, 'c c c c'],
]);

export function finish(g, ctx) {
  const { px } = ctx.lib, W = g.w;
  const back = ctx.facing === 'n' || ctx.facing === 'w', flip = ctx.facing === 'e' || ctx.facing === 'n';
  const a = ctx.anchors, [ax, ay] = a.head, s = flip ? -1 : 1;
  const P = (dx, dy) => [ax + s * dx, ay + dy];
  const op = (x, y) => g.alpha(x, y) === 255;

  // 1. the head: clear the old head and ears, paint the new one, ring it in ink
  // the old head is skin, its ears leather (right of the anchor), and their ink; the raised pick (cloth, a leather
  // haft left of the anchor) and the ink beside it are kept
  const zone = [];
  for (let dy = -8; dy <= 1; dy++) for (let dx = -7; dx <= 6; dx++) zone.push([dx, dy]);
  for (let dx = -7; dx <= -4; dx++) zone.push([dx, 2]); // the old muzzle's lowest row
  const tokAt = q => px.tokenAt(g, q);
  const keep = ([dx, dy]) => { const t = tokAt(P(dx, dy)); return !!t && (t.startsWith('cloth') || (t.startsWith('leather') && dx < -1)); };
  const kept = new Set(zone.filter(keep).map(([dx, dy]) => P(dx, dy).join(',')));
  const nearKept = q => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([u, v]) => kept.has([q[0] + u, q[1] + v].join(',')));
  for (const [dx, dy] of zone) {
    const q = P(dx, dy), t = tokAt(q);
    if (!t || kept.has(q.join(','))) continue;
    if (t === 'outline' && nearKept(q)) continue;
    g.clear(...q);
  }
  const fill = [...(back ? BACK : FRONT).map(([dx, dy, t]) => [dx, dy, T[t]]), ...HORNS];
  const own = new Set(fill.map(([dx, dy]) => P(dx, dy).join(',')));
  for (const [dx, dy] of fill) for (const [u, v] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const q = P(dx + u, dy + v);
    if (!own.has(q.join(',')) && !op(...q)) px.set(g, q, 'outline');
  }
  for (const [dx, dy, t] of fill) px.set(g, P(dx, dy), t);

  // 2. the pick-hand side: ink runs of 3+ along the silhouette edge cut to a 1 px outline
  const left = (a.hand?.[0] ?? ax) <= ax, yEnd = (a.ground?.[1] ?? g.h) - 3;
  for (let y = ay + 2; y <= yEnd; y++) {
    const xs = [];
    for (let x = 0; x < W; x++) if (op(x, y)) xs.push(x);
    if (!xs.length) continue;
    const step = left ? 1 : -1, x0 = left ? xs[0] : xs[xs.length - 1];
    let n = 0;
    while (op(x0 + step * n, y) && px.tokenAt(g, [x0 + step * n, y]) === 'outline') n++;
    if (n < 3 || !op(x0 + step * n, y)) continue;
    for (let k = 1; k < n - 1; k++) px.set(g, [x0 + step * k, y], 'skin.2');
  }
  return g;
}
