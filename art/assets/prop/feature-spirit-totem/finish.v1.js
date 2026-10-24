// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), on what the v3 review named:
// 1. the middle (raven) face was a muddle: it is repainted as a clear face — a lit brow (wood.0 along the top and the
//    lit left edge, the one highlight edge), two 2 x 2 dark eyes set wide, and a pale beak (wood.0 / wood.1) running
//    down the centre between outlined cheeks into the bear's brow;
// 2. the wings' noisy clusters and stray pixels: each wing's inside is re-toned in clean bands that keep the base's
//    silhouette exactly — a lit leading edge (wood.0 left, wood.1 on the shaded right wing), one solid dark feather
//    band (wood.2), wood.1 below, and dark wood.2 only on the one-pixel feather tips, so the tips read as tidy points.
// Silhouette, bird head, glowing eye, bear and footing unchanged. Tokens only (R11).
export const base = 'base.v3';
export const meta = { notes: 'raven face repainted (lit brow, two eyes, centre beak); wings re-toned in clean bands, tidy tips' };

const KEY = { a: 'wood.0', b: 'wood.1', c: 'wood.2', '#': 'outline' };
// the raven's face, x 10..21, rows 14..21 ('=' keeps the base pixel)
const RAVEN = [
  '=##########=',
  '=aaaabbbbcc=',
  '=a##baab##c=',
  '=b##baab##c=',
  '=bbb#aa#bcc=',
  '=bbb#aa#ccc=',
  '#####ab#####',
  '###==a######',
];

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const W = g.w, cx = W / 2;
  const solid = (x, y) => { const t = px.tokenAt(g, [x, y]); return t && t !== 'outline'; };
  // 2. wings: rows 7..13, outside the bird's head (x <= cx-5 on the left, x >= cx+4 on the right)
  for (let y = 7; y <= 13; y++) {
    for (let x = 0; x < W; x++) {
      const left = x <= cx - 5, right = x >= cx + 4;
      if (!(left || right) || !solid(x, y)) continue;
      const inner = left ? x === cx - 5 : x === cx + 4;
      const tip = !solid(x - 1, y) && !solid(x + 1, y) && !solid(x, y + 1);
      let t;
      if (y === 7) t = left ? 'wood.0' : 'wood.1';
      else if (y === 8) t = 'wood.1';
      else if (y <= 10) t = inner ? 'wood.1' : 'wood.2';
      else t = tip ? 'wood.2' : 'wood.1';
      px.set(g, [x, y], t);
    }
  }
  // 1. raven face
  RAVEN.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '=') px.set(g, [cx - 6 + i, 14 + j], KEY[ch]); }));
  return g;
}
