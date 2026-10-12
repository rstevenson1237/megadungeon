// terrain-stairs-up base.v4 (x1) — from base.v3, one change, for the gate's line check that finish.v1 failed: the floor
// diamond is no longer drawn. The game draws the floor tile under a rising stair (as under debris and the teleporter),
// so everything outside the stair body is transparent; the flight stands on the bottom diamond at the same place with
// its own silhouette outline, plus a 1 px stone-dark contact shade on the floor at its south-east foot. Within that
// change the tread lips are clean: the nose chips are gone and each tread's mortar joint starts behind the lip, so
// every step reads as an unbroken stone-light band over its stone-mid riser.
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
export const meta = { brief: 'terrain-stairs-up', pass: 'x1', notes: 'four worn stone steps rising map-north; no floor diamond (the game draws the floor under it), outline on the flight, 1 px contact shade, clean tread lips' };

export const params = {
  steps: { type: 'range', min: 3, max: 5, step: 1, default: 4 },
};

const LAYOUTS = [
  [{ k: 'A', f: 0.47 }, { k: 'B', f: 0.55, oLo: 0, oHi: 0.47 }],
  [{ k: 'B', f: 0.47 }, { k: 'A', f: 0.6, oLo: 0, oHi: 0.47 }],
  [{ k: 'A', f: 0.33 }, { k: 'B', f: 0.6, oLo: 0.33, oHi: 1 }],
  [{ k: 'B', f: 0.6 }],
];

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
    r(); // (kept: the same rng draws as base.v3, so the joints stay where they were)
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
    // short mortar joint set back from the nose (the lip stays an unbroken light band): the tread is two stones
    const jb = b0 + (b1 - b0) * (0.35 + r() * 0.3);
    s.add({ type: 'path', name: `joint-${i}`, d: quad(p(sa + da * 0.35, jb, z), p(ea - da * 0.3, jb, z), p(ea - da * 0.3, jb + 0.06, z), p(sa + da * 0.35, jb + 0.06, z)), mat: pal.stone, shade: 'flat', band: 1 });
  }
  const flight = ctx.lib.proc(s).noDefaults().render();
  // no floor diamond: the game draws the floor tile under the stair. Only a 1 px stone-dark contact shade on the floor
  // along the flight's near (front, lower-left and right, lower-right) base, inside the bottom diamond.
  const top = h - 16, cx = w / 2, sd = pal.stone.length - 1;
  const inD = (x, y) => y >= top && y < h && Math.abs(x + 0.5 - cx) / cx + Math.abs(y + 0.5 - top - 8) / 8 <= 1;
  const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && flight.d[(y * w + x) * 4 + 3] > 0;
  const shade = ctx.lib.t2.scene(w, h, { outline: false }), bits = [];
  for (let y = top + 1; y < h; y++) for (let x = 0; x < w; x++)
    if (!op(x, y) && inD(x, y) && op(x - 1, y) && !op(x - 1, y + 1) && y >= h - 9)
      bits.push({ type: 'rect', name: 'contact', x, y, w: 1, h: 1, mat: pal.stone, shade: 'flat', band: sd });
  shade.add({ type: 'group', name: 'contact-shade', children: bits });
  const out = ctx.lib.proc(shade).noDefaults().render();
  for (let i = 0; i < w * h; i++) if (flight.d[i * 4 + 3]) out.d.set(flight.d.subarray(i * 4, i * 4 + 4), i * 4);
  return out;
}
