// family-y-cap finish.v1 (f) on base.v3 — the review's pixel fix for the paws: the pale-blue claw bands (cloth) that
// read as cuffs/bracers across the forearms are repainted in the fur next to them, and each paw end gets 3 separate
// 1 px bone-pale claw tips (skin light) with one dark pixel between each: pointing down at the paw's bottom in idle
// and walk, pointing out at the paw's outer edge in the attack. The base has no face anchors, so the template face
// pass is a no-op (the base draws the eyes and nose).
// Template: character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'pale-blue claw bands repainted as fur; 3 separate bone-pale claw tips at each paw end' };

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

/** Cloth clusters (the base's claw bands), 8-connected. */
function clusters(g, px) {
  const seen = new Set(), out = [], isC = (x, y) => (px.tokenAt(g, [x, y]) ?? '').startsWith('cloth.');
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (seen.has(x + ',' + y) || !isC(x, y)) continue;
    const c = [], q = [[x, y]]; seen.add(x + ',' + y);
    while (q.length) {
      const [a, b] = q.pop(); c.push([a, b]);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const k = (a + dx) + ',' + (b + dy);
        if (!seen.has(k) && isC(a + dx, b + dy)) { seen.add(k); q.push([a + dx, b + dy]); }
      }
    }
    out.push(c);
  }
  return out;
}
/** Bands to fur, then 3 bone-pale tips with a dark pixel between each at the paw end. */
function clawTips(g, px, attack) {
  const fur = ([x, y]) => {
    const n = {};
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 0], [-2, 0]]) {
      const t = px.tokenAt(g, [x + dx, y + dy]);
      if (t && t.startsWith('leather.')) n[t] = (n[t] ?? 0) + 1;
    }
    return Object.entries(n).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'leather.1';
  };
  for (const c of clusters(g, px)) {
    const fills = c.map(p => [p, fur(p)]);
    for (const [p, t] of fills) px.set(g, p, t);
    const xs = c.map(p => p[0]), ys = c.map(p => p[1]);
    const mx = Math.round(xs.reduce((a, b) => a + b, 0) / c.length), my = Math.round(ys.reduce((a, b) => a + b, 0) / c.length);
    if (attack) {
      const x = mx < g.w / 2 ? Math.min(...xs) : Math.max(...xs);
      [-2, -1, 0, 1, 2].forEach(d => px.set(g, [x, my + d], d % 2 ? 'outline' : 'skin.0'));
    } else {
      const y = Math.max(...ys) + 1; // just below the paw's end, so the tips hang off it
      [-2, -1, 0, 1, 2].forEach(d => px.set(g, [mx + d, y], d % 2 ? 'outline' : 'skin.0'));
    }
  }
}

export function finish(g, ctx) {
  const { px } = ctx.lib, a = ctx.anchors, mood = moodOf(ctx.state);
  px.fix.orphans(g);
  px.fix.jaggies(g);
  clawTips(g, px, ctx.state === 'attack');
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
