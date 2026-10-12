// finish.v1 (f) on base.v2 — the one direct-pixel pass (R2), on what the r2/r3 reviews asked of the top and faces:
// - top face (full and cap): keeps base.v2's stone-mid field and its 1 px lit rim on the two back (upper) edges, but
//   the centred arc crack and the light specks are wiped; in their place one short off-centre joint and one chipped
//   nick in the lit rim, at different spots on the wall and the cap, so the top reads as one quiet capstone plane.
// - south-west (lit) face: the bright vertical lips beside each joint go back to stone mid, and each course's lit top
//   lip is cut to its first 4 px, so the left face carries thinner, fewer highlights and sits below the top in value.
// - the cap, which had ink on its back edges and no rim, gets the same 1 px lit rim inside the ink.
// - south-east face: its mortar stays outline, a step darker than the left face's stone-dark mortar (checked, kept).
// Stone ramp and outline only; colours are direction tokens (R11).
export const base = 'base.v2';
export const meta = { notes: 'quiet capstone top with lit rim, off-centre joint and nick; thinner left-face highlights' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const w = g.w, h = g.h, th = w / 2, half = w / 2;
  const height = ctx.state === 'cap' ? Math.max(2, Math.round((h - th) / 6)) : h - th;
  const T = h - th - height; // top row of the top diamond (same geometry as base.v2)
  const tok = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : px.tokenAt(g, [x, y]));
  const inTop = (x, y) => {
    const sx = x + 0.5 - half, sy = y + 0.5 - T;
    const u = sx / w + sy / th, v = sy / th - sx / w;
    return u >= 0 && v >= 0 && u < 1 && v < 1;
  };
  const isRim = (x, y) => y < T + th / 2 && (!inTop(x, y - 1) || !inTop(x - 1, y) || !inTop(x + 1, y));
  const isFront = (x, y) => y >= T + th / 2 && (!inTop(x, y + 1) || !inTop(x - 1, y) || !inTop(x + 1, y));

  // 1. Top face: clear the crack and specks back to stone mid (rim, front edges and ink untouched).
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!inTop(x, y) || isRim(x, y) || isFront(x, y)) continue;
    const t = tok(x, y);
    if (t === 'stone.0' || t === 'stone.2') px.set(g, [x, y], 'stone.1');
  }

  // 1b. The cap's top had ink on its back edges and no lit rim: give it the same 1 px lit rim, inside the ink.
  if (ctx.state === 'cap') {
    const rim = [];
    for (let y = T; y < T + th / 2; y++) for (let x = 0; x < w; x++)
      if (inTop(x, y) && tok(x, y) === 'stone.1' && tok(x, y - 1) === 'outline') rim.push([x, y]);
    for (const p of rim) px.set(g, p, 'stone.0');
  }

  // 2. One short joint (stone dark, parallel to the front-right edge) and one nick in the lit rim, off-centre.
  const cx = half, cy = T + th / 2; // centre of the top diamond
  const marks = ctx.state === 'cap'
    ? { joint: [[cx - 7, cy + 1], [cx - 6, cy + 1], [cx - 5, cy + 2]], nick: [cx + 6, cy - 4] }
    : { joint: [[cx + 4, cy + 1], [cx + 5, cy + 1], [cx + 6, cy + 2]], nick: [cx - 7, cy - 4] };
  for (const p of marks.joint) if (inTop(p[0], p[1]) && !isRim(...p) && !isFront(...p)) { px.set(g, p, 'stone.2'); ctx.protect(p); }
  {
    // the nick: the rim pixel nearest the mark goes mid, the pixel inside it dark
    const [nx, ny] = marks.nick;
    let ry = ny;
    while (ry > T && inTop(nx, ry - 1)) ry--;
    if (tok(nx, ry) === 'stone.0') {
      px.set(g, [nx, ry], 'stone.1'); ctx.protect([nx, ry]);
      if (inTop(nx, ry + 1) && !isFront(nx, ry + 1)) { px.set(g, [nx, ry + 1], 'stone.2'); ctx.protect([nx, ry + 1]); }
    }
  }

  // 3. South-west face: thinner, fewer lit lips. Read from a snapshot so edits don't cascade.
  const snap = [];
  for (let y = 0; y < h; y++) { snap.push([]); for (let x = 0; x < w; x++) snap[y].push(tok(x, y)); }
  const S = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : snap[y][x]);
  const dark = (t) => t === 'stone.2' || t === 'outline';
  for (let y = 0; y < h; y++) for (let x = 0; x < half - 1; x++) {
    if (inTop(x, y) || S(x, y) !== 'stone.0') continue;
    const topLip = dark(S(x, y - 1));
    if (!topLip) { px.set(g, [x, y], 'stone.1'); continue; } // vertical lip beside a joint
    // course lip: count lit pixels back along the lip (up-left, slope 1:2) to its start; keep the first 4 (two rows)
    let n = 0, ax = x, ay = y;
    for (;;) {
      if (S(ax - 1, ay) === 'stone.0' && dark(S(ax - 1, ay - 1))) ax--;
      else if (S(ax - 1, ay - 1) === 'stone.0' && dark(S(ax - 1, ay - 2))) { ax--; ay--; }
      else break;
      n++;
    }
    if (n >= 4) px.set(g, [x, y], 'stone.1');
  }

  return g;
}
