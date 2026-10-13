// family-f finish.v1 (f) on base.v3 — the one direct-pixel pass (R2). Review of base.v3: a pale/orange stick down
// the stem centre reads as a pole or a single leg and the root legs are invisible. This pass repaints the foot of the
// stalk (the 8 rows above and at the ground point): the stem is closed in its own two tones with no centre stripe,
// flares into a dark root crown, and splits into three dark root legs (skin.2, lit edge skin.1, inked) that splay
// 2-3 px out past the stalk at the foot: left, centre and right. Pixels of the old stick and roots outside the new
// roots go back to the ground shadow (or clear). Mirrored on the flipped facings (e, n). Colours are tokens (R11).
export const base = 'base.v3';
export const meta = { pass: 'f', notes: 'centre stem stripe removed; three dark root legs splayed at the foot' };

// x from ground.x-7 to ground.x+8, rows from ground.y-5 to ground.y+2 (s facing); '.' leave, '_' back to shadow/clear
const FOOT = [
  '...oSSsssdddo...',
  '...oSsssddddo...',
  '.ossSsssddddddo.',
  '.osddoosdoosddo.',
  'osdo__osdo_oddo.',
  'odo____odo___odo',
  '_o______o_____o_',
  '________________',
];
// 'o' ink, 'S' / 's' the stem's lit and mid tones (and a root's lit edge), 'd' the dark root body (skin.2)
const KEY = { o: 'outline', S: 'skin.0', s: 'skin.1', d: 'skin.2' };

export function finish(g, ctx) {
  const { px } = ctx.lib, flip = ctx.facing === 'e' || ctx.facing === 'n';
  const [gx, gy] = ctx.anchors.ground, x0 = gx - 7, y0 = gy - 5;
  // a ground-shadow pixel to copy (translucent), if the frame has one
  let shadow = null;
  for (let i = 3; i < g.d.length && !shadow; i += 4) if (g.d[i] > 0 && g.d[i] < 255) shadow = g.d.slice(i - 3, i + 1);
  // an erased pixel on the ground (from a row above the ground point down) takes the shadow, higher up it clears
  const erase = (x, y) => {
    if (!g.alpha(x, y)) return;
    if (shadow && y >= gy - 1) g.d.set(shadow, (y * g.w + x) * 4); else g.clear(x, y);
  };
  FOOT.forEach((row, j) => [...row].forEach((ch, i) => {
    const x = flip ? g.w - 1 - (x0 + i) : x0 + i, y = y0 + j; // ground.x is the unflipped centre
    if (ch === '.') return;
    if (ch === '_') return erase(x, y);
    px.set(g, [x, y], KEY[ch]);
  }));
  return g;
}
