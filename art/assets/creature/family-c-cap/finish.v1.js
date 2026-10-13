// family-c-cap finish.v1 (f) on base.v3 — review: the chest rune flanked by dotted light rows read as a robot control
// panel, not carved stone. The middle course of the chest (the three small stones the rune sits among, whose 1-2 px
// lit corners made the dotted rows) is repainted as one plain dressed stone: a lit top row and left column, the mid
// step inside, the dark step on the bottom row and right column, with the red rune kept as drawn. Same block from
// behind (no rune there). Then the template's clean-up; no face (the golem's eyes are the base's glowing slits).
//
// template: character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
import { bipedLayout } from '../../../lib/beast.v1.js';
export const base = 'base.v3';
export const meta = { notes: 'middle chest course repainted as one plain stone around the rune: no dotted rows' };

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

  // the chest's middle course as one plain stone (base.v3 geometry: rows r1..r2-0.6, inside the arm stones)
  const Lo = bipedLayout({ size: [g.w, g.h], state: ctx.state, frame: ctx.frame, logical: ctx.logical }, 3);
  const flip = ctx.facing === 'e' || ctx.facing === 'n';
  const r1 = Math.round(Lo.shoulder + Lo.Y(3)), r2 = Math.round(Lo.shoulder + Lo.Y(6) - Lo.Y(0.6));
  const sx0 = Math.round(Lo.cx - Lo.X(5.4)), sx1 = Math.round(Lo.cx + Lo.X(4.4));
  const x0 = flip ? g.w - 1 - sx1 : sx0, x1 = flip ? g.w - 1 - sx0 : sx1, bw = x1 - x0 + 1, bh = r2 - r1;
  const stoneTok = t => t && t.startsWith('cloth.');
  const rows = [];
  for (let j = 0; j < bh; j++) {
    let row = '';
    for (let i = 0; i < bw; i++) {
      const t = px.tokenAt(g, [x0 + i, r1 + j]);
      // only stone and mortar seams inside the block; the rune (accent) and anything else stay as they are
      if (!(stoneTok(t) || t === 'outline')) { row += '.'; continue; }
      row += j === 0 || i === 0 ? 'l' : j === bh - 1 || i === bw - 1 ? 'd' : 'm';
    }
    rows.push(row);
  }
  // from the front only where the rune shows (a raised fist over the chest stays as drawn); from behind the arms are behind
  let rune = false;
  for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) if (px.tokenAt(g, [x0 + i, r1 + j]) === 'accent.1') rune = true;
  const back = ctx.facing === 'n' || ctx.facing === 'w';
  if (rune || back) px.patch(g, [x0, r1], rows, { l: 'cloth.0', m: 'cloth.1', d: 'cloth.2' }, { anchor: 'topleft' });
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
