// family-s finish.v1 on base.v3 — the review's shield and pelvis point, in pixels: the small brown shield blob (read as
// a fist) is replaced by a 7 px round disc (leather mid for the wood, as creatures have no wood ramp, with a leather
// boss highlight and a rim in the bone ramp lit on its upper left, the metal stand-in) with a 2 px notch bitten out of
// its top edge, so it reads as a broken shield; and the black gap between the hip wings gets a 4 px bone-light hip arc.
// finish.v1 (f) on base.v3 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'skeleton: 7 px notched round shield, bone-light hip arc in the pelvis gap; template face' };

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

  shield(g, px);
  pelvis(g, ctx, px);
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

// the broken shield: 7 px disc in its ink ring, a 2 px notch bitten from the top (`_` is cleared)
const DISC = ['...k__...', '..kR__k..', '.kRRkkrk.', 'kRmmmmmrk', 'kRmmLmmrk', 'kRmmmmdrk', '.krmddrk.', '..krrrk..', '...kkk...'];
const DISC_KEY = { k: 'outline', R: 'cloth.0', r: 'cloth.1', m: 'leather.1', L: 'leather.0', d: 'leather.2' };

function shield(g, px) {
  // the shield is the compact leather blob (the sword is the thin one)
  const seen = new Set(); let best = null;
  const isL = (x, y) => (px.tokenAt(g, [x, y]) ?? '').startsWith('leather');
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (seen.has(x + ',' + y) || !isL(x, y)) continue;
    const comp = [], stack = [[x, y]]; seen.add(x + ',' + y);
    while (stack.length) {
      const [cx, cy] = stack.pop(); comp.push([cx, cy]);
      for (const [nx, ny] of N4(cx, cy)) if (!seen.has(nx + ',' + ny) && isL(nx, ny)) { seen.add(nx + ',' + ny); stack.push([nx, ny]); }
    }
    const xs = comp.map(p => p[0]), ys = comp.map(p => p[1]);
    const w = Math.max(...xs) - Math.min(...xs) + 1, h = Math.max(...ys) - Math.min(...ys) + 1;
    if (w >= 3 && h >= 3 && comp.length / (w * h) > 0.5 && (!best || comp.length > best.length)) best = comp;
  }
  if (!best) return;
  const cx = Math.round(best.reduce((s, p) => s + p[0], 0) / best.length), cy = Math.round(best.reduce((s, p) => s + p[1], 0) / best.length);
  // the old blob and its own ink go; the disc covers where it was
  const inBlob = new Set(best.map(p => p.join(',')));
  const ink = new Set();
  for (const [x, y] of best) for (const [nx, ny] of N4(x, y))
    if (px.tokenAt(g, [nx, ny]) === 'outline' && N4(nx, ny).every(([a, b]) => !solid(g, a, b) || inBlob.has(a + ',' + b) || px.tokenAt(g, [a, b]) === 'outline')) ink.add(nx + ',' + ny);
  for (const [x, y] of best) g.clear(x, y);
  for (const k of ink) { const [x, y] = k.split(',').map(Number); g.clear(x, y); }
  const ox = Math.min(Math.max(cx - 4, 0), g.w - 9), oy = cy - 4;
  DISC.forEach((row, j) => [...row].forEach((c, i) => {
    if (c === '.') return;
    if (c === '_') g.clear(ox + i, oy + j); else px.set(g, [ox + i, oy + j], DISC_KEY[c]);
  }));
}

/** The pelvis gap: between the two lit hip wings, a bone-light arc (ends one row up, middle one row down). */
function pelvis(g, ctx, px) {
  const hy = ctx.anchors.head?.[1], gx = ctx.anchors.ground?.[0];
  if (hy == null || gx == null) return;
  for (let y = hy + 13; y <= hy + 15; y++) {
    const wings = [];
    for (let x = gx - 6; x <= gx + 5; x++) if (px.tokenAt(g, [x, y]) === 'cloth.0') wings.push(x);
    const l = Math.max(...wings.filter(x => x < gx)), r = Math.min(...wings.filter(x => x >= gx - 1));
    if (!isFinite(l) || !isFinite(r) || r - l !== 5) continue;
    const gap = [l + 1, l + 2, l + 3, l + 4];
    if (!gap.every(x => px.tokenAt(g, [x, y]) === 'outline')) continue;
    for (const [x, yy] of [[l + 1, y], [l + 2, y + 1], [l + 3, y + 1], [l + 4, y]]) px.set(g, [x, yy], 'cloth.0');
    return;
  }
}
