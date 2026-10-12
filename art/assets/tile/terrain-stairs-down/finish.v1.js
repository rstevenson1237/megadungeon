// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), doing what review 7 asked, in its order:
// 1) the pit grades: outline only in the 3 deepest px against the far rim, the rest of the void stone.2, so it runs
//    on from the last riser instead of a flat near-black slot;
// 2) the far nosing's end beside the pit (rows 5-6, x13-14) dimmed stone.0 -> stone.1; the near nosings stay bright;
// 3) the left lip's solid dirt.0 band (rows 5-8, x2-8) broken into the floor's dirt.1/dirt.2 mottle with one dirt.0
//    speck, and the dark dirt.2 edge round the opening's lit (left) side softened to dirt.1 so the cut sits flush.
// Ramps: stone, dirt and outline only (terrain notes). No fix ops: they would eat the one intentional speck.
export const base = 'base.v3';
export const meta = { notes: 'graded pit, dimmed far nosing end, mottled left lip and soft lit-side edge' };

const DEEP = [[21, 4], [23, 5], [25, 6]];          // the void's pixels touching the far rim, top right

export function finish(g, ctx) {
  const { px } = ctx.lib;
  // 1) the pit: every outline pixel inside the cut becomes stone.2 except the deepest three
  const keep = new Set(DEEP.map(([x, y]) => `${x},${y}`));
  for (let y = 2; y <= 9; y++) for (let x = 15; x <= 28; x++) {
    if (px.tokenAt(g, [x, y]) === 'outline' && !keep.has(`${x},${y}`)) px.set(g, [x, y], 'stone.2');
  }
  // 2) the far nosing's end nearest the pit
  for (const at of [[13, 5], [13, 6], [14, 6]]) if (px.tokenAt(g, at) === 'stone.0') px.set(g, at, 'stone.1');
  // 3) the left lip: floor mottle, one light speck
  const lip = {
    5: { 6: 'dirt.1', 7: 'dirt.2', 8: 'dirt.1' },
    6: { 4: 'dirt.2', 5: 'dirt.1', 6: 'dirt.1', 7: 'dirt.1' },
    7: { 2: 'dirt.1', 3: 'dirt.0', 4: 'dirt.1', 5: 'dirt.2' },
    8: { 2: 'dirt.1', 3: 'dirt.2', 4: 'dirt.1' },
  };
  for (const [y, row] of Object.entries(lip)) for (const [x, t] of Object.entries(row)) px.set(g, [+x, +y], t);
  // the opening's left edge on the lit side: dirt.2 -> dirt.1
  for (const at of [[14, 3], [12, 4], [9, 5], [10, 5], [8, 6], [6, 7]]) if (px.tokenAt(g, at) === 'dirt.2') px.set(g, at, 'dirt.1');
  return g;
}
