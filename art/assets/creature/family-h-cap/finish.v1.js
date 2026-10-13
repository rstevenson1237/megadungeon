// family-h-cap finish.v1 (f) on base.v2 — the one direct-pixel pass (R2), for the review of base.v3: "necks knot
// into one tangle on the chest in s/e ... fan the five necks out ... so each neck and head is separate". Fanning the
// necks is a form change (a base revision), so it is left; this pass does the pixel part of keeping the heads apart:
// - each head's eye becomes one red pixel (accent.1), so the five heads count as five in s/e;
// - the lit (top-left) rim of every neck and head (above the body) gets the light step, so each neck and head edge separates from the
//   one behind it instead of merging into one mid-tone tangle.
// Colours are direction tokens (R11).
export const base = 'base.v2';
export const meta = { notes: 'red 1 px eye per head, rim light on the grass shapes to part the necks' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  px.light.rim(g, { ramps: ['grass'], region: [0, 0, g.w, ctx.anchors.head[1] + 8] }); // necks and heads only, not the body
  if (ctx.facing === 's' || ctx.facing === 'e')
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (px.tokenAt(g, [x, y]) === 'accent.0') px.set(g, [x, y], 'accent.1');
  return g;
}
