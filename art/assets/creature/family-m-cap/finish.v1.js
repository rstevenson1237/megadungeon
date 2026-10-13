// family-m-cap finish.v1 (f) on base.v3 — review: the broad red collar showed only on the back views (n/w) while the
// front had scattered red specks, and orphan pixels made the bands noisy. The one direct-pixel pass (R2):
//  - s/e: the collar is painted as one solid 2 px red band across the shoulders (accent.1, its far end in the dark
//    step), over whatever the raised arms left of it; only on pixels already drawn, so the silhouette is unchanged;
//  - n/w: the broad collar drops to the shoulder rim only (its top row, accent.1); the rows under it go back to linen;
//  - the lone dark specks in the leg bands (1 px dark-step runs with no dark neighbour) take the light linen step.
// Then the template's clean-up (orphans, jaggies) with the glowing eye protected. No face patch (face: false).
import { bipedLayout } from '../../../lib/beast.v1.js';
export const base = 'base.v3';
export const meta = { notes: 'solid 2 px collar band in front, shoulder rim only from behind, leg specks cleared' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const back = ctx.facing === 'n' || ctx.facing === 'w', flip = ctx.facing === 'e' || ctx.facing === 'n';
  const Lo = bipedLayout({ size: [g.w, g.h], state: ctx.state, frame: ctx.frame, logical: ctx.logical }, 1.8);
  const sh = Math.round(Lo.shoulder), T = p => px.tokenAt(g, p), X = x => (flip ? g.w - 1 - x : x);

  // keep the glowing eye
  for (let y = 0; y < sh - 1; y++) for (let x = 0; x < g.w; x++) if (T([x, y]) === 'accent.0') ctx.protect([x, y]);

  // the leg bands: lone dark-step specks become light linen
  const specks = [];
  for (let y = Math.round(Lo.waist) + 2; y < g.h; y++) for (let x = 1; x < g.w - 1; x++) {
    if (T([x, y]) !== 'cloth.2') continue;
    if ([[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(p => T(p) === 'cloth.2')) continue;
    specks.push([x, y]);
  }
  for (const p of specks) px.set(g, p, 'cloth.0');

  px.fix.orphans(g);
  px.fix.jaggies(g);

  const cx = Math.round(Lo.cx), xa = cx - 5, xb = cx + 4;
  if (!back) {
    // one solid 2 px band across the shoulders (rows sh-1, sh), dark at the far (unlit) end
    const rows = [];
    let x0 = Infinity;
    for (let i = xa; i <= xb; i++) x0 = Math.min(x0, X(i));
    for (const y of [sh - 1, sh]) {
      let row = '';
      for (let x = x0; x <= x0 + (xb - xa); x++) {
        const t = T([x, y]);
        if (!t) { row += '.'; continue; }
        const far = flip ? x <= x0 + 1 : x >= x0 + (xb - xa) - 1;
        row += far ? 'd' : 'r';
      }
      rows.push(row);
    }
    px.patch(g, [x0, sh - 1], rows, { r: 'accent.1', d: 'accent.2' }, { anchor: 'topleft' });
  } else {
    // from behind: the collar's top row stays as a rim (accent.1), the rows under it go back to linen
    for (let x = 0; x < g.w; x++) {
      if ((T([x, sh - 1]) ?? '').startsWith('accent')) px.set(g, [x, sh - 1], 'accent.1');
      for (const [y, tok] of [[sh, 'cloth.2'], [sh + 1, 'cloth.0'], [sh + 2, 'cloth.0']]) if ((T([x, y]) ?? '').startsWith('accent')) px.set(g, [x, y], tok);
    }
  }
  return g;
}
