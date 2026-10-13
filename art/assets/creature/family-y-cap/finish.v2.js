// family-y-cap finish.v2 (f) on base.v4 (6, now the best base; finish.v1 finished base.v3) — the review's pixel fix:
// the body fill sat on the darkest leather step, so near-black dominated and the recolour ramp could not show. The
// flank is lifted from shadow to the mid leather step; shadow stays only on the underside (the 2 px above the body's
// lower edge in each column), on the shadow-side edge (the 1 px against the outline on the right) and on the legs
// (everything below the belly line: 60% of the sprite's height, 72% in the reared attack). The hump's light, the
// muzzle and the claws are untouched.
// Template: character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { notes: 'body flank lifted from leather shadow to mid; shadow kept on the underside, right edge and legs' };

const filled = (px, g, p) => { const t = px.tokenAt(g, p); return !!t && t !== 'outline'; };
/** Lift leather.2 to leather.1 above the belly line, keeping the underside, the shadow-side edge and the legs dark. */
function liftFlank(g, ctx, px) {
  let top = g.h, bottom = -1;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (px.tokenAt(g, [x, y])) { top = Math.min(top, y); bottom = y; }
  if (bottom < 0) return;
  const belly = top + Math.round((bottom - top) * (/attack/.test(ctx.state) ? 0.72 : 0.6));
  const lift = [];
  for (let y = top; y < belly; y++) for (let x = 0; x < g.w; x++) {
    if (px.tokenAt(g, [x, y]) !== 'leather.2') continue;
    if (!filled(px, g, [x, y + 1]) || !filled(px, g, [x, y + 2])) continue; // underside
    if (!filled(px, g, [x + 1, y])) continue;                                // shadow-side edge
    lift.push([x, y]);
  }
  for (const p of lift) px.set(g, p, 'leather.1');
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
  liftFlank(g, ctx, px);
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
