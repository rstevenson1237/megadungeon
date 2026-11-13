// boss-brutus-stonehand base.v4 (r4, from base.v3) — RESCALE to the brief's new 5.8 m (93 px, 2.5x the drawn player) in
// the 96 x 128 frame: every v3 measure is now in design units mapped through one scale (S, from the frame and the
// height), so widths, limbs, head, fists and details grow together rather than as a pixel upscale; the extra pixels go
// to the face (2-px eyes under the brow, a broader nose, a mouth slot), longer cracks and a second knuckle seam.
// With the rescale, the blind note on v3: one head and hump in every facing (the head is drawn from behind too, its
// scalp above a lower stone hump, and the hump shows behind the shoulders from the front), arms in two segments with
// an elbow that bends out and a taper to the wrist, and a rounder barrel torso (sphere-shaded, curved flanks and belly).
// Design, colours, facings and animation unchanged.
// boss-brutus-stonehand base.v3 (r3, from base.v2) — the decoration pass on the owner-approved v2 shape: cracked stone
// fists, brow, slab and hump, value split of head and arms from the leather tunic, face, rope belt.
// boss-brutus-stonehand base.v2 (r2) — SHAPE DRAFT: hunched torso, head dropped into the shoulders, thick thighs and
// forearms in a wide stance, two lopsided boulder fists, a rocky brow and a stone slab on one shoulder.
import { biped, bipedAnchors, bipedLayout } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-g-cap', pass: 'r4', notes: 'rescaled to 5.8 m in 96x128; one head and hump in all facings, elbowed tapered arms, rounder torso', mirror: false, recolour: 'leather' };
const H = 5.8;

// The design is written in v3's units (feet at y 78, 4.5 m); S maps it to the brief's height in this frame.
const unit = ctx => {
  const m = ctx.dir.scale?.metre ?? 16, S = (H * m) / (4.5 * m) * (72 / 67), foot = ctx.size[1] - 2;
  return { S, X: v => v * S, Y: y => foot - (78 - y) * S, R: v => v * S, foot };
};

// Per state and frame (body-centre dx, design y): the raised arm's elbow and fist, the trailing arm's elbow and fist.
const ARMS = {
  idle: [
    { e: [-24, 37], f: [-20, 24], oe: [24, 46], of: [20, 67] },
    { e: [-24, 38], f: [-20, 25], oe: [24, 47], of: [20, 68] },
  ],
  walk: [
    { e: [-24, 38], f: [-20, 26], oe: [24, 45], of: [20, 65] },
    { e: [-24, 37], f: [-20, 24], oe: [24, 46], of: [20, 67] },
    { e: [-24, 36], f: [-20, 22], oe: [24, 47], of: [20, 68] },
    { e: [-24, 37], f: [-20, 24], oe: [24, 46], of: [20, 67] },
  ],
  attack: [
    { e: [-24, 28], f: [-20, 10], oe: [24, 43], of: [20, 62] },   // fist hauled overhead
    { e: [-23, 30], f: [-12, 16], oe: [24, 43], of: [20, 62] },   // swing
    { e: [-18, 54], f: [-8, 70], oe: [24, 47], of: [20, 67] },    // slam down by the feet
    { e: [-24, 40], f: [-20, 28], oe: [24, 46], of: [20, 67] },   // recovery
  ],
};
const armsOf = ctx => { const a = ARMS[ctx.state] ?? ARMS.idle; return a[(ctx.logical ?? ctx.frame) % a.length]; };

// a crack: a run of 1-px cells stepping from [x, y] by the given (dx, dy) moves
const crack = (x, y, moves) => { const out = [{ type: 'rect', x: Math.round(x), y: Math.round(y), w: 1, h: 1 }]; let px = Math.round(x), py = Math.round(y);
  for (const [dx, dy] of moves) { px += dx; py += dy; out.push({ type: 'rect', x: px, y: py, w: 1, h: 1 }); } return out; };

export function render(ctx) {
  const U = unit(ctx), { S, X, Y, R } = U, px1 = Math.max(1, Math.round(S));
  const marks = { fists: [], head: null, sg: 1, back: false };
  return biped(ctx, k => {
    const { pal, cx, P, back, smooth } = k, A = armsOf(ctx);
    const sg = back ? -1 : 1;                 // from behind the creature's left is the viewer's right: the arms swap
    const dy = P.bob * px1;
    const at = ([x, y]) => [cx + sg * X(x), Y(y) + dy];
    const hx = cx + (back ? 0 : -X(3)), hy = Y(21) + dy;
    marks.head = [hx, hy]; marks.sg = sg; marks.back = back; marks.cx = cx; marks.dy = dy;

    const fist = (f, r, name) => {
      const rr = R(r);
      marks.fists.push({ f, r: rr, name });
      k.add({ type: 'ellipse', name, underlay: true, cx: f[0], cy: f[1], rx: rr, ry: rr * 0.92, mat: pal.stone, shade: 'sphere' });
      k.add({ type: 'path', name: 'cuff', underlay: true, mat: pal.stone, shade: 'normal', round: 1, d: smooth([[f[0] - X(6), f[1] - rr - 1], [f[0] + X(6), f[1] - rr - 1], [f[0] + X(5), f[1] - rr + X(3)], [f[0] - X(5), f[1] - rr + X(3)]]) });
    };
    // an arm in two segments: a thick upper arm to a bent elbow, a forearm tapering to the wrist
    const limb = (sh, e, f, w) => {
      k.add({ type: 'capsule', name: 'arm', underlay: true, mat: pal.skin, shade: 'cyl', a: sh, b: e, r: R(w / 2), r1: R(w * 0.42) });
      k.add({ type: 'capsule', name: 'arm', underlay: true, mat: pal.skin, shade: 'cyl', a: e, b: f, r: R(w * 0.44), r1: R(w * 0.34) });
    };
    const raisedArm = () => { const f = at(A.f); limb(at([-17, 27]), at(A.e), f, 11); fist(f, 7.6, 'fist-raised'); };
    const trailArm = () => { const f = at(A.of); limb(at([17, 29]), at(A.oe), f, 11.5); fist(f, 9, 'fist-trailing'); };
    // the stone hump of spine: behind the shoulders from the front (it rims the dropped head), lower and nearer from behind
    const hump = () => back
      ? k.add({ type: 'path', name: 'hump', underlay: true, mat: pal.stone, shade: 'sphere', d: smooth([[cx - X(13), Y(37) + dy], [cx - X(12), Y(31) + dy], [cx - X(5), Y(27.5) + dy], [cx + X(5), Y(27.5) + dy], [cx + X(12), Y(30) + dy], [cx + X(13), Y(36) + dy], [cx + X(9), Y(40) + dy], [cx - X(9), Y(40.5) + dy]]) })
      : k.add({ type: 'path', name: 'hump', underlay: true, mat: pal.stone, shade: 'sphere', d: smooth([[cx - X(16), Y(27) + dy], [cx - X(14), Y(19) + dy], [cx - X(6), Y(16.5) + dy], [cx + X(6), Y(16.5) + dy], [cx + X(14), Y(19) + dy], [cx + X(16), Y(27) + dy]]) });
    const head = () => {
      // short thick neck is lost between the shoulders; a heavy jutting jaw and a rocky brow; the same head every facing
      const h = (x, y) => [hx + X(x), hy + X(y)];
      k.add({ type: 'path', name: 'head', underlay: true, mat: pal.skin, shade: 'sphere', d: smooth([h(0, -7), h(5.5, -5.5), h(7, 0), h(6, 5), h(3, 7.5), h(-3, 7.5), h(-6, 5), h(-7, 0), h(-5.5, -5.5)]) });
      if (back) {
        // from behind: a cropped scalp of hair over the crown, the ears' line and the thick nape
        k.add({ type: 'path', name: 'scalp', mat: pal.hair, shade: 'sphere', d: smooth([h(0, -7), h(5.5, -5.5), h(6.5, 0), h(4, 2), h(-4, 2), h(-6.5, 0), h(-5.5, -5.5)]) });
        return;
      }
      k.add({ type: 'path', name: 'brow', underlay: true, mat: pal.stone, shade: 'normal', round: 1, d: smooth([h(-8, -2), h(-5, -6), h(5, -6.5), h(8, -2), h(6, 0), h(-6, 0)]) });
      // eye sockets in the brow's shadow, the eyes dark inside them
      for (const e of [-3, 3]) k.add({ type: 'rect', name: 'socket', x: Math.round(hx + X(e - 1.5)), y: Math.round(hy), w: Math.round(X(3)), h: Math.round(X(2)), mat: pal.skin, shade: 'flat', band: 2 });
      for (const e of [-3, 3]) k.add({ type: 'rect', name: 'eye', x: Math.round(hx + X(e - 0.5)), y: Math.round(hy + X(1)), w: px1, h: px1, color: 'outline' });
      k.add({ type: 'rect', name: 'nose', x: Math.round(hx - X(1)), y: Math.round(hy + X(1)), w: Math.round(X(2)), h: Math.round(X(3)), mat: pal.skin, shade: 'flat', band: 0 });
      k.add({ type: 'path', name: 'beard', underlay: true, mat: pal.hair, shade: 'normal', round: 1.5, d: smooth([h(-6, 4), h(6, 4), h(5, 9), h(0, 12), h(-5, 9)]) });
      k.add({ type: 'rect', name: 'mouth', x: Math.round(hx - X(2)), y: Math.round(hy + X(6)), w: Math.round(X(4)), h: 1, color: 'outline' });
    };

    if (!back) hump();
    if (back) raisedArm();
    // ---- thick thighs, wrapped calves, heavy boots, in a wide stance; boots reach the pivot row
    P.feet.forEach((fy, i) => {
      const s = i ? 1 : -1, lift = fy < 0 ? -2 : 0, fwd = fy > 0 ? 1 : 0;
      const hip = [cx + s * X(8), Y(48)], knee = [cx + s * X(12), Y(62 + lift / 2)], ankle = [cx + s * X(11 + fwd), Y(75 + lift)];
      k.add({ type: 'tube', name: 'leg', underlay: true, mat: pal.skin, shade: 'cyl', pts: [hip, knee, ankle], w: R(12), w1: R(8) });
      k.add({ type: 'tube', name: 'wrap', underlay: true, mat: pal.leather, shade: 'cyl', pts: [[knee[0], knee[1] + R(2)], ankle], w: R(9), w1: R(8) });
      k.add({ type: 'ellipse', name: 'boot', underlay: true, cx: ankle[0] + s * X(1.5), cy: Y(77 + lift), rx: R(6.5), ry: R(2.6), mat: pal.leather, shade: 'sphere' });
    });
    // ---- hunched barrel torso: round shoulders, a curved chest slung forward, a belly over a ragged leather skirt
    const lean = back ? 0 : -3, t = (x, y) => [cx + X(x), Y(y)];
    k.add({ type: 'path', name: 'tunic', underlay: true, mat: pal.leather, shade: 'sphere', round: R(4), d: smooth([
      t(lean, 21), t(11, 22), t(17, 26), t(19, 33), t(17, 41), t(16, 48), t(14, 54), t(10, 57), t(4, 55), t(0, 58), t(-5, 55),
      t(-10, 57), t(-14, 54), t(-16, 48), t(-17, 41), t(-19, 33), t(-17, 26), t(-11, 22)]) });
    k.front(() => k.add({ type: 'ellipse', name: 'belly', mat: pal.leather, shade: 'sphere', cx: cx + X(lean / 2), cy: Y(44), rx: X(11), ry: X(7) }));
    k.add({ type: 'path', name: 'belt', mat: pal.hair, shade: 'cyl', d: smooth([t(-15.5, 45), t(0, 46.5), t(15.5, 45), t(15.5, 48), t(0, 49.5), t(-15.5, 48)]) });
    k.front(() => k.add({ type: 'path', name: 'chest', mat: pal.skin, shade: 'flat', band: 1, d: smooth([t(-9 + lean, 28), t(-2 + lean, 30), t(6 + lean, 28), t(-2 + lean, 41)]) }));
    // shoulders: a stone slab on the raised side, a bare round one on the other
    k.add({ type: 'ellipse', name: 'shoulder', underlay: true, cx: cx - sg * X(16), cy: Y(25) + dy, rx: R(8), ry: R(6.5), mat: pal.stone, shade: 'sphere' });
    k.add({ type: 'ellipse', name: 'shoulder', underlay: true, cx: cx + sg * X(16), cy: Y(27) + dy, rx: R(7), ry: R(6), mat: pal.skin, shade: 'sphere' });
    if (back) { head(); hump(); trailArm(); }
    else { head(); raisedArm(); trailArm(); }
  }, { height: H, proc: p => {
    // skin and leather apart by value: shadows from the head, arms and fists onto the tunic, AO where they overlap it
    p = p.add('castShadow', { part: ['head', 'arm', 'fist-raised', 'fist-trailing', 'cuff', 'shoulder', 'beard', 'hump'], dist: px1 })
      .add('ao', { part: ['tunic', 'belt', 'belly'] })
      .add('rimLight', { part: ['head', 'arm', 'leg', 'shoulder'], side: 'lit' })
      .add('materialNoise', { part: ['tunic', 'belly'], amount: 0.18, scale: 2 })
      .add('materialNoise', { mat: 'stone', amount: 0.45, scale: 2, seed: 3 })
      .add('rimLight', { mat: 'stone', side: 'lit' });
    const SEAM = [[1, 1], [1, 0], [1, 0], [1, -1], [1, 0], [1, 1], [1, 0], [1, 0], [1, -1], [1, 0], [1, 1], [1, 0], [1, -1], [1, 0]];
    // cracked stone: two knuckle seams and two cracks on each fist
    for (const { f, r, name } of marks.fists) {
      if (marks.back && name === 'fist-raised') continue;   // from behind the slab and hump hide most of it
      const [x, y] = f, o = Math.sign(x - marks.cx) || 1, n = Math.round(2 * r - 7);
      p = p.add('decal', { name: 'knuckles', part: name, mat: 'stone', band: 2, shape: [
        ...crack(x - r + 4, y + X(2), SEAM.slice(0, n)), ...crack(x - r + 6, y + X(2) + 4, SEAM.slice(0, n - 4)) ] });
      p = p.add('decal', { name: 'crack', part: name, mat: 'stone', band: 2, shape: [
        ...crack(x + o * X(3), y - X(4), [[-o, 1], [-o, 0], [-o, 1], [0, 1], [-o, 1], [-o, 1], [0, 1]]),
        ...crack(x - o * X(1), y - X(2.5), [[-o, -1], [-o, 0], [-o, -1]]) ] });
    }
    if (marks.head) {
      const [hx, hy] = marks.head, cx = marks.cx, dy = marks.dy, sg = marks.sg, X = U.X, Y = U.Y;   // from the front the raised fist hides the slab
      if (!marks.back) p = p.add('decal', { name: 'brow-crack', part: 'brow', mat: 'stone', band: 2, shape: crack(hx - X(2), hy - X(5), [[1, 1], [1, 0], [1, 1], [1, 0]]) });
      if (marks.back) p = p.add('decal', { name: 'slab-crack', part: 'shoulder', mat: 'stone', band: 2, shape: crack(cx - sg * X(18), Y(22) + dy, [[sg, 1], [sg, 1], [0, 1], [sg, 1], [sg, 1]]) });
      p = p.add('decal', { name: 'hump-crack', part: 'hump', mat: 'stone', band: 2, shape: marks.back
        ? [...crack(cx - X(7), Y(30) + dy, [[1, 1], [1, 1], [0, 1], [1, 1], [1, 1], [1, 0], [1, 1], [1, 1]]), ...crack(cx + X(5), Y(32) + dy, [[1, 1], [0, 1], [-1, 1], [0, 1]])]
        : [...crack(cx + X(10), Y(19) + dy, [[1, 1], [0, 1], [1, 1]])] });
    }
    return p;
  } });
}

export const anchors = ctx => {
  const U = unit(ctx), px1 = Math.max(1, Math.round(U.S));
  const base = bipedAnchors(ctx, { height: H, headDy: 1, eyes: 1.5 });
  const Lo = bipedLayout(ctx, H), A = armsOf(ctx), back = Lo.back, sg = back ? -1 : 1, dy = Lo.P.bob * px1;
  const flip = ctx.facing === 'e' || ctx.facing === 'n', fx = x => { const p = Math.round(x); return flip ? Lo.w - 1 - p : p; };
  const hx = Lo.cx + (back ? 0 : -U.X(3)), hy = U.Y(21) + dy;
  const out = { ...base, head: [fx(hx), Math.round(hy - U.X(4))], hand: [fx(Lo.cx + sg * U.X(A.f[0])), Math.round(U.Y(A.f[1]) + dy)] };
  delete out.eye; delete out.eye2; delete out.mouth;
  if (!back) { out.eye = [fx(hx - U.X(3)), Math.round(hy + U.X(1))]; out.eye2 = [fx(hx + U.X(3)), Math.round(hy + U.X(1))]; out.mouth = [fx(hx), Math.round(hy + U.X(5))]; }
  return out;
};
