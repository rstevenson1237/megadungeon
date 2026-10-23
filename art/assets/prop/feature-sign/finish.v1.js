// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), on the base.v3 review's finish-level notes:
// 1. Letters that survive 1x: base.v3 scatters dark-wood grain flecks over the plaque, so its 1 px letter dashes drown
//    in them. On the wall faces the plaque's inside is repainted in base.v3's own face space: no flecks, the light rim
//    kept (left face lit, right face mid), and two lines of bolder scratched letters, 2 px tall, in the darkest wood step.
// 2. Cord: the pale leather step read as flesh or ribbon. The cord is now a 1 px dark line in the direction's ink (a dark
//    rope; the line gate counts only ink on the silhouette's edge, so a dark-wood cord with no ring fails it), and its
//    loose ink ring (the stray pixels round the cord and inside the V) is cleared: ink stays only on the cord itself and
//    where it edges the plaque or the nail.
// The cap state is as base.v3. Rule-based ops (re-apply after re-renders); tokens only (R11). The wood ramp itself is
// the direction's (olive): moving the body to a browner ramp is a base or direction change, not a finish.
export const base = 'base.v3';
export const meta = { notes: 'flecks removed, bolder 2-row letters; cord a 1 px dark ink rope, its loose ink ring cleared' };

// scratched letters in the plaque's face space, u 2..8, two lines at v 2-3 and 5-6 (x = scratch)
const LETTERS = {
  2: 'xx.x.xx',
  3: 'x..x..x',
  5: 'xxx.xx.',
  6: 'x.x.x..',
};

export function finish(g, ctx) {
  const { px } = ctx.lib;
  if (ctx.state === 'cap') return g;
  const right = ctx.state === 'right';
  const W = 11, H = 8, x0 = 3, v0 = 12; // base.v3's plaque size and placement on the face
  const at = (u, v) => {
    const xl = x0 + u, yl = 8 + Math.floor((xl + 0.5) / 2) + v0 + v;
    return [right ? g.w - 1 - xl : xl, yl];
  };

  // 1. repaint the plaque's inside (the ink rim stays)
  for (let v = 1; v < H - 1; v++) for (let u = 1; u < W - 1; u++) {
    const row = LETTERS[v], li = u - 2;
    let t;
    if (row && li >= 0 && li < row.length && row[li] === 'x') t = 'wood.2';
    else if ((u === 1 || v === 1) && !right) t = 'wood.0';
    else t = 'wood.1';
    px.set(g, at(u, v), t);
  }

  // 2. cord: a 1 px ink rope; clear ink that only rings the cord
  const ink = px.color('outline'), cordOld = px.color('leather.0');
  const nail = px.color('metal.0');
  const opaque = (x, y) => g.inb(x, y) && g.alpha(x, y) === 255;
  const cord = new Set();
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++)
    if (opaque(x, y) && g.get(x, y) === cordOld) { cord.add(x + ',' + y); g.set(x, y, ink); }
  const plaqueOrNail = (x, y) => {
    if (!opaque(x, y)) return false;
    const c = g.get(x, y);
    return c === nail || c === px.color('wood.0') || c === px.color('wood.1');
  };
  // the plaque's ink rim in face space is kept whatever its neighbours are
  const rim = new Set();
  for (let v = 0; v < H; v++) for (let u = 0; u < W; u++)
    if ((u === 0 || v === 0 || u === W - 1 || v === H - 1) && !((u === 0 || u === W - 1) && (v === 0 || v === H - 1)))
      rim.add(at(u, v).join(','));
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const clear = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (!opaque(x, y) || g.get(x, y) !== ink || rim.has(x + ',' + y) || cord.has(x + ',' + y)) continue;
    if (!N4.some(([dx, dy]) => plaqueOrNail(x + dx, y + dy))) clear.push([x, y]);
  }
  for (const [x, y] of clear) g.clear(x, y);
  return g;
}
