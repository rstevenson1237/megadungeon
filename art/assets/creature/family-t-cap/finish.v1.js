// family-t-cap finish.v1 (f) on base.v3 — review: the face was unreadable, the brightest highlight step capping the
// head like a white wig, with no visible brow, eye or hooked nose in s/e. The one direct-pixel pass (R2):
//  - the crown's light step is cut to a 1 px rim (its top and lit left edge); the rest of the crown drops to the mid
//    step, so the light only stays on the brow ridge (the two rows just above the eyes);
//  - the two eye pixels under the brow are repainted bright (accent.0) and protected, each with a dark socket pixel
//    beside it, so the clean-up cannot eat them;
//  - a 2 px hooked-nose shadow (the dark step) on the nose's underside, curling in at its tip.
// The face is found from the drawn eye pixels (the base's eye anchors sit 2 px low, so the template's face patch is not
// used); back views (n/w) show only the mane and are left as drawn. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'crown highlight cut to a 1 px rim, bright eyes under the brow, 2 px hooked-nose shadow' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const back = ctx.facing === 'n' || ctx.facing === 'w';
  // find the drawn eyes before the clean-up (orphans would take the lone eye pixels)
  const eyes = [];
  if (!back) for (let y = 20; y < 60; y++) for (let x = 0; x < g.w; x++) if (px.tokenAt(g, [x, y]) === 'accent.0') eyes.push([x, y]);
  for (const e of eyes) ctx.protect(e);
  px.fix.orphans(g);
  px.fix.jaggies(g);
  if (back || !eyes.length) return g;
  const flip = ctx.facing === 'e', dir = flip ? -1 : 1;

  // the eyes: the two accent pixels on the head (search the upper part of the frame, skip the tusks' row band)
  // the base draws each eye as one pixel; take the topmost pair on one row
  const ey = Math.min(...eyes.map(e => e[1]));
  const pair = eyes.filter(e => e[1] === ey).sort((a, b) => a[0] - b[0]);
  if (pair.length < 2) return g;
  const [e1, e2] = [pair[0], pair[pair.length - 1]], mid = flip ? Math.ceil((e1[0] + e2[0]) / 2) : Math.floor((e1[0] + e2[0]) / 2);

  // the crown: rows above the brow (ey-3, ey-2) — every light-step pixel that is not on the rim drops to the mid step
  const lit = (x, y) => px.tokenAt(g, [x, y]) === 'grass.0';
  const edge = (x, y) => { const t = px.tokenAt(g, [x, y]); return !t || t === 'outline'; };
  const x0 = Math.min(e1[0], e2[0]) - 8, x1 = Math.max(e1[0], e2[0]) + 8, drop = [];
  for (let y = ey - 9; y <= ey - 4; y++) for (let x = x0; x <= x1; x++) {
    if (!lit(x, y)) continue;
    const rim = edge(x, y - 1) || edge(x - dir, y); // the top edge, and the lit side (screen left: light from the upper left)
    if (!rim) drop.push([x, y]);
  }
  for (const p of drop) px.set(g, p, 'grass.1');

  // bright eyes, each with a dark socket pixel on its far side, kept from any later clean-up
  for (const e of [e1, e2]) {
    px.set(g, e, 'accent.0');
    const s = [e[0] + 1, e[1]];
    if (px.tokenAt(g, s) && px.tokenAt(g, s).startsWith('grass')) px.set(g, s, 'grass.2');
    ctx.protect(e);
  }

  // the hooked nose's shadow: two dark-step pixels on its underside, curling in toward the face at the tip
  for (const p of [[mid + dir, ey + 3], [mid, ey + 4]]) {
    const t = px.tokenAt(g, p);
    if (t && t.startsWith('grass')) px.set(g, p, 'grass.2');
  }
  return g;
}
