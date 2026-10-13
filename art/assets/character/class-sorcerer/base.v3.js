// class-sorcerer base.v3 (r3, from base.v2) — ONE change, the reviewer's "face is a dark muddy mass": the front face
// is lifted to the skin mid step with a light forehead and cheek, a narrower jaw, 2 outline eye px and a skin-shadow
// nose; the hair/beard mass stays only round and below it (the dark cheek pixels are gone).
// class-sorcerer base.v2 (r2, from base.v1) — ONE change, the reviewer's "straight trapezoid, flat back slab": the robe's
// hem is rounded and flares out at the feet (a curved, wider skirt), and three curved fold lines in the accent shadow
// step run down the back of the robe in the n/w view.
// base.v1 (r1) — the Sorcerer on the shared player body (art/lib/person.v1.js), from the approved class
// probe: a long flared robe with a high spiked collar, loose hair round a narrow high-cheeked face, a dagger low in the
// right hand and an orb raised in the open left hand.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-sorcerer', pass: 'r3', notes: 'probe sorcerer: spiked collar, flared robe, raised orb', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    k.shape('robe', pal.accent, [[0, shoulder - Y(0.5)], [4.6, shoulder], [4.4, waist - Y(2)], [5.6, foot - Y(5)], [8.6, foot - Y(1.4)], [7.8, foot + Y(0.2)], [3.5, foot + Y(0.4)], [0, foot - Y(0.2)]]);
    // the back's folds: thin curved crescents from the waist to the hem, bowing outward as the skirt flares
    k.rear(() => {
      for (const [x0, x1, bow] of [[-1.8, -4.6, -1.2], [0.4, 0.8, 0.8], [2.4, 5, 1.2]]) {
        const a = [cx + X(x0), waist - Y(1)], b = [cx + X(x1), foot - Y(0.6)], c = [(a[0] + b[0]) / 2 + X(bow), (a[1] + b[1]) / 2];
        k.add({ type: 'path', name: 'fold', color: 'accent.2', d: `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]} L${b[0] + 1} ${b[1]} Q${c[0] + 1} ${c[1]} ${a[0] + 1} ${a[1]} Z` });
      }
    });
    k.front(() => k.shape('under-robe', pal.cloth, [[0, shoulder + Y(3)], [1.5, shoulder + Y(3)], [2.5, foot - Y(1)], [0, foot - Y(0.5)]], { shade: 'flat', band: 1 }));
    k.add({ type: 'ellipse', name: 'hair', cx, cy: headY + Y(1.5), rx: X(4), ry: Y(5.8), mat: pal.hair, shade: 'sphere', underlay: true });
    k.head(headY, { ears: false, wide: 2.7, crown: 4.8, jaw: 1.1, chin: 4.6, point: 0.5, eyes: 1.4 });
    k.front(() => {
      // the face: a narrow egg on the skin mid step, lit forehead and cheek, 2 eye px, a shadow nose (turned 1 px south)
      const fx = cx - 1;
      k.add({ type: 'path', name: 'face', color: 'skin.1', d: k.smooth([[fx, headY - Y(3)], [fx + X(2.4), headY - Y(1.6)], [fx + X(2.3), headY + Y(1)], [fx + X(1.1), headY + Y(3.4)], [fx, headY + Y(4.2)], [fx - X(1.1), headY + Y(3.4)], [fx - X(2.3), headY + Y(1)], [fx - X(2.4), headY - Y(1.6)]]) });
      k.add({ type: 'ellipse', name: 'face-light', cx: fx - X(0.8), cy: headY - Y(1.6), rx: X(1.2), ry: Y(0.9), color: 'skin.0' });
      k.add({ type: 'rect', name: 'cheek-light', x: Math.round(fx - X(1.6)), y: Math.round(headY + Y(1.2)), w: 1, h: 1, color: 'skin.0' });
      for (const e of [-1.4, 1.4]) k.add({ type: 'rect', name: 'eye', x: Math.round(fx + X(e)), y: Math.round(headY), w: 1, h: 1, color: 'outline' });
      k.add({ type: 'rect', name: 'nose', x: Math.round(fx), y: Math.round(headY + Y(1.3)), w: 1, h: 2, color: 'skin.2' });
      k.add({ type: 'path', name: 'fringe', mat: pal.hair, shade: 'sphere', d: `M${cx - X(3.6)} ${headY - Y(1)} Q${cx - X(3)} ${headY - Y(5)} ${cx} ${headY - Y(5)} Q${cx + X(3)} ${headY - Y(5)} ${cx + X(3.6)} ${headY - Y(1)} Q${cx + X(1)} ${headY - Y(3)} ${cx - X(3.6)} ${headY - Y(1)} Z` });
    });
    k.add({ type: 'path', name: 'collar', underlay: true, mat: pal.accent, shade: 'bevel', mirrorX: cx, d: `M${cx - X(3.5)} ${shoulder + Y(1)} Q${cx - X(7)} ${shoulder - Y(2)} ${cx - X(7.5)} ${shoulder - Y(8)} Q${cx - X(5)} ${shoulder - Y(3)} ${cx - X(3.5)} ${shoulder + Y(1)} Z` });
    k.main(() => {
      k.arm(-1, pal.accent, L + X(1), waist, { r: 1.6 });
      k.pole(pal.metal, L + X(1), waist, L - X(1), waist + Y(4), 0.45, 'dagger');
    });
    k.off(() => {
      k.arm(1, pal.accent, R, shoulder - Y(1), { r: 1.6 });
      k.add({ type: 'circle', name: 'orb', cx: R + X(1), cy: shoulder - Y(4.5), r: X(2.6), mat: pal.accent, shade: 'sphere' });
      k.add({ type: 'ring', name: 'orb-halo', cx: R + X(1), cy: shoulder - Y(4.5), r: X(3.8), w: X(0.6), color: 'accent.0' });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.4, hand: L => [L.L + L.X(1), L.waist] });
