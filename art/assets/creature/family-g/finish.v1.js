// family-g finish.v1 (f) on base.v3 — the one direct-pixel pass (R2). Review of base.v3: front and back read the
// same, a bald pale egg with no visible eyes or face. This pass paints the face on the front facings (s, e) at the
// base's face anchors: a 1 px dark brow row over both eyes (off the head outline), a bright 1x1 glint in each eye under it (accent.0, in
// the dark 1 px socket the base drew), and a 1 px hooked nose (a lit skin.0 pixel with a dark tip under it on the
// side away from the light) between them. Back facings have no face anchors and are left as they are. The template's
// orphan and jaggy clean-up runs first, so it cannot touch the face. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { pass: 'f', notes: 'goblin face: dark brow row, two bright eye glints, a hooked nose pixel' };

export function finish(g, ctx) {
  const { px } = ctx.lib, a = ctx.anchors;
  px.fix.orphans(g);
  px.fix.jaggies(g);
  if (!a.eye || !a.eye2 || !a.mouth) return g;
  const [e1, e2] = [a.eye, a.eye2].sort((p, q) => p[0] - q[0]), ey = e1[1];
  // the brow: one dark row over both eyes, kept off the head's outline so it cannot read as a band
  px.line(g, [e1[0], ey - 1], [e2[0], ey - 1], 'outline');
  // the eyes: a bright glint each
  for (const e of [e1, e2]) px.set(g, e, 'accent.0');
  // the nose between and under the eyes: a lit bridge pixel and its hooked dark tip toward the shadow side
  const nx = a.mouth[0], flip = ctx.facing === 'e';
  px.set(g, [nx, ey + 1], 'skin.0');
  px.set(g, [nx + (flip ? -1 : 1), ey + 2], 'outline');
  ctx.protect(e1, e2, [nx, ey + 1]);
  return g;
}
