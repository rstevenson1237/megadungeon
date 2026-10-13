// finish.v1 (f) on base.v4 — review: the face is a flat brown block with no features. This pass repaints the face in
// s/e: the three skin rows under the hood edge go to mid skin with light skin on the lit side, two dark eye pixels on the
// middle row (inside the face, where the eye anchors' low row was lost in the beard line), and a 1px light-skin cheek
// under the lit eye. It replaces the template's anchor eyes for this asset; the mouth stays. Character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v4';
export const meta = { pass: 'f1', notes: 'face repainted: mid/light skin, two dark eyes on the middle face row, a lit cheek' };

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

  // face last
  const isSkin = t => !!t && t.startsWith('skin');
  if (a.eye && a.eye2) {
    const cx = Math.round((a.eye[0] + a.eye2[0]) / 2);
    let top = Math.max(a.eye[1], a.eye2[1]);
    while (top > 0 && !isSkin(px.tokenAt(g, [cx, top]))) top--;              // anchor row may hold an outline
    while (top > 0 && isSkin(px.tokenAt(g, [cx, top - 1]))) top--;
    const span = y => { let l = cx, r = cx; while (isSkin(px.tokenAt(g, [l - 1, y]))) l--; while (isSkin(px.tokenAt(g, [r + 1, y]))) r++; return isSkin(px.tokenAt(g, [cx, y])) ? [l, r] : null; };
    const mid = span(top + 1);
    if (mid) {
      const [l, r] = mid;
      let lsum = 0; for (let y = top; y <= top + 2; y++) { const sp = span(y); if (sp) for (let x = sp[0]; x <= sp[1]; x++) { const t = px.tokenAt(g, [x, y]); lsum += (t === 'skin.0' ? 1 : t === 'skin.2' ? -1 : 0) * Math.sign(x - cx); } }
      const litLeft = lsum <= 0;
      const eyes = [Math.max(l + 1, Math.min(a.eye[0], a.eye2[0])), Math.min(r - 1, Math.max(a.eye[0], a.eye2[0]))];
      const litEye = litLeft ? eyes[0] : eyes[1];
      for (let y = top; y <= top + 2; y++) {
        const sp = span(y); if (!sp) continue;
        for (let x = sp[0]; x <= sp[1]; x++) px.set(g, [x, y], 'skin.1');
        const edge = litLeft ? sp[0] : sp[1], dark = litLeft ? sp[1] : sp[0];
        if (y < top + 2) px.set(g, [edge, y], 'skin.0');
        if (y === top + 2 && dark !== edge) px.set(g, [dark, y], 'skin.2');
      }
      if (isSkin(px.tokenAt(g, [litEye, top + 2]))) px.set(g, [litEye, top + 2], 'skin.0');     // lit cheek
      for (const x of eyes) {
        px.set(g, [x, top + 1], 'outline');
        if (mood === 'fierce') px.set(g, [x, top], 'skin.2');                                   // brow down
        if (mood === 'hurt') px.set(g, [x + (x === eyes[0] ? 1 : -1), top + 1], 'skin.2');      // squint
      }
      ctx.protect([eyes[0], top + 1], [eyes[1], top + 1]);
    }
  }
  const mouth = MOUTH[mood];
  if (mouth && a.mouth && px.tokenAt(g, a.mouth) && px.tokenAt(g, a.mouth) !== 'outline')
    px.patch(g, ctx.at('mouth'), mouth, { k: 'outline' }, { anchor: 'topleft' });
  return g;
}
