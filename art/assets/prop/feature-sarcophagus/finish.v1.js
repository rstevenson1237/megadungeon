// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), acting on base.v3's review note:
// (1) open state: the base drew the whole open picture 4 px left of closed (base.v3 line 22), so the tub jumped when
//     it opened. Here the open frame is moved back 4 px, so its tub sits on exactly the closed tub's pixels, and the
//     lid is repainted pushed back diagonally off the far corner (6 px up the screen, wholly inside the frame), over
//     a dark hollow (stone.2) inside a 1-2 px pale rim: only the lid moves.
// (2) lid-top banding: the effigy hugged the lid's back edge as a pale stripe; it is repainted one step in from the
//     edge, centred on the lid, with a neck notch under the head and a narrower foot.
// (3) stray dark pixels under the lid's near edge: the carved side panels butted against the lid's underside; each
//     panel moves 1 px down, leaving a stone.1 line between lid and carving (same on both states).
// The OPEN and CLOSED rows were painted from a corrected 3D layout of the same model (lid at -3, -3; effigy at y 2).
// Colours are direction tokens only (R11).
export const base = 'base.v3';
export const meta = { notes: 'open: tub held still, lid pushed back off the far corner over a dark hollow; effigy off the lid edge; panels clear of the lid' };

const KEY = { o: 'outline', a: 'stone.0', b: 'stone.1', c: 'stone.2', d: 'dirt.0', e: 'dirt.1', f: 'dirt.2' };

// closed: the effigy repainted in from the lid's back edge (top-left at [8, 11]); '.' keeps the base pixel
const CLOSED = [
  '..dddd........',
  'aa..dd........',
  'aaaadddddd....',
  'bbccaa..dddd..',
  '..bbaaaa..dddd',
  '....bbaaccdddd',
  '......bb..dddd',
];

// open, after the 4 px move back: the pushed lid, the hollow and its rim (top-left at [1, 3]); '_' clears
const OPEN = [
  '.......oooo....................',
  '.....ooddddoo..................',
  '...ooddddddddoo................',
  '.ooddddaaaadddd................',
  'oddddddaaaadd..................',
  'oddddddbbccaaaadddd............',
  'oeeddddddbbaaaa..dd............',
  'oeeeedd....bbaaccdddddd........',
  '.ooeeee......bb....dddddd......',
  '...ooee............dddddddd._..',
  '.....o...............ddddddo___',
  '........ccc............ddffo___',
  '......ccc..............ffffo___',
  '.......cccc..........ffffoo____',
  '.........cccc......ffffoo______',
  '...........cccc....cccaoo______',
  '.............cccc....cccao_____',
  '...............ccccccccaao_____',
  '.................cccc..cco___..',
  '.........................._....',
];

// Carved panels on the tub's near face: a stone.2 run with stone.1 under it and lid (dirt.1) or face (stone.1)
// over it moves 1 px down, so no carving touches the lid's underside.
function dropPanels(g, px) {
  const t = (x, y) => px.tokenAt(g, [x, y]);
  for (let x = 0; x < g.w; x++) {
    for (let y = 19; y < g.h; y++) {
      if (t(x, y) !== 'stone.2' || t(x, y - 1) === 'stone.2') continue;
      let end = y;
      while (t(x, end + 1) === 'stone.2') end++;
      const above = t(x, y - 1), below = t(x, end + 1);
      if (below === 'stone.1' && (above === 'dirt.1' || above === 'stone.1')) {
        px.set(g, [x, y], 'stone.1');
        px.set(g, [x, end + 1], 'stone.2');
      }
      y = end + 1;
    }
  }
}

export function finish(g, ctx) {
  const { px } = ctx.lib;
  if (ctx.state === 'open') {
    const src = g.clone();
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) g.clear(x, y);
    g.blit(src, 4, 0);                                     // undo the base's 4 px shift: tub back on its cell
    px.patch(g, [1, 3], OPEN, KEY, { anchor: 'topleft' });
  } else {
    px.patch(g, [8, 11], CLOSED, KEY, { anchor: 'topleft' });
  }
  dropPanels(g, px);
  return g;
}
