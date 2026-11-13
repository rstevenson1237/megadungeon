// boss-brutus-stonehand base.v3 (r3, from base.v2) — the decoration pass on the owner-approved v2 shape (silhouette
// unchanged). Inside the line only: head and arms are split from the leather torso by value (a one-pixel cast shadow
// from the head, arms and fists onto the tunic, overlap AO on it, lit-edge rims on the skin, a darker tunic band);
// the boulder fists, rocky brow, shoulder slab and back hump are cracked stone (material noise plus dark crack decals
// and a knuckle seam), clearly not skin; the front face gains a nose, a mouth slot in the beard and eyes under the brow,
// and a rope belt crosses the tunic. Body stays on the leather ramp (the family recolour ramp, as family-g-cap).
// boss-brutus-stonehand base.v2 (r2) — SHAPE DRAFT, redrawn after the owner rejected v1 ("stiff and robot-like, the same from
// every side"): the torso is hunched forward with the head dropped into the shoulders, thick thighs and forearms in a wide
// stance, two oversized lopsided boulder fists (the left one raised by the head, the bigger right one trailing by the knee),
// a rocky brow and a stone slab on one shoulder. Seen from behind, a boulder hump of spine hides the head and the arms swap
// sides, so front, back and side facings differ. Flat materials only, no proc layers, no finish; feet on the pivot row.
import { biped, bipedAnchors, bipedLayout } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-g-cap', pass: 'r3', notes: 'decorated: cracked stone fists/brow/slab/hump, value split of head and arms from the tunic, face, rope belt', mirror: false, recolour: 'leather' };
const H = 4.5;

// Per state and frame (body-centre dx, absolute y): the raised arm's elbow and fist, the trailing arm's elbow and fist.
const ARMS = {
  idle: [
    { e: [-22, 37], f: [-20, 24], oe: [21, 47], of: [20, 67] },
    { e: [-22, 38], f: [-20, 25], oe: [21, 48], of: [20, 68] },
  ],
  walk: [
    { e: [-22, 38], f: [-20, 26], oe: [21, 46], of: [20, 65] },
    { e: [-22, 37], f: [-20, 24], oe: [21, 47], of: [20, 67] },
    { e: [-22, 36], f: [-20, 22], oe: [21, 48], of: [20, 68] },
    { e: [-22, 37], f: [-20, 24], oe: [21, 47], of: [20, 67] },
  ],
  attack: [
    { e: [-22, 28], f: [-20, 10], oe: [21, 44], of: [20, 62] },   // fist hauled overhead
    { e: [-22, 30], f: [-12, 16], oe: [21, 44], of: [20, 62] },   // swing
    { e: [-16, 54], f: [-8, 70], oe: [21, 48], of: [20, 67] },    // slam down by the feet
    { e: [-22, 40], f: [-20, 28], oe: [21, 47], of: [20, 67] },   // recovery
  ],
};
const armsOf = ctx => { const a = ARMS[ctx.state] ?? ARMS.idle; return a[(ctx.logical ?? ctx.frame) % a.length]; };

// a crack: a run of 1-px cells stepping from [x, y] by the given (dx, dy) moves
const crack = (x, y, moves) => { const out = [{ type: 'rect', x: Math.round(x), y: Math.round(y), w: 1, h: 1 }]; let px = Math.round(x), py = Math.round(y);
  for (const [dx, dy] of moves) { px += dx; py += dy; out.push({ type: 'rect', x: px, y: py, w: 1, h: 1 }); } return out; };

export function render(ctx) {
  const marks = { fists: [], head: null, sg: 1, back: false };
  return biped(ctx, k => {
    const { pal, cx, P, back, smooth } = k, A = armsOf(ctx);
    const sg = back ? -1 : 1;                 // from behind the creature's left is the viewer's right: the arms swap
    const dy = P.bob;
    const at = ([x, y]) => [cx + sg * x, y + dy];
    const hx = cx + (back ? 0 : -3), hy = 21 + dy;
    marks.head = [hx, hy]; marks.sg = sg; marks.back = back; marks.cx = cx; marks.dy = dy;

    const fist = (f, r, name) => {
      marks.fists.push({ f, r, name });
      k.add({ type: 'ellipse', name, underlay: true, cx: f[0], cy: f[1], rx: r, ry: r * 0.92, mat: pal.stone, shade: 'sphere' });
      k.add({ type: 'path', name: 'cuff', underlay: true, mat: pal.stone, shade: 'normal', round: 1, d: smooth([[f[0] - 6, f[1] - r - 1], [f[0] + 6, f[1] - r - 1], [f[0] + 5, f[1] - r + 3], [f[0] - 5, f[1] - r + 3]]) });
    };
    const raisedArm = () => {
      const sh = at([-17, 27]), e = at(A.e), f = at(A.f);
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: pal.skin, shade: 'cyl', pts: [sh, e, f], w: 11, w1: 9 });
      fist(f, 7.6, 'fist-raised');
    };
    const trailArm = () => {
      const sh = at([17, 29]), e = at(A.oe), f = at(A.of);
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: pal.skin, shade: 'cyl', pts: [sh, e, f], w: 11, w1: 9.5 });
      fist(f, 9, 'fist-trailing');
    };
    const head = () => {
      // short thick neck is lost between the shoulders; a heavy jutting jaw and a rocky brow
      k.add({ type: 'path', name: 'head', underlay: true, mat: pal.skin, shade: 'sphere', d: smooth([[hx, hy - 7], [hx + 5.5, hy - 5.5], [hx + 7, hy], [hx + 6, hy + 5], [hx + 3, hy + 7.5], [hx - 3, hy + 7.5], [hx - 6, hy + 5], [hx - 7, hy], [hx - 5.5, hy - 5.5]]) });
      if (back) return;
      k.add({ type: 'path', name: 'brow', underlay: true, mat: pal.stone, shade: 'normal', round: 1, d: smooth([[hx - 8, hy - 2], [hx - 5, hy - 6], [hx + 5, hy - 6.5], [hx + 8, hy - 2], [hx + 6, hy], [hx - 6, hy]]) });
      // eye sockets in the brow's shadow, the eyes dark inside them
      for (const e of [-3, 3]) k.add({ type: 'rect', name: 'socket', x: Math.round(hx + e - 1.5), y: Math.round(hy), w: 3, h: 2, mat: pal.skin, shade: 'flat', band: 2 });
      for (const e of [-3, 3]) k.add({ type: 'rect', name: 'eye', x: Math.round(hx + e - 0.5), y: Math.round(hy + 1), w: 1, h: 1, color: 'outline' });
      k.add({ type: 'rect', name: 'nose', x: Math.round(hx - 1), y: Math.round(hy + 1), w: 2, h: 3, mat: pal.skin, shade: 'flat', band: 0 });
      k.add({ type: 'path', name: 'beard', underlay: true, mat: pal.hair, shade: 'normal', round: 1.5, d: smooth([[hx - 6, hy + 4], [hx + 6, hy + 4], [hx + 5, hy + 9], [hx, hy + 12], [hx - 5, hy + 9]]) });
      k.add({ type: 'rect', name: 'mouth', x: Math.round(hx - 2), y: Math.round(hy + 6), w: 4, h: 1, color: 'outline' });
    };

    if (back) raisedArm();
    // ---- thick thighs, wrapped calves, heavy boots, in a wide stance; boots reach the pivot row
    P.feet.forEach((fy, i) => {
      const s = i ? 1 : -1, lift = fy < 0 ? -2 : 0, fwd = fy > 0 ? 1 : 0;
      const hip = [cx + s * 8, 48], knee = [cx + s * 12, 62 + lift / 2], ankle = [cx + s * (11 + fwd), 75 + lift];
      k.add({ type: 'tube', name: 'leg', underlay: true, mat: pal.skin, shade: 'cyl', pts: [hip, knee, ankle], w: 12, w1: 8 });
      k.add({ type: 'tube', name: 'wrap', underlay: true, mat: pal.leather, shade: 'cyl', pts: [[knee[0], knee[1] + 2], ankle], w: 9, w1: 8 });
      k.add({ type: 'ellipse', name: 'boot', underlay: true, cx: ankle[0] + s * 1.5, cy: 77 + lift, rx: 6.5, ry: 2.6, mat: pal.leather, shade: 'sphere' });
    });
    // ---- hunched torso: broad shoulders, chest slung forward, a belly over a ragged leather skirt
    const lean = back ? 0 : -3;
    k.add({ type: 'path', name: 'tunic', underlay: true, mat: pal.leather, shade: 'normal', round: 4, d: smooth([
      [cx + lean, 21], [cx + 12, 22], [cx + 18, 27], [cx + 17, 35], [cx + 14, 43], [cx + 15, 52], [cx + 10, 57], [cx + 4, 55], [cx, 58], [cx - 5, 55],
      [cx - 11, 57], [cx - 15, 52], [cx - 14, 43], [cx - 17, 35], [cx - 18, 27], [cx - 12, 22]]) });
    k.add({ type: 'path', name: 'belt', mat: pal.hair, shade: 'cyl', d: smooth([[cx - 14, 45], [cx + 14, 45], [cx + 14, 48], [cx - 14, 48]]) });
    k.front(() => k.add({ type: 'path', name: 'chest', mat: pal.skin, shade: 'flat', band: 1, d: smooth([[cx - 9 + lean, 28], [cx + 6 + lean, 28], [cx - 2 + lean, 42]]) }));
    // shoulders: a stone slab on the raised side, a bare round one on the other
    const slab = () => k.add({ type: 'ellipse', name: 'shoulder', underlay: true, cx: cx - sg * 16, cy: 25 + dy, rx: 8, ry: 6.5, mat: pal.stone, shade: 'sphere' });
    slab();
    k.add({ type: 'ellipse', name: 'shoulder', underlay: true, cx: cx + sg * 16, cy: 27 + dy, rx: 7, ry: 6, mat: pal.skin, shade: 'sphere' });
    if (back) { head(); trailArm(); }
    else { head(); raisedArm(); trailArm(); }
    // from behind, a boulder hump of spine rises over the dropped head
    k.rear(() => k.add({ type: 'path', name: 'hump', underlay: true, mat: pal.stone, shade: 'sphere', d: smooth([[cx - 15, 28], [cx - 14, 17], [cx - 6, 11], [cx + 4, 10], [cx + 12, 15], [cx + 15, 24], [cx + 12, 32], [cx - 12, 33]]) }));
  }, { height: H, proc: p => {
    // skin and leather apart by value: shadows from the head, arms and fists onto the tunic, AO where they overlap it
    p = p.add('castShadow', { part: ['head', 'arm', 'fist-raised', 'fist-trailing', 'cuff', 'shoulder', 'beard', 'hump'], dist: 1 })
      .add('ao', { part: ['tunic', 'belt'] })
      .add('rimLight', { part: ['head', 'arm', 'leg', 'shoulder'], side: 'lit' })
      .add('materialNoise', { part: 'tunic', amount: 0.18, scale: 2 })
      .add('materialNoise', { mat: 'stone', amount: 0.45, scale: 2, seed: 3 })
      .add('rimLight', { mat: 'stone', side: 'lit' });
    // cracked stone: a knuckle seam and two cracks on each fist
    for (const { f, r, name } of marks.fists) {
      if (marks.back && name === 'fist-raised') continue;   // from behind the slab and hump hide most of it
      const [x, y] = f, o = Math.sign(x - marks.cx) || 1;
      // the knuckle seam runs across the lower face of the fist; the cracks split its lit upper half
      p = p.add('decal', { name: 'knuckles', part: name, mat: 'stone', band: 2, shape: crack(x - r + 3, y + 2, [[1, 1], [1, 0], [1, 0], [1, -1], [1, 0], [1, 1], [1, 0], [1, 0], [1, -1]].slice(0, Math.round(2 * r - 6))) });
      p = p.add('decal', { name: 'crack', part: name, mat: 'stone', band: 2, shape: [
        ...crack(x + o * 3, y - 3, [[-o, 1], [-o, 0], [-o, 1], [0, 1], [-o, 1]]),
        ...crack(x - o * 1, y - 2, [[-o, -1], [-o, 0]]) ] });
    }
    if (marks.head) {
      const [hx, hy] = marks.head, cx = marks.cx, dy = marks.dy, sg = marks.sg;   // from the front the raised fist hides the slab
      if (!marks.back) p = p.add('decal', { name: 'brow-crack', part: 'brow', mat: 'stone', band: 2, shape: crack(hx - 2, hy - 5, [[1, 1], [1, 0], [1, 1]]) });
      if (marks.back) p = p.add('decal', { name: 'slab-crack', part: 'shoulder', mat: 'stone', band: 2, shape: crack(cx - sg * 18, 22 + dy, [[sg, 1], [sg, 1], [0, 1], [sg, 1]]) });
      if (marks.back) p = p.add('decal', { name: 'hump-crack', part: 'hump', mat: 'stone', band: 2, shape: [
        ...crack(cx - 6, 15, [[1, 1], [1, 1], [0, 1], [1, 1], [1, 1], [1, 0], [1, 1]]),
        ...crack(cx + 6, 20, [[1, 1], [0, 1], [-1, 1]]) ] });
    }
    return p;
  } });
}

export const anchors = ctx => {
  const base = bipedAnchors(ctx, { height: H, headDy: 1, eyes: 1.5 });
  const Lo = bipedLayout(ctx, H), A = armsOf(ctx), back = Lo.back, sg = back ? -1 : 1;
  const flip = ctx.facing === 'e' || ctx.facing === 'n', fx = x => { const p = Math.round(x); return flip ? Lo.w - 1 - p : p; };
  const hx = Lo.cx + (back ? 0 : -3), hy = 21 + Lo.P.bob;
  const out = { ...base, head: [fx(hx), Math.round(hy - 4)], hand: [fx(Lo.cx + sg * A.f[0]), Math.round(A.f[1] + Lo.P.bob)] };
  delete out.eye; delete out.eye2; delete out.mouth;
  if (!back) { out.eye = [fx(hx - 3), Math.round(hy + 1)]; out.eye2 = [fx(hx + 3), Math.round(hy + 1)]; out.mouth = [fx(hx), Math.round(hy + 5)]; }
  return out;
};
