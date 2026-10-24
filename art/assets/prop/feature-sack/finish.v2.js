// finish.v2 (f2) on base.v5 — the one direct-pixel pass (R2). base.v5 review note acted on: the open sack's body was a
// pointed wedge to the lower left (a slipper or helmet, not a sack), and the mouth's light near lip read as a ring.
// - Open: the body is repainted as a rounded, slumped bag — a low dome over a soft, squarer bottom, wider than the
//   closed sack, standing on the cell's centre; lit (wood.0) on the upper left, wood.1 across the middle and wood.2 on
//   the lower right. The flopped neck that made the wedge is gone.
// - The mouth stays a dark ellipse (outline ink) right of the lit shoulder, but every rim pixel round it, the near lip
//   included, is the cloth's middle step (wood.1), so the mouth sits inside the cloth instead of in a light ring.
// - A short ground shadow (the base's own shadow pixel) runs under the bag's foot.
// - Closed and looted are untouched. Colours are direction tokens (R11).
export const base = 'base.v5';
export const meta = { notes: 'open: rounded slumped bag, mouth rimmed in the mid step, shadow under the foot' };

// Frame x 4..27, y 12..29 (top-left at AT). '_' clears a base pixel, '.' keeps the base (its ground shadow).
// k outline / mouth, c lit cloth (wood.0), b mid cloth (wood.1), d shaded cloth (wood.2)
const AT = [4, 12];
const OPEN = [
  '........................',
  '........................',
  '........................',
  '........................',
  '.......kkkkkkkkk........',
  '......kcccbbbbbbk.......',
  '.....kcccbbkkkkbbk......',
  '....kccccbkkkkkkbdk.....',
  '...kcccbbbbkkkkbbddk....',
  '...kccbbbbbbbbbbdddk....',
  '...kbbbbbbbddddddddk....',
  '...kbbbbbbdddddddddk....',
  '..._kbbbddddddddddk.....',
  '..___kkkdddddddkkk......',
  '..______kkkkkkk.........',
  '...____.................',
  '........................',
  '........................',
];

export function finish(g, ctx) {
  const { px } = ctx.lib;
  if (ctx.state !== 'open') return g;
  px.patch(g, AT, OPEN, { k: 'outline', c: 'wood.0', b: 'wood.1', d: 'wood.2' }, { anchor: 'topleft' });
  // the base's own ground-shadow pixel (partial alpha, so copied as raw RGBA) at (14, 27), run under the bag's foot
  const i = (27 * g.w + 14) * 4;
  for (let x = 11; x <= 19; x++) { const j = (27 * g.w + x) * 4; for (let k = 0; k < 4; k++) g.d[j + k] = g.d[i + k]; }
  return g;
}
