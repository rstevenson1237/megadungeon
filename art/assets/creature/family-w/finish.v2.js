// family-w finish.v2 (f) on base.v4 (6.5, now the best base; finish.v1 finished base.v3) — the review's pixel fix for
// the front views (s/e): the maw stops reading as a face. The two pale-blue tooth pixels that read as eyes are dropped,
// and the head end is repainted as a dark open ring: a skin shadow-step rim round an outline-dark hole (taller in the
// attack), with 1 px pale teeth (skin highlight) set round the rim (top, both sides, bottom) so no pair reads as eyes. Back views are untouched.
// Template: character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { notes: 'front views: eye-like teeth pixels dropped, maw repainted as a dark open ring (shadow-step rim, dark hole) with 1 px pale teeth on the rim' };

/** Front maw: rim `r` (skin shadow step), hole `k` (outline), tooth `t` (skin highlight); centred on the old teeth. */
const MAW = { shut: ['rrtrr', 'tkkkt', 'rrtrr'], open: ['rrtrr', 'tkkkt', 'rkkkr', 'rrtrr'] };
function paintMaw(g, ctx, px) {
  const teeth = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if ((px.tokenAt(g, [x, y]) ?? '').startsWith('cloth')) teeth.push([x, y]);
  if (!teeth.length) return;
  for (const p of teeth) px.set(g, p, 'outline');
  const cx = Math.round(teeth.reduce((s, p) => s + p[0], 0) / teeth.length);
  const cy = Math.round(teeth.reduce((s, p) => s + p[1], 0) / teeth.length);
  const rows = /attack/.test(ctx.state) && (ctx.frame === 1 || ctx.frame === 2) ? MAW.open : MAW.shut, key = { r: 'skin.2', k: 'outline', t: 'skin.0' };
  rows.forEach((row, j) => [...row].forEach((c, i) => {
    const p = [cx - 2 + i, cy - 1 + j];
    if (px.tokenAt(g, p)) px.set(g, p, key[c]);
  }));
}

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
  if (ctx.facing === 's' || ctx.facing === 'e') paintMaw(g, ctx, px);
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
