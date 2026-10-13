// finish.v1 (f) on base.v4 — review: the staff skull degrades into a shapeless pale blob in every tilted staff frame
// (walk 0/2, attack, hurt). This pass finds the skull (the largest light-skin/bone-shadow blob), and where it is not
// already the upright skull, clears it with its outline and stamps the upright 5x6 skull of the idle frame (two dark
// sockets, nose pit, shadowed jaw) centred on it. The face is shadow, so no face is painted. Character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { pass: 'f1', notes: 'tilted staff skulls redrawn as the upright 5x6 skull with two dark sockets' };

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

  // the staff skull: upright in every frame
  {
    const SKULL = ['..###..', '.#sss#.', '#sssss#', '#s#s#s#', '#sssjs#', '.#s#j#.', '.#ssj#.'];
    const rows = (ctx.facing === 'e' || ctx.facing === 'n') ? SKULL.map(r => [...r].reverse().join('')) : SKULL;
    const bone = t => t === 'skin.0' || t === 'hair.0';
    const seen = new Set(); let best = [];
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      if (seen.has(x + ',' + y) || !bone(px.tokenAt(g, [x, y]))) continue;
      const comp = [], st = [[x, y]]; seen.add(x + ',' + y);
      while (st.length) {
        const [i, j] = st.pop(); comp.push([i, j]);
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          const k = (i + di) + ',' + (j + dj);
          if (!seen.has(k) && bone(px.tokenAt(g, [i + di, j + dj]))) { seen.add(k); st.push([i + di, j + dj]); }
        }
      }
      if (comp.length > best.length) best = comp;
    }
    const key = { '#': 'outline', s: 'skin.0', j: 'hair.0' };
    const matchesAt = (x0, y0) => rows.every((r, j) => [...r].every((ch, i) => ch === '.' || px.tokenAt(g, [x0 + i, y0 + j]) === key[ch]));
    if (best.length >= 6) {
      const xs = best.map(p => p[0]), ys = best.map(p => p[1]);
      let upright = false;
      for (let y0 = Math.min(...ys) - 2; y0 <= Math.min(...ys) && !upright; y0++)
        for (let x0 = Math.min(...xs) - 2; x0 <= Math.min(...xs) && !upright; x0++) upright = matchesAt(x0, y0);
      if (!upright) {
        const inSkull = new Set(best.map(String));
        const other = ([x, y]) => { const t = px.tokenAt(g, [x, y]); return t && t !== 'outline' && !inSkull.has(x + ',' + y); };
        const ring = new Set();
        for (const [x, y] of best) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const q = [x + dx, y + dy];
          if (px.tokenAt(g, q) === 'outline' && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([u, v]) => other([q[0] + u, q[1] + v]))) ring.add(String(q));
        }
        for (const [x, y] of best) px.set(g, [x, y], 'outline');
        const clear = [...best.map(String), ...ring].map(k => k.split(',').map(Number));
        const cx = Math.round(xs.reduce((a, b) => a + b, 0) / xs.length), cy = Math.round(ys.reduce((a, b) => a + b, 0) / ys.length);
        const wipe = [], x0 = Math.min(...clear.map(p => p[0])), y0 = Math.min(...clear.map(p => p[1]));
        const x1 = Math.max(...clear.map(p => p[0])), y1 = Math.max(...clear.map(p => p[1]));
        const set = new Set(clear.map(String));
        for (let y = y0; y <= y1; y++) { let r = ''; for (let x = x0; x <= x1; x++) r += set.has(x + ',' + y) ? '_' : '.'; wipe.push(r); }
        px.patch(g, [x0, y0], wipe, {}, { anchor: 'topleft' });
        px.patch(g, [cx, cy], rows, key);
      }
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
