// family-d-cap finish.v1 (f) on base.v3 — the review's pixel fix for the faceted torso (s/e frames): (1) the chest and
// the flank are merged into one mid-tone band — the straight ink seam between the neck's chest plane and the barrel
// (a vertical run of outline between scale pixels) and the chest's own dark strip beside it become scale mid; (2) the
// straight vertical terminator between the mid band and the dark underside is stepped into a 1 px curve that bulges
// 2 px into the dark side at mid-height, so the flank reads round, not boxy. The base draws the eye and has no face
// anchors, so the template face pass is a no-op. The silhouette and leg form are a base matter (not touched here).
// Template: character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 's/e torso: chest/flank seam merged into one mid band, terminator stepped into a 1 px curve' };

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

const MID = 'accent.1', DARK = 'accent.2';
const isScale = t => !!t && t.startsWith('accent.');
/** The torso rows: from 22 to 13 rows above the lowest pixel (above the legs) at the large frame. */
function roundTorso(g, px) {
  let bottom = -1;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (px.tokenAt(g, [x, y])) bottom = y;
  if (bottom < 0) return;
  const y0 = bottom - 22, y1 = bottom - 13, T = (x, y) => px.tokenAt(g, [x, y]);
  // (1) the chest/flank seam: outline pixels with scale on both sides, in a vertical run of >= 4
  const seam = (x, y) => T(x, y) === 'outline' && isScale(T(x - 1, y)) && isScale(T(x + 1, y));
  const pts = [];
  for (let y = y0; y <= y1; y++) for (let x = 1; x < g.w - 1; x++) if (seam(x, y)) pts.push([x, y]);
  const done = new Set();
  for (const p of pts) {
    if (done.has(p)) continue;
    const run = [p]; done.add(p);
    for (;;) { // follow the seam down, one row at a time, drifting at most 1 px
      const [lx, ly] = run[run.length - 1], nx = pts.find(q => !done.has(q) && q[1] === ly + 1 && Math.abs(q[0] - lx) <= 1);
      if (!nx) break;
      run.push(nx); done.add(nx);
    }
    if (run.length < 4) continue;
    for (const [x, y] of run) {
      px.set(g, [x, y], MID);
      for (const dx of [-1, 1]) for (let i = 1; i <= 4 && T(x + dx * i, y) === DARK; i++) px.set(g, [x + dx * i, y], MID);
    }
  }
  // a dark pixel left alone inside the merged band joins it
  for (let y = y0; y <= y1; y++) for (let x = 1; x < g.w - 1; x++) if (T(x, y) === DARK && T(x - 1, y) === MID && T(x + 1, y) === MID) px.set(g, [x, y], MID);
  // (2) the mid/dark terminator: per row, transitions with >= 3 mid on one side and >= 3 dark on the other
  const marks = [];
  for (let y = y0; y <= y1; y++) for (let x = 3; x < g.w - 3; x++) {
    const a = T(x - 1, y), b = T(x, y);
    if (a === MID && b === DARK && T(x - 3, y) === MID && T(x + 2, y) === DARK) marks.push({ x, y, dir: 1 });
    if (a === DARK && b === MID && T(x - 3, y) === DARK && T(x + 2, y) === MID) marks.push({ x: x - 1, y, dir: -1 });
  }
  const used = new Set();
  for (const m of marks) {
    if (used.has(m)) continue;
    const grp = [m]; used.add(m);
    for (let y = m.y + 1; ; y++) {
      const prev = grp[grp.length - 1], nx = marks.find(o => !used.has(o) && o.y === y && o.dir === m.dir && Math.abs(o.x - prev.x) <= 1);
      if (!nx) break;
      grp.push(nx); used.add(nx);
    }
    if (grp.length < 5) continue;
    grp.forEach((o, i) => {
      const k = Math.round(2 * Math.sin(Math.PI * (i + 0.5) / grp.length));
      for (let j = 0; j < k; j++) if (T(o.x + o.dir * j, o.y) === DARK) px.set(g, [o.x + o.dir * j, o.y], MID);
    });
  }
}

export function finish(g, ctx) {
  const { px } = ctx.lib, a = ctx.anchors, mood = moodOf(ctx.state);
  px.fix.orphans(g);
  px.fix.jaggies(g);
  if (ctx.facing === 's' || ctx.facing === 'e') roundTorso(g, px);
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
