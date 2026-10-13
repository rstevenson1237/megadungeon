// class-alchemist base.v4 (r4) — from base.v3 (best so far), one change: the cranium is rounded — the hair/cap mass and
// the goggle strap taper 1px in at each side, the head is a touch narrower with a narrower, more pointed jaw, and a
// 1px skin neck shows under the chin in the front views, so the head reads as an egg, not a squared block.
// class-alchemist base.v3 (r3) — from base.v2 (best so far), one change: the head becomes an egg (round cranium 1px
// higher, jaw 1px narrower, rounder hair mass) with the goggles as a curved band over the brow, and the back view
// carries the apron's crossed ties and a flask satchel on a strap, so n/w read as the Alchemist.
// class-alchemist base.v2 (r2) — from base.v1, one change: the brass goggles (two big metal spheres that smeared the face
// into a grey blur) become a 2-px dark-lens band across the brow, above lit eyes and nose; the lower face keeps the skin ramp.
// base.v1: the Alchemist on the shared player body (art/lib/person.v1.js): wild hair with brass
// goggles pushed up on the brow, a heavy leather apron to the shins over a shirt with rolled sleeves, a bandolier of
// little vials, a round flask raised in the right hand (thrown in the attack) and a sling at the left hip.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-alchemist', pass: 'r4', notes: 'wild hair and goggles, long apron, vial bandolier, raised flask', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.legs(pal.leather, 2.2, 1.5); k.boots(pal.leather);
    k.shape('shirt', pal.cloth, [[0, shoulder - Y(0.5)], [4.6, shoulder], [4.6, shoulder + Y(4)], [4, waist], [4.4, waist + Y(2)], [0, waist + Y(2)]]);
    k.front(() => {
      k.shape('apron', pal.leather, [[0, shoulder + Y(2)], [3, shoulder + Y(2)], [3.4, waist], [4.2, knee + Y(2)], [0, knee + Y(2.5)]]);
      k.add({ type: 'tube', name: 'bandolier', mat: pal.leather, shade: 'flat', band: 2, pts: [[cx - X(4.4), shoulder + Y(0.5)], [cx + X(4), waist - Y(1)]], w: X(1.2) });
      [[-2.6, 1.6], [0, 3.4], [2.4, 5.2]].forEach(([dx, dy]) => k.add({ type: 'rect', name: 'vial', x: cx + X(dx) - 1, y: shoulder + Y(dy), w: X(1.2), h: Y(2), mat: pal.accent, shade: 'flat', band: 0 }));
    });
    // the hair: a rounded mass behind the egg-shaped cranium, a few tufts at the sides only
    k.add({ type: 'path', name: 'wild-hair', underlay: true, mat: pal.hair, shade: 'sphere', d: k.smooth([[cx - X(3.4), headY + Y(1)], [cx - X(3.8), headY - Y(3)], [cx - X(2.4), headY - Y(6.4)], [cx, headY - Y(7.2)], [cx + X(2.4), headY - Y(6.6)], [cx + X(3.8), headY - Y(3)], [cx + X(3.6), headY + Y(1.5)]]) });
    k.front(() => k.neck());
    k.head(headY, { wide: 3, crown: 5.2, jaw: 0.6, chin: 4.2, point: 0.5, eyes: 1.8 });
    // the goggles: a curved band over the brow following the round cranium (higher at the middle, dipping at the sides),
    // two dark lenses with a lit glint at the front
    const gy = headY - Y(2.6);
    k.add({ type: 'tube', name: 'goggle-strap', mat: pal.leather, shade: 'flat', band: 2, pts: [[cx - X(2.6), gy + Y(1.4)], [cx - X(1.6), gy + Y(0.3)], [cx, gy], [cx + X(1.6), gy + Y(0.3)], [cx + X(2.6), gy + Y(1.4)]], w: 2 });
    k.front(() => [-1.8, 1.8].forEach(e => {
      const lx = Math.round(cx + X(e) - 1), ly = Math.round(gy - 0.5);
      k.add({ type: 'circle', name: 'goggle-lens', cx: lx + 0.5, cy: ly + 1, r: 1.3, color: 'outline' });
      k.add({ type: 'rect', name: 'goggle-glint', x: lx, y: ly, w: 1, h: 1, color: 'metal.0' });
    }));
    // from behind: the apron's ties crossing over the back to a knot at the waist, and a satchel of flasks on a strap
    k.rear(() => {
      k.add({ type: 'tube', name: 'apron-tie', mat: pal.leather, shade: 'flat', band: 1, pts: [[cx - X(4), shoulder + Y(1)], [cx, waist - Y(1)], [cx + X(4), waist + Y(1)]], w: X(1) });
      k.add({ type: 'tube', name: 'apron-tie', mat: pal.leather, shade: 'flat', band: 1, pts: [[cx + X(4), shoulder + Y(1)], [cx, waist - Y(1)], [cx - X(4), waist + Y(1)]], w: X(1) });
      k.add({ type: 'tube', name: 'apron-tail', mat: pal.leather, shade: 'flat', band: 2, pts: [[cx, waist - Y(1)], [cx - X(1), waist + Y(3)]], w: X(1) });
      k.add({ type: 'path', name: 'satchel', underlay: true, mat: pal.leather, shade: 'normal', d: k.smooth([[cx + X(1.5), waist], [cx + X(5.2), waist - Y(0.5)], [cx + X(5.6), waist + Y(4)], [cx + X(1.8), waist + Y(4.4)]]) });
      k.add({ type: 'rect', name: 'satchel-flask', x: Math.round(cx + X(2.4)), y: Math.round(waist - Y(1.8)), w: 2, h: 2, mat: pal.accent, shade: 'flat', band: 0 });
      k.add({ type: 'rect', name: 'satchel-flask', x: Math.round(cx + X(4)), y: Math.round(waist - Y(1.4)), w: 1, h: 2, mat: pal.accent, shade: 'flat', band: 1 });
    });
    k.off(() => {
      k.arm(1, pal.cloth, R - X(2), waist + Y(1), { r: 1.3 });
      k.add({ type: 'tube', name: 'sling', mat: pal.leather, shade: 'flat', band: 1, pts: [[R - X(2), waist + Y(1)], [R - X(1), waist + Y(4)], [R - X(2.5), waist + Y(6)]], w: X(0.8) });
    });
    k.main(() => {
      k.arm(-1, pal.cloth, L + X(2), shoulder + Y(1), { r: 1.3 });
      k.add({ type: 'circle', name: 'flask', cx: L + X(1.5), cy: shoulder - Y(2), r: X(2), mat: pal.accent, shade: 'sphere', underlay: true });
      k.add({ type: 'rect', name: 'flask-neck', x: L + X(1), y: shoulder - Y(5.5), w: X(1.2), h: Y(2), mat: pal.metal, shade: 'flat', band: 1 });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.8, hand: L => [L.L + L.X(2), L.shoulder + L.Y(1)] });
