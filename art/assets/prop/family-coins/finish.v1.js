// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), what the r3 review left at pixel level: the stacks read
// as square blocks. (1) Round both stacks toward discs: the top and bottom corners of each stack are cut one more
// pixel, so each reads as a short cylinder (the top face 4-6-6 px, the bottom edge curving in); where a stack's corner
// is cut against the stack behind it, that stack's side shows through. Top faces stay the light steps (glow.0 /
// wood.0), sides the ochre stripes (wood.1 / wood.2), as base.v3. (2) A second glint pixel (metal.0) on each stack's
// top face, beside the one base.v3 has. (3) One small loose coin a little out to the left, so the spill is wider than
// the stacks. Colours are direction tokens, never hex (R11). No generic clean-up: the base is stamped pixel by pixel.
export const base = 'base.v3';
export const meta = { notes: 'stacks rounded toward discs, a second glint pixel per stack, one more loose coin out to the left' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const key = { X: 'outline', w: 'metal.0', h: 'glow.0', g: 'wood.0', e: 'wood.1', D: 'wood.2' };
  const tl = { anchor: 'topleft' };
  // the back stack of three (base.v3 topleft 14, 15): round its top corners, second glint
  px.patch(g, [14, 15], [
    '._...._.',
    '_X.w..X_',
  ], key, tl);
  // the stack of two (topleft 8, 18): round its top corners (the right one tucks under the back stack's outline), second glint
  px.patch(g, [8, 18], [
    '._......',
    '_X.w..XX',
  ], key, tl);
  // ... and its bottom corners
  px.patch(g, [8, 23], [
    '_X....X.',
    '._...._.',
  ], key, tl);
  // one more loose coin, lying out to the left of the stacks
  px.patch(g, [3, 25], [
    '.XXX.',
    'XhhhX',
    'XeeeX',
    '.XXX.',
  ], key, tl);
  return g;
}
