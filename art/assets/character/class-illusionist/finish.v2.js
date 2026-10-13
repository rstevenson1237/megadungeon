// finish.v2 (f) on base.v5 — re-finish of the best base (R12). Review of base.v5 (6.5): the veil reads as a flat blue
// rectangle that squares the head. This pass rounds it: the veil's four corner pixels go to ink so it is an oval (2-4-2),
// a 1 px stepped cheek highlight (cloth.0) sits on its lit upper edge, and the hood pixels touching the face skin go to
// the hood's shadow (leather.2), so the face sits in a shadowed opening (s/e only; back views have no face).
// Clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v5';
export const meta = { pass: 'f', notes: 'veil rounded to an oval with a lit cheek step, shadowed hood opening round the face, per-state face' };

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
  if ((ctx.facing === 's' || ctx.facing === 'e') && a.head) veilAndOpening(g, px, a.head, ctx.facing === 'e' ? 1 : -1);
  // px.light.rim(g, { ramps: ['cloth'] });
  // px.fx.glint(g, ctx.at('hand', 0, -4), 'glow.0');

  // face last
  const skinNear = ([x, y]) => [[x + 1, y], [x - 1, y], [x, y + 1]].map(p => px.tokenAt(g, p)).find(t => t && t !== 'outline') ?? 'skin.1';
  for (const name of ['eye', 'eye2']) {
    if (!a[name]) continue;
    const [x, y] = a[name];
    if (ramp(px.tokenAt(g, [x, y])) === 'cloth') continue; // the base's eye anchors fall on the veil: its drawn eyes stay
    let eh = 0;
    while (eh < (g.h >= 32 ? 3 : 2) && px.tokenAt(g, [x, y + eh]) === 'outline') eh++;
    // the base's eyes are 1 px over the face's lower ink: counting that ink as eye would erase them in attacks
    px.patch(g, ctx.at(name), eyeRows(mood, 1), { k: 'outline', s: skinNear([x, y]) }, { anchor: 'topleft' });
  }
  const mouth = MOUTH[mood];
  if (mouth && a.mouth && ramp(px.tokenAt(g, a.mouth)) === 'skin') // the mouth is under the veil: none
    px.patch(g, ctx.at('mouth'), mouth, { k: 'outline' }, { anchor: 'topleft' });
  return g;
}

const ramp = t => t && t.split('.')[0];
/** Round the veil (the first cloth block under the head) and shadow the hood opening round the face skin. */
function veilAndOpening(g, px, [hx, hy], lit) {
  // shadowed opening: hood leather 4-touching face skin goes to the hood's darkest step
  const dark = [];
  for (let y = hy - 4; y <= hy + 6; y++) for (let x = hx - 6; x <= hx + 6; x++) {
    if (ramp(px.tokenAt(g, [x, y])) !== 'leather') continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => ramp(px.tokenAt(g, [x + dx, y + dy])) === 'skin')) dark.push([x, y]);
  }
  for (const p of dark) px.set(g, p, 'leather.2');
  // the veil: rows of cloth under the head, within the face's width
  const rows = [];
  for (let y = hy + 2; y <= hy + 12; y++) {
    const xs = [];
    for (let x = hx - 5; x <= hx + 5; x++) if (ramp(px.tokenAt(g, [x, y])) === 'cloth') xs.push(x);
    if (xs.length) rows.push([y, Math.min(...xs), Math.max(...xs)]);
    else if (rows.length) break;
  }
  if (rows.length < 3) return;
  const [y0, a0, a1] = rows[0], [y1, b0, b1] = rows[rows.length - 1];
  if (a1 - a0 < 3 || b1 - b0 < 3) return;
  for (const p of [[a0, y0], [a1, y0], [b0, y1], [b1, y1]]) px.set(g, p, 'outline');
  // the lit cheek step: the top row's lit-end pixel and the row below's lit-end pixel, a diagonal step
  const [, m0, m1] = rows[1];
  px.set(g, [lit < 0 ? a0 + 1 : a1 - 1, y0], 'cloth.0');
  px.set(g, [lit < 0 ? m0 : m1, rows[1][0]], 'cloth.0');
}
