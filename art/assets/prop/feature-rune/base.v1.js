// feature-rune base.v1 (r1) — adapted from the template to the brief: a rune carved in the floor, 0.05 m, flat on the cell's
// bottom diamond (centre (16, h-8), left undrawn). A ring squashed to the 2:1 floor, two iso-aligned crossing strokes and a
// centre dot, cut as a 1 px groove (stone dark) with a 1 px lit lip above it (stone light).
// dormant: the groove is filled with glowing accent lines (light core, mid falloff); spent: cold, the groove is just dark stone.
// 2D T2+ scene; accent ramp for the light (glow is outside the prop palette), stone for the carving. Role ramps only (R11).
export const meta = { brief: 'feature-rune', pass: 'r1', notes: 'carved ring + crossed strokes + dot; dormant glows accent, spent dark', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir, s = ctx.lib.t2.scene(w, h);
  const dormant = ctx.state !== 'spent', cx = Math.round(w / 2), cy = h - 8;
  const px = (x, y, mat, band) => s.add({ type: 'rect', name: 'p', x, y, w: 1, h: 1, mat, shade: 'flat', band });
  const pts = [];
  // ring: points on an ellipse rx 10, ry 5, walked in small steps
  const seen = new Set(), add = (x, y) => { const k = x + ',' + y; if (!seen.has(k)) { seen.add(k); pts.push([x, y]); } };
  for (let i = 0; i < 96; i++) { const a = (i / 96) * Math.PI * 2; add(cx + Math.round(Math.cos(a) * 10), cy + Math.round(Math.sin(a) * 5)); }
  // crossing strokes along the floor axes (down-right and down-left), 2:1
  for (let i = -6; i <= 6; i++) { add(cx + i, cy + Math.round(i / 2)); add(cx + i, cy - Math.round(i / 2)); }
  add(cx, cy); add(cx + 1, cy); add(cx, cy + 1); add(cx + 1, cy + 1);
  // lip (stone light, 1 px above, so the lit side is up-left), then groove (dark, or accent when dormant)
  for (const [x, y] of pts) if (!seen.has(x + "," + (y - 1))) px(x, y - 1, pal.stone, 0);
  for (const [x, y] of pts) {
    const core = Math.abs(x - cx) + 2 * Math.abs(y - cy) < 9;
    if (dormant) px(x, y, pal.accent, core ? 0 : 1);
    else px(x, y, pal.stone, 3);
  }
  return ctx.lib.proc(s).noDefaults().render();
}
