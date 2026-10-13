// family-e base.v3 (r3, from base.v2) — changed: the head is redrawn as a tapered eel skull (a long wedge narrowing to
// the snout, a gaping lower jaw hinged under the eye with a dark mouth and needle teeth), and the pale belly stripe the
// cylinder shading left down the body is narrowed to a 1 px pale line along the neck (body shaded flat in two tones).
// family-e base.v2 (r2, from base.v1) — changed: the spine bends into a clear S (its middle point pushed ~3 px to the
// side opposite the head, the lower point a little toward it) so the body reads as a serpent, not a stiff stalk.
// family-e base.v1 (r1) — eels and deep things of the water (glyph e, 0.8 m): a great eel on the creature rig
// (art/lib/beast.v1.js) rising out of a dark ripple on the floor: a long smooth body in an S, a fin running down its
// back, a blunt head with a gaping jaw of needle teeth and a pale eye. The body is the recoloured ramp (recolour: grass).
import { creature, groundAnchors } from '../../../lib/beast.v1.js';
export const meta = { brief: 'family-e', pass: 'r3', notes: 'great eel rising from a ripple: S body, back fin, gaping jaw', mirror: false, recolour: 'grass' };
export function render(ctx) {
  return creature(ctx, k => {
    const { pal, at, depth } = k, c = pal.grass, L = k.P.lunge * 4, sway = k.P.walking ? Math.sin(k.P.phase * Math.PI * 2) : (k.state === 'idle' ? k.frame * 0.6 : 0);
    const base = at(-1, 0, 0);
    k.add({ type: 'ellipse', name: 'ripple', cx: base[0], cy: base[1], rx: 7, ry: 3, mat: pal.grass, shade: 'flat', band: 2 }, -100);
    k.add({ type: 'ring', name: 'ripple-ring', cx: base[0], cy: base[1], r: 5, w: 0.8, mat: pal.grass, shade: 'flat', band: 1, scale: [1, 0.45], origin: base }, -99);
    const sx = ([x, y], dx) => [x + dx, y]; // a screen-x push: the head always leans to the screen left before the flip
    const spine = [at(-1, 0, 0), sx(at(-2 + sway, 0, 3), -3), sx(at(0 + sway, 0, 7), 4), at(2 + L, 0, 11), at(4 + L * 1.3, 0, 12.5 + k.P.open * 0.5)];
    k.add({ type: 'tube', name: 'fin', mat: c, shade: 'flat', band: 1, pts: spine.slice(0, 4).map(([x, y]) => [x + (k.back ? -1.6 : 1.6), y - 0.4]), w: 1.6, w1: 0.6 }, 0);
    // the body in two flat tones (lit front-left, shadowed back-right) and a 1 px pale belly line along the neck only
    k.add({ type: 'tube', name: 'body', underlay: true, mat: c, shade: 'flat', band: 1, pts: spine.slice(0, 4), w: 4.4, w1: 3.6 }, 1);
    k.add({ type: 'tube', name: 'body-shade', mat: c, shade: 'flat', band: 2, pts: spine.slice(0, 4).map(([x, y]) => [x + 1.3, y]), w: 1.8, w1: 1.4 }, 1.05);
    if (!k.back) k.add({ type: 'tube', name: 'belly', mat: c, shade: 'flat', band: 0, pts: spine.slice(1, 4).map(([x, y]) => [x - 1.4, y]), w: 1, w1: 1 }, 1.1);
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
