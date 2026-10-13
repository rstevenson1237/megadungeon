// npc-bandit finish.v1 (f) on base.v3 — the pixel part of base.v3's review (the back hood reads as a huge egg): in the
// back views (n/w) the hood's outer pixels are shaded down to the cloth ramp's dark step, so only an egg about the
// front head's size stays in the mid step (lit rim kept on the light side for the crown), and below the head the
// hood's sides read as a dark drape falling onto the shoulders, with a 1-px shaded fold either side of the nape.
// The hood's outline itself is a base form (a base revision): left as it is. Bandit has no face anchors (face cloth).
// finish.v1 (f) on base.v3 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'back hood shaded down to a head-sized egg with a dark drape and nape folds; template clean-up' };

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

  // back views: shade the hood's outer pixels so the mid-step egg is head-sized and the rest drapes dark
  if (ctx.facing === 'n' || ctx.facing === 'w') {
    const [hx, hy] = ctx.at('head'), litLeft = ctx.facing === 'w';
    const isCloth = t => t === 'cloth.0' || t === 'cloth.1';
    // half-width of the egg kept in the mid step, per row from the head anchor
    const half = dy => (dy <= -4 ? 9 : dy <= 0 ? 3 : dy <= 3 ? 2.5 : 1.5);
    for (let dy = -6; dy <= 7; dy++) for (let dx = -7; dx <= 7; dx++) {
      const p = [hx + dx, hy + dy], t = px.tokenAt(g, p);
      if (!isCloth(t)) continue;
      const lit = litLeft ? dx < 0 : dx > 0;
      if (lit && dy <= 1 && t === 'cloth.0') continue; // keep the lit rim on the crown
      if (Math.abs(dx) > half(dy)) px.set(g, p, 'cloth.2');
    }
    // a lit fold either side of the nape, where the drape turns onto the shoulders
    for (const sx of [-1, 1]) for (let dy = 4; dy <= 6; dy++) {
      const p = [hx + sx * (dy - 1), hy + dy];
      if (px.tokenAt(g, p) === 'cloth.2') px.set(g, p, 'cloth.1');
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
