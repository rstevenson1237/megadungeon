// npc-trader finish.v1 on base.v3 — the review's s/e point, in pixels: the pack's red and blue bundles no longer poke
// above the hat like ears (from the front they are moved 3 px down, showing only where nothing of the hat or head is),
// and the pack reads as worn: two dark leather shoulder straps down the chest and a brown pack edge above each
// shoulder. Back views are untouched.
// finish.v1 (f) on base.v3 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v3';
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

export function finish(g, ctx) {
  const { px } = ctx.lib, a = ctx.anchors, mood = moodOf(ctx.state);
  px.fix.orphans(g);
  px.fix.jaggies(g);
  // px.light.rim(g, { ramps: ['cloth'] });
  // px.fx.glint(g, ctx.at('hand', 0, -4), 'glow.0');

  if (ctx.facing === 's' || ctx.facing === 'e') packFront(g, ctx, px);

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

// From the front: lower the bundles behind the hat, then straps and pack edges at the shoulders.
function packFront(g, ctx, px) {
  const [hx, hy] = ctx.anchors.head, top = hy - 3, isTok = (x, y, re) => re.test(px.tokenAt(g, [x, y]) ?? '');
  const near = (x, y, re) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isTok(x + dx, y + dy, re));
  // the bundles: cloth/accent pixels above the hat and the outline around them (not the hat's or the stick's)
  const moved = [];
  for (let y = 0; y <= top; y++) for (let x = hx - 9; x <= hx + 9; x++) {
    const t = px.tokenAt(g, [x, y]);
    if (!t) continue;
    if (/^(cloth|accent)/.test(t) || (t === 'outline' && !near(x, y, /^(hair|leather)/))) moved.push([x, y, t]);
  }
  for (const [x, y] of moved) g.clear(x, y);
  for (const [x, y, t] of moved) if (!px.tokenAt(g, [x, y + 3])) px.set(g, [x, y + 3], t);
  // the pack's edge above each shoulder, beside the neck
  const sh = hy + 6, waist = hy + 14;
  for (const side of [-1, 1]) {
    for (const dx of [4, 5, 6]) {
      const x = hx + side * dx;
      px.set(g, [x, sh - 3], 'outline');
      px.set(g, [x, sh - 2], side < 0 ? 'leather.0' : 'leather.1');
      px.set(g, [x, sh - 1], 'leather.1');
    }
    px.set(g, [hx + side * 7, sh - 2], 'outline');
    px.set(g, [hx + side * 7, sh - 1], 'outline');
    // a shoulder strap from the shoulder down to the belt
    px.line(g, [hx + side * 4, sh], [hx + side * 3, waist - 1], 'leather.2');
  }
}
