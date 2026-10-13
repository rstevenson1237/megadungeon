// family-w finish.v1 (f) on base.v3 — the review's pixel fix for the back views (n/w): the floor coil's segments are
// joined into one continuous tube (the outline/empty gaps between neighbouring segments, low on the body, are filled
// with skin dark and the new edge inked), and the back view's skin is dropped one step (salmon to dark red, the light
// top to mid) so it matches the dark-red s/e body. Front views keep the template face pass (no face anchors: no-op).
// Template: character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'back views: floor-coil segments joined into one tube, skin dropped one step to match s/e' };

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

const isBody = (px, g, x, y) => { const t = px.tokenAt(g, [x, y]); return !!t && t !== 'outline'; };
/** Back views: bridge the gaps between floor-coil segments, ink the bridge's edge, then drop the skin one step. */
function joinCoil(g, px) {
  let bottom = -1;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (px.tokenAt(g, [x, y])) bottom = y;
  if (bottom < 0) return;
  const fills = [];
  for (let y = bottom - 5; y < bottom; y++) for (let x = 1; x < g.w - 1; x++) {
    if (isBody(px, g, x, y)) continue;
    const left = [1, 2].some(d => isBody(px, g, x - d, y)), right = [1, 2].some(d => isBody(px, g, x + d, y));
    if (left && right) fills.push([x, y]);
  }
  for (const p of fills) px.set(g, p, 'skin.2');
  for (const [x, y] of fills) for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]])
    if (!px.tokenAt(g, [x + dx, y + dy])) px.set(g, [x + dx, y + dy], 'outline');
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const t = px.tokenAt(g, [x, y]);
    if (t === 'skin.1') px.set(g, [x, y], 'skin.2');
    else if (t === 'skin.0') px.set(g, [x, y], 'skin.1');
  }
}

export function finish(g, ctx) {
  const { px } = ctx.lib, a = ctx.anchors, mood = moodOf(ctx.state);
  px.fix.orphans(g);
  px.fix.jaggies(g);
  if (ctx.facing === 'n' || ctx.facing === 'w') joinCoil(g, px);
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
