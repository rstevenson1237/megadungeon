// npc-hermit finish.v1 on base.v3 — the review's s/e head, in pixels: from the front the hood is the robe's brown
// (hair steps recoloured to leather mid/dark, as the back view's hood), framing the face with a 2 px hood edge round
// the cranium, and the face in the opening is skin-ramp (lit forehead, cheeks, nose) with two single eye pixels
// instead of the black band. Back views are untouched.
// finish.v1 (f) on base.v3 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'template character finish: clean-up, then a per-state face at the face anchors' };

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

  if (ctx.facing === 's' || ctx.facing === 'e') hoodFace(g, ctx, px);
  return g;
}

// The hood and face from the front; the patch is drawn for `s` and mirrored for `e`.
const FACE_S = [
  '...........',
  '...........',
  '....HH.....',
  '.HmsssmD...',
  '.HmkskdD...',
  '.HmmsmdD...',
  '...m.......',
];
function hoodFace(g, ctx, px) {
  const [hx, hy] = ctx.anchors.head;
  const HOOD = { 'hair.0': 'leather.1', 'hair.1': 'leather.1', 'hair.2': 'leather.2' };
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const t = px.tokenAt(g, [x, y]);
    if (HOOD[t]) px.set(g, [x, y], HOOD[t]);
  }
  const rows = ctx.facing === 'e' ? FACE_S.map(r => [...r].reverse().join('')) : FACE_S;
  px.patch(g, [hx - 5, hy - 4], rows, { H: 'leather.1', D: 'leather.2', k: 'outline', s: 'skin.0', m: 'skin.1', d: 'skin.2' }, { anchor: 'topleft' });
}
