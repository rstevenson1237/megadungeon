// terrain-floor base.v1 (r1) — Megadungeon's floor: worn, irregular flagstones on a 32 x 16 iso diamond, adapted from
// the direction probe's flagstone floor (art/probes/tile/base.v2.js). Dirt ramp only (the theme's floor token) plus
// nothing else: stones in the middle band, a worn stone or two in the light band, joints and cracks in the dark band.
// Low in contrast so creatures stand out. ctx.variant picks one of four stone layouts and jitters the joints, so the
// four variants scatter without a ruler grid. Each stone is inset half a joint from the diamond's edge, so diamonds
// tile seamlessly with a full joint on every seam.
export const meta = { brief: 'terrain-floor', pass: 'r1', notes: 'worn irregular flagstones, 4 layouts, dirt only' };

export const params = {
  worn: { type: 'range', min: 0, max: 2, step: 1, default: 1 },
  cracks: { type: 'range', min: 0, max: 3, step: 1, default: 2 },
};

// four layouts in the cell's own (u, v) square, u running down-right, v down-left; each stone a list of corners
const LAYOUTS = [
  // four flags, offset
  [[[0, 0], [0.55, 0], [0.55, 0.45], [0, 0.45]], [[0.55, 0], [1, 0], [1, 0.5], [0.55, 0.45]],
   [[0, 0.45], [0.45, 0.45], [0.45, 1], [0, 1]], [[0.45, 0.45], [0.55, 0.45], [1, 0.5], [1, 1], [0.45, 1]]],
  // one large flag and three smaller
  [[[0, 0], [0.62, 0], [0.62, 0.6], [0, 0.6]], [[0.62, 0], [1, 0], [1, 0.6], [0.62, 0.6]],
   [[0, 0.6], [0.4, 0.6], [0.4, 1], [0, 1]], [[0.4, 0.6], [1, 0.6], [1, 1], [0.4, 1]]],
  // three long flags across, the middle one split
  [[[0, 0], [1, 0], [1, 0.32], [0, 0.32]], [[0, 0.32], [0.48, 0.32], [0.48, 0.68], [0, 0.68]],
   [[0.48, 0.32], [1, 0.32], [1, 0.68], [0.48, 0.68]], [[0, 0.68], [1, 0.68], [1, 1], [0, 1]]],
  // five flags, a small one in the middle
  [[[0, 0], [0.5, 0], [0.4, 0.4], [0, 0.5]], [[0.5, 0], [1, 0], [1, 0.45], [0.62, 0.38], [0.4, 0.4]],
   [[0, 0.5], [0.4, 0.4], [0.45, 0.62], [0.38, 1], [0, 1]], [[0.4, 0.4], [0.62, 0.38], [0.65, 0.6], [0.45, 0.62]],
   [[0.62, 0.38], [1, 0.45], [1, 1], [0.38, 1], [0.45, 0.62], [0.65, 0.6]]],
];

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h, { outline: false });
  const dirt = pal.dirt, dark = dirt.length - 1, v = ((ctx.variant | 0) % 4 + 4) % 4;
  // own seeded stream per variant so each variant's jitter is its own and stable
  let a = 0x9e3779b9 ^ (v * 2654435761), r = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const cx = w / 2, top = h - 16, hw = w / 2, hh = 8;
  const toXY = ([u, q]) => [cx + (u - q) * hw, top + (u + q) * hh];
  const diamond = `M${cx} ${top} L${w} ${top + hh} L${cx} ${h} L0 ${top + hh} Z`;
  // the joints: the whole diamond in the dark band, the stones laid over it
  s.add({ type: 'path', name: 'joint', d: diamond, mat: dirt, shade: 'flat', band: dark });
  // jitter only interior points (not on the cell's edges) so the seams line up between cells
  const jit = new Map(), J = 0.07;
  const jitter = ([u, q]) => {
    const k = `${u},${q}`;
    if (!jit.has(k)) jit.set(k, [u > 0 && u < 1 ? u + (r() - 0.5) * J : u, q > 0 && q < 1 ? q + (r() - 0.5) * J : q]);
    return jit.get(k);
  };
  const stones = LAYOUTS[v].map(f => f.map(jitter));
  const worn = new Set(); while (worn.size < Math.min(P.worn, stones.length)) worn.add(Math.floor(r() * stones.length));
  const bits = [];
  stones.forEach((f, i) => {
    // in screen pixels: shrink toward the centroid by half a joint (0.8 px), then chamfer each corner 1-2 px so the
    // stones look worn, not cut; the seams between cells get the same joint as the joints inside a cell
    const sp = f.map(toXY), c = sp.reduce((m, p) => [m[0] + p[0] / sp.length, m[1] + p[1] / sp.length], [0, 0]);
    const ins = sp.map(([x, y]) => { const dx = c[0] - x, dy = c[1] - y, L = Math.hypot(dx, dy) || 1, k = Math.min(0.4, 0.8 / L); return [x + dx * k, y + dy * k]; });
    const pts = [];
    ins.forEach((p, k) => {
      const ch = 1 + r() * 1.2;
      for (const o of [ins[(k + ins.length - 1) % ins.length], ins[(k + 1) % ins.length]]) {
        const dx = o[0] - p[0], dy = o[1] - p[1], L = Math.hypot(dx, dy) || 1, t = Math.min(0.35, ch / L);
        pts.push([p[0] + dx * t, p[1] + dy * t]);
      }
    });
    const d = 'M' + pts.map(p => p.map(n => n.toFixed(2)).join(' ')).join(' L') + ' Z';
    bits.push({ type: 'path', name: 'stone', d, mat: dirt, shade: 'flat', band: worn.has(i) ? 0 : 1 });
  });
  // hairline cracks and chips in the joint colour, inside stones
  for (let i = 0; i < P.cracks; i++) {
    const f = stones[Math.floor(r() * stones.length)], c = f.reduce((m, p) => [m[0] + p[0] / f.length, m[1] + p[1] / f.length], [0, 0]);
    const p0 = toXY([c[0] + (r() - 0.5) * 0.15, c[1] + (r() - 0.5) * 0.15]), len = 2 + Math.floor(r() * 3), dir = r() < 0.5 ? 1 : -1;
    bits.push({ type: 'rect', name: 'crack', x: Math.round(p0[0]), y: Math.round(p0[1]), w: len, h: 1, mat: dirt, shade: 'flat', band: dark });
    bits.push({ type: 'rect', name: 'crack', x: Math.round(p0[0]) + (dir > 0 ? len : -1), y: Math.round(p0[1]) + 1, w: 1, h: 1, mat: dirt, shade: 'flat', band: dark });
  }
  s.add({ type: 'group', name: 'surface', clip: { type: 'path', d: diamond }, children: bits });
  return ctx.lib.proc(s).noDefaults().render();
}
