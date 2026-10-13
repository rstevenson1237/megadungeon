// family-e base.v4 (x1, from base.v3) — changed (blind re-score): the eel is longer and reads as a water thing — a
// pool of dark water (cloth ramp) with a pale splash ring and droplets where the neck breaks the surface, the rest of the
// body lying long and flat along the surface behind the neck to a finned tail tip, and a dorsal fin ridge (separate
// inked fin rays) along the back of the neck and the floating body.
// family-e base.v3 (r3, from base.v2) — changed: the head is redrawn as a tapered eel skull (a long wedge narrowing to
// the snout, a gaping lower jaw hinged under the eye with a dark mouth and needle teeth), and the pale belly stripe the
// cylinder shading left down the body is narrowed to a 1 px pale line along the neck (body shaded flat in two tones).
// family-e base.v2 (r2, from base.v1) — changed: the spine bends into a clear S (its middle point pushed ~3 px to the
// side opposite the head, the lower point a little toward it) so the body reads as a serpent, not a stiff stalk.
// family-e base.v1 (r1) — eels and deep things of the water (glyph e, 0.8 m): a great eel on the creature rig
// (art/lib/beast.v1.js) rising out of a dark ripple on the floor: a long smooth body in an S, a fin running down its
// back, a blunt head with a gaping jaw of needle teeth and a pale eye. The body is the recoloured ramp (recolour: grass).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-e', pass: 'x1', notes: 'great eel rising from a ripple: S body, back fin, gaping jaw', mirror: false, recolour: 'grass' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth } = k, c = pal.grass, L = k.P.lunge * 4, sway = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) : (k.state === 'idle' ? k.frame * 0.6 : 0);
    const base = at(-1, 0, 0), pool = at(-4.5, 0, 0), w = pal.cloth;
    // the water: a dark pool (cloth ramp, the same in every row), a pale ring around it and a ring where the neck breaks it
    k.add({ type: 'ellipse', name: 'pool', cx: pool[0], cy: pool[1], rx: 9.5, ry: 3.8, mat: w, shade: 'flat', band: 2 }, -100);
    k.add({ type: 'ring', name: 'pool-ring', cx: pool[0], cy: pool[1], r: 8.6, w: 1, mat: w, shade: 'flat', band: 1, scale: [1, 0.42], origin: pool }, -99);
    // the rest of the body lies long and flat along the surface behind the neck, its back and fin ridge breaking the
    // water, ending in the finned tail tip
    const hd = k.back ? 3 : -3, wv = k.P.walking ? k.P.phase * Math.PI * 2 : k.frame * 0.8;
    const back = [0, 1, 2, 3, 4].map(i => at(-2 - i * 2, Math.sin(wv + i * 1.3) * 0.8, 0.6));
    const tip = at(-11.5, Math.sin(wv + 6.5) * 0.8, 0.6);
    k.add({ type: 'tube', name: 'back', underlay: true, mat: c, shade: 'flat', band: 1, pts: [...back, tip], w: 3, w1: 1.4 }, hd);
    k.add({ type: 'tube', name: 'back-lit', mat: c, shade: 'flat', band: 0, pts: back.slice(0, 4).map(([x, y]) => [x, y - 0.9]), w: 0.9, w1: 0.9 }, hd + 0.01);
    back.slice(1).forEach(([x, y], i) => k.add({ type: 'poly', name: 'fin-ray', underlay: true, mat: c, shade: 'flat', band: 1, pts: [[x - 1.3, y - 0.8], [x + 0.8, y - 3.6 + i * 0.4], [x + 1.4, y - 0.6]] }, hd - 0.02 - i * 0.001));
    k.add({ type: 'path', name: 'tail-fin', underlay: true, mat: c, shade: 'flat', band: 1, d: k.smooth([[tip[0] - 1.5, tip[1] + 0.5], [tip[0] + 0.5, tip[1] - 3.5], [tip[0] + 2.8, tip[1] - 2.5], [tip[0] + 1.5, tip[1] + 0.8]]) }, hd - 0.03);
    const sx = ([x, y], dx) => [x + dx, y]; // a screen-x push: the head always leans to the screen left before the flip
    const spine = [at(-1, 0, 0), sx(at(-2 + sway, 0, 3), -3), sx(at(0 + sway, 0, 7), 4), at(2 + L, 0, 11), at(4 + L * 1.3, 0, 12.5 + k.P.open * 0.5)];
    // the dorsal fin ridge: separate inked fin rays standing off the back of the neck (screen right before the flip)
    const fs = k.back ? -1 : 1;
    for (let i = 0; i < 3; i++) {
      const [ax, ay] = spine[i], [bx, by] = spine[i + 1], px = (ax + bx) / 2 + fs * 1.6, py = (ay + by) / 2;
      k.add({ type: 'poly', name: 'fin-ray', underlay: true, mat: c, shade: 'flat', band: 1, pts: [[px, py - 1.6], [px + fs * 3.2, py - 2.6], [px, py + 1.4]] }, i * 0.01);
    }
    // the body in two flat tones (lit front-left, shadowed back-right) and a 1 px pale belly line along the neck only
    k.add({ type: 'tube', name: 'body', underlay: true, mat: c, shade: 'flat', band: 1, pts: spine.slice(0, 4), w: 4.4, w1: 3.6 }, 1);
    k.add({ type: 'tube', name: 'body-shade', mat: c, shade: 'flat', band: 2, pts: spine.slice(0, 4).map(([x, y]) => [x + 1.3, y]), w: 1.8, w1: 1.4 }, 1.05);
    if (!k.back) k.add({ type: 'tube', name: 'belly', mat: c, shade: 'flat', band: 0, pts: spine.slice(1, 4).map(([x, y]) => [x - 1.4, y]), w: 1, w1: 1 }, 1.1);
    k.add({ type: 'ring', name: 'splash', cx: base[0], cy: base[1] + 0.4, r: 4, w: 0.9, mat: pal.cloth, shade: 'flat', band: 0, scale: [1, 0.4], origin: [base[0], base[1] + 0.4] }, 1.5);
    for (const [dx, dy] of [[-5, -2], [-3.5, -4.5]]) k.add({ type: 'rect', name: 'drop', x: Math.round(base[0] + dx), y: Math.round(base[1] + dy), w: 1, h: 1, mat: pal.cloth, shade: 'flat', band: 0 }, 1.5);
    const [x, y] = spine[4], o = 0.6 + k.P.open * 1.6;
    if (!k.back) {
      // a long tapered skull pointing ahead (screen left), the lower jaw hanging open beneath it
      k.add({ type: 'path', name: 'mouth', color: 'outline', d: k.smooth([[x + 1, y + 0.6], [x - 5.5, y + 0.4], [x - 5, y + 1.6 + o], [x + 0.5, y + 2.2]]) }, 2);
      k.add({ type: 'path', name: 'jaw', underlay: true, mat: c, shade: 'flat', band: 1, d: k.smooth([[x + 2, y + 1.4], [x - 1, y + 1.6 + o * 0.4], [x - 5.2, y + 1.6 + o], [x - 4.6, y + 2.6 + o], [x - 0.5, y + 3], [x + 2, y + 2.6]]) }, 2.05);
      k.add({ type: 'path', name: 'head', underlay: true, mat: c, shade: 'flat', band: 1, d: k.smooth([[x + 2.6, y - 2.4], [x - 1, y - 2.6], [x - 5, y - 0.9], [x - 7, y + 0.2], [x - 5, y + 0.8], [x - 0.5, y + 1], [x + 2.8, y + 1.6]]) }, 2.1);
      k.add({ type: 'path', name: 'skull-top', mat: c, shade: 'flat', band: 0, d: k.smooth([[x + 1.5, y - 2.2], [x - 1, y - 2.3], [x - 4.5, y - 0.9], [x - 1, y - 1.3]]) }, 2.15);
      for (const tx of [-5, -3.5, -2]) k.add({ type: 'rect', name: 'teeth', x: Math.round(x + tx), y: Math.round(y + 1), w: 1, h: 1, mat: pal.cloth, shade: 'flat', band: 0 }, 2.2);
      k.add({ type: 'rect', name: 'eye', x: Math.round(x), y: Math.round(y - 1), w: 1, h: 1, color: 'accent.0' }, 2.3);
    } else {
      // from behind: the same skull seen from above and behind, tapering away up-left, no face
      k.add({ type: 'path', name: 'head', underlay: true, mat: c, shade: 'flat', band: 1, d: k.smooth([[x + 2.6, y + 1.8], [x + 2.4, y - 1.4], [x - 1, y - 2.8], [x - 4.6, y - 3.6], [x - 3.2, y - 1.6], [x - 0.5, y + 1.4]]) }, 2.1);
      k.add({ type: 'path', name: 'skull-top', mat: c, shade: 'flat', band: 0, d: k.smooth([[x + 1.2, y - 1.2], [x - 1, y - 2.4], [x - 3.6, y - 3.1], [x - 1.2, y - 1.2]]) }, 2.15);
    }
  }, { ground: 7, shadow: false });
}
export const anchors = ctx => groundAnchors(ctx, { head: [4, 0, 12.5], hand: [2, 0, 12] }, { ground: 7 });
