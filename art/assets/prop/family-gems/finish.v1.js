// finish.v1 (f) on base.v1 — the one direct-pixel pass (R2). The review asked for clean pixels and both gem colours
// readable at 1x, apart from family-ring (a red dot). v1's three overlapping stamps left stray ink and the small pale
// gem broke both gems into a notched heart; this pass repaints the cluster cleanly: a red and a blue cut gem side by side
// (red in front, blue a row behind), each with a bright top facet (glow.0 corner + its ramp's light step), pointed
// cut bottoms and one ink outline. The pale third gem is dropped (it was the source of the stray pixels).
// Tokens only (R11).
export const base = 'base.v1';
export const meta = { notes: 'clean red + blue gem pair, bright top facet on each, pale stray gem removed' };

const GEMS = [
  '________XXX___',
  '__XXX__XGccX__',
  '_XGrRXXcGcbBX_',
  'XGrRRRXccbBKX_',
  'XrRRRDXXBBKX__',
  '_XRRDX__XKX___',
  '__XDX____X____',
  '___X__________',
  '______________',
];

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const cx = g.w >> 1, cy = g.h - 8; // the cell centre (16, 24)
  px.patch(g, [cx - 7, cy - 5], GEMS, {
    X: 'outline', G: 'glow.0',
    r: 'accent.0', R: 'accent.1', D: 'accent.2',
    c: 'cloth.0', b: 'cloth.1', B: 'cloth.1', K: 'cloth.2',
  }, { anchor: 'topleft' });
  return g;
}
