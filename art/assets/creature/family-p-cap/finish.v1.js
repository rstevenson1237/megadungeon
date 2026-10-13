// family-p-cap finish.v1 on base.v3 — the review's head point, in pixels: the lit vertical stripe up the cranium
// (between the horns) is shaded to the body mid so the head stops reading as a mask with a nose slit; the brow's
// underside becomes a dark shadow band; each eye is a dark socket with one accent-light (the creature kinds have no
// glow ramp) pixel glowing on its inner side. The jaw already sits on the dark step under the cheeks, so it is kept.
// The review's goat-hock kink is a change of leg shape (a base revision), so this finish leaves it.
// finish.v1 (f) on base.v3 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'pit fiend face: cranium stripe shaded, brow shadow band, glowing eye pixels in dark sockets' };

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
  px.fix.orphans(g);
  px.fix.jaggies(g);
  // px.light.rim(g, { ramps: ['cloth'] });
  // px.fx.glint(g, ctx.at('hand', 0, -4), 'glow.0');

  // face last
  const skinNear = ([x, y]) => [[x + 1, y], [x - 1, y], [x, y + 1]].map(p => px.tokenAt(g, p)).find(t => t && t !== 'outline') ?? 'skin.1';
  if (a.eye && a.eye2) face(g, ctx, px);
  const mouth = MOUTH[mood];
  if (mouth && a.mouth && px.tokenAt(g, a.mouth) && px.tokenAt(g, a.mouth) !== 'outline')
    px.patch(g, ctx.at('mouth'), mouth, { k: 'outline' }, { anchor: 'topleft' });
  return g;
}

/** The skull's face, from the eye anchors: no cranium stripe, a dark brow band, a glowing pixel in each socket. */
function face(g, ctx, px) {
  const [x1, ey] = ctx.anchors.eye, [x2] = ctx.anchors.eye2, lo = Math.min(x1, x2), hi = Math.max(x1, x2);
  const body = (x, y) => (px.tokenAt(g, [x, y]) ?? '').startsWith('accent');
  for (let y = ey - 8; y <= ey - 5; y++) for (let x = lo + 1; x < hi; x++) if (px.tokenAt(g, [x, y]) === 'accent.0') px.set(g, [x, y], 'accent.1');
  for (let x = lo - 1; x <= hi + 1; x++) if (body(x, ey - 1)) px.set(g, [x, ey - 1], 'accent.2');
  for (let x = lo; x <= hi; x++) if (body(x, ey)) px.set(g, [x, ey], 'accent.2');
  for (const x of [lo, hi]) px.set(g, [x, ey], 'outline');
  for (const x of [lo + 1, hi - 1]) { px.set(g, [x, ey], 'accent.0'); ctx.protect?.([x, ey]); }
}
