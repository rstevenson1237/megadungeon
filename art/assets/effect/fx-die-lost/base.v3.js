// fx-die-lost base.v3 (x1) — from base.v2. Blind re-score 6: the die was a flat front-on square that read as a tile,
// card or domino, and the f4 halves were a cramped jumble.
// Changed: the die is now a small iso cube (light top face with 1 pip, a lit left face with 2 pips, a shaded right face
// with 3 pips); a clean one-pixel crack runs down the middle from the back corner (f2) through the front edge (f3); on
// f4 the two halves are pushed 2-3 px apart, each tilted outward and dimmed, with a few chip pixels between them.
export const meta = { brief: 'fx-die-lost', pass: 'x1', notes: 'iso cube die: falls, cracks, splits into tilted halves' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx, Grid } = ctx.lib, g = new Grid(w, h);
  const [hot] = fx.colors(['glow.0']);
  const [peach, red] = fx.colors(['accent.0', 'accent.1']);
  const [pale, mid, dark] = fx.colors(['cloth']);
  const f = Math.min(3, Math.round(ctx.t * 4));
  const cx = 11, top = [1, 3, 5, 5][f];
  const HW = 6, SIDE = 6; // half width of the top diamond, height of the side faces

  // which face a local pixel (dx from the centre column, y from the back corner) belongs to
  const face = (dx, y) => {
    if (Math.abs(dx) > HW || y < 0) return null;
    if (y <= 2 * (HW / 2) && Math.abs(dx) <= 2 * Math.min(y, HW - y)) return 'top';
    if (dx < 0) { const e = HW / 2 + (dx + HW) / 2; return y > e && y <= e + SIDE ? 'left' : null; }
    const e = HW - dx / 2; return y > e && y <= e + SIDE ? 'right' : null;
  };
  const pips = new Set(['0,2', '-1,3', '0,3', '1,3', '0,4', // top: one red pip (an iso dot)
    '-5,6', '-5,7', '-2,9', '-2,10', // left: two pips, diagonal
    '1,10', '3,8', '5,6']); // right: three pips, diagonal
  // crack: x offset per row, one pixel wide, from the back corner down the front edge
  const crackX = [0, 0, 0, 1, 1, 0, 0, 0, -1, -1, 0, 0, 0];
  const crackRows = [0, 6, 13, 13][f];
  const isCrack = (dx, y) => y < crackRows && crackX[y] === dx;
  const isLeft = (dx, y) => dx < (crackX[y] ?? 0);

  const lit = { top: hot, left: pale, right: mid }; // warm lit top, cool shaded sides
  const pipC = { top: red, left: dark, right: pale };
  for (let y = 0; y <= HW + SIDE; y++) for (let dx = -HW; dx <= HW; dx++) {
    const fc = face(dx, y);
    if (!fc) continue;
    const crack = isCrack(dx, y);
    const pip = pips.has(`${dx},${y}`);
    let px = cx + dx, py = top + y, c = pip ? pipC[fc] : lit[fc];
    if (f < 3) { g.set(px, py, crack ? dark : c); continue; }
    if (crack) continue; // the split opens where the crack ran
    const left = isLeft(dx, y);
    if (!pip && fc === 'top') c = peach; // the broken halves dim
    // halves pushed apart and tilted outward (outer edge drops)
    if (left) { px -= 3; py += 1 + Math.floor(-dx / 4); } else { px += 3; py += 2 + Math.floor(dx / 4); }
    g.set(px, py, c);
  }
  if (f === 3) for (const [x, y] of [[cx, top - 1], [cx - 9, top + 2], [cx + 10, top + 5]]) g.set(x, y, hot); // chips
  return fx.line(g);
}
