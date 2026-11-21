// fx-die-lost base.v4 (x2) — from base.v3. Both wave 1 reviewers: the red + on the top face read as a first-aid kit,
// the side pips were lost at 1x, and f4 ended on a cramped jumble with a stray spark above the right half.
// Changed (all named by the retry note; cube, crack and split kept): the top face shows one big dark centre pip (an iso disc, an ace)
// (no red on the face); red is used only on the crack (its line in f2-f3, the broken edges in f4); the side pips
// are 2px clusters in a strongly contrasting step (dark on the lit left face, pale on the shaded right face);
// in f4 the halves fall further apart and fade to darker steps, with a few shards scattered low to the sides,
// and the lone spark above the right half is gone.
export const meta = { brief: 'fx-die-lost', pass: 'x2', notes: 'iso cube die showing an ace: falls, cracks red, splits into fading halves and shards' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx, Grid } = ctx.lib, g = new Grid(w, h);
  const [hot] = fx.colors(['glow.0']);
  const [red] = fx.colors(['accent.1']);
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
  const pips = new Set([
    '-1,2', '0,2', '1,2', '-2,3', '-1,3', '0,3', '1,3', '2,3', '-1,4', '0,4', '1,4', // top: one big dark centre pip (an iso disc)
    '-5,6', '-5,7', '-2,9', '-2,10', // left: two pips, 2px each
    '5,5', '5,6', '3,7', '3,8', '1,9', '1,10']); // right: three pips, 2px each
  // crack: x offset per row, one pixel wide, from the back corner down the front edge
  const crackX = [0, 0, 0, 1, 1, 0, 0, 0, -1, -1, 0, 0, 0];
  const crackRows = [0, 6, 13, 13][f];
  const isCrack = (dx, y) => y < crackRows && crackX[y] === dx;
  const isLeft = (dx, y) => dx < (crackX[y] ?? 0);

  const lit = { top: hot, left: pale, right: mid }; // warm lit top, cool shaded sides
  const pipC = { top: dark, left: dark, right: pale };
  const dim = { top: pale, left: mid, right: dark }; // f4: the broken halves fade a step
  const dimPip = { top: dark, left: dark, right: mid };
  for (let y = 0; y <= HW + SIDE; y++) for (let dx = -HW; dx <= HW; dx++) {
    const fc = face(dx, y);
    if (!fc) continue;
    const crack = isCrack(dx, y);
    const pip = pips.has(`${dx},${y}`);
    let px = cx + dx, py = top + y;
    if (f < 3) { g.set(px, py, crack ? red : pip ? pipC[fc] : lit[fc]); continue; }
    if (crack) continue; // the split opens where the crack ran
    const left = isLeft(dx, y);
    const edge = isCrack(dx + (left ? 1 : -1), y); // the broken edge keeps the crack's red
    const c = edge ? red : pip ? dimPip[fc] : dim[fc];
    // halves pushed apart and tilted outward (outer edge drops)
    if (left) { px -= 4; py += 1 + Math.floor(-dx / 4); } else { px += 4; py += 2 + Math.floor(dx / 4); }
    g.set(px, py, c);
  }
  if (f === 3) { // a few shards scattered low and to the sides, none above
    for (const [x, y, c] of [[cx - 9, top + 14, pale], [cx - 1, top + 14, mid], [cx + 1, top + 13, pale], [cx + 12, top + 11, mid]]) {
      if (x >= 0 && x < w && y >= 0 && y < h) g.set(x, y, c);
    }
  }
  return fx.line(g);
}
