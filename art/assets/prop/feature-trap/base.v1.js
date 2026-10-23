// feature-trap base.v1 (r1) — adapted from the iso chest template, rebuilt as a flat T2+ scene: a found floor trap, 0.1 m,
// lying in the cell's floor diamond (centre 16, h - 8): a dark slot cut round a metal pressure plate with a red accent
// warning mark on it, spike tips rising from the slot at left, right and back (the mechanism).
// Role ramps only (R11): metal, stone, accent, outline.
export const meta = { brief: 'feature-trap', pass: 'r1', notes: 'pressure plate + spikes + mechanism in the floor', mirror: false };

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h);
  const cx = w / 2, cy = h - 8;
  const dia = (name, rx, ry, extra) => s.add({ type: 'poly', name, pts: [[cx - rx, cy], [cx, cy - ry], [cx + rx, cy], [cx, cy + ry]], ...extra });
  dia('slot', 13, 6, { color: 'outline' });                                  // dark pit round the plate
  dia('rim', 10, 5, { mat: pal.stone, shade: 'flat', band: 2 });               // stone surround
  dia('plate', 8, 4, { mat: pal.metal, shade: 'bevel' });                      // pressure plate
  // warning mark: a red diamond with a dark centre
  dia('mark', 4, 2, { mat: pal.accent, shade: 'flat', band: 1 });
  s.add({ type: 'rect', name: 'markdot', x: cx - 1, y: cy - 0.5, w: 2, h: 1, color: 'outline' });
  // spike tips at the four slot corners
  for (const [dx, dy] of [[-10, 0], [10, 0], [0, -4.5]]) {
    s.add({ type: 'poly', name: `spike${dx}${dy}`, pts: [[cx + dx - 1.5, cy + dy + 1], [cx + dx, cy + dy - 3], [cx + dx + 1.5, cy + dy + 1]], mat: pal.metal, shade: 'flat', band: 0, underlay: true });
  }
  return s.render();
}
