// family-h finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), for the review of base.v3: "no hands: the
// crossbow floats across the chest and the back view has an unexplained dark bar mid-back".
// - s/e: two 2x2 skin hands grip the crossbow stock (found per frame: the topmost long run of light leather), the
//   off hand at the fore-stock and the main hand at the butt, so the bow is held, not floating.
// - n/w: the dark belt bar across the back is painted out with the cloth mid step, and a diagonal leather strap runs
//   from the left shoulder down to the crossbow at the right hip.
// The base's own face (hood shadow, two eye glints) is kept, so the template's face paint is left out.
// Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'hands on the crossbow stock (s/e), back strap replaces the belt bar (n/w)' };

const LIGHT_LEATHER = new Set(['leather.0', 'leather.1']);
const CLOTH = t => t && t.startsWith('cloth.');

export function finish(g, ctx) {
  const { px } = ctx.lib, flip = ctx.facing === 'e' || ctx.facing === 'w', back = ctx.facing === 'n' || ctx.facing === 'w';
  const W = g.w, cx = 16;
  const X = x => (flip ? W - 1 - x : x);                // drawn in s/n coordinates, mirrored for e/w
  const at = (x, y) => px.tokenAt(g, [X(x), y]);
  const set = (x, y, t) => px.set(g, [X(x), y], t);
  if (!back) {
    // the stock: the topmost row with a run of >= 5 light-leather pixels between rows 14 and 30
    let y0 = -1;
    for (let y = 14; y <= 30 && y0 < 0; y++) {
      let run = 0;
      for (let x = 0; x < W; x++) { run = LIGHT_LEATHER.has(at(x, y)) ? run + 1 : 0; if (run >= 5) { y0 = y; break; } }
    }
    if (y0 < 0) return g;
    const aim = ctx.state === 'attack';
    for (const hx of [cx - 6, aim ? cx : cx + 3]) {
      set(hx, y0, 'skin.1'); set(hx + 1, y0, 'skin.1');
      set(hx, y0 + 1, 'skin.2'); set(hx + 1, y0 + 1, 'skin.2');
      // a knuckle line of ink above the grip where the hand meets the sleeve, if cloth is there
      for (const x of [hx, hx + 1]) if (CLOTH(at(x, y0 - 1))) set(x, y0 - 1, 'outline');
    }
  } else {
    // paint out the belt bar (a long run of dark leather inside the back)
    for (let y = 20; y <= 31; y++) {
      const xs = [];
      for (let x = 0; x < W; x++) if (at(x, y) === 'leather.2') xs.push(x);
      if (xs.length >= 5) for (const x of xs) if (x >= 10 && x <= 21) set(x, y, 'cloth.1');
    }
    // the crossbow strap: left shoulder to right hip, 2 px thick, only over cloth
    const [, hy] = ctx.anchors.head;
    for (let i = 0; i <= 10; i++) {
      const x = cx - 5 + i, y = hy + 7 + Math.round(i * 0.9);
      if (CLOTH(at(x, y))) set(x, y, 'leather.1');
      if (CLOTH(at(x, y + 1))) set(x, y + 1, 'leather.2');
    }
  }
  return g;
}
