// terrain-stairs-up base.v2 (r2) — from base.v1, one change: the south-east side face of the flight is no longer one
// flat dark slab; it is cut into coursed stone blocks (courses ~4 px high, staggered vertical joints in stone-mid) with a
// stone-mid lit edge along the top of each step's side.
// base.v1 (r1) — from the iso floor tile template: a 32 x 32 frame with the cell's floor diamond (dirt,
// low contrast, a few worn stones) in the bottom 16 rows, and on it a short flight of four worn stone steps rising
// toward map north (screen up-right). Each step is a solid block: tread on top (lightest), riser facing south-west
// (lit, middle band), side facing south-east (shadow band). Treads are split by a mortar joint and chipped at the
// nose so the stone reads worn, not ruler-straight. Ramps: stone (steps), dirt (floor) only.
export const meta = { brief: 'terrain-stairs-up', pass: 'r2', notes: 'four worn stone steps rising map-north on a dirt floor diamond; SE side face coursed into stone blocks' };

export const params = {
  steps: { type: 'range', min: 3, max: 5, step: 1, default: 4 },
  stones: { type: 'range', min: 0, max: 4, step: 1, default: 3 },
};

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

  const R = [w - 1, h - 8];
  const diamond = `M${f(T)} L${f(R)} L${f(B)} L${f(L)} Z`;
  s.add({ type: 'path', name: 'floor', d: diamond, mat: pal.dirt, shade: 'flat', band: 1 });
  const bits = [];
  for (let i = 0; i < P.stones; i++) {
    const q = p(0.1 + r() * 0.8, r() < 0.5 ? 0.04 + r() * 0.1 : 0.86 + r() * 0.1);
    bits.push({ type: 'ellipse', name: 'worn-stone', cx: q[0], cy: q[1], rx: X(2), ry: X(1), mat: pal.dirt, shade: 'flat', band: i % 2 ? 0 : 2 });
  }
  if (bits.length) s.add({ type: 'group', name: 'floor-stones', clip: { type: 'path', d: diamond }, children: bits });

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
  return ctx.lib.proc(s).noDefaults().render();
}
