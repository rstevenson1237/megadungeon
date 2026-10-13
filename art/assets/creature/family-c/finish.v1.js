// finish.v1 (f) on base.v1 — the one direct-pixel pass (R2), for the review's "s/e views are a flat dark jumble: head
// and tail indistinguishable, legs lost as black noise, head not raised". In the s/e views, with the head point taken
// from the same rig pose as the base (art/lib/beast.v1.js):
// 1. the flat feelers and fangs lying along the floor are cleared, and the head is repainted raised 5 px over its old
//    place on a short neck (accent ramp: lit top, dark lower edge, ringed by outline), with two pale curved fangs below
//    it at the down-left end and two pale feelers sweeping up and forward from it;
// 2. every leg's lowest pixel turns pale (leather.0), so each segment shows a pair of light leg tips.
// The back views (n/w), which the review liked, are left as drawn. Colours are direction tokens (R11).
import { pose } from '../../../lib/beast.v1.js';
export const base = 'base.v1';
export const meta = { notes: 'raised head with fangs and feelers at the down-left end; pale leg tips' };

export function finish(g, ctx) {
  const { px } = ctx.lib, w = g.w, h = g.h, P = pose(ctx), flip = ctx.facing === 'e';
  px.fix.orphans(g);
  if (ctx.facing === 'n' || ctx.facing === 'w') return g;
  const tok = p => (p[0] < 0 || p[1] < 0 || p[0] >= w || p[1] >= h ? null : px.tokenAt(g, p));
  const M = x => (flip ? w - 1 - x : x); // drawing coordinates (the s view) to this cell's
  const T = (x, y) => tok([M(x), y]), S = (x, y, t) => px.set(g, [M(x), y], t), C = (x, y) => px.patch(g, [M(x), y], ['_'], {}, { anchor: 'topleft' });
  // the head point (s view): u = 7 + lunge along the heading, v the walk's sway, ht 3 + open
  const L = P.lunge * 4, wave = P.walking ? P.phase * Math.PI * 2 : 0, u = 7 + L, v = Math.sin(wave) * 2.4;
  const hx = Math.round(w / 2 - 0.894 * u - 0.894 * v), hy = Math.round(h - 8 + 0.447 * u - 0.447 * v - (3 + P.open) - P.bob);
  // 1a. clear the old flat feelers and fangs (pale leather) round the head, then the outline left stranded
  for (let y = hy - 8; y <= hy + 3; y++) for (let x = hx - 10; x <= hx + 2; x++) if (T(x, y) === 'leather.0') C(x, y);
  for (let pass = 0; pass < 2; pass++)
    for (let y = hy - 8; y <= hy + 3; y++) for (let x = hx - 10; x <= hx + 2; x++)
      if (T(x, y) === 'outline' && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const t = T(x + dx, y + dy); return t && t !== 'outline'; })) C(x, y);
  // 1b. the raised head on its neck: a filled shape, then an outline ring round it
  const shape = new Map();
  const ell = (cx, cy, rx, ry, tone) => { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) shape.set(`${x},${y}`, tone(x, y)); };
  ell(hx + 0.3, hy - 2.2, 1.5, 2.2, (x, y) => (x > hx ? 'accent.2' : 'accent.1'));
  const cx = hx - 1.5, cy = hy - 4.8;
  ell(cx, cy, 3.2, 1.9, (x, y) => (y < cy - 0.5 && x < cx + 1 ? 'accent.0' : y > cy + 1 || x > cx + 1.5 ? 'accent.2' : 'accent.1'));
  const ring = new Set();
  for (const key of shape.keys()) { const [x, y] = key.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!shape.has(`${x + dx},${y + dy}`)) ring.add(`${x + dx},${y + dy}`); }
  for (const key of ring) { const [x, y] = key.split(',').map(Number); if (y >= hy - 1 && T(x, y)) continue; S(x, y, 'outline'); }
  for (const [key, t] of shape) { const [x, y] = key.split(',').map(Number); S(x, y, t); }
  // 1c. two pale fangs hooking down under the head's front, and two pale feelers sweeping up and forward
  const pale = (pts, ring = true) => pts.forEach(([x, y]) => { S(x, y, 'leather.0'); if (ring) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1]]) if (!T(x + dx, y + dy)) S(x + dx, y + dy, 'outline'); });
  pale([[cx - 3, cy + 1], [cx - 4, cy + 2], [cx - 3, cy + 3]]);
  pale([[cx - 1, cy + 2], [cx - 1, cy + 3]]);
  pale([[cx - 3, cy - 2], [cx - 4, cy - 3], [cx - 5, cy - 3], [cx - 6, cy - 4], [cx - 7, cy - 4]], false);
  pale([[cx, cy - 2], [cx - 1, cy - 3], [cx - 1, cy - 4], [cx - 2, cy - 5], [cx - 2, cy - 6]], false);
  // 2. pale leg tips: a leg pixel (leather.1) with nothing of the leg below it
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (tok([x, y]) === 'leather.1' && tok([x, y + 1]) !== 'leather.1') px.set(g, [x, y], 'leather.0');
  return g;
}
