// family-q finish.v2 on base.v4 — re-finishes the best base (R12) with the pixel part of base.v4's review (s/e a
// jumble of blocks with no clear muzzle; no continuous topline or brush tail). Side views only (s, e = s mirrored),
// placed from the eye pixel and the rump's top corner so it follows bob and lunge: the muzzle is repainted as one
// tapered wedge (lit grass-light bridge, mid flank, a shaded lower jaw, a black nose tip and mouth line) instead of
// the base's broken outline bits (not in attack frames, which keep the red open maw); the internal ink bits along
// the rump top become shade so the back reads as one line; a bushy brush tail grows off the rump and droops down,
// continuing the topline. The template's orphan clean-up no longer eats the 1 px eye (protected). Back views as base.
// finish.v2 (f) on base.v4 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { notes: 'wolf: tapered muzzle wedge with nose tip, smoothed rump topline, drooping brush tail (s/e); eye protected' };

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

export function finish(g, ctx) {
  const { px } = ctx.lib, a = ctx.anchors, mood = moodOf(ctx.state);
  const side = ctx.facing === 's' || ctx.facing === 'e', flip = ctx.facing === 'e';
  const eye = side ? findEye(g, px) : null;
  if (eye) ctx.protect(eye);
  px.fix.orphans(g);
  px.fix.jaggies(g);
  // px.light.rim(g, { ramps: ['cloth'] });
  // px.fx.glint(g, ctx.at('hand', 0, -4), 'glow.0');

  if (side) { topline(g, px, flip); if (eye && !/attack/.test(ctx.state)) muzzle(g, px, eye, flip); }
  return g;
}

const KEY = { o: 'outline', a: 'grass.0', b: 'grass.1', c: 'grass.2' };
/** Paint char rows: `.` keep, `_` clear, else KEY. (ox, oy) is the map cell at `at`; s = -1 mirrors it. */
function paint(g, px, at, [ox, oy], rows, s) {
  rows.forEach((r, j) => [...r].forEach((ch, i) => {
    if (ch === '.') return;
    const x = at[0] + s * (i - ox), y = at[1] + (j - oy);
    if (x < 0 || y < 0 || x >= g.w || y >= g.h) return;
    if (ch === '_') g.clear(x, y); else px.set(g, [x, y], KEY[ch]);
  }));
}

/** The wolf's 1 px eye (accent) in the head half of the frame. */
function findEye(g, px) {
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if ((px.tokenAt(g, [x, y]) ?? '').startsWith('accent')) return [x, y];
  return null;
}

/** The snout as one tapered wedge; the map's eye cell (7, 3) sits on the eye pixel. */
const MUZZLE = [
  '...oaabb',
  '..oaabbb',
  '.oaabbbc',
  'oabbbbc.',
  'ooooocco',
  '_occcoo.',
  '__ooo...',
  '.__.....',
];
function muzzle(g, px, eye, flip) { paint(g, px, eye, [7, 3], MUZZLE, flip ? -1 : 1); }

/** The rump: its inner ink bits become shade; a brush tail grows off its top corner and droops. */
const TAIL = [
  'oo..',
  'aao.',
  'baao',
  '.bao',
  '.bbo',
  '.bbo',
  '.oco',
  '.oco',
  '..o.',
];
function topline(g, px, flip) {
  const W = g.w, s = flip ? -1 : 1, X = x => flip ? W - 1 - x : x; // work in s-view coordinates
  const op = (x, y) => px.tokenAt(g, [X(x), y]);
  let ty = -1;
  for (let y = 0; y < g.h && ty < 0; y++) for (let x = W >> 1; x < W; x++) if (op(x, y)) { ty = y; break; }
  if (ty < 0) return;
  let rx = -1; for (let x = W - 1; x >= W >> 1; x--) if (op(x, ty + 1)) { rx = x; break; }
  if (rx < 0 || rx > W - 5) return;
  const fill = t => t && t !== 'outline';
  for (let y = ty + 1; y <= ty + 4; y++) for (let x = rx - 5; x < rx; x++) {
    if (op(x, y) !== 'outline') continue;
    if ((fill(op(x - 1, y)) && fill(op(x + 1, y))) || (fill(op(x, y - 1)) && fill(op(x, y + 1)))) px.set(g, [X(x), y], 'grass.2');
  }
  paint(g, px, [X(rx), ty + 1], [0, 1], TAIL, s);
}
