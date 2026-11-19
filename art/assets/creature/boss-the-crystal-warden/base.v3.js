// boss-the-crystal-warden base.v3 (r3, from base.v2) — the decorated pass on the owner-approved shape (base.v2; no
// part moved or resized, so the silhouette is unchanged). Changed: materials, light and marks inside the line:
// - the crystal body moves to the accent ramp, the elemental family's recolour ramp (family-e-cap, meta.recolour), so
//   the row's azure reaches it in game; rock parts stay stone; no wood;
// - every faceted crystal mass (chest, pelvis, shoulders, elbows, the fist) is cut into facets lit by the direction's
//   light: each hull edge's facet takes the lit, mid or dark step by its normal against the light, around a mid-tone
//   table with a lit glint at its upper left, so the masses read as round cut gems, not flat slabs; every prism shard is
//   split down its spine into a lit and a shaded half;
// - limbs, neck and rock (head, jaw, rock fist, knees, feet) are shaded as round masses ('normal') along the light,
//   with material noise and a lit rim on the rock and crack decals on the rock parts; the cut masses' tables are round-lit;
// - a face on the front: two dark sockets with glowing eyes over a mid-tone cheek row, a dark mouth line on the jaw; the
//   side facings show the near eye; from behind, a crystal crest grows over the back of the skull (the 'hair');
// - the one bright accent is on the signature: a glowing heart inside the crystal fist with glow tips on its knuckle
//   shards, flaring wider on the held hit frame of the attack; the chest core stays a smaller glow gem.
// boss-the-crystal-warden base.v2 (r2, from base.v1, SHAPE DRAFT) — changed: the silhouette is rebuilt from a slim
// armoured knight into a heavy crystal elemental, per the owner's shape note ("reads as a slim armoured knight with
// crystal shoulder tufts, not a giant of living crystal"). One thing changed, the body plan:
// - a wide faceted chest (an unsmoothed hull, so its edges are facets) about 0.6 of the height across, tapering hard to
//   a narrow waist and a faceted pelvis; deep front to back, so the side facings stay wide; the shard skirt is gone;
// - thick tapered arms splayed out from the body with an elbow, the left ending in a rock fist, the right in one
//   oversized crystal fist (a big faceted cluster of prisms, the signature, replacing the maul and its haft) held clear
//   of the legs; the attack is an overhead hammer-fist slam, its contact held low in front;
// - thick tapered legs with rock knees and broad rock feet, longer than v1 so the trunk no longer reads as a shield;
// - the rock head pushed forward on a thick neck with a jutting jaw, its crown cut to three short spikes (no plume);
// - great crystal shards jutting up and out of both shoulders and up and back from the upper back, so the front is
//   wider than half the height and the side facings carry the back shards behind;
// - the glowing core moved into the chest (glow ramp, the one bright accent).
// Silhouette and form only, in flat materials: no proc layers but the ground shadow, no texture, no decals.
// base.v1 (r1): The Crystal Warden, a unique brute boss of the elemental family (glyph E, azure, slow, fungal caverns),
// 6.4 m (about 102 px, 2.8x the drawn player) in the 96 x 128 frame, on the shared biped rig (`ctx.lib.rigs.body`).
// Every part is placed with pose.at(bone, u, fwd, side, up) so the body turns with the rig's yaw; colours are ramps from
// ctx.dir (R11): the crystal body the cloth ramp (azure, the row's colour), rock parts stone, the core glow.
export const meta = { brief: 'boss-the-crystal-warden', pass: 'r3', recolour: 'accent', notes: 'decorated: accent-ramp crystal cut into lit facets, round-lit rock with cracks, a face, back crest, a glowing crystal fist' };

export const params = {};

const HM = 6.4, CROWN = 0.07; // the crown's tallest spike above the head, a share of the rig height

// attack keys (absolute right-arm angles, rig convention: 0 up, 90 forward, 180 down): the wind-up with the fist raised
// behind the head, over the top, the slam, the contact held low in front
const ATTACK = [
  { spine: -8, up: 20, lo: -40 },
  { spine: 2, up: 40, lo: 30 },
  { spine: 10, up: 100, lo: 140 },
  { spine: 12, up: 125, lo: 165 },
];

function layout(ctx) {
  const [w, h] = ctx.size, metre = ctx.dir.scale.metre ?? 16, ground = h - 3;
  const H = Math.round((HM * metre) / (1 + CROWN)); // the rig to the top of the head; the crown adds the rest
  const rig = ctx.lib.rigs.body('biped', ctx, {
    ground, height: H,
    proportions: { hip: 0.02, neck: 0.05, head: 0.11, leg_up: 0.17, leg_lo: 0.16, arm_up: 0.17, arm_lo: 0.16, shoulder: 0.84, legSep: 0.105, armSep: 0.22 },
  });
  const P0 = rig.pose(ctx.state, ctx.t), A = P0.angles;
  let over = { neck: (A.neck ?? 0) + 22, head: (A.head ?? 0) - 14, armL_up: (A.armL_up ?? 180) - 12, armR_up: (A.armR_up ?? 180) - 12, armL_lo: (A.armL_lo ?? 0) + 18, armR_lo: (A.armR_lo ?? 0) + 18 };
  if (ctx.state === 'attack') {
    const k = ATTACK[Math.min(3, Math.floor((ctx.t ?? 0) * 4 + 1e-6))];
    over = { ...over, spine: k.spine, armR_up: k.up - k.spine, armR_lo: k.lo - k.up, armL_up: 165, armL_lo: 25 };
  }
  const P = rig.pose(ctx.state, ctx.t, { angles: over });
  const { sx, front, side } = rig;
  return { w, h, H, rig, P, sx, front, side, ground };
}

// convex hull (monotone chain) of screen points
function hull(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const f2 = p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
const smooth = pts => {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  let d = `M${f2(m(pts[n - 1], pts[0]))}`;
  for (let i = 0; i < n; i++) d += ` Q${f2(pts[i])} ${f2(m(pts[i], pts[(i + 1) % n]))}`;
  return d + ' Z';
};

export function render(ctx) {
  const { pal } = ctx.dir, s = ctx.lib.t2.scene(...ctx.size), L = layout(ctx);
  const { H, P, sx, front } = L, U = v => v * H;
  const items = [], put = (depth, nodes) => { for (const node of [].concat(nodes)) items.push({ depth, node, i: items.length }); return nodes; };
  const at = (n, u, f = 0, sd = 0, up = 0) => P.at(n, u, U(f), U(sd), U(up));
  const dep = (n, f = 0, sd = 0) => P.depth(n) + U(f) * front + U(sd) * sx;
  const crystal = pal.accent, rock = pal.stone; // accent: the elemental family's recolour ramp (family-e-cap)
  const decals = [], hit = ctx.state === 'attack' && Math.floor((ctx.t ?? 0) * 4 + 1e-6) >= 2;

  // the light in screen terms (toward the light), from the direction (R11)
  const Lv = ctx.dir.camera.light, Ln = Math.hypot(Lv[0], Lv[1]) || 1, Ls = [Lv[0] / Ln, Lv[1] / Ln];
  const lightOf = (nx, ny) => nx * Ls[0] + ny * Ls[1];
  const bandOf = d => (d > 0.35 ? 0 : d < -0.35 ? 2 : 1);
  const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  // a cut gem: each hull edge's facet lit by its outward normal against the light, round a mid-tone table with a lit
  // glint at the corner nearest the light; every facet sits inside its parent, so the outline is the parent's
  const facets = (node, k = 0.55) => {
    const pts = node.pts, n = pts.length, c = pts.reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n], [0, 0]);
    const inn = pts.map(p => lerp(c, p, k)), out = [node];
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
      if (l < 0.5) continue;
      let nx = dy / l, ny = -dx / l;
      if (nx * ((a[0] + b[0]) / 2 - c[0]) + ny * ((a[1] + b[1]) / 2 - c[1]) < 0) { nx = -nx; ny = -ny; }
      out.push({ type: 'poly', name: node.name + '-facet', mat: node.mat, shade: 'flat', band: bandOf(lightOf(nx, ny)), pts: [a, b, inn[(i + 1) % n], inn[i]] });
    }
    out.push({ type: 'poly', name: node.name + '-table', mat: node.mat, shade: 'normal', pts: inn });
    let g = 0;
    inn.forEach((p, i) => { if (p[0] * Ls[0] + p[1] * Ls[1] > inn[g][0] * Ls[0] + inn[g][1] * Ls[1]) g = i; });
    const v = inn[g];
    out.push({ type: 'poly', name: node.name + '-glint', mat: node.mat, shade: 'flat', band: 0, pts: [v, lerp(v, inn[(g + n - 1) % n], 0.4), lerp(v, c, 0.35), lerp(v, inn[(g + 1) % n], 0.4)] });
    return out;
  };
  // a mass round bone points: the hull of horizontal elliptical rings (fwd semi-axis a, side semi-axis b); `facet`
  // samples each ring at 8 points and keeps the hull's straight edges, cut into lit facets (crystal), otherwise 16
  // points, smoothed and shaded round along the light (rock)
  const blob = (name, rings, mat, band = 1, facet = false) => {
    const pts = [], k = facet ? 8 : 16;
    for (const [n, u, f, sd, up, a, b] of rings) for (let i = 0; i < k; i++) { const t = (i / k) * Math.PI * 2 + (facet ? Math.PI / 8 : 0); pts.push(at(n, u, f + a * Math.cos(t), sd + b * Math.sin(t), up)); }
    const hp = hull(pts);
    return facet ? facets({ type: 'poly', name, underlay: true, mat, shade: 'flat', band, pts: hp }) : { type: 'path', name, underlay: true, mat, shade: 'normal', d: smooth(hp) };
  };
  // a crystal prism: from a base point to a tip, half-width hw px, its shoulders at 65 % of the length; split down its
  // spine into a lit half and a shaded half; `tip` lays a glow tip on the lit end (the fist's accent)
  const prism = (name, b, t, hw, mat = crystal, tip = false) => {
    const dx = t[0] - b[0], dy = t[1] - b[1], l = Math.hypot(dx, dy) || 1, d = [dx / l, dy / l], nn = [-d[1], d[0]];
    const q = (k, m) => [b[0] + d[0] * k + nn[0] * m, b[1] + d[1] * k + nn[1] * m];
    const dA = lightOf(-nn[0], -nn[1]), dB = -dA, litA = dA >= dB;
    const shadeB = d2 => (d2 < -0.6 ? 2 : 1);
    const out = [
      { type: 'poly', name, underlay: true, mat, shade: 'flat', band: 1, pts: [q(0, -hw), q(l * 0.65, -hw), t, q(l * 0.65, hw), q(0, hw)] },
      { type: 'poly', name: name + '-lit', mat, shade: 'flat', band: litA ? 0 : shadeB(dA), pts: [q(0, -hw), q(l * 0.65, -hw), t, q(0, 0)] },
      { type: 'poly', name: name + '-dark', mat, shade: 'flat', band: litA ? shadeB(dB) : 0, pts: [q(0, 0), t, q(l * 0.65, hw), q(0, hw)] },
    ];
    if (tip) out.push({ type: 'poly', name: name + '-glow', mat: pal.glow, shade: 'flat', band: 0, pts: [q(l * 0.5, -hw * 0.6), q(l * 0.65, -hw * 0.75), t, q(l * 0.65, hw * 0.75), q(l * 0.5, hw * 0.6)] });
    return out;
  };
  const tube = (name, a, b, r, r1, mat) => ({ type: 'capsule', name, underlay: true, mat, shade: 'normal', a, b, r, r1 });
  // a crack: a pixel walk from a start point (frame px) along steps
  const crack = (p, steps) => { let [x, y] = p.map(Math.round); const out = [{ type: 'rect', x, y, w: 1, h: 1 }]; for (const [ddx, ddy] of steps) { x += ddx; y += ddy; out.push({ type: 'rect', x, y, w: 1, h: 1 }); } return out; };

  // ---- legs: thick tapered thighs and shins, a rock knee, broad rock feet; splayed a little outward
  for (const sd of ['L', 'R']) {
    const up = `leg${sd}_up`, lo = `leg${sd}_lo`, d = P.depth(up), k = sd === 'L' ? -1 : 1;
    put(d, tube('thigh', at(up, 0, 0, 0.0), at(up, 1, 0, 0.015 * k), U(0.1), U(0.075), crystal));
    put(d + 0.01, tube('shin', at(lo, 0, 0, 0.015 * k), at(lo, 0.86, 0, 0.02 * k), U(0.075), U(0.06), crystal));
    put(d + 0.02, blob('knee', [[up, 1, 0.035, 0.015 * k, 0, 0.05, 0.055]], rock, 1, true));
    put(d + 0.03, blob('foot', [[lo, 1, 0.04, 0.02 * k, 0, 0.09, 0.07], [lo, 1, 0.0, 0.02 * k, 0.045, 0.055, 0.05]], rock));
    const fp = at(lo, 1, 0.02, 0.02 * k, 0.03);
    if (Math.abs(front) > 0.5 || k * sx > 0.3) decals.push({ name: `foot-crack-${sd}`, part: 'foot', mat: 'stone', band: 2, shape: crack([fp[0] - 2 * k, fp[1] - 1], [[k, 1], [k, 0], [0, 1]]) });
  }
  // ---- the pelvis: a faceted block under the waist
  put(0, blob('pelvis', [['spine', 0, 0, 0, -0.02, 0.09, 0.12], ['spine', 0.12, 0, 0, 0, 0.08, 0.09]], crystal, 1, true));

  // ---- the crystal back: great shards up and back out of the upper back (behind the trunk from the front)
  for (const [sd, up, f, len, hw] of [[0, 0.92, -0.3, 0.2, 0.07], [-0.12, 0.86, -0.3, 0.18, 0.06], [0.12, 0.86, -0.3, 0.19, 0.06], [-0.2, 0.7, -0.34, 0.15, 0.05], [0.2, 0.7, -0.34, 0.14, 0.05]]) {
    const b = at('spine', up, -0.1, sd), t = at('spine', up, f * 1.25, sd * 1.7, len);
    put(dep('spine', -0.16, sd), prism('back-shard', b, t, U(hw)));
  }

  // ---- the trunk: a wide faceted chest tapering hard to a narrow waist, deep front to back
  put(0.01, blob('torso', [
    ['spine', 0.18, 0, 0, 0, 0.08, 0.08],
    ['spine', 0.45, 0.03, 0, 0, 0.15, 0.18],
    ['spine', 0.7, 0.06, 0, 0, 0.23, 0.26],
    ['spine', 0.88, 0.04, 0, 0, 0.2, 0.27],
    ['spine', 1, -0.01, 0, 0.02, 0.1, 0.15],
  ], crystal, 1, true));
  // the core: a glowing crystal gem set in the chest, hidden from behind
  if (front > -0.25) {
    const c = at('spine', 0.68, 0.22), r = U(0.06);
    const gem = [[c[0], c[1] - r * 1.3], [c[0] + r * 0.8, c[1] - r * 0.2], [c[0] + r * 0.5, c[1] + r], [c[0] - r * 0.5, c[1] + r], [c[0] - r * 0.8, c[1] - r * 0.2]];
    put(U(0.3), [
      { type: 'poly', name: 'core', mat: pal.glow, shade: 'flat', band: 1, underlay: true, pts: gem },
      { type: 'poly', name: 'core-lit', mat: pal.glow, shade: 'flat', band: 0, pts: [gem[0], lerp(gem[0], gem[1], 0.5), c, lerp(gem[4], gem[3], 0.6), gem[4]] },
    ]);
  }

  // ---- the head: a rock skull pushed forward on a thick neck, a jutting jaw, three short crown spikes
  const hd = dep('head', 0.03);
  put(hd - 0.02, tube('neck', at('neck', 0, 0), at('neck', 1, 0.01), U(0.075), U(0.06), crystal));
  const crown = [[-0.05, 0.05], [0, CROWN], [0.05, 0.05]].map(([sd, tall]) =>
    [dep('head', -0.02, sd), prism('crown', at('head', 0.8, -0.01, sd), at('head', 1, -0.03, sd * 1.5, tall), U(0.028))]);
  crown.filter(([d]) => d < hd).forEach(([d, n]) => put(d, n));
  const headN = put(hd, blob('head', [['head', 0.15, 0.02, 0, 0, 0.07, 0.075], ['head', 0.6, 0.0, 0, 0, 0.08, 0.08], ['head', 1, -0.01, 0, 0, 0.05, 0.055]], rock, 1));
  const jawN = put(front < -0.2 ? hd - 0.01 : hd + 0.01, blob('jaw', [['head', 0.0, 0.07, 0, 0, 0.05, 0.085], ['head', 0.3, 0.085, 0, 0, 0.035, 0.07]], rock, 0));
  let FACE = null;
  // the face (front and side facings): dark sockets with glowing eyes, a mid-tone cheek row, a mouth line on the jaw;
  // drawn over the jaw, clipped to the head and jaw so it stays inside the line
  if (front > -0.2) {
    const face = [];
    for (const e of [-1, 1]) {
      const p = at('head', 0.55, 0.08, 0.035 * e), q = at('head', 0.75, 0.08, 0.035 * e);
      if (U(0.035 * e) * sx + U(0.08) * front > -U(0.03)) {
        const x = Math.round(p[0] - 1), y = Math.round(q[1]);
        face.push({ type: 'rect', name: 'cheek', x: x - 1, y: y + 1, w: 4, h: 1, mat: rock, shade: 'flat', band: 1 });
        face.push({ type: 'rect', name: 'socket', x: x - (e * sx > 0 ? 0 : 1), y: y - 1, w: 3, h: 2, mat: rock, shade: 'flat', band: 2 });
        face.push({ type: 'rect', name: 'eye', x, y, w: 2, h: 1, mat: pal.glow, shade: 'flat', band: 0 });
      }
    }
    if (front > 0.3) {
      const m = at('head', 0.12, 0.1, 0);
      face.push({ type: 'rect', name: 'mouth', x: Math.round(m[0] - 2), y: Math.round(m[1]), w: 4, h: 1, mat: rock, shade: 'flat', band: 2 });
    }
    FACE = face;
  }
  // from behind: a crystal crest over the back of the skull (its 'hair')
  if (front < -0.2) {
    const cp = (u, sd) => at('head', u, 0.02, sd);
    const crest = [cp(0.25, -0.065), cp(0.95, -0.05), cp(0.55, -0.025), cp(1.05, 0), cp(0.55, 0.025), cp(0.95, 0.05), cp(0.25, 0.065)];
    decals.push({ name: 'crest', part: 'head', mat: 'accent', band: 1, shape: { type: 'poly', pts: crest } });
    decals.push({ name: 'crest-lit', part: 'head', mat: 'accent', band: 0, shape: [{ type: 'poly', pts: [cp(0.3, -0.055), cp(0.9, -0.045), cp(0.5, -0.03)] }, { type: 'poly', pts: [cp(0.5, -0.012), cp(1.0, 0), cp(0.55, 0.008)] }] });
  } else if (front > 0.5) {
    const hp = at('head', 0.9, 0.02, -0.03);
    decals.push({ name: 'head-crack', part: 'head', mat: 'stone', band: 2, shape: crack(hp, [[1, 1], [0, 1], [1, 1]]) });
  }
  if (FACE) put(hd + 0.02, { type: 'group', name: 'face', clip: { type: 'union', shapes: [{ ...headN, underlay: false }, { ...jawN, underlay: false }] }, children: FACE });
  crown.filter(([d]) => d >= hd).forEach(([d, n]) => put(d, n));

  // ---- arms: thick, tapered, splayed out from the body with an elbow; great shards out of each shoulder
  for (const sd of ['L', 'R']) {
    const up = `arm${sd}_up`, lo = `arm${sd}_lo`, d = P.depth(up) + 0.5, k = sd === 'L' ? -1 : 1, big = sd === 'R';
    const sh = at(up, 0, 0, 0.02 * k), el = at(up, 1, 0, 0.06 * k), wr = at(lo, 0.85, 0, 0.08 * k);
    put(d, tube('upper-arm', sh, el, U(0.085), U(0.065), crystal));
    put(d + 0.01, blob('elbow', [[up, 1, -0.01, 0.06 * k, 0, 0.055, 0.055]], crystal, 1, true));
    put(d + 0.02, tube('forearm', el, wr, U(0.065), U(big ? 0.08 : 0.07), crystal));
    if (big) {
      // the signature: one oversized crystal fist, a cut mass with prisms jutting from the knuckles and back; a glowing
      // heart inside it and glow tips on the shards (the one bright accent), flaring on the held hit frame
      const fd = d + 0.03, fc = at(lo, 0.98, 0.0, 0.08 * k), r = U(hit ? 0.06 : 0.05);
      put(fd, blob('crystal-fist', [[lo, 1.02, 0.01, 0.08 * k, 0, 0.11, 0.11], [lo, 0.85, 0.0, 0.08 * k, 0, 0.09, 0.09]], crystal, 0, true));
      put(fd + 0.005, [
        { type: 'poly', name: 'fist-heart', mat: pal.glow, shade: 'flat', band: 1, pts: [[fc[0], fc[1] - r], [fc[0] + r * 0.75, fc[1]], [fc[0], fc[1] + r], [fc[0] - r * 0.75, fc[1]]] },
        { type: 'poly', name: 'fist-heart-hot', mat: pal.glow, shade: 'flat', band: 0, pts: [[fc[0], fc[1] - r * 0.6], [fc[0] + r * 0.4, fc[1]], [fc[0], fc[1] + r * 0.45], [fc[0] - r * 0.4, fc[1]]] },
      ]);
      for (const [u0, f0, s0, u1, f1, s1, hw] of [[1.05, 0.05, 0.05, 1.3, 0.12, 0.1, 0.045], [1.05, -0.05, 0.05, 1.32, -0.1, 0.12, 0.045], [0.95, 0, 0.1, 1.1, 0.02, 0.17, 0.05], [1.08, 0, 0, 1.38, 0, 0.02, 0.05]]) {
        put(fd + 0.01, prism('fist-shard', at(lo, u0, f0, 0.08 * k + s0 * k * 0.5), at(lo, u1, f1, 0.08 * k + s1 * k), U(hw), crystal, true));
      }
    } else {
      put(d + 0.03, blob('fist', [[lo, 1, 0.01, 0.08 * k, 0, 0.07, 0.07], [lo, 0.9, 0, 0.08 * k, 0, 0.06, 0.065]], rock));
      const fp = at(lo, 1, 0.03, 0.08 * k);
      if (Math.abs(front) > 0.5 || k * sx > 0.3) decals.push({ name: 'knuckle-crack', part: 'fist', mat: 'stone', band: 2, shape: crack([fp[0] - 2, fp[1] - 2], [[1, 1], [1, 0], [0, 1], [1, 1]]) });
    }
    put(d + 0.04, blob('shoulder', [[up, 0.05, 0, 0.03 * k, 0.03, 0.09, 0.09], [up, 0.25, 0, 0.04 * k, 0, 0.08, 0.08]], crystal, 1, true));
    for (const [f, out, upv, hw] of [[0.04, 0.17, 0.17, 0.065], [-0.05, 0.1, 0.21, 0.06], [0.0, 0.2, 0.06, 0.05]]) {
      put(d + 0.05, prism('shoulder-shard', at(up, 0, f, 0.05 * k, 0.04), at(up, 0, f * 2, out * k, upv), U(hw)));
    }
  }

  items.sort((a, b) => a.depth - b.depth || a.i - b.i).forEach(it => s.add(it.node));
  let pr = ctx.lib.proc(s)
    .add('materialNoise', { mat: 'stone', amount: 0.3, scale: 2, seed: ctx.variant ?? 0 })
    .add('rimLight', { mat: 'stone', side: 'lit' });
  for (const dc of decals) pr = pr.add('decal', dc);
  return pr.add('groundShadow', {}).render();
}

// Named points per frame: head, hand (the right fist) from the rig; `ground` comes from the frame.
export const anchors = ctx => {
  const L = layout(ctx), a = { ...L.rig.anchors(L.P) };
  delete a.ground;
  return a;
};
