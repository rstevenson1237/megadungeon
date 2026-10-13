// finish.v1 (f) on base.v4 — review: the scalp highlight is an oversized near-white blob and the face has no eyes. This
// pass cuts the scalp's light-skin pixels (above the head anchor) to a 3px cluster at the lit top corner, the rest going
// to mid skin, in every facing; the template then paints the two dark eyes at the eye anchors. Character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { pass: 'f1', notes: 'scalp highlight cut to a 3px cluster at the lit top corner, then the per-state face with dark eyes' };

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

  // scalp highlight: keep 3 light-skin pixels at the lit top corner of the light area, the rest mid skin
  if (a.head) {
    const [hx, hy] = a.head, lit = [];
    for (let y = hy - 8; y < hy; y++) for (let x = hx - 6; x <= hx + 6; x++) if (px.tokenAt(g, [x, y]) === 'skin.0') lit.push([x, y]);
    if (lit.length > 3) {
      const mx = lit.reduce((t, p) => t + p[0], 0) / lit.length, left = mx <= hx;
      const xs = lit.map(p => p[0]), y0 = Math.min(...lit.map(p => p[1]));
      const c = [left ? Math.min(...xs) + 1 : Math.max(...xs) - 1, y0 + 1];
      const d = p => Math.hypot(p[0] - c[0], p[1] - c[1]) + p[1] * 0.01;
      const keep = new Set(lit.slice().sort((p, q) => d(p) - d(q)).slice(0, 3).map(String));
      for (const p of lit) if (!keep.has(String(p))) px.set(g, p, 'skin.1');
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
