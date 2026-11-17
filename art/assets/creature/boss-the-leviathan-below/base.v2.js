// boss-the-leviathan-below base.v2 (r2, from base.v1) — SHAPE DRAFT again (shape gate), redrawn per the shape note:
// v1 read as a robot or turret on a pole (column neck on a flared base, bolted head). Changed: the body is redrawn as a
// thick S-curved coil rising from the water — the neck chain now bends in 3D (back and to one side, then forward and
// to the other) so it reads as an S in every facing, tapering to a huge toothed jaw (the head scaled up to 1.4x, the
// jaw hung wider); the flared pectoral fins and the bolted dorsal plates are gone (a smooth eel dorsal fin runs down
// the back of the neck in profile); three thick loops of coil break the surface beside it at shifting world positions
// and a tall tail fluke rises behind, so the mass is about as wide as tall. The head is the same profile head in every
// facing, turned: full profile east/west, a three-quarter turn to the viewer's left facing south and to the right
// facing north (drawn behind the neck). The angler lure stays the one bright accent (glow ramp). Flat materials, no
// proc layers but the ground shadow.
// boss-the-leviathan-below base.v1 (r1) — SHAPE DRAFT (shape gate): silhouette and form only, flat materials, no proc
// layers but the ground shadow. The Leviathan Below (glyph e, slate, a slow aquatic brute of the underdark lake), a
// unique boss of family-e (eels and deep things of the water), drawn about 110 px tall (3.1x the drawn player) in the
// 96 x 128 frame.
// Family likeness: like the family eel it rises out of a dark pool of water (cloth ramp) with a pale ring where it
// breaks the surface, its body in the grass ramp (the recoloured ramp), with a dark gaping mouth of needle teeth.
// What makes it the Leviathan, not the plain eel: MASS and the deep-sea read. A colossal neck column, thick as a tower
// (30 px at the water, 20 px under the head), carries a huge blunt gulper skull with an enormous underslung jaw hanging
// open on rows of fangs (the signature part); from the brow an ANGLER LURE stalk arches up and over the snout to a
// glowing bulb (the one bright accent, the glow ramp, with the eyes); ragged pectoral fins spread wide on both sides
// of the column; its body loops out of the water around it in two great coil arches and a raised tail fluke, so the
// silhouette is as wide as the pool (about 84 px) at the base; a row of jagged dorsal plates runs down the back of
// the neck (profile and back).
// Motion: idle breathes the jaw; the walk sways the column and swells the coils; the attack rears the head back and
// up, then drives it forward and down in an arc to a held, jaw-wide contact frame, and recovers.
// On the template's shared serpent rig (`ctx.lib.rigs.body('serpent')`, bone lengths fixed per asset): the rig gives
// the facing (yaw: sx, front), the world frame every part is drawn in (forward / side / up px from the neck's base,
// projected exactly as the rig projects) and the slither of its chain, which sways the coils. R11: ramps and tokens only.
export const meta = { brief: 'boss-the-leviathan-below', pass: 'r2', recolour: 'grass', notes: 'shape draft: S-coiled sea serpent from a pool, huge toothed jaw turned per facing, angler lure, coil loops, tail fluke' };

export const params = {
  girth: { type: 'range', min: 0.85, max: 1.15, default: 1 },
};

// state frames: head centre forward / up from the neck base (px at 96 wide), side sway, jaw opening
const HEAD = {
  idle: [[2, 74, 0, 0.55], [2, 73, 1, 0.65]],
  walk: [[2, 74, 4, 0.5], [3, 73, 0, 0.5], [2, 74, -4, 0.5], [3, 73, 0, 0.5]],
  attack: [[-8, 80, 0, 0.6], [2, 71, 0, 0.9], [10, 60, 0, 1], [4, 69, 0, 0.6]],
};

const bez = (a, b, c, d, t) => a.map((_, i) => (1 - t) ** 3 * a[i] + 3 * (1 - t) ** 2 * t * b[i] + 3 * (1 - t) * t * t * c[i] + t ** 3 * d[i]);

function layout(ctx) {
  const [w, h] = ctx.size, X = v => (v * w) / 96, G = h - 1;
  const rig = ctx.lib.rigs.body('serpent', ctx, { height: Math.round(X(24)), ground: G, proportions: { seg: 0.3 } });
  const P = rig.pose(ctx.state, ctx.t), P0 = rig.pose('idle', 0), { sx, front } = rig, tilt = 0.3;
  const view = front > 0.5 ? 'front' : front < -0.5 ? 'back' : 'side', dsg = Math.sign(sx) || 1;
  // the head's screen direction and foreshortening: profile east/west, turned to its own right (+side) otherwise
  const hdir = view === 'side' ? dsg : view === 'front' ? -1 : 1, hfx = view === 'side' ? 1 : 0.8;
  const R = X(40), ox = w / 2 - (view === 'side' ? dsg * X(2) : 0), oy = G - R * tilt;
  // world (forward, side, up px from the neck's base on the water) to screen, as the rig projects
  const W = (f, s = 0, u = 0) => [ox + X(f) * sx - X(s) * front, oy - X(u) + tilt * (X(f) * front + X(s) * sx)];
  const depth = (f, s = 0) => f * front + s * sx;
  // the rig's slither: how far a chain joint has moved from its idle rest, in px (sways the coils)
  const wave = j => { const a = P.start(`seg${j}`), b = P0.start(`seg${j}`); return (a[0] - b[0]) * 0.25 + (a[1] - b[1]) * 0.25; };
  const list = HEAD[ctx.state] ?? HEAD.idle, fi = (ctx.logical ?? ctx.frame) % list.length, [Fh, Uh, sway, open] = list[fi];
  const g = ctx.params?.girth ?? 1, N0 = 20 * g, N1 = 15 * g;
  const HS = 1.25, Sh = sway + (view === 'side' ? 0 : 10), head = W(Fh, Sh, Uh);
  // the neck: a thick S in 3D — back and to the right side, then forward and to the left, into the back of the skull
  const ends = [[10, -6, 2], [-52, 34, 20], [48, -32, Uh * 0.66], [Fh - 10, Sh, Uh - 7]];
  const neck3 = [];
  for (let i = 0; i <= 14; i++) neck3.push(bez(...ends, i / 14));
  const neck = neck3.map(p => W(...p)), nr = t => X(N0 + (N1 - N0) * t) / 2;
  const walkAmp = ctx.state === 'walk' ? 1 : 0;
  return { w, h, X, G, rig, P, sx, front, view, dsg, hdir, hfx, R, ox, oy, W, depth, wave, Fh, Uh, sway, open, HS, head, neck, neck3, nr, N0, N1, walkAmp };
}

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx);
  const { X, W, depth, view, R, ox, oy, w } = L, skin = pal.grass, water = pal.cloth;
  const items = [];
  const put = (d, nodes) => items.push({ d, nodes });
  // the pool: dark water and a pale ring at its rim
  s.add({ type: 'ellipse', name: 'pool', cx: ox, cy: oy, rx: R, ry: R * 0.3, mat: water, shade: 'flat', band: 2 });
  s.add({ type: 'ring', name: 'pool-ring', cx: ox, cy: oy, r: R - X(3), w: 1, mat: water, shade: 'flat', band: 1, scale: [1, 0.3], origin: [ox, oy] });
  // a waterline clip: everything above the line through two screen points (+1 px), so a part leaves the water cleanly
  const above = (a, b) => {
    const k = Math.abs(b[0] - a[0]) < 1 ? 0 : (b[1] - a[1]) / (b[0] - a[0]), y0 = a[1] - k * a[0] + 1, y1 = y0 + k * w;
    return { type: 'poly', pts: [[0, -10], [w, -10], [w, Math.max(y1, -9)], [0, Math.max(y0, -9)]] };
  };
  const collar = (p, rx, name = 'foam') => ({ type: 'ellipse', name, cx: p[0], cy: p[1], rx, ry: Math.max(1.5, rx * 0.3), mat: water, shade: 'flat', band: 0 });
  // loops of coil: the body arches out of the water and back in beside the neck, at fixed world places (they shift
  // round the pool as the facing turns)
  const arch = (A, B, hgt, wd, j) => {
    const sw = L.wave(j) + L.walkAmp * 2.5 * Math.sin((ctx.t + j / 8) * Math.PI * 2), hh = hgt + sw, pts = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(W(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, hh * Math.sqrt(Math.sin(Math.PI * t)) + wd * 0.1)); }
    const a = W(A[0], A[1]), b = W(B[0], B[1]);
    put(depth((A[0] + B[0]) / 2, (A[1] + B[1]) / 2), [
      { type: 'group', name: 'coil', clip: above(a, b), children: [{ type: 'tube', name: 'coil', underlay: true, mat: skin, shade: 'cyl', pts, w: X(wd), w1: X(wd * 0.8) }] },
      collar(a, X(wd * 0.6)), collar(b, X(wd * 0.5)),
    ]);
  };
  arch([34, -2], [6, -40], 13, 11, 4);
  arch([-2, 40], [-34, 14], 12, 11, 6);
  arch([-12, -16], [-30, -4], 7, 9, 2);
  // the tail fluke rising out of the water behind, tall and forked
  {
    const sw = L.wave(7) * 0.5, b = W(-28, -20), k = view === 'back' ? -1 : 1, up = (dx, dy) => [b[0] + X(dx) * k + sw, b[1] - X(dy)];
    put(depth(-28, -20), [
      { type: 'group', name: 'tail', clip: above([0, b[1]], [w, b[1]]), children: [{ type: 'tube', name: 'tail', underlay: true, mat: skin, shade: 'cyl', pts: [up(0, 0), up(1, 6), up(2, 11)], w: X(9), w1: X(6) }] },
      { type: 'path', name: 'tail-fin', underlay: true, mat: skin, shade: 'flat', band: 1, d: smooth([up(-1, 9), up(-12, 26), up(-6, 25), up(1, 33), up(5, 23), up(14, 29), up(6, 9)]) },
      collar(b, X(7)),
    ]);
  }
  // the neck: one thick S, with a smooth eel dorsal fin down its back in profile
  const neckNodes = [], headN = headNodes(L, pal), nb = L.neck[0];
  if (view === 'side') {
    const base = [], edge = [];
    for (let i = 2; i <= 12; i++) {
      const t = i / 14, [x, y] = L.neck[i], r = L.nr(t), len = X(2 + 5 * Math.sin(Math.PI * (i - 2) / 10));
      base.push([x, y]);
      edge.push([x - L.dsg * (r + len), y - X(1)]);
    }
    neckNodes.push({ type: 'poly', name: 'dorsal-fin', underlay: true, mat: skin, shade: 'flat', band: 2, pts: [...base, ...edge.reverse()] });
  }
  neckNodes.push({ type: 'group', name: 'neck', clip: above([0, nb[1]], [w, nb[1]]), children: [{ type: 'tube', name: 'neck', underlay: true, mat: skin, shade: 'cyl', pts: L.neck, w: X(L.N0), w1: X(L.N1) }] });
  neckNodes.push(collar(W(10, -6), X(L.N0 * 0.62)));
  // facing north the head is beyond the neck: draw it first
  put(0, view === 'back' ? [...headN, ...neckNodes] : [...neckNodes, ...headN]);
  for (const it of items.sort((a, b) => a.d - b.d)) for (const n of it.nodes) s.add(n);
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}

const smooth = pts => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let d = `M${m(pts[n - 1], pts[0]).join(' ')}`;
  for (let i = 0; i < n; i++) d += ` Q${pts[i].join(' ')} ${m(pts[i], pts[(i + 1) % n]).join(' ')}`;
  return d + ' Z';
};

// the head, the same in every facing: a blunt gulper skull, an enormous underslung jaw hung open, fangs, the angler
// lure and its glowing bulb — in profile, turned (hdir) and foreshortened (hfx) per facing
function headNodes(L, pal) {
  const { X, view, hdir, hfx, HS, head, open } = L, skin = pal.grass, out = [], [hx, hy] = head;
  const tooth = pal.cloth, K = v => X(v * HS);
  const P2 = pts => pts.map(([f, u]) => [hx + hdir * K(f) * hfx, hy - K(u)]);
  const a = open * 40 * Math.PI / 180, hg = [-9, -3];
  const rotJ = ([f, u]) => { const df = f - hg[0], du = u - hg[1]; return [hg[0] + df * Math.cos(a) + du * Math.sin(a), hg[1] - df * Math.sin(a) + du * Math.cos(a)]; };
  // the dark mouth between skull and jaw
  out.push({ type: 'poly', name: 'mouth', color: 'outline', pts: P2([[-10, -2], [8, -1], [26, -1], rotJ([28, -4]), rotJ([10, -4]), rotJ([-6, -4])]) });
  // the heavy lower jaw, deeper than the skull at the chin (an underbite)
  const jaw = [[-13, -1], [0, -3], [16, -3], [28, -3], [31, -8], [25, -14], [10, -16], [-4, -13], [-12, -7]].map(rotJ);
  out.push({ type: 'path', name: 'jaw', underlay: true, mat: skin, shade: 'sphere', d: smooth(P2(jaw)) });
  // the blunt skull: a high brow sloping to a broad snout
  out.push({ type: 'path', name: 'head', underlay: true, mat: skin, shade: 'sphere', d: smooth(P2([[-16, 2], [-12, 11], [-2, 15], [10, 13], [19, 9], [26, 4], [28, 0], [25, -2], [10, -1], [-4, -3], [-14, -4]])) });
  // fangs: long ones hanging from the skull, short ones up from the jaw
  for (const f of [24, 18, 12, 6]) out.push({ type: 'poly', name: 'fang', mat: tooth, shade: 'flat', band: 0, pts: P2([[f - 1.3, -1], [f + 1.3, -1], [f, -1 - (f > 15 ? 6 : 4) * (0.5 + open * 0.5)]]) });
  for (const f of [26, 20, 14]) { const b0 = rotJ([f - 1.2, -4]), b1 = rotJ([f + 1.2, -4]), tp = rotJ([f, -4 + 3.5 * (0.5 + open * 0.5)]); out.push({ type: 'poly', name: 'fang', mat: tooth, shade: 'flat', band: 0, pts: P2([b0, b1, tp]) }); }
  // the angler lure: from the brow up, over and ahead of the snout, its bulb hanging before the mouth
  const lp = P2([[-2, 14], [5, 21], [14, 23], [23, 20], [28, 14]]), bulb = P2([[29, 10]])[0];
  out.push({ type: 'tube', name: 'lure', underlay: true, mat: skin, shade: 'flat', band: 1, pts: lp, w: K(2.4), w1: K(1.5) });
  out.push({ type: 'circle', name: 'lure-bulb', underlay: true, cx: bulb[0], cy: bulb[1], r: K(3.2), mat: pal.glow, shade: 'flat', band: 1 });
  out.push({ type: 'circle', name: 'lure-core', cx: bulb[0] - K(0.8), cy: bulb[1] - K(0.8), r: K(1.3), mat: pal.glow, shade: 'flat', band: 0 });
  if (view !== 'back') {
    const e = P2([[7, 6]])[0];
    out.push({ type: 'rect', name: 'eye', x: Math.round(e[0]) - (hdir > 0 ? 0 : 1), y: Math.round(e[1]), w: 2, h: 2, color: 'glow.1' });
  }
  return out;
}

export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: L.head.map(Math.round) };
  delete a.tail;
  const K = v => L.X(v * L.HS), [hx, hy] = L.head, d = L.hdir * L.hfx;
  a.mouth = [Math.round(hx + d * K(20)), Math.round(hy + K(4 + L.open * 5))];
  if (L.view !== 'back') a.eye = [Math.round(hx + d * K(7)), Math.round(hy - K(6))];
  a.hand = a.mouth;
  return a;
};
