// finish.v1 (f) on base.v4 — the robe tapered (review: a straight-sided box from shoulder to hem): 1 px of outline
// and fill trimmed from each side over the five waist rows, and 1 px of flare per side on the last three hem rows;
// then the template character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
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

const isRobe = t => !!t && t.startsWith('hair.');

/** Taper the coat (hair ramp): trim 1 px per side at the waist, flare 1 px per side over the last 3 hem rows. */
function taper(g, ctx, px) {
  const at = p => px.tokenAt(g, p), cx = ctx.anchors.ground?.[0] ?? (g.w >> 1);
  let yb = -1;
  for (let y = g.h - 1; y >= 0 && yb < 0; y--) for (let x = 0; x < g.w; x++) if (isRobe(at([x, y]))) { yb = y; break; }
  if (yb < 0) return;
  // the waist: walk out from the centre over the robe's fill; its last fill pixel becomes the outline, the old
  // outline goes when nothing lies beyond it, and the edge tone (lit / shade rim) moves one pixel in
  for (let y = yb - 14; y <= yb - 10; y++) for (const d of [-1, 1]) {
    let x = Math.round(cx) - (d > 0 ? 0 : 1);
    if (!isRobe(at([x, y]))) continue;
    while (isRobe(at([x + d, y])) || at([x + d, y])?.startsWith('metal.')) x += d; // across the sigil chain
    const edge = at([x, y]);
    if (!isRobe(edge) || !isRobe(at([x - d, y]))) continue;
    px.set(g, [x, y], 'outline');
    if (at([x - d, y]) !== edge && edge !== 'hair.1') px.set(g, [x - d, y], edge);
    if (at([x + d, y]) === 'outline' && at([x + 2 * d, y]) === null) g.clear(x + d, y);
  }
  // the hem: the outermost outline moves out a pixel, the fill follows it
  for (let y = yb - 2; y <= yb; y++) for (const d of [-1, 1]) {
    let x = d < 0 ? 0 : g.w - 1;
    while (x >= 0 && x < g.w && at([x, y]) === null) x -= d;
    if (at([x, y]) !== 'outline' || !isRobe(at([x - d, y])) || at([x + d, y]) !== null) continue;
    px.set(g, [x, y], at([x - d, y]));
    px.set(g, [x + d, y], 'outline');
  }
}

export function finish(g, ctx) {
  const { px } = ctx.lib, a = ctx.anchors, mood = moodOf(ctx.state);
  px.fix.orphans(g);
  px.fix.jaggies(g);
  taper(g, ctx, px);
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
