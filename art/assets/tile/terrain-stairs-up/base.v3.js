// terrain-stairs-up base.v3 (r3) — from base.v2, one change, as the r2 review asked: the floor diamond under the flight
// is now drawn exactly like terrain-floor base.v2 (dirt flags with clean 2:1 joints, a 1 px worn edge, a crack nick),
// in its own scene with no auto outline, so the far edges carry the floor's own dirt seam joint (no rim, no dark pad)
// and the cell blends into the floor round it. The flight is drawn in a second scene that keeps the outline on its
// silhouette, composited over the floor. Only the two near edges of the diamond keep a 1 px outline: the gate's line
// check (85% outline on the silhouette edge) cannot pass with none, since the floor's whole perimeter is silhouette.
// terrain-stairs-up base.v2 (r2) — from base.v1, one change: the south-east side face of the flight is no longer one
// flat dark slab; it is cut into coursed stone blocks (courses ~4 px high, staggered vertical joints in stone-mid) with a
// stone-mid lit edge along the top of each step's side.
// base.v1 (r1) — from the iso floor tile template: a 32 x 32 frame with the cell's floor diamond (dirt,
// low contrast, a few worn stones) in the bottom 16 rows, and on it a short flight of four worn stone steps rising
// toward map north (screen up-right). Each step is a solid block: tread on top (lightest), riser facing south-west
// (lit, middle band), side facing south-east (shadow band). Treads are split by a mortar joint and chipped at the
// nose so the stone reads worn, not ruler-straight. Ramps: stone (steps), dirt (floor) only.
export const meta = { brief: 'terrain-stairs-up', pass: 'r3', notes: 'four worn stone steps rising map-north; floor diamond drawn like terrain-floor, no outline rim; outline on the flight only' };

export const params = {
  steps: { type: 'range', min: 3, max: 5, step: 1, default: 4 },
};

const LAYOUTS = [
  [{ k: 'A', f: 0.47 }, { k: 'B', f: 0.55, oLo: 0, oHi: 0.47 }],
  [{ k: 'B', f: 0.47 }, { k: 'A', f: 0.6, oLo: 0, oHi: 0.47 }],
  [{ k: 'A', f: 0.33 }, { k: 'B', f: 0.6, oLo: 0.33, oHi: 1 }],
  [{ k: 'B', f: 0.6 }],
];

// the floor diamond, drawn exactly as terrain-floor base.v2 draws it (no outline rim), so the stair's cell blends
// into the floor cells round it
function floorScene(ctx) {
  const { pal } = ctx.dir, P = { worn: 1, cracks: 1 }, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h, { outline: false });
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
    if (ai === aMin) k = 'A'; else if (bi === bMax) k = 'B';
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
  // the near (lower-left, lower-right) edges only: a 1 px outline where this cell meets the cells in front, so the
  // stair keeps a dark silhouette edge; the far edges keep the floor's own dirt seam joint, with no rim
  const near = [];
  for (let y = top + 8; y < h; y++) for (let x = 0; x < w; x++)
    if (inside(x, y) && [[1, 0], [-1, 0], [0, 1]].some(([dx, dy]) => !inside(x + dx, y + dy))) near.push({ type: 'rect', name: 'near-edge', x, y, w: 1, h: 1, color: 'outline' });
  s.add({ type: 'group', name: 'near-edges', children: near });
    return s;
}

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h), r = ctx.rng;
  const X = v => (v * w) / 32;
  // cell diamond in the bottom 16 rows: left L, top T, right R, bottom B (same inset as the floor tile template)
  const L = [1, h - 8], T = [w / 2, h - 15], B = [w / 2, h - 1];
  // map point: a runs south-west -> north-east (toward map north, screen up-right), b runs north-west -> south-east,
  // z is height in px above the floor
  const p = (a, b, z = 0) => [L[0] + a * (T[0] - L[0]) + b * (B[0] - L[0]), L[1] + a * (T[1] - L[1]) + b * (B[1] - L[1]) - z];
  const f = q => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`;
  const quad = (...q) => `M${f(q[0])} L${f(q[1])} L${f(q[2])} L${f(q[3])} Z`;

  // the flight: n steps between a0 and a1, b0..b1 wide, rising to zTop
  const n = P.steps, a0 = 0.24, a1 = 0.96, b0 = 0.22, b1 = 0.8, zTop = X(15);
  const da = (a1 - a0) / n, dz = zTop / n;
  // draw back (highest) to front so nearer steps cover the foot of the risers behind them
  for (let i = n - 1; i >= 0; i--) {
    const sa = a0 + i * da, ea = i === n - 1 ? a1 : sa + da, z = dz * (i + 1);
    // worn nose: the step's front edge dips a little at a random point along its width
    const wear = 0.25 + r() * 0.5;
    s.add({ type: 'path', name: `side-${i}`, d: quad(p(sa, b1, 0), p(ea, b1, 0), p(ea, b1, z), p(sa, b1, z)), mat: pal.stone, shade: 'flat', band: 2 });
    // coursed stone on the side face: horizontal mortar courses and staggered vertical joints (stone-mid), and a
    // lit top edge along the step's side. Courses share heights across steps so they run on through the flight.
    const cH = X(4), jt = X(1.2);
    for (let c = 1; c * cH < z - jt * 1.5; c++) {
      const zc = c * cH;
      s.add({ type: 'path', name: `course-${i}-${c}`, d: quad(p(sa, b1, zc), p(ea, b1, zc), p(ea, b1, zc + jt), p(sa, b1, zc + jt)), mat: pal.stone, shade: 'flat', band: 1 });
    }
    for (let c = 0; c * cH < z - jt; c++) {
      const zlo = c * cH + (c ? jt : 0), zhi = Math.min((c + 1) * cH, z);
      // one joint per course per step, staggered course to course and step to step, a little irregular
      const ja = sa + (ea - sa) * (((c + i) % 2 ? 0.3 : 0.7) + (r() - 0.5) * 0.15);
      const jw = (ea - sa) * 0.09;
      s.add({ type: 'path', name: `vjoint-${i}-${c}`, d: quad(p(ja, b1, zlo), p(ja + jw, b1, zlo), p(ja + jw, b1, zhi), p(ja, b1, zhi)), mat: pal.stone, shade: 'flat', band: 1 });
    }
    s.add({ type: 'path', name: `side-lip-${i}`, d: quad(p(sa, b1, z - jt), p(ea, b1, z - jt), p(ea, b1, z), p(sa, b1, z)), mat: pal.stone, shade: 'flat', band: 1 });
    s.add({ type: 'path', name: `riser-${i}`, d: quad(p(sa, b0, 0), p(sa, b1, 0), p(sa, b1, z), p(sa, b0, z)), mat: pal.stone, shade: 'flat', band: 1 });
    s.add({ type: 'path', name: `tread-${i}`, d: quad(p(sa, b0, z), p(ea, b0, z), p(ea, b1, z), p(sa, b1, z)), mat: pal.stone, shade: 'flat', band: 0 });
    // short mortar joint from the nose: the tread is two stones, split off-centre, different per step
    const jb = b0 + (b1 - b0) * (0.35 + r() * 0.3);
    s.add({ type: 'path', name: `joint-${i}`, d: quad(p(sa, jb, z), p(ea - da * 0.45, jb, z), p(ea - da * 0.45, jb + 0.06, z), p(sa, jb + 0.06, z)), mat: pal.stone, shade: 'flat', band: 1 });
    // chip in the nose: a small notch of riser colour bitten out of the tread's front edge
    const cb = b0 + (b1 - b0) * wear;
    s.add({ type: 'path', name: `chip-${i}`, d: quad(p(sa, cb - 0.07, z), p(sa + da * 0.22, cb - 0.03, z), p(sa + da * 0.22, cb + 0.03, z), p(sa, cb + 0.07, z)), mat: pal.stone, shade: 'flat', band: 1 });
  }
  const floor = ctx.lib.proc(floorScene(ctx)).noDefaults().render();
  const flight = ctx.lib.proc(s).noDefaults().render();
  // flight (with its silhouette outline) over the rimless floor
  for (let i = 0; i < w * h; i++) if (flight.d[i * 4 + 3]) floor.d.set(flight.d.subarray(i * 4, i * 4 + 4), i * 4);
  return floor;
}
