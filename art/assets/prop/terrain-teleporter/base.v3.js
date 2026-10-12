// terrain-teleporter base.v3 (r3) — from base.v1, one change (the r1/r2 reviews): the light is between v1's hot filled
// disc and v2's lost thin ring — dark accent fills the inner floor, a small mid-accent pool toward the centre and a single
// light core pixel, pulsing one ramp step per frame (no bright band ring). Everything else as base.v1.
// terrain-teleporter base.v1 (r1) — adapted from the iso chest template to the brief: a ring of ten low carved stones
// (about 0.1 m, 2 px high) set in the floor of the cell's bottom diamond, with a faint glow on the floor inside the ring
// and a few motes; a 4-frame seamless glow loop driven by ctx.t. Stone ramp for the stones, accent ramp for the light (the
// glow ramp is outside the prop palette, so the gate fails on it; accent is the brief's token for the light). 2D T2+ scene; no floor drawn (the floor tile sits under the prop).
export const meta = { brief: 'terrain-teleporter', pass: 'r3', notes: 'faint glow: dark accent floor, small mid pool, 1 px light core', mirror: false };

export const params = {
  stones: { type: 'range', min: 9, max: 11, step: 1, default: 10 },
};

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h, { outline: true });
  const X = v => (v * w) / 32, cx = w / 2, cy = h - 8;               // the bottom diamond's centre
  const RX = X(11), RY = RX / 2;                                      // the ring, flat on the floor (2:1)
  const ph = (ctx.t || 0) * Math.PI * 2;                               // seamless loop phase
  const pulse = 0.5 + 0.5 * Math.cos(ph);                              // 1 → 0 → 1 over the loop
  const lift = Math.max(1, Math.round(X(1.6)));                        // 0.1 m at 16 px per metre

  // stones on the ring: worn, slightly irregular blocks, each a top face and a short front face
  const back = [], front = [];
  for (let i = 0; i < P.stones; i++) {
    const a = (i / P.stones) * Math.PI * 2 + 0.2 + (ctx.rng() - 0.5) * 0.15;
    const sx = cx + Math.cos(a) * RX, sy = cy + Math.sin(a) * RY;
    const rw = X(1.6) + ctx.rng() * X(0.6), rh = Math.max(1, rw * 0.6);
    const stone = {
      type: 'group', name: 'stone', children: [
        { type: 'ellipse', name: 'stone-side', cx: sx, cy: sy + lift * 0.5, rx: rw, ry: rh, mat: pal.stone, shade: 'flat', band: 2 },
        { type: 'ellipse', name: 'stone-top', cx: sx, cy: sy - lift * 0.5, rx: rw, ry: rh, mat: pal.stone, shade: 'sphere', underlay: true },
      ],
    };
    if (i % 2 === 0) stone.children.push({ type: 'rect', name: 'carving', x: Math.round(sx), y: Math.round(sy - lift * 0.5), w: 1, h: 1, mat: pal.stone, shade: 'flat', band: 2 });
    (Math.sin(a) < 0 ? back : front).push(stone);
  }
  s.add({ type: 'group', name: 'back-stones', children: back });

  // the faint glow on the floor inside the ring: dark accent filling the inner floor, a small mid-accent pool toward the
  // centre and one light core pixel; the loop steps one ramp band per frame (core light <-> mid, pool grows/shrinks 1 px)
  const fr = Math.round((ctx.t || 0) * 4) % 4, hi = fr === 0 || fr === 3;
  const gx = RX - X(2.6), gy = gx / 2;
  s.add({ type: 'ellipse', name: 'glow-haze', cx, cy, rx: gx, ry: gy, mat: pal.accent, shade: 'flat', band: 2 });
  const mx = X(2.5) + (hi ? X(1) : 0);
  s.add({ type: 'ellipse', name: 'glow-pool', cx, cy, rx: mx, ry: Math.max(1, mx / 2), mat: pal.accent, shade: 'flat', band: 1 });
  s.add({ type: 'rect', name: 'glow-core', x: Math.round(cx), y: Math.round(cy), w: 1, h: 1, mat: pal.accent, shade: 'flat', band: hi ? 0 : 1 });

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
