// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2). Review notes acted on (base.v3 score): "the body shading
// is horizontal light-dark stripes (banding) so it reads as a striped pot … shade the belly as one curved light from
// the upper left"; "smashed reads as an intact flat dish or tray, not broken shards … a broken base ring with a jagged
// rim plus 3-4 separate shards scattered on the floor diamond".
// closed: the urn is repainted in place on the base's own silhouette, without the inner part outlines that striped it:
// a lip ellipse round a dark mouth, a narrow neck, and one round belly lit from the upper left (leather.0), mid clay
// (leather.1) across it and the dark step (leather.2) only on the lower right.
// smashed: a broken foot ring with two jagged tips at the back and a dark empty inside, plus four separate shards on
// the floor diamond (left, right, front, front-right). Same two-step clay. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'urn repainted as one round lit belly (no banding); smashed = jagged broken ring + 4 shards' };

// k outline, L lit clay (leather.0), M mid clay (leather.1), D dark clay (leather.2), m mouth / empty inside (stone.2)
const URN = [ // top-left at (10, 11)
  '____________',
  '____kkkk____',
  '___kLmmMk___',
  '__kLmmmmMk__',
  '___kLLMMk___',
  '____kLMk____',
  '__kkLLMMkk__',
  '_kLLLLMMMDk_',
  'kLLLLLMMMMDk',
  'kLLLLMMMMMDk',
  'kLLLMMMMMDDk',
  'kMMMMMMMMDDk',
  '_kMMMMMMDDk_',
  '__kMMMDDDk__',
  '___kkkkkk___',
];
const SHARDS = [ // top-left at (6, 17)
  '______________________',
  '______________________',
  '________kk____________',
  '_______kLk__kk________',
  '______kLLMkkLMk__kkk__',
  '_____kLmmmmmmMk_kLMMk_',
  '_kkk_kLmmmmmmMk__kkk__',
  'kLMMkkLLmmmmMDk_______',
  '_kkk__kLLLMMDk________',
  '_______kkkkkk__kkk____',
  '______________kLMk____',
  '_______________kk_____',
];

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const clay = { k: 'outline', L: 'leather.0', M: 'leather.1', D: 'leather.2', m: 'stone.2' };
  if (ctx.state === 'smashed') px.patch(g, [6, 17], SHARDS, clay, { anchor: 'topleft' });
  else px.patch(g, [10, 11], URN, clay, { anchor: 'topleft' });
  return g;
}
