// family-z finish.v2 (f) on base.v4 (6, now the best base; finish.v1 finished base.v3) — the review's head fix, done
// at final resolution: the small pointed head nub with its smeared face is repainted as a round egg cranium 2 px wider,
// raised 1 px so it sits above the shoulder line, with two dark 1 px sockets and a narrower jaw that hangs toward the
// lolled side (front views); the back views get the same round skull with a thin nape fringe. The patch is found from
// the head's own top pixel each frame, so it follows the hunch, the lunge and the loll. The template's face pass is
// dropped: its eye/mouth anchors land on the shoulders and chest of this hunched body (the cause of the smear).
// Template: character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { notes: 'head repainted as a round egg cranium 2 px wider above the shoulder line, two dark sockets, narrower jaw; template face pass dropped (anchors off the head)' };

// 0/1/2 skin steps, h hair (mid), k outline, . untouched (old head pixels there are cleared). Drawn for the s/w
// facings (crown leaning to the viewer's left, lit upper left); e/n are the mirror images.
const FRONT = ['..kkkk..', '.k0001k.', 'k000112k', 'k0k1k12k', 'k011122k', '..k112k.', '...k2k..'];
const BACK = ['..kkkk..', '.k0001k.', 'k000112k', 'k001122k', 'k011122k', '.kh112k.', '..khhk..'];
const TOK = { 0: 'skin.0', 1: 'skin.1', 2: 'skin.2', h: 'hair.1', k: 'outline' };
function repaintHead(g, ctx, px) {
  const hx = ctx.anchors.head?.[0] ?? g.w / 2, hy = ctx.anchors.head?.[1] ?? 15;
  let tx = -1, ty = -1;
  for (let y = 0; y <= hy && ty < 0; y++) for (let x = Math.max(0, hx - 6); x <= Math.min(g.w - 1, hx + 6); x++) if (px.tokenAt(g, [x, y])) { tx = x; ty = y; break; }
  if (ty < 0) return;
  let minx = g.w, maxx = -1;
  for (let y = ty; y < ty + 4; y++) for (let x = tx - 4; x <= tx + 4; x++) if (px.tokenAt(g, [x, y])) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); }
  const left = Math.round(minx + (maxx - minx + 1 - 8) / 2), top = ty - 1;
  const mirror = ctx.facing === 'e' || ctx.facing === 'n';
  const rows = (ctx.facing === 's' || ctx.facing === 'e' ? FRONT : BACK).map(r => mirror ? [...r].reverse().join('') : r);
  rows.forEach((row, j) => [...row].forEach((c, i) => {
    const x = left + i, y = top + j;
    if (c !== '.') { px.set(g, [x, y], TOK[c]); return; }
    if (!px.tokenAt(g, [x, y])) return;
    if (j < rows.length - 1) g.clear(x, y);          // old head pixels outside the new cranium
    else px.set(g, [x, y], 'outline');               // the neck row: keep the silhouette closed
  }));
}

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

  repaintHead(g, ctx, px); // head last (replaces the template face)
  return g;
}
