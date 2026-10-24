// feature-fountain base.v2 (r2) — from base.v1: one change, the spout stack (finial, jet) sits 1 px lower (top = 21 px
// above the cell centre, not 22), so the flowing jet's outline no longer touches the frame's top row.
// base.v1 notes follow.
// feature-fountain base.v1 (r1) — adapted from the iso chest template to the brief: a round stone basin (about 0.45 m
// walls) with a central column, an upper bowl and a spout, 1.4 m tall (22 px) on the cell's centre (16, 24). 2D T2+ scene,
// no floor drawn. State flowing: cloth-ramp water fills the basin, falls from the upper bowl in two streams and rings the
// column's foot; state dry: the basin is empty, stained (dirt) with a crack and a little grit, the bowl bare.
export const meta = { brief: 'feature-fountain', pass: 'r2', notes: 'stone basin, column, bowl, spout; flowing water or dry', mirror: false };

export const params = {
  basin: { type: 'range', min: 11, max: 12, step: 1, default: 12 },
};

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h, { outline: true });
  const X = v => (v * w) / 32, cx = w / 2, cy = h - 8;                // the bottom diamond's centre
  const flowing = ctx.state !== 'dry';
  const R = X(P.basin), RY = R / 2, wall = Math.round(X(7)), rimY = cy - wall;
  const bowlY = Math.round(cy - X(14)), top = Math.round(cy - X(21));

  // basin wall: a base ellipse, the wall block, then the rim ellipse over it
  s.add({ type: 'ellipse', name: 'basin-foot', cx, cy, rx: R, ry: RY, mat: pal.stone, shade: 'flat', band: 2 });
  s.add({ type: 'rect', name: 'basin-wall', x: cx - R, y: rimY, w: R * 2, h: wall, mat: pal.stone, shade: 'cyl', axis: 'x' });
  s.add({ type: 'ellipse', name: 'basin-wall-foot', cx, cy: cy - 0, rx: R, ry: RY, mat: pal.stone, shade: 'cyl', axis: 'x' });
  s.add({ type: 'ellipse', name: 'basin-rim', cx, cy: rimY, rx: R, ry: RY, mat: pal.stone, shade: 'flat', band: 0 });
  // inner pool
  s.add({ type: 'ellipse', name: 'pool-lip', cx, cy: rimY + 1, rx: R - 2, ry: RY - 1, mat: pal.stone, shade: 'flat', band: 2 });
  if (flowing) {
    s.add({ type: 'ellipse', name: 'water', cx, cy: rimY + 1, rx: R - 3, ry: RY - 2, mat: pal.cloth, shade: 'flat', band: 1 });
    s.add({ type: 'ellipse', name: 'water-ring', cx, cy: rimY + 2, rx: X(6), ry: X(2.6), mat: pal.cloth, shade: 'flat', band: 0 });
    s.add({ type: 'ellipse', name: 'water-ring-in', cx, cy: rimY + 2, rx: X(4.4), ry: X(1.7), mat: pal.cloth, shade: 'flat', band: 1 });
  } else {
    s.add({ type: 'ellipse', name: 'dry-bed', cx, cy: rimY + 1, rx: R - 3, ry: RY - 2, mat: pal.dirt, shade: 'flat', band: 1 });
    s.add({ type: 'ellipse', name: 'dry-stain', cx: cx + X(3), cy: rimY + 2, rx: X(4), ry: X(1.4), mat: pal.dirt, shade: 'flat', band: 2 });
    s.add({ type: 'line', name: 'crack', x0: cx - X(7), y0: rimY + 1, x1: cx - X(3), y1: rimY + 3, w: 1, color: 'outline' });
    for (const [gx, gy] of [[-6, 3], [5, 1], [8, 2]]) s.add({ type: 'rect', name: 'grit', x: Math.round(cx + X(gx)), y: rimY + gy, w: 1, h: 1, mat: pal.stone, shade: 'flat', band: 0 });
  }

  // column, upper bowl and spout
  s.add({ type: 'rect', name: 'column', x: cx - 2, y: bowlY, w: 4, h: rimY - bowlY + 2, mat: pal.stone, shade: 'cyl', axis: 'x' });
  s.add({ type: 'rect', name: 'column-collar', x: cx - 3, y: rimY - 1, w: 6, h: 2, mat: pal.stone, shade: 'flat', band: 1 });
  s.add({ type: 'ellipse', name: 'bowl-under', cx, cy: bowlY + 2, rx: X(6), ry: X(2.6), mat: pal.stone, shade: 'cyl', axis: 'x' });
  s.add({ type: 'ellipse', name: 'bowl-rim', cx, cy: bowlY, rx: X(6), ry: X(2.6), mat: pal.stone, shade: 'flat', band: 0 });
  s.add({ type: 'ellipse', name: 'bowl-in', cx, cy: bowlY + 1, rx: X(4.4), ry: X(1.5), mat: flowing ? pal.cloth : pal.stone, shade: 'flat', band: flowing ? 1 : 2 });
  s.add({ type: 'rect', name: 'spout-stem', x: cx - 1, y: top + 2, w: 2, h: bowlY - top - 1, mat: pal.stone, shade: 'cyl', axis: 'x' });
  s.add({ type: 'ellipse', name: 'finial', cx, cy: top + 2, rx: 2, ry: 2, mat: pal.stone, shade: 'sphere' });
  if (flowing) {
    // jet up from the finial and two falling curtains from the bowl's lip into the pool
    s.add({ type: 'rect', name: 'jet', x: cx, y: top - 1, w: 1, h: 3, mat: pal.cloth, shade: 'flat', band: 0 });
    for (const sx of [-1, 1]) {
      const lx = Math.round(cx + sx * X(6));
      s.add({ type: 'rect', name: 'fall', x: lx - (sx > 0 ? 0 : 0), y: bowlY + 2, w: 1, h: rimY - bowlY - 1, mat: pal.cloth, shade: 'flat', band: 0 });
      s.add({ type: 'rect', name: 'fall-edge', x: lx + sx, y: bowlY + 3, w: 1, h: rimY - bowlY - 3, mat: pal.cloth, shade: 'flat', band: 1 });
    }
  }
  return ctx.lib.proc(s).add('materialNoise', { part: 'basin-wall', amount: 0.15 }).add('groundShadow', {}).render();
}
