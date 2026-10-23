// finish.v2 (f2) on base.v1 — re-finish of the best base (base.v1, 7; R12). base.v1's shapes stay; its colours move off
// the red-orange accent (reserved for magic and lights) and off the pale khaki that read as bread (finish.v1). Within
// finishing ops: (1) every coin's face is recoloured to wood.1, the most saturated gold-like step the prop palette has
// (hue ~51, the ochre); (2) each coin's rim/underside row becomes a darker band in wood.2; (3) a 1 px bright glint
// (glow.0, the brightest warm step) on each coin's top face, with one accent.0 sheen pixel (the warm peach light step)
// on its lit side — the only accent pixels left; (4) two small loose coins lie touching the pile, left and right.
// Tokens used: outline, wood.1, wood.2, glow.0, accent.0. Colours are direction tokens, never hex (R11).
export const base = 'base.v1';
export const meta = { notes: 'coins recoloured to the ochre gold step, dark rim bands, 1 px glints, two loose coins touching the pile' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const set = (x, y, t) => px.set(g, [x, y], t);
  // (1) faces: every coin colour of base.v1 (glow.0, accent.0..2) becomes the ochre gold step
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const t = px.tokenAt(g, [x, y]);
    if (t === 'glow.0' || t === 'accent.0' || t === 'accent.1') set(x, y, 'wood.1');
    else if (t === 'accent.2') set(x, y, 'wood.2');
  }
  // (2) the darker rim band: each coin's bottom row (back-left coin, front coin, the stack's two coins)
  for (const [x0, x1, y] of [[10, 13, 23], [14, 18, 26], [18, 22, 21], [18, 22, 23]]) for (let x = x0; x <= x1; x++) set(x, y, 'wood.2');
  // (3) a bright glint on each coin top, with one sheen pixel beside it on the lit (left) side
  for (const [x, y] of [[11, 21], [15, 25], [19, 20], [19, 22]]) { set(x - 1, y, 'accent.0'); set(x, y, 'glow.0'); }
  // (4) two small loose coins touching the pile: one left of the front coin, one right of it, under the stack
  const key = { X: 'outline', G: 'glow.0', e: 'wood.1', d: 'wood.2' };
  const coin = ['.XXX.', 'XGeeX', 'XdddX', '.XXX.'];
  px.patch(g, [8, 24], coin, key, { anchor: 'topleft' });
  px.patch(g, [19, 24], coin, key, { anchor: 'topleft' });
  return g;
}
