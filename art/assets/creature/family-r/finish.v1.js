// family-r finish.v1 on base.v3 — the review's fur point, in pixels: the body's interior (the dark step, the stray ink
// pixels inside the silhouette and the light/dark specks) is repainted hair mid, with a hair-light band along the back
// ridge (the first fur pixel under the top edge) and hair dark only along the belly edge, so the outline stays on the
// silhouette and the recoloured hair ramp dominates at 1x. Ink between fur and skin (ears, paws, tail) is kept. In the
// side views (s, e = s mirrored) the tail runs on 3 px past its tip, thinning: one skin-mid pixel in ink, then two
// skin-dark pixels without ink, the last drooping.
// finish.v1 (f) on base.v3 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'rat: fur interior repainted hair mid with a hair-light back ridge; tail 3 px longer with a thinning tip' };

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
  // the eye is a single accent pixel: keep it safe from the clean-up
  const eyes = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { const t = px.tokenAt(g, [x, y]); if (t && t.startsWith('accent')) eyes.push([[x, y], t]); }
  px.fix.orphans(g);
  px.fix.jaggies(g);
  fur(g, px);
  if (ctx.facing === 's' || ctx.facing === 'e') tail(g, ctx, px);
  for (const [at, t] of eyes) px.set(g, at, t);
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

const solid = (g, x, y) => g.inb(x, y) && g.alpha(x, y) === 255;
const N4 = (x, y) => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];

/** Fur interior to hair mid, a hair-light ridge under the top edge, hair dark on the belly edge; ink only on the edge. */
function fur(g, px) {
  const T = [];
  for (let y = 0; y < g.h; y++) { T.push([]); for (let x = 0; x < g.w; x++) T[y].push(solid(g, x, y) ? px.tokenAt(g, [x, y]) : null); }
  const tok = (x, y) => (x >= 0 && y >= 0 && x < g.w && y < g.h ? T[y][x] : null);
  const isHair = t => t && t.startsWith('hair');
  const edge = (x, y) => N4(x, y).some(([a, b]) => !tok(a, b)); // touches the outside (or the shadow)
  // the fur cells: hair, plus ink inside the silhouette that touches only fur and ink
  const furAt = (x, y) => {
    const t = tok(x, y);
    if (isHair(t)) return true;
    return t === 'outline' && !edge(x, y) && N4(x, y).every(([a, b]) => tok(a, b) === 'outline' || isHair(tok(a, b)));
  };
  const F = T.map((r, y) => r.map((_, x) => furAt(x, y)));
  const isF = (x, y) => x >= 0 && y >= 0 && x < g.w && y < g.h && F[y][x];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (!F[y][x]) continue;
    const up = isF(x, y - 1), down = isF(x, y + 1);
    let t = 'hair.1';
    if (!up && tok(x, y - 1) === 'outline' && edge(x, y - 1)) t = 'hair.0'; // the back ridge, under the top edge
    else if (!down && (!tok(x, y + 1) || (tok(x, y + 1) === 'outline' && edge(x, y + 1)))) t = 'hair.2'; // the belly edge
    px.set(g, [x, y], t);
  }
}

/** The tail runs on 3 px past its tip, thinning and drooping. */
function tail(g, ctx, px) {
  const back = ctx.facing === 's' ? 1 : -1;
  let tx = null, ty = null;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const t = solid(g, x, y) ? px.tokenAt(g, [x, y]) : null;
    if (t && t.startsWith('skin') && (tx === null || x * back > tx * back)) { tx = x; ty = y; }
  }
  if (tx === null) return;
  const ink = (x, y) => { if (!solid(g, x, y)) px.set(g, [x, y], 'outline'); };
  const a = [tx + back, ty], b = [tx + 2 * back, ty], c = [tx + 3 * back, ty + 1];
  px.set(g, a, 'skin.1'); ink(a[0], ty - 1); ink(a[0], ty + 1);
  px.set(g, b, 'skin.2');
  px.set(g, c, 'skin.2');
}
