// family-armour base.v3 (x1) — from base.v1 (best, 6). Roster/redo: flat lozenge twin, too big (17 x 11, over the
// weapon's width), grey slab reads as a stone or pillow, brown neck. Changed: the folded shirt is laid out as rows of
// T2+ rects (one per run) so each 1x pixel row is controlled: smaller (about weapon width), ring-mail texture
// (alternating light/mid 1 px rows across the top faces), the back half folded over with a dark fold line under it, a
// sleeve hanging out at the front-left with a dark cuff edge (breaks the lozenge), and the neck opening in the metal
// shadow step instead of leather. Metal ramp only, no accent red, so it reads apart from the other floor items. R11.
export const meta = { brief: 'family-armour', pass: 'x1', notes: 'folded mail shirt: ring rows, fold line, sleeve cuff, dark neck', mirror: false };
// rows of the shirt at 1x: L/m/d = metal ramp steps 0/1/2 (light, mid, shadow), '.' empty. Part per row group.
const ROWS = [
  ['body', '...LLddLm...'],  // shoulders with the neck opening (shadow step)
  ['body', '.LLmmmmmmmm.'],  // ring rows from here down
  ['body', 'LLLLLLLLLLmd'],  // sleeves out at both sides
  ['body', 'dmmmmmmmmmmd'],  // cuff edges at the sleeve ends
  ['body', 'd.LLLLLLLm.d'],
  ['lip',  '..dddddddd..'],  // the fold line: the hem half folded under
  ['body', '..LLLLLLmd..'],
  ['body', '..mmmmmmdd..'],
  ['side', '...ddddddd..'],  // the folded edge's front face on the floor
];
export function render(ctx) {
  const [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h), band = { L: 0, m: 1, d: 2 };
  const x0 = Math.round(w / 2 - ROWS[0][1].length / 2), y0 = h - 8 - 5; // centred on the floor diamond centre (16, h-8)
  ROWS.forEach(([name, row], y) => {
    for (let x = 0; x < row.length;) {
      const c = row[x]; let n = 1;
      while (row[x + n] === c) n++;
      if (c !== '.') s.add({ type: 'rect', name, x: x0 + x, y: y0 + y, w: n, h: 1, mat: 'metal', shade: 'flat', band: band[c] });
      x += n;
    }
  });
  return ctx.lib.proc(s).render();
}
