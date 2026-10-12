// person.v1 — the shared body of the player classes and the people of the dungeon (task 6.6). FROZEN once an asset's
// version that imports it has a score (R10): a change goes into person.v2.js and the asset's next base imports that.
//
// One 32 x 40 frame, a figure about 29 px (1.8 m) tall, on the class probe's body (art/probes/classes base.v3, the
// anchor art/anchors/classes.png): egg-shaped heads, organic curved bodies, arms bent at the elbow.
//
// Facings are map directions in the 2:1 iso view (Spec 01b): map south is screen down-left, east down-right, north
// up-right, west up-left. The asset draws the figure once, turned toward the viewer's left (south); `e` is that drawing
// mirrored. The back view (`w`) is the same drawing with the face hidden and its layers reordered (what is held goes
// behind the body, what is worn on the back comes in front); `n` is that mirrored. So `s` and `n` hold the weapon in
// the right hand and `e` and `w` are mirrors, as artgen's own mirrored facings are. Set `meta.mirror = false`.
//
// Poses per state and frame (idle 2, walk 4, attack 4, hurt 2): the upper body bobs and leans, the feet step, and the
// two hands' groups turn about their shoulders: `k.main(fn)` (the right hand, on the viewer's left, and whatever it
// holds) and `k.off(fn)` (the left hand). Attack: anticipation (raised back), swing, contact (held), recovery.
//
// Use: export function render(ctx) { return person(ctx, k => { ...draw with k... }); }
//      export const anchors = ctx => personAnchors(ctx);

const POSES = {
  //            bob per frame   lean per frame   main-hand turn (deg)   off-hand turn   feet [left dy, right dy]
  idle: { bob: [0, 1], lean: [0, 0], main: [0, 2], off: [0, -2], feet: [[0, 0], [0, 0]] },
  walk: { bob: [0, -1, 0, -1], lean: [0, 0, 0, 0], main: [14, 0, -14, 0], off: [14, 0, -14, 0], feet: [[1, -1], [0, 0], [-1, 1], [0, 0]] },
  attack: { bob: [0, 0, 1, 0], lean: [1, 0, -1, 0], main: [150, 70, -20, 10], off: [-15, -5, 10, 0], feet: [[0, 0], [0, 0], [1, 0], [0, 0]] },
  hurt: { bob: [1, 0], lean: [2, 1], main: [30, 15], off: [-30, -15], feet: [[0, 0], [0, 0]] },
};

export function pose(ctx) {
  const p = POSES[ctx.state] ?? POSES.idle, f = (ctx.logical ?? ctx.frame) % p.bob.length;
  return { bob: p.bob[f], lean: p.lean[f], main: p.main[f], off: p.off[f], feet: p.feet[f] };
}

const isBack = ctx => ctx.facing === 'n' || ctx.facing === 'w';
const isFlipped = ctx => ctx.facing === 'e' || ctx.facing === 'n';

// The body's measures in the frame, upper body moved by the pose.
export function layout(ctx) {
  const [w, h] = ctx.size, X = v => (v * w) / 32, Y = v => (v * h) / 40, P = pose(ctx);
  const cx = X(16) + P.lean, up = P.bob;
  return {
    w, h, X, Y, P, cx, baseCx: X(16), back: isBack(ctx),
    foot: Y(38), knee: Y(31), waist: Y(25) + up, shoulder: Y(17) + up, headY: Y(11.5) + up,
    L: cx - X(8), R: cx + X(8), // the hands at rest: the right hand on the viewer's left, the left on the right
    mainShoulder: [cx - X(5), Y(18.2) + up], offShoulder: [cx + X(5), Y(18.2) + up],
  };
}

// a smooth closed curve through the points (quadratics through the midpoints), so nothing has a hard corner
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

function kit(ctx) {
  const { pal } = ctx.dir, Lo = layout(ctx), { X, Y, cx, P, back } = Lo;
  const s = ctx.lib.t2.scene(...ctx.size);
  // layers: `worn` (on the back), `body` in call order (with the hand groups' slots), then reordered for the back view
  const worn = [], body = [], held = [];
  let into = body;
  const add = n => { into.push(n); return n; };
  const collect = fn => { const prev = into, list = []; into = list; fn(); into = prev; return list; };
  const turnFace = back ? 0 : -1; // the face turned a pixel toward the viewer's left (south)

  const k = {
    ...Lo, pal, ctx, add, smooth, state: ctx.state, frame: ctx.frame,
    // a symmetric shape from its right side: [dx, y] from the top centre down to the bottom centre
    sym: (side, ox = cx) => smooth([...side.map(([dx, y]) => [ox + X(dx), y]), ...side.slice().reverse().map(([dx, y]) => [ox - X(dx), y])]),
    shape: (name, mat, side, extra = {}) => add({ type: 'path', name, underlay: true, mat, shade: 'normal', round: X(2), d: k.sym(side), ...extra }),
    // the legs from the hips to the feet, the feet stepping by the pose
    legs: (mat, spread = 2.4, thick = 1.6) => {
      P.feet.forEach((dy, i) => {
        const kk = i ? 1 : -1;
        add({ type: 'capsule', name: 'leg', underlay: true, mat, shade: 'cyl', a: [cx + kk * X(spread - 0.6), Lo.waist], b: [Lo.baseCx + kk * X(spread), Lo.foot - Y(1.5) + dy], r: X(thick), r1: X(thick * 0.75) });
      });
    },
    boots: mat => P.feet.forEach((dy, i) => add({ type: 'ellipse', name: 'boot', cx: Lo.baseCx + (i ? 1 : -1) * X(2.8), cy: Lo.foot - Y(1) + dy, rx: X(2), ry: Y(1.4), mat, shade: 'sphere' })),
    neck: () => add({ type: 'capsule', name: 'neck', mat: pal.skin, shade: 'cyl', a: [cx, Lo.headY + Y(2)], b: [cx, Lo.shoulder], r: X(1.3) }),
    // a head of its own shape: `wide` the cranium's half-width, `crown` its height above the eyes, `jaw` the half-width
    // at the jaw line, `chin` how far the chin drops below the eyes and `point` how sharp it is (0 round, 1 pointed).
    // From behind, `hair` (a ramp, default the hair ramp) covers the head and no face is drawn.
    head: (y = Lo.headY, o = {}) => {
      const wd = X(o.wide ?? 3.3), cr = Y(o.crown ?? 4.6), jw = X(o.jaw ?? 1.6), ch = Y(o.chin ?? 4.4), pt = o.point ?? 0.3;
      const d = smooth([[cx, y - cr], [cx + wd, y - cr * 0.85], [cx + wd * 0.97, y + Y(1)], [cx + jw, y + ch * 0.85], [cx + jw * (1 - pt) * 0.6, y + ch], [cx - jw * (1 - pt) * 0.6, y + ch], [cx - jw, y + ch * 0.85], [cx - wd * 0.97, y + Y(1)], [cx - wd, y - cr * 0.85]]);
      add({ type: 'path', name: 'head', underlay: true, mat: pal.skin, shade: 'sphere', d });
      if (o.ears !== false) add({ type: 'ellipse', name: 'ear', cx: cx - wd, cy: y + Y(0.5), rx: X(0.8), ry: Y(1.2), mat: pal.skin, shade: 'flat', band: 1, mirrorX: cx });
      if (back) {
        if (o.hair !== false) add({ type: 'path', name: 'back-hair', mat: o.hair ?? pal.hair, shade: 'sphere', d: smooth([[cx, y - cr], [cx + wd, y - cr * 0.85], [cx + wd * 0.97, y + Y(1)], [cx + jw, y + ch * 0.7], [cx - jw, y + ch * 0.7], [cx - wd * 0.97, y + Y(1)], [cx - wd, y - cr * 0.85]]) });
        return;
      }
      const ex = X(o.eyes ?? 2);
      for (const e of [-ex, ex]) add({ type: 'rect', name: 'eye', x: Math.round(cx + e + turnFace), y: Math.round(y), w: 1, h: 1, color: o.eye ?? 'outline' });
      add({ type: 'rect', name: 'nose', x: Math.round(cx + turnFace), y: Math.round(y + Y(1.5)), w: 1, h: Math.max(1, Math.round(Y(o.nose ?? 1))), mat: pal.skin, shade: 'flat', band: 2 });
    },
    // an arm from a shoulder to a hand, bent at the elbow (side -1 the right arm on the viewer's left, 1 the left)
    arm: (side, mat, hx, hy, opts = {}) => {
      const sx = cx + side * X(opts.wide ?? 5), sy = Lo.shoulder + Y(1.2), ex = (sx + hx) / 2 + side * X(1.5), ey = (sy + hy) / 2 + Y(0.5), r = X(opts.r ?? 1.3);
      add({ type: 'capsule', name: 'upper-arm', underlay: true, mat, shade: 'cyl', a: [sx, sy], b: [ex, ey], r, r1: r * 0.9 });
      add({ type: 'capsule', name: 'forearm', underlay: true, mat, shade: 'cyl', a: [ex, ey], b: [hx, hy], r: r * 0.9, r1: r * 0.8 });
      if (opts.hand !== false) add({ type: 'circle', name: 'hand', cx: hx, cy: hy, r: X(1.1), mat: opts.glove ?? pal.skin, shade: 'sphere' });
    },
    pole: (mat, x0, y0, x1, y1, r = 0.7, name = 'pole') => add({ type: 'capsule', name, underlay: true, mat, shade: 'cyl', a: [x0, y0], b: [x1, y1], r: X(r) }),
    // the right hand's group (arm and what it holds), turned about the right shoulder by the pose; behind the body from the back
    main: fn => { const g = { type: 'group', name: 'main-hand', rotate: P.main, origin: Lo.mainShoulder, children: collect(fn) }; held.push(g); add(g); },
    off: fn => { const g = { type: 'group', name: 'off-hand', rotate: P.off, origin: Lo.offShoulder, children: collect(fn) }; held.push(g); add(g); },
    // worn on the back (a lute, a quiver, a cloak's fall): behind the body from the front, over it from the back
    worn: fn => { worn.push(...collect(fn)); },
    // only in one view
    front: fn => { if (!back) fn(); },
    rear: fn => { if (back) fn(); },
    // where a point held in the right hand ends up this frame
    mainAt: pt => rot(pt, Lo.mainShoulder, P.main),
  };
  const finish = () => {
    const order = back ? [...held, ...body.filter(n => !held.includes(n)), ...worn] : [...worn, ...body];
    for (const n of order) s.add(n);
    return s;
  };
  return { k, finish };
}

/** Draw the figure for this cell: `draw(k)` adds the class's body, head, dress and gear through the kit. */
export function person(ctx, draw, opts = {}) {
  const { k, finish } = kit(ctx);
  draw(k);
  let proc = ctx.lib.proc(finish());
  if (opts.proc) proc = opts.proc(proc, k);
  const g = proc.add('groundShadow', {}).render();
  return isFlipped(ctx) ? g.flip('x') : g;
}

/**
 * Named points per cell, on the drawn pixels: `head`, `hand` (the right hand, exported for effects and held props),
 * and on the facings where the face shows, the face anchors `eye`, `eye2` and `mouth` the finishing pass paints at.
 * `hand` is where the right hand rests before the pose turns it (default the probe's L + 1 at the waist).
 */
export function personAnchors(ctx, opts = {}) {
  const Lo = layout(ctx), { X, Y, cx, w } = Lo, back = isBack(ctx), flip = isFlipped(ctx);
  const hy = Lo.headY + Y(opts.headDy ?? 0), ex = X(opts.eyes ?? 2), turn = back ? 0 : -1;
  const handRest = opts.hand ? opts.hand(Lo) : [Lo.L + X(1), Lo.waist];
  const pts = { head: [cx, hy - Y(1)], hand: rot(handRest, Lo.mainShoulder, Lo.P.main) };
  if (!back && opts.face !== false) {
    pts.eye = [cx - ex + turn, hy];
    pts.eye2 = [cx + ex + turn, hy];
    pts.mouth = [cx + turn, hy + Y(3)];
  }
  const out = {};
  for (const [name, [x, y]] of Object.entries(pts)) {
    const px = Math.round(x), py = Math.round(y);
    out[name] = [flip ? w - 1 - px : px, py];
  }
  return out;
}
