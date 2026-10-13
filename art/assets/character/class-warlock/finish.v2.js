// class-warlock finish.v2 (f) on base.v5 — re-finish of the best base (R12). The review's head point, in pixels: the
// face inside the hood (4 px wide, mostly the skin ramp's dark step, so it read as a dark knot under the horns) is
// repainted from the skin ramp's light and mid steps, lit from the upper left as the rest of the sprite: a light
// forehead, two clear 1 px eyes (outline) with light skin beside and between them, mid-tone cheeks with the dark step only on
// the far cheek's lower edge, and the jaw narrowed — the jaw row closes to the 2 px chin below it, so the head reads
// as an egg pointing down. The mood changes the brow: fierce (attacks, casts) and hurt darken the pixel over each eye,
// hurt also opens the mouth a pixel. The straight robe is a form change a finish
// cannot make; it is left. Clean-up ops first, the face last. Colours are direction tokens (R11).
export const base = 'base.v5';
export const meta = { notes: 'warlock: face relit from skin light/mid, two clear eyes, narrowed 2 px chin; mood brows' };

const MOODS = [[/hurt|hit|die|dead|stun|dizzy|fall|knock/, 'hurt'], [/attack|cast|punch|kick|slash|shoot|throw|special|charge/, 'fierce'], [/win|victory|cheer|taunt|happy/, 'happy']];
const moodOf = state => MOODS.find(([re]) => re.test(state))?.[1] ?? 'calm';

// The face in the front view: its 4 columns start at the left eye anchor (the face's left column), rows from two
// above the eye row. The eyes sit in columns 1 and 3 (a light near cheek beside the near eye, the far eye at the edge).
// a/b/c = skin light/mid/dark, k = outline (eyes, jaw corners), . = untouched.
const FACE = {
  calm: [
    'aaab',
    'aabb',
    'akak',
    'abbc',
    'kbbk',
  ],
  fierce: [
    'aaab',
    'acbc',
    'akak',
    'abbc',
    'kbbk',
  ],
  hurt: [
    'aaab',
    'acbc',
    'akak',
    'abkc',
    'kbbk',
  ],
};
const TOK = { a: 'skin.0', b: 'skin.1', c: 'skin.2', k: 'outline' };

/** Paint the face at the eye anchors; mirrored when the left eye anchor is `eye2` (the e facing). */
function face(g, ctx, px, mood) {
  const { eye, eye2 } = ctx.anchors;
  if (!eye || !eye2) return;
  const flip = eye[0] > eye2[0], lx = Math.min(eye[0], eye2[0]), top = eye[1] - 2;
  const rows = FACE[mood] ?? FACE.calm;
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.') return;
    const x = flip ? lx + 3 - c : lx + c, y = top + r, t = px.tokenAt(g, [x, y]);
    if (!t || !(t === 'outline' || t.startsWith('skin.'))) return; // only the face itself
    px.set(g, [x, y], TOK[ch]);
  }));
  // keep the single eye pixels safe
  ctx.protect?.([flip ? lx + 2 : lx + 1, eye[1]], [flip ? lx : lx + 3, eye[1]]);
}

export function finish(g, ctx) {
  const { px } = ctx.lib, mood = moodOf(ctx.state);
  px.fix.orphans(g);
  px.fix.jaggies(g);
  face(g, ctx, px, mood);
  return g;
}
