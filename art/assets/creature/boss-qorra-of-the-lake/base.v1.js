// boss-qorra-of-the-lake base.v1 (r1) — SHAPE DRAFT (shape gate): silhouette and form only, flat materials, no proc
// layers but the ground shadow. Qorra of the Lake (glyph S, azure, an aquatic ambusher of the underdark lake), a unique
// boss of the family-s-cap serpents, drawn about 80 px tall (2.2x the drawn player) in the 96 x 128 frame.
// Family likeness: a serpent body on the floor and a reared neck carrying a wedge head (the hood becomes a fin crown).
// What makes it Qorra, not the plain cobra-like family sprite: the classic lake-monster read — the body rises out of
// the floor in two tall ARCHED HUMPS with open space under them, a swan-like S-neck, a long eel/dragon head with a hinged
// jaw and fangs, a spiked FIN CROWN (a fan of webbed spines round the back of the skull, like a sea-dragon's frill),
// a sawtooth dorsal sail down the back of the neck, drooping catfish BARBELS from the snout and a paddle fin on the tail.
// The attack rears the head back and high, then strikes it forward and down in an arc to a held, jaw-open contact frame.
// On the template's shared serpent rig (`ctx.lib.rigs.body('serpent')`, bone lengths fixed per asset): the body follows
// joints 2..8 of the rig's chain (its wave, its lunge), the neck rises from joint 2; everything is drawn with
// `pose.at(bone, u, fwd, side, up)` so it turns with the facing. Body in one ramp (grass, the recoloured ramp, as the
// family), fins in cloth, eyes glow (R11: ramps and tokens only).
import { smooth } from '../../../lib/beast.v1.js';

export const meta = { brief: 'boss-qorra-of-the-lake', pass: 'r1', recolour: 'grass', notes: 'shape draft: lake serpent with arched humps, S-neck, fin crown, barbels, tail paddle' };

export const params = {
  girth: { type: 'range', min: 0.85, max: 1.15, default: 1 },
};

// state frames: head forward / up from the neck base (px at 96 wide), side sway, jaw opening
const HEAD = {
  idle: [[6, 63, 0, 0.1], [6, 62, 0.6, 0.15]],
  walk: [[7, 61, 2, 0.1], [8, 60, 0, 0.1], [7, 61, -2, 0.1], [8, 60, 0, 0.1]],
  attack: [[-5, 69, 0, 0.35], [8, 56, 0, 0.75], [10, 42, 0, 1], [6, 55, 0, 0.3]],
};

function layout(ctx) {
  const [w, h] = ctx.size, X = v => (v * w) / 96, G = h - 2;
  const rig = ctx.lib.rigs.body('serpent', ctx, { height: Math.round(X(24)), ground: G, proportions: { seg: 0.3 } });
  const P = rig.pose(ctx.state, ctx.t), { sx, front } = rig;
  const view = front > 0.5 ? 'front' : front < -0.5 ? 'back' : 'side', dsg = Math.sign(sx) || 1;
  const list = HEAD[ctx.state] ?? HEAD.idle, fi = (ctx.logical ?? ctx.frame) % list.length, [Fh, Uh, sway, open] = list[fi];
  const g = ctx.params?.girth ?? 1, W0 = X(11) * g, W1 = X(3);
  // a point in the head's frame: fwd / side / up px from the head centre
  const HS = 1.35, H3 = (f, s = 0, u = 0) => P.at('seg2', 0, X(Fh + f * HS), X(sway + s * HS), X(Uh + u * HS));
  const head = H3(0, 0, 0);
  // the neck: an S from the neck base on the floor (bowing back mid-way) up into the back of the skull
  const neck = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, fw = Fh * t * t - 7 * Math.sin(Math.PI * t) * (1 - 0.3 * t) - 4 * t * (1 - t), sd = sway * Math.sin(Math.PI * t) + 4 * Math.sin(Math.PI * 2 * t) * (1 - 0.5 * t);
    neck.push(P.at('seg2', 0, X(fw), X(sd), W0 / 2 + (X(Uh) - W0 / 2) * t));
  }
  // the body on the floor from joint 2 to the tail tip, snaking side to side and rising in two arched humps
  const walking = ctx.state === 'walk', ph = walking ? Math.sin(ctx.t * Math.PI * 2) : 0;
  const humps = [[0.3 + 0.05 * ph, 0.3, 17 * (1 + 0.12 * ph)], [0.64 - 0.05 * ph, 0.26, 13 * (1 - 0.12 * ph)]];
  const bump = s => humps.reduce((a, [c, wd, A]) => { const x = (s - c) / wd; return a + (Math.abs(x) < 0.5 ? X(A) * Math.cos(Math.PI * x) : 0); }, 0);
  const body = [], N = 30;
  for (let i = 0; i <= N; i++) {
    const s = i / N, js = 2 + 6 * s, j = Math.min(7, Math.floor(js)), u = js - j;
    const half = (W0 + (W1 - W0) * s) / 2, tail = s > 0.86 ? X(7) * ((s - 0.86) / 0.14) ** 2 : 0;
    const side = X(16) * Math.cos(Math.PI * (s - 0.3 - 0.04 * ph) / 0.34) * Math.min(1, s * 5);
    body.push(P.at(`seg${j}`, u, 0, side, half + bump(s) + tail));
  }
  const tipSide = X(16) * Math.cos(Math.PI * (0.7 - 0.04 * ph) / 0.34), flat = view !== 'side';
  const tip = (f, u) => P.at('seg7', 1, flat ? 0 : X(f), tipSide - (flat ? X(f) * 0.8 : 0), X(1.5 + 7 + u));
  const mouth = view === 'back' ? null : (view === 'front' ? H3(4, 0, -5 - 2 * open) : H3(12, 0, -1 - 2 * open)).map(Math.round);
  const eyes = view === 'back' ? [] : view === 'front' ? [H3(1, -3.5, 0.5), H3(1, 3.5, 0.5)] : [H3(4.5, 0, 2)];
  return { HS, w, h, X, G, rig, P, sx, front, view, dsg, Fh, Uh, sway, open, W0, W1, H3, head, neck, body, tip, mouth, eyes };
}

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx);
  const { HS, X, view, dsg, open, H3, head, neck, body, tip, W0, W1 } = L, skin = pal.grass, fin = pal.cloth;
  const add = n => s.add(n);
  const body3d = () => add({ type: 'tube', name: 'body', underlay: true, mat: skin, shade: 'cyl', pts: body, w: W0, w1: W1 });
  const fluke = () => add({ type: 'poly', name: 'tail-fin', underlay: true, mat: fin, shade: 'flat', band: 1,
    pts: [tip(1, -2), tip(-3, 7), tip(-6, 10), tip(-7, 4), tip(-9, 1), tip(-5, -3)] });
  const neck3d = () => add({ type: 'tube', name: 'neck', underlay: true, mat: skin, shade: 'cyl', pts: neck, w: W0 * 0.95, w1: X(6.5) });
  // dorsal sail: a sawtooth web down the back of the neck, drawn under the neck so only its teeth show (profile)
  const sail = () => {
    const base = [], teeth = [];
    for (let i = 2; i <= 8; i++) {
      const t = i / 10, n = neck[i], r = (W0 * 0.95 + (X(6.5) - W0 * 0.95) * t) / 2;
      const back = dsg * (r + X(i % 2 ? 2 : 5));
      base.push([n[0], n[1]]);
      teeth.push([n[0] - (view === 'side' ? back : 0), n[1] - X(i % 2 ? 0 : 2)]);
    }
    add({ type: 'poly', name: 'sail', underlay: true, mat: fin, shade: 'flat', band: 1, pts: [...base, ...teeth.reverse()] });
  };
  // the fin crown: a fan of seven webbed spines round the back of the skull (tips and valleys), swept back
  const crown = () => {
    const pts = [], R = (th, k) => X(14) * (0.65 + 0.35 * Math.cos(th)) * k;
    // in profile the fan is swept back along the neck (its side spread would fold into depth)
    const P3 = (th, k) => { const r = R(th, k) / X(1) / HS; return view === 'side' ? H3(-3 - r * (1 + 0.6 * Math.sin(th)), 0, 1.5 + Math.cos(th) * r) : H3(-3 - 0.4 * r, Math.sin(th) * r, 1.5 + Math.cos(th) * r); };
    pts.push(H3(-2, -4, -3));
    for (let i = 0; i <= 6; i++) {
      const th = (-90 + 30 * i) * Math.PI / 180;
      pts.push(P3(th, 1));
      if (i < 6) pts.push(P3(th + 15 * Math.PI / 180, 0.55));
    }
    pts.push(H3(-2, 4, -3));
    add({ type: 'poly', name: 'crown', underlay: true, mat: fin, shade: 'flat', band: 1, pts });
  };
  // catfish barbels drooping from the snout's sides
  const barbel = k => add({ type: 'tube', name: 'barbel', underlay: true, mat: skin, shade: 'flat', band: 1, w: X(2.2), w1: X(1.2),
    pts: view === 'front' ? [H3(4, 3 * k, -4), H3(4, 6 * k, -7), H3(3, 7.5 * k, -11), H3(2, 6.5 * k, -14)]
      : [H3(10, 3 * k, -1), H3(9, 4 * k, -5), H3(6, 4.5 * k, -9), H3(3.5, 4 * k, -12)] });
  const P2 = pts => pts.map(([f, u]) => [head[0] + dsg * X(f * HS), head[1] - X(u * HS)]);
  const skull = () => {
    if (view === 'side') {
      // hinged lower jaw, opened downward by `open`
      const a = open * 30 * Math.PI / 180, hg = [-3, -1.5];
      const jaw = [[-5, -1], [0, -1], [10, -1.2], [11, -2.4], [8, -4], [0, -4.4], [-4, -3.4]].map(([f, u]) => {
        const df = f - hg[0], du = u - hg[1];
        return [hg[0] + df * Math.cos(a) + du * Math.sin(a), hg[1] - df * Math.sin(a) + du * Math.cos(a)];
      });
      add({ type: 'path', name: 'jaw', underlay: true, mat: skin, shade: 'sphere', d: smooth(P2(jaw)) });
      if (open > 0.5) for (const f of [9.5, 6]) add({ type: 'poly', name: 'fang', mat: pal.skin, shade: 'flat', band: 0, pts: P2([[f - 0.9, -0.6], [f + 0.9, -0.6], [f, -3.6]]) });
      add({ type: 'path', name: 'head', underlay: true, mat: skin, shade: 'sphere', d: smooth(P2([[-6, 2], [-4, 5], [0, 5.6], [4, 4.6], [8, 2.8], [11.5, 1.6], [13, 0], [11, -1.2], [4, -1.6], [-3, -2.6], [-6.5, -1]])) });
    } else if (view === 'front') {
      const dj = open * 4;
      add({ type: 'path', name: 'jaw', underlay: true, mat: skin, shade: 'sphere', d: smooth([[0, 2 + dj], [3.6, 3 + dj], [3, 6.5 + dj], [0, 8 + dj], [-3, 6.5 + dj], [-3.6, 3 + dj]].map(([x, y]) => [head[0] + X(x * HS), head[1] + X(y * HS)])) });
      add({ type: 'path', name: 'head', underlay: true, mat: skin, shade: 'sphere', d: smooth([[0, -5.5], [5.5, -4.6], [7, -1], [5, 3], [3, 6], [0, 6.8], [-3, 6], [-5, 3], [-7, -1], [-5.5, -4.6]].map(([x, y]) => [head[0] + X(x * HS), head[1] + X(y * HS)])) });
      if (open > 0.5) {
        add({ type: 'ellipse', name: 'maw', color: 'outline', cx: head[0], cy: head[1] + X((5.5 + dj * 0.4) * HS), rx: X(2.6 * HS), ry: X((1 + dj * 0.35) * HS) });
        for (const k of [-1, 1]) add({ type: 'poly', name: 'fang', mat: pal.skin, shade: 'flat', band: 0, pts: [[head[0] + X((1.8 * k - 0.8) * HS), head[1] + X(5 * HS)], [head[0] + X((1.8 * k + 0.8) * HS), head[1] + X(5 * HS)], [head[0] + X(1.8 * k * HS), head[1] + X(8 * HS)]] });
      }
    } else {
      add({ type: 'path', name: 'head', underlay: true, mat: skin, shade: 'sphere', d: smooth([[0, -5.5], [5.5, -4.4], [6.5, -0.5], [4.5, 3.5], [0, 5], [-4.5, 3.5], [-6.5, -0.5], [-5.5, -4.4]].map(([x, y]) => [head[0] + X(x * HS), head[1] + X(y * HS)])) });
    }
  };
  const eyes = () => {
    if (view === 'back') return;
    for (const e of L.eyes) add({ type: 'rect', name: 'eye', x: Math.round(e[0]) - (view === 'side' ? (dsg > 0 ? 0 : 1) : 1), y: Math.round(e[1]), w: 2, h: 1, color: 'glow.0' });
  };
  // the rig's near side in profile: positive side is nearer when sx > 0
  const nearK = dsg;
  if (view === 'front') { body3d(); fluke(); neck3d(); crown(); skull(); barbel(-1); barbel(1); eyes(); }
  else if (view === 'back') { neck3d(); skull(); crown(); body3d(); fluke(); }
  else { fluke(); body3d(); sail(); neck3d(); barbel(-nearK); crown(); skull(); barbel(nearK); eyes(); }
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}

export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P), head: L.head.map(Math.round) };
  delete a.tail;
  if (L.mouth) a.mouth = L.mouth;
  a.hand = a.mouth ?? a.head;
  L.eyes.forEach((e, i) => { a[i ? 'eye2' : 'eye'] = e.map(Math.round); });
  return a;
};
