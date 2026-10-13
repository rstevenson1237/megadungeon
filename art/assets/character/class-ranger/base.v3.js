// class-ranger base.v3 (r3, from base.v2) — ONE change, the attack: no more short-sword thrust while the bow hangs.
// The four attack frames shoot the bow: 0 anticipation (bow raised forward at shoulder height, arrow nocked), 1 draw
// (string hand pulled back to the cheek, string in a V), 2 loose (arrow gone, string straight, hand flung back), 3
// recovery (bow lowering). The arms and bow are drawn in the hand groups with the pose's turn undone, so the bow stays
// upright; the other states are unchanged.
// class-ranger base.v2 (r2, from base.v1) — ONE change, the jerkin: no longer a flat rectangle. It has rounded
// shoulders, tapers in to a narrow waist where a belt with a small buckle cinches it, flares a little below, and has a
// leather-ramp shadow band down its far (right, unlit) side.
// base.v1 (r1) — the Ranger on the shared player body (art/lib/person.v1.js), from the approved class
// probe: a deep hood and a long cloak over a jerkin; the probe's crossbow becomes the class's shortbow (Spec 05 gear),
// held upright in the left hand, a quiver of arrows on the back and a short sword at the right hand.
import { person, personAnchors } from '../../../lib/person.v1.js';
export const meta = { brief: 'class-ranger', pass: 'r3', notes: 'probe ranger: hood, cloak; shortbow, quiver', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.worn(() => {
      k.add({ type: 'rect', name: 'quiver', x: cx + X(1), y: shoulder - Y(5), w: X(3), h: Y(10), r: X(1), mat: pal.leather, shade: 'cyl', underlay: true, rotate: 20, origin: [cx + X(2.5), shoulder] });
      for (const dx of [1.6, 2.6, 3.6]) k.add({ type: 'rect', name: 'fletch', x: cx + X(dx), y: shoulder - Y(7), w: 1, h: Y(2), color: 'accent.1', rotate: 20, origin: [cx + X(2.5), shoulder] });
    });
    k.shape('cloak', pal.hair, [[0, shoulder - Y(1)], [6, shoulder], [7.5, waist], [8, knee + Y(1)], [5, knee + Y(2.5)], [0, knee + Y(2)]]);
    k.legs(pal.leather, 2.2, 1.5); k.boots(pal.leather);
    k.front(() => {
      k.shape('jerkin', pal.leather, [[0, shoulder - Y(0.4)], [3.4, shoulder], [4.6, shoulder + Y(1.4)], [4.2, shoulder + Y(4)], [2.9, waist - Y(0.6)], [3.6, waist + Y(1.6)], [3.2, waist + Y(2.6)], [0, waist + Y(2.8)]]);
      k.add({ type: 'path', name: 'jerkin-shadow', mat: pal.leather, shade: 'flat', band: 2, d: k.smooth([[cx + X(2.2), shoulder + Y(1.4)], [cx + X(4.2), shoulder + Y(1.6)], [cx + X(3.8), shoulder + Y(4)], [cx + X(2.6), waist - Y(0.6)], [cx + X(3.2), waist + Y(2.2)], [cx + X(2), waist + Y(2.2)], [cx + X(1.6), waist - Y(1)], [cx + X(2.4), shoulder + Y(4)]]) });
      k.add({ type: 'rect', name: 'belt', x: Math.round(cx - X(3)), y: Math.round(waist - Y(0.6)), w: Math.round(X(6)), h: 1, mat: pal.hair, shade: 'flat', band: 2 });
      k.add({ type: 'rect', name: 'buckle', x: Math.round(cx) - 1, y: Math.round(waist - Y(0.6)), w: 1, h: 1, color: 'metal.0' });
    });
    k.head(headY + Y(0.5), { ears: false, hair: pal.hair });
    k.add({ type: 'path', name: 'hood', underlay: true, mat: pal.hair, shade: 'sphere',
      d: k.back ? k.smooth([[cx, headY - Y(7)], [cx + X(5), headY - Y(3)], [cx + X(5), headY + Y(4)], [cx - X(5), headY + Y(4)], [cx - X(5), headY - Y(3)]])
        : `M${cx - X(5)} ${headY + Y(4)} Q${cx - X(5.5)} ${headY - Y(7)} ${cx + X(1)} ${headY - Y(7)} Q${cx + X(5.5)} ${headY - Y(5)} ${cx + X(5)} ${headY + Y(4)} Q${cx + X(3.5)} ${headY + Y(1)} ${cx + X(3)} ${headY - Y(1)} Q${cx} ${headY - Y(3.5)} ${cx - X(3)} ${headY - Y(1)} Q${cx - X(3.5)} ${headY + Y(1)} ${cx - X(5)} ${headY + Y(4)} Z` });
    if (k.state === 'attack') {
      // the shot: bow grip forward (toward the viewer's left), string hand at the nock, the cheek, or flung back
      const f = k.frame % 4, sy = shoulder + Y(1.2);
      const gx = cx - X(f === 3 ? 4.5 : 5.5), gy = shoulder + Y(f === 3 ? 3.5 : 1), r = X(8), a = 48, bx = gx + r; // arc centre right of the grip
      const top = [bx + r * Math.cos((180 - a) * Math.PI / 180), gy - r * Math.sin(a * Math.PI / 180)], bot = [top[0], gy + r * Math.sin(a * Math.PI / 180)];
      const hand = [[top[0] + X(1), gy], [cx + X(1.5), gy - Y(1)], [cx + X(3.5), gy - Y(0.5)], [top[0] + X(1), gy]][f];
      const limb = (side, h) => {
        const sx = cx + side * X(5), ex = (sx + h[0]) / 2 + X(0.5), ey = Math.max(sy, h[1]) + Y(1.2), rr = X(1.3);
        return [{ type: 'capsule', name: 'upper-arm', underlay: true, mat: pal.leather, shade: 'cyl', a: [sx, sy], b: [ex, ey], r: rr, r1: rr * 0.9 },
          { type: 'capsule', name: 'forearm', underlay: true, mat: pal.leather, shade: 'cyl', a: [ex, ey], b: h, r: rr * 0.9, r1: rr * 0.8 },
          { type: 'circle', name: 'hand', cx: h[0], cy: h[1], r: X(1.1), mat: pal.leather, shade: 'sphere' }];
      };
      const bow = [{ type: 'arc', name: 'bow', underlay: true, cx: bx, cy: gy, r, w: X(1.2), a0: 180 - a, a1: 180 + a, mat: pal.leather, shade: 'flat', band: 0 }];
      const string = f === 1 ? [{ type: 'tube', name: 'string', color: 'metal.0', pts: [top, hand, bot], w: 0.8 }]
        : [{ type: 'rect', name: 'string', x: Math.round(top[0]), y: top[1], w: 1, h: bot[1] - top[1], color: 'metal.0' }];
      const arrow = f < 2 ? [{ type: 'tube', name: 'arrow', mat: pal.leather, shade: 'flat', band: 1, pts: [hand, [gx - X(3), gy - Y(0.3)]], w: 0.9 },
        { type: 'rect', name: 'arrowhead', x: Math.round(gx - X(3.6)), y: Math.round(gy - Y(0.8)), w: 2, h: 1, color: 'metal.0' },
        { type: 'rect', name: 'fletch', x: Math.round(hand[0]) - 1, y: Math.round(hand[1]) - 1, w: 2, h: 1, color: 'accent.1' }] : [];
      // the bow arm (the left hand, held in the off group) and the string hand (the main group), the pose's turn undone
      k.off(() => k.add({ type: 'group', name: 'bow-arm', rotate: -k.P.off, origin: k.offShoulder, children: [...limb(1, [gx, gy]), ...bow, ...string] }));
      k.main(() => k.add({ type: 'group', name: 'string-arm', rotate: -k.P.main, origin: k.mainShoulder, children: [...arrow, ...limb(-1, hand)] }));
    } else {
      k.off(() => {
        k.arm(1, pal.leather, R - X(1), waist - Y(2), { glove: pal.leather });
        k.add({ type: 'arc', name: 'bow', underlay: true, cx: R - X(4), cy: waist - Y(3), r: X(9), w: X(1.2), a0: -55, a1: 55, mat: pal.leather, shade: 'flat', band: 0 });
        k.add({ type: 'rect', name: 'string', x: Math.round(R - X(4) + X(9) * Math.cos(55 * Math.PI / 180)) - 1, y: waist - Y(3) - X(9) * Math.sin(55 * Math.PI / 180), w: 1, h: 2 * X(9) * Math.sin(55 * Math.PI / 180), color: 'metal.0' });
      });
      k.main(() => {
        k.arm(-1, pal.leather, L + X(1.5), waist, { glove: pal.leather });
        k.pole(pal.metal, L + X(1.5), waist, L - X(2), waist + Y(6.5), 0.5, 'short-sword');
      });
    }
  });
}
export const anchors = ctx => personAnchors(ctx, { headDy: 0.5, hand: L => [L.L + L.X(1.5), L.waist] });
