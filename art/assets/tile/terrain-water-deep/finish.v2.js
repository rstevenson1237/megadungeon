// finish.v2 (f) on base.v4 — the one direct-pixel pass (R2), doing what the base.v4 review asked: its three ripples
// sat on mirrored slopes at the same tile spots and tiled into columns of < > chevrons. The surface is reset to the
// flat grass-darkest body (grass.2), then only TWO ripples are painted in grass.1, both on ONE slope (NE-SW, 2:1
// steps rising to the right), each at most 3 lit px. They sit on different NE-SW lines (x + 2y = 26 and 40, so the
// tiled field gets unevenly spaced rows 7 and 9 px apart rather than a grid) and away from the left and right corner
// tips, fully inside the diamond so nothing wraps across a seam. Each ripple's head slides 1 px per frame along its
// staircase (2 px, 3 px, broken 1.1, fading to 1 px); the two run half a loop apart, so frame 3 -> 0 joins and the lit count
// stays 4 px per tile. No glint, no outline. Grass ramp only (R11).
export const base = 'base.v4';
export const meta = { notes: 'deep water finish: flat grass.2 body, 2 short NE-SW ripples (<=3 px) on distinct lines, 1 px/frame drift, half-loop apart' };

// Per-phase lit masks along the staircase, tail first; each mask ends at k = phase + 1, so the head moves 1 px a frame.
const MASKS = ['11', '111', '1.1', '1'];
// start [x, y] on the diamond (y from its top row), loop phase
const RIPPLES = [
  { x: 8, y: 9, phase: 0 },
  { x: 14, y: 13, phase: 2 },
];

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const f = ((ctx.frame ?? 0) % 4 + 4) % 4, top = g.h - 16;
  // reset the surface: every opaque pixel back to the body tone
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (px.tokenAt(g, [x, y])) px.set(g, [x, y], 'grass.2');
  for (const r of RIPPLES) {
    const ph = (f + r.phase) % 4, mask = MASKS[ph];
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] !== '1') continue;
      const k = ph + 2 - mask.length + i; // index on the ripple's fixed NE-SW 2:1 staircase
      const X = r.x + k, Y = top + r.y - Math.floor(k / 2);
      if (px.tokenAt(g, [X, Y])) px.set(g, [X, Y], 'grass.1');
    }
  }
  return g;
}
