// boss-the-lantern-man base.v2 (r2) — from base.v1 (shape approved by the owner): DECORATION PASS, silhouette kept.
// What changed, all inside the line: the shroud and hood are lit as round masses on the grass ramp (shroud `normal`
// with a wide round, hood `sphere`), arms, tails, the crook's pole and hook are `cyl` tubes, the lantern is a bevelled
// metal cage around a sphere-lit glow; the front shows a gaunt face (skin ramp, glowing eye-points, a dark mouth) set
// on a thin neck inside the hood's dark void; the back shows the hood's seam and a fold down the hump; proc layers add
// ao under the hood and arms, a lit-side rim light on the shroud and hood, faint material noise on the shroud, and
// decals (a soot stain on the hem and a darker tattered band on the hood edge).
// boss-the-lantern-man base.v1 (r1) — SHAPE DRAFT, flat materials, no proc layers. The Lantern Man: the ghost ambusher of
// the catacombs, a unique boss of family-w-cap (the wraiths) drawn at 4.1 m on the shared biped rig (`ctx.lib.rigs.body`).
// From the family it keeps the deep empty hood, the legless shroud that thins into ragged tails on the floor and the long
// reaching claw-arms; what makes it the boss: a stooped, hunched body (a hump of shroud over the shoulders, the hood thrust
// forward on a long neck), and a tall shepherd's crook held out ahead of it with a lantern dangling from the hook — the lure
// it walks with. The attack raises the crook back over the hood and swings it down in an arc, the lantern flung forward
// (contact frame held). The shroud is built from rings around the rig's spine, so it is a pear (narrow chest, a barrel hump,
// flaring to an uneven hem) that turns with the body: the drawn facings are three-quarter views, s toward the lower left
// (front) and w toward the upper left (back); e and n are those mirrored, as the game shows them. The shroud is the
// recoloured ramp (recolour: grass, as the family), so the row's ochre becomes its main hue.
export const meta = { brief: 'boss-the-lantern-man', pass: 'r2', notes: 'decorated: round-lit shroud and hood, gaunt face on a neck in the hood, cyl limbs and crook, lit lantern, proc ao/rim/noise, soot decals', mirror: false, recolour: 'grass' };

const YAW = { s: 'sw', w: 'nw', e: 'sw', n: 'nw' }; // e and n are the s and w drawings flipped
const FLIP = { e: true, n: true };
const HEIGHT_M = 4.1, RIG_K = 1.0; // the rig's height; the hood's peak rises above the head bone

// the grip (rig side plane: x forward, y down, from the hip) and the crook's angle (180 = up, + forward) per frame
const GRIP = {
  idle: [[0.2, -0.36, 140], [0.2, -0.35, 138]],
  walk: [[0.21, -0.37, 142], [0.19, -0.36, 138], [0.21, -0.37, 142], [0.19, -0.36, 138]],
  attack: [[0.0, -0.64, 200], [0.14, -0.6, 150], [0.12, -0.4, 72], [0.14, -0.42, 122]],
};
const OFF = { idle: [[0.24, -0.2], [0.24, -0.19]], walk: [[0.26, -0.2], [0.22, -0.18], [0.2, -0.2], [0.22, -0.18]], attack: [[0.12, -0.22], [0.18, -0.24], [0.28, -0.18], [0.24, -0.2]] };

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, ground = h - 1, H = Math.round(HEIGHT_M * metre * RIG_K);
  const U = v => v * H, flip = !!FLIP[ctx.facing];
  const rig = ctx.lib.rigs.body('biped', ctx, { facing: YAW[ctx.facing] ?? 'sw', ground, height: H,
    proportions: { head: 0.15, neck: 0.07, arm_up: 0.2, arm_lo: 0.21, leg_up: 0.1, leg_lo: 0.1, armSep: 0.17, legSep: 0.07 } });
  const state = GRIP[ctx.state] ? ctx.state : 'idle', fr = (ctx.logical ?? ctx.frame) % GRIP[state].length;
  const [gx, gy, theta] = GRIP[state][fr], [ox, oy] = OFF[state][fr % OFF[state].length];
  const base = rig.pose(ctx.state, ctx.t);
  // the stoop: the spine leans forward, the neck thrusts the hood further ahead, the head comes back level
  const P = rig.pose(ctx.state, ctx.t, {
    angles: { spine: (base.angles.spine ?? 0) - 16, neck: (base.angles.neck ?? 0) - 34, head: (base.angles.head ?? 0) + 26 },
    ik: { armR_lo: { target: [U(gx), U(gy)], bend: -1 }, armL_lo: { target: [U(ox), U(oy)], bend: -1 } },
  });
  const zR = U(0.04);
  const B = (f, up, z) => P.at('hip', 0, f, z, up); // a body point: forward, up from the hip, and to the right
  const t3 = [Math.sin(theta * Math.PI / 180), -Math.cos(theta * Math.PI / 180)]; // the crook's direction (fwd, up)
  const G3 = [U(gx), -U(gy)], tip3 = [G3[0] + t3[0] * U(0.36), G3[1] + t3[1] * U(0.36)], butt3 = [G3[0] - t3[0] * U(0.18), G3[1] - t3[1] * U(0.18)];
  const grip = B(G3[0], G3[1], zR), tip = B(tip3[0], tip3[1], zR), butt = B(butt3[0], butt3[1], zR);
  // the crook's hook: out ahead of the tip and curling down; the lantern hangs from its end
  const hookA = B(tip3[0] + U(0.04), tip3[1] + U(0.035), zR), hookB = B(tip3[0] + U(0.075), tip3[1] - U(0.005), zR);
  const lanternTop = B(tip3[0] + U(0.075), tip3[1] - U(0.05), zR), lanternC = B(tip3[0] + U(0.075), tip3[1] - U(0.1), zR);
  return { w, h, H, U, rig, P, B, flip, theta, front: rig.front, ground, zR, grip, tip, butt, hookA, hookB, lanternTop, lanternC };
}

// a closed smooth path through points (quadratic curves between the midpoints)
const smooth = pts => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let d = `M${m(pts[n - 1], pts[0]).join(' ')}`;
  for (let i = 0; i < n; i++) d += ` Q${pts[i].join(' ')} ${m(pts[i], pts[(i + 1) % n]).join(' ')}`;
  return d + ' Z';
};

// the screen outline of a stack of rings (top first): each ring's leftmost and rightmost projected point, so the mass
// turns with the facing; `hem` adds the ragged lower edge of the last ring
function ringOutline(rings, hem = 0, rngJag = []) {
  const left = [], right = [], A = 16;
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
  const bottom = hem ? low.map((p, i) => [p[0], p[1] + (rngJag[i % rngJag.length] ?? 0) * hem]) : [];
  return [...left, ...bottom.slice(1, -1), ...right.reverse()];
}

function draw(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx), { U, P, B, front, ground } = L;
  const body = pal.grass, pole = pal.leather;
  const sp = (u, f, z) => P.at('spine', u, f, z, 0), hd = (u, f, z) => P.at('head', u, f, z, 0), nk = (u, f, z) => P.at('neck', u, f, z, 0);
  const cap = (name, a, b, r, r1, mat = body, extra = {}) => ({ type: 'capsule', name, underlay: true, a, b, r, r1, mat, shade: 'cyl', ...extra });

  // the shroud: a pear on the spine — narrow at the chest, a barrel hump over the shoulders, flaring to the hem
  const ring = (fn, cf, rf, rb, rs) => ({ at: (f, z) => fn(cf + f, z), rf: U(rf), rb: U(rb), rs: U(rs) });
  const lowHip = up => (f, z) => B(f, U(up), z);
  const shroud = ringOutline([
    ring((f, z) => nk(0.3, f, z), U(-0.01), 0.06, 0.1, 0.075),
    ring((f, z) => sp(0.93, f, z), U(-0.02), 0.09, 0.17, 0.15),
    ring((f, z) => sp(0.72, f, z), U(-0.01), 0.11, 0.16, 0.155),
    ring((f, z) => sp(0.42, f, z), 0, 0.09, 0.12, 0.115),
    ring((f, z) => sp(0.1, f, z), U(-0.01), 0.11, 0.13, 0.14),
    ring(lowHip(-0.1), U(-0.03), 0.15, 0.19, 0.2),
  ], 1, [U(0.035), -U(0.01), U(0.05), U(0.005), U(0.03), -U(0.005), U(0.045), U(0.01)]);

  // ragged tails from the hem to the floor, their tips stepping with the rig's feet
  const tails = [['legL_lo', -0.06, -0.12, -0.02, -0.06, 0.03], ['legL_lo', 0.06, -0.05, 0.02, 0.0, 0.035], ['legR_lo', 0.04, 0.06, -0.02, 0.02, 0.035], ['legR_lo', -0.08, 0.14, -0.06, 0.05, 0.03], ['legL_lo', -0.18, 0.02, -0.16, -0.02, 0.028]]
    .map(([leg, f0, z0, ft, zt, r]) => {
      const zl = leg === 'legL_lo' ? -U(0.07) : U(0.07), a = B(U(f0), U(-0.08), U(z0)), e = P.at(leg, 1, U(ft), U(zt) - zl, 0);
      return cap('tail', a, [e[0], Math.min(ground, e[1])], U(r), U(0.006), body, { shade: 'cyl' });
    });

  // the hood: a deep cowl on the thrust-forward head, its peak trailing back over the hump
  const hood = ringOutline([
    ring((f, z) => hd(1.0, f, z), U(-0.015), 0.06, 0.085, 0.07),
    ring((f, z) => hd(0.62, f, z), 0, 0.095, 0.11, 0.095),
    ring((f, z) => hd(0.15, f, z), U(-0.01), 0.09, 0.11, 0.095),
    ring((f, z) => nk(0.4, f, z), U(-0.02), 0.07, 0.11, 0.09),
  ]);
  const peak = hd(1.18, -U(0.07), 0);
  const hoodPts = [peak, ...hood];

  // arms: far one behind the shroud, near one in front; long tapered segments bent at the elbow
  const arm = side => {
    const up = `arm${side}_up`, lo = `arm${side}_lo`, hand = P.end(lo), elbow = P.end(up), sh = P.start(up);
    const parts = [cap('upper-arm', sh, elbow, U(0.034), U(0.027)), cap('forearm', elbow, hand, U(0.027), U(0.019))];
    if (side === 'L') { // the reaching claw
      const dx = hand[0] - elbow[0], dy = hand[1] - elbow[1], l = Math.hypot(dx, dy) || 1, d = [dx / l, dy / l], n = [-d[1], d[0]];
      for (const k of [-1, 0, 1]) parts.push(cap('claw', hand, [hand[0] + d[0] * U(0.075) + n[0] * k * U(0.03), hand[1] + d[1] * U(0.075) + n[1] * k * U(0.03) + U(0.012)], U(0.012), U(0.004)));
    } else parts.push({ type: 'circle', name: 'fist', cx: hand[0], cy: hand[1], r: U(0.025), mat: body, shade: 'sphere' });
    return { type: 'group', name: `arm-${side}`, underlay: true, children: parts };
  };
  const [farArm, nearArm] = P.far(['armL_up', 'armR_up']).map(n => n[3]);

  // the crook and its lantern
  const crook = () => {
    const lw = U(0.04), lh = U(0.055), [lx, ly] = L.lanternC;
    s.add({ type: 'group', name: 'crook', underlay: true, children: [
      cap('pole', L.butt, L.tip, U(0.014), U(0.012), pole),
      cap('hook', L.tip, L.hookA, U(0.013), U(0.012), pole),
      cap('hook', L.hookA, L.hookB, U(0.012), U(0.01), pole),
    ] });
    s.add({ type: 'group', name: 'lantern', underlay: true, children: [
      cap('chain', L.hookB, L.lanternTop, U(0.006), U(0.006), pal.metal),
      { type: 'path', name: 'lantern-cage', d: smooth([[lx, ly - lh], [lx + lw * 0.7, ly - lh * 0.55], [lx + lw, ly + lh * 0.3], [lx + lw * 0.55, ly + lh], [lx - lw * 0.55, ly + lh], [lx - lw, ly + lh * 0.3], [lx - lw * 0.7, ly - lh * 0.55]]), mat: pal.metal, shade: 'bevel' },
      { type: 'ellipse', name: 'lantern-light', cx: lx, cy: ly + lh * 0.15, rx: lw * 0.55, ry: lh * 0.55, mat: pal.glow, shade: 'sphere' },
      { type: 'path', name: 'lantern-cap', d: smooth([[lx, ly - lh * 1.45], [lx + lw * 0.8, ly - lh * 0.75], [lx - lw * 0.8, ly - lh * 0.75]]), mat: pal.metal, shade: 'flat', band: 2 },
    ] });
  };

  // the crook goes behind the body seen from the back, and when it is raised back over the hood
  const back = front < 0, behind = back || L.theta >= 180;
  if (behind) crook();
  s.add(arm(farArm));
  for (const t of tails) s.add(t);
  s.add({ type: 'path', name: 'shroud', underlay: true, mat: body, shade: 'normal', round: U(0.09), d: smooth(shroud) });
  s.add({ type: 'path', name: 'hood', underlay: true, mat: body, shade: 'sphere', d: smooth(hoodPts) });
  if (back) { // the hood's seam from the peak down to the hump, and a fold down the shroud's back
    s.add({ type: 'capsule', name: 'hood-seam', a: hd(0.85, -U(0.04), 0), b: nk(0.35, -U(0.04), 0), r: 0.5, color: 'outline' });
    s.add({ type: 'capsule', name: 'fold', a: sp(0.8, -U(0.1), 0), b: B(-U(0.12), U(0.05), 0), r: U(0.01), r1: U(0.015), mat: body, shade: 'flat', band: 1 });
  }
  if (!back) {
    const v = hd(0.5, U(0.07), 0);
    s.add({ type: 'ellipse', name: 'void', cx: v[0], cy: v[1], rx: U(0.045), ry: U(0.06), color: 'outline' });
    // a gaunt face on a thin neck, deep in the hood: egg-shaped, narrow at the jaw, lit from the upper left
    const fc = hd(0.5, U(0.085), 0), nb = nk(0.5, U(0.07), 0);
    s.add({ type: 'capsule', name: 'neck', a: [fc[0], fc[1] + U(0.03)], b: nb, r: U(0.013), mat: pal.skin, shade: 'flat', band: 2 });
    s.add({ type: 'path', name: 'face', underlay: true, mat: pal.skin, shade: 'sphere', d: smooth([[fc[0] - U(0.03), fc[1] - U(0.035)], [fc[0] + U(0.03), fc[1] - U(0.035)], [fc[0] + U(0.026), fc[1] + U(0.012)], [fc[0] + U(0.006), fc[1] + U(0.042)], [fc[0] - U(0.012), fc[1] + U(0.035)], [fc[0] - U(0.03), fc[1] + U(0.008)]]) });
    for (const e of [-1, 1]) { const p = hd(0.6, U(0.1), e * U(0.03)); // the eye-points stay where the approved shape had them
      s.add({ type: 'rect', name: 'eye-point', x: Math.round(p[0]), y: Math.round(p[1]), w: 1, h: 1, color: 'glow.0' }); }
    s.add({ type: 'rect', name: 'mouth', x: Math.round(fc[0] - U(0.008)), y: Math.round(fc[1] + U(0.02)), w: 2, h: 1, color: 'outline' });
  }
  s.add(arm(nearArm));
  if (!behind) crook();
  if (!back && farArm === 'R') s.add({ type: 'circle', name: 'grip', underlay: true, cx: L.grip[0], cy: L.grip[1], r: U(0.024), mat: body, shade: 'sphere' });
  // S2: ao under the hood and arms, the lit side's rim, faint cloth grain, and soot marks on the hem and hood edge
  const hem = B(U(0.02), U(-0.12), 0), hoodEdge = hd(0.35, U(0.0), 0);
  const grid = ctx.lib.proc(s)
    .add('ao', { part: ['shroud', 'tail', 'arm-L', 'arm-R'] })
    .add('rimLight', { part: ['shroud', 'hood', 'arm-L', 'arm-R'], side: 'lit' })
    .add('materialNoise', { part: 'shroud', amount: 0.06, scale: 3, seed: ctx.variant ?? 0 })
    .add('decal', { name: 'soot', part: 'shroud', mat: 'stone', band: 2, shape: { type: 'ellipse', cx: hem[0], cy: hem[1], rx: U(0.07), ry: U(0.035) } })
    .add('decal', { name: 'hood-hem', part: 'hood', mat: 'grass', band: 2, shape: { type: 'ellipse', cx: hoodEdge[0], cy: hoodEdge[1], rx: U(0.06), ry: U(0.018) } })
    .render();
  return { grid, L };
}

export function render(ctx) {
  const { grid, L } = draw(ctx);
  return L.flip ? grid.flip('x') : grid;
}

// head and hand (the crook's grip; effects follow it), mirrored with the drawing for e and n
export const anchors = ctx => {
  const L = layout(ctx), fx = x => (L.flip ? L.w - 1 - Math.round(x) : Math.round(x));
  const head = L.P.at('head', 0.5, 0, 0, 0);
  return { head: [fx(head[0]), Math.round(head[1])], hand: [fx(L.grip[0]), Math.round(L.grip[1])], lantern: [fx(L.lanternC[0]), Math.round(L.lanternC[1])] };
};
