// finish.v1 (f) on base.v4 — character finish (R2: the one direct-pixel pass). Review of base.v4 (6.5): the stray pale
// pixels on the apron front (accent.0 vial specks, s/e facings, every state) read as holes. This pass repaints them in
// the leather around them and runs a single 1px leather.0 edge down the lit apron border (left in s, right in e, where
// the base already lights it). Then the template face.
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { pass: 'f', notes: 'apron specks removed, lit apron edge in leather.0, per-state face' };

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
  if ((ctx.facing === 's' || ctx.facing === 'e') && a.head && a.ground) apron(g, px, a.head[1] + 7, a.ground[1] - 7, ctx.facing === 's' ? 1 : -1);
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
/** Apron rows y0..y1: pale accent.0 specks with leather around them become leather; then the lit border goes leather.0. */
function apron(g, px, y0, y1, dir) {
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const writes = [];
  for (let y = y0; y <= y1; y++) for (let x = 0; x < g.w; x++) {
    if (px.tokenAt(g, [x, y]) !== 'accent.0') continue;
    const n = N4.map(([dx, dy]) => px.tokenAt(g, [x + dx, y + dy]));
    if (n.some(t => t === 'accent.1' || t === 'accent.2') || !n.some(t => ramp(t) === 'leather')) continue;
    const lea = n.filter(t => ramp(t) === 'leather' && t !== 'leather.0');
    writes.push([x, y, lea.includes('leather.2') && !lea.includes('leather.1') ? 'leather.2' : 'leather.1']);
  }
  for (const [x, y, t] of writes) px.set(g, [x, y], t);
  for (let y = y0; y <= y1; y++) {
    const xs = dir > 0 ? [...Array(g.w).keys()] : [...Array(g.w).keys()].reverse();
    for (const x of xs) {
      if (ramp(px.tokenAt(g, [x, y])) !== 'leather' || px.tokenAt(g, [x - dir, y]) !== 'outline') continue;
      let run = 0;
      while (ramp(px.tokenAt(g, [x + dir * run, y])) === 'leather') run++;
      if (run >= 4) { px.set(g, [x, y], 'leather.0'); if (px.tokenAt(g, [x + dir, y]) === 'leather.0') px.set(g, [x + dir, y], 'leather.1'); break; }
    }
  }
}
