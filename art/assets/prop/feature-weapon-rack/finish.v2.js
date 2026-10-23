// finish.v2 (f2) on base.v5 — the one direct-pixel pass (R2), on what the x2 review of base.v5 named:
// - the frame was chunky: the top rail thins from 4 rows (2 lit, 2 front) to a lit row and a front row between
//   outlines, and both uprights thin from 4 px to 2 px (a lit and a shaded column between outlines);
// - the solid dark band under the rail (the old peg blobs and the rail's dark underside) is cleared down to the
//   plinth's back edge, so the floor shows between the rail and the plinth;
// - the empty pegs stand out: a bright 2 x 2 steel stud (metal light, mid, dark) hangs under the rail at each slot,
//   so the looted rack reads as an empty row of pegs, not a bench;
// - open shows two weapons with a clear gap: the axe (base.v5's own sprite and slot) is drawn back on the right
//   slot, so open = spear + axe with the middle peg empty, closed = spear, sword and axe, looted = pegs only.
// The frame edits come from the looted render (the bare frame). They skip every pixel a weapon present in the state
// draws (masks rebuilt from base.v5's own sprites and slots) and any pixel that no longer holds the bare frame's token,
// so the weapons in closed and open are never painted over.
export const base = 'base.v5';
export const meta = { notes: 'rail and uprights thinned to 2 px, band under the rail opened, steel peg studs, open shows spear + axe' };

// x,y,from,to over the bare frame: o outline · w0-w2 wood · m0-m2 metal · _ transparent
const EDITS = (
  '11,15,w0,w1 12,15,w0,w1 9,16,w1,w2 10,16,w1,o 11,16,w1,m0 12,16,w1,m1 13,16,w0,w1 14,16,w0,w1 8,17,o,w1 ' +
  '9,17,w0,w2 10,17,w0,o 11,17,w2,m1 12,17,w1,m2 13,17,w1,o 14,17,w1,o 15,17,w0,w1 16,17,w0,w1 10,18,w2,o ' +
  '13,18,w1,_ 14,18,w1,_ 15,18,w1,m0 16,18,w1,m1 17,18,w0,w1 18,18,w0,w1 8,19,o,w1 9,19,o,w2 11,19,w2,_ 12,19,o,_ ' +
  '13,19,o,_ 14,19,w0,o 15,19,w0,m1 16,19,w0,m2 17,19,w1,o 18,19,w1,o 19,19,w0,w1 20,19,w0,w1 9,20,w1,w2 10,20,w2,o ' +
  '11,20,w2,_ 12,20,o,_ 13,20,w0,_ 14,20,w0,_ 15,20,w2,o 16,20,w2,o 17,20,w1,_ 18,20,w1,_ 19,20,w1,m0 20,20,w1,m1 ' +
  '9,21,w1,w2 10,21,w2,o 11,21,w2,_ 12,21,o,_ 13,21,w1,_ 14,21,w2,_ 15,21,o,_ 16,21,o,_ 17,21,o,_ 19,21,w1,m1 ' +
  '20,21,w1,m2 21,21,w1,o 25,21,w2,o 26,21,o,_ 9,22,w1,w2 10,22,w2,o 11,22,w2,_ 12,22,o,_ 13,22,o,_ 14,22,o,_ ' +
  '18,22,o,_ 19,22,w0,o 20,22,w0,o 21,22,w2,o 23,22,w1,w2 24,22,w2,o 25,22,w2,_ 26,22,o,_ 9,23,w1,w2 10,23,w2,o ' +
  '11,23,w2,_ 12,23,o,_ 17,23,o,_ 18,23,w1,_ 19,23,w2,_ 20,23,w2,_ 23,23,w1,w2 24,23,w2,o 25,23,w2,_ 26,23,o,_ ' +
  '9,24,w1,w2 10,24,w2,o 11,24,w2,o 18,24,o,_ 19,24,o,_ 20,24,o,_ 23,24,w1,w2 24,24,w2,o 25,24,w2,_ 26,24,o,_ ' +
  '10,25,w2,o 23,25,w1,w2 24,25,w2,o 25,25,w2,_ 26,25,o,_ 23,26,w1,w2 24,26,w2,o 25,26,w2,_ 26,26,o,_ 19,27,_,_ ' +
  '20,27,_,_ 23,27,w1,w2 24,27,w2,o 25,27,w2,_ 26,27,o,_ 23,28,w1,w2 24,28,w2,o 25,28,w2,_ 26,28,o,_ 23,29,w1,w2 ' +
  '24,29,w2,o 25,29,w2,_ 26,29,o,_ 23,30,w1,w2 24,30,w2,o 25,30,w2,o 26,30,o,_ 25,31,w2,w0 ' +
  '').trim().split(/\s+/).map((e) => e.split(','));
const TOK = { o: 'outline', w0: 'wood.0', w1: 'wood.1', w2: 'wood.2', m0: 'metal.0', m1: 'metal.1', m2: 'metal.2' };
// base.v5's axe, top row first, at its slot (sprite at 19,13; haft at x 20, rows 20-31)
const AXE = ['.o...oo.', 'owo.oMHo', 'owooMMHo', 'owDDMMHo', 'owooMMHo', 'owo.oMHo', 'owo..oo.'];
const SPEAR = ['..o..', '.oHo.', 'oHMDo', 'oHMDo', 'oMMDo', '.oDo.', '.olo.', '.olo.'];
const HILT = ['..ooo..', '..oMo..', '..olo..', '..olo..', '..olo..', 'ooooooo', 'oHMMMDo', 'oooHDoo'];
const BLADE = '..oHDo.', TIP = ['..oDDo.', '...oo..'];

// the pixels each weapon covers, at base.v5's slots: spear (haft x 10, head at 8,8), sword (hilt at 12,12, blade to
// row 27, tip rows 28-29), axe (head at 19,13, haft x 20)
function weaponMask(st) {
  const m = new Set(), add = (x, y) => m.add(x + ',' + y);
  const rows = (r, x0, y0) => r.forEach((row, i) => { for (let j = 0; j < row.length; j++) if (row[j] !== '.') add(x0 + j, y0 + i); });
  const shaft = (x, y0, y1) => { for (let y = y0; y <= y1; y++) { add(x - 1, y); add(x, y); add(x + 1, y); } };
  if (st !== 'looted') { rows(SPEAR, 8, 8); shaft(10, 16, 26); rows(AXE, 19, 13); shaft(20, 20, 31); }
  if (st === 'closed') { rows(HILT, 12, 12); for (let y = 20; y < 28; y++) rows([BLADE], 12, y); rows(TIP, 12, 28); }
  return m;
}

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const mask = weaponMask(ctx.state);
  for (const [xs, ys, from, to] of EDITS) {
    const x = +xs, y = +ys, now = px.tokenAt(g, [x, y]);
    if (mask.has(x + ',' + y)) continue;                               // a weapon is drawn here
    if (now !== (from === '_' ? null : TOK[from])) continue;          // not the bare frame: leave it
    if (from === '_' && g.alpha(x, y) > 0) continue;                   // the contact shadow: leave it
    if (to === '_') g.clear(x, y); else px.set(g, [x, y], TOK[to]);
  }
  if (ctx.state === 'open') {
    const key = { o: 'outline', H: 'metal.0', M: 'metal.1', D: 'metal.2', w: 'wood.1' };
    for (let y = 20; y <= 31; y++) { px.set(g, [19, y], 'outline'); px.set(g, [20, y], 'wood.1'); px.set(g, [21, y], 'outline'); }
    AXE.forEach((row, i) => { for (let j = 0; j < row.length; j++) if (key[row[j]]) px.set(g, [19 + j, 13 + i], key[row[j]]); });
  }
  return g;
}
