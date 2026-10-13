// class-witch-hunter base.v4 (r4) — from base.v3, one change (base.v3's review): the coat below the belt. It no
// longer flares into a bell skirt: the skirts fall nearly straight to a narrower hem 3-4 px above the feet, are split
// up the middle by a dark centre slit from below the belt to the hem, and the two legs and boots show under the hem.
// class-witch-hunter base.v3 (r3) — from base.v2, one change (the review's next change): the shape of the figure in
// coat and head. The greatcoat is no longer a straight tube: it is pulled in 1-2 px at the waist and flares to a
// curved hem; and from behind (n/w) the head under the brim is hair (hair ramp mid, lit along its up-left edge) over a
// turned-up coat collar, with no dark face patch or olive sphere speckle.
// class-witch-hunter base.v2 (r2) — from base.v1, one change (the review's next change): the hat — crown lowered to
// about 5 px, brim widened to 2 px more past the head each side, both drawn flat in the dark cloth ramp (a mid-tone
// edge on the lit left), so the crown loses its white centre stripe.
// base.v1 (r1) — the Witch Hunter on the shared player body (art/lib/person.v1.js): a tall
// flat-topped hat with a buckle and a stiff brim, a long buttoned greatcoat with a short shoulder cape, a hard lean
// face, a loaded crossbow levelled in the right hand and a short sword at the left hip.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-witch-hunter', pass: 'r4', notes: 'capotain hat and buckle, greatcoat and capelet, crossbow levelled', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, knee, L, R } = k;
    k.legs(pal.leather, 2.2, 1.5); k.boots(pal.leather);
    k.shape('greatcoat', pal.leather, [[0, shoulder - Y(0.5)], [4.8, shoulder], [4.6, shoulder + Y(3)], [3.2, waist - Y(0.5)], [3.6, waist + Y(1.5)], [4.5, knee], [4.9, foot - Y(4.4)], [3.8, foot - Y(3.5)], [0, foot - Y(3.7)]]);
    // the coat opens below the belt: a dark slit from the waist to the hem, widening a little toward it
    k.add({ type: 'poly', name: 'coat-slit', pts: [[cx - X(0.4), waist + Y(2)], [cx + X(0.4), waist + Y(2)], [cx + X(1.3), foot - Y(3.4)], [cx - X(1.3), foot - Y(3.4)]], mat: pal.leather, shade: 'flat', band: 2 });
    k.front(() => [0, 2, 4, 6].forEach(dy => k.add({ type: 'rect', name: 'button', x: cx - 1, y: shoulder + Y(2 + dy), w: 1, h: 1, mat: pal.metal, shade: 'flat', band: 0 })));
    k.add({ type: 'ellipse', name: 'capelet', cx, cy: shoulder + Y(1.4), rx: X(6.4), ry: Y(3.2), mat: pal.leather, shade: 'sphere', underlay: true });
    k.head(headY, { wide: 3, crown: 4.4, jaw: 1.6, chin: 4.6, point: 0.5, eyes: 1.6 });
    // from behind: hair under the brim (mid step, lit up-left) down to a turned-up coat collar, no face
    k.rear(() => {
      const hd = k.smooth([[cx - X(3.1), headY - Y(2)], [cx + X(3.1), headY - Y(2)], [cx + X(2.9), headY + Y(2)], [cx + X(1.5), headY + Y(3.4)], [cx - X(1.5), headY + Y(3.4)], [cx - X(2.9), headY + Y(2)]]);
      k.add({ type: 'path', name: 'back-hair-mass', underlay: true, mat: pal.hair, shade: 'flat', band: 1, d: hd });
      k.add({ type: 'group', name: 'back-hair-lit', clip: { type: 'path', d: hd }, children: [
        { type: 'rect', name: 'back-hair-light', x: cx - X(4), y: headY - Y(2), w: X(1.6), h: Y(3), mat: pal.hair, shade: 'flat', band: 0 },
      ] });
      k.add({ type: 'path', name: 'collar', underlay: true, mat: pal.leather, shade: 'flat', band: 1, d: k.smooth([[cx - X(3.4), headY + Y(2.4)], [cx + X(3.4), headY + Y(2.4)], [cx + X(3.8), headY + Y(4.6)], [cx - X(3.8), headY + Y(4.6)]]) });
      k.add({ type: 'rect', name: 'collar-lit', x: Math.round(cx - X(3)), y: Math.round(headY + Y(2.6)), w: X(2), h: 1, mat: pal.leather, shade: 'flat', band: 0 });
    });
    k.add({ type: 'ellipse', name: 'brim', cx, cy: headY - Y(2.8), rx: X(7.4), ry: Y(1.4), mat: pal.cloth, shade: 'flat', band: 2, underlay: true });
    k.add({ type: 'path', name: 'crown', underlay: true, mat: pal.cloth, shade: 'flat', band: 2, d: `M${cx - X(3.4)} ${headY - Y(3)} L${cx - X(2.9)} ${headY - Y(8)} H${cx + X(2.9)} L${cx + X(3.4)} ${headY - Y(3)} Z` });
    k.add({ type: 'rect', name: 'crown-lit', x: Math.round(cx - X(3)), y: headY - Y(7.6), w: 1, h: Y(4.4), mat: pal.cloth, shade: 'flat', band: 1 });
    k.add({ type: 'rect', name: 'hat-band', x: cx - X(3.3), y: headY - Y(4.6), w: X(6.6), h: Y(1.2), mat: pal.leather, shade: 'flat', band: 2 });
    k.front(() => k.add({ type: 'rect', name: 'buckle', x: cx - X(1) - 1, y: headY - Y(4.8), w: X(2), h: Y(1.6), mat: pal.metal, shade: 'flat', band: 1 }));
    k.off(() => {
      k.arm(1, pal.leather, R - X(3), waist - Y(1.5), { r: 1.4, glove: pal.leather });
      k.pole(pal.metal, R - X(1), waist, R + X(1), waist + Y(6), 0.5, 'short-sword');
    });
    k.main(() => {
      k.arm(-1, pal.leather, L + X(2), waist - Y(2), { r: 1.4, glove: pal.leather });
      k.add({ type: 'capsule', name: 'stock', underlay: true, mat: pal.leather, shade: 'cyl', axis: 'x', a: [L - X(4), waist - Y(3)], b: [cx + X(1), waist - Y(2)], r: X(1), r1: X(0.8) });
      k.add({ type: 'arc', name: 'prod', underlay: true, cx: L - X(1), cy: waist - Y(3), r: X(4.4), w: X(1.1), a0: 120, a1: 240, mat: pal.metal, shade: 'flat', band: 1 });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.6, hand: L => [L.L + L.X(2), L.waist - L.Y(2)] });
