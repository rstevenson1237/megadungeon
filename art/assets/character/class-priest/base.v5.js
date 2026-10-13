// class-priest base.v5 (x1, from base.v3) — the blind reviewer's "flat-topped box mitre (chef hat) and an unreadable
// pale ball in the left hand": the mitre tapers from its band to a pointed peak split by a 1 px centre cleft (two
// horns), its band set 1 px higher so more forehead shows and its orphrey cut to a short stripe above the band; the off-hand round shield becomes a closed prayer book
// held at the hip (leather cover, pale page edge, a pale cross on the cover).
// class-priest base.v3 (r3, from base.v2) — ONE change: the n/w back views no longer show a skin face/beard under the
// mitre: the back of the head is a hood/hair mass in the cloth ramp's mid/dark steps (no ears), and the stole's back
// shows as a single red band across the shoulders behind the neck.
// class-priest base.v2 (r2, from base.v1) — ONE change: the vestment is no longer a straight column with a flat hem: it
// tapers in at the waist, flares 2 px wider each side at the hem with a curved bottom edge, and carries a cloth-ramp
// shadow fold down its far (right, unlit) side.
// base.v1 (r1) — the Priest on the shared player body (art/lib/person.v1.js): a tall mitre with a
// bright cross-band, a long vestment with a stole hanging down the front, a broad, kindly round face, a plain mace
// held up in the right hand and a small round shield on the left arm.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-priest', pass: 'x1', notes: 'pointed split mitre, vestment and stole, mace, prayer book', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    k.boots(pal.leather);
    k.shape('vestment', pal.cloth, [[0, shoulder - Y(0.5)], [4.6, shoulder], [4.4, shoulder + Y(3)], [3.6, waist], [5.2, waist + Y(5)], [7.6, foot - Y(1.6)], [7.2, foot - Y(0.4)], [4, foot + Y(0.3)], [0, foot + Y(0.6)]]);
    // the far fold: a darker cloth band down the unlit right side, following the taper and the flare
    k.add({ type: 'path', name: 'far-fold', mat: pal.cloth, shade: 'flat', band: 2, d: k.smooth([[cx + X(2.6), waist + Y(1)], [cx + X(3.4), waist], [cx + X(5), waist + Y(5)], [cx + X(7), foot - Y(1.6)], [cx + X(5.6), foot - Y(0.3)], [cx + X(4.4), foot - Y(1.5)], [cx + X(3.4), waist + Y(5)]]) });
    k.front(() => {
      for (const dx of [-1.6, 1.6]) k.add({ type: 'rect', name: 'stole', x: cx + X(dx) - X(0.8) - 1, y: shoulder + Y(0.5), w: X(1.6), h: foot - shoulder - Y(3), mat: pal.accent, shade: 'flat', band: 1 });
    });
    k.rear(() => {
      // the stole's back: one red band across the shoulders behind the neck
      k.add({ type: 'path', name: 'stole-back', mat: pal.accent, shade: 'flat', band: 1, d: k.smooth([[cx - X(4), shoulder + Y(0.2)], [cx, shoulder + Y(1.2)], [cx + X(4), shoulder + Y(0.2)], [cx + X(4), shoulder + Y(2)], [cx, shoulder + Y(3)], [cx - X(4), shoulder + Y(2)]]) });
    });
    k.head(headY, { wide: 3.5, crown: 4.4, jaw: 2.2, chin: 4, point: 0, eyes: 1.8, hair: pal.cloth.slice(1), ears: !k.back });
    // the mitre: a band over the brow, sides curving in to two pointed horns split by a 1 px cleft
    const mb = headY - Y(3), mt = headY - Y(10.5);
    k.add({ type: 'poly', name: 'mitre', underlay: true, mat: pal.cloth, shade: 'normal', round: X(1), pts: [[cx - X(3.5), mb], [cx - X(3.5), mb - Y(2.5)], [cx - X(1.6), mt], [cx - X(0.5), mt], [cx - X(0.5), mt + Y(1.6)], [cx + X(0.5), mt + Y(1.6)], [cx + X(0.5), mt], [cx + X(1.6), mt], [cx + X(3.5), mb - Y(2.5)], [cx + X(3.5), mb]] });
    k.add({ type: 'rect', name: 'mitre-band', x: cx - X(0.7), y: mb - Y(4.6), w: X(1.4), h: Y(3.4), mat: pal.accent, shade: 'flat', band: 0 });
    k.add({ type: 'rect', name: 'mitre-band', x: cx - X(3), y: mb - Y(1.4), w: X(6), h: Y(1.3), mat: pal.accent, shade: 'flat', band: 0 });
    k.off(() => {
      k.arm(1, pal.cloth, R - X(2), waist - Y(2));
      // a closed prayer book held at the hip: leather cover, pale page edge, a pale cross on the cover
      const bx = Math.round(R - X(3.2)), by = Math.round(waist - Y(4.6));
      k.add({ type: 'rect', name: 'book', x: bx, y: by, w: 5, h: 6, r: 0.5, mat: pal.leather, shade: 'flat', band: 1, underlay: true });
      k.add({ type: 'rect', name: 'book-pages', x: bx + 4, y: by + 1, w: 1, h: 4, mat: pal.cloth, shade: 'flat', band: 0 });
      k.add({ type: 'rect', name: 'book-cross', x: bx + 2, y: by + 1, w: 1, h: 4, color: 'accent.0' });
      k.add({ type: 'rect', name: 'book-cross', x: bx + 1, y: by + 2, w: 3, h: 1, color: 'accent.0' });
    });
    k.main(() => {
      k.arm(-1, pal.cloth, L + X(1.5), waist - Y(2));
      k.pole(pal.leather, L + X(1.5), waist - Y(1), L - X(0.5), headY - Y(1), 0.6, 'haft');
      k.add({ type: 'ellipse', name: 'mace-head', cx: L - X(0.8), cy: headY - Y(2.5), rx: X(2), ry: Y(2.4), mat: pal.metal, shade: 'sphere', underlay: true });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.8, hand: L => [L.L + L.X(1.5), L.waist - L.Y(2)] });
