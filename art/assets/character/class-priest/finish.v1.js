// class-priest finish.v1 (f, on base.v3) — the pixel pass the base.v4 review asked for, applied to the best base:
// the mitre's pale accent cross-band (which read as a bald peach head) is recoloured to cloth-light so the whole mitre
// reads as cloth, its base row becomes a 1px accent band (accent mid: characters have no gold ramp), and in s/e the
// 1px neck under the jaw is widened to a 3px skin-dark row. The template eyes are kept; the mouth moves 1px up
// off the neck row (the base's mouth anchor sits under the jaw).
// Template: character finish: clean-up first, then the face (R2: the one direct-pixel pass).
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

  // the mitre: every pale accent pixel above the head inside the mitre's columns becomes cloth-light
  const [hx, hy] = a.head;
  const cols = []; for (let x = hx - 5; x <= hx + 5; x++) cols.push(x);
  for (let y = 0; y < hy; y++) for (const x of cols) if (px.tokenAt(g, [x, y]) === 'accent.0') px.set(g, [x, y], 'cloth.0');
  // its base: the lowest row above the face that still holds cloth at the mitre's centre column gets an accent band
  const mx = a.mouth ? a.mouth[0] : hx;
  let yb = -1;
  for (let y = 0; y < hy; y++) if (String(px.tokenAt(g, [mx, y]) || '').startsWith('cloth')) yb = y; else if (yb >= 0 && px.tokenAt(g, [mx, y]) === 'outline') break;
  if (yb >= 0) for (let x = mx; x >= hx - 6 && String(px.tokenAt(g, [x, yb]) || '').startsWith('cloth'); x--) px.set(g, [x, yb], 'accent.1');
  if (yb >= 0) for (let x = mx + 1; x <= hx + 6 && String(px.tokenAt(g, [x, yb]) || '').startsWith('cloth'); x++) px.set(g, [x, yb], 'accent.1');
  // the neck (s/e only): the row above the collar line, under the jaw, 3 px of skin-dark
  if (a.eye && a.eye2) {
    const nx = Math.round((a.eye[0] + a.eye2[0]) / 2), ey = a.eye[1];
    for (let y = ey + 1; y < ey + 8; y++) {
      if (![nx - 3, nx, nx + 3].every(x => px.tokenAt(g, [x, y]) === 'outline')) continue;
      for (let x = nx - 1; x <= nx + 1; x++) px.set(g, [x, y - 1], 'skin.2');
      for (const x of [nx - 2, nx + 2]) if (!px.tokenAt(g, [x, y - 1])) px.set(g, [x, y - 1], 'outline');
      break;
    }
  }

  // face last
  const skinNear = ([x, y]) => [[x + 1, y], [x - 1, y], [x, y + 1]].map(p => px.tokenAt(g, p)).find(t => t && t !== 'outline') ?? 'skin.1';
  for (const name of ['eye', 'eye2']) {
    if (!a[name]) continue;
    const [x, y] = a[name];
    let eh = 0;
    while (eh < (g.h >= 32 ? 3 : 2) && px.tokenAt(g, [x, y + eh]) === 'outline') eh++;
    px.patch(g, ctx.at(name), eyeRows(mood, Math.max(1, eh)), { k: 'outline', s: skinNear([x, y]) }, { anchor: 'topleft' });
  }
  // the base's mouth anchor sits on the neck row (y+3 under a short jaw): the mouth goes 1px up, inside the jaw, and
  // calm frames own the anchor with plain skin so the fierce mouth is not replayed onto them
  const mouth = { calm: ['s'], fierce: ['k'], hurt: ['k'], happy: ['kk'] }[mood];
  if (a.mouth && px.tokenAt(g, [a.mouth[0], a.mouth[1] - 1]) && px.tokenAt(g, [a.mouth[0], a.mouth[1] - 1]) !== 'outline')
    px.patch(g, ctx.at('mouth', 0, -1), mouth, { k: 'outline', s: px.tokenAt(g, [a.mouth[0], a.mouth[1] - 1]) }, { anchor: 'topleft' });
  return g;
}
