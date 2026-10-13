// family-v-cap finish.v1 (f) on base.v3 — review: at 1x the face was a near-black blob, so the figure read as a dark
// mass. The one direct-pixel pass (R2): on the front facings (s/e) the face under the hair (about 4 x 5 px around the
// eyes, between the head's outline) is lifted to the cloth ramp's light step, its far column one step down for shape,
// so the pale head pops against the collar; the 2 red eye pixels are kept and protected. The widow's peak (hair) and
// the outline are left as drawn. Back views (n/w) show only the hair and collar and are left alone. Then the
// template's clean-up. The face is found from the drawn red eyes (accent.1 above the shoulders). Colours are tokens.
export const base = 'base.v3';
export const meta = { notes: 'pale lifted face under the hair, red eyes kept' };

export function finish(g, ctx) {
  const { px } = ctx.lib, T = p => px.tokenAt(g, p);
  const back = ctx.facing === 'n' || ctx.facing === 'w', flip = ctx.facing === 'e';
  // the eyes: the red pixels in the top half of the frame
  const eyes = [];
  if (!back) for (let y = 0; y < g.h / 2; y++) for (let x = 0; x < g.w; x++) if (T([x, y]) === 'accent.1') eyes.push([x, y]);
  for (const e of eyes) ctx.protect(e);
  px.fix.orphans(g);
  px.fix.jaggies(g);
  if (back || eyes.length < 2) return g;
  const ey = eyes[0][1], xs = eyes.filter(e => e[1] === ey).map(e => e[0]), xa = Math.min(...xs) - 2, xb = Math.max(...xs) + 2;
  for (let y = ey - 2; y <= ey + 2; y++) {
    // the face's cloth pixels on this row, inside the outline
    const run = [];
    for (let x = xa; x <= xb; x++) if ((T([x, y]) ?? '').startsWith('cloth')) run.push(x);
    if (!run.length) continue;
    const far = flip ? Math.min(...run) : Math.max(...run);
    for (const x of run) px.set(g, [x, y], x === far && run.length > 2 ? 'cloth.1' : 'cloth.0');
  }
  for (const e of eyes) px.set(g, e, 'accent.1');
  return g;
}
