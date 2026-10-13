// finish.v1 (f) on base.v4 — review fix (base.v4, 6.5): the n/w back of the head is repainted from a near-black hair.2
// oval to hair.1 with a hair.2 rim on its right and lower edge and a hair.0 highlight on the upper-left of the cranium;
// the s/e bone mask's bottom corners are trimmed 1 px each side so the jaw narrows. The rest is the template:
// character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { pass: 'f1', notes: 'back of head in hair mid with highlight; mask jaw trimmed; template face (no face anchors: the mask is the face)' };

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


/** The head's box around the `head` anchor. */
const headBox = ctx => { const [hx, hy] = ctx.anchors.head; return [hx - 6, hy - 6, 13, 15]; };
const inBox = ([bx, by, bw, bh], x, y) => x >= bx && y >= by && x < bx + bw && y < by + bh;
const isHair = t => t && t.startsWith('hair.');

/** Back views: the dark hair oval becomes hair mid, with a dark rim right and below and a highlight upper-left. */
function backOfHead(g, ctx, px) {
  const box = headBox(ctx), cells = [];
  for (let y = box[1]; y < box[1] + box[3]; y++) for (let x = box[0]; x < box[0] + box[2]; x++)
    if (px.tokenAt(g, [x, y]) === 'hair.2') cells.push([x, y]);
  if (!cells.length) return;
  const dark = new Set(cells.map(([x, y]) => `${x},${y}`));
  const edge = (x, y) => !dark.has(`${x},${y}`) && px.tokenAt(g, [x, y]) !== 'leather.1'; // the strap is not an edge
  for (const [x, y] of cells) if (!(edge(x + 1, y) || edge(x, y + 1))) px.set(g, [x, y], 'hair.1');
  // highlight: the upper-left of the cranium, 2 px down the upper-left of the crown
  const top = Math.min(...cells.map(c => c[1]));
  const rowMin = y => Math.min(...cells.filter(c => c[1] === y).map(c => c[0]));
  if (cells.some(c => c[1] === top + 1)) px.set(g, [rowMin(top + 1) + 1, top + 1], 'hair.0');
  if (cells.some(c => c[1] === top)) px.set(g, [rowMin(top), top], 'hair.0');
}

/** Front views: trim the bone mask's lowest full-width jaw row by 1 px each side so the jaw narrows. */
function jawTrim(g, ctx, px) {
  const box = headBox(ctx), rows = [];
  for (let y = box[1]; y < box[1] + box[3]; y++) {
    const xs = [];
    for (let x = box[0]; x < box[0] + box[2]; x++) if (isHair(px.tokenAt(g, [x, y]))) xs.push(x);
    if (xs.length) rows.push({ y, l: Math.min(...xs), r: Math.max(...xs) });
  }
  if (rows.length < 4) return;
  const wide = Math.max(...rows.map(r => r.r - r.l + 1));
  const iw = rows.findIndex(r => r.r - r.l + 1 === wide);
  const jaw = rows.slice(iw + 1).filter(r => r.r - r.l + 1 >= wide - 2).pop();
  if (!jaw || jaw.r - jaw.l < 3) return;
  for (const [x, out] of [[jaw.l, -1], [jaw.r, 1]]) {
    // the old outline pixel goes when nothing is beyond it; the trimmed corner becomes the outline
    if (px.tokenAt(g, [x + out, jaw.y]) === 'outline' && !px.tokenAt(g, [x + 2 * out, jaw.y])) g.clear(x + out, jaw.y);
    px.set(g, [x, jaw.y], 'outline');
  }
}

export function finish(g, ctx) {
  const { px } = ctx.lib, a = ctx.anchors, mood = moodOf(ctx.state);
  px.fix.orphans(g);
  px.fix.jaggies(g);
  // px.light.rim(g, { ramps: ['cloth'] });
  // px.fx.glint(g, ctx.at('hand', 0, -4), 'glow.0');
  if (ctx.anchors.head) (ctx.facing === 'n' || ctx.facing === 'w' ? backOfHead : jawTrim)(g, ctx, px);

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
