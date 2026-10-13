// family-q finish.v1 on base.v3 — the review's hindquarters point, in pixels, for the side views (s, e = s mirrored):
// a 4 px drooping brush tail (grass mid with a grass-light top edge) grows from the top of the haunch, and the hind
// legs get a hock: their lowest 3 rows step 1 px forward, so each hind leg bends back at the hock instead of standing
// as a straight rod. The back views (n/w) are left as they are.
// finish.v1 (f) on base.v3 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'wolf: drooping brush tail off the haunch and a 1 px hock step on the hind legs (s/e); template face' };

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
  for (const [at, t] of eyes) px.set(g, at, t);
  // px.light.rim(g, { ramps: ['cloth'] });
  // px.fx.glint(g, ctx.at('hand', 0, -4), 'glow.0');

  if (ctx.facing === 's' || ctx.facing === 'e') hindquarters(g, ctx, px);
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

// the tail, from the rump's outermost outline pixel (top-left of the pattern), growing back and drooping
const TAIL = ['kk..', 'lLk.', 'klLk', 'kllk', '.klk', '..k.'];
const raw = (g, x, y) => { const i = (y * g.w + x) * 4; return Array.from(g.d.subarray(i, i + 4)); };
const put = (g, x, y, c) => { const i = (y * g.w + x) * 4; g.d.set(c, i); };
const solid = (g, x, y) => g.inb(x, y) && g.alpha(x, y) === 255;

function hindquarters(g, ctx, px) {
  const back = ctx.facing === 's' ? 1 : -1; // the side the tail is on
  // the body's opaque bounds
  let top = g.h, bottom = -1;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (solid(g, x, y)) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
  if (bottom < 0) return;
  // the rump: the outermost pixel on the back side among the body's top 6 rows (topmost of ties)
  let rx = null, ry = null;
  for (let y = top; y < top + 6; y++) for (let x = 0; x < g.w; x++) if (solid(g, x, y) && (rx === null || x * back > rx * back)) { rx = x; ry = y; }
  // the hock: the hind legs' lowest 3 rows (columns 2..10 px in from the rump) step 1 px forward (away from the tail)
  const xs = []; for (let i = 2; i <= 10; i++) xs.push(rx - back * i);
  let legBottom = -1;
  for (const x of xs) for (let y = 0; y < g.h; y++) if (solid(g, x, y)) legBottom = Math.max(legBottom, y);
  const order = back > 0 ? [...xs].reverse() : [...xs]; // walk from the forward end so nothing is copied twice
  for (let y = legBottom - 2; y <= legBottom; y++) {
    const row = xs.map(x => [x, solid(g, x, y) ? raw(g, x, y) : null]);
    const pos = new Map(row);
    for (const x of order) {
      const c = pos.get(x); if (!c) continue;
      put(g, x - back, y, c);
    }
    // the backmost column of the step: what lies beyond the leg (shadow or nothing)
    for (const x of xs) if (pos.get(x) && !pos.get(x + back)) {
      const beyond = raw(g, x + back, y);
      put(g, x, y, beyond[3] === 255 ? [0, 0, 0, 0] : beyond);
    }
  }
  const rows = back > 0 ? TAIL : TAIL.map(r => [...r].reverse().join(''));
  const ox = back > 0 ? rx : rx - (TAIL[0].length - 1);
  px.patch(g, [ox, ry - 1], rows, { k: 'outline', l: 'grass.1', L: 'grass.0' }, { anchor: 'topleft' });
}
