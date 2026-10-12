// terrain-water-deep base.v3 (r3) — from base.v2. One change, as the r2 review asked: the three short 2-5 px swells
// are replaced by two long, broken swells (about 10 and 12 px each, stepped runs along the iso axis (2, 1)) whose
// lattice images carry them across the tile seams, so the tiled field reads as continuous slow waves instead of a
// dotted lattice; density stays near 4%. Everything else as v2: grass.2 body, grass.1 swells rocking 1 px a frame,
// one grass.0 glint on one frame, no outline, clipped to the diamond so diamonds tile seamlessly.
export const meta = { brief: 'terrain-water-deep', pass: 'r3', notes: 'deep water: 2 long broken swells along one iso axis, continuous across seams, rocking 1 px/frame; one glint on one frame' };

export const params = {
  drift: { type: 'range', min: 0, max: 2, step: 1, default: 1 },
};

// Swells as runs [dx, dy, length] relative to an anchor (top of frame = row 0 of the diamond).
const SWELLS = [
  // long swell: stepped runs along the iso axis (2, 1), broken by two gaps
  { x: 3, y: 3, runs: [[0, 0, 3], [3, 1, 2], [5, 2, 1], [9, 4, 2], [11, 5, 1], [14, 6, 2]] },
  // second, shorter and offset swell, so the two never line up into a grid
  { x: 17, y: 4, runs: [[0, 0, 2], [2, 1, 2], [6, 3, 3], [9, 4, 1]] },
];

export function render(ctx) {
  const P = ctx.params, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h, { outline: false });
  const frame = Math.round((ctx.t || 0) * 4) % 4;
  const dx = [0, 1, 2, 1][frame] * P.drift;
  const top = h - 16, cy = top + 8, diamond = `M${w / 2} ${top} L${w} ${cy} L${w / 2} ${h} L0 ${cy} Z`;
  s.add({ type: 'path', name: 'water', d: diamond, mat: 'grass', shade: 'flat', band: 2 });
  const bits = [];
  const inside = (x, y) => Math.abs(x + 0.5 - w / 2) / (w / 2) + Math.abs(y + 0.5 - cy) / 8 <= 1;
  // lattice images of the tile: one step along either diamond axis is (+-w/2, 8)
  const images = [];
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) images.push([(i - j) * w / 2, (i + j) * 8]);
  for (const sw of SWELLS) {
    for (const [ox, oy] of images) {
      for (const [rx, ry, len] of sw.runs) {
        const x = sw.x + rx + ox + dx, y = top + sw.y + ry + oy;
        if (y < top || y >= h) continue;
        let hit = false; // keep only runs with a pixel inside the diamond (the clip would hide the rest)
        for (let k = 0; k < len; k++) if (inside(x + k, y)) hit = true;
        if (!hit) continue;
        bits.push({ type: 'rect', name: 'swell', x, y, w: len, h: 1, color: 'grass.1' });
      }
    }
  }
  // a single glint just above the second swell's longest run, on the frame where it rocks furthest
  if (frame === 2) bits.push({ type: 'rect', name: 'glint', x: SWELLS[1].x + 7 + dx, y: top + SWELLS[1].y + 2, w: 1, h: 1, color: 'grass.0' });
  s.add({ type: 'group', name: 'surface', clip: { type: 'path', d: diamond }, children: bits });
  return ctx.lib.proc(s).noDefaults().render();
}
