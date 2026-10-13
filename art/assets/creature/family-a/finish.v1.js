// family-a finish.v1 on base.v3 — the review's attack point, in pixels: in the front views (s/e) attack frames 1-2
// the tail's upper beads and sting are redrawn so the tail swings forward over the body (frame 1, the swing) and the
// red sting lands ahead of the pincers in the contact frame (frame 2), instead of staying arched over the back.
// finish.v1 (f) on base.v3 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'template character finish: clean-up, then a per-state face at the face anchors' };

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

  if ((ctx.facing === 's' || ctx.facing === 'e') && ctx.state === 'attack' && (ctx.frame === 1 || ctx.frame === 2)) strike(g, ctx, px);

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

// The striking tail, drawn for `s` (x mirrored for `e`), in frame pixels: bead centres from the body up and forward,
// then the sting's top-left corner. Frame 1 swings over the body; frame 2 (contact) lands ahead of the pincers.
const BEAD = ['.kkkk.', 'kLLLlk', 'kLlllk', 'kllldk', '.kkkk.'];
const STING = ['..kkk', '.kaak', 'kaak.', 'kar..', 'kr...', 'k....'];
const TAIL = {
  1: { beads: [[22, 24], [21, 21], [18, 18], [14, 17], [10, 18]], sting: [5, 18] },
  2: { beads: [[22, 24], [20, 21], [17, 19], [13, 19], [9, 21]], sting: [2, 22] },
};
function strike(g, ctx, px) {
  const flip = ctx.facing === 'e', X = x => (flip ? g.w - 1 - x : x), T = TAIL[ctx.frame];
  const mirror = rows => (flip ? rows.map(r => [...r.padEnd(Math.max(...rows.map(q => q.length)), '.')].reverse().join('')) : rows);
  // clear the arched tail and the old sting: everything above the shell in the tail's columns
  for (let y = 0; y <= 26; y++) for (let x = 9; x <= 28; x++) if (y <= 25 || x <= 17) g.clear(X(x), y);
  const key = { k: 'outline', L: 'leather.0', l: 'leather.1', d: 'leather.2', a: 'accent.1', r: 'accent.2' };
  for (const [x, y] of T.beads) {
    const bx = flip ? X(x) - 2 : x - 3;
    px.patch(g, [bx, y - 2], mirror(BEAD), key, { anchor: 'topleft' });
  }
  const [sx, sy] = T.sting, sw = STING[0].length;
  px.patch(g, [flip ? X(sx) - (sw - 1) : sx, sy], mirror(STING), key, { anchor: 'topleft' });
}
