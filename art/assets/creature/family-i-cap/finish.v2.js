// family-i-cap finish.v2 (f) on base.v4 — the one direct-pixel pass (R2), re-finishing the best base (R12), for the
// review of base.v4: "bodies read as beetles/ladybirds, not wasps" — "give each wasp a striped abdomen with a stinger
// (2 dark bands on the recolour ramp, a 1 px pointed tip) and narrow it at the waist".
// Each wasp of the base is found from the base's own cloud table (the same sizes, offsets, per-wasp jitter and attack
// surge as base.v4, mirrored in e and n) and its abdomen is repainted, back to front as the base draws them:
// - a 1 px waist: the abdomen's first column is inked above and below, leaving one body pixel joining it to the thorax;
// - a rounder abdomen in the light ramp step with TWO dark bands (accent.2, the recolour ramp) instead of the old
//   outline checker that read as ladybird spots;
// - a stinger: the abdomen tapers to a single ink pixel standing alone at the tail (the ring round it cleared).
// The head, eye, thorax, legs and wings are left as the base draws them. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { notes: 'each wasp: 1 px waist, an abdomen with two dark accent bands, a lone 1 px stinger tip' };

// the base's cloud (base.v4): [size, dx, dy] of each wasp's top-left from the frame's centre point, and the jitter
const FRONT = [['S', -9, -17], ['S', 6, -14], ['M', -4, -11], ['M', -14, -6], ['M', 3, -3], ['S', -6, -1], ['L', -13, 4], ['L', 1, 7]];
const BACK = [['S', 4, -18], ['S', -11, -13], ['M', 0, -11], ['M', 6, -5], ['M', -13, -3], ['S', -3, -2], ['L', -9, 6], ['L', 4, 4]];
const JX = [[0, 1, -1, 2], [1, -1, 0, -2], [-1, 0, 2, 1], [2, 0, -1, -1], [0, -2, 1, 0], [-1, 1, 1, -2], [1, 2, 0, -1], [-2, 0, -1, 1]];
const JY = [[1, 0, -1, 0], [0, -1, 1, 1], [-1, 1, 0, -1], [0, 1, -1, 1], [1, -1, 0, 0], [-1, 0, 1, -1], [0, -1, 1, 0], [1, 0, 0, -1]];
const ROWS = { L: 5, M: 4, S: 3 };
const LUNGE = { attack: [-0.12, 0.05, 0.3, 0.08] };

// the abdomen patches, heading left (x from the wasp's top-left): '.' leave, a light, b mid, c dark band, o ink,
// _ clear the ink ring (so the stinger tip stands alone)
const PATCH = {
  L: ['...........', '...........', '....oacao__', '....bacbco_', '....obcbo__'],
  M: ['...........', '....oacao__', '....bacbco_', '....obcbo__'],
  S: ['......', '..bcaco_', '..ocao__'],
};
const TOK = { a: 'accent.0', b: 'accent.1', c: 'accent.2', o: 'outline' };

export function finish(g, ctx) {
  const { px } = ctx.lib, W = g.w, H = g.h;
  const back = ctx.facing === 'n' || ctx.facing === 'w', flip = ctx.facing === 'e' || ctx.facing === 'n';
  const f = ctx.frame % 4, L = (LUNGE[ctx.state]?.[f] ?? 0) * 8, F = back ? [-0.894, -0.447] : [-0.894, 0.447];
  const ox = W / 2 + F[0] * L * 0.5, oy = 20 + F[1] * L;
  // the floor shadow per row (partial alpha), to put back where a ring pixel is cleared
  const shade = {};
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = g.alpha(x, y);
    if (a > 0 && a < 255) { const i = (y * W + x) * 4, s = shade[y] ??= { x0: x, x1: x, rgba: [...g.d.slice(i, i + 4)] }; s.x0 = Math.min(s.x0, x); s.x1 = Math.max(s.x1, x); }
  }
  const X = x => (flip ? W - 1 - x : x);
  const wasps = (back ? BACK : FRONT).map(([sz, dx, dy], i) => ({ sz, x0: Math.round(ox + dx + JX[i][f]), y0: Math.round(oy + dy + JY[i][f]), i }));
  wasps.sort((a, b) => a.y0 + ROWS[a.sz] - (b.y0 + ROWS[b.sz]) || a.i - b.i);
  for (const { sz, x0, y0 } of wasps) {
    PATCH[sz].forEach((row, ry) => [...row].forEach((ch, rx) => {
      if (ch === '.') return;
      // the back view's wings cover the waist's top: leave the wing there
      if (back && sz === 'L' && ch === 'o' && rx === 4 && ry === 2) return;
      const x = X(x0 + rx), y = y0 + ry;
      if (ch === '_') {
        if (px.tokenAt(g, [x, y]) !== 'outline') return;
        g.clear(x, y);
        const s = shade[y];
        if (s && x >= s.x0 && x <= s.x1) g.d.set(s.rgba, (y * W + x) * 4);
        return;
      }
      px.set(g, [x, y], TOK[ch]);
    }));
  }
  return g;
}
