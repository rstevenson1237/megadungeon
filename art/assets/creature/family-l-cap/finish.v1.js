// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), for the review's "the skull is a smooth pale oblong with
// dot eyes, reading as a bald man": in the front views (s, e) the skull's face is recut at the base's two burning
// eye-points (found on the drawn pixels, so it follows the bob and lean of every frame):
// - two 2x2 dark eye sockets with one glow pixel (accent.0) each, a bone bridge between them;
// - a dark nasal hole under the bridge, with yellowed (hair.0) cheekbones either side;
// - a narrower jaw: the jaw's outer pixel on the far side is cut away, alternate dark teeth, and a 2 px chin.
// Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'skull face: 2x2 sockets with glow points, nasal hole, narrower toothed jaw' };

// the face, from one column left of the near eye-point and one row above it (s view; mirrored for e).
// k outline, b bone lit (skin.0), m bone shadow (hair.0), g glow point (accent.0), _ cleared, . kept
const FACE = [
  'kkkbkkmk',
  'kgkbgkmk',
  'kbmkmmk_',
  '.kbkbk_.',
  '._kbbk..',
];
const KEY = { k: 'outline', b: 'skin.0', m: 'hair.0', g: 'accent.0' };

export function finish(g, ctx) {
  const { px } = ctx.lib, w = g.w, flip = ctx.facing === 'e' || ctx.facing === 'n';
  px.fix.orphans(g);
  if (ctx.facing === 'n' || ctx.facing === 'w') return g;
  const M = x => (flip ? w - 1 - x : x), T = (x, y) => px.tokenAt(g, [M(x), y]);
  const [hx0, hy] = ctx.at('head'), hx = M(hx0);
  // the two eye-points: accent.0 pixels on one row, 2-4 px apart, round the head anchor
  let eye = null;
  for (let y = hy - 2; y <= hy + 4 && !eye; y++)
    for (let x = hx - 4; x <= hx + 1 && !eye; x++)
      if (T(x, y) === 'accent.0') for (let d = 2; d <= 4; d++) if (T(x + d, y) === 'accent.0') { eye = [x, y]; break; }
  if (!eye) return g;
  const x0 = eye[0] - 1, y0 = eye[1] - 1;
  FACE.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === '.') return;
    const at = [M(x0 + i), y0 + j];
    if (ch === '_') px.patch(g, at, ['_'], {}, { anchor: 'topleft' });
    else px.set(g, at, KEY[ch]);
  }));
  return g;
}
