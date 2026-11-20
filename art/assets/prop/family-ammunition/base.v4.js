// family-ammunition base.v4 (x2) — from base.v3 (Robert's one approved retry after the wave 1 blind miss). Both
// reviewers read v3's shafts as a noisy checker (36% orphans), sticks or a log. Kept: the bundle lying flat on the
// iso diagonal, heads up-right, fletching down-left, material colours only (no accent red). Changed, as named:
// three clean parallel 1 px shafts on even 2:1 steps in one mid wood tone (wood.1), separated by dark wood gaps, with
// a lit top (wood.0) and the ink outline on the outer edge only; each head a distinct metal point (metal.0 body,
// metal.1 barb, metal.2 dark tip), staggered; pale fletching (cloth.0) fanned outward at the tail; the binding a solid
// 2 px leather band that pinches the bundle at its middle. Ramps and tokens only (R11).
export const meta = { brief: 'family-ammunition', pass: 'x2', notes: 'three clean parallel shafts on 2:1 steps, staggered metal points, fanned fletching, 2 px pinching band', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir, ink = ctx.dir.outline;
  const g = ctx.lib.t2.scene3d({ k: 2 }).render(w, h, { renderer: 'raster', yaw: 45, pivot: [0, 0, 0], at: [w / 2, h - 8], shadow: false });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g.alpha(x, y) > 0) g.clear(x, y);
  const cx = w >> 1, cy = h - 8; // the cell centre
  const px = new Map(); // "x,y" -> colour, relative to the band at (cx, cy - 4)
  const put = (x, y, c) => px.set(x + ',' + y, c);
  const has = (x, y) => px.has(x + ',' + y);
  const line = (x) => -Math.floor(x / 2); // an even 2:1 step: two pixels per row, rising to the right
  const L = 7;
  // three shafts, two rows apart (one dark gap row between), shifted along the diagonal so heads and fletching stagger
  const shafts = [
    { off: -2, sh: 3 },
    { off: 0, sh: 0 },
    { off: 2, sh: -3 },
  ];
  const pinch = (x, s) => (x === 0 || x === 1 ? -Math.sign(s.off) : 0); // outer shafts drawn in by the band
  const yAt = (x, s) => line(x) + s.off + pinch(x, s);
  for (const s of shafts) { s.x0 = -L + s.sh; s.x1 = L + s.sh; }
  for (const s of shafts) for (let x = s.x0; x <= s.x1; x++) put(x, yAt(x, s), pal.wood[1]);
  // dark wood between the shafts (so the outline stays on the outer edge), lit top over the upper shaft
  for (let x = -L - 4; x <= L + 4; x++) {
    const ys = shafts.filter((s) => x >= s.x0 && x <= s.x1).map((s) => yAt(x, s));
    if (ys.length < 2) continue;
    for (let y = Math.min(...ys) + 1; y < Math.max(...ys); y++) if (!has(x, y)) put(x, y, pal.wood[2]);
  }
  const top = shafts[0];
  for (let x = top.x0 + 3; x <= top.x1; x++) if (x !== 0 && x !== 1) put(x, yAt(x, top) - 1, pal.wood[0]);
  for (const s of shafts) {
    // head: a 3 px metal point beyond the shaft, barbed above and below, with a dark tip
    const y1 = line(s.x1 + 1) + s.off;
    put(s.x1 + 1, y1, pal.metal[0]); put(s.x1 + 2, line(s.x1 + 2) + s.off, pal.metal[0]);
    put(s.x1 + 1, y1 - 1, pal.metal[1]); put(s.x1 + 1, y1 + 1, pal.metal[1]);
    put(s.x1 + 3, line(s.x1 + 3) + s.off, pal.metal[2]);
    // fletching: a pale vane above the last three shaft pixels (and below, on the lowest shaft), fanned outward
    // at the tail end on the outer shafts
    for (let x = s.x0; x < s.x0 + 3; x++) {
      const y = yAt(x, s), fan = x === s.x0 ? 1 : 0;
      put(x, y - 1 - (s.off < 0 ? fan : 0), pal.cloth[0]);
      if (s.off > 0) put(x, y + 1 + fan, pal.cloth[0]);
    }
  }
  // the binding: a solid 2 px leather band across the bundle at its middle
  for (const x of [0, 1]) {
    const ys = shafts.map((s) => yAt(x, s));
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) put(x, y, x === 0 ? pal.leather[0] : pal.leather[1]);
  }
  const ox = cx - 1, oy = cy - 4;
  for (const k of px.keys()) {
    const [x, y] = k.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!px.has((x + dx) + ',' + (y + dy))) g.set(ox + x + dx, oy + y + dy, ink);
  }
  for (const [k, c] of px) { const [x, y] = k.split(',').map(Number); g.set(ox + x, oy + y, c); }
  return g;
}
