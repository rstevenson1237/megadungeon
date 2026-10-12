// terrain-teleporter base.v5 (r5) — from base.v4, one change (the blind re-score of finish.v1): the ring's stones are
// re-formed as 8-10 (default 10) chiselled blocks spaced evenly by arc length on the true 2:1 ellipse (not axis-aligned pairs, none at top or
// bottom centre), back stones smaller and partly behind the rim, front stones larger and over it; each has a lit top
// face (stone light, upper left), stone-mid front face, stone-dark lower-right side, a 1 px floor shadow, and a 1-2 px
// carved notch on every third stone. Rim, mote, inner floor and motes are base.v4's, unchanged.
// terrain-teleporter base.v4 (r4) — from base.v3, one change (the r3 review): the solid accent fill inside the ring is
// cleared to the stone floor (stone dark with a mid wear patch); the light is now a 1 px accent rim just inside the stones
// plus a 3 px centre mote (light core, one mid-accent step of falloff), both pulsing one ramp step in the loop.
// terrain-teleporter base.v3 (r3) — from base.v1, one change (the r1/r2 reviews): the light is between v1's hot filled
// disc and v2's lost thin ring — dark accent fills the inner floor, a small mid-accent pool toward the centre and a single
// light core pixel, pulsing one ramp step per frame (no bright band ring). Everything else as base.v1.
// terrain-teleporter base.v1 (r1) — adapted from the iso chest template to the brief: a ring of ten low carved stones
// (about 0.1 m, 2 px high) set in the floor of the cell's bottom diamond, with a faint glow on the floor inside the ring
// and a few motes; a 4-frame seamless glow loop driven by ctx.t. Stone ramp for the stones, accent ramp for the light (the
// glow ramp is outside the prop palette, so the gate fails on it; accent is the brief's token for the light). 2D T2+ scene; no floor drawn (the floor tile sits under the prop).
export const meta = { brief: 'terrain-teleporter', pass: 'r5', notes: 'chiselled block stones on a true 2:1 ellipse; v4 rim, mote and inner floor', mirror: false };

export const params = {
  stones: { type: 'range', min: 8, max: 10, step: 1, default: 10 },
};

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h, { outline: true });
  const X = v => (v * w) / 32, cx = w / 2, cy = h - 8;               // the bottom diamond's centre
  const RX = X(11), RY = RX / 2;                                      // the ring, flat on the floor (2:1)
  const ph = (ctx.t || 0) * Math.PI * 2;                               // seamless loop phase
  const pulse = 0.5 + 0.5 * Math.cos(ph);                              // 1 → 0 → 1 over the loop
  const lift = Math.max(1, Math.round(X(1.6)));                        // 0.1 m at 16 px per metre

  // stones on the ring (r5): carved blocks evenly spaced on the true 2:1 ellipse (even steps along the curve, a little
  // seeded jitter, so none sits at the top or bottom centre and none pair up on the axes); back stones smaller and drawn
  // before the rim, front stones larger and drawn over it. Each block: a lit top face (stone light, a mid pixel at its
  // right end), a stone-mid front face, a stone-dark lower-right side, a 1 px floor shadow, and a carved notch on some.
  const back = [], front = [];
  const n = P.stones;
  // even spacing by arc length (not by angle), so the stones at the ellipse's narrow ends don't bunch up; from due east,
  // so with 10 stones one sits at each side and the top and bottom centres fall in gaps
  const arc = [0];
  for (let k = 1; k <= 360; k++) {
    const a0 = ((k - 1) / 360) * Math.PI * 2, a1 = (k / 360) * Math.PI * 2;
    arc.push(arc[k - 1] + Math.hypot(RX * (Math.cos(a1) - Math.cos(a0)), RY * (Math.sin(a1) - Math.sin(a0))));
  }
  const arcAngle = f => {
    const L = (((f % 1) + 1) % 1) * arc[360];
    let k = 1; while (k < 360 && arc[k] < L) k++;
    return ((k - 1 + (L - arc[k - 1]) / (arc[k] - arc[k - 1])) / 360) * Math.PI * 2;
  };
  for (let i = 0; i < n; i++) {
    const a = arcAngle((i + (ctx.rng() - 0.5) * 0.16) / n);
    const sn = Math.sin(a), isFront = sn > 0;
    const bx = Math.round(cx + Math.cos(a) * RX), by = Math.round(cy + Math.sin(a) * RY);   // the stone's base centre
    const bw = Math.round(isFront ? X(4) : X(3));                // block width
    const fh = Math.max(1, Math.round(isFront ? X(2) : X(1)));                              // front face height
    const td = Math.max(1, Math.round(X(1)));                                              // top face depth
    const x0 = bx - Math.floor(bw / 2), x1 = x0 + bw, yf = by - fh, yt = yf - td;
    const ch = ctx.rng() < 0.5;                                                              // which top corner is chipped
    const top = ch
      ? [[x0 + 1, yt], [x1, yt], [x1, yf], [x0, yf], [x0, yt + 1]]
      : [[x0, yt], [x1 - 1, yt], [x1, yt + 1], [x1, yf], [x0, yf]];
    const kids = [];
    // front stones overlap the rim and the inner floor: a 1 px ink line along the top face's back edge keeps them apart
    if (isFront) kids.push({ type: 'rect', name: 'stone-ink', x: x0 + (ch ? 1 : 0), y: yt - 1, w: bw - 1, h: 1, color: 'outline' });
    kids.push(
      { type: 'rect', name: 'stone-shadow', x: x0 + 1, y: by, w: bw, h: 1, color: 'outline' },
      { type: 'rect', name: 'stone-front', x: x0, y: yf, w: bw, h: fh, mat: pal.stone, shade: 'flat', band: 1 },
      { type: 'poly', name: 'stone-top', pts: top, mat: pal.stone, shade: 'flat', band: 0 },
      { type: 'rect', name: 'stone-side', x: x1 - 1, y: yt + 1, w: 1, h: by - yt - 1, mat: pal.stone, shade: 'flat', band: 2 },
    );
    if (td - (ch ? 0 : 1) > 0) kids.push({ type: 'rect', name: 'stone-top-edge', x: x1 - 2, y: yt + (ch ? 0 : 1), w: 1, h: td - (ch ? 0 : 1), mat: pal.stone, shade: 'flat', band: 1 });
    if (i % 3 === 0) kids.push({ type: 'rect', name: 'carving', x: x0 + 1 + (i % 2), y: yf, w: 1, h: Math.min(2, fh), mat: pal.stone, shade: 'flat', band: 2 });
    (isFront ? front : back).push({ type: 'group', name: 'stone', z: by, children: kids });
  }
  back.sort((p, q) => p.z - q.z); front.sort((p, q) => p.z - q.z);
  s.add({ type: 'group', name: 'back-stones', children: back });

  // the light (r4): the inner floor is plain worn stone (dark, with a mid patch), the light only a 1 px accent rim just
  // inside the stones and a small centre mote (light core, one mid-accent step of falloff), pulsing one step per frame
  const fr = Math.round((ctx.t || 0) * 4) % 4, hi = fr === 0 || fr === 3;
  const gx = RX - X(2.6), gy = gx / 2;
  s.add({ type: 'ellipse', name: 'glow-rim', cx, cy, rx: gx, ry: gy, mat: pal.accent, shade: 'flat', band: hi ? 1 : 2 });
  s.add({ type: 'ellipse', name: 'inner-floor', cx, cy, rx: gx - 1, ry: Math.max(1, gy - 1), mat: pal.stone, shade: 'flat', band: 2 });
  s.add({ type: 'ellipse', name: 'inner-floor-wear', cx: cx - X(2), cy: cy - 1, rx: X(3), ry: X(1.2), mat: pal.stone, shade: 'flat', band: 1 });
  const cxr = Math.round(cx), cyr = Math.round(cy);
  s.add({ type: 'rect', name: 'mote-falloff', x: cxr - 1, y: cyr, w: 3, h: 1, mat: pal.accent, shade: 'flat', band: hi ? 1 : 2 });
  s.add({ type: 'rect', name: 'mote-falloff-v', x: cxr, y: cyr - 1, w: 1, h: 3, mat: pal.accent, shade: 'flat', band: hi ? 1 : 2 });
  s.add({ type: 'rect', name: 'mote-core', x: cxr, y: cyr, w: 1, h: 1, mat: pal.accent, shade: 'flat', band: hi ? 0 : 1 });

  s.add({ type: 'group', name: 'front-stones', children: front });

  // motes rising from the core, staggered so the 4 frames loop without a seam
  const motes = [];
  for (let k = 0; k < 3; k++) {
    const u = ((ctx.t || 0) + k / 3) % 1;
    const mx = cx + Math.round(Math.cos(k * 2.1) * X(4)), my = cy - 1 - Math.round(u * X(6));
    motes.push({ type: 'rect', name: 'mote', x: mx, y: my, w: 1, h: 1, mat: pal.accent, shade: 'flat', band: u < 0.5 ? 0 : 1 });
  }
  s.add({ type: 'group', name: 'motes', children: motes });

  return ctx.lib.proc(s).noDefaults().render();
}
