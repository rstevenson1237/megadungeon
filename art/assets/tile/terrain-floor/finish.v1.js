// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), doing what the 6.5 review asked, in its order:
// 1) joints roughened: on every joint and seam line long enough, a 1 px jog (one run shifted a pixel for one or two
//    rows, so the 2:1 step reads 2-3-2-1-2) plus a few 1 px chips knocked into the flag edge beside a joint — dirt's
//    darkest step only; 2) more flag corners rounded (2-3 per cell), and a worn lip of dirt.0, 3-6 px long, under
//    the upper-left joint of 2-3 flags per cell, so stones read raised (lit from the upper left); 3) the base's 2 px
//    crack nicks varied per variant: some dropped, the rest bent into 2-3 px hairlines of differing shape.
// Ops only read and write the cell's own diamond (dirt tokens only), so the 4 variants still tile as before. The
// choices are seeded from the cell's own pixels, so each variant gets its own jogs, chips, lips and cracks.
export const base = 'base.v3';
export const meta = { notes: 'jogged and chipped joints, rounded corners, worn lips, varied cracks' };

const J = 'dirt.2', F = 'dirt.1', L = 'dirt.0';

export function finish(g, ctx) {
  const { px } = ctx.lib, W = g.w, H = g.h;
  const tok = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : px.tokenAt(g, [x, y]));
  const dark = (x, y) => tok(x, y) === J;
  const flag = (x, y) => { const t = tok(x, y); return t === F || t === L; };
  const put = (x, y, t) => { if (tok(x, y)) px.set(g, [x, y], t); };
  // a seed from the cell's own pixels: each variant differs, re-renders repeat
  let a = 7;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const t = tok(x, y); a = Math.imul(a ^ (t ? t.charCodeAt(5) + 1 : 0), 2654435761) ^ (x * 31 + y); }
  const r = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = arr => arr[Math.floor(r() * arr.length)];
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

  // --- 3) cracks first (so the joint work below sees them gone): isolated dark bits of 1-2 px inside a flag
  const n8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  const seen = new Set(), cracks = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!dark(x, y) || seen.has(`${x},${y}`)) continue;
    const comp = [], st = [[x, y]]; seen.add(`${x},${y}`);
    while (st.length) {
      const [qx, qy] = st.pop(); comp.push([qx, qy]);
      for (const [dx, dy] of n8) { const k = `${qx + dx},${qy + dy}`; if (dark(qx + dx, qy + dy) && !seen.has(k)) { seen.add(k); st.push([qx + dx, qy + dy]); } }
    }
    if (comp.length <= 2) cracks.push(comp);
  }
  const SHAPES = [[[0, 0], [1, 0], [2, 1]], [[0, 0], [1, 1], [2, 1]], [[0, 0], [1, -1]], [[0, 0], [1, 0], [2, -1]]];
  const roomy = (x, y) => n8.concat([[0, 0]]).every(([dx, dy]) => flag(x + dx, y + dy));
  cracks.forEach((c, i) => {
    c.forEach(([x, y]) => put(x, y, F));
    if (i === 0 ? r() < 0.4 : r() < 0.55) return;                 // dropped: no grid of nicks
    const [x0, y0] = c[0], sh = pick(SHAPES), ox = pick([-1, 0, 1]);
    const pts = sh.map(([dx, dy]) => [x0 + ox + dx, y0 + dy]);
    if (pts.every(([x, y]) => roomy(x, y))) pts.forEach(([x, y]) => put(x, y, J));
  });

  // --- 1) jogs: chains of 2 px runs along each 2:1 joint line; shift one or two runs of a chain by 1 px
  const runs = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (dark(x, y) && !dark(x - 1, y)) {
    let e = x; while (dark(e + 1, y)) e++;
    runs.push({ y, x0: x, x1: e });
  }
  const runAt = (y, x0, x1) => runs.find(q => q.y === y && q.x0 === x0 && q.x1 === x1);
  const chains = [];
  for (const d of [1, -1]) {                                       // d = +1 runs down-right, -1 down-left
    const used = new Set();
    for (const R of runs) {
      if (R.x1 - R.x0 !== 1 || used.has(R)) continue;
      const up = d > 0 ? runAt(R.y - 1, R.x0 - 2, R.x0 - 1) : runAt(R.y - 1, R.x1 + 1, R.x1 + 2);
      if (up) continue;                                            // not a chain head
      const ch = [R]; used.add(R);
      for (;;) {
        const t = ch[ch.length - 1], nx = d > 0 ? runAt(t.y + 1, t.x1 + 1, t.x1 + 2) : runAt(t.y + 1, t.x0 - 2, t.x0 - 1);
        if (!nx) break; ch.push(nx); used.add(nx);
      }
      if (ch.length >= 3) chains.push({ d, ch });
    }
  }
  const tryBump = (d, ch, i, k) => {
    // rows i+1..i+k shift by s; run i and run i+k+1 take the slack (one becomes 3 wide, the other 1)
    for (const s of shuffle([d, -d])) {
      const off = [], on = [], head = ch[i], tail = ch[i + k + 1];
      if (s === d) {
        on.push([d > 0 ? head.x1 + 1 : head.x0 - 1, head.y]);
        off.push([d > 0 ? tail.x0 : tail.x1, tail.y]);
      } else {
        off.push([d > 0 ? head.x1 : head.x0, head.y]);
        on.push([d > 0 ? tail.x0 - 1 : tail.x1 + 1, tail.y]);
      }
      for (let m = i + 1; m <= i + k; m++) {
        const R = ch[m];
        if (s > 0) { off.push([R.x0, R.y]); on.push([R.x1 + 1, R.y]); } else { off.push([R.x1, R.y]); on.push([R.x0 - 1, R.y]); }
      }
      const onSet = new Set(on.map(p => `${p[0]},${p[1]}`)), offSet = new Set(off.map(p => `${p[0]},${p[1]}`));
      const ok = on.every(([x, y]) => offSet.has(`${x},${y}`) || (flag(x, y) &&
        // never weld onto another joint or crack beside the chain
        n8.every(([dx, dy]) => !dark(x + dx, y + dy) || ch.some(R => R.y === y + dy && x + dx >= R.x0 - 1 && x + dx <= R.x1 + 1) || onSet.has(`${x + dx},${y + dy}`))));
      if (!ok) continue;
      off.forEach(([x, y]) => { if (!onSet.has(`${x},${y}`)) put(x, y, F); });
      on.forEach(([x, y]) => put(x, y, J));
      return true;
    }
    return false;
  };
  for (const { d, ch } of chains) {
    const bumps = ch.length >= 7 ? 2 : 1, starts = shuffle([...Array(ch.length - 2).keys()]);
    let done = 0, last = -9;
    for (const i of starts) {
      if (done >= bumps) break;
      const k = ch.length - i >= 4 && r() < 0.5 ? 2 : 1;
      if (i + k + 1 >= ch.length || Math.abs(i - last) < 4) continue;
      if (tryBump(d, ch, i, k)) { done++; last = i; }
    }
  }

  // flags: 4-connected non-joint pixels
  const lab = new Map(), flags = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!flag(x, y) || lab.has(`${x},${y}`)) continue;
    const id = flags.length, pts = [], st = [[x, y]]; lab.set(`${x},${y}`, id);
    while (st.length) {
      const [qx, qy] = st.pop(); pts.push([qx, qy]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = `${qx + dx},${qy + dy}`; if (flag(qx + dx, qy + dy) && !lab.has(k)) { lab.set(k, id); st.push([qx + dx, qy + dy]); } }
    }
    flags.push(pts);
  }
  const interior = (x, y) => n8.every(([dx, dy]) => tok(x + dx, y + dy));

  // chips: a 1 px notch knocked into a flag's edge, against a joint (2-3 per cell)
  const chipAt = [];
  for (const f of flags) for (const [x, y] of f) {
    if (!interior(x, y) || tok(x, y) !== F) continue;
    const vert = dark(x, y - 1) || dark(x, y + 1), side = dark(x - 1, y) || dark(x + 1, y);
    if (vert && !side && flag(x - 1, y) && flag(x + 1, y)) chipAt.push([x, y]);
  }
  // --- 2) rounded corners: a flag pixel with a joint above or below and beside it
  const cornerAt = [];
  for (const f of flags) for (const [x, y] of f) {
    if (!interior(x, y) || tok(x, y) !== F) continue;
    const vert = dark(x, y - 1) || dark(x, y + 1), side = dark(x - 1, y) || dark(x + 1, y);
    if (vert && side) cornerAt.push([x, y]);
  }
  const marked = new Set();
  const spaced = (x, y) => [...marked].every(k => { const [mx, my] = k.split(',').map(Number); return Math.abs(mx - x) + Math.abs(my - y) > 3; });
  const take = (list, n) => { let c = 0; for (const [x, y] of shuffle(list)) { if (c >= n) break; if (!spaced(x, y)) continue; put(x, y, J); marked.add(`${x},${y}`); c++; } };
  take(cornerAt, 2 + (r() < 0.5 ? 1 : 0));
  take(chipAt, 2 + (r() < 0.5 ? 1 : 0));

  // worn lip: under the upper-left joint (dark above, joint just to the left), 3-6 px of dirt.0, on 2-3 flags
  const lipOf = new Map();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!flag(x, y) || !dark(x, y - 1)) continue;
    if (!(dark(x - 1, y) || dark(x - 2, y)) || dark(x + 1, y)) continue;
    const id = lab.get(`${x},${y}`); if (id === undefined) continue;
    // also the pixel to its left when it is flag (the lip is the run's width, not a dot)
    const pts = lipOf.get(id) ?? []; pts.push([x, y]); if (flag(x - 1, y) && dark(x - 1, y - 1)) pts.push([x - 1, y]); lipOf.set(id, pts);
  }
  const lipFlags = shuffle([...lipOf.entries()].filter(([, p]) => p.length >= 3)).sort((p, q) => q[1].length - p[1].length).slice(0, 2 + (r() < 0.5 ? 1 : 0));
  for (const [, pts] of lipFlags) {
    const uniq = [...new Map(pts.map(p => [`${p[0]},${p[1]}`, p])).values()].sort((p, q) => p[1] - q[1] || p[0] - q[0]);
    const n = Math.min(uniq.length, 3 + Math.floor(r() * 4)), s0 = Math.floor(r() * (uniq.length - n + 1));
    uniq.slice(s0, s0 + n).forEach(([x, y]) => { if (flag(x, y)) put(x, y, L); });
  }
  return g;
}
