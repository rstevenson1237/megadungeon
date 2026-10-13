// family-l finish.v1 (f) on base.v2 — the pixel part of the latest review (base.v3's): in the back views (n/w) the
// crest's red accent dots along the spine read as noise, so they are repainted in the grass ramp (the dark step on
// the crest's tips, the mid step at its base), leaving a quiet scaly ridge; the tongue (near the `hand` anchor) keeps
// its red. The body's proportions the review asks for (2.5:1, wedge head, long tail) are a base form: left as it is.
// finish.v1 (f) on base.v2 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v2';
export const meta = { notes: 'back-view crest repainted from red accent dots to a grass-ramp ridge; template clean-up' };

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

  // back views: the crest's red dots become a grass-ramp ridge (the tongue, by the hand anchor, stays red)
  if (ctx.facing === 'n' || ctx.facing === 'w') {
    const t0 = a.hand;
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const t = px.tokenAt(g, [x, y]);
      if (!t || !t.startsWith('accent.')) continue;
      if (t0 && Math.abs(x - t0[0]) <= 4 && Math.abs(y - t0[1]) <= 3) continue;
      if (t === 'accent.2') continue; // the dewlap's dark step
      const above = px.tokenAt(g, [x, y - 1]);
      px.set(g, [x, y], !above || above === 'outline' ? 'grass.2' : 'grass.1');
    }
  }

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
