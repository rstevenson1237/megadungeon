// class-sorcerer base.v1 (r1) — the Sorcerer on the shared player body (art/lib/person.v1.js), from the approved class
// probe: a long flared robe with a high spiked collar, loose hair round a narrow high-cheeked face, a dagger low in the
// right hand and an orb raised in the open left hand.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-sorcerer', pass: 'r1', notes: 'probe sorcerer: spiked collar, flared robe, raised orb', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    k.shape('robe', pal.accent, [[0, shoulder - Y(0.5)], [4.6, shoulder], [4.6, waist - Y(2)], [7, foot - Y(2)], [7.5, foot - Y(0.5)], [0, foot]]);
    k.front(() => k.shape('under-robe', pal.cloth, [[0, shoulder + Y(3)], [1.5, shoulder + Y(3)], [2.5, foot - Y(1)], [0, foot - Y(0.5)]], { shade: 'flat', band: 1 }));
    k.add({ type: 'ellipse', name: 'hair', cx, cy: headY + Y(1.5), rx: X(4), ry: Y(5.8), mat: pal.hair, shade: 'sphere', underlay: true });
    k.head(headY, { ears: false, wide: 2.7, crown: 4.8, jaw: 1.1, chin: 4.6, point: 0.5, eyes: 1.4 });
    k.front(() => {
      for (const e of [-2.5, 2.5]) k.add({ type: 'rect', name: 'cheek', x: Math.round(cx + X(e)) - 1, y: Math.round(headY + Y(1.5)), w: 1, h: 1, mat: pal.skin, shade: 'flat', band: 2 });
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
