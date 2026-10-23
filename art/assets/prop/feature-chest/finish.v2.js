// finish.v2 (f2) on base.v5 — the one direct-pixel pass (R2). base.v5 review note acted on: the open and looted lids
// were a clump of iron bands at 1x, and only a small cream patch told the two states apart.
// - Open / looted: the top half is repainted as one lid board standing on the back edge and leaning back (inner face
//   wood.1, a wood.2 hinge line where it meets the rim, a wood.2 side), with ONE iron band along its top edge and the
//   2 x 2 bright hasp on that band. The body's front and right faces stay the base's.
// - The box top is a plain wood rim (the two straps run over the front rim) around the well.
// - Open: the well is heaped with goods (metal.1 shade, accent.0 coins, metal.2 gaps) with a 3 x 2 glow.0 glint at the
//   crest. Looted: the same well, empty: a plain dark leather floor (leather.2) under a wood.2 far inner wall.
// - Closed is untouched. Colours are direction tokens (R11).
export const base = 'base.v5';
export const meta = { notes: 'open/looted: one lid board with one band + hasp; open 3x2 glint on the heap; looted plain dark leather well' };

// Patch window: frame x 6..29, y 9..26 (top-left corner at TOP). '_' clears, '.' keeps the base (body faces).
const TOP = [6, 9];
const OPEN = [
  '________________________',
  '________________________',
  '__________kk____________',
  '_________ksskk__________',
  '_________kwwsskk________',
  '________kswwwHHskk______',
  '________kwwwwHHwsskk____',
  '_______kswwwwwwwwwssk___',
  '_______kwwwwwwwwwwwdk___',
  '______kkddwwwwwwwwwdk___',
  '____kkwwmmddwwwwwwwdk___',
  '__kkwwmmcGGGddwwwwwk____',
  '_kwwcnccmGGGmmddwwdk____',
  '_...sscnmcmmcccnddk_____',
  '_.....wwnmcccnnmwwk_____',
  '_.......ssnmmmww..._____',
  '_.........wwww....._____',
  '_.................._____',
];
const LOOTED = [
  '________________________',
  '________________________',
  '__________kk____________',
  '_________ksskk__________',
  '_________kwwsskk________',
  '________kswwwHHskk______',
  '________kwwwwHHwsskk____',
  '_______kswwwwwwwwwssk___',
  '_______kwwwwwwwwwwwdk___',
  '______kkddwwwwwwwwwdk___',
  '____kkwwvvddwwwwwwwdk___',
  '__kkwwvvhhvvddwwwwwk____',
  '_kwwvvhhhhhhvvddwwdk____',
  '_...sshhhhhhhhvvddk_____',
  '_.....wwhhhhhhhhwwk_____',
  '_.......sshhhhww..._____',
  '_.........wwww....._____',
  '_.................._____',
];
// k outline, w wood.1 (rim, lid face), d wood.2 (hinge, lid side), s metal.1 (band, strap ends), H metal.0 (hasp),
// m metal.1 heap shade, c accent.0 coin, n metal.2 gap between coins, G glow.0 glint, v wood.2 far inner wall, h leather.2 floor
const KEY = { k: 'outline', w: 'wood.1', d: 'wood.2', s: 'metal.1', H: 'metal.0', m: 'metal.1', c: 'accent.0', n: 'metal.2', G: 'glow.0', v: 'wood.2', h: 'leather.2' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  if (ctx.state === 'open') px.patch(g, TOP, OPEN, KEY, { anchor: 'topleft' });
  else if (ctx.state === 'looted') px.patch(g, TOP, LOOTED, KEY, { anchor: 'topleft' });
  return g;
}
