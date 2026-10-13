// npc-rival finish.v1 on base.v3 — the review's torso point, in pixels: the flat grey chest disc becomes a shaded
// cuirass (metal ramp lit at the top left, mid across the chest, dark at the lower right, a bright run along its
// upper-left curve), and from the front a dark half-cape in the leather ramp falls over the left shoulder (the
// viewer's right in s, mirrored in e). The back view already shows the cape; there only the plate is reshaded.
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

  cuirass(g, ctx, px);
  if (ctx.facing === 's' || ctx.facing === 'e') halfCape(g, ctx, px);

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

// Reshade the breastplate: its metal pixels in the torso, by distance from a light point at its top left.
function cuirass(g, ctx, px) {
  const [hx, hy] = ctx.anchors.head, flip = ctx.facing === 'e' || ctx.facing === 'n';
  const pts = [];
  for (let y = hy + 5; y <= hy + 14; y++) for (let x = hx - 5; x <= hx + 4; x++) if (/^metal/.test(px.tokenAt(g, [x, y]) ?? '')) pts.push([x, y]);
  if (!pts.length) return;
  const x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0])), y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]));
  const W = x1 - x0 + 1, H = y1 - y0 + 1, lx = flip ? x1 - W * 0.3 : x0 + W * 0.3, ly = y0 + H * 0.25;
  const has = (x, y) => /^metal/.test(px.tokenAt(g, [x, y]) ?? '');
  for (const [x, y] of pts) {
    const d = Math.hypot((x - lx) / W, (y - ly) / H);
    px.set(g, [x, y], d < 0.22 ? 'metal.0' : d < 0.6 ? 'metal.1' : 'metal.2');
  }
  // the bright run along the plate's upper curve on the lit side, and a dark rim along the lower edge
  for (const [x, y] of pts) {
    const litSide = flip ? x >= x1 - W / 2 : x <= x0 + W / 2;
    if (litSide && !has(x, y - 1) && Math.hypot((x - lx) / W, (y - ly) / H) < 0.5) px.set(g, [x, y], 'metal.0');
    if (!has(x, y + 1)) px.set(g, [x, y], 'metal.2');
  }
}
// A dark half-cape over the left shoulder (screen right in s), drawn for s and mirrored for e.
const CAPE = [
  '.kkkk...',
  'kLlllk..',
  'kllllDk.',
  '.kllDDDk',
  '.kllDDDk',
  '..klDDDk',
  '..klDDDk',
  '..klDDk.',
  '...kDDk.',
  '....kk..',
];
function halfCape(g, ctx, px) {
  const [hx, hy] = ctx.anchors.head, flip = ctx.facing === 'e';
  const rows = flip ? CAPE.map(r => [...r].reverse().join('')) : CAPE;
  const x = flip ? hx - 7 : hx + 2;
  px.patch(g, [x, hy + 4], rows, { k: 'outline', L: 'leather.0', l: 'leather.1', D: 'leather.2' }, { anchor: 'topleft' });
}
