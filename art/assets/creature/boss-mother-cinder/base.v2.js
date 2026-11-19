// base.v2 (r2): owner rejected shape - staff was hidden by the robe. Staff now held upright well clear of the flared hem (idle and walk); H=2 per brief. Bell robe, shawl, hat kept.
// boss-mother-cinder base.v1 (r1) — SHAPE DRAFT, flat materials, no proc layers. Mother Cinder: a fire-witch of family-h:
// a wide bell-shaped robe that flares to the ground, a heavy shawl over the shoulders, a tall bent-point hat with a broad
// brim, and a tall staff topped by a flaming brazier (raised on the attack). Same biped rig as family-h (art/lib/beast.v1.js).
import { biped, bipedAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'boss-mother-cinder', pass: 'r2', notes: 'shape draft: bell-robed fire witch, tall pointed hat, brazier staff', mirror: false };
const H = 1.75; // body scale so hat+flame total reads 2 m
export function render(ctx) {
  return biped(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, foot, knee } = k, headY = k.headY + Y(1);
    const flat = { shade: 'flat', band: 1 };
    k.legs(pal.leather, 2.2, 1.5); k.boots(pal.leather);
    // bell robe: narrow at the shoulders, flaring wide to the hem
    k.shape('robe', pal.cloth, [[0, shoulder - Y(1)], [4.2, shoulder], [4.6, waist], [8.6, foot - Y(3)], [9.2, foot], [0, foot + Y(0.5)]]);
    k.add({ type: 'rect', name: 'sash', x: cx - X(4.8), y: waist - Y(0.5), w: X(9.6), h: Y(1.4), mat: pal.accent, shade: 'flat', band: 1 });
    // shawl: a broad cape over the shoulders and upper chest
    k.shape('shawl', pal.accent, [[0, shoulder - Y(2)], [7, shoulder + Y(0.5)], [6.6, shoulder + Y(5)], [3, waist - Y(2)], [0, waist - Y(1)]], flat);
    k.off(() => k.arm(1, pal.cloth, cx + X(5), waist - Y(1), { glove: pal.skin }));
    k.head(headY + Y(1), { wide: 3.4, crown: 3.4, jaw: 1.8, chin: 4.2, point: 0.5, eyes: 1.6, hair: pal.hair });
    // hat: wide brim and a tall cone with a bent tip
    k.add({ type: 'ellipse', name: 'brim', underlay: true, cx, cy: headY - Y(1.6), rx: X(6.6), ry: Y(1.5), mat: pal.leather, shade: 'flat', band: 1 });
    k.add({ type: 'path', name: 'hat', underlay: true, mat: pal.leather, shade: 'flat', band: 1, d: k.smooth([[cx - X(4), headY - Y(1.8)], [cx - X(2.2), headY - Y(4)], [cx + X(0.5), headY - Y(4.6)], [cx + X(3), headY - Y(5.2)], [cx + X(1.8), headY - Y(4)], [cx + X(4), headY - Y(1.8)]]) });
    // staff topped with a brazier and flame; lifted forward on the attack
    k.main(() => {
      const f = k.frame % 4, atk = k.state === 'attack', dx = atk ? [0, X(3), X(6), X(3)][f] : 0, dy = atk ? [0, -Y(1), 0, Y(1)][f] : 0;
      const hx = cx - X(11.5) + dx, hy = waist - Y(1.5) + dy, ty = headY + Y(4.5) + dy;
      k.arm(-1, pal.cloth, hx, hy, { glove: pal.skin });
      k.pole(pal.leather, hx, foot, hx, ty, 1, 'staff');
      k.add({ type: 'path', name: 'bowl', underlay: true, mat: pal.metal, shade: 'flat', band: 1, d: `M${hx - X(3.2)} ${ty - Y(2)} H${hx + X(3.2)} L${hx + X(1.2)} ${ty + Y(1.5)} H${hx - X(1.2)} Z` });
      k.add({ type: 'path', name: 'flame', underlay: true, mat: pal.glow, shade: 'flat', band: 1, d: k.smooth([[hx - X(2.8), ty - Y(2)], [hx - X(3), ty - Y(6)], [hx - X(0.8), ty - Y(8)], [hx - X(0.4), ty - Y(10.5)], [hx + X(1.6), ty - Y(7.5)], [hx + X(3), ty - Y(5)], [hx + X(2.8), ty - Y(2)]]) });
    });
  }, { height: H });
}
export const anchors = ctx => bipedAnchors(ctx, { height: H, headDy: 1, eyes: 1.6, hand: L => [L.cx - L.X(11.5), L.waist - L.Y(1.5)] });
