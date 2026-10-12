// terrain-water-deep base.v2 (r2) — from base.v1. One change, as the r1 review asked: the busy dash field of ripple
// crests is replaced by three long, irregular, broken swells per tile (grass.1, about 5% of the diamond, no repeating
// dash rhythm) that keep their exact shape and rock 1 px per frame (0, 1, 2, 1 px right) for a slow, seamless loop;
// grass.0 is cut to a single glint pixel on one frame. Body still the grass ramp's darkest step, no outline. Each
// swell is drawn at its iso-lattice images ((+-16, 8) px) and clipped to the diamond, so diamonds tile seamlessly.
export const meta = { brief: 'terrain-water-deep', pass: 'r2', notes: 'deep water: 3 long irregular swells that keep their shape and rock 1 px/frame; one glint on one frame' };

export const params = {
  drift: { type: 'range', min: 0, max: 2, step: 1, default: 1 },
};

// Swells as runs [dx, dy, length] relative to an anchor (top of frame = row 0 of the diamond).
const SWELLS = [
  { x: 4, y: 5, runs: [[0, 0, 3], [3, -1, 2], [6, -1, 1]] },
  { x: 18, y: 9, runs: [[0, 0, 2], [2, 1, 3]] },
  { x: 11, y: 12, runs: [[0, 0, 2], [3, 0, 1]] },
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
  // a single glint on the first swell's crest, on the frame where it rocks furthest
  if (frame === 2) bits.push({ type: 'rect', name: 'glint', x: SWELLS[0].x + 4 + dx, y: top + SWELLS[0].y - 1, w: 1, h: 1, color: 'grass.0' });
  s.add({ type: 'group', name: 'surface', clip: { type: 'path', d: diamond }, children: bits });
  return ctx.lib.proc(s).noDefaults().render();
}
