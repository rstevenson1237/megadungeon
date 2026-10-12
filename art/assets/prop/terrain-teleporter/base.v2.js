// terrain-teleporter base.v2 (r2) — from base.v1, one change (the r1 review): the filled disc of light (haze, band, core)
// is replaced by a thin faint glow ring traced on the floor inside the stones, with four rune ticks, the dark floor
// showing through; still the accent ramp. Everything else as base.v1.
// base.v1 (r1) — adapted from the iso chest template to the brief: a ring of ten low carved stones
// (about 0.1 m, 2 px high) set in the floor of the cell's bottom diamond, with a faint glow on the floor inside the ring
// and a few motes; a 4-frame seamless glow loop driven by ctx.t. Stone ramp for the stones, accent ramp for the light (the
// glow ramp is outside the prop palette, so the gate fails on it; accent is the brief's token for the light). 2D T2+ scene; no floor drawn (the floor tile sits under the prop).
export const meta = { brief: 'terrain-teleporter', pass: 'r2', notes: 'thin glow ring and rune ticks inside the stones, floor showing through', mirror: false };

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

  // the faint light: a thin glow ring traced on the floor inside the stones, the dark floor showing through it, with
  // four short rune ticks on it; the ring's band breathes with the loop (no filled disc)
  const gx = RX - X(3.2), gy = gx / 2, t = Math.max(1, X(1));
  s.add({
    type: 'subtract', name: 'glow-ring', mat: pal.accent, shade: 'flat', band: pulse > 0.5 ? 1 : 2,
    shapes: [{ type: 'ellipse', cx, cy, rx: gx, ry: gy }, { type: 'ellipse', cx, cy, rx: gx - t, ry: gy - t / 2 }],
  });
  const runes = [];
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2 + Math.PI / 4, lit = ((k + Math.round((ctx.t || 0) * 4)) % 4) === 0;
    const rx = Math.round(cx + Math.cos(a) * (gx - X(1.5))), ry = Math.round(cy + Math.sin(a) * (gy - X(0.75)));
    runes.push({ type: 'rect', name: 'rune', x: rx, y: ry, w: 1, h: 1, mat: pal.accent, shade: 'flat', band: lit ? 0 : 2 });
  }
  s.add({ type: 'group', name: 'runes', children: runes });

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
