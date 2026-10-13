// npc-captive finish.v1 (f) on base.v3 — the pixel part of base.v3's review: (1) the near-white highlight strip down
// the outer arms read as a bright outline at 1x, so the arms' light-step skin (shoulder to below the bound wrists) is
// dropped to the mid skin step; (2) the trailing rope end showed in walk frame 0 only (flicker), so it is taken out
// there (the rope still runs from the wrists to the feet in every frame), with the foot's outline restored.
// finish.v1 (f) on base.v3 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'arm highlight dropped to mid skin; walk f0 trailing rope removed (no flicker); template face' };

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

  // (1) the arms' light-step skin down to the mid step, from the shoulders to just below the bound wrists
  const [, hy] = ctx.at('head');
  for (let y = hy + 4; y <= hy + 19; y++) for (let x = 0; x < g.w; x++) if (px.tokenAt(g, [x, y]) === 'skin.0') px.set(g, [x, y], 'skin.1');

  // (2) walk frame 0: the rope's trailing end on the floor (beside the near foot) is cleared, its ground shadow too
  if (ctx.state === 'walk' && ctx.frame % 4 === 0) {
    const flip = ctx.facing === 'e' || ctx.facing === 'n', X = x => (flip ? g.w - 1 - x : x);
    const [, gy] = a.ground;
    for (let y = gy - 6; y <= gy + 1; y++) for (let x = 0; x <= 11; x++) {
      const p = [X(x), y], t = px.tokenAt(g, p);
      if (x <= 10) { if (!(t && t.startsWith('skin.'))) g.clear(p[0], p[1]); continue; }
      if (t && t.startsWith('leather.')) g.clear(p[0], p[1]);
    }
    // re-ink any skin pixel left with an empty pixel on its outer side
    for (let y = gy - 6; y <= gy + 1; y++) for (let x = 1; x <= 12; x++) {
      const p = [X(x), y], q = [X(x - 1), y], t = px.tokenAt(g, p);
      if (t && t.startsWith('skin.') && g.alpha(q[0], q[1]) === 0) px.set(g, q, 'outline');
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
