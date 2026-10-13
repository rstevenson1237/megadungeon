// family-o-cap finish.v1 on base.v2 — the review's face point, in pixels (checked against base.v2's render): v2 has
// no visor bar, its dome head is already rounded and its eyes already sit dark under the brow ridge, but its two
// pale-blue (cloth) tusk blocks at the jaw corners still read as cold eye squares. Each tusk block is repainted in
// skin (lit / shaded side), and its inner column's top pixel and the one above it become a skin-light tusk beside the mouth line.
// finish.v1 (f) on base.v2 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v2';
export const meta = { notes: 'ogre face: cloth tusk blocks repainted as skin with 2 px skin-light tusks; template face' };

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

  if (a.eye && a.eye2) tusks(g, ctx, px);
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

/** The cloth-ramp tusk blocks below the eyes become skin; each keeps a 1 px wide, 2 px tall skin-light tusk. */
function tusks(g, ctx, px) {
  const [ex1, ey] = ctx.anchors.eye, [ex2] = ctx.anchors.eye2, mid = (ex1 + ex2) / 2;
  const x0 = Math.min(ex1, ex2) - 5, x1 = Math.max(ex1, ex2) + 5, seen = new Set(), comps = [];
  const isTusk = (x, y) => (px.tokenAt(g, [x, y]) ?? '').startsWith('cloth');
  for (let y = ey; y <= ey + 6; y++) for (let x = x0; x <= x1; x++) {
    if (seen.has(x + ',' + y) || !isTusk(x, y)) continue;
    const comp = [], stack = [[x, y]]; seen.add(x + ',' + y);
    while (stack.length) {
      const [cx, cy] = stack.pop(); comp.push([cx, cy]);
      for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]])
        if (nx >= x0 && nx <= x1 && ny >= ey && ny <= ey + 6 && !seen.has(nx + ',' + ny) && isTusk(nx, ny)) { seen.add(nx + ',' + ny); stack.push([nx, ny]); }
    }
    comps.push(comp);
  }
  for (const comp of comps) {
    const cxm = comp.reduce((s, p) => s + p[0], 0) / comp.length, left = cxm < mid;
    for (const p of comp) px.set(g, p, left ? 'skin.1' : 'skin.2');
    const inner = left ? Math.max(...comp.map(p => p[0])) : Math.min(...comp.map(p => p[0]));
    const top = Math.min(...comp.filter(p => p[0] === inner).map(p => p[1]));
    for (const y of [top - 1, top]) px.set(g, [inner, y], 'skin.0'); // juts up past the lip
  }
}
