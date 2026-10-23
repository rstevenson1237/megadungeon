// finish.v1 (f) on base.v1 — the one direct-pixel pass (R2), stored as ops. What the reviews asked, within finishing:
// flatten the read of the spike cluster: the tall back spike is cut away and replaced by a short, low row of five steel
// teeth standing along a dark hinge seam drawn across the plate, so the plate and its seam show; v1's centred red
// "eye" is filled back in with plate steel and the warning mark becomes a 3 x 2 rust cluster on the front leaf
// (dark accent.2 with one accent.1 lit pixel: rust, not a magic light). Side spike tips kept. Tokens only (R11).
export const base = 'base.v1';
export const meta = { notes: 'back spike cut to a low tooth row on a hinge seam; red eye replaced by a 3x2 rust cluster' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const set = (x, y, t) => px.set(g, [x, y], t);
  // 1. cut the tall back spike down to the slot's back point
  for (const x of [15, 16]) g.clear(x, 17);
  for (const x of [13, 14, 17, 18]) g.clear(x, 18);
  set(15, 18, 'outline'); set(16, 18, 'outline');
  set(15, 19, 'outline'); set(16, 19, 'outline');
  set(15, 20, 'stone.2'); set(16, 20, 'stone.2');
  // 2. fill v1's red eye back in with plate steel (lit back leaf, mid/dark front leaf)
  for (const [x, y, t] of [
    [15, 21, 'metal.0'], [16, 21, 'metal.0'],
    [13, 22, 'metal.1'], [14, 22, 'metal.1'], [15, 22, 'metal.1'], [16, 22, 'metal.1'],
    [13, 24, 'metal.1'], [14, 24, 'metal.1'], [15, 24, 'metal.1'], [16, 24, 'metal.1'], [17, 24, 'metal.1'], [18, 24, 'metal.1'],
    [15, 25, 'metal.1'], [16, 25, 'metal.2'],
  ]) set(x, y, t);
  // 3. the hinge seam across the plate, and a short low row of teeth standing on it (lit tip, dark gaps between)
  for (let x = 9; x <= 22; x++) set(x, 23, 'outline');
  for (let x = 11; x <= 20; x++) set(x, 22, x % 2 === 1 && x >= 11 && x <= 19 ? 'metal.0' : 'metal.2');
  // 4. the warning mark: a 3 x 2 rust cluster on the front leaf, off-centre right
  set(16, 25, 'accent.1'); set(17, 25, 'accent.2'); set(18, 25, 'accent.2');
  set(16, 26, 'accent.2'); set(17, 26, 'accent.2'); set(18, 26, 'accent.2');
  return g;
}
