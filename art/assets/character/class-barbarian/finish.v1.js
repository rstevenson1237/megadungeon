// finish.v1 (f) on base.v4 — character finish (R2: the one direct-pixel pass). Review of base.v4 (6.5): the dark
// brown block down the centre of the chest (about 3px wide, neck to belt) reads as a hole in the torso. This pass
// repaints that block (its leather and the ink inside it, s/e facings, every state) in the skin ramp, modelled as a
// lit chest over a shadowed belly, and keeps a single 1px diagonal leather strap across it. Then the template face.
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { pass: 'f', notes: 'chest block repainted as modelled skin with a 1px diagonal strap, per-state face' };

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
  if ((ctx.facing === 's' || ctx.facing === 'e') && a.head) chest(g, px, a.head, ctx.facing === 's' ? 1 : -1);
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
/** The leather block between the shoulders and the belt (rows head+8..head+12) becomes modelled skin with a strap. */
function chest(g, px, [hx, hy], dir) {
  const r0 = hy + 8, r1 = hy + 11;
  let x0 = Infinity, x1 = -Infinity;
  for (let y = r0; y <= r1; y++) for (let x = hx - 5; x <= hx + 5; x++)
    if (ramp(px.tokenAt(g, [x, y])) === 'leather') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  if (x1 - x0 < 2) return;
  const w = x1 - x0;
  // lit side faces the light (left on screen); a pec shadow line under the first two rows, a belly below
  const tone = (x, y) => {
    const t = dir > 0 ? (x - x0) / w : (x1 - x) / w;   // 0 = lit edge, 1 = far edge
    if (t > 0.8) return 'skin.2';
    if (y === r0 + 2) return 'skin.2';                  // under the pectorals
    if (y === r0 && t < 0.5) return 'skin.0';            // lit top of the chest
    return 'skin.1';
  };
  const paintable = (x, y) => { const t = px.tokenAt(g, [x, y]); return ramp(t) === 'leather' || t === 'outline'; };
  for (let y = r0; y <= r1; y++) for (let x = x0; x <= x1; x++) if (paintable(x, y)) px.set(g, [x, y], tone(x, y));
  for (let x = x0; x <= x1; x++)                       // the ink row over the belt goes to belly shadow
    if (px.tokenAt(g, [x, r1 + 1]) === 'outline' && ramp(px.tokenAt(g, [x, r1 + 2])) === 'leather') px.set(g, [x, r1 + 1], 'skin.2');
  // one 1px diagonal strap, shoulder (lit side) down to the far hip
  const a = dir > 0 ? [x0, r0] : [x1, r0], b = dir > 0 ? [x1, r1 + 1] : [x0, r1 + 1];
  px.line(g, a, b, 'leather.1');
}
