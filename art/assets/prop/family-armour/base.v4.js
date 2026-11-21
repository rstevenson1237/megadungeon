// family-armour base.v4 (x2) — from base.v1 (best, 6), not v3 (front-on T shirt, 5.5). Kept: the shirt lies folded
// flat on the floor diamond with a lit top face and a short shadowed front edge, metal ramp only (no accent red, no
// brown). Changed, as the roster and redo notes asked: drawn as 1x rows so every pixel is placed; smaller (about
// 13 x 9 with the outline, v1 was 17 x 11); the top face is a 1 px light/mid ring-mail checker; one diagonal fold line
// in the shadow step; the sleeve's edge folded across the top (a lit run with its shadow under it, its cuff poking
// out past the left side to break the lozenge); the neck opening in the metal shadow step. R11: role ramps only.
export const meta = { brief: 'family-armour', pass: 'x2', notes: 'folded mail shirt on the diamond: ring checker, fold line, sleeve edge, dark neck', mirror: false };
// 1x rows: c = ring-mail checker (light/mid by x+y), L/m/d = metal ramp steps 0/1/2, '.' empty.
const ROWS = [
  ['body', '.....ccc...'], // the shoulder line is the long back edge
  ['body', '...ddcLLLc.'], // neck opening (shadow step) on the shoulder line; the folded sleeve's lit edge starts
  ['body', '.cccdcddLLL'], //   and runs across the top to its cuff at the right corner, its shadow under it
  ['body', 'ccccccccddc'],
  ['body', 'mmccccddccd'], // the diagonal fold line runs down-left across the front half
  ['side', '..mmddcccd.'], // short front edge: left face mid, right face shadow
  ['side', '....mmdd...'],
];
export function render(ctx) {
  const [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h), band = { L: 0, m: 1, d: 2 };
  const x0 = Math.round(w / 2 - ROWS[0][1].length / 2), y0 = h - 8 - 3; // centred on the floor diamond centre (16, h-8)
  ROWS.forEach(([name, row], y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === '.') continue;
      const b = c === 'c' ? ((x + y) % 2 ? 1 : 0) : band[c];
      s.add({ type: 'rect', name, x: x0 + x, y: y0 + y, w: 1, h: 1, mat: 'metal', shade: 'flat', band: b });
    }
  });
  return ctx.lib.proc(s).render();
}
