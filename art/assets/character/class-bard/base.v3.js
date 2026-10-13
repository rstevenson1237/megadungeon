// class-bard base.v3 (r3) — from base.v2 (best so far), one change: the lute's body is a 5 x 6 rounded bulb (leather ramp,
// characters have no wood) slung low behind the left hip so it shows past the doublet front and back, with a dark
// soundhole on its face and the neck rising from it past the shoulder.
// class-bard base.v2 (r2) — from base.v1, one change: the face under the brim is lit (skin mid/light with eyes and nose
// under a 1-px brim-shadow row, the goatee drawn over it) in s/e, and in n/w the back of the head under the brim is
// filled with the hair ramp, so neither view shows a dark muddy patch.
// base.v1: the Bard on the shared player body (art/lib/person.v1.js), from the approved class probe:
// a slim slashed doublet, a wide feathered hat, a long face with a pointed chin and goatee, a rapier in the right hand
// and a lute on the back.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-bard', pass: 'r3', notes: 'probe bard: feathered hat, doublet, rapier, lute', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    k.worn(() => {
      k.pole(pal.leather, cx + X(7.6), waist - Y(1), cx + X(11.5), shoulder - Y(8), 0.7, 'lute-neck');
      k.add({ type: 'ellipse', name: 'lute', cx: cx + X(8.2), cy: waist + Y(2.4), rx: X(2.6), ry: Y(3.1), mat: pal.leather, shade: 'sphere', underlay: true });
      k.add({ type: 'rect', name: 'soundhole', x: Math.round(cx + X(8.2)) - 1, y: Math.round(waist + Y(1.6)), w: 1, h: 1, color: 'outline' });
    });
    k.legs(pal.leather, 2, 1.4); k.boots(pal.leather);
    k.neck();
    k.shape('doublet', pal.cloth, [[0, shoulder - Y(0.5)], [4.5, shoulder], [4.8, shoulder + Y(3)], [3.4, waist - Y(1)], [5, waist + Y(2)], [0, waist + Y(2.5)]]);
    k.front(() => k.add({ type: 'capsule', name: 'slash', a: [cx, shoulder + Y(1.5)], b: [cx, waist], r: X(0.6), mat: pal.accent, shade: 'flat', band: 1 }));
    k.head(headY, { wide: 2.8, crown: 4.4, jaw: 1.2, chin: 5, point: 0.8, eyes: 1.6, nose: 1.5 });
    k.add({ type: 'ellipse', name: 'brim', cx, cy: headY - Y(3.5), rx: X(7), ry: Y(1.8), mat: pal.cloth, shade: 'normal', round: X(1), underlay: true });
    k.add({ type: 'ellipse', name: 'crown', cx: cx + X(0.5), cy: headY - Y(5.5), rx: X(3.5), ry: Y(2.5), mat: pal.cloth, shade: 'sphere', underlay: true });
    // the face lit under the brim: a 1-px brim shadow, then lit skin with the eyes and nose, the goatee over it
    k.front(() => {
      const fc = Math.round(cx) - 1, y0 = Math.round(headY), ex = [Math.round(cx - X(1.6)) - 1, Math.round(cx + X(1.6)) - 1];
      const px = (name, x, y, w, color, h = 1) => k.add({ type: 'rect', name, x, y, w, h, color });
      px('brim-shadow', fc - 2, y0 - 1, 5, 'skin.2');
      px('face', fc - 2, y0, 5, 'skin.1'); px('face-lit', fc - 1, y0, 2, 'skin.0');
      ex.forEach(x => px('eye', x, y0, 1, 'outline'));
      px('face', fc - 2, y0 + 1, 5, 'skin.1'); px('face-lit', fc - 1, y0 + 1, 1, 'skin.0');
      px('face', fc - 1, y0 + 2, 3, 'skin.1'); px('face-lit', fc - 1, y0 + 2, 1, 'skin.0');
      px('nose', fc, y0 + 1, 1, 'skin.2', 2);
    });
    k.front(() => k.add({ type: 'path', name: 'goatee', mat: pal.hair, shade: 'flat', band: 1, d: `M${cx - X(1) - 1} ${headY + Y(3)} Q${cx - 1} ${headY + Y(6.5)} ${cx + X(1) - 1} ${headY + Y(3)} Z` }));
    // from behind, the back of the head under the brim is hair, not shadow
    k.rear(() => k.add({ type: 'ellipse', name: 'back-hair', cx, cy: headY + Y(1.2), rx: X(3), ry: Y(2.6), mat: pal.hair, shade: 'flat', band: 1 }));
    k.add({ type: 'tube', name: 'feather', pts: [[cx + X(3), headY - Y(5.5)], [cx + X(6), headY - Y(9.5)], [cx + X(10), headY - Y(10.5)]], w: X(2), w1: X(0.6), mat: pal.accent, shade: 'flat', band: 0 });
    k.main(() => {
      k.arm(-1, pal.cloth, L + X(2), waist);
      k.pole(pal.metal, L + X(2), waist, L - X(5), k.foot - Y(1), 0.45, 'rapier');
      k.add({ type: 'arc', name: 'guard', cx: L + X(2), cy: waist, r: X(1.8), w: X(0.8), a0: 0, a1: 200, mat: pal.metal, shade: 'flat', band: 0 });
    });
    k.off(() => k.arm(1, pal.cloth, R - X(2.5), waist - Y(1)));
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.6, hand: L => [L.L + L.X(2), L.waist] });
