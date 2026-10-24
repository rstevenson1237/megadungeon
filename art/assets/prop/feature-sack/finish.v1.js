// finish.v1 (f) on base.v2 — the one direct-pixel pass (R2). Review notes acted on (base.v2 and base.v3 scores):
// "closed reads as a rock/blob at 1x … give a clear tied neck knot … clean stray pixels"; "stray pixels: grey under the
// open sack and a lone dark tie stub on its left".
// closed: the top is redrawn as a flared tuft, a leather cord cinched tight (with a pale knot pixel) at a pinched neck
// that notches the silhouette, and shoulders flaring into the body — no stray outline pixels inside the neck.
// open: the grey coin blob under the sack is removed (the sack's bottom edge closed, the ground shadow kept) and the
// lone cord stub on its left is cleared, the sack's left outline restored.
// looted: the gap in the bottom outline beside the loose cord is closed.
// Colours are direction tokens (R11).
export const base = 'base.v2';
export const meta = { notes: 'tied neck and cord on the closed sack; stray coin and cord stub cleared on the open sack' };

// k outline, c lit cloth (wood.0), b mid cloth (wood.1), d shaded cloth (wood.2), L cord (leather.1), l knot (leather.0)
const NECK = [ // top-left at (9, 12)
  '_____k__k_____',
  '____kkkkkkk___',
  '___kccbbbddk__',
  '____kcbbddk___',
  '____kLLlLk____',
  '____kcbbdk____',
  '__kkccbbddkk__',
  '_kccccbbddddk_',
];

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const cloth = { k: 'outline', c: 'wood.0', b: 'wood.1', d: 'wood.2', L: 'leather.1', l: 'leather.0' };
  if (ctx.state === 'closed') {
    px.patch(g, [9, 12], NECK, cloth, { anchor: 'topleft' });
  } else if (ctx.state === 'open') {
    // the base's own ground-shadow pixel (partial alpha, so copied as raw RGBA), reused under the sack
    const shadowAt = (x, y) => { const i = (27 * g.w + 12) * 4, j = (y * g.w + x) * 4; for (let k = 0; k < 4; k++) g.d[j + k] = g.d[i + k]; };
    // the grey coin under the sack: close the bottom edge, shadow below
    px.patch(g, [13, 25], ['.d...', 'kkkkk'], cloth, { anchor: 'topleft' });
    for (let x = 14; x <= 17; x++) shadowAt(x, 27);
    g.clear(15, 28); g.clear(16, 28);
    // the cord stub on the left: clear it, restore the sack's left outline
    px.patch(g, [6, 20], ['___', '___k', '___k', '.__kd'], cloth, { anchor: 'topleft' });
  } else if (ctx.state === 'looted') {
    px.patch(g, [21, 26], ['kk'], cloth, { anchor: 'topleft' });
  }
  return g;
}
