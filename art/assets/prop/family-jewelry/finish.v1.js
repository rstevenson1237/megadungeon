// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), as base.v3's review asked:
// - the chain was a smooth flat grey ellipse that read as a hoop: it is broken into links, 2 px clusters alternating
//   light and dark along the loop (near half metal.0 / metal.1, far half metal.1 / metal.2), so it reads as a chain;
// - the ring's top arc was all glow.0, so nothing stood out: the arc goes to the gold role (accent.0) and one glow.0
//   pixel stays on top as its highlight;
// - the blue cut pendant twinned family-gems' blue stone: it is repainted as a teardrop (a 1 px neck under the chain,
//   a round body, a closed bottom) in the leather ramp, a garnet drop (leather.0 body, leather.1 / leather.2 shade) with a glow.0 glint at its neck.
// Tokens only (R11).
export const base = 'base.v3';
export const meta = { notes: 'chain broken into alternating light/dark links, glow.0 highlight on the ring top, garnet teardrop pendant' };

// the pendant's rows from the base's top-left (cx - 6, cy + 3): '_' clears the old blue drop, '.' keeps the chain's ink
const DROP = [
  '__XGX__',
  '_XhhcX_',
  'XhhhccX',
  '_XhcEX_',
  '__XXX__',
];

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const cx = g.w >> 1, cy = g.h - 8; // the cell centre
  // the chain: the base's loop, link by link (two loop steps a link), alternating light and dark
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2, x = Math.round(Math.cos(a) * 6), y = Math.round(Math.sin(a) * 3.2);
    const at = [cx - 3 + x, cy - 2 + y], t = px.tokenAt(g, at);
    if (!t || !t.startsWith('metal')) continue; // the gold bail stays
    const dark = (i >> 1) % 2 === 1;
    px.set(g, at, y > 0 ? (dark ? 'metal.1' : 'metal.0') : y < 0 ? (dark ? 'metal.2' : 'metal.1') : (dark ? 'metal.2' : 'metal.0'));
  }
  // the ring (base top-left cx + 5, cy - 1): its top arc gold, one glow.0 highlight pixel on top
  px.set(g, [cx + 5 + 2, cy - 1 + 1], 'accent.0');
  px.set(g, [cx + 5 + 3, cy - 1 + 1], 'glow.0');
  px.set(g, [cx + 5 + 4, cy - 1 + 1], 'accent.0');
  px.set(g, [cx + 5 + 1, cy - 1 + 2], 'accent.0');
  // the pendant: a garnet teardrop
  px.patch(g, [cx - 6, cy + 3], DROP, { X: 'outline', G: 'glow.0', h: 'leather.0', c: 'leather.1', E: 'leather.2' }, { anchor: 'topleft' });
  return g;
}
