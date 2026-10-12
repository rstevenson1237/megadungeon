// terrain-water-deep base.v4 (x1, extra revision after the blind re-score) — from base.v2. One change, the ripple
// layout and motion, as both reviews of finish.v1 asked: the same arcs at the same spots tiled into a wallpaper of
// caret marks and the loop was near-static (one lock-step glint). Now the body stays flat on the grass ramp's darkest
// step and only three ripple marks are drawn (grass.1, 1 px tall), each a shallow line leaning along one iso slope in
// 2:1 steps, 3-5 lit px long with its trailing end broken off to nothing, at off-grid spots of mixed slope and length.
// Each mark slides 1 px per frame along its own fixed 2:1 staircase, growing then shrinking, on its own phase, so the
// field visibly flows; at frame 3 every mark is short and fading and frame 0 starts it afresh, so 3 -> 0 joins.
// No glint (grass.0 is unused). Marks are drawn at the tile's lattice images ((+-16, 8) px) and clipped to the
// diamond, so diamonds tile seamlessly. About 11-13 light px per tile: the floor keeps low contrast.
export const meta = { brief: 'terrain-water-deep', pass: 'x1', notes: 'deep water: flat darkest body, 3 off-grid 2:1 ripple lines with fading tails that drift 1 px/frame on staggered phases; no glint' };

export const params = {
  drift: { type: 'range', min: 0, max: 1, step: 1, default: 1 },
};

// Per-phase masks, written head last (the mark moves toward its head): '1' lit, '.' gap (the tail fading out).
const MASKS = ['111', '1.1111', '1.1111', '1.11'];
// Ripple marks: start [x, y] on the diamond (y from its top row), slope +1 (down-right) or -1 (up-right), phase.
const MARKS = [
  { x: 2, y: 7, slope: 1, phase: 0 },
  { x: 13, y: 12, slope: -1, phase: 2 },
  { x: 17, y: 3, slope: 1, phase: 1 },
];

export function render(ctx) {
  const P = ctx.params, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h, { outline: false });
  const frame = Math.round((ctx.t || 0) * 4) % 4;
  const top = h - 16, cy = top + 8, diamond = `M${w / 2} ${top} L${w} ${cy} L${w / 2} ${h} L0 ${cy} Z`;
  s.add({ type: 'path', name: 'water', d: diamond, mat: 'grass', shade: 'flat', band: 2 });
  const inside = (x, y) => Math.abs(x + 0.5 - w / 2) / (w / 2) + Math.abs(y + 0.5 - cy) / 8 <= 1;
  // lattice images of the tile: one step along either diamond axis is (+-w/2, 8)
  const images = [];
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) images.push([(i - j) * w / 2, (i + j) * 8]);
  const bits = [];
  for (const m of MARKS) {
    const ph = (frame + m.phase) % 4, mask = MASKS[ph], start = ph * P.drift;
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] !== '1') continue;
      const k = start + i; // index on the mark's fixed 2:1 staircase
      const px = m.x + k, py = top + m.y + m.slope * Math.floor(k / 2);
      for (const [ox, oy] of images) {
        const x = px + ox, y = py + oy;
        if (!inside(x, y)) continue;
        bits.push({ type: 'rect', name: 'ripple', x, y, w: 1, h: 1, color: 'grass.1' });
      }
    }
  }
  s.add({ type: 'group', name: 'surface', clip: { type: 'path', d: diamond }, children: bits });
  return ctx.lib.proc(s).noDefaults().render();
}
