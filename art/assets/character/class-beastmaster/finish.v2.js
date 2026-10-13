// class-beastmaster finish.v2 (f2) on base.v5 — re-finishing the best base (R12). Review of base.v5: "the face is a red
// band across the eyes (reads as a blindfold) and the pale hood swallows the head … replace the red eye band with skin
// and 1 px dark eyes under a darker hood brow so the egg-shaped face reads". This pass turns the red band's pixels into
// the skin under them, steps the pale hood row just above the face down to hair.1 (a darker brow), and then paints
// the per-state 1 px eyes at the eye anchors. The stiff raised arm is a form change (base work) and is left.
// Template notes: // finish.v2 (f) on base.v5 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v5';
export const meta = { pass: 'f2', notes: 'red eye band to skin, darker hood brow, 1 px eyes per state' };

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

  // the eye band off: the red run just above the eyes becomes skin (the step under it, else mid skin), and the pale
  // hood row just above it (over the ink line of the hood's edge) steps down to hair.1, a darker brow over the face
  if (a.eye && a.eye2) {
    const x0 = Math.min(a.eye[0], a.eye2[0]) - 3, x1 = Math.max(a.eye[0], a.eye2[0]) + 3, ey = Math.min(a.eye[1], a.eye2[1]);
    for (let y = ey - 1; y >= ey - 3; y--) {
      const xs = []; for (let x = x0; x <= x1; x++) if ((px.tokenAt(g, [x, y]) ?? '').startsWith('accent')) xs.push(x);
      if (xs.length < 2) continue;
      for (const x of xs) {
        const below = px.tokenAt(g, [x, y + 1]);
        px.set(g, [x, y], below && below.startsWith('skin') ? below : 'skin.1');
      }
      for (let yb = y - 1; yb >= y - 3; yb--) {
        const pale = []; for (let x = xs[0]; x <= xs[xs.length - 1]; x++) if (px.tokenAt(g, [x, yb]) === 'hair.0') pale.push(x);
        if (pale.length < 3) continue; // a stray pale pixel at the hood's corner is not the brow
        for (const x of pale) px.set(g, [x, yb], 'hair.1');
        break;
      }
      break;
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
