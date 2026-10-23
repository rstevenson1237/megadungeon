// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), on what the r3 review named at pixel level:
// - the steel was a flat near-white cluster: the sword blade and the axe bit now keep one lit edge column in the metal
//   ramp's light step and turn their shaded column to its mid step, and the spear head's right half goes mid too, so
//   each blade reads as a two-tone edge, not a white blob tangled with the hafts;
// - stray pixels: the spear haft's kink beside the post (a lone pale leather pixel) is repainted in the haft's tone.
// Only tokens already on a pixel are swapped (tokenAt guards), so a re-render that moves a part leaves it alone.
export const base = 'base.v3';
export const meta = { notes: 'two-tone steel on sword, axe and spear; haft kink stray pixel cleaned' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const swap = (x, y, from, to) => { if (px.tokenAt(g, [x, y]) === from) px.set(g, [x, y], to); };
  const st = ctx.state;
  if (st !== 'looted') {
    for (let y = 16; y <= 22; y++) swap(18, y, 'metal.0', 'metal.1');      // axe bit: shaded column mid grey
    swap(12, 11, 'metal.0', 'metal.1'); swap(12, 12, 'metal.0', 'metal.1'); // spear head: shaded half
    swap(10, 23, 'leather.0', 'leather.1');                                 // haft kink stray pixel
  }
  if (st === 'closed') {
    for (let y = 21; y <= 30; y++) swap(14, y, 'metal.0', 'metal.1');      // sword blade: lit edge + mid body
  }
  return g;
}
