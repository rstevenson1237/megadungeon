// class-priest base.v1 (r1) — the Priest on the shared player body (art/lib/person.v1.js): a tall mitre with a
// bright cross-band, a long vestment with a stole hanging down the front, a broad, kindly round face, a plain mace
// held up in the right hand and a small round shield on the left arm.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-priest', pass: 'r1', notes: 'mitre, vestment and stole, mace, small round shield', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, foot, L, R } = k;
    k.boots(pal.leather);
    k.shape('vestment', pal.cloth, [[0, shoulder - Y(0.5)], [4.6, shoulder], [4.8, waist], [5.8, foot - Y(1.5)], [5.4, foot - Y(0.4)], [0, foot - Y(0.2)]]);
    k.front(() => {
      for (const dx of [-1.6, 1.6]) k.add({ type: 'rect', name: 'stole', x: cx + X(dx) - X(0.8) - 1, y: shoulder + Y(0.5), w: X(1.6), h: foot - shoulder - Y(3), mat: pal.accent, shade: 'flat', band: 1 });
    });
    k.head(headY, { wide: 3.5, crown: 4.4, jaw: 2.2, chin: 4, point: 0, eyes: 1.8, hair: pal.skin });
    k.add({ type: 'path', name: 'mitre', underlay: true, mat: pal.cloth, shade: 'normal', round: X(1.5), d: k.smooth([[cx, headY - Y(11)], [cx + X(3.2), headY - Y(7)], [cx + X(3.2), headY - Y(2.4)], [cx - X(3.2), headY - Y(2.4)], [cx - X(3.2), headY - Y(7)]]) });
    k.add({ type: 'rect', name: 'mitre-band', x: cx - X(0.7), y: headY - Y(9.5), w: X(1.4), h: Y(7), mat: pal.accent, shade: 'flat', band: 0 });
    k.add({ type: 'rect', name: 'mitre-band', x: cx - X(3), y: headY - Y(4), w: X(6), h: Y(1.3), mat: pal.accent, shade: 'flat', band: 0 });
    k.off(() => {
      k.arm(1, pal.cloth, R - X(2), waist - Y(2));
      k.add({ type: 'circle', name: 'shield', cx: R - X(0.5), cy: waist - Y(2), r: X(3.4), mat: pal.metal, shade: 'sphere', underlay: true });
      k.add({ type: 'circle', name: 'boss', cx: R - X(0.5), cy: waist - Y(2), r: X(1), mat: pal.accent, shade: 'sphere' });
    });
    k.main(() => {
      k.arm(-1, pal.cloth, L + X(1.5), waist - Y(2));
      k.pole(pal.leather, L + X(1.5), waist - Y(1), L - X(0.5), headY - Y(1), 0.6, 'haft');
      k.add({ type: 'ellipse', name: 'mace-head', cx: L - X(0.8), cy: headY - Y(2.5), rx: X(2), ry: Y(2.4), mat: pal.metal, shade: 'sphere', underlay: true });
    });
  });
}
export const anchors = ctx => personAnchors(ctx, { eyes: 1.8, hand: L => [L.L + L.X(1.5), L.waist - L.Y(2)] });
