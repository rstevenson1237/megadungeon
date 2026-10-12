// terrain-floor base.v4 (x1) — from base.v3. One change, as the blind re-score asked (form): the floor is laid as
// closed flagstones in courses. The cell is a 16 x 16 lattice in the two iso axes (a from the upper-left seam, b
// from the upper-right seam). Joints cross the seams only at fixed ports, the same in every variant (course lines,
// constant b, cross the upper-left / lower-right seams at b = 4 and 11; one head joint, constant a, crosses the
// upper-right / lower-left seams at a = 6), so every joint that reaches an edge runs on in the neighbouring cell and
// no seam itself is drawn: stones at an edge close up with the neighbour's, the floor reads as one paved surface
// and the cell diamond never shows. Inside, each variant steps its two course lines differently and sets its own
// head joints (T-junctions, 3-5 stones of differing size), each run wandering by at most one 1 px jog; tiny pockets
// where joints meet off the pixel stair are opened; a few stone corners are rounded; each stone keeps a 2-4 px
// dirt-lightest lip under its upper-left joint. Joints are dirt's darkest step, faces the middle step; no cracks.
export const meta = { brief: 'terrain-floor', pass: 'x1', notes: 'closed flagstones, joints through fixed seam ports' };

export const params = {
  worn: { type: 'range', min: 0, max: 1, step: 1, default: 1 },
};

// Each variant is two course lines and its head joints. A course line is a constant-b joint from the upper-left
// seam to the lower-right one, given as steps [a, b]: it runs at b from that a on, and a short head joint closes
// each step. Course lines meet the seams at b = 4 and 11 (the ports); the course between them is the cell's own,
// the course over the upper-right / lower-left seam is shared with the neighbours and cut by the head joint at
// a = 6 (its port). heads are the other head joints: { at, lo, hi, jog } is a constant-a joint over b in [lo, hi],
// jog [pos, d] moving it by d from pos on (one jog a run).
const LAYOUTS = [
  { rows: [[[0, 4], [9, 6], [13, 4]], [[0, 11]]], top: 6, bottom: 6, heads: [{ at: 12, lo: 6, hi: 11, jog: [9, -1] }] },
  { rows: [[[0, 4]], [[0, 11], [4, 9], [11, 11]]], top: 6, bottom: 6, heads: [{ at: 9, lo: 4, hi: 9 }, { at: 14, lo: 4, hi: 11, jog: [7, -1] }] },
  { rows: [[[0, 4], [3, 2], [12, 4]], [[0, 11], [8, 10], [14, 11]]], top: 6, bottom: 6, heads: [{ at: 10, lo: 2, hi: 10, jog: [6, 1] }] },
  { rows: [[[0, 4], [6, 5], [14, 4]], [[0, 11], [7, 8], [12, 11]]], top: 6, bottom: 6, heads: [{ at: 3, lo: 4, hi: 11, jog: [8, 1] }, { at: 10, lo: 5, hi: 8 }] },
];

// the layout as joint runs: { k: 'a', at, lo, hi } is a constant-a joint over b in [lo, hi], { k: 'b' } a
// constant-b one over a; 0 and 16 are the seams
const toRuns = L => {
  const runs = [];
  const bAt = (row, a) => { let b = row[0][1]; for (const [sa, sb] of row) if (a >= sa) b = sb; return b; };
  for (const row of L.rows) row.forEach(([sa, sb], i) => {
    const ea = i + 1 < row.length ? row[i + 1][0] : 16;
    runs.push({ k: 'b', at: sb, lo: sa, hi: ea });
    if (i > 0) runs.push({ k: 'a', at: sa, lo: Math.min(sb, row[i - 1][1]), hi: Math.max(sb, row[i - 1][1]) });
  });
  runs.push({ k: 'a', at: L.top, lo: 0, hi: bAt(L.rows[0], L.top) });
  runs.push({ k: 'a', at: L.bottom, lo: bAt(L.rows[1], L.bottom), hi: 16 });
  for (const hd of L.heads) runs.push({ k: 'a', ...hd });
  return runs;
};

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h, { outline: false });
  const dirt = pal.dirt, dark = dirt.length - 1, v = ((ctx.variant | 0) % 4 + 4) % 4;
  let seed = 0x9e3779b9 ^ (v * 2654435761), r = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const cx = w / 2, top = h - 16, hw = w / 2, hh = 8;
  const diamond = `M${cx} ${top} L${w} ${top + hh} L${cx} ${h} L0 ${top + hh} Z`;
  const inside = (x, y) => x >= 0 && x < w && y >= top && y < h && Math.abs(x + 0.5 - cx) / hw + Math.abs(y + 0.5 - top - hh) / hh <= 1;
  const A = (x, y) => Math.floor((x + 1) / 2) + (y - top), B = (x, y) => Math.floor((x + 1) / 2) - (y - top);
  let aMin = 1e9, bMax = -1e9;
  for (let y = top; y < h; y++) for (let x = 0; x < w; x++) if (inside(x, y)) { aMin = Math.min(aMin, A(x, y)); bMax = Math.max(bMax, B(x, y)); }
  // lattice coordinates: a from the upper-left seam, b from the upper-right seam (both 0..15 in the cell)
  const la = (x, y) => A(x, y) - aMin, lb = (x, y) => bMax - B(x, y);
  // a run covers a lattice point when it sits on it; a jog adds the point that bridges the step so the joint stays
  // a closed (4-connected) barrier
  const onRun = (R, pa, pb) => {
    const along = R.k === 'a' ? pb : pa, across = R.k === 'a' ? pa : pb;
    if (along < R.lo - 1 || along > R.hi + 1) return false;
    const off = R.jog && along >= R.jog[0] ? R.jog[1] : 0;
    if (along >= R.lo && along <= R.hi && across === R.at + off) return true;
    // bridge at the jog: the first point past it also takes the old line
    if (R.jog && along === R.jog[0] && across === R.at) return true;
    return false;
  };
  const runs = toRuns(LAYOUTS[v]);
  const grid = new Array(16 * w).fill(-1), kind = new Array(16 * w).fill('');
  const idx = (x, y) => (y - top) * w + x;
  for (let y = top; y < h; y++) for (let x = 0; x < w; x++) {
    if (!inside(x, y)) continue;
    const pa = la(x, y), pb = lb(x, y);
    // the lattice is periodic: a point on a seam (0) is also the neighbour's 16
    let k = '';
    for (const R of runs) for (const [qa, qb] of [[pa, pb], [pa + 16, pb], [pa, pb + 16]]) if (!k && onRun(R, qa, qb)) k = R.k;
    grid[idx(x, y)] = k ? dark : 1; kind[idx(x, y)] = k;
  }
  const band = (x, y) => grid[idx(x, y)];
  const isJoint = (x, y) => inside(x, y) && band(x, y) === dark;
  const isFlag = (x, y) => inside(x, y) && band(x, y) !== dark;
  // label the stones (4-connected) inside the cell
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let lab, flags;
  const label = () => {
    lab = new Array(16 * w).fill(-1); flags = [];
    for (let y = top; y < h; y++) for (let x = 0; x < w; x++) {
      if (!isFlag(x, y) || lab[idx(x, y)] >= 0) continue;
      const id = flags.length, px = [], st = [[x, y]]; lab[idx(x, y)] = id;
      while (st.length) {
        const [qx, qy] = st.pop(); px.push([qx, qy]);
        for (const [dx, dy] of N4) {
          const nx = qx + dx, ny = qy + dy;
          if (isFlag(nx, ny) && lab[idx(nx, ny)] < 0) { lab[idx(nx, ny)] = id; st.push([nx, ny]); }
        }
      }
      flags.push(px);
    }
  };
  // where a short head joint meets a course line off the pixel stair, the two can shut in a pocket of a pixel or
  // two: open each pocket into the stone beside it, so every enclosed shape is a whole stone
  for (let pass = 0; pass < 8; pass++) {
    label();
    const pocket = flags.findIndex(f => f.length < 6 && f.every(([x, y]) => N4.every(([dx, dy]) => inside(x + dx, y + dy))));
    if (pocket < 0) break;
    let opened = false;
    for (const [x, y] of flags[pocket]) {
      for (const [dx, dy] of N4) {
        const jx = x + dx, jy = y + dy;
        if (opened || !isJoint(jx, jy)) continue;
        if (N4.some(([ex, ey]) => isFlag(jx + ex, jy + ey) && lab[idx(jx + ex, jy + ey)] !== pocket)) { grid[idx(jx, jy)] = 1; opened = true; }
      }
    }
    if (!opened) break;
  }
  label();
  const set = (x, y, b) => { if (inside(x, y)) grid[idx(x, y)] = b; };
  // rounded corners: on two or three stones, the corner pixel tucked into a joint crossing goes to joint colour
  const corners = [];
  for (const f of flags) {
    if (f.length < 14) continue;
    for (const [x, y] of f) {
      const vert = isJoint(x, y - 1) || isJoint(x, y + 1), side = isJoint(x - 1, y) || isJoint(x + 1, y);
      const edge = la(x, y) <= 0 || la(x, y) >= 15 || lb(x, y) <= 0 || lb(x, y) >= 15;
      if (vert && side && !edge) corners.push([x, y]);
    }
  }
  const nCh = Math.min(corners.length, 2 + (r() < 0.5 ? 1 : 0));
  for (let i = 0; i < nCh; i++) { const [x, y] = corners.splice(Math.floor(r() * corners.length), 1)[0]; set(x, y, dark); }
  // the worn lip: on each stone, a 2-4 px dirt-lightest run just under its upper-left (constant-a) joint
  if (P.worn > 0) for (const f of flags) {
    const edge = f.filter(([x, y]) => band(x, y) === 1 && isJoint(x, y - 1) && kind[idx(x, y - 1)] === 'a')
      .sort((p, q) => p[1] - q[1] || p[0] - q[0]);
    const rows = [...new Set(edge.map(p => p[1]))];
    if (rows.length < 2) continue;
    const start = Math.floor(r() * (rows.length - 1)), keep = new Set(rows.slice(start, start + (r() < 0.3 ? 1 : 2)));
    edge.filter(p => keep.has(p[1])).forEach(([x, y]) => set(x, y, 0));
  }
  // emit row runs per band
  const bits = [];
  for (let y = top; y < h; y++) {
    let x = 0;
    while (x < w) {
      const b = band(x, y); if (b < 0) { x++; continue; }
      let e = x; while (e + 1 < w && band(e + 1, y) === b) e++;
      bits.push({ type: 'rect', name: b === dark ? 'joint' : b === 0 ? 'worn' : 'flag', x, y, w: e - x + 1, h: 1, mat: dirt, shade: 'flat', band: b });
      x = e + 1;
    }
  }
  s.add({ type: 'group', name: 'surface', clip: { type: 'path', d: diamond }, children: bits });
  return ctx.lib.proc(s).noDefaults().render();
}
