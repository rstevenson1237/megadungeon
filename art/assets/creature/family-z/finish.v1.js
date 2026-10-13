// family-z finish.v1 (f) on base.v3 — the review's pixel fix for the head. s/e: the lolled head's face is found by its
// two 1 px eye sockets (outline pixels walled in by flesh) and they are carved deep (the flesh round them stepped one
// lighter above, so they read as hollows), with a 2 px dark open-jaw line two rows below (two rows deep in the attack).
// The anchor face of the template is not used: the base's eye/mouth anchors sit on the un-lolled head. n/w: the olive
// back-hair lump is recoloured to a skin dark/mid scalp.
// Template: character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 's/e: carved eye sockets with lit brows and a 2 px dark open jaw on the lolled head; n/w: olive back-hair recoloured to a skin scalp' };

const MOODS = [[/hurt|hit|die|dead|stun|dizzy|fall|knock/, 'hurt'], [/attack|cast|punch|kick|slash|shoot|throw|special|charge/, 'fierce'], [/win|victory|cheer|taunt|happy/, 'happy']];
const moodOf = state => MOODS.find(([re]) => re.test(state))?.[1] ?? 'calm';

/** Eye column for a mood: `k` dark, `s` the skin beside it. Narrowed (fierce) or squeezed (hurt) when the eye is ≥ 2 px. */
const eyeRows = (mood, eh) => {
  const open = Array(eh).fill('k');
  if (eh < 2) return open;
  if (mood === 'fierce') return ['s', ...open.slice(1)]; // brow down: the top of the eye goes
  if (mood === 'hurt') return [...open.slice(1), 's'];   // squeezed shut toward the top
  return open;
};
/** Mouth for a mood (top-left at the `mouth` anchor); calm shows none at sprite sizes. */
const MOUTH = { calm: null, fierce: ['k'], hurt: ['k', 'k'], happy: ['kk'] };

const flesh = t => !!t && t.startsWith('skin.');
/** n/w: the back-hair lump becomes a skin scalp (mid on top, dark below). */
function scalp(g, px) {
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const t = px.tokenAt(g, [x, y]);
    if (t === 'hair.0') px.set(g, [x, y], 'skin.1');
    else if (t === 'hair.1' || t === 'hair.2') px.set(g, [x, y], 'skin.2');
  }
}
/** s/e: the two eye sockets (outline pixels walled in by flesh on all four sides, near the top), then the jaw. */
function carveFace(g, px, fierce) {
  let top = -1;
  for (let y = 0; y < g.h && top < 0; y++) for (let x = 0; x < g.w; x++) if (px.tokenAt(g, [x, y])) { top = y; break; }
  if (top < 0) return;
  const eyes = [];
  for (let y = top + 1; y < top + 9; y++) for (let x = 1; x < g.w - 1; x++) {
    if (px.tokenAt(g, [x, y]) !== 'outline') continue;
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => px.tokenAt(g, [x + dx, y + dy]));
    if (n.filter(t => t && t !== 'outline').length >= 3 && flesh(n[0]) + flesh(n[1]) >= 1) eyes.push([x, y]);
  }
  // the pair: same row, 2 px apart
  const pair = eyes.flatMap(a => eyes.filter(b => b[1] === a[1] && b[0] - a[0] === 2).map(b => [a, b]))[0];
  if (!pair) return;
  const [[x0, y0], [x1]] = pair;
  for (const x of [x0, x1]) { // a lit brow over each hollow
    const t = px.tokenAt(g, [x, y0 - 1]);
    if (flesh(t) && t !== 'skin.0') px.set(g, [x, y0 - 1], t === 'skin.2' ? 'skin.1' : 'skin.0');
  }
  const jy = y0 + 2;
  for (const [x, y] of [[x0, jy], [x0 + 1, jy], ...(fierce ? [[x0, jy + 1], [x0 + 1, jy + 1]] : [])])
    if (flesh(px.tokenAt(g, [x, y]))) px.set(g, [x, y], 'outline');
}

export function finish(g, ctx) {
  const { px } = ctx.lib;
  px.fix.orphans(g);
  px.fix.jaggies(g);
  if (ctx.facing === 'n' || ctx.facing === 'w') { scalp(g, px); return g; }
  carveFace(g, px, ctx.state === 'attack');
  return g;
}
