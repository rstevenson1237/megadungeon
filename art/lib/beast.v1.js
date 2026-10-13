// beast.v1 — the shared rigs of the monster families (task 6.6). FROZEN once an asset's version that imports it has
// a score (R10): a change goes into beast.v2.js and the asset's next base imports that.
//
// Facings and poses follow art/lib/person.v1.js: facings are map directions in the 2:1 iso view (south = screen
// down-left, east down-right, north up-right, west up-left); the asset draws `s` (toward the viewer, heading down-left)
// and `w` (away, heading up-left); `e` and `n` are those mirrored. Set `meta.mirror = false`. States idle 2, walk 4,
// attack 4 (anticipation, swing, contact held, recovery).
//
// Sizes follow the size table (Spec 01b): 16 px a metre, feet on the frame's bottom (2 px up for the ground shadow).
// Family sprites are recoloured per row in game: draw the body in ONE ramp (the asset's `meta.recolour`), which must
// stay the dominant ramp, so the row's colour token becomes the creature's main hue (art direction rule).
//
// Two rigs:
//  - creature(ctx, draw): a ground frame for animals and things. `k.at(u, v, h)` is the screen point `u` px ahead along
//    the heading, `v` px to the creature's right and `h` px up, from the creature's centre on the ground; `k.add(node,
//    depth)` sorts parts back to front by depth (use the ground point's screen y: `k.depth(u, v)`). One drawing serves
//    both views because the heading itself turns: toward the viewer in front, away from the viewer from behind.
//  - biped(ctx, draw, { height }): the person body (person.v1) scaled to a height in metres, for upright monsters;
//    the same kit (legs, head, arm, main, off, worn, front, rear) with every measure scaled.

export const METRE = 16;
const isBack = ctx => ctx.facing === 'n' || ctx.facing === 'w';
const isFlipped = ctx => ctx.facing === 'e' || ctx.facing === 'n';

const POSES = {
  idle: { bob: [0, 1], lean: [0, 0], main: [0, 2], off: [0, -2], feet: [[0, 0], [0, 0]], lunge: [0, 0], open: [0, 0], phase: null },
  walk: { bob: [0, -1, 0, -1], lean: [0, 0, 0, 0], main: [14, 0, -14, 0], off: [14, 0, -14, 0], feet: [[1, -1], [0, 0], [-1, 1], [0, 0]], lunge: [0, 0, 0, 0], open: [0, 0, 0, 0], phase: [0, 0.25, 0.5, 0.75] },
  attack: { bob: [0, 0, 1, 0], lean: [1, 0, -1, 0], main: [150, 70, -20, 10], off: [-15, -5, 10, 0], feet: [[0, 0], [0, 0], [1, 0], [0, 0]], lunge: [-0.12, 0.05, 0.3, 0.08], open: [0.3, 0.6, 1, 0.3], phase: null },
};

export function pose(ctx) {
  const p = POSES[ctx.state] ?? POSES.idle, n = p.bob.length, f = (ctx.logical ?? ctx.frame) % n;
  return { bob: p.bob[f], lean: p.lean[f], main: p.main[f], off: p.off[f], feet: p.feet[f], lunge: p.lunge[f], open: p.open[f], phase: p.phase ? p.phase[f] : null, walking: !!p.phase };
}

export const smooth = pts => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let d = `M${m(pts[n - 1], pts[0]).join(' ')}`;
  for (let i = 0; i < n; i++) d += ` Q${pts[i].join(' ')} ${m(pts[i], pts[(i + 1) % n]).join(' ')}`;
  return d + ' Z';
};
const rot = ([x, y], [ox, oy], deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [ox + (x - ox) * c - (y - oy) * s, oy + (x - ox) * s + (y - oy) * c];
};
const finishGrid = (ctx, s, opts, k) => {
  let proc = ctx.lib.proc(s);
  if (opts.proc) proc = opts.proc(proc, k);
  if (opts.shadow !== false) proc = proc.add('groundShadow', opts.shadow ?? {});
  const g = proc.render();
  return isFlipped(ctx) ? g.flip('x') : g;
};

// ---------------------------------------------------------------- creature: a ground frame, parts sorted by depth

export function creature(ctx, draw, opts = {}) {
  const { pal } = ctx.dir, [w, h] = ctx.size, P = pose(ctx), back = isBack(ctx);
  // heading and the creature's right on screen (unit vectors in px): front heads down-left, back heads up-left
  const F = back ? [-0.894, -0.447] : [-0.894, 0.447], Rt = back ? [0.894, -0.447] : [-0.894, -0.447];
  const g0 = [w / 2 + (opts.cx ?? 0), h - (opts.ground ?? 6)];
  const parts = [];
  let seq = 0;
  const k = {
    pal, ctx, w, h, P, back, F, Rt, smooth, state: ctx.state, frame: ctx.frame,
    ground: g0,
    at: (u, v = 0, ht = 0) => [g0[0] + F[0] * u + Rt[0] * v, g0[1] + F[1] * u + Rt[1] * v - ht - P.bob * (ht > 0 ? 1 : 0)],
    depth: (u, v = 0) => g0[1] + F[1] * u + Rt[1] * v,
    add: (node, depth = 0) => { parts.push({ node, depth, seq: seq++ }); return node; },
    // a walking leg's foot offset along the heading and lift, for a leg of phase offset `ph` (0..1)
    step: (ph, stride = 2, lift = 1) => {
      if (!P.walking) return { du: 0, dh: 0 };
      const a = (P.phase + ph) * Math.PI * 2;
      return { du: Math.sin(a) * stride, dh: Math.max(0, Math.cos(a)) * lift };
    },
    // a limb from a body point to a foot on the ground, its knee bent outward
    leg: (name, mat, hip, foot, r, depthBias = 0, opts2 = {}) => {
      const knee = [(hip[0] + foot[0]) / 2 + (opts2.kneeX ?? 0), (hip[1] + foot[1]) / 2 + (opts2.kneeY ?? -1)];
      k.add({ type: 'capsule', name, underlay: true, mat, shade: 'cyl', a: hip, b: knee, r, r1: r * 0.85 }, foot[1] + depthBias);
      k.add({ type: 'capsule', name, underlay: true, mat, shade: 'cyl', a: knee, b: foot, r: r * 0.85, r1: r * 0.65 }, foot[1] + depthBias + 0.01);
    },
  };
  draw(k);
  const s = ctx.lib.t2.scene(w, h);
  parts.sort((a, b) => a.depth - b.depth || a.seq - b.seq).forEach(p => s.add(p.node));
  return finishGrid(ctx, s, opts, k);
}

/** Anchors for a creature: `head` and `hand` (the mouth or striking point) given in the ground frame by the asset. */
export function creatureAnchors(ctx, pts) {
  const [w, h] = ctx.size, flip = isFlipped(ctx), out = {};
  for (const [name, [x, y]] of Object.entries(pts)) out[name] = [flip ? w - 1 - Math.round(x) : Math.round(x), Math.round(y)];
  return out;
}

// ---------------------------------------------------------------- biped: the person body scaled to a height

export function bipedLayout(ctx, height = 1.8, opts = {}) {
  const [w, h] = ctx.size, P = pose(ctx), u = (height * METRE) / 28.8; // the person's 28.8 px is 1.8 m
  const X = v => v * u, Y = v => v * u, foot = h - 2, up = P.bob * Math.max(1, Math.round(u));
  const baseCx = w / 2 + (opts.cx ?? 0), cx = baseCx + P.lean * Math.max(1, Math.round(u));
  // the person's measures, from the feet up: knee 7, waist 13, shoulder 21, eyes 26.5 probe units
  return {
    w, h, X, Y, u, P, cx, baseCx, back: isBack(ctx),
    foot, knee: foot - Y(7), waist: foot - Y(13) + up, shoulder: foot - Y(21) + up, headY: foot - Y(26.5) + up,
    L: cx - X(8), R: cx + X(8),
    mainShoulder: [cx - X(5), foot - Y(19.8) + up], offShoulder: [cx + X(5), foot - Y(19.8) + up],
  };
}

export function biped(ctx, draw, opts = {}) {
  const { pal } = ctx.dir, Lo = bipedLayout(ctx, opts.height, opts), { X, Y, cx, P, back } = Lo;
  const s = ctx.lib.t2.scene(...ctx.size);
  const worn = [], body = [], held = [];
  let into = body;
  const add = n => { into.push(n); return n; };
  const collect = fn => { const prev = into, list = []; into = list; fn(); into = prev; return list; };
  const turn = back ? 0 : -Math.max(1, Math.round(Lo.u)); // the face turned toward the viewer's left
  const k = {
    ...Lo, pal, ctx, add, smooth, turn, state: ctx.state, frame: ctx.frame,
    sym: (side, ox = cx) => smooth([...side.map(([dx, y]) => [ox + X(dx), y]), ...side.slice().reverse().map(([dx, y]) => [ox - X(dx), y])]),
    shape: (name, mat, side, extra = {}) => add({ type: 'path', name, underlay: true, mat, shade: 'normal', round: X(2), d: k.sym(side), ...extra }),
    legs: (mat, spread = 2.4, thick = 1.6) => P.feet.forEach((dy, i) => {
      const kk = i ? 1 : -1;
      add({ type: 'capsule', name: 'leg', underlay: true, mat, shade: 'cyl', a: [cx + kk * X(spread - 0.6), Lo.waist], b: [Lo.baseCx + kk * X(spread), Lo.foot - Y(1.5) + dy * Math.max(1, Math.round(Lo.u))], r: X(thick), r1: X(thick * 0.75) });
    }),
    boots: (mat, rx = 2, ry = 1.4) => P.feet.forEach((dy, i) => add({ type: 'ellipse', name: 'boot', cx: Lo.baseCx + (i ? 1 : -1) * X(2.8), cy: Lo.foot - Y(1) + dy * Math.max(1, Math.round(Lo.u)), rx: X(rx), ry: Y(ry), mat, shade: 'sphere' })),
    neck: (mat = pal.skin) => add({ type: 'capsule', name: 'neck', mat, shade: 'cyl', a: [cx, Lo.headY + Y(2)], b: [cx, Lo.shoulder], r: X(1.3) }),
    // a head (as person.v1): from behind, `hair` covers it and no face is drawn; `eyeColor` a token for the eyes
    head: (y = Lo.headY, o = {}) => {
      const wd = X(o.wide ?? 3.3), cr = Y(o.crown ?? 4.6), jw = X(o.jaw ?? 1.6), ch = Y(o.chin ?? 4.4), pt = o.point ?? 0.3, mat = o.mat ?? pal.skin;
      const d = smooth([[cx, y - cr], [cx + wd, y - cr * 0.85], [cx + wd * 0.97, y + Y(1)], [cx + jw, y + ch * 0.85], [cx + jw * (1 - pt) * 0.6, y + ch], [cx - jw * (1 - pt) * 0.6, y + ch], [cx - jw, y + ch * 0.85], [cx - wd * 0.97, y + Y(1)], [cx - wd, y - cr * 0.85]]);
      add({ type: 'path', name: 'head', underlay: true, mat, shade: 'sphere', d });
      if (o.ears) add({ type: 'path', name: 'ear', underlay: true, mat, shade: 'flat', band: 1, mirrorX: cx, d: smooth([[cx - wd * 0.9, y - Y(1)], [cx - wd - X(o.ears), y - Y(o.earUp ?? 1.5)], [cx - wd * 0.9, y + Y(1.5)]]) });
      if (back) {
        if (o.hair !== false) add({ type: 'path', name: 'back-hair', mat: o.hair ?? pal.hair, shade: 'sphere', d: smooth([[cx, y - cr], [cx + wd, y - cr * 0.85], [cx + wd * 0.97, y + Y(1)], [cx + jw, y + ch * 0.7], [cx - jw, y + ch * 0.7], [cx - wd * 0.97, y + Y(1)], [cx - wd, y - cr * 0.85]]) });
        return;
      }
      const ex = X(o.eyes ?? 2), es = Math.max(1, Math.round(Y(o.eyeSize ?? 1)));
      for (const e of [-ex, ex]) add({ type: 'rect', name: 'eye', x: Math.round(cx + e + turn), y: Math.round(y), w: es, h: es, color: o.eye ?? 'outline' });
      if (o.nose !== false) add({ type: 'rect', name: 'nose', x: Math.round(cx + turn), y: Math.round(y + Y(1.5)), w: 1, h: Math.max(1, Math.round(Y(o.nose ?? 1))), mat, shade: 'flat', band: 2 });
    },
    arm: (side, mat, hx, hy, o = {}) => {
      const sx = cx + side * X(o.wide ?? 5), sy = Lo.shoulder + Y(1.2), ex = (sx + hx) / 2 + side * X(1.5), ey = (sy + hy) / 2 + Y(0.5), r = X(o.r ?? 1.3);
      add({ type: 'capsule', name: 'upper-arm', underlay: true, mat, shade: 'cyl', a: [sx, sy], b: [ex, ey], r, r1: r * 0.9 });
      add({ type: 'capsule', name: 'forearm', underlay: true, mat, shade: 'cyl', a: [ex, ey], b: [hx, hy], r: r * 0.9, r1: r * 0.8 });
      if (o.hand !== false) add({ type: 'circle', name: 'hand', cx: hx, cy: hy, r: X(o.handR ?? 1.1), mat: o.glove ?? mat, shade: 'sphere' });
    },
    pole: (mat, x0, y0, x1, y1, r = 0.7, name = 'pole') => add({ type: 'capsule', name, underlay: true, mat, shade: 'cyl', a: [x0, y0], b: [x1, y1], r: X(r) }),
    main: fn => { const g = { type: 'group', name: 'main-hand', rotate: P.main, origin: Lo.mainShoulder, children: collect(fn) }; held.push(g); add(g); },
    off: fn => { const g = { type: 'group', name: 'off-hand', rotate: P.off, origin: Lo.offShoulder, children: collect(fn) }; held.push(g); add(g); },
    worn: fn => { worn.push(...collect(fn)); },
    front: fn => { if (!back) fn(); },
    rear: fn => { if (back) fn(); },
    mainAt: pt => rot(pt, Lo.mainShoulder, P.main),
  };
  draw(k);
  const order = back ? [...held, ...body.filter(n => !held.includes(n)), ...worn] : [...worn, ...body];
  for (const n of order) s.add(n);
  return finishGrid(ctx, s, opts, k);
}

/** Anchors of a biped: head, hand (the right hand's rest point turned by the pose) and, from the front, the eyes. */
export function bipedAnchors(ctx, opts = {}) {
  const Lo = bipedLayout(ctx, opts.height, opts), { X, Y, cx, w } = Lo, back = isBack(ctx), flip = isFlipped(ctx);
  const hy = Lo.headY + Y(opts.headDy ?? 0), ex = X(opts.eyes ?? 2), turn = back ? 0 : -Math.max(1, Math.round(Lo.u));
  const handRest = opts.hand ? opts.hand(Lo) : [Lo.L + X(1), Lo.waist];
  const pts = { head: [cx, hy - Y(1)], hand: rot(handRest, Lo.mainShoulder, Lo.P.main) };
  if (!back && opts.face !== false) { pts.eye = [cx - ex + turn, hy]; pts.eye2 = [cx + ex + turn, hy]; pts.mouth = [cx + turn, hy + Y(3)]; }
  const out = {};
  for (const [name, [x, y]] of Object.entries(pts)) { const px = Math.round(x); out[name] = [flip ? w - 1 - px : px, Math.round(y)]; }
  out.ground = [w / 2 + (opts.cx ?? 0), Math.round(Lo.foot)]; // where it stands: the game puts this on the cell's centre
  return out;
}

/** Anchors of a creature given in its ground frame: { name: [u, v, h] } (as `k.at`), turned for the facing, and `ground`. */
export function groundAnchors(ctx, pts, opts = {}) {
  const [w, h] = ctx.size, back = isBack(ctx), P = pose(ctx);
  const F = back ? [-0.894, -0.447] : [-0.894, 0.447], Rt = back ? [0.894, -0.447] : [-0.894, -0.447];
  const g0 = [w / 2 + (opts.cx ?? 0), h - (opts.ground ?? 6)], L = (opts.lunge ?? 0) * P.lunge, out = {};
  for (const [name, [u, v, ht]] of Object.entries(pts)) out[name] = [g0[0] + F[0] * (u + L) + Rt[0] * v, g0[1] + F[1] * (u + L) + Rt[1] * v - ht];
  // where it stands (the ground frame's centre): the game puts this on the cell's centre, the same in every facing
  return { ...creatureAnchors(ctx, out), ground: [g0[0], g0[1]] };
}
