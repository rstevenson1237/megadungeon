// family-t-cap finish.v2 (f) on base.v4 — re-finish of the best base (R12). Review of base.v4 (6): the head reads as a
// square block with a bright horizontal brow band like a headband. The form (egg head, legs) is a base change; this
// pass does the pixel part, the brow: the flat light-step band across the forehead drops to the mid step, and over each
// eye a curved brow ridge is painted instead — a 4 px arch of the light step (ends a row lower than its middle) with the
// dark step under it, doming up into the socket, so each eye sits in shadow under its own curved ridge. The forehead's
// outer pixels in the two rows above the brow take the dark step, rounding the block toward an egg. The eyes are found
// from the drawn accent pixels (back views n/w show only the mane and are left as drawn) and protected from the
// clean-up; the template face patch is not used (the base draws the eyes). Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { pass: 'f', notes: 'flat brow band dropped to mid; curved lit brow arch with shadow over each eye; forehead corners shaded round' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const back = ctx.facing === 'n' || ctx.facing === 'w';
  const eyes = [];
  if (!back) for (let y = 16; y < 60; y++) for (let x = 0; x < g.w; x++) if (px.tokenAt(g, [x, y]) === 'accent.0') eyes.push([x, y]);
  for (const e of eyes) ctx.protect(e);
  px.fix.orphans(g);
  px.fix.jaggies(g);
  if (back || eyes.length < 2) return g;
  const ey = Math.min(...eyes.map(e => e[1]));
  const row = eyes.filter(e => e[1] === ey).map(e => e[0]).sort((a, b) => a - b);
  // group the eye pixels into eyes (runs), left to right
  const runs = [];
  for (const x of row) { const r = runs[runs.length - 1]; if (r && x === r[1] + 1) r[1] = x; else runs.push([x, x]); }
  if (runs.length < 2) return g;
  const [L, R] = [runs[0], runs[runs.length - 1]];
  const grass = (x, y) => (px.tokenAt(g, [x, y]) ?? '').startsWith('grass.');
  const set = (x, y, t) => { if (grass(x, y)) px.set(g, [x, y], t); };
  const fx0 = L[0] - 3, fx1 = R[1] + 3;

  // the flat band: every light-step pixel in the brow rows goes to the mid step
  for (let y = ey - 6; y <= ey - 2; y++) for (let x = fx0; x <= fx1; x++) if (px.tokenAt(g, [x, y]) === 'grass.0') px.set(g, [x, y], 'grass.1');
  // the forehead rounds: the outermost face pixel each side in the two rows above the brow takes the dark step
  for (const y of [ey - 5, ey - 4]) {
    const xs = []; for (let x = fx0; x <= fx1; x++) if (grass(x, y)) xs.push(x);
    if (xs.length > 4) { set(xs[0], y, 'grass.2'); set(xs[xs.length - 1], y, 'grass.2'); }
  }
  // a curved ridge over each eye: lit arch, shadow under it doming into the socket
  for (const [a, b] of [L, R]) {
    for (let x = a - 1; x <= b + 1; x++) set(x, ey - 1, 'grass.2');
    for (let x = a; x <= b; x++) { set(x, ey - 2, 'grass.2'); set(x, ey - 3, 'grass.0'); }
    set(a - 1, ey - 2, 'grass.0'); set(b + 1, ey - 2, a === R[0] ? 'grass.1' : 'grass.0');
  }
  for (const [x, y] of eyes) if (y === ey) px.set(g, [x, y], 'accent.0');
  return g;
}
