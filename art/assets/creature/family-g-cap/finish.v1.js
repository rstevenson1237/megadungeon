// family-g-cap finish.v1 on base.v3 — the review's head point, in pixels: the pale cloth brow band (read as a
// blindfold or visor) is darkened to leather dark (its top row leather mid, a lit edge so it reads as a worn band) in every facing, and in the front views the round olive beard ball
// over the mouth (read as a gag) is redrawn as a downward wedge from the jaw onto the chest: as wide as the jaw at the
// top, narrowing to a point, inked on its sides, hair mid with a hair-light lit edge and strand (two tones). The
// ball's pixels outside the wedge take the face or tunic colour beside them.
// finish.v1 (f) on base.v3 — character finish: clean-up first, then the face (R2: the one direct-pixel pass).
// Eyes and mouth are 1–2 px features: the downsample vote cannot draw them, so the face is painted here, at final
// resolution, last, so no other op can touch it. It changes with the state — calm (idle, walk), fierce (attacks,
// casts), hurt — because a face that never changes reads as a doll. The base exports the face anchors (eye, eye2,
// mouth) only on facings where the face is visible, so back views are skipped. Colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'hill giant: brow band leather dark, beard redrawn as a downward wedge; template face' };

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

  browBand(g, ctx, px);
  if (a.eye && a.eye2) beard(g, ctx, px);
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

const solid = (g, x, y) => g.inb(x, y) && g.alpha(x, y) === 255;

/** The brow band: the flat cloth-light strip across the head (not the maul) becomes leather dark. */
function browBand(g, ctx, px) {
  const hx = ctx.anchors.head?.[0] ?? g.w / 2, seen = new Set();
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (seen.has(x + ',' + y) || px.tokenAt(g, [x, y]) !== 'cloth.0') continue;
    const comp = [], stack = [[x, y]]; seen.add(x + ',' + y);
    while (stack.length) {
      const [cx, cy] = stack.pop(); comp.push([cx, cy]);
      for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]])
        if (!seen.has(nx + ',' + ny) && px.tokenAt(g, [nx, ny]) === 'cloth.0') { seen.add(nx + ',' + ny); stack.push([nx, ny]); }
    }
    const xs = comp.map(p => p[0]), ys = comp.map(p => p[1]);
    const w = Math.max(...xs) - Math.min(...xs) + 1, h = Math.max(...ys) - Math.min(...ys) + 1, mx = (Math.max(...xs) + Math.min(...xs)) / 2;
    if (w >= 6 && h <= 4 && Math.abs(mx - hx) <= 6) for (const p of comp) px.set(g, p, p[1] === Math.min(...ys) && h > 2 ? 'leather.1' : 'leather.2'); // a lit top edge
  }
}

/** The beard: the hair ball under the eyes is replaced by a wedge from the jaw down onto the chest. */
function beard(g, ctx, px) {
  const [x1, ey] = ctx.anchors.eye, [x2] = ctx.anchors.eye2, lo = Math.min(x1, x2), hi = Math.max(x1, x2);
  const ball = [];
  for (let y = ey + 2; y <= ey + 20; y++) for (let x = lo - 5; x <= hi + 5; x++) if ((px.tokenAt(g, [x, y]) ?? '').startsWith('hair')) ball.push([x, y]);
  if (!ball.length) return;
  const bl = Math.min(...ball.map(p => p[0])), br = Math.max(...ball.map(p => p[0])), bt = Math.min(...ball.map(p => p[1]));
  const mid = (bl + br) / 2, half = (br - bl + 1) / 2, H = 13;
  // the ball's pixels take the colour beside them, outward (face or tunic)
  const isBall = new Set(ball.map(p => p.join(',')));
  const fills = ball.map(([x, y]) => {
    const dir = x < mid ? -1 : 1;
    for (let i = 1; i < 10; i++) {
      const t = px.tokenAt(g, [x + dir * i, y]);
      if (t && t !== 'outline' && !isBall.has([x + dir * i, y].join(','))) return [[x, y], t];
      if (!solid(g, x + dir * i, y)) break;
    }
    return [[x, y], 'leather.1'];
  });
  for (const [p, t] of fills) px.set(g, p, t);
  // the wedge: rows bt..bt+H, its half-width shrinking to a point; ink on the sides and the tip
  const strand = Math.round(mid) - 2;
  for (let r = 0; r <= H; r++) {
    const y = bt + r, hw = (half - 0.5) * (1 - r / (H + 1));
    const a = Math.round(mid - hw), b = Math.round(mid + hw);
    for (let x = a; x <= b; x++) {
      let t = 'hair.1';
      if (x === a || x === b || r === H) t = 'outline';
      else if (x === a + 1 || (x === strand && r < H - 3)) t = 'hair.0';
      px.set(g, [x, y], t);
    }
  }
}
