// boss-the-iron-choir base.v2 (r2) — DECORATE from base.v1, whose shape the owner approved: every shape's outline, the
// facings and the fork swing are unchanged; only what is inside the line changes.
// - Body on the cloth ramp (the family-c-cap recolour ramp), lit from the direction's light (top-left) as round, tapered
//   masses: cast shadows of pauldrons, gorget, arms and chest on the bell and chest, AO in the joins, a lit rim on the
//   pauldrons, helm, knees and bell lip, a light iron grain on the big masses.
// - The one bright accent on the signature part: each organ pipe's mouth is a glow.1 slot with a glow.0 core, and the
//   pipes are polished iron (metal ramp) with a lit rim.
// - A readable face on a neck: a lit face plate on the dark helm, a brow ridge over two slit eyes, the glowing "O" mouth set in a jaw plate (a seam
//   under it), and the gorget banded in rings so it reads as a neck between the pauldrons.
// - Materials on the fork: polished iron tines with a lit rim, a leather grip wrap on the stem, a darker yoke collar.
// - The bell: a raised rivet row on the girdle, an engraved band above the lip and a darker dent at the chipped notch.
// - Back facings differ inside the line: the helm's back plate seam and the windchest's grille of bellows slats.
// (v1: shape draft, flat materials.)
// boss-the-iron-choir base.v1 (r1) — SHAPE DRAFT (flat materials, no proc layers, no decoration) on the family-c-cap
// construct biped (art/lib/beast.v1.js) at 6.8 m (about 109 px, 2.9x the player as drawn) in the 96 x 128 frame.
// The Iron Choir: a slate iron construct that sings (ranged skirmisher of the dwarven holds). Its silhouette is an
// organ: two banks of three organ pipes rise from its back over each shoulder like a crown of towers, the outer pipes
// tallest, their mouths glowing (the one bright accent); a small domed cantor's helm with an open, glowing "O" mouth is
// sunk between broad round pauldrons; a barrel chest swells into a great iron BELL for a lower body, flaring to a wide
// rolled lip with one chipped notch, over short thick iron legs with knees and heavy feet. It carries a giant tuning
// fork in its right hand and, in the attack, swings it in a 160 degree arc from over its back down to strike the floor
// before it (the held contact frame). The body is the recoloured ramp (recolour: cloth), as the family's.
// Turning: the creature heads screen-left in both drawn facings, so the screen-left half of every mass is narrowed and
// the head and pipe crown slide left; from behind the fork is carried behind the body and the pipes cover the back.
import { biped, bipedAnchors, bipedLayout } from '../../../lib/beast.v1.js';
export const meta = { brief: 'boss-the-iron-choir', pass: 'r2', notes: 'decorated: lit iron masses on the cloth ramp, glowing pipe mouths, brow, slit eyes and jaw plate on a ringed neck, fork with grip wrap, riveted girdle and engraved bell', mirror: false, recolour: 'cloth' };
const H = 6.8, CX = 3;

// Per state and frame, in probe units (X/Y): the fork hand [dx from cx, dy from the shoulder line], its elbow, the fork's
// angle (0 = tines up, + clockwise) and the off hand.
const POSE = {
  idle: [
    { h: [-8.6, 8.8], e: [-10.2, 4.6], a: -8, oh: [9.4, 9.2], oe: [10.6, 4.8] },
    { h: [-8.6, 9.0], e: [-10.2, 4.8], a: -8, oh: [9.4, 9.4], oe: [10.6, 5.0] },
  ],
  walk: [
    { h: [-8.2, 8.6], e: [-10.0, 4.6], a: -14, oh: [9.8, 8.8], oe: [10.8, 4.6] },
    { h: [-8.6, 8.8], e: [-10.2, 4.6], a: -8, oh: [9.4, 9.2], oe: [10.6, 4.8] },
    { h: [-9.0, 8.8], e: [-10.4, 4.6], a: -2, oh: [9.0, 9.2], oe: [10.4, 4.8] },
    { h: [-8.6, 8.8], e: [-10.2, 4.6], a: -8, oh: [9.4, 9.2], oe: [10.6, 4.8] },
  ],
  attack: [
    { h: [-4.6, -2.6], e: [-10.0, -0.8], a: 35, oh: [9.0, 6.4], oe: [10.6, 3.2] },   // wind-up: the fork over the back
    { h: [-8.2, -0.6], e: [-10.6, 2.6], a: -35, oh: [9.2, 7.6], oe: [10.6, 4.0] },  // swing: over the head and forward
    { h: [-7.0, 7.6], e: [-10.2, 4.0], a: -125, oh: [9.4, 9.0], oe: [10.6, 4.8] },  // contact, held: tines on the floor ahead
    { h: [-8.4, 6.6], e: [-10.4, 3.8], a: -55, oh: [9.4, 9.2], oe: [10.6, 4.8] },   // recovery
  ],
};
const poseOf = ctx => { const a = POSE[ctx.state] ?? POSE.idle; return a[(ctx.logical ?? ctx.frame) % a.length]; };
const forkDir = deg => { const r = (deg * Math.PI) / 180; return [Math.sin(r), -Math.cos(r)]; };

export function render(ctx) {
  const M = {};
  return biped(ctx, k => {
    const { pal, X, Y, cx, foot, knee, waist, shoulder, headY, P, back, smooth } = k, A = poseOf(ctx), body = pal.cloth;
    // the screen-left half turns away (it heads screen-left in both facings): narrowed; the head slides left
    const fl = 0.86, sx = dx => cx + (dx < 0 ? dx * fl : dx) * k.u;
    const side = (pts, ox = 0) => smooth([...pts.map(([dx, y]) => [sx(dx) + ox, y]), ...pts.slice().reverse().map(([dx, y]) => [sx(-dx) + ox, y])]);
    const hx = cx + X(back ? -0.5 : -1), hy = headY + Y(3.2);
    const pt = ([dx, dy]) => [sx(dx), shoulder + Y(dy)];
    Object.assign(M, { X, Y, sx, hx, hy, back, shoulder, waist, hem: knee - Y(0.2) });

    // ---- the organ-pipe crown: two banks of three pipes on the back, the outer ones tallest, fanned outward
    const pipes = () => {
      const base = shoulder + Y(1.5);
      for (const s of [-1, 1]) [[3.4, 0.38], [5.3, 0.68], [7.2, 1]].forEach(([off, tall], i) => {
        const bx = hx + s * X(off) * (s < 0 ? fl : 1), top = 17 + (1 - tall) * Y(4.6) + (s < 0 ? Y(0.5) : 0), lean = s * X(0.5 + i * 0.35);
        const r = X(i === 2 ? 1.05 : 0.9);
        k.add({ type: 'capsule', name: 'pipe', underlay: true, mat: pal.metal, shade: 'cyl', a: [bx + lean, top + r], b: [bx, base], r, r1: r * 1.05 });
        // the pipe's foot: a cone narrowing into the windchest
        k.add({ type: 'path', name: 'pipe-foot', underlay: true, mat: pal.metal, shade: 'flat', band: 1, d: smooth([[bx - r, base - Y(3.2)], [bx + r, base - Y(3.2)], [bx + r * 0.4, base + Y(0.6)], [bx - r * 0.4, base + Y(0.6)]]) });
        if (!back) {
          const my = base - Y(3.2) - Y(1.3);
          k.add({ type: 'rect', name: 'pipe-mouth', x: Math.round(bx - r * 0.55 + lean * 0.15), y: Math.round(my), w: Math.max(2, Math.round(r * 1.1)), h: Math.max(2, Math.round(Y(0.9))), color: 'glow.1' });
          // the hot core of the mouth: the one bright accent, read at 1x
          k.add({ type: 'rect', name: 'pipe-mouth-core', x: Math.round(bx - r * 0.55 + lean * 0.15), y: Math.round(my), w: Math.max(1, Math.round(r * 1.1) - 1), h: 1, color: 'glow.0' });
        }
      });
      // the windchest the pipes stand in, across the upper back
      k.add({ type: 'path', name: 'windchest', underlay: true, mat: body, shade: 'normal', round: X(1.2), d: side([[0, shoulder - Y(1.4)], [3.6, shoulder - Y(1.6)], [5.6, shoulder - Y(0.4)], [5.0, shoulder + Y(2.2)], [0, shoulder + Y(2.8)]], hx - cx) });
    };

    // ---- the tuning fork: a stem in the fist, a yoke and two long tines
    const fork = () => {
      const hand = pt(A.h), d = forkDir(A.a), n = [-d[1], d[0]], at = (along, across) => [hand[0] + d[0] * X(along) + n[0] * X(across), hand[1] + d[1] * X(along) + n[1] * X(across)];
      M.forkAt = at;
      k.add({ type: 'capsule', name: 'fork-stem', underlay: true, mat: pal.metal, shade: 'cyl', a: at(-2.8, 0), b: at(1.8, 0), r: X(0.6) });
      k.add({ type: 'circle', name: 'fork-pommel', underlay: true, cx: at(-2.9, 0)[0], cy: at(-2.9, 0)[1], r: X(0.85), mat: pal.metal, shade: 'sphere' });
      k.add({ type: 'tube', name: 'fork-yoke', underlay: true, mat: pal.metal, shade: 'cyl', pts: [at(3.2, -1.9), at(2.0, -1.4), at(1.6, 0), at(2.0, 1.4), at(3.2, 1.9)], w: X(1.4), w1: X(1.4) });
      for (const s of [-1, 1]) k.add({ type: 'capsule', name: 'tine', underlay: true, mat: pal.metal, shade: 'cyl', a: at(3.0, s * 1.9), b: at(8.4, s * 1.7), r: X(0.8), r1: X(0.62) });
    };
    const arm = (sh, e, h, name) => {
      k.add({ type: 'tube', name, underlay: true, mat: body, shade: 'cyl', pts: [sh, e, h], w: X(3.0), w1: X(2.3) });
      k.add({ type: 'circle', name: 'elbow', underlay: true, cx: e[0], cy: e[1], r: X(1.3), mat: body, shade: 'sphere' });
      k.add({ type: 'ellipse', name: 'gauntlet', underlay: true, cx: h[0], cy: h[1], rx: X(1.8), ry: Y(1.7), mat: body, shade: 'sphere' });
    };
    const forkArm = () => { if (back) fork(); arm(pt([-7.4, 1.2]), pt(A.e), pt(A.h), 'fork-arm'); if (!back) fork(); };
    const offArm = () => arm(pt([7.4, 1.2]), pt(A.oe), pt(A.oh), 'off-arm');

    // ---- the head: a domed cantor's helm sunk between the pauldrons, its open "O" mouth singing
    const head = () => {
      k.add({ type: 'path', name: 'gorget', underlay: true, mat: body, shade: 'normal', round: X(1), d: side([[0, hy + Y(1.6)], [2.8, hy + Y(2)], [3.4, shoulder + Y(1.2)], [0, shoulder + Y(1.6)]], hx - cx) });
      k.add({ type: 'path', name: 'helm', underlay: true, mat: body, shade: 'sphere', d: smooth([[hx, hy - Y(4.4)], [hx + X(2.2), hy - Y(3.6)], [hx + X(3.0), hy - Y(0.8)], [hx + X(2.7), hy + Y(2.2)], [hx + X(1.4), hy + Y(3.6)], [hx, hy + Y(3.9)], [hx - X(1.3), hy + Y(3.6)], [hx - X(2.4), hy + Y(2.2)], [hx - X(2.6), hy - Y(0.8)], [hx - X(1.9), hy - Y(3.6)]]) });
      // a short finial on the dome, the same from every side
      k.add({ type: 'capsule', name: 'finial', underlay: true, mat: body, shade: 'cyl', a: [hx, hy - Y(4.2)], b: [hx, hy - Y(5.6)], r: X(0.55) });
      if (back) return;
      const t = -X(0.5);
      for (const e of [-1.2, 1.2]) k.add({ type: 'rect', name: 'eye', x: Math.round(hx + t + X(e) - X(0.5)), y: Math.round(hy - Y(0.6)), w: Math.round(X(1)), h: 1, color: 'outline' });
      k.add({ type: 'ellipse', name: 'mouth', cx: hx + t, cy: hy + Y(1.6), rx: X(0.75), ry: Y(1.05), color: 'outline' });
      k.add({ type: 'ellipse', name: 'mouth-glow', cx: hx + t, cy: hy + Y(1.7), rx: X(0.45), ry: Y(0.7), color: 'glow.0' });
      // a brow ridge shading the eye slits (drawn inside the helm, two rows above the eyes)
      k.add({ type: 'rect', name: 'brow', x: Math.round(hx + t - X(2.1)), y: Math.round(hy - Y(0.6)) - 2, w: Math.round(X(4.2)), h: 1, color: 'cloth.2' });
      k.add({ type: 'rect', name: 'brow-lit', x: Math.round(hx + t - X(2.1)), y: Math.round(hy - Y(0.6)) - 3, w: Math.round(X(3.0)), h: 1, color: 'cloth.0' });
    };

    // ---- legs: short thick iron legs below the bell, a knee cap, a tapered shin and a heavy foot
    const legs = () => P.feet.forEach((dy, i) => {
      const s = i ? 1 : -1, lift = dy * Math.max(1, Math.round(k.u)), bx = k.baseCx + CX * 0 + s * X(3.2) * (s < 0 ? fl : 1);
      const kn = [bx + s * X(0.3), knee + Y(1.2) + Math.min(0, lift) * 0.5], an = [bx, foot - Y(1.4) + lift];
      k.add({ type: 'tube', name: 'leg', underlay: true, mat: body, shade: 'cyl', pts: [[bx, waist + Y(2)], kn, an], w: X(3.6), w1: X(2.6) });
      k.add({ type: 'circle', name: 'knee', underlay: true, cx: kn[0], cy: kn[1], r: X(1.7), mat: body, shade: 'sphere' });
      k.add({ type: 'path', name: 'foot', underlay: true, mat: body, shade: 'normal', round: X(1), d: smooth([[an[0] - X(2.2), an[1] + Y(1.4)], [an[0] - X(1.6), an[1] - Y(0.6)], [an[0] + X(1.6), an[1] - Y(0.6)], [an[0] + X(2.4), an[1] + Y(1.4)]]) });
    });

    // ---- the barrel chest swelling into the bell
    const torso = () => {
      const hem = knee - Y(0.2);
      // the bell: narrow at the waist, flaring to a wide rolled lip that dips toward the viewer, one chipped notch
      k.add({ type: 'path', name: 'bell', underlay: true, mat: body, shade: 'normal', round: X(3), d: smooth([
        [sx(0), waist - Y(1.5)], [sx(5.4), waist - Y(1.4)], [sx(6.6), waist + Y(2.5)], [sx(8.0), waist + Y(5.6)], [sx(9.8), hem - Y(0.4)],
        [sx(10.2), hem + Y(0.9)], [sx(6), hem + Y(2.0)], [sx(2.2), hem + Y(2.3)], [sx(1.4), hem + Y(1.6)], [sx(0.6), hem + Y(2.4)], [sx(-4), hem + Y(2.2)], [sx(-8.4), hem + Y(1.4)], [sx(-10.2), hem + Y(0.6)],
        [sx(-9.6), hem - Y(0.6)], [sx(-8.0), waist + Y(5.6)], [sx(-6.6), waist + Y(2.5)], [sx(-5.4), waist - Y(1.4)]]) });
      // the rolled lip: a heavier band along the hem
      k.add({ type: 'tube', name: 'bell-lip', underlay: true, mat: body, shade: 'cyl', pts: [[sx(-10.0), hem + Y(0.2)], [sx(-6), hem + Y(1.2)], [sx(0), hem + Y(1.7)], [sx(6), hem + Y(1.3)], [sx(9.9), hem + Y(0.3)]], w: X(1.5), w1: X(1.3) });
      // the chest: a barrel, broad at the ribs, drawn in to the bell's waist
      k.add({ type: 'path', name: 'chest', underlay: true, mat: body, shade: 'normal', round: X(3), d: side([[0, shoulder - Y(0.6)], [4.6, shoulder - Y(0.4)], [7.4, shoulder + Y(3.2)], [7.8, shoulder + Y(7.4)], [6.4, waist - Y(2.4)], [5.0, waist], [0, waist + Y(0.4)]]) });
      // a girdle where chest meets bell
      k.add({ type: 'tube', name: 'girdle', underlay: true, mat: body, shade: 'cyl', pts: [[sx(-5.6), waist - Y(0.6)], [sx(0), waist + Y(0.2)], [sx(5.6), waist - Y(0.6)]], w: X(1.4) });
    };
    const pauldrons = () => {
      for (const s of [-1, 1]) {
        const c = [sx(s * 7.0), shoulder + Y(0.6)];
        k.add({ type: 'path', name: 'pauldron', underlay: true, mat: body, shade: 'sphere', d: smooth([[c[0] - X(3.2), c[1] + Y(1.6)], [c[0] - X(2.6), c[1] - Y(2.0)], [c[0], c[1] - Y(3.0)], [c[0] + X(2.6), c[1] - Y(2.0)], [c[0] + X(3.3), c[1] + Y(1.6)], [c[0] + s * X(1.6), c[1] + Y(3.3)], [c[0] - s * X(0.6), c[1] + Y(3.0)]]) });
      }
    };

    if (back) {
      forkArm(); offArm(); legs(); torso(); head(); pauldrons(); pipes();
    } else {
      pipes(); legs(); torso(); head(); pauldrons(); offArm(); forkArm();
    }
  }, { height: H, cx: CX, proc: (p, k) => {
    const { X, Y, sx, hx, hy, back, waist, hem } = M, t = back ? 0 : -X(0.5);
    p = p.add('castShadow', { part: ['pauldron', 'gorget', 'fork-arm', 'off-arm', 'chest', 'girdle', 'windchest'], dist: 1 })
      .add('ao', { part: ['chest', 'bell', 'gorget', 'helm'] })
      .add('materialNoise', { part: ['chest', 'bell', 'pauldron'], amount: 0.1, scale: 2 })
      .add('rimLight', { part: ['pauldron', 'helm', 'knee', 'bell-lip', 'pipe', 'tine', 'fork-yoke', 'gauntlet'], side: 'lit' })
      .add('pattern', { part: 'gorget', type: 'stripes', period: 3, axis: 'y' })
      .add('pattern', { part: 'girdle', type: 'rivets', period: 4 });
    if (back) p = p.add('pattern', { part: 'windchest', type: 'stripes', period: 3, axis: 'x' });
    // the fork: a leather grip wrap on the stem, a dark collar where the yoke meets it
    const at = M.forkAt, quad = (a0, a1, w) => ({ type: 'poly', pts: [at(a0, -w), at(a1, -w), at(a1, w), at(a0, w)] });
    // (from behind the fork is carried behind the body, so its marks are front-only)
    if (!back) p = p.add('decal', { name: 'grip', part: 'fork-stem', mat: 'leather', band: 1, shape: [quad(-2.2, -1.4, 0.5), quad(-0.9, -0.1, 0.5), quad(0.4, 1.2, 0.5)] })
      .add('decal', { name: 'collar', part: 'fork-yoke', mat: 'metal', band: 2, shape: quad(1.6, 2.3, 0.6) });
    // the bell: an engraved band above the lip and a dent at the chipped notch
    const band = [-8.6, -6, -3, 0, 3, 6, 8.6], lip = dx => hem - Y(0.9) + Y(1.2) * (1 - Math.abs(dx) / 9);
    p = p.add('decal', { name: 'engraving', part: 'bell', mat: 'cloth', band: 2, shape: { type: 'poly', pts: [...band.map(dx => [sx(dx), lip(dx) - 1.2]), ...band.slice().reverse().map(dx => [sx(dx), lip(dx)])] } })
      .add('decal', { name: 'dent', part: 'bell', mat: 'cloth', band: 2, shape: { type: 'circle', cx: sx(3.0), cy: hem - Y(0.4), r: X(0.6) } });
    if (back) {
      // the helm's back plate seam, down the dome
      p = p.add('decal', { name: 'helm-seam', part: 'helm', mat: 'cloth', band: 2, shape: { type: 'rect', x: hx - 0.5, y: hy - Y(3.6), w: 1, h: Y(6.8) } });
    } else {
      // a lit face plate on the helm's front, so the slit eyes and the mouth read at 1x; the jaw plate seam under the mouth
      p = p.add('decal', { name: 'faceplate', part: 'helm', mat: 'cloth', band: 1, shape: { type: 'ellipse', cx: hx + t, cy: hy + Y(0.8), rx: X(2.0), ry: Y(2.4) } });
      p = p.add('decal', { name: 'jaw-seam', part: 'helm', mat: 'cloth', band: 2, shape: { type: 'poly', pts: [[hx + t - X(1.8), hy + Y(2.4)], [hx + t, hy + Y(3.0)], [hx + t + X(1.8), hy + Y(2.4)], [hx + t + X(1.8), hy + Y(2.4) + 1.1], [hx + t, hy + Y(3.0) + 1.1], [hx + t - X(1.8), hy + Y(2.4) + 1.1]] } });
    }
    return p;
  } });
}

export const anchors = ctx => {
  const base = bipedAnchors(ctx, { height: H, cx: CX, face: false });
  const Lo = bipedLayout(ctx, H, { cx: CX }), A = poseOf(ctx), { X, Y, cx, back, shoulder, headY } = Lo, u = Lo.u;
  const flip = ctx.facing === 'e' || ctx.facing === 'n', fx = x => { const p = Math.round(x); return flip ? Lo.w - 1 - p : p; };
  const sx = dx => cx + (dx < 0 ? dx * 0.86 : dx) * u, hx = cx + X(back ? -0.5 : -1), hy = headY + Y(3.2);
  const hand = [sx(A.h[0]), shoulder + Y(A.h[1])], d = forkDir(A.a);
  const out = { ...base, head: [fx(hx), Math.round(hy - Y(1))], hand: [fx(hand[0]), Math.round(hand[1])], tip: [fx(hand[0] + d[0] * X(8.4)), Math.round(hand[1] + d[1] * X(8.4))] };
  if (!back) out.mouth = [fx(hx - X(0.5)), Math.round(hy + Y(1.6))];
  return out;
};
