// family-n finish.v2 (f) on base.v4 — re-finish of the best base (R12). Review of base.v4 (6.5): the ribcage is a
// stack of flat horizontal bars, so the torso reads robotic. This pass repaints the ribcage below the collar bar (found
// per frame: the rows of long bone runs under the skull): the bars go to ink, a 1 px lit sternum runs down the middle,
// and three ribs a side arc out from it, bowing down 2 px toward their ends, each shorter than the one above so the cage
// narrows to the spine; the lit side's ribs are bone-light, the far side's bone-mid, with ink gaps between. Only pixels
// already inside the figure are painted, so the silhouette is unchanged. Base v4's tail is a tube: no tail join needed.
// Template: character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { pass: 'f', notes: 'ribcage repainted as curved ribs bowing down from a lit sternum, narrowing to the spine' };

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
  if (a.head) ribcage(g, px, a.head);
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

const isBone = t => !!t && t.startsWith('cloth.');
/** Longest run of bone in row y between x0 and x1: [start, end] or null. */
function longRun(g, px, y, x0, x1) {
  let best = null, s = -1;
  for (let x = x0; x <= x1 + 1; x++) {
    const b = x <= x1 && isBone(px.tokenAt(g, [x, y]));
    if (b && s < 0) s = x;
    if (!b && s >= 0) { if (!best || x - 1 - s > best[1] - best[0]) best = [s, x - 1]; s = -1; }
  }
  return best;
}
function ribcage(g, px, [hx, hy]) {
  const MIN = 7, rows = [];
  for (let y = hy + 5; y < Math.min(g.h, hy + 34); y++) { // below the skull (the head anchor is its centre)
    const r = longRun(g, px, y, Math.max(0, hx - 16), Math.min(g.w - 1, hx + 16));
    rows.push([y, r && r[1] - r[0] + 1 >= MIN ? r : null]);
  }
  // gather rib rows until a gap of 3
  let i = 0;
  const ribs = []; let gap = 0;
  for (; i < rows.length; i++) {
    if (ribs.length && rows[i][0] > ribs[0][0] + 9) break; // the cage is ~10 rows: a lunging spine's slant is not a rib
    if (rows[i][1]) { ribs.push(rows[i]); gap = 0; } else if (ribs.length && ++gap >= 3) break;
  }
  if (ribs.length < 4) return;
  const ry0 = ribs[0][0], ry1 = ribs[ribs.length - 1][0], below = ribs.slice(1);
  const xmin = Math.min(...below.map(r => r[1][0])), xmax = Math.max(...below.map(r => r[1][1]));
  const cx = Math.round(below.reduce((s, r) => s + (r[1][0] + r[1][1]) / 2, 0) / below.length);
  const inside = (x, y) => !!px.tokenAt(g, [x, y]);
  // the cavity: the bars below the collar go to ink
  for (let y = ry0 + 1; y <= ry1; y++) for (let x = xmin; x <= xmax; x++) if (isBone(px.tokenAt(g, [x, y]))) px.set(g, [x, y], 'outline');
  // the sternum
  for (let y = ry0 + 1; y <= ry1 - 2; y++) if (inside(cx, y)) px.set(g, [cx, y], 'cloth.0');
  // three ribs a side, bowing down from the sternum, shorter going down
  for (let k = 0; k < 3; k++) {
    const y0 = ry0 + 2 + k * 3;
    for (const sd of [-1, 1]) for (let dx = 1, L = Math.max(2, Math.round((sd < 0 ? cx - xmin : xmax - cx) * (1 - k * 0.18))); dx <= L; dx++) {
      const x = cx + sd * dx, y = y0 + Math.round(2 * (dx / L) ** 2);
      if (!inside(x, y)) continue;
      px.set(g, [x, y], dx === L ? 'cloth.2' : sd < 0 ? 'cloth.0' : 'cloth.1');
    }
  }
}
