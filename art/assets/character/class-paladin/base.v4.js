// class-paladin base.v4 (r4) — from base.v2 (the best so far, R12), one change (base.v3's review): in attack frames 1-2
// the mace is swung forward: the elbow bends below the shoulder, the hand comes up in front of the chest and the mace
// head sits out in front at shoulder height (frame 1 a little higher, the swing; frame 2 level, the contact), instead of
// hanging by the shins. Drawn in screen space and un-turned into the hand's group, so the back views keep it behind.
// class-paladin base.v2 (r2) — from base.v1, one change (the review's next change): the great helm is rounded at the
// crown (a 1-px corner cut each side), narrowed by 2 px and set on a narrower gorget step, and the shield's cross is
// drawn as clean upright 1-px bars (placed where the turned shield is, not turned with it) in every frame.
// base.v1 (r1) — the Paladin on the shared player body (art/lib/person.v1.js), from the class probe the
// owner approved (art/probes/classes base.v3): boxy plate and a great helm (plate may stay boxy), a tabard, a flanged
// mace in the right hand and a kite shield with a cross on the left arm.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-paladin', pass: 'r4', notes: 'probe paladin: plate, great helm, mace, kite shield', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, knee, L, R, P } = k;
    P.feet.forEach((dy, i) => k.add({ type: 'rect', name: 'greave', underlay: true, mat: pal.metal, shade: 'bevel', x: i ? k.baseCx + X(1) : k.baseCx - X(4), y: waist, w: X(3), h: foot - waist + dy }));
    P.feet.forEach((dy, i) => k.add({ type: 'rect', name: 'sabaton', mat: pal.metal, shade: 'flat', band: 2, x: i ? k.baseCx + X(1) : k.baseCx - X(4.2), y: foot - Y(3) + dy, w: X(3.2), h: Y(3) }));
    k.add({ type: 'path', name: 'plate', underlay: true, mat: pal.metal, shade: 'normal', round: X(2), d: `M${cx - X(6.5)} ${shoulder} H${cx + X(6.5)} L${cx + X(5.5)} ${waist + Y(1)} H${cx - X(5.5)} Z` });
    k.front(() => k.add({ type: 'rect', name: 'tabard', x: cx - X(2), y: shoulder + Y(2), w: X(4), h: knee - shoulder, mat: pal.cloth, shade: 'flat', band: 1 }));
    k.add({ type: 'circle', name: 'pauldron', cx: cx - X(6.5), cy: shoulder + Y(1), r: X(2.6), mat: pal.metal, shade: 'sphere', mirrorX: cx, underlay: true });
    // gorget: a narrower collar step between the helm and the plate
    const hb = Math.round(headY + Y(3)), ht = Math.round(headY - Y(5)), hx = Math.round(cx);
    k.add({ type: 'rect', name: 'gorget', x: hx - X(2.5), y: hb - 1, w: X(5), h: Math.round(shoulder) - hb + 2, mat: pal.metal, shade: 'flat', band: 2, underlay: true });
    // great helm: 6 px wide, its crown rounded by a 1-px corner cut each side
    k.add({ type: 'poly', name: 'helm', pts: [[hx - X(2), ht], [hx + X(2), ht], [hx + X(3), ht + 1], [hx + X(3), hb], [hx - X(3), hb], [hx - X(3), ht + 1]], mat: pal.metal, shade: 'cyl', underlay: true });
    k.front(() => k.add({ type: 'rect', name: 'visor', x: hx - X(2) - 1, y: Math.round(headY), w: X(5), h: 1, color: 'outline' }));
    const swing = k.state === 'attack' && (k.frame % 4 === 1 || k.frame % 4 === 2);
    k.main(() => {
      if (!swing) {
        k.arm(-1, pal.metal, L + X(1), waist - Y(1), { r: 1.6, glove: pal.metal });
        k.pole(pal.leather, L + X(1), waist - Y(1), L - X(2), waist + Y(6), 0.6, 'haft');
        k.add({ type: 'star', name: 'mace', cx: L - X(2.5), cy: waist + Y(7), r: X(3), r2: X(1.8), n: 6, mat: pal.metal, shade: 'sphere', underlay: true });
        return;
      }
      // the forward swing, placed on screen and un-turned by the pose's turn so the group's turn puts it back
      const a = (-P.main * Math.PI) / 180, [ox, oy] = k.mainShoulder;
      const un = ([x, y]) => [ox + (x - ox) * Math.cos(a) - (y - oy) * Math.sin(a), oy + (x - ox) * Math.sin(a) + (y - oy) * Math.cos(a)];
      const f2 = k.frame % 4 === 2;
      const sh = [cx - X(5), shoulder + Y(1.2)];
      const el = [cx - X(7), shoulder + Y(f2 ? 5 : 4.5)];
      const hd = [cx - X(f2 ? 8.5 : 8), shoulder + Y(f2 ? 2.5 : 1.5)];
      const tip = [cx - X(f2 ? 10 : 9.5), shoulder - Y(f2 ? 0.5 : 2)];
      const mh = [cx - X(f2 ? 11 : 10), shoulder - Y(f2 ? 1 : 3.5)];
      const r = X(1.6);
      k.add({ type: 'capsule', name: 'upper-arm', underlay: true, mat: pal.metal, shade: 'cyl', a: un(sh), b: un(el), r, r1: r * 0.9 });
      k.add({ type: 'capsule', name: 'forearm', underlay: true, mat: pal.metal, shade: 'cyl', a: un(el), b: un(hd), r: r * 0.9, r1: r * 0.8 });
      k.pole(pal.leather, ...un(hd), ...un(tip), 0.6, 'haft');
      k.add({ type: 'circle', name: 'hand', cx: un(hd)[0], cy: un(hd)[1], r: X(1.1), mat: pal.metal, shade: 'sphere' });
      const m = un(mh);
      k.add({ type: 'star', name: 'mace', cx: m[0], cy: m[1], r: X(3), r2: X(1.8), n: 6, mat: pal.metal, shade: 'sphere', underlay: true });
    });
    k.off(() => {
      k.add({ type: 'path', name: 'shield', underlay: true, mat: pal.cloth, shade: 'normal', round: X(1.5), d: `M${R - X(4.5)} ${shoulder} H${R + X(4)} V${waist} L${R - X(0.25)} ${waist + Y(7)} L${R - X(4.5)} ${waist} Z` });
    });
    // the cross: clean upright 1-px bars at the turned shield's centre (not rotated, so it never breaks into steps)
    k.front(() => {
      const a = (P.off * Math.PI) / 180, [ox, oy] = k.offShoulder, c0 = [R, shoulder + Y(5.5)];
      const mx = Math.round(ox + (c0[0] - ox) * Math.cos(a) - (c0[1] - oy) * Math.sin(a)), my = Math.round(oy + (c0[0] - ox) * Math.sin(a) + (c0[1] - oy) * Math.cos(a));
      k.add({ type: 'rect', name: 'cross', x: mx, y: my - Y(3.5), w: 1, h: Y(9), mat: pal.metal, shade: 'flat', band: 0 });
      k.add({ type: 'rect', name: 'cross', x: mx - X(2), y: my - Y(1), w: X(5), h: 1, mat: pal.metal, shade: 'flat', band: 0 });
    });
  });
}
// the great helm hides the face: no face anchors
export const anchors = ctx => personAnchors(ctx, { face: false, hand: L => [L.L + L.X(1), L.waist - L.Y(1)] });
