// family-s-cap finish.v2 (f) on base.v4 — the one direct-pixel pass (R2), re-finishing the best base (R12). Review of
// base.v4: "head is a capped blob with the red eye on the neck … make the head a wedge 2 px wider than the neck, eye on
// the head, and extend the neck 6-8 px forward in attack contact". The wedge and the longer strike are form changes
// (base work); this pass does the pixel part, the eye:
// - the red hood mark on the neck (read as an eye low on the neck) is painted out with the scale steps around it;
// - the real eye on the head (a pale accent.0 pixel, lost at 1x) becomes the red accent.1, inked on its top side as
//   a brow ridge where the head has room, so the head carries the eye.
// The tongue (accent pixels touching the outline) is kept. The template's eye painting is not used (a snake's eye
// is the base's own pixel). Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { pass: 'f2', notes: 'hood mark off the neck, red eye on the head with a brow' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const tok = (x, y) => (x < 0 || y < 0 || x >= g.w || y >= g.h ? null : px.tokenAt(g, [x, y]));
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const hood = [], eyes = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const t = tok(x, y);
    if (t === 'accent.0') eyes.push([x, y]);
    else if (t && t.startsWith('accent') && N4.every(([dx, dy]) => /^(grass|accent)/.test(tok(x + dx, y + dy) ?? ''))) hood.push([x, y]);
  }
  // the hood mark: interior red pixels take the nearest scale colour (the step beside them, else the mid step)
  for (const [x, y] of hood) {
    const near = N4.map(([dx, dy]) => tok(x + dx, y + dy)).find(t => t && t.startsWith('grass'));
    px.set(g, [x, y], near ?? 'grass.1');
  }
  // the eye: red, with a 1 px brow above it when the pixel above is scale (not the head's outline already)
  for (const [x, y] of eyes) {
    px.set(g, [x, y], 'accent.1');
    const up = tok(x, y - 1);
    if (up && up.startsWith('grass') && tok(x, y - 2)) px.set(g, [x, y - 1], 'outline');
    ctx.protect([x, y]);
  }
  return g;
}
