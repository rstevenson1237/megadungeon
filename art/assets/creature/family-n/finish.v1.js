// family-n finish.v1 (f) on base.v3 — the review's pixel fix for the coiled tail (all frames): the bead vertebrae are
// joined by a continuous cloth-dark spine line — every outline or empty pixel in the tail rows that sits between two
// bone pixels (across it horizontally, vertically or diagonally, up to 2 px each way) is filled with cloth dark and the
// new edge inked — so the coil reads as one tapering spine at 1x; the light beads stay on top as 1 px highlights. The
// skull's eye-points are drawn in the base and it has no face anchors, so the template face pass is a no-op.
// Template: character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'tail coil: bead vertebrae joined by a continuous cloth-dark spine line, light beads kept as highlights' };

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

const TAIL_ROWS = 14; // the coil's rows above the lowest pixel, at the large frame
const bone = (px, g, x, y) => (px.tokenAt(g, [x, y]) ?? '').startsWith('cloth.');
function joinTail(g, px) {
  let bottom = -1;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (px.tokenAt(g, [x, y])) bottom = y;
  if (bottom < 0) return;
  const fills = [];
  for (let y = bottom - TAIL_ROWS; y < bottom; y++) for (let x = 1; x < g.w - 1; x++) {
    if (bone(px, g, x, y)) continue;
    const across = [[1, 0], [0, 1], [1, 1], [1, -1]].some(([dx, dy]) =>
      [1, 2].some(d => bone(px, g, x + dx * d, y + dy * d)) && [1, 2].some(d => bone(px, g, x - dx * d, y - dy * d)));
    if (across) fills.push([x, y]);
  }
  for (const p of fills) px.set(g, p, 'cloth.2');
  for (const [x, y] of fills) for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]])
    if (!px.tokenAt(g, [x + dx, y + dy])) px.set(g, [x + dx, y + dy], 'outline');
}

export function finish(g, ctx) {
  const { px } = ctx.lib, a = ctx.anchors, mood = moodOf(ctx.state);
  px.fix.orphans(g);
  px.fix.jaggies(g);
  joinTail(g, px);
  // px.light.rim(g, { ramps: ['cloth'] });
  // px.fx.glint(g, ctx.at('hand', 0, -4), 'glow.0');

  // face last
  const skinNear = ([x, y]) => [[x + 1, y], [x - 1, y], [x, y + 1]].map(p => px.tokenAt(g, p)).find(t => t && t !== 'outline') ?? 'skin.1';
  for (const name of ['eye', 'eye2']) {
    if (!a[name]) continue;
    const [x, y] = a[name];
    let eh = 0;
    while (eh < (g.h >= 32 ? 3 : 2) && px.tokenAt(g, [x, y + eh]) === 'outline') eh++;
    px.patch(g, ctx.at(name), eyeRows(mood, Math.max(1, eh)), { k: 'outline', s: skinNear([x, y]) }, { anchor: 'topleft' });
  }
  const mouth = MOUTH[mood];
  if (mouth && a.mouth && px.tokenAt(g, a.mouth) && px.tokenAt(g, a.mouth) !== 'outline')
    px.patch(g, ctx.at('mouth'), mouth, { k: 'outline' }, { anchor: 'topleft' });
  return g;
}
