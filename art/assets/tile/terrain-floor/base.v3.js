// terrain-floor base.v3 (r3) — from base.v2. One change, as the r2 review asked: break the cell-seam lattice. The
// seam joint on each cell's upper-left and upper-right edges is no longer drawn the whole length: each edge keeps
// its dark joint only in two or three runs, with 3-6 px gaps whose places differ per variant (and per edge), so in a
// mixed field flags run across the seam there and the cell grid stops reading as graph paper; gaps fall on the top
// corner in two variants, so the dark knot at every crossing is gone too. Everything else is as base.v2.
export const meta = { brief: 'terrain-floor', pass: 'r3', notes: 'broken cell seam: gaps per variant and edge' };

export const params = {
  worn: { type: 'range', min: 0, max: 1, step: 1, default: 1 },
  cracks: { type: 'range', min: 0, max: 2, step: 1, default: 1 },
};

// joint lines in the cell's own line indices: A = floor((x+1)/2)+y runs down-left (the u axis), B =
// floor((x+1)/2)-y runs down-right (the q axis). A spans [aMin, aMax], B spans [bMin, bMax]; aMin and bMax are the
// seam edges. A line is { k: 'A'|'B', f: fraction across the cell, lo/hi: optional fraction range on the other index }.
const LAYOUTS = [
  [{ k: 'A', f: 0.47 }, { k: 'B', f: 0.55, oLo: 0, oHi: 0.47 }],
  [{ k: 'B', f: 0.47 }, { k: 'A', f: 0.6, oLo: 0, oHi: 0.47 }],
  [{ k: 'A', f: 0.33 }, { k: 'B', f: 0.6, oLo: 0.33, oHi: 1 }],
  [{ k: 'B', f: 0.6 }],
];

// gaps in the seam joint, as fractions along each edge: 'ul' runs from the left corner (0) to the top corner (1),
// 'ur' from the top corner (0) to the right corner (1). Each gap is 3-6 px wide.
const SEAM_GAPS = [
  { ul: [[0.2, 0.4], [0.82, 1.01]], ur: [[-0.01, 0.12], [0.55, 0.78]] },
  { ul: [[0.5, 0.72]], ur: [[0.18, 0.4], [0.85, 1.01]] },
  { ul: [[-0.01, 0.2], [0.6, 0.8]], ur: [[0.3, 0.5]] },
  { ul: [[0.32, 0.52], [0.9, 1.01]], ur: [[-0.01, 0.08], [0.62, 0.86]] },
];

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h, { outline: false });
  const dirt = pal.dirt, dark = dirt.length - 1, v = ((ctx.variant | 0) % 4 + 4) % 4;
  let a = 0x9e3779b9 ^ (v * 2654435761), r = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const cx = w / 2, top = h - 16, hw = w / 2, hh = 8;
  const diamond = `M${cx} ${top} L${w} ${top + hh} L${cx} ${h} L0 ${top + hh} Z`;
  // the diamond's pixels (pixel centres inside), in frame coordinates
  const inside = (x, y) => x >= 0 && x < w && y >= top && y < h && Math.abs(x + 0.5 - cx) / hw + Math.abs(y + 0.5 - top - hh) / hh <= 1;
  const A = (x, y) => Math.floor((x + 1) / 2) + (y - top), B = (x, y) => Math.floor((x + 1) / 2) - (y - top);
  let aMin = 1e9, aMax = -1e9, bMin = 1e9, bMax = -1e9;
  for (let y = top; y < h; y++) for (let x = 0; x < w; x++) if (inside(x, y)) {
    aMin = Math.min(aMin, A(x, y)); aMax = Math.max(aMax, A(x, y)); bMin = Math.min(bMin, B(x, y)); bMax = Math.max(bMax, B(x, y));
  }
  // fractions: u from the upper-left seam (aMin) down, q from the upper-right seam (bMax) down
  const uIdx = f => Math.round(aMin + f * (aMax - aMin)), qIdx = f => Math.round(bMax - f * (bMax - bMin));
  const lines = LAYOUTS[v].map(L => ({ ...L, at: L.k === 'A' ? uIdx(L.f) : qIdx(L.f) }));
  // band per pixel: -1 outside, dark = joint, 1 = flag
  const band = (x, y) => grid[(y - top) * w + x];
  const grid = new Array(16 * w).fill(-1), jointK = new Array(16 * w).fill('');
  for (let y = top; y < h; y++) for (let x = 0; x < w; x++) {
    if (!inside(x, y)) continue;
    const ai = A(x, y), bi = B(x, y), u = (ai - aMin) / (aMax - aMin), q = (bMax - bi) / (bMax - bMin);
    let k = '';
    const gap = (e, p) => SEAM_GAPS[v][e].some(([lo, hi]) => p >= lo && p <= hi);
    if (ai === aMin && !gap('ul', (x + 0.5) / cx)) k = 'A';
    else if (bi === bMax && !gap('ur', (x + 0.5 - cx) / cx)) k = 'B';
    for (const L of lines) {
      if (k) break;
      if (L.k === 'A' && ai === L.at && (L.oLo === undefined || (q >= L.oLo && q <= L.oHi))) k = 'A';
      if (L.k === 'B' && bi === L.at && (L.oLo === undefined || (u >= L.oLo && u <= L.oHi))) k = 'B';
    }
    grid[(y - top) * w + x] = k ? dark : 1; jointK[(y - top) * w + x] = k;
  }
  const isJoint = (x, y) => inside(x, y) && band(x, y) === dark;
  const isFlag = (x, y) => inside(x, y) && band(x, y) === 1;
  // label the flags (4-connected; a 2:1 joint line is a 4-connected barrier)
  const lab = new Array(16 * w).fill(-1); const flags = [];
  for (let y = top; y < h; y++) for (let x = 0; x < w; x++) {
    if (!isFlag(x, y) || lab[(y - top) * w + x] >= 0) continue;
    const id = flags.length, px = [], st = [[x, y]]; lab[(y - top) * w + x] = id;
    while (st.length) {
      const [qx, qy] = st.pop(); px.push([qx, qy]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = qx + dx, ny = qy + dy;
        if (isFlag(nx, ny) && lab[(ny - top) * w + nx] < 0) { lab[(ny - top) * w + nx] = id; st.push([nx, ny]); }
      }
    }
    flags.push(px);
  }
  const set = (x, y, b) => { if (inside(x, y)) grid[(y - top) * w + x] = b; };
  // a 1 px chamfer at one or two flag corners (a flag pixel with joints above and beside it)
  const corners = [];
  for (const f of flags) for (const [x, y] of f) {
    const up = isJoint(x, y - 1), side = isJoint(x - 1, y) || isJoint(x + 1, y), down = isJoint(x, y + 1);
    if ((up || down) && side && !isJoint(x - 1, y - 1) !== !isJoint(x + 1, y + 1)) corners.push([x, y]);
  }
  const nCh = Math.min(corners.length, 1 + (r() < 0.5 ? 1 : 0));
  for (let i = 0; i < nCh; i++) { const [x, y] = corners.splice(Math.floor(r() * corners.length), 1)[0]; set(x, y, dark); }
  // the worn edge: on one large flag, a short 1 px light run just under its upper-left joint (lit from upper left)
  if (P.worn > 0 && flags.length) {
    const big = flags.map((f, i) => [f.length, i]).sort((p, q) => q[0] - p[0]).slice(0, 2).map(p => p[1]);
    const f = flags[big[Math.floor(r() * big.length)]];
    const edge = f.filter(([x, y]) => isJoint(x, y - 1) && jointK[(y - 1 - top) * w + x] === 'A' && band(x, y) === 1)
      .sort((p, q) => p[1] - q[1] || p[0] - q[0]);
    if (edge.length) {
      const rows = [...new Set(edge.map(p => p[1]))], start = Math.floor(r() * Math.max(1, rows.length - 2));
      const keep = new Set(rows.slice(start, start + 2));
      edge.filter(p => keep.has(p[1])).forEach(([x, y]) => set(x, y, 0));
    }
  }
  // hairline cracks: a 2 px 2:1 nick in the joint colour, well inside a flag
  for (let i = 0; i < P.cracks; i++) {
    const f = flags[Math.floor(r() * flags.length)];
    const deep = f.filter(([x, y]) => [[-2, 0], [3, 0], [0, -2], [0, 2], [2, 1], [-1, -1]].every(([dx, dy]) => isFlag(x + dx, y + dy) && band(x + dx, y + dy) === 1));
    if (!deep.length) continue;
    const [x, y] = deep[Math.floor(r() * deep.length)];
    set(x, y, dark); set(x + 1, y, dark);
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
