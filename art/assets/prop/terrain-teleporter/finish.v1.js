// finish.v1 (f) on base.v4 — the one direct-pixel pass (R2), doing the 6.5 review's four asks in order:
// 1) the ring stones are repainted as eight flat, regular carved blocks (top face stone light on the upper left, stone
//    mid elsewhere, front face stone mid with a stone-dark right end), replacing base.v4's near-black rounded lumps;
// 2) no stone sits at the top or bottom centre any more (blocks at 22.5 + 45k degrees), so the spikes are gone;
// 3) the 1 px rim inside the stones is drawn in every frame, only its brightness varies (glow.1 bright, accent.1 dim);
// 4) the light at the centre is a 3 px mote (core plus one pixel each side); the rising sparks are removed.
// The inner floor keeps base.v4's stone-dark with its stone-mid wear patch. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { notes: 'carved block stones (light/mid), no centre spikes, rim visible every frame, 3 px mote, no sparks' };

// one carved block, 6 x 5: outline, two rows of top face, one row of front face, outline
const BLOCK = [
  '.oooo.',
  'oLLLMo',
  'oLMMMo',
  'oMMMDo',
  '.oooo.',
];
const KEY = { o: 'outline', L: 'stone.0', M: 'stone.1', D: 'stone.2' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const W = g.w, H = g.h, s = W / 32;
  const cx = W / 2, cy = H - 8;                          // the bottom diamond's centre
  const fr = (ctx.frame || 0) % 4, hi = fr === 0 || fr === 3;

  // keep base.v4's inner floor (stone dark + mid wear patch) as reference, then clear the cell
  const floorTok = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = px.tokenAt(g, [x, y]);
    floorTok.push(t);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.clear(x, y);

  // the floor inside the ring and its 1 px rim (ellipse flat on the floor, 2:1)
  const rx = 8 * s, ry = 4 * s;
  const inE = (x, y) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
  const rimTok = hi ? 'glow.1' : 'accent.1';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inE(x, y)) continue;
    const edge = !inE(x - 1, y) || !inE(x + 1, y) || !inE(x, y - 1) || !inE(x, y + 1);
    let t = 'stone.2';
    if (!edge) { const b = floorTok[y * W + x]; if (b === 'stone.1') t = 'stone.1'; }
    px.set(g, [x, y], edge ? rimTok : t);
  }

  // the centre mote: 3 px, a core and one step of falloff either side
  const mx = Math.round(cx), my = Math.round(cy);
  const core = ['glow.0', 'accent.0', 'accent.1', 'accent.0'][fr];
  const fall = ['glow.1', 'accent.1', 'accent.2', 'accent.1'][fr];
  px.set(g, [mx - 1, my], fall); px.set(g, [mx + 1, my], fall); px.set(g, [mx, my], core);

  // eight carved blocks on a ring outside the rim, none at the top or bottom centre; drawn back to front
  const RX = 11.5 * s, RY = RX / 2;
  const stones = [];
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    stones.push([Math.round(cx + Math.cos(a) * RX - 3), Math.round(cy + Math.sin(a) * RY - 2.5)]);
  }
  stones.sort((p, q) => p[1] - q[1]);
  for (const [ox, oy] of stones) {
    BLOCK.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.') return;
      const x = ox + i, y = oy + j;
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      px.set(g, [x, y], KEY[ch]);
    }));
  }
  return g;
}
