// finish.v1 (f) on base.v4 — review: the hat brim is a solid dark bar that swallows the eyes. This pass lifts the brim's
// underside 1px (the outline row right above the face's top skin row becomes skin) and sets a 1px skin-light brow over
// each dark eye pixel, in the facings that show the face (s, e). Template notes follow. Character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { pass: 'f1', notes: 'lift the brim underside 1px over the face, skin-light brow over two dark eyes, then the per-state face' };

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

  // brim lift: over the face, the lowest brim row (outline with more outline above it) takes the skin below it
  if (a.eye && a.eye2) {
    const xs = [a.eye[0], a.eye2[0]], ey = Math.min(a.eye[1], a.eye2[1]);
    const isSkin = t => t && t.startsWith('skin');
    let top = ey - 1;                                        // the face's top skin row, at the first eye's column
    while (top > 0 && isSkin(px.tokenAt(g, [a.eye[0], top - 1]))) top--;
    for (let x = Math.min(...xs) - 3; x <= Math.max(...xs) + 3; x++)
      if (isSkin(px.tokenAt(g, [x, top])) && px.tokenAt(g, [x, top - 1]) === 'outline' && px.tokenAt(g, [x, top - 2]) === 'outline')
        px.set(g, [x, top - 1], px.tokenAt(g, [x, top]));
    // brow: a skin-light pixel right over each eye
    for (const [x, y] of [a.eye, a.eye2]) px.set(g, [x, y - 1], 'skin.0');
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
