// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), as the 6.5 review asked:
// 1) the floor diamond round the flight is repainted as floor, not a plinth: the outline ring on its near edges goes
//    (those pixels take the flag's dirt mid), the far-edge seam joint is broken into runs with the same gaps as
//    terrain-floor base.v3 (variant 0), and the only dark left on the floor is a dirt-dark contact shadow under the
//    flight: 1 px below its foot all round, so 2 px wide along its south-east (shadow) side;
// 2) the tread highlight bands are worn: a few chipped / worn pixels on each tread's nose and back edge in stone mid.
// The flight keeps its own silhouette outline. Colours are direction tokens only (R11).
export const base = 'base.v3';
export const meta = { notes: 'floor diamond repainted as floor (no near-edge ring, broken far seam, dirt-dark contact shadow); worn tread highlights' };

// terrain-floor base.v3's seam gaps for variant 0: 'ul' from the left corner (0) to the top corner (1), 'ur' from the
// top corner (0) to the right corner (1)
const SEAM_GAPS = { ul: [[0.2, 0.4], [0.82, 1.01]], ur: [[-0.01, 0.12], [0.55, 0.78]] };

export function finish(g, ctx) {
  const { px } = ctx.lib, w = g.w, h = g.h, top = h - 16, cx = w / 2;
  const tok = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? null : px.tokenAt(g, [x, y]);
  const isStone = (x, y) => (tok(x, y) || '').startsWith('stone.');
  const isDirt = (x, y) => (tok(x, y) || '').startsWith('dirt.');
  const inside = (x, y) => x >= 0 && x < w && y >= top && y < h && Math.abs(x + 0.5 - cx) / cx + Math.abs(y + 0.5 - top - 8) / 8 <= 1;
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const rim = (x, y) => inside(x, y) && N4.some(([dx, dy]) => !inside(x + dx, y + dy));

  // the flight: its stone, and every outline pixel touching its stone (its own silhouette line)
  const stair = new Set();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (isStone(x, y)) stair.add(`${x},${y}`);
    else if (tok(x, y) === 'outline' && [...N4, [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dy]) => isStone(x + dx, y + dy))) stair.add(`${x},${y}`);
  }
  const inStair = (x, y) => stair.has(`${x},${y}`);
  const floor = (x, y) => inside(x, y) && !inStair(x, y);

  // 1a) the near-edge outline ring becomes floor (the flag's dirt mid)
  for (let y = top; y < h; y++) for (let x = 0; x < w; x++)
    if (floor(x, y) && tok(x, y) === 'outline') px.set(g, [x, y], 'dirt.1');

  // 1b) the far-edge seam joint broken into runs, as terrain-floor base.v3 draws it
  const gap = (e, p) => SEAM_GAPS[e].some(([lo, hi]) => p >= lo && p <= hi);
  for (let y = top; y < top + 9; y++) for (let x = 0; x < w; x++) {
    if (!floor(x, y) || !rim(x, y) || tok(x, y) !== 'dirt.2') continue;
    const upper = !inside(x, y - 1);
    if (!upper) continue;
    if (x + 0.5 < cx ? gap('ul', (x + 0.5) / cx) : gap('ur', (x + 0.5 - cx) / cx)) px.set(g, [x, y], 'dirt.1');
  }

  // 1c) contact shadow: 1 px of dirt dark under the flight's foot (and beside it on the south-east side)
  const shade = [];
  for (let y = top; y < h; y++) for (let x = 0; x < w; x++) {
    if (!floor(x, y)) continue;
    const under = inStair(x, y - 1) || (inStair(x - 1, y) && x > cx);
    if (under) shade.push([x, y]);
  }
  for (const p of shade) px.set(g, p, 'dirt.2');

  // 2) worn treads: each lit tread band (a 4-connected run of stone.0) gets two chipped nose pixels (riser stone mid
  //    bitten in) and one worn pixel on its back edge, placed by a fixed hash, never at the band's ends
  const hash = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 997;
  const seen = new Set(), chips = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (tok(x, y) !== 'stone.0' || seen.has(`${x},${y}`)) continue;
    const band = [], st = [[x, y]]; seen.add(`${x},${y}`);
    while (st.length) {
      const [qx, qy] = st.pop(); band.push([qx, qy]);
      for (const [dx, dy] of N4) {
        const k = `${qx + dx},${qy + dy}`;
        if (!seen.has(k) && tok(qx + dx, qy + dy) === 'stone.0') { seen.add(k); st.push([qx + dx, qy + dy]); }
      }
    }
    if (band.length < 8) continue;
    const xs = band.map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs);
    const mid = ([bx]) => bx > x0 + 1 && bx < x1 - 1;
    const nose = band.filter(([bx, by]) => mid([bx]) && tok(bx, by + 1) !== 'stone.0' && tok(bx, by - 1) === 'stone.0');
    const back = band.filter(([bx, by]) => mid([bx]) && tok(bx, by - 1) !== 'stone.0' && tok(bx, by + 1) === 'stone.0');
    const pick = (list, n, salt) => {
      const out = [];
      for (let i = 0; i < n && list.length; i++) out.push(list.splice(hash(list.length + salt, i + x0) % list.length, 1)[0]);
      return out.filter((p, i, a) => !a.slice(0, i).some(q => Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) < 3));
    };
    chips.push(...pick(nose, 2, 1), ...pick(back, 1, 7));
  }
  for (const p of chips) px.set(g, p, 'stone.1');
  return g;
}
