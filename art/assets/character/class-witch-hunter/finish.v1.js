// class-witch-hunter finish.v1 (f) on base.v4 — from base.v4's review (R2, R12): the face, coat and trousers sat in one
// brown value band so the head sank into the body, and the hat crown read as a round bowler dome. Ops added to the
// template: a 2-row falling-band collar in the cloth highlight under the chin (at the nape in the back views) in every
// frame, and the crown's rounded top squared off to a 1-px flat outline line. Then the template face.
// finish.v1 (f) on base.v4 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { notes: 'witch-hunter finish: falling-band collar, flat-topped crown, per-state face' };

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

  const [hx, hy] = a.head;
  // the hat: square the crown's rounded top (the row under the top cap is as wide as the crown, the cap a flat line)
  let top = 0;
  while (top < hy && !px.tokenAt(g, [hx, top])) top++;
  let l = hx, r = hx;
  while (l > hx - 6 && px.tokenAt(g, [l - 1, top + 2]) !== 'outline') l--;
  while (r < hx + 6 && px.tokenAt(g, [r + 1, top + 2]) !== 'outline') r++;
  if (px.tokenAt(g, [l - 1, top + 2]) === 'outline' && px.tokenAt(g, [r + 1, top + 2]) === 'outline') {
    px.set(g, [l - 1, top + 1], 'outline'); px.set(g, [r + 1, top + 1], 'outline');
    for (let x = l; x <= r; x++) { px.set(g, [x, top + 1], px.tokenAt(g, [x, top + 2])); px.set(g, [x, top], 'outline'); }
  }

  // the falling-band collar: 2 rows of cloth highlight under the chin (front) or below the hair (back)
  const back = ctx.facing === 'n' || ctx.facing === 'w', want = back ? 'hair.' : 'skin.';
  let low = -1, xs = [];
  for (let y = hy; y <= hy + 6; y++) {
    const row = [];
    for (let x = hx - 4; x <= hx + 4; x++) if (String(px.tokenAt(g, [x, y])).startsWith(want)) row.push(x);
    if (row.length >= 2) { low = y; xs = row; }
  }
  if (low >= 0) {
    const c = (Math.min(...xs) + Math.max(...xs)) / 2, y0 = low + (back ? 2 : 1);
    for (let x = Math.ceil(c - 3); x <= Math.floor(c + 3); x++) px.set(g, [x, y0], 'cloth.0');
    for (let x = Math.ceil(c - 4); x <= Math.floor(c + 4); x++) {
      const end = x <= c - 3.5 || x >= c + 3.5, mid = Math.abs(x - c) < 1;
      px.set(g, [x, y0 + 1], end || mid ? 'cloth.1' : 'cloth.0');
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
