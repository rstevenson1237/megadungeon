// family-e-cap finish.v2 (f) on base.v4 — the one direct-pixel pass (R2), re-finishing the best base (R12; finish.v1
// finished base.v3). Review of base.v4: "the dark-ramp flank on the figure's left torso and shoulder is one flat
// dark-red slab that reads as a hole ... break the left-torso shadow slab into 2-3 tapering flame tongues using the mid
// ramp step, keeping the dark step only on the outer edge". This pass finds the accent.2 slab on the torso (screen
// right, every facing, between the shoulder line and the hem), keeps the dark step on its outer 2 px, and repaints the
// rest as three accent.1 tongues side by side, full width at the hem, each tapering to a point at its own height with a
// waver per row; the dark step stays only above and between their tips. The template's clean-up and face follow. The attack arm
// (a form change) is left for the base. Colours are direction tokens (R11).
import { bipedLayout } from '../../../lib/beast.v1.js';
export const base = 'base.v4';
export const meta = { notes: 'torso shadow slab broken into three mid-tone flame tongues, dark kept on the outer edge; template clean-up and face' };

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

/** The torso shadow slab (accent.2, screen right of the centre line) becomes three mid-tone flame tongues. */
function tongues(g, ctx, px) {
  const Lo = bipedLayout({ size: [g.w, g.h], state: ctx.state, frame: ctx.frame, facing: ctx.facing }, 2.4);
  const flip = ctx.facing === 'e' || ctx.facing === 'n', cx = Math.round(flip ? g.w - 1 - Lo.cx : Lo.cx);
  const y0 = Math.round(Lo.shoulder - Lo.Y(1)), y1 = Math.round(Lo.waist + Lo.Y(2));
  const rows = [];
  for (let y = y0; y <= y1; y++) {
    const xs = [];
    for (let x = cx - 1; x < g.w; x++) if (px.tokenAt(g, [x, y]) === 'accent.2') xs.push(x);
    if (xs.length < 3) continue;
    // the outer edge: the last body pixel before the ink on this row
    let outer = xs[xs.length - 1];
    rows.push({ y, inner: xs[0], outer, xs });
  }
  if (!rows.length) return;
  const top = rows[0].y, bot = rows[rows.length - 1].y, span = Math.max(1, bot - top);
  for (const { y, inner, outer, xs } of rows) {
    const v = (bot - y) / span;                                    // 0 at the hem, 1 at the shoulder
    const keepFrom = outer - 1, w = Math.max(1, keepFrom - inner);
    // three tongues side by side, full width at the hem, each tapering to a point at its own height, wavering per row
    const tongue = [[1 / 6, 0.95], [3 / 6, 0.7], [5 / 6, 0.85]].map(([t, h], i) => ({ c: inner + w * t + Math.sin(v * 6 + i * 2 + ctx.frame) * 0.7, hw: (w / 6 + 0.6) * (1 - v / h) }));
    for (const x of xs) {
      if (x >= keepFrom) continue;                                 // the outer edge keeps the dark step
      if (tongue.some(({ c, hw }) => hw > 0 && Math.abs(x - c) <= hw)) px.set(g, [x, y], 'accent.1');
    }
  }
}

export function finish(g, ctx) {
  const { px } = ctx.lib, a = ctx.anchors, mood = moodOf(ctx.state);
  px.fix.orphans(g);
  px.fix.jaggies(g);
  tongues(g, ctx, px);

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
