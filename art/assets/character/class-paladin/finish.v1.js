// class-paladin finish.v1 (f) on base.v4 — the one direct-pixel pass (R2, R12), from base.v4's review: the great helm
// was a blank grey can and the small grey mace head melted into the arm at 1x. Ops: clean-up, then in front views
// (s, e) a 1-px outline-dark visor slit across the helm 3 rows below its top with 2 breath-hole pixels under it, and
// in every facing the mace head lifted to the metal ramp highlight with a 1-px flange each side. The helm hides the
// face, so no eyes or mouth are painted. Colours are direction tokens (R11).
import { layout } from '../../../lib/person.v1.js';
export const base = 'base.v4';
export const meta = { notes: 'paladin finish: visor slit and breath holes on the helm, highlit flanged mace head' };

const rot = ([x, y], [ox, oy], deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [ox + (x - ox) * c - (y - oy) * s, oy + (x - ox) * s + (y - oy) * c];
};
const isMetal = t => typeof t === 'string' && t.startsWith('metal');

// the mace head's centre in the frame, from the same layout the base draws with
function maceAt(g, ctx) {
  const Lo = layout({ ...ctx, size: [g.w, g.h] }), { X, Y, cx, L, waist, shoulder, P } = Lo;
  const swing = ctx.state === 'attack' && (ctx.frame % 4 === 1 || ctx.frame % 4 === 2);
  let m;
  if (swing) { const f2 = ctx.frame % 4 === 2; m = [cx - X(f2 ? 11 : 10), shoulder - Y(f2 ? 1 : 3.5)]; }
  else m = rot([L - X(2.5), waist + Y(7)], Lo.mainShoulder, P.main);
  const x = Math.round(m[0]), y = Math.round(m[1]);
  const flip = ctx.facing === 'e' || ctx.facing === 'n';
  return [flip ? g.w - 1 - x : x, y];
}

export function finish(g, ctx) {
  const { px } = ctx.lib, a = ctx.anchors;
  px.fix.orphans(g);
  px.fix.jaggies(g);

  // the visor: front views only (the back of the helm stays plain)
  if ((ctx.facing === 's' || ctx.facing === 'e') && a.head) {
    const [hx, hy] = a.head;
    let top = hy;
    while (top > 0 && isMetal(px.tokenAt(g, [hx, top - 1]))) top--;
    const vy = top + 3;
    let l = hx, r = hx;
    while (isMetal(px.tokenAt(g, [l - 1, vy])) || px.tokenAt(g, [l - 1, vy]) === 'outline' && isMetal(px.tokenAt(g, [l - 2, vy]))) l--;
    while (isMetal(px.tokenAt(g, [r + 1, vy])) || px.tokenAt(g, [r + 1, vy]) === 'outline' && isMetal(px.tokenAt(g, [r + 2, vy]))) r++;
    // keep the helm's own edge pixels: the slit runs inside them
    for (let x = l + 1; x <= r - 1; x++) px.set(g, [x, vy], 'outline');
    for (const dx of [-1, 1]) if (isMetal(px.tokenAt(g, [hx + dx, vy + 2]))) px.set(g, [hx + dx, vy + 2], 'outline');
  }

  // the mace head: the metal around its centre to the highlight, the lower-right step kept mid for shape, flanges out
  const [mx, my] = maceAt(g, ctx);
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const p = [mx + dx, my + dy], t = px.tokenAt(g, p);
    if (!isMetal(t) || dx * dx + dy * dy > 4) continue;
    px.set(g, p, dx + dy >= 2 ? 'metal.1' : 'metal.0');
  }
  for (const dx of [-1, 1]) {
    let x = mx + dx;
    while (isMetal(px.tokenAt(g, [x, my])) || px.tokenAt(g, [x, my]) === 'outline' && Math.abs(x - mx) < 3) x += dx;
    if (Math.abs(x - mx) <= 4) { px.set(g, [x, my], 'metal.0'); if (!px.tokenAt(g, [x + dx, my])) px.set(g, [x + dx, my], 'outline'); }
  }
  return g;
}
