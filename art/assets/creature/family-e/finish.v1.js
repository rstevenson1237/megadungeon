// family-e finish.v1 (f) on base.v3 — the one direct-pixel pass (R2). Review of base.v3: the back facings (n, w) read
// as a thin pipe with a tiny tip, no head mass, no back fin. This pass paints the back of the eel's skull over that
// tip on n and w: a rounded wedge 6-7 px wide carrying a dark fin ridge down its middle with two small spines on top,
// so the back views share the front's head mass. Front facings keep the base's own eye and jaw (no generic orphan
// clean-up, which would eat the 1 px eye). Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { pass: 'f', notes: 'back-of-skull wedge with a fin ridge painted over the head tip on n/w' };

// the skull from behind, facing w (tip up-left); '6' the dark fin ridge, 'G' the lit side, '#' ink
const SKULL = [
  '...#.#...',
  '.##6#6#..',
  '#gGG6gg#.',
  '#gGG6gg6#',
  '.#gG6gg6#',
  '..#g6g66#',
  '...#g666#',
];
const KEY = { '#': 'outline', g: 'grass.1', G: 'grass.0', 6: 'grass.2' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  px.fix.jaggies(g);
  if (ctx.facing === 'n' || ctx.facing === 'w') {
    // the head tip: the top opaque row's outermost pixel (leftmost on w, rightmost on n, which is w mirrored)
    let ty = -1, tx = -1;
    for (let y = 0; y < g.h && ty < 0; y++) for (let x = 0; x < g.w; x++) if (px.tokenAt(g, [x, y])) { ty = y; if (ctx.facing === 'w') { tx = x; break; } tx = x; }
    if (ty >= 0) {
      const w = ctx.facing === 'n', rows = w ? SKULL.map(r => [...r].reverse().join('')) : SKULL;
      px.patch(g, [w ? tx - 6 : tx - 2, ty - 1], rows, KEY, { anchor: 'topleft' });
    }
  }
  return g;
}
