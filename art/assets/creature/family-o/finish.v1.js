// family-o finish.v1 (f) on base.v3 — the one direct-pixel pass (R2). Review of base.v3: the head reads as a boxy
// helmet; the tusks are lost at 1x (they sit inside the face) and the back view's pale horizontal band reads as a
// headband. This pass (1) on s/e paints two 1x2 pale tusks just outside the jaw outline at its corners, each inked on
// its outer side and top, and folds the old tusk pixels inside the face back into the mouth line and skin; (2) on n/w
// steps the pale skin.0 band across the back of the skull down to skin.1. Positions follow the face anchors (mouth,
// head), so they ride the bob and the attack lean. No other clean-up. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { pass: 'f', notes: 'tusks outside the jaw corners on s/e; pale band off the back of the skull on n/w' };

export function finish(g, ctx) {
  const { px } = ctx.lib, a = ctx.anchors, flip = ctx.facing === 'e' || ctx.facing === 'n';
  const fx = x => (flip ? g.w - 1 - x : x);
  if (a.mouth) {
    const mx = fx(a.mouth[0]), my = a.mouth[1]; // the mouth in the unflipped (s) frame; the jaw's corners are at mx-5 .. mx+4
    // the old tusks inside the face: cloth.0 pixels just above the mouth line become the mouth ink / skin beside them
    for (let dy = -3; dy <= -1; dy++) for (let dx = -3; dx <= 5; dx++) {
      const p = [fx(mx + dx), my + dy];
      if (px.tokenAt(g, p) !== 'cloth.0') continue;
      const below = px.tokenAt(g, [p[0], p[1] + 1]), side = px.tokenAt(g, [p[0] + 1, p[1]]);
      px.set(g, p, below === 'outline' || below === 'cloth.0' ? (side && side !== 'outline' && side !== 'cloth.0' ? side : 'skin.1') : 'outline');
    }
    // the new tusks: 1x2 pale, outside the jaw outline at its two corners, pointing up
    for (const [tx, out] of [[mx - 5, -1], [mx + 5, 1]]) {
      px.set(g, [fx(tx), my - 4], 'outline');
      for (const y of [my - 3, my - 2]) { px.set(g, [fx(tx), y], 'hair.0'); px.set(g, [fx(tx + out), y], 'outline'); }
    }
  } else if (a.head) {
    // from behind: no pale band across the skull
    const [hx, hy] = a.head;
    for (let y = hy - 3; y <= hy + 2; y++) for (let x = hx - 5; x <= hx + 5; x++) if (px.tokenAt(g, [x, y]) === 'skin.0') px.set(g, [x, y], 'skin.1');
  }
  return g;
}
