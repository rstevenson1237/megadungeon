// family-g-cap finish.v2 (f) on base.v4 — re-finish of the best base (R12). The review's tunic point in pixels: the
// straight-sided tunic is nipped in at the rope belt (2 px per side over the six rows around the belt, 1 px over the
// three rows above and below, only where background lies outside the tunic's outline, the lit / shade edge tone moving
// in with it), so the broad chest curves in to a belted waist and flares back out to the skirt. Bent elbows and a
// bigger maul are form changes a finish cannot make; they are left. Then the template face, as in finish.v1.
// Character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { notes: 'hill giant: tunic nipped in at the belt (pixel taper); template face' };

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
  taper(g, ctx, px);

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

const isTunic = t => !!t && (t.startsWith('leather.') || t.startsWith('hair.'));

/** Nip the tunic in at the belt: the belt is the first row with a hair run of 14+ px through the body centre. */
function taper(g, ctx, px) {
  const at = p => px.tokenAt(g, p), cx = Math.round(ctx.anchors.ground?.[0] ?? g.w / 2) - 1;
  let by = -1;
  for (let y = 0; y < g.h && by < 0; y++) {
    if (!(at([cx, y]) ?? '').startsWith('hair.')) continue;
    let l = cx, r = cx;
    while ((at([l - 1, y]) ?? '').startsWith('hair.')) l--;
    while ((at([r + 1, y]) ?? '').startsWith('hair.')) r++;
    if (r - l + 1 >= 14) by = y;
  }
  if (by < 0) return;
  for (let y = by - 6; y <= by + 7; y++) {
    const d = Math.abs(y - (by + 0.5)), t = d <= 2.5 ? 2 : d <= 5.5 ? 1 : 0;
    if (!t) continue;
    for (const dir of [-1, 1]) {
      let x = cx;
      if (!isTunic(at([x, y]))) continue;
      while (isTunic(at([x + dir, y]))) x += dir;
      if (at([x + dir, y]) !== 'outline' || at([x + 2 * dir, y]) !== null) continue;
      const edge = at([x, y]), ramp = edge.split('.')[0];
      g.clear(x + dir, y);
      for (let i = 0; i < t - 1; i++) g.clear(x - i * dir, y);
      px.set(g, [x - (t - 1) * dir, y], 'outline');
      const inner = [x - t * dir, y];
      if ((at(inner) ?? '').startsWith(ramp + '.')) px.set(g, inner, edge);
    }
  }
}
