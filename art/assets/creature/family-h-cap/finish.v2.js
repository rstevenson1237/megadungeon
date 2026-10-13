// family-h-cap finish.v2 (f) on base.v4 — the one direct-pixel pass (R2), re-finishing the best base (R12; finish.v1
// finished base.v2). Review of base.v4: "necks are straight rigid tubes ... bend each neck into an S-curve (base
// forward, mid back, head forward) with tapering width". Bending the necks is a form change (a base revision), so it is
// left; this pass does the pixel part of losing the pipe look: along every neck (the rows above the body) the edge
// between the lit and the shadow tone (grass.1 / grass.2) wavers by one pixel in a slow wave down the neck, so the
// shading twists like a muscled, scaled neck instead of running as two ruler-straight stripes. The heads' eyes and the
// ink are untouched. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { pass: 'f', notes: 'lit/shadow edge along the necks wavers one pixel down each neck, breaking the straight tube stripes' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  px.fix.jaggies(g);
  const top = ctx.anchors.ground ? ctx.anchors.ground[1] - 24 : g.h / 2;
  const sets = [];
  for (let y = 0; y < top; y++) {
    const o = Math.round(Math.sin(y * 0.55 + ctx.frame * 0.8) * 1.1);
    if (!o) continue;
    for (let x = 1; x < g.w - 1; x++) {
      if (px.tokenAt(g, [x, y]) !== 'grass.1' || px.tokenAt(g, [x + 1, y]) !== 'grass.2') continue;
      // only a neck's edge: lit run of 2+ on the left, shadow run of 2+ on the right
      if (px.tokenAt(g, [x - 1, y]) !== 'grass.1' && px.tokenAt(g, [x - 1, y]) !== 'grass.0') continue;
      if (px.tokenAt(g, [x + 2, y]) !== 'grass.2') continue;
      sets.push(o > 0 ? [x + 1, y, 'grass.1'] : [x, y, 'grass.2']);
    }
  }
  for (const [x, y, t] of sets) px.set(g, [x, y], t);
  return g;
}
