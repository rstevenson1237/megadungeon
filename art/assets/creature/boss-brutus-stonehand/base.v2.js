// boss-brutus-stonehand base.v2 (r2) — SHAPE DRAFT, redrawn after the owner rejected v1 ("stiff and robot-like, the same from
// every side"): the torso is hunched forward with the head dropped into the shoulders, thick thighs and forearms in a wide
// stance, two oversized lopsided boulder fists (the left one raised by the head, the bigger right one trailing by the knee),
// a rocky brow and a stone slab on one shoulder. Seen from behind, a boulder hump of spine hides the head and the arms swap
// sides, so front, back and side facings differ. Flat materials only, no proc layers, no finish; feet on the pivot row.
import { biped, bipedAnchors, bipedLayout } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-g-cap', pass: 'r2', notes: 'hunched stone-fisted brute: lopsided boulder fists, hump, dropped head, wide stance', mirror: false };
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

export function render(ctx) {
  return biped(ctx, k => {
    const { pal, cx, P, back, smooth } = k, A = armsOf(ctx);
    const sg = back ? -1 : 1;                 // from behind the creature's left is the viewer's right: the arms swap
    const dy = P.bob;
    const at = ([x, y]) => [cx + sg * x, y + dy];
    const hx = cx + (back ? 0 : -3), hy = 21 + dy;

    const fist = (f, r, name) => {
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
      for (const e of [-3, 3]) k.add({ type: 'rect', name: 'eye', x: Math.round(hx + e - 0.5), y: Math.round(hy + 1), w: 1, h: 1, color: 'outline' });
      k.add({ type: 'path', name: 'beard', underlay: true, mat: pal.hair, shade: 'normal', round: 1.5, d: smooth([[hx - 6, hy + 4], [hx + 6, hy + 4], [hx + 5, hy + 9], [hx, hy + 12], [hx - 5, hy + 9]]) });
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
    k.front(() => k.add({ type: 'path', name: 'chest', mat: pal.skin, shade: 'flat', band: 1, d: smooth([[cx - 9 + lean, 28], [cx + 6 + lean, 28], [cx - 2 + lean, 42]]) }));
    // shoulders: a stone slab on the raised side, a bare round one on the other
    k.add({ type: 'ellipse', name: 'shoulder', underlay: true, cx: cx - sg * 16, cy: 25 + dy, rx: 8, ry: 6.5, mat: pal.stone, shade: 'sphere' });
    k.add({ type: 'ellipse', name: 'shoulder', underlay: true, cx: cx + sg * 16, cy: 27 + dy, rx: 7, ry: 6, mat: pal.skin, shade: 'sphere' });
    if (back) { head(); trailArm(); }
    else { head(); raisedArm(); trailArm(); }
    // from behind, a boulder hump of spine rises over the dropped head
    k.rear(() => k.add({ type: 'path', name: 'hump', underlay: true, mat: pal.stone, shade: 'sphere', d: smooth([[cx - 15, 28], [cx - 14, 17], [cx - 6, 11], [cx + 4, 10], [cx + 12, 15], [cx + 15, 24], [cx + 12, 32], [cx - 12, 33]]) }));
  }, { height: H });
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
