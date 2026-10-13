// class-thief base.v5 (x1) — from base.v4, the blind reviewer's point (a flat cap fused with the mask into a wide box,
// a rectangle torso, straight pale-striped pillar legs, a swollen-mitten sack): the cap and scarf become a close
// egg-shaped hood framing the face (a pointed crown, an oval face opening, a dark cloth mask over the mouth and nose,
// the hood's fall over the shoulders); the doublet tapers from the shoulders to the belt; the legs are dark leather hose
// bent at the knee (a single mid-leather light column, no pale stripe) over near-black boots; the sack is a third smaller.
//
// class-thief base.v4 (r4) — from base.v3, ONE change (review: the body was one near-black maroon mass merging with the
// outline at 1x and the cap a flat box): the doublet's lit side is lifted one leather step (a pale crescent down the
// left torso, the right arm's upper arm one band lighter), and the cap's crown is rounded into a dome so the head
// reads egg-shaped.
//
// class-thief base.v3 (r3) — from base.v2, ONE change (review: the blue loot sack on the left shoulder read as a round
// buckler at 1x): the sack is redrawn as a drooping teardrop in the leather ramp, its tied neck gripped over the left
// shoulder and its belly hanging down behind the shoulder blade to the waist, with a cord knot at the neck.
//
// class-thief base.v2 (r2) — from base.v1, ONE change (review: the boxy torso matched the ranger's and the back showed
// an unexplained olive block): the rectangle vest and the long cape become a short jerkin that narrows hard at the
// waist and flares into a short skirt below the belt, under a shoulder capelet with a hood bunched behind the neck
// (open in a V at the chest from the front, the hood's fold over the shoulders from the back).
//
// base.v1 (r1) — the Thief on the shared player body (art/lib/person.v1.js): a soft cap pulled low and a
// scarf over the mouth, a short cape, a bulging loot sack slung over the left shoulder, a short sword held low and
// forward in the right hand. Crouched a little: knees bent, shoulders forward.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-thief', pass: 'x1', notes: 'close hood with face opening and mask, tapered doublet, dark bent hose, smaller sack', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    // the loot sack, drawn at two thirds of v4's size about its tied neck
    const sack = [];
    {
      // the loot sack: a teardrop, narrow tied neck up at the shoulder, the heavy belly drooping behind toward the waist
      sack.push({ type: 'path', name: 'sack', underlay: true, mat: pal.leather, shade: 'sphere', d: k.smooth([[R - X(0.6), shoulder - Y(2.6)], [R + X(0.8), shoulder - Y(1.6)], [R + X(2.6), shoulder + Y(2.5)], [R + X(3.2), waist - Y(1.5)], [R + X(1.6), waist + Y(1)], [R - X(1), waist + Y(0.6)], [R - X(2), waist - Y(2)], [R - X(1.2), shoulder + Y(1)], [R - X(1.4), shoulder - Y(1.8)]]) });
      sack.push({ type: 'path', name: 'sack-neck', underlay: true, mat: pal.leather, shade: 'flat', band: 2, d: k.smooth([[R - X(1.6), shoulder - Y(4.2)], [R + X(0.6), shoulder - Y(4)], [R + X(0.4), shoulder - Y(2.4)], [R - X(1.2), shoulder - Y(2.2)]]) });
      sack.push({ type: 'rect', name: 'sack-tie', x: Math.round(R - X(1.4)), y: Math.round(shoulder - Y(2.6)), w: 2, h: 1, mat: pal.leather, shade: 'flat', band: 2 });
    }
    k.worn(() => k.add({ type: 'group', name: 'sack-g', scale: 0.68, origin: [R - X(0.5), shoulder - Y(3)], children: sack }));
    // dark leather hose, bent at the knee, over near-black boots
    const hose = [pal.leather[1], pal.leather[2], pal.leather[2]], boot = [pal.leather[2], pal.hair[2]];
    k.P.feet.forEach((dy, i) => {
      const s = i ? 1 : -1, ft = [k.baseCx + s * X(2.6), k.foot - Y(1.5) + dy];
      k.add({ type: 'tube', name: 'leg', underlay: true, mat: hose, shade: 'cyl', pts: [[cx + s * X(1.9), waist], [k.baseCx + s * X(3.1), knee], ft], w: X(3), w1: X(2.3) });
    });
    k.P.feet.forEach((dy, i) => k.add({ type: 'ellipse', name: 'boot', underlay: true, cx: k.baseCx + (i ? 1 : -1) * X(2.8), cy: k.foot - Y(1) + dy, rx: X(2), ry: Y(1.3), mat: boot, shade: 'sphere' }));
    // the jerkin: broad at the shoulders, pinched at the waist, a short flared skirt below the belt
    k.shape('jerkin', pal.leather, [[0, shoulder - Y(0.5)], [4.8, shoulder + Y(0.2)], [4.2, shoulder + Y(3)], [2.6, waist - Y(1.2)], [2.4, waist], [3.4, waist + Y(2.6)], [0, waist + Y(3)]]);
    // the capelet over the shoulders, with the hood fallen behind the neck
    if (k.back) {
      k.shape('capelet', pal.hair, [[0, headY + Y(1.5)], [2.8, headY + Y(2.6)], [5.2, shoulder + Y(0.2)], [5.3, shoulder + Y(3.2)], [3.5, shoulder + Y(5.5)], [0, shoulder + Y(6.2)]]);
      k.add({ type: 'path', name: 'hood-fold', mat: pal.hair, shade: 'flat', band: 2, d: k.smooth([[cx - X(2.4), headY + Y(3.2)], [cx, headY + Y(5.5)], [cx + X(2.4), headY + Y(3.2)], [cx, headY + Y(4.4)]]) });
    } else {
      k.add({ type: 'path', name: 'capelet', underlay: true, mat: pal.hair, shade: 'normal', round: X(2),
        d: `M${cx - X(2.2)} ${shoulder - Y(1)} Q${cx - X(6)} ${shoulder - Y(0.8)} ${cx - X(6)} ${shoulder + Y(2.8)} Q${cx - X(5)} ${shoulder + Y(4.4)} ${cx - X(3)} ${shoulder + Y(3.6)} L${cx - X(1.2)} ${shoulder - Y(0.2)} L${cx + X(1.2)} ${shoulder - Y(0.2)} L${cx + X(3)} ${shoulder + Y(3.6)} Q${cx + X(5)} ${shoulder + Y(4.4)} ${cx + X(6)} ${shoulder + Y(2.8)} Q${cx + X(6)} ${shoulder - Y(0.8)} ${cx + X(2.2)} ${shoulder - Y(1)} Z` });
    }
    // the lit side (light from the upper left): a crescent one leather step lighter down the left of the doublet
    k.front(() => k.add({ type: 'path', name: 'jerkin-lit', mat: pal.leather, shade: 'flat', band: 0, d: k.smooth([[cx - X(3.6), shoulder + Y(0.6)], [cx - X(2.6), shoulder + Y(1.2)], [cx - X(2.2), waist - Y(3)], [cx - X(2.4), waist - Y(0.6)], [cx - X(3), waist - Y(1.2)], [cx - X(4), shoulder + Y(2.6)]]) }));
    k.add({ type: 'rect', name: 'belt', x: cx - X(2.6), y: waist - Y(0.2), w: X(5.2), h: Y(1.2), mat: pal.hair, shade: 'flat', band: 2 });
    k.front(() => k.add({ type: 'rect', name: 'buckle', x: Math.round(cx - X(0.5)), y: Math.round(waist - Y(0.2)), w: 1, h: 1, mat: pal.metal, shade: 'flat', band: 0 }));
    // the close hood: an egg with a pointed crown round the head, an oval face opening, a dark mask over mouth and nose
    const hy = headY + Y(0.5), t = k.back ? 0 : -1;
    k.head(hy, { wide: 2.8, crown: 4, jaw: 1.5, chin: 4, point: 0.5, eyes: 1.4, ears: false });
    const hood = k.smooth([[cx + X(0.6), hy - Y(6)], [cx + X(3.4), hy - Y(4)], [cx + X(4.2), hy], [cx + X(4.4), hy + Y(4)], [cx + X(5.2), shoulder + Y(1.2)], [cx, shoulder + Y(2)], [cx - X(5.2), shoulder + Y(1.2)], [cx - X(4.4), hy + Y(4)], [cx - X(4.2), hy], [cx - X(3.2), hy - Y(4)]]);
    if (k.back) k.add({ type: 'path', name: 'hood', underlay: true, mat: pal.hair, shade: 'normal', round: X(2), d: k.smooth([[cx + X(0.4), hy - Y(4.8)], [cx + X(2.8), hy - Y(4.6)], [cx + X(4.2), hy - Y(1.6)], [cx + X(4), hy + Y(1.4)], [cx + X(4.6), hy + Y(4.6)], [cx + X(5.2), shoulder + Y(1)], [cx, shoulder + Y(1.8)], [cx - X(5.2), shoulder + Y(1)], [cx - X(4.6), hy + Y(4.6)], [cx - X(4), hy + Y(1.4)], [cx - X(4.2), hy - Y(1.6)], [cx - X(2.6), hy - Y(4.6)]]) });
    else {
      k.add({ type: 'subtract', name: 'hood', underlay: true, mat: pal.hair, shade: 'normal', round: X(2), shapes: [{ type: 'path', d: hood }, { type: 'ellipse', cx: cx + t, cy: hy + Y(1), rx: X(2.6), ry: Y(3) }] });
      k.add({ type: 'path', name: 'mask', mat: pal.cloth, shade: 'flat', band: 2, d: k.smooth([[cx - X(2.7) + t, hy + Y(1.6)], [cx + X(2.7) + t, hy + Y(1.6)], [cx + X(2.2) + t, hy + Y(3.8)], [cx + t, hy + Y(4.4)], [cx - X(2.2) + t, hy + Y(3.8)]]) });
    }
    k.off(() => k.arm(1, pal.leather, R - X(2), shoulder + Y(0.5), { glove: pal.leather }));
    k.main(() => {
      k.arm(-1, pal.leather, L + X(1), waist + Y(1), { glove: pal.leather });
      // the upper arm on the lit side, one leather step lighter
      { const sx = cx - X(5), sy = shoulder + Y(1.2), ex = (sx + L + X(1)) / 2 - X(1.5), ey = (sy + waist + Y(1)) / 2 + Y(0.5);
        k.add({ type: 'capsule', name: 'upper-arm-lit', mat: pal.leather, shade: 'flat', band: 1, a: [sx - X(0.2), sy], b: [ex, ey], r: X(1.0) }); }
      k.add({ type: 'path', name: 'short-sword', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${L + X(0.5)} ${waist} L${L - X(4.5)} ${waist - Y(4)} L${L - X(5)} ${waist - Y(5)} L${L - X(3.6)} ${waist - Y(4.6)} L${L + X(1.4)} ${waist + Y(0.8)} Z` });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.4, headDy: 0.5, hand: L => [L.L + L.X(1), L.waist + L.Y(1)] });
