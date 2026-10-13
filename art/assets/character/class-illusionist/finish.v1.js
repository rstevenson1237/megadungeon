// finish.v1 (f) on base.v4 — character finish (R2: the one direct-pixel pass). Review of base.v4 (6.5): the orange
// hood rim rings a dark face with one bright pixel, so it reads as a goggle or cyclops eye at 1x. This pass opens the
// ring under the chin (the rim pixels beside the face from the eye row down go to the hood leather) and paints a face inside the
// hood: two dark eye pixels either side of a lit skin nose, and two skin pixels outside them where the hood ink was (s/e, every state; the base
// has no eye anchors, so the face is found from the skin pixels under the head anchor). The template face is a no-op.
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { pass: 'f', notes: 'hood rim opened under the chin, eyes and brow painted in the hood, per-state face' };

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
  if ((ctx.facing === 's' || ctx.facing === 'e') && a.head) hoodFace(g, px, a.head);
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

const ramp = t => t && t.split('.')[0];
/** Open the accent rim under the chin and paint brow + eyes on the skin found inside the hood around `head`. */
function hoodFace(g, px, [hx, hy]) {
  const rows = [];
  for (let y = hy - 2; y <= hy + 4; y++) {
    const xs = [];
    for (let x = hx - 4; x <= hx + 4; x++) if (ramp(px.tokenAt(g, [x, y])) === 'skin') xs.push(x);
    if (xs.length) rows.push([y, Math.min(...xs), Math.max(...xs), xs.length]);
  }
  const eyeRow = rows.find(r => r[3] >= 3);
  if (!eyeRow) return;
  const [ey, x0, x1] = eyeRow, fx0 = Math.min(...rows.map(r => r[1])), fx1 = Math.max(...rows.map(r => r[2]));
  // rim: the accent rim pixels beside the face from the eye row down (2 a side) go to the hood leather, so the rim
  // is an arch over the brow, not a ring
  for (const side of [-1, 1]) for (let y = hy + 4; y >= ey; y--) {
    for (let d = 1; d <= 3; d++) {
      const x = side < 0 ? fx0 - d : fx1 + d;
      if (ramp(px.tokenAt(g, [x, y])) !== 'accent') continue;
      const below = px.tokenAt(g, [x, y + 1]);
      px.set(g, [x, y], ramp(below) === 'leather' ? below : 'leather.2');
    }
  }
  // eyes at the ends of the first 3-wide skin row, lit nose between; the hood's inner ink either side of them becomes
  // two skin pixels, so each eye sits in skin instead of merging into the rim
  for (const x of [x0 - 1, x1 + 1]) if (px.tokenAt(g, [x, ey]) === 'outline') px.set(g, [x, ey], 'skin.1');
  px.set(g, [x0, ey], 'outline'); px.set(g, [x1, ey], 'outline');
  for (let x = x0 + 1; x < x1; x++) px.set(g, [x, ey], 'skin.0');
}
