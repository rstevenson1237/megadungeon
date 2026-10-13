// family-o finish.v2 (f) on base.v4 — the one direct-pixel pass (R2), re-finishing the best base (R12). Review of
// base.v4: "head is a square block … round the cranium, shrink the head 2 px, and push a jutting jaw with two pale
// 1x2 px tusks". The shrink and the jaw are form changes (base work); this pass does the pixel part:
// (1) rounds the cranium: the square top corners of the skull outline are cut back along a diagonal (each row down to the
//     first full-width one pulled in 1 px a side), the outline moved in behind them, in every facing, so the head reads as a dome not a block;
// (2) on s/e the two 1x2 tusk pixels at the mouth line (pale cloth.0, lost at 1x) become bone-bright skin.0, and the
//     lower jaw's top row takes a lit skin.0 run on its lit side so the underbite juts.
// The red eyes stay (the review keeps the orc read), so the template's eye painting is not used.
// Positions follow the head / mouth anchors, so they ride the bob and the attack lean. Colours are tokens (R11).
export const base = 'base.v4';
export const meta = { pass: 'f2', notes: 'rounded cranium corners, bone-bright tusks, lit jaw edge' };

export function finish(g, ctx) {
  const { px } = ctx.lib, a = ctx.anchors;
  const tok = (x, y) => (x < 0 || y < 0 || x >= g.w || y >= g.h ? null : px.tokenAt(g, [x, y]));
  const isSkin = t => !!t && t.startsWith('skin');
  if (!a.head) return g;
  const [hx, hy] = a.head, top = hy - 9, bot = (a.eye ? a.eye[1] : hy + 1) - 1;
  // (1) round the cranium: each row of the skull run (the opaque run through the head anchor) down to its first
  // full-width row is pulled in 1 px a side and re-inked, so the square top corners step in like a dome.
  const run = y => {
    if (!tok(hx, y)) return null;
    let L = hx, R = hx;
    while (tok(L - 1, y) && hx - L < 8) L--;
    while (tok(R + 1, y) && R - hx < 8) R++;
    return { L, R, w: R - L + 1, openL: !tok(L - 1, y), openR: !tok(R + 1, y) };
  };
  const rows = [];
  for (let y = top; y <= bot; y++) { const r = run(y); if (r) rows.push([y, r]); }
  const maxW = Math.max(0, ...rows.map(([, r]) => r.w));
  const firstFull = rows.find(([, r]) => r.w >= maxW - 1)?.[0];
  if (firstFull !== undefined && maxW >= 8) for (const [y, r] of rows) {
    if (y > firstFull) break;
    if (r.w < 5) continue; // the topknot
    for (const [edge, dir, open] of [[r.L, 1, r.openL], [r.R, -1, r.openR]]) {
      if (!open) continue; // something (the axe, an arm) touches the head here: leave that side
      g.clear(edge, y);
      px.set(g, [edge + dir, y], 'outline');
    }
  }
  // (2) tusks and jaw (face side only)
  if (a.mouth) {
    const [mx, my] = a.mouth;
    for (let y = my - 4; y <= my + 1; y++) for (let x = mx - 6; x <= mx + 6; x++) if (tok(x, y) === 'cloth.0') px.set(g, [x, y], 'skin.0');
    // the underbite's top edge: the first skin row under the mouth line, lit on the light's side (left in the s frame)
    for (let y = my - 2; y <= my + 3; y++) {
      const xs = []; for (let x = mx - 7; x <= mx + 7; x++) if (tok(x, y) === 'skin.1' && tok(x, y - 1) === 'outline') xs.push(x);
      if (xs.length < 5) continue;
      const lit = xs.slice(1, Math.ceil(xs.length / 2));
      for (const x of lit) px.set(g, [x, y], 'skin.0');
      break;
    }
  }
  return g;
}
