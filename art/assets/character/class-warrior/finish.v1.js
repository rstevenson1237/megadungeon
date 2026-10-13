// class-warrior finish.v1 (f) on base.v4 — the one direct-pixel pass (R2, R12), from base.v4's review: in the back
// views the head under the helm was a near-black block (hair's darkest step, read as a hole), and in the front views
// the light nasal over the brow band made a bright '+' over the face. Ops: clean-up; in n/w the hair under the helm is
// lifted to the hair ramp's mid step with its lowest row kept dark, over a 2-px skin neck; in s/e the nasal is cut to
// 1 px of metal mid just under the brow (the brow row closes in outline, the rest takes the skin or helm beside it).
// The base already draws its own 1-px eyes beside the nasal, so the template's anchor face is not painted (it would
// double them). Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { notes: 'warrior finish: hair and neck in the back views, a 1-px mid nasal in front' };

const is = (t, ramp) => typeof t === 'string' && t.startsWith(ramp + '.');

export function finish(g, ctx) {
  const { px } = ctx.lib, a = ctx.anchors;
  px.fix.orphans(g);
  // no jaggies pass: it ate the shield rim ring
  if (!a.head) return g;
  const [hx, hy] = a.head, back = ctx.facing === 'n' || ctx.facing === 'w';

  if (back) {
    // the hair mass below the helm: every hair pixel in the head box to the mid step, its lowest row to the dark step
    const pts = [];
    for (let y = hy - 1; y <= hy + 6; y++) for (let x = hx - 5; x <= hx + 5; x++) if (is(px.tokenAt(g, [x, y]), 'hair')) pts.push([x, y]);
    if (!pts.length) return g;
    const low = Math.max(...pts.map(p => p[1]));
    for (const p of pts) px.set(g, p, p[1] === low ? 'hair.2' : 'hair.1');
    // a 2-px neck under the middle of the lowest hair row
    const row = pts.filter(p => p[1] === low).map(p => p[0]), mid = (Math.min(...row) + Math.max(...row)) / 2;
    for (const x of [Math.floor(mid), Math.floor(mid) + 1]) px.set(g, [x, low + 1], 'skin.1');
    return g;
  }

  // front: find the nasal (the column of metal highlight crossing the face) and cut it to one mid pixel
  let best = null;
  for (let x = hx - 2; x <= hx + 2; x++) {
    const ys = [];
    for (let y = hy - 2; y <= hy + 4; y++) if (px.tokenAt(g, [x, y]) === 'metal.0') ys.push(y);
    if (ys.length >= 2 && (!best || ys.length > best.ys.length)) best = { x, ys };
  }
  if (!best) return g;
  const { x } = best, side = y => [px.tokenAt(g, [x - 1, y]), px.tokenAt(g, [x + 1, y])];
  const brow = best.ys.find(y => side(y).every(t => t === 'outline'));
  for (const y of best.ys) {
    const [l, r] = side(y);
    if (brow !== undefined && y === brow) px.set(g, [x, y], 'outline');
    else if (brow !== undefined && y === brow + 1) px.set(g, [x, y], 'metal.1');
    else px.set(g, [x, y], [l, r].find(t => is(t, 'skin')) ?? [l, r].find(t => is(t, 'metal') && t !== 'metal.0') ?? 'metal.2');
  }
  return g;
}
