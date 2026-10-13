// family-r finish.v2 on base.v4 — re-finishes the best base (R12) with base.v4's review point, which is all pixels:
// the fur (the recolour ramp, hair) sat near black, so at 1x the rat was a dark blob and the row's colour would barely
// show. Every facing: the fur is lifted one step (hair.2 becomes hair.1; hair.2 stays only as a 1 px shade along the
// bottom and shaded-side edge), and a hair.0 highlight band runs along the spine (the top fur pixel of each column,
// two pixels deep over the middle of the back), so the recoloured hue dominates against a dark floor. The 1 px
// accent eye is protected from the template's orphan clean-up.
// finish.v2 (f) on base.v4 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { notes: 'rat: fur lifted one step (hair.2 to hair.1 bar a 1 px bottom shade), hair.0 spine highlight band; eye protected' };

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
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if ((px.tokenAt(g, [x, y]) ?? '').startsWith('accent')) ctx.protect([x, y]);
  px.fix.orphans(g);
  px.fix.jaggies(g);
  // px.light.rim(g, { ramps: ['cloth'] });
  // px.fx.glint(g, ctx.at('hand', 0, -4), 'glow.0');

  fur(g, px, ctx.facing === 'e' || ctx.facing === 'n');
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

/** Lift the fur one step and run a highlight band along the spine. */
function fur(g, px, flip) {
  const t = (x, y) => px.tokenAt(g, [x, y]) ?? '', hair = (x, y) => t(x, y).startsWith('hair');
  const shadeSide = flip ? -1 : 1; // the base shades the side away from the light: right in s/w, left mirrored
  const lift = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (t(x, y) !== 'hair.2') continue;
    const edge = t(x, y + 1) === 'outline' || !t(x, y + 1) || t(x + shadeSide, y) === 'outline';
    if (!edge) lift.push([x, y]);
  }
  for (const p of lift) px.set(g, p, 'hair.1');
  // the spine: per column, the top fur pixel under the outline; 2 deep over the middle third of the back
  const cols = [];
  for (let x = 0; x < g.w; x++) for (let y = 0; y < g.h; y++) if (hair(x, y)) { if (t(x, y - 1) === 'outline') cols.push([x, y]); break; }
  if (!cols.length) return;
  const x0 = cols[0][0], x1 = cols[cols.length - 1][0], w = x1 - x0;
  for (const [x, y] of cols) {
    px.set(g, [x, y], 'hair.0');
    if (x > x0 + w / 3 && x < x1 - w / 3 && hair(x, y + 1)) px.set(g, [x, y + 1], 'hair.0');
  }
}
