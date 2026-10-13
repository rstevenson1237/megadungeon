// family-o-cap finish.v2 on base.v4 — re-finishes the best base (R12) with the pixel part of base.v4's review: the head
// read as a tiny featureless knob and the lit belly sphere dominated. Painted per row from the eye anchors, so it
// follows the head through bob and facing: the crown raised 1 px, a 2-row lit brow ridge bulging 1 px past the skull
// with the skin ramp's darkest step as the socket shadow under it (pale hair.0 eye glints, red when attacking), a
// jaw widened 1 px each side, ivory (hair.0) tusks jutting up past the mouth line, a lit underbite lip; the belly's
// big skin.0 sphere is cut back to a 1 px lit rim. The template's generic eye/mouth patch is replaced by this face.
// finish.v2 (f) on base.v4 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { notes: 'ogre face: raised crown, heavy brow ridge over darkest-skin sockets, widened jaw, ivory tusks, underbite; belly highlight cut to a rim' };

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

  if (a.eye && a.eye2) { belly(g, a, px); face(g, ctx, px, mood); }
  return g;
}


/** The interior span of the head on row y: scan out from the centre column to the outline on each side. */
function span(g, px, mid, y) {
  const t = x => px.tokenAt(g, [x, y]);
  if (!t(mid) || t(mid) === 'outline') return null;
  let l = mid, r = mid;
  while (t(l - 1) && t(l - 1) !== 'outline') l--;
  while (t(r + 1) && t(r + 1) !== 'outline') r++;
  return [l, r];
}

function face(g, ctx, px, mood) {
  const [e1x, ey] = ctx.anchors.eye, [e2x] = ctx.anchors.eye2;
  const L = Math.min(e1x, e2x), R = Math.max(e1x, e2x), mid = Math.round((L + R) / 2);
  const tok = p => px.tokenAt(g, p);
  // raise the crown 1 px: the top outline row moves up, the old one becomes lit skin
  let top = ey - 2; while (tok([mid, top - 1]) && tok([mid, top - 1]) !== 'outline') top--;
  const crown = top - 1; // the outline row
  const cs = []; for (let x = mid - 6; x <= mid + 6; x++) if (tok([x, crown]) === 'outline' && !tok([x, crown - 1])) cs.push(x);
  if (cs.length >= 4) { // rounded: the new top row is 2 px narrower, the old row keeps outline at its ends
    const c0 = Math.min(...cs), c1 = Math.max(...cs);
    for (let x = c0 + 1; x < c1; x++) { px.set(g, [x, crown - 1], 'outline'); px.set(g, [x, crown], 'skin.0'); }
  }
  // rows of the face, from the brow ridge to the chin
  const rows = {};
  for (let y = ey - 2; y <= ey + 6; y++) rows[y] = span(g, px, mid, y);
  rows[ey] = rows[ey + 1]; // the base's own eye pixels are outline: the eye row takes the cheek row's span
  const paint = (y, fn) => { const s = rows[y]; if (!s) return; for (let x = s[0]; x <= s[1]; x++) { const t = fn(x, s); if (t) px.set(g, [x, y], t); } };
  const bulge = (y, inner) => { const s = rows[y]; if (!s) return; // push the edge out 1 px each side
    for (const [o, d] of [[s[0] - 1, -1], [s[1] + 1, 1]]) if (tok([o, y]) === 'outline') { px.set(g, [o, y], inner); px.set(g, [o + d, y], 'outline'); } };
  // the brow ridge: two lit rows, its shaded end a mid step, bulging past the skull
  paint(ey - 2, (x, s) => x === s[1] ? 'skin.1' : 'skin.0');
  paint(ey - 1, (x, s) => x >= s[1] - 1 ? 'skin.1' : 'skin.0');
  bulge(ey - 1, 'skin.1');
  // the socket shadow: the skin ramp's darkest step, eye glints in it
  paint(ey, () => 'skin.2');
  const eyeT = mood === 'fierce' ? 'accent.1' : mood === 'hurt' ? 'outline' : 'hair.0';
  for (const x of [L, R]) px.set(g, [x, ey], eyeT);
  ctx.protect([L, ey], [R, ey]);
  // cheeks and the nose: a lit bridge, a dark nostril line under it
  paint(ey + 1, x => x === mid || x === mid - 1 ? 'skin.0' : 'skin.1');
  paint(ey + 2, (x, s) => x === mid || x === mid - 1 ? 'skin.2' : x >= s[1] - 1 ? 'skin.2' : 'skin.1');
  // the mouth and the underbite: tusks rise from the jutting lower jaw past the mouth line
  const tl = L - 1, tr = R + 1, open = mood === 'fierce';
  paint(ey + 3, x => x > tl && x < tr ? 'outline' : 'skin.2');
  paint(ey + 4, (x, s) => x > tl && x < tr ? (open ? 'outline' : 'skin.0') : x >= s[1] - 1 ? 'skin.2' : 'skin.1');
  paint(ey + 5, (x, s) => x > tl && x < tr && open ? 'skin.0' : x >= s[1] - 1 ? 'skin.2' : 'skin.1');
  paint(ey + 6, () => 'skin.2');
  for (const y of [ey + 3, ey + 4, ey + 5, ey + 6]) bulge(y, 'skin.2');
  for (const x of [tl, tr]) for (const y of [ey + 2, ey + 3, ey + 4]) px.set(g, [x, y], 'hair.0');
  if (mood === 'fierce') for (const x of [tl, tr]) px.set(g, [x, ey + 1], 'hair.0');
}

/** The belly's big skin.0 sphere becomes a 1 px lit rim along its upper-left outline; the rest drops to skin.1. */
function belly(g, a, px) {
  const [e1x, ey] = a.eye, [e2x] = a.eye2, mid = Math.round((e1x + e2x) / 2);
  const tk = (x, y) => px.tokenAt(g, [x, y]);
  const flipped = e1x > e2x; // e facing: the light side is mirrored with the body
  const ch = [];
  for (let y = ey + 14; y <= ey + 28; y++) for (let x = mid - 10; x <= mid + 10; x++) {
    if (tk(x, y) !== 'skin.0') continue;
    const sx = flipped ? 1 : -1;
    const rim = tk(x, y - 1) === 'outline' || tk(x + sx, y) === 'outline' || tk(x + sx, y - 1) === 'outline';
    if (!rim) ch.push([x, y]);
  }
  for (const [x, y] of ch) px.set(g, [x, y], 'skin.1');
}
