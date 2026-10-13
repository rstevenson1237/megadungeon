// family-s-cap finish.v1 (f) on base.v2 — the one direct-pixel pass (R2), for the review of base.v3: "head reads as
// a helmeted bird/robot: the 2x2 red eye sits mid-face and the hood is no wider than the head".
// - the 2x2 red hood mark (read as an eye in mid-face) is painted out with the hood's own grass steps;
// - the real eye, at the side of the wedge head, becomes a single red pixel;
// - the hood flares behind the head: its rows below the head (3) are pushed out 1-2 px on each side (new edge inked),
//   so the hood spreads wider than the neck and the head, a cobra's hood rather than a collar.
// Coordinates are taken in the s/n frame and mirrored for e/w. Colours are direction tokens (R11).
export const base = 'base.v2';
export const meta = { notes: 'hood mark out, 1 px red eye, hood flared 1-2 px each side' };

export function finish(g, ctx) {
  const { px } = ctx.lib, W = g.w, flip = ctx.facing === 'e' || ctx.facing === 'w', back = ctx.facing === 'n' || ctx.facing === 'w';
  const X = x => (flip ? W - 1 - x : x);
  const at = (x, y) => (x < 0 || x >= W || y < 0 || y >= g.h ? null : px.tokenAt(g, [X(x), y]));
  const set = (x, y, t) => px.set(g, [X(x), y], t);
  const empty = t => !t || t === 'transparent' || t === 'clear';
  const [hx, hy] = ctx.anchors.head.map((v, i) => (i === 0 ? X(v) : v));
  if (!back) {
    for (let y = hy - 4; y <= hy + 4; y++) for (let x = 0; x < W; x++) {
      const t = at(x, y);
      if (!t || !t.startsWith('accent.')) continue;
      if (x >= hx - 3 && y >= hy) set(x, y, 'grass.1');              // the hood mark
      else if (t === 'accent.0' && y < hy) set(x, y, 'accent.1');                  // the eye: one red pixel
    }
  }
  // the hood flare: rows under the head, pushed out on both sides
  const flare = [1, 2, 2], y0 = back ? hy + 1 : hy + 1, x0 = back ? hx - 2 : hx + 1, added = [];
  flare.forEach((f, i) => {
    const y = y0 + i;
    if (empty(at(x0, y))) return;
    let L = x0, R = x0;
    while (!empty(at(L - 1, y))) L--;
    while (!empty(at(R + 1, y))) R++;
    for (const [edge, dir, fill] of [[L, -1, 'grass.1'], [R, 1, 'grass.2']]) {
      let ok = true;
      for (let k = 1; k <= f; k++) if (!empty(at(edge + dir * k, y))) ok = false;
      if (!ok) continue;
      set(edge, y, fill); added.push([edge, y]);
      for (let k = 1; k < f; k++) { set(edge + dir * k, y, fill); added.push([edge + dir * k, y]); }
      set(edge + dir * f, y, 'outline');
    }
  });
  // ink any new fill pixel that now touches the outside
  for (const [x, y] of added) if ([[0, -1], [0, 1]].some(([dx, dy]) => empty(at(x + dx, y + dy)))) set(x, y, 'outline');
  return g;
}
