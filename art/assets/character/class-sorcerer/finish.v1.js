// finish.v1 (f) on base.v3 — review fix (base.v4 note: "face is a dark brown/black mass"): on s/e the face is
// repainted on skin mid with skin light on the upper-left cheek and brow, 2 eye pixels in skin dark, and only a 2 px
// dark beard under the mouth (the dark jaw and cheek pixels go). The orb's shape is a form change, left to a base.
// The rest is the template: character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { pass: 'f1', notes: 'face lifted to skin mid, cheek light, skin-dark eyes, 2 px beard; template clean-up and mouth' };

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


/** The face, s view, columns from 2 left of the left eye, rows from 2 above the eyes (e mirrors it).
 *  0/1/2 skin steps, e eye (skin dark), b beard (hair dark), . leave. */
const FACE = [
  '1001112',
  '1011112',
  '.0e1e1.',
  '.01111.',
  '..1111.',
  '...bb..',
];
const FACE_KEY = { 0: 'skin.0', 1: 'skin.1', 2: 'skin.2', e: 'skin.2', b: 'hair.2' };
function paintFace(g, ctx, px) {
  const a = ctx.anchors;
  if (!a.eye || !a.eye2) return;
  const flip = ctx.facing === 'e' || ctx.facing === 'n';
  const ey = a.eye[1], left = Math.min(a.eye[0], a.eye2[0]), right = Math.max(a.eye[0], a.eye2[0]);
  FACE.forEach((row, j) => [...row].forEach((c, i) => {
    if (c === '.') return;
    const x = flip ? right + 2 - i : left - 2 + i, y = ey - 2 + j;
    if (px.tokenAt(g, [x, y])) px.set(g, [x, y], FACE_KEY[c]);
  }));
}

export function finish(g, ctx) {
  const { px } = ctx.lib, a = ctx.anchors, mood = moodOf(ctx.state);
  px.fix.orphans(g);
  px.fix.jaggies(g);
  // px.light.rim(g, { ramps: ['cloth'] });
  // px.fx.glint(g, ctx.at('hand', 0, -4), 'glow.0');

  // face last
  paintFace(g, ctx, px);
  const mouth = MOUTH[mood];
  if (mouth && a.mouth && px.tokenAt(g, a.mouth) && px.tokenAt(g, a.mouth) !== 'outline')
    px.patch(g, ctx.at('mouth'), mouth, { k: 'outline' }, { anchor: 'topleft' });
  return g;
}
