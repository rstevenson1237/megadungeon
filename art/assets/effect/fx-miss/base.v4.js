// fx-miss base.v4 (x2) — from base.v3. Wave 1 blind-miss retry: both reviewers read v3's closed outline and flat
// peach fill as a solid bun or rock. Kept: v3's dust puff kicked up at the target's feet, growing f1-f3. Changed, all
// as the reviewers named: no accent (peach read as skin, red is the floor items' shared tone): the body is pale
// grey dust on cloth 0, with a lighter billowing top on glow 0 (its pale cream gives the tan) and a cloth 1 underside;
// the edge is broken into lumpy clusters (a union of small round lumps, not three smooth blobs); f4 scatters into three
// smaller puffs drifting out and up instead of hard shards; the grit is single 1 px specks laid after the line pass,
// so they carry no outline (no + sparkles). The outline stays the direction's dark line: line.outer is 'dark' and the
// gate needs 85% of edge pixels in the outline colour, which the darkest dust step (cloth 2) does not count as.
export const meta = { brief: 'fx-miss', pass: 'x2', notes: 'lumpy dust puff: cloth0 body, glow0 billowing top, cloth1 underside; f4 splits into 3 drifting puffs; unlined 1px grit' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx } = ctx.lib, P = ctx.dir.pal;
  const BODY = P.cloth[0], TOP = P.glow[0], UNDER = P.cloth[1];
  const g = fx.particles([], { w, h, t: ctx.t, duration: 1000 });
  const f = Math.min(3, Math.round(ctx.t * 4));
  const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) g.set(x, y, c); };
  const sx = w / 24, sy = h / 24;
  // lumps per frame: [x, y, r] on a 24 x 24 layout; each puff is a cluster of small round lumps so the edge stays bumpy
  const F = [
    [[12, 16, 2], [9.8, 16.8, 1.7], [14.2, 16.8, 1.7], [11, 14.8, 1.4], [13.4, 14.6, 1.3]],
    [[10.5, 14, 2], [13.5, 13.4, 2.2], [8, 16.4, 1.8], [16, 16.4, 1.8], [12, 16.4, 2.2], [11.8, 11.8, 1.3]],
    [[9.5, 12.8, 2.4], [13.6, 11.8, 2.7], [6.2, 15.4, 2.1], [17.6, 14.8, 2.1], [11.4, 16, 2.5], [15.2, 16.2, 2.2],
      [8.4, 16.6, 1.9], [15.6, 14.2, 2.2], [11.6, 10.2, 1.5], [16.6, 12, 1.5]],
    // f4: scattering into three smaller puffs drifting apart and rising, thinner than f3
    [...[[4.6, 14.4], [19.2, 13.6], [12, 7.4]].flatMap(([x, y]) => [[x - 1.3, y, 1.8], [x + 1.3, y, 1.8], [x - 0.3, y - 1.5, 1.9]]),
  ],
  ][f].map(([x, y, r]) => [x * sx, y * sy, r * sx]);
  const inside = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    return F.some(([bx, by, r]) => { const ex = (x + 0.5 - bx) / r, ey = (y + 0.5 - by) / (r * 0.85); return ex * ex + ey * ey <= 1; });
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!inside(x, y)) continue;
    let c = BODY;
    // lit from the upper left: the billowing top of each lump is pale cream, two deep on its left-facing slopes
    if (!inside(x, y - 1) || (!inside(x - 1, y - 1) && !inside(x, y - 2))) c = TOP;
    // the underside and the right flank fall into shade; the f4 puffs keep only the pale steps, thinning as they drift
    else if (f < 3 && (!inside(x, y + 1) || (!inside(x + 1, y) && !inside(x + 1, y - 1) && !inside(x + 1, y + 1)))) c = UNDER;
    set(x, y, c);
  }
  const out = fx.line(g);
  // grit: single 1 px specks thrown up and out, laid after the line pass so they carry no outline
  const grit = [
    [],
    [[7, 12], [16, 11]],
    [[4, 11], [19, 10], [9, 8]],
    [[2, 10], [22, 10], [16, 5]],
  ][f];
  for (const [x, y] of grit) {
    const px = Math.round(x * sx), py = Math.round(y * sy);
    if (px >= 0 && py >= 0 && px < w && py < h && !out.alpha(px, py)) out.set(px, py, TOP);
  }
  return out;
}
