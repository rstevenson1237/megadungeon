// finish.v1 (f) on base.v4 — character finish (R2: the one direct-pixel pass). Review of base.v4 (7): the brown
// instrument at the free hand reads as a sack or purse, not a lute. This pass finds the lute body (the first 6+ px
// leather run beside the hips, s/e facings, every state), punches a 1px dark sound-hole in its middle, clears the lump
// above it to ink and draws a 3px neck rising from the body toward the shoulder (leather.1: characters have no wood
// ramp). Then the template face.
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { pass: 'f', notes: 'lute sound-hole and neck painted on the instrument, per-state face' };

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
  if ((ctx.facing === 's' || ctx.facing === 'e') && a.head) lute(g, px, a.head, ctx.facing === 's' ? 1 : -1);
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

const ramp = t => t && t.split('.')[0];
/** Lute: body = first leather run of 6+ px on the instrument side (right of the hips in s, left in e). */
function lute(g, px, [hx, hy], side) {
  const lea = (x, y) => ramp(px.tokenAt(g, [x, y])) === 'leather';
  let R = -1, bx0 = 0, bx1 = 0;
  for (let y = hy + 14; y <= hy + 21 && R < 0; y++) {
    for (let x = 0; x < g.w; x++) {
      if ((side > 0 ? x < hx + 4 : x > hx - 4) || !lea(x, y)) continue;
      let e = x; while (lea(e + 1, y) && (side > 0 || e + 1 <= hx - 4)) e++;
      if (e - x + 1 >= 6) { R = y; bx0 = x; bx1 = e; break; }
      x = e;
    }
  }
  if (R < 0) return;
  const mid = Math.round((bx0 + bx1) / 2);
  // the lump over the body (rows R-3..R-1, away from the strap at the body's near end) becomes ink
  const lo = side > 0 ? bx0 + 2 : bx0, hi = side > 0 ? bx1 : bx1 - 2;
  for (let y = R - 3; y < R; y++) for (let x = lo; x <= hi; x++) if (lea(x, y)) px.set(g, [x, y], 'outline');
  // neck: 3 px from the top of the body, rising toward the shoulder (up-left in s, up-right in e)
  for (let i = 0; i < 3; i++) px.set(g, [mid + side - side * i, R - 1 - i], 'leather.1');
  px.set(g, [mid, R + 1], 'outline');                    // sound-hole
}
