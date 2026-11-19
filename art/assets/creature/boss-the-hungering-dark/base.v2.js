// boss-the-hungering-dark base.v2 (r2, from base.v1) — DECORATION PASS on the approved shape (silhouette unchanged).
// One thing changed: the flat materials become lit forms. Light from the direction's light (upper left): the body and
// hump are a `normal`-shaded round mass, the orb, hand knuckles, great eye and stalk eyes `sphere`, tentacles, arms,
// stalks, neck and claws `cyl` along their length so they read as tapering round masses (no flat slabs, no pillow
// shading). The maw's gullet is dark leather (not an outline-black fill) with bone fangs; the great eye is a lit bone
// ball with the glowing iris (the one bright accent, on the signature face) and a glint; claws are horn on the hair ramp.
// Proc layers: light hide noise, a rim light on the lit side, AO, and decals on named parts — front: old claw scars on
// the body; back (w/n): a dark ridged hide crest along the hump and a scarred, mottled orb back, so the facings differ
// inside the line. Body stays on the skin ramp (recolour: skin) like family-a-cap.
// boss-the-hungering-dark base.v1 (r1) — SHAPE DRAFT, flat materials, no proc layers. The Hungering Dark (glyph A,
// slate, an aberration ambusher of the void halls), a unique boss of family-a-cap (the eye tyrants) drawn at 7.5 m
// (about 120 px, 3.2x the drawn player) on the shared biped rig (`ctx.lib.rigs.body`). From the family it keeps the
// great round orb, the single great eye over a wide fanged maw and the crown of eye-tipped stalks; what makes it the boss:
// the orb no longer floats — it hangs low and forward on a short thick neck from a vast hunched body of hide, a pear with
// a great hump over the shoulders that flares into a skirt of thick, splayed tentacles dragging on the floor (no legs),
// and two long knuckle-dragging arms bent at the elbow, each ending in three huge hooked claws. The signature is the
// hunger: the maw is exaggerated — the lower jaw hangs open below the orb as its own piece, a dark gap of fangs between,
// and gapes wider at the attack's contact. The one bright accent is the great eye's glowing iris. The attack raises the
// right claw high behind the orb and rakes it down and forward in an arc (contact frame held). The body is built from
// rings around the rig's spine, so it turns with the facing: drawn facings are three-quarter views, s toward the lower
// left (front) and w toward the upper left (back); e and n are those mirrored. The hide is the recoloured ramp
// (recolour: skin, as the family), so the row's slate becomes its main hue.
export const meta = { brief: 'boss-the-hungering-dark', pass: 'r2', notes: 'decorated: hunched orb-headed hulk, hump, tentacle skirt, long hooked-claw arms, hanging fanged jaw, eye-stalk crown', mirror: false, recolour: 'skin' };

const YAW = { s: 'sw', w: 'nw', e: 'sw', n: 'nw' }; // e and n are the s and w drawings flipped
const FLIP = { e: true, n: true };
const HEIGHT_M = 7.5;

// the right claw's hand target per frame (rig side plane: x forward, y down, from the hip), and the left's
const GRIP = {
  idle: [[0.2, 0.08], [0.2, 0.09]],
  walk: [[0.25, 0.06], [0.2, 0.09], [0.13, 0.06], [0.2, 0.09]],
  attack: [[-0.06, -0.72], [0.22, -0.66], [0.42, -0.08], [0.32, -0.02]],
};
const OFF = {
  idle: [[0.16, 0.1], [0.16, 0.11]],
  walk: [[0.12, 0.06], [0.18, 0.09], [0.24, 0.06], [0.18, 0.09]],
  attack: [[0.24, -0.04], [0.22, 0.0], [0.08, 0.06], [0.16, 0.08]],
};
const JAW = { idle: [0.5, 0.55], walk: [0.5, 0.5, 0.5, 0.5], attack: [0.7, 0.85, 1.25, 0.7] }; // how far the jaw hangs open

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, ground = h - 2, H = Math.round(HEIGHT_M * metre);
  const U = v => v * H, flip = !!FLIP[ctx.facing];
  const rig = ctx.lib.rigs.body('biped', ctx, { facing: YAW[ctx.facing] ?? 'sw', ground, height: H,
    proportions: { head: 0.24, neck: 0.06, arm_up: 0.23, arm_lo: 0.25, leg_up: 0.12, leg_lo: 0.12, armSep: 0.2, legSep: 0.1 } });
  const state = GRIP[ctx.state] ? ctx.state : 'idle', fr = (ctx.logical ?? ctx.frame) % GRIP[state].length;
  const [gx, gy] = GRIP[state][fr], [ox, oy] = OFF[state][fr % OFF[state].length], jaw = JAW[state][fr % JAW[state].length];
  const base = rig.pose(ctx.state, ctx.t);
  // the hunch: the spine leans well forward, the neck carries the orb out ahead, the head drops back nearly level
  const lean = state === 'attack' ? [-24, -30, -44, -38][fr] : -36;
  const P = rig.pose(ctx.state, ctx.t, {
    angles: { spine: (base.angles.spine ?? 0) + lean, neck: (base.angles.neck ?? 0) - 30, head: (base.angles.head ?? 0) + 50 },
    ik: { armR_lo: { target: [U(gx), U(gy)], bend: -1 }, armL_lo: { target: [U(ox), U(oy)], bend: -1 } },
  });
  const head = P.at('head', 0.5, U(0.02), 0, 0), orbR = U(0.19);
  // the hunch carries the orb far ahead of the hips: the whole figure sits back by the hump's depth so it stays in frame
  const fwdX = Math.sign(P.at('hip', 0, U(0.1), 0, 0)[0] - P.at('hip', 0, 0, 0, 0)[0]) || -1, dx = -fwdX * U(0.085) * (rig.front < 0 ? 0.8 : 1);
  return { w, h, H, U, rig, P, flip, state, fr, jaw, front: rig.front, ground, head, orbR, fwdX, dx };
}

// a closed smooth path through points (quadratic curves between the midpoints)
const smooth = pts => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let d = `M${m(pts[n - 1], pts[0]).join(' ')}`;
  for (let i = 0; i < n; i++) d += ` Q${pts[i].join(' ')} ${m(pts[i], pts[(i + 1) % n]).join(' ')}`;
  return d + ' Z';
};

// the screen outline of a stack of rings (top first): each ring's leftmost and rightmost projected point, so the mass
// turns with the facing; the last ring's lower half closes the bottom
function ringOutline(rings, H0 = 0) {
  const left = [], right = [], A = 20;
  let low = [];
  rings.forEach((ring, ri) => {
    const pts = [];
    for (let i = 0; i < A; i++) {
      const a = (i / A) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      pts.push(ring.at(c * (c > 0 ? ring.rf : ring.rb), sn * ring.rs));
    }
    const l = pts.reduce((p, q) => (q[0] < p[0] ? q : p)), r = pts.reduce((p, q) => (q[0] > p[0] ? q : p));
    left.push(l); right.push(r);
    if (ri === rings.length - 1) low = pts.filter(p => p[1] >= (l[1] + r[1]) / 2 - 0.5).sort((p, q) => p[0] - q[0]);
  });
  const jag = [0.05, -0.01, 0.07, 0.0, 0.045, -0.015, 0.065, 0.01, 0.04];
  return [...left, ...low.slice(1, -1).map((p, i) => [p[0], p[1] + jag[i % jag.length] * H0]), ...right.reverse()];
}

function draw(ctx) {
  const { pal } = ctx.dir, scene = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), kids = [], s = { add: n => kids.push(n) }, { U, P, front, ground, head, orbR, jaw } = L;
  const hide = pal.skin, bone = pal.cloth, horn = pal.hair, back = front < 0;
  const B = (f, up, z) => P.at('hip', 0, f, z, up);
  const sp = (u, f, z) => P.at('spine', u, f, z, 0), nk = (u, f, z) => P.at('neck', u, f, z, 0);
  const cap = (name, a, b, r, r1, mat = hide, extra = {}) => ({ type: 'capsule', name, underlay: !/^(stalk|tentacle)$/.test(name), a, b, r, r1, mat, shade: 'cyl', ...extra });
  const dirOf = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
  // screen x per unit of forward: the heading's sign on screen (s faces left, w faces left)
  const fwdX = Math.sign(B(U(0.1), 0, 0)[0] - B(0, 0, 0)[0]) || -1;

  // the body: a pear on the spine — a great hump over the shoulders, a heavy belly, flaring into the tentacle skirt
  const ring = (fn, cf, rf, rb, rs) => ({ at: (f, z) => fn(cf + f, z), rf: U(rf), rb: U(rb), rs: U(rs) });
  const body = ringOutline([
    ring((f, z) => nk(0.2, f, z), U(0.0), 0.09, 0.12, 0.13),
    ring((f, z) => sp(0.97, f, z), U(-0.05), 0.15, 0.26, 0.27),
    ring((f, z) => sp(0.78, f, z), U(-0.04), 0.19, 0.29, 0.3),
    ring((f, z) => sp(0.5, f, z), U(0.0), 0.21, 0.23, 0.26),
    ring((f, z) => sp(0.15, f, z), U(0.01), 0.22, 0.22, 0.28),
    ring((f, z) => B(f, U(-0.13), z), 0, 0.26, 0.26, 0.34),
  ], L.H);

  // the tentacle skirt: thick tapering tentacles from under the belly, splayed wide to the floor, curling at the tips;
  // their feet step with the rig's legs
  const tent = [
    ['legL_lo', -0.14, -0.24, -0.18, -0.42, 0.07], ['legL_lo', 0.14, -0.16, 0.2, -0.34, 0.075], ['legL_lo', 0.02, -0.08, 0.06, -0.18, 0.07],
    ['legR_lo', 0.12, 0.14, 0.22, 0.3, 0.075], ['legR_lo', -0.12, 0.24, -0.16, 0.42, 0.07], ['legR_lo', 0.02, 0.06, 0.08, 0.16, 0.07],
    ['legL_lo', -0.22, 0.02, -0.36, 0.06, 0.06],
  ].map(([leg, f0, z0, ft, zt, r]) => {
    const zl = leg === 'legL_lo' ? -U(0.1) : U(0.1), a = B(U(f0), U(-0.02), U(z0)), e = P.at(leg, 1, U(ft), U(zt) - zl, 0);
    const tip = [e[0], Math.min(ground - 1, e[1])], mid = [(a[0] + tip[0]) / 2 + (tip[0] - a[0]) * 0.25, (a[1] + tip[1]) / 2 + U(0.04)];
    const curl = [tip[0] + Math.sign(tip[0] - a[0] || 1) * U(0.05), tip[1] - U(0.035)];
    return { depth: e[1], parts: [cap('tentacle', a, mid, U(r), U(r * 0.8)), cap('tentacle', mid, tip, U(r * 0.8), U(r * 0.45)), cap('tentacle', tip, curl, U(r * 0.45), U(0.008))] };
  }).sort((p, q) => p.depth - q.depth);

  // arms: long, thick, bent at the elbow, three great hooked claws at each hand
  const arm = side => {
    const up = `arm${side}_up`, lo = `arm${side}_lo`, hand = P.end(lo), elbow = P.end(up), sh = P.start(up);
    const d = dirOf(elbow, hand), n = [-d[1], d[0]];
    const parts = [cap('upper-arm', sh, elbow, U(0.08), U(0.062)), cap('forearm', elbow, hand, U(0.062), U(0.045)),
      { type: 'circle', name: 'hand', cx: hand[0], cy: hand[1], r: U(0.055), mat: hide, shade: 'sphere' }];
    for (const k of [-1, 0, 1]) {
      const base = [hand[0] + d[0] * U(0.025) + n[0] * k * U(0.03), hand[1] + d[1] * U(0.025) + n[1] * k * U(0.03)];
      const mid = [base[0] + d[0] * U(0.1) + n[0] * k * U(0.03), base[1] + d[1] * U(0.1) + n[1] * k * U(0.03)];
      const tip = [mid[0] + d[0] * U(0.05) - n[0] * U(0.05) * fwdX, mid[1] + d[1] * U(0.05) - n[1] * U(0.05) * fwdX];
      parts.push(cap('claw', base, mid, U(0.024), U(0.016), horn), cap('claw', mid, tip, U(0.016), U(0.005), horn));
    }
    return { type: 'group', name: `arm-${side}`, underlay: true, children: parts };
  };
  const [farArm, nearArm] = P.far(['armL_up', 'armR_up']).map(n => n[3]);

  // the orb and its crown of stalks (behind the orb seen from the front, over it seen from behind)
  const [hx, hy] = head, fx = fwdX * (back ? -1 : 1);
  const stalks = [[-60, -34], [-30, -22], [0, 14], [30, 26], [58, 36]].map(([a, curl], i) => {
    // each stalk arcs: its angle turns by `curl` along its length, so the crown writhes rather than fans out
    const len = U(0.13 + 0.05 * ((i * 3) % 4) / 3), wig = Math.sin(ctx.t * Math.PI * 2 + i * 1.3) * 6;
    const pt = (u, r) => { const t = ((a + curl * u * u + wig * u) * fx * -1 - 90) * Math.PI / 180; return [hx + Math.cos(t) * r - fx * U(0.05) * u, hy + Math.sin(t) * r]; };
    const a0 = pt(0, orbR * 0.75), a1 = pt(0.4, orbR + len * 0.35), a2 = pt(0.75, orbR + len * 0.7), a3 = pt(1, orbR + len);
    return [cap('stalk', a0, a1, U(0.036), U(0.03)), cap('stalk', a1, a2, U(0.03), U(0.024)), cap('stalk', a2, a3, U(0.024), U(0.018)),
      { type: 'circle', name: 'stalk-eye', underlay: true, cx: a3[0], cy: a3[1], r: U(0.038), mat: bone, shade: 'sphere' }];
  });
  const crown = () => stalks.forEach(st => s.add({ type: 'group', name: 'stalks', underlay: true, children: st }));

  // the hanging jaw: a heavy crescent under the orb's front, dropped open by `jaw`
  const jf = fwdX * (back ? 0.4 : 1), jawDrop = U(0.09) * jaw, jw = orbR * 0.95;
  const jc = [hx + jf * orbR * 0.35, hy + orbR * 0.55 + jawDrop];
  const jawPath = smooth([[jc[0] - jw, jc[1] - U(0.03)], [jc[0], jc[1] + U(0.005)], [jc[0] + jw, jc[1] - U(0.03)], [jc[0] + jw * 0.8, jc[1] + U(0.045)], [jc[0] + jf * jw * 0.2, jc[1] + U(0.1)], [jc[0] - jw * 0.8, jc[1] + U(0.05)]]);

  // draw, back to front
  s.add(arm(farArm));
  if (!back) crown();
  for (const t of tent) s.add({ type: 'group', name: 'tentacles', underlay: true, children: t.parts });
  s.add({ type: 'path', name: 'body', underlay: true, mat: hide, shade: 'normal', round: U(0.12), d: smooth(body) });
  // the neck: a thick stump from the hump into the back of the orb
  s.add(cap('neck', P.start('neck'), [hx - fx * orbR * 0.2, hy], U(0.1), U(0.11), hide));
  if (!back) {
    // the maw's gap between orb and jaw, its fangs, then the jaw
    s.add({ type: 'ellipse', name: 'maw', cx: jc[0], cy: hy + orbR * 0.45 + jawDrop * 0.5, rx: jw * 0.9, ry: orbR * 0.32 + jawDrop * 0.5, mat: pal.leather, shade: 'flat', band: 2 });
    for (const k of [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75]) {
      const x = jc[0] + k * jw * 0.9, yU = hy + orbR * 0.5, yL = jc[1] - U(0.02), lu = U(0.03 + 0.02 * jaw * (1 - Math.abs(k))), ll = U(0.025 + 0.015 * jaw);
      s.add({ type: 'poly', name: 'fang', mat: bone, shade: 'cyl', axis: 'y', pts: [[x - U(0.014), yU - 1], [x, yU + lu], [x + U(0.014), yU - 1]] });
      s.add({ type: 'poly', name: 'fang', mat: bone, shade: 'cyl', axis: 'y', pts: [[x - U(0.012) + U(0.012), yL + 1], [x + U(0.012), yL - ll], [x + U(0.024), yL + 1]] });
    }
    s.add({ type: 'path', name: 'jaw', underlay: true, mat: hide, shade: 'normal', round: U(0.04), d: jawPath });
  }
  // the orb: front facing cut by the maw's upper lip (drawn whole, the maw gap shows under it)
  s.add({ type: 'path', name: 'orb', underlay: true, mat: hide, shade: 'sphere',
    d: back ? smooth(Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return [hx + Math.cos(a) * orbR, hy + Math.sin(a) * orbR]; }))
      : smooth([...Array.from({ length: 11 }, (_, i) => { const a = Math.PI * (0.95 + i * 0.11); return [hx + Math.cos(a) * orbR, hy + Math.sin(a) * orbR]; }),
        [hx + orbR * 0.98, hy + orbR * 0.3], [jc[0] + jw * 0.6, hy + orbR * 0.5], [jc[0], hy + orbR * 0.55], [jc[0] - jw * 0.6, hy + orbR * 0.5], [hx - orbR * 0.98, hy + orbR * 0.32]]) });
  if (!back) {
    // the great eye over the maw: pale with a glowing iris (the one bright accent) and a slit pupil
    const ex = hx + fwdX * orbR * 0.28, ey = hy - orbR * 0.18;
    s.add({ type: 'ellipse', name: 'eye', underlay: true, cx: ex, cy: ey, rx: orbR * 0.42, ry: orbR * 0.34, mat: bone, shade: 'sphere' });
    s.add({ type: 'circle', name: 'iris', cx: ex + fwdX * U(0.008), cy: ey, r: orbR * 0.26, mat: pal.glow, shade: 'sphere' });
    s.add({ type: 'ellipse', name: 'pupil', cx: ex + fwdX * U(0.008), cy: ey, rx: U(0.01), ry: orbR * 0.2, color: 'outline' });
    // a small glint on the iris toward the light (upper left), so the eye reads as a wet ball
    s.add({ type: 'circle', name: 'glint', cx: ex - U(0.022), cy: ey - U(0.02), r: U(0.009), mat: pal.glow, shade: 'flat', band: 0 });
    // a heavy brow of hide over the eye's top, so it glares
    s.add({ type: 'path', name: 'brow', mat: hide, shade: 'cyl', axis: 'x', d: smooth([[ex - orbR * 0.5, ey - orbR * 0.42], [ex + orbR * 0.5, ey - orbR * 0.42], [ex + orbR * 0.48, ey - orbR * 0.22], [ex, ey - orbR * 0.16 + (L.state === 'attack' && L.fr === 2 ? U(0.02) : 0)], [ex - orbR * 0.48, ey - orbR * 0.28]]) });
  }
  if (back) crown();
  s.add(arm(nearArm));
  scene.add({ type: 'group', name: 'figure', translate: [L.dx, 0], children: kids });
  // S2: hide texture, a rim on the lit side, contact AO, and marks as decals on their parts (frame pixels: + dx)
  const X = x => x + L.dx, bodyTop = sp(0.85, 0, 0), bodyMid = sp(0.45, 0, 0);
  const pr = ctx.lib.proc(scene)
    .add('materialNoise', { part: 'body', amount: 0.12, scale: U(0.05) })
    .add('rimLight', { side: 'left' })
    .add('ao', {});
  if (!back) {
    // three old raking scars across the belly, from a rival's claws (dark leather slashes)
    const sc = [0, 1, 2].map(i => {
      const c = [X(bodyMid[0]) + (i - 1) * U(0.045) - U(0.07), bodyMid[1] + U(0.04) + i * U(0.012)];
      return { type: 'poly', pts: [[c[0] - U(0.04), c[1] - U(0.045)], [c[0] - U(0.03), c[1] - U(0.05)], [c[0] + U(0.035), c[1] + U(0.045)], [c[0] + U(0.025), c[1] + U(0.05)]] };
    });
    pr.add('decal', { name: 'scars', part: 'body', mat: 'leather', band: 2, shape: sc });
  } else {
    // the back: a crest of dark ridged hide plates along the hump's spine, and mottled scar patches on the orb's back
    const ridge = [0.95, 0.82, 0.69, 0.56, 0.43, 0.3].map((u, i) => {
      const c = sp(u, -U(0.06), 0); const r = U(0.05 - i * 0.004);
      return { type: 'poly', pts: [[X(c[0]) - r, c[1] + r * 0.5], [X(c[0]) - r * 0.2, c[1] - r * 0.9], [X(c[0]) + r, c[1] + r * 0.3], [X(c[0]), c[1] + r * 0.8]] };
    });
    pr.add('decal', { name: 'crest', part: 'body', mat: 'leather', band: 2, shape: ridge });
    const spots = [[-0.45, -0.3, 0.16], [0.2, -0.5, 0.12], [0.4, 0.15, 0.14], [-0.15, 0.35, 0.11], [-0.55, 0.25, 0.09]]
      .map(([ax, ay, r]) => ({ type: 'circle', cx: X(hx + ax * orbR), cy: hy + ay * orbR, r: r * orbR }));
    pr.add('decal', { name: 'mottle', part: 'orb', mat: 'leather', band: 'keep', shape: spots });
  }
  return { grid: pr.render(), L };
}

export function render(ctx) {
  const { grid, L } = draw(ctx);
  return L.flip ? grid.flip('x') : grid;
}

// head (the great eye's centre), hand (the right claw) and mouth, mirrored with the drawing for e and n
export const anchors = ctx => {
  const L = layout(ctx), fx = x => (L.flip ? L.w - 1 - Math.round(x + L.dx) : Math.round(x + L.dx));
  const hand = L.P.end('armR_lo');
  return { head: [fx(L.head[0]), Math.round(L.head[1])], hand: [fx(hand[0]), Math.round(hand[1])], mouth: [fx(L.head[0]), Math.round(L.head[1] + L.orbR * 0.6)] };
};
