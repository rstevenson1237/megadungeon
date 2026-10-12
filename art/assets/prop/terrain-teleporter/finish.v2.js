// finish.v2 (f) on base.v5 — the one direct-pixel pass (R2), doing the base.v5 review's asks in order. base.v5's ten
// stones keep their places on the 2:1 ring (back stones small and behind the light, side stones at east and west, front
// stones larger and nearest), repainted pixel by pixel so that:
// 1) the four front stones are ~1 px lower (one front-face row, not two) and every pair of stones has at least a 1 px
//    gap of stone dark (the ring's bed), not outline, so the inner disc shows all round;
// 2) the inner floor holds a faint, low-contrast glow disc (stone dark → accent dark → accent mid core → accent light
//    core) that pulses smoothly over the 4 frames (dark, mid, light, mid); the 1 px rim stays on accent mid every frame;
// 3) no accent or glow pixel lands on a stone's face (the rising motes and the rim under the front stones are gone);
// 4) the two back side stones are standing stones, 3-4 px taller, each with a 1 x 2 accent rune notch.
// The silhouette is outlined once at the end (every transparent pixel touching a fill). Colours are tokens (R11).
export const base = 'base.v5';
export const meta = { notes: 'gapped stones, lower front stones, pulsing low-contrast floor disc, steady rim, two rune-notched standing stones' };

// stones: [left x, top-face row, width, front-face rows, kind] in a 32 x 32 frame (scaled by W / 32 below)
const STONES = [
  [6, 15, 3, 5, 'stand'], [23, 15, 3, 5, 'stand'],          // back side: standing stones with a rune notch
  [11, 17, 3, 1, 'chip'], [18, 17, 3, 1, ''],               // back middle: small, behind the light
  [2, 22, 4, 2, ''], [26, 22, 4, 2, 'chip'],                // west and east
  [4, 26, 4, 1, ''], [24, 26, 4, 1, ''],                    // front sides
  [11, 28, 4, 1, ''], [17, 28, 4, 1, 'chip'],               // front middle
];

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const W = g.w, H = g.h, s = W / 32;
  const cx = W / 2, cy = H - 8;                              // the bottom diamond's centre
  const fr = (ctx.frame || 0) % 4;                           // 0 dark, 1 mid, 2 light, 3 mid
  const lvl = [0, 1, 2, 1][fr];

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.clear(x, y);
  const T = new Array(W * H).fill(null);
  const put = (x, y, t) => { if (x >= 0 && y >= 0 && x < W && y < H) T[y * W + x] = t; };
  const ell = (rx, ry) => (x, y) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 < 1;

  // the ring's bed (stone dark): what shows in the gaps between the stones
  const bed = ell(12.5 * s, 6.25 * s), rim = ell(9 * s, 4.5 * s);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (bed(x, y) && !rim(x, y)) put(x, y, 'stone.2');

  // the inner floor: stone dark, a small worn patch, the 1 px rim always on accent mid, and the pulsing disc
  const disc1 = ell(5.5 * s, 2.75 * s), disc2 = ell(3 * s, 1.5 * s), wear = ell(2.2 * s, 0.9 * s);
  const outerT = ['stone.2', 'accent.2', 'accent.2'][lvl];
  const innerT = ['accent.2', 'accent.2', 'accent.1'][lvl];
  const coreT = ['accent.2', 'accent.1', 'accent.0'][lvl];
  const mx = Math.round(cx), my = Math.round(cy);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!rim(x, y)) continue;
    const edge = !rim(x - 1, y) || !rim(x + 1, y) || !rim(x, y - 1) || !rim(x, y + 1);
    let t = 'stone.2';
    if (edge) t = 'accent.1';
    else if ((x === mx - 1 || x === mx) && (y === my - 1 || y === my)) t = coreT;
    else if (disc2(x, y)) t = innerT;
    else if (disc1(x, y)) t = outerT;
    else if (wear(x + Math.round(3.5 * s), y + Math.round(2 * s))) t = 'stone.1';
    put(x, y, t);
  }

  // the stones, back to front: lit top face (stone light, mid at its right end), stone-mid front face with a
  // stone-dark right end; standing stones carry a 1 x 2 accent rune notch in the middle of their face
  const order = STONES.map(([x, y, w, f, k]) => [Math.round(x * s), Math.round(y * s), Math.round(w * s), Math.max(1, Math.round(f * s)), k])
    .sort((p, q) => (p[1] + p[3]) - (q[1] + q[3]));
  for (const [x0, yt, w, fh, k] of order) {
    for (let i = 0; i < w; i++) put(x0 + i, yt, i === w - 1 ? 'stone.1' : 'stone.0');
    for (let j = 1; j <= fh; j++) for (let i = 0; i < w; i++) put(x0 + i, yt + j, i === w - 1 ? 'stone.2' : 'stone.1');
    if (k === 'chip') put(x0, yt, T[(yt + 1) * W + x0 - 1] ? 'stone.2' : null);
    if (k === 'stand') { const nx = x0 + Math.floor(w / 2), ny = yt + Math.floor(fh / 2); put(nx, ny, 'accent.1'); put(nx, ny + 1, 'accent.2'); }
  }

  // one outline round the whole silhouette
  const filled = (x, y) => x >= 0 && y >= 0 && x < W && y < H && T[y * W + x] && T[y * W + x] !== 'outline';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    if (!T[y * W + x] && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) T[y * W + x] = 'outline';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (T[y * W + x]) px.set(g, [x, y], T[y * W + x]);
  return g;
}
