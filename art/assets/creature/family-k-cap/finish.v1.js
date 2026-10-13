// family-k-cap finish.v1 (f) on base.v1 (R12, the best base, 6) — the one direct-pixel pass (R2). The latest review
// (base.v3) asked for a form change (a smaller body, narrower shoulders, a waist and a leg gap): a finish cannot change
// form, so that is left to a base revision. This pass does the pixel-level points of base.v1's review instead:
//  - the "bare pink hands": the cape's light lining peeking out beside the legs in the front views is dimmed to the
//    cape's mid step (leather.1), and any skin pixel is repainted in the same step of the plate's cloth ramp, so the
//    knight reads as plate from helm to sole;
//  - the greatsword held point down gets a lit left edge (cloth.0) down the blade in the front views, so it reads
//    as a blade and not a dark line between the legs;
//  - the back views' flat cape gets three vertical fold bands (a dark leather.2 crease with a leather.0 lit run to
//    its left), stopping above the ragged hem.
// No face: the helm's burning slit is the face (the base exports no face anchors).
import { bipedLayout } from '../../../lib/beast.v1.js';
export const base = 'base.v1';
export const meta = { notes: 'gauntlets in the plate ramp, lit blade edge in front, cape fold bands in back' };

export function finish(g, ctx) {
  const { px } = ctx.lib, back = ctx.facing === 'n' || ctx.facing === 'w', flip = ctx.facing === 'e' || ctx.facing === 'n';
  const Lo = bipedLayout({ ...ctx, size: ctx.size ?? [g.w, g.h] }, 2), X = x => (flip ? g.w - 1 - x : x);
  px.fix.orphans(g);

  // gauntlets: skin.N -> cloth.N
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const t = px.tokenAt(g, [x, y]);
    if (t && t.startsWith('skin.')) px.set(g, [x, y], 'cloth.' + t.slice(5));
  }

  if (!back) {
    // the cape's light lining peeking out at the sides read as bare pink hands: dim it to the cape's mid step
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (px.tokenAt(g, [x, y]) === 'leather.0') px.set(g, [x, y], 'leather.1');
    // the blade's lit left edge, where the sword hangs straight (idle, walk)
    if ((ctx.state === 'idle' || ctx.state === 'walk') && Math.abs(Lo.P.main) <= 2) {
      const c = Math.round(Lo.cx);
      for (let y = Math.round(Lo.waist + Lo.Y(1.5)); y < Math.round(Lo.foot - Lo.Y(2.5)); y++) {
        for (let dx = -2; dx <= 1; dx++) {
          const x = c + dx, t = px.tokenAt(g, [x, y]), l = px.tokenAt(g, [x - 1, y]);
          if (t && t.startsWith('cloth.') && l === 'outline') { px.set(g, [x, y], 'cloth.0'); break; }
        }
      }
    }
  } else {
    // cape folds: find the cape's (leather) extent, crease three columns, light the column to each crease's left
    let x0 = g.w, x1 = -1, y0 = g.h, y1 = -1;
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const t = px.tokenAt(g, [x, y]);
      if (t && t.startsWith('leather.')) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    }
    if (x1 > x0 + 6) {
      for (const f of [0.28, 0.52, 0.76]) {
        const fx = Math.round(x0 + (x1 - x0) * f);
        for (let y = y0 + 3; y < y1 - 3; y++) {
          const t = px.tokenAt(g, [fx, y]), tl = px.tokenAt(g, [fx - 1, y]);
          if (t && t.startsWith('leather.')) px.set(g, [fx, y], 'leather.2');
          if (tl && tl.startsWith('leather.') && y > y0 + 4) px.set(g, [fx - 1, y], 'leather.0');
        }
      }
    }
  }
  return g;
}
