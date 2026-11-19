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
export const meta = { brief: 'boss-the-leviathan-below', pass: 'r1', recolour: 'grass', notes: 'shape draft: tower neck from a pool, gulper skull with a huge open jaw, angler lure, wide fins, coil arches' };

export const params = {
  girth: { type: 'range', min: 0.85, max: 1.15, default: 1 },
};

// state frames: head centre forward / up from the neck base (px at 96 wide), side sway, jaw opening
const HEAD = {
  idle: [[3, 64, 0, 0.35], [3, 63, 1, 0.45]],
  walk: [[3, 64, 4, 0.3], [4, 63, 0, 0.3], [3, 64, -4, 0.3], [4, 63, 0, 0.3]],
  attack: [[-10, 68, 0, 0.55], [4, 60, 0, 0.85], [11, 50, 0, 1], [4, 60, 0, 0.5]],
};

const bez = (a, b, c, d, t) => a.map((_, i) => (1 - t) ** 3 * a[i] + 3 * (1 - t) ** 2 * t * b[i] + 3 * (1 - t) * t * t * c[i] + t ** 3 * d[i]);

function layout(ctx) {
  const [w, h] = ctx.size, X = v => (v * w) / 96, G = h - 1;
  const rig = ctx.lib.rigs.body('serpent', ctx, { height: Math.round(X(24)), ground: G, proportions: { seg: 0.3 } });
  const P = rig.pose(ctx.state, ctx.t), P0 = rig.pose('idle', 0), { sx, front } = rig, tilt = 0.3;
  const view = front > 0.5 ? 'front' : front < -0.5 ? 'back' : 'side', dsg = Math.sign(sx) || 1;
  const R = X(40), ox = w / 2 - (view === 'side' ? dsg * X(6) : 0), oy = G - R * tilt;
  // world (forward, side, up px from the neck's base on the water) to screen, as the rig projects
  const W = (f, s = 0, u = 0) => [ox + X(f) * sx - X(s) * front, oy - X(u) + tilt * (X(f) * front + X(s) * sx)];
  const depth = (f, s = 0) => f * front + s * sx;
  // the rig's slither: how far a chain joint has moved from its idle rest, in px (sways the coils)
  const wave = j => { const a = P.start(`seg${j}`), b = P0.start(`seg${j}`); return (a[0] - b[0]) * 0.25 + (a[1] - b[1]) * 0.25; };
  const list = HEAD[ctx.state] ?? HEAD.idle, fi = (ctx.logical ?? ctx.frame) % list.length, [Fh, Uh, sway, open] = list[fi];
  const g = ctx.params?.girth ?? 1, N0 = 30 * g, N1 = 20 * g;
  const HS = 1.2, head = W(Fh, sway, Uh);
  // the neck: a heavy S from the water, leaning back then forward into the back of the skull
  const ends = [[0, 0, 4], [-6, sway * 0.3, 28], [Fh - 16, sway, Uh - 26], [Fh - 8, sway, Uh - 6]];
  const neck3 = [];
  for (let i = 0; i <= 12; i++) neck3.push(bez(...ends, i / 12));
  const neck = neck3.map(p => W(...p)), nr = t => X(N0 + (N1 - N0) * t) / 2;
  const walkAmp = ctx.state === 'walk' ? 1 : 0;
  return { w, h, X, G, rig, P, sx, front, view, dsg, R, ox, oy, W, depth, wave, Fh, Uh, sway, open, HS, head, neck, neck3, nr, N0, N1, walkAmp };
}

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx);
  const { X, W, depth, view, dsg, HS, head, open, R, ox, oy, w } = L, skin = pal.grass, water = pal.cloth;
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
  // coil arches: the body loops out of the water and back in, round the column
  const arch = (name, A, B, hgt, wd, j) => {
    const sw = L.wave(j) + L.walkAmp * 2 * Math.sin((ctx.t + j / 8) * Math.PI * 2), hh = hgt + sw, pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(W(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, hh * Math.sin(Math.PI * t) + wd * 0.15)); }
    const a = W(A[0], A[1]), b = W(B[0], B[1]);
    put(depth((A[0] + B[0]) / 2, (A[1] + B[1]) / 2), [
      { type: 'group', name: 'coil', clip: above(a, b), children: [{ type: 'tube', name: 'coil', underlay: true, mat: skin, shade: 'cyl', pts, w: X(wd), w1: X(wd * 0.85) }] },
      collar(a, X(wd * 0.6)), collar(b, X(wd * 0.55)),
    ]);
  };
  arch('coil', [8, 10], [-16, 28], 16, 10, 4);
  arch('coil', [-10, -6], [-38, -14], 15, 10, 6);
  // the tail fluke rising out of the water behind
  {
    const sw = L.wave(7) * 0.5, b = W(-6, -33), up = (dx, dy) => [b[0] + X(dx) + sw, b[1] - X(dy)];
    put(depth(-6, -33), [
      { type: 'group', name: 'tail', clip: above([0, b[1]], [w, b[1]]), children: [{ type: 'tube', name: 'tail', underlay: true, mat: skin, shade: 'cyl', pts: [up(0, 0), up(1, 5), up(1, 8)], w: X(7), w1: X(5) }] },
      { type: 'path', name: 'tail-fin', underlay: true, mat: skin, shade: 'flat', band: 1, d: smooth([up(-2, 6), up(-13, 22), up(-7, 20), up(-1, 30), up(4, 20), up(12, 25), up(4, 6)]) },
      collar(b, X(6)),
    ]);
  }
  // ragged pectoral fins spread wide from the column's sides, swept back
  const fin = k => {
    const pts = [[2, 12, 38], [-8, 30, 36], [-14, 40, 31], [-14, 31, 25], [-22, 44, 22], [-18, 32, 18], [-24, 36, 13], [-10, 18, 15], [-4, 12, 22]]
      .map(([f, sd, u]) => W(f, sd * k, u + (L.walkAmp ? Math.sin((ctx.t + (k > 0 ? 0 : 0.5)) * Math.PI * 2) * 2 : 0)));
    put(depth(-10, 28 * k), [{ type: 'path', name: 'fin', underlay: true, mat: skin, shade: 'flat', band: 1, d: smooth(pts) }]);
  };
  fin(1); fin(-1);
  // the neck column, the dorsal plates, the head
  const neckNodes = [];
  const nb = L.neck[0];
  if (view === 'side') {
    // jagged dorsal plates down the back of the neck, behind it so only their teeth show
    const base = [], teeth = [];
    for (let i = 2; i <= 10; i++) {
      const t = i / 12, [x, y] = L.neck[i], r = L.nr(t), len = X(i % 2 ? 4 : 9);
      base.push([x, y]);
      teeth.push([x - dsg * (r + len), y - X(i % 2 ? 0 : 3)]);
    }
    neckNodes.push({ type: 'poly', name: 'plates', underlay: true, mat: skin, shade: 'flat', band: 2, pts: [...base, ...teeth.reverse()] });
  }
  neckNodes.push({ type: 'group', name: 'neck', clip: above([0, nb[1]], [w, nb[1]]), children: [{ type: 'tube', name: 'neck', underlay: true, mat: skin, shade: 'cyl', pts: L.neck, w: X(L.N0), w1: X(L.N1) }] });
  neckNodes.push(collar(W(0, 0), X(L.N0 * 0.62)));
  if (view === 'back') {
    // the dorsal plates seen from behind: a ridge of hooked plates down the middle of the column
    for (let i = 3; i <= 10; i += 1) {
      const [x, y] = L.neck[i], r = X(i % 2 ? 3 : 4.5);
      neckNodes.push({ type: 'poly', name: 'plates', underlay: true, mat: skin, shade: 'flat', band: 2, pts: [[x - r, y + r * 0.8], [x, y - r * 1.4], [x + r, y + r * 0.8]] });
    }
  }
  neckNodes.push(...headNodes(L, pal));
  put(0, neckNodes);
  for (const it of items.sort((a, b) => a.d - b.d)) for (const n of it.nodes) s.add(n);
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}

const smooth = pts => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let d = `M${m(pts[n - 1], pts[0]).join(' ')}`;
  for (let i = 0; i < n; i++) d += ` Q${pts[i].join(' ')} ${m(pts[i], pts[(i + 1) % n]).join(' ')}`;
  return d + ' Z';
};

// the head: a blunt gulper skull, an enormous underslung jaw, fangs, the angler lure and its glowing bulb
function headNodes(L, pal) {
  const { X, view, dsg, HS, head, open } = L, skin = pal.grass, out = [], [hx, hy] = head;
  const tooth = pal.cloth, K = v => X(v * HS);
  const lure = (pts, bulb) => {
    out.push({ type: 'tube', name: 'lure', underlay: true, mat: skin, shade: 'flat', band: 1, pts, w: K(2.6), w1: K(1.6) });
    out.push({ type: 'circle', name: 'lure-bulb', underlay: true, cx: bulb[0], cy: bulb[1], r: K(3.4), mat: pal.glow, shade: 'flat', band: 1 });
    out.push({ type: 'circle', name: 'lure-core', cx: bulb[0] - K(0.8), cy: bulb[1] - K(0.8), r: K(1.4), mat: pal.glow, shade: 'flat', band: 0 });
  };
  if (view === 'side') {
    const P2 = pts => pts.map(([f, u]) => [hx + dsg * K(f), hy - K(u)]);
    const a = open * 34 * Math.PI / 180, hg = [-9, -3];
    const rotJ = ([f, u]) => { const df = f - hg[0], du = u - hg[1]; return [hg[0] + df * Math.cos(a) + du * Math.sin(a), hg[1] - df * Math.sin(a) + du * Math.cos(a)]; };
    // the dark mouth between skull and jaw
    out.push({ type: 'poly', name: 'mouth', color: 'outline', pts: P2([[-10, -2], [8, -1], [25, -1], rotJ([27, -4]), rotJ([10, -4]), rotJ([-6, -4])]) });
    // the heavy lower jaw, deeper than the skull at the chin (an underbite)
    const jaw = [[-13, -1], [0, -3], [16, -3], [27, -3], [29, -7], [24, -12], [10, -14], [-4, -12], [-12, -7]].map(rotJ);
    out.push({ type: 'path', name: 'jaw', underlay: true, mat: skin, shade: 'sphere', d: smooth(P2(jaw)) });
    // the blunt skull: a high brow sloping to a broad snout
    out.push({ type: 'path', name: 'head', underlay: true, mat: skin, shade: 'sphere', d: smooth(P2([[-16, 2], [-12, 11], [-2, 15], [10, 13], [19, 9], [25, 4], [27, 0], [24, -2], [10, -1], [-4, -3], [-14, -4]])) });
    // fangs: long ones hanging from the skull, short ones up from the jaw
    for (const f of [23, 17, 11, 5]) out.push({ type: 'poly', name: 'fang', mat: tooth, shade: 'flat', band: 0, pts: P2([[f - 1.3, -1], [f + 1.3, -1], [f, -1 - (f > 15 ? 6 : 4) * (0.5 + open * 0.5)]]) });
    for (const f of [25, 19, 13]) { const b0 = rotJ([f - 1.2, -4]), b1 = rotJ([f + 1.2, -4]), tp = rotJ([f, -4 + 3.5 * (0.5 + open * 0.5)]); out.push({ type: 'poly', name: 'fang', mat: tooth, shade: 'flat', band: 0, pts: P2([b0, b1, tp]) }); }
    // the angler lure: from the brow up, over and ahead of the snout, its bulb hanging before the mouth
    lure(P2([[-2, 14], [4, 23], [13, 27], [22, 25], [28, 17]]), P2([[29, 13]])[0]);
    const e = P2([[7, 6]])[0];
    out.push({ type: 'rect', name: 'eye', x: Math.round(e[0]) - (dsg > 0 ? 0 : 1), y: Math.round(e[1]), w: 2, h: 2, color: 'glow.1' });
  } else if (view === 'front') {
    const p = (x, y) => [hx + K(x), hy + K(y)], dj = open * 10;
    lure([p(0, -11), p(-2, -20), p(2, -27), p(9, -27), p(12, -22)], p(12, -18));
    out.push({ type: 'path', name: 'jaw', underlay: true, mat: skin, shade: 'sphere', d: smooth([[-21, 2], [21, 2], [23, 9 + dj], [16, 15 + dj], [0, 18 + dj], [-16, 15 + dj], [-23, 9 + dj]].map(([x, y]) => p(x, y))) });
    out.push({ type: 'ellipse', name: 'mouth', color: 'outline', cx: hx, cy: hy + K(8 + dj * 0.5), rx: K(17), ry: K(4 + dj * 0.45) });
    out.push({ type: 'path', name: 'head', underlay: true, mat: skin, shade: 'sphere', d: smooth([[0, -11], [8, -12], [15, -9], [24, -7], [21, -2], [19, 5], [12, 8], [0, 9], [-12, 8], [-19, 5], [-21, -2], [-24, -7], [-15, -9], [-8, -12]].map(([x, y]) => p(x, y))) });
    for (const x of [-12, -6, 0, 6, 12]) out.push({ type: 'poly', name: 'fang', mat: tooth, shade: 'flat', band: 0, pts: [p(x - 1.3, 8), p(x + 1.3, 8), p(x, 8 + (Math.abs(x) === 6 ? 6 : 4) * (0.5 + open * 0.5))] });
    for (const x of [-14, -5, 5, 14]) { const yb = 12 + dj * 0.95; out.push({ type: 'poly', name: 'fang', mat: tooth, shade: 'flat', band: 0, pts: [p(x - 1.2, yb), p(x + 1.2, yb), p(x, yb - 3.5 * (0.5 + open * 0.5))] }); }
    for (const x of [-15, 15]) { const e = p(x, -4); out.push({ type: 'rect', name: 'eye', x: Math.round(e[0]) - 1, y: Math.round(e[1]), w: 3, h: 2, color: 'glow.1' }); }
  } else {
    const p = (x, y) => [hx + K(x), hy + K(y)];
    // from behind: the stalk rises from the far brow over the top, the bulb hanging out beyond the skull
    lure([p(0, -8), p(1, -20), p(-3, -27), p(-9, -26)], p(-10, -22));
    out.push({ type: 'path', name: 'head', underlay: true, mat: skin, shade: 'sphere', d: smooth([[0, -11], [8, -12], [15, -9], [24, -7], [21, -1], [20, 6], [12, 11], [0, 12], [-12, 11], [-20, 6], [-21, -1], [-24, -7], [-15, -9], [-8, -12]].map(([x, y]) => p(x, y))) });
    // a ridge of plates down the back of the skull into the neck's
    for (const y of [-8, -2, 4]) out.push({ type: 'poly', name: 'plates', underlay: true, mat: skin, shade: 'flat', band: 2, pts: [p(-3.5, y + 3), p(0, y - 3.5), p(3.5, y + 3)] });
  }
  return out;
}

export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: L.head.map(Math.round) };
  delete a.tail;
  const K = v => L.X(v * L.HS), [hx, hy] = L.head;
  if (L.view === 'side') { a.mouth = [Math.round(hx + L.dsg * K(20)), Math.round(hy + K(4 + L.open * 4))]; a.eye = [Math.round(hx + L.dsg * K(7)), Math.round(hy - K(6))]; }
  else if (L.view === 'front') { a.mouth = [Math.round(hx), Math.round(hy + K(8 + L.open * 5))]; a.eye = [Math.round(hx - K(15)), Math.round(hy - K(3))]; a.eye2 = [Math.round(hx + K(15)), Math.round(hy - K(3))]; }
  a.hand = a.mouth ?? a.head;
  return a;
};
