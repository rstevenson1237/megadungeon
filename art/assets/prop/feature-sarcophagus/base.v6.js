// feature-sarcophagus base.v6 (x1, art redo wave 2) — from base.v3, the base finish.v1 finished (the best, 6.5). It
// acts on the blind reviewer's point (generic stone chest: boxy body, no taper, no carving, open lid floats up) with
// the approved redo fix, redrawn as flat iso faces in screen space so every edge is a clean projected line:
// (1) taper: a coffin plan, widest at the shoulders near the head and narrowing to a slim foot (hexagonal coffin
//     profile, 9 units across at the shoulders, 5 at the foot);
// (2) the lid is two tiers, a wide lit band over the tub and a raised inner panel, and the panel carries a carved
//     cross relief (a long bar down the lid with its crossbar near the head: a dark cut with a lit lower lip);
// (3) a single darker plinth course under the tub, stepped out with a lit ledge (no stacked bands or side lines);
// (4) open: the tub stays on exactly the closed pixels; the lid is slid diagonally off the head end (back, toward
//     the head and turned a little), and the tub top shows a wide dark cavity (dark inner walls, darkest floor)
//     inside a lit rim.
// Ramps and tokens only (R11); outer ink from the direction's line pass.
export const meta = { brief: 'feature-sarcophagus', pass: 'x1', notes: 'tapered coffin plan, two-tier lid with carved cross, dark plinth; open = lid slid diagonally off the head end over a dark cavity', mirror: false };

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, open = ctx.state === 'open';
  const s = ctx.lib.t2.scene(w, h, { outline: true });
  const cx = w / 2 - 1, cy = h - 8;                                   // the cell centre (plan centre a touch left)
  const k = w / 32;
  // plan (u along the body, head at -u; v across, near side +v); screen: 1 unit = 1 px across, 1/2 down, z 1 px up
  const P = (u, v, z) => [cx + (u - v) * k, cy + ((u + v) / 2 - z) * k];
  const HEAD = -8.5, SH = -5, FOOT = 8.5, HH = 3.2, HS = 4.5, HF = 2.5;
  const plan = (g = 0) => [
    [HEAD - g, -HH - g], [SH, -HS - g], [FOOT + g, -HF - g],
    [FOOT + g, HF + g], [SH, HS + g], [HEAD - g, HH + g],
  ];
  const Z0 = 0, ZP = 2, ZT = 7, ZL = 8, ZC = 9.5;                   // plinth top, tub top, lid band, lid panel top

  // a plan transform for the open lid: turned about its centre, then slid back and toward the head
  const ang = open ? (10 * Math.PI) / 180 : 0, du = open ? -1.5 : 0, dv = open ? -6 : 0;
  const lidT = ([u, v]) => [u * Math.cos(ang) - v * Math.sin(ang) + du, u * Math.sin(ang) + v * Math.cos(ang) + dv];

  // a prism: its visible sides (outward normal toward the viewer, +u+v), then its top
  const prism = (name, pts, z0, z1, side, top) => {
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      const nu = b[1] - a[1], nv = -(b[0] - a[0]);                   // outward normal of a clockwise-in-screen ring
      if (nu + nv <= 0.01) continue;
      const band = side(nu, nv);
      s.add({ type: 'poly', name: `${name}-side${i}`, pts: [P(a[0], a[1], z0), P(b[0], b[1], z0), P(b[0], b[1], z1), P(a[0], a[1], z1)], mat: band[0], shade: 'flat', band: band[1] });
    }
    if (top) s.add({ type: 'poly', name: `${name}-top`, pts: pts.map(([u, v]) => P(u, v, z1)), mat: top[0], shade: 'flat', band: top[1] });
  };
  // left-facing (+v) sides take the light, right-facing (+u) sides fall in shade
  const shade = (lit, dark) => (nu, nv) => (nv >= nu ? lit : dark);

  prism('plinth', plan(1), Z0, ZP, shade([pal.dirt, 1], [pal.dirt, 2]), [pal.metal, 1]);
  prism('tub', plan(0), ZP, ZT, shade([pal.stone, 1], [pal.dirt, 1]), [pal.stone, 0]);

  if (open) {
    // the cavity: a 1-unit rim, dark inner walls (the far and head walls face us) and the darkest floor below
    const inner = plan(-0.9), rimTop = inner.map(([u, v]) => P(u, v, ZT));
    s.add({ type: 'poly', name: 'cavity-wall', pts: rimTop, mat: pal.dirt, shade: 'flat', band: 2 });
    s.add({ type: 'group', name: 'cavity', clip: { type: 'poly', pts: rimTop }, children: [
      { type: 'poly', name: 'cavity-floor', pts: inner.map(([u, v]) => P(u, v, ZP + 1.5)), mat: pal.stone, shade: 'flat', band: 2 },
    ] });
  }

  // the lid: a wide band (overhanging the tub by half a unit), then a raised panel inset from it
  const band = plan(0.5).map(lidT), panel = plan(-0.6).map(lidT);
  prism('lid', band, ZT, ZL, shade([pal.metal, 1], [pal.dirt, 0]), [pal.stone, 0]);
  prism('lid-panel', panel, ZL, ZC, shade([pal.stone, 1], [pal.dirt, 1]), [pal.metal, 0]);

  // the carved cross on the panel: a dark cut (stone.1) with a lit lower lip (stone.0), plotted in plan so its
  // arms run along the lid's two axes
  const quad = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(lidT).map(([u, v]) => P(u, v, ZC));
  const XB = -4.2;                                                    // the crossbar, near the head
  for (const [name, q] of [['cross-long', quad(-6.5, 5.5, -0.9, 0.9)], ['cross-bar', quad(XB - 0.9, XB + 0.9, -2.8, 2.8)]])
    s.add({ type: 'poly', name, pts: q, mat: pal.stone, shade: 'flat', band: 2 });
  for (const [name, q] of [['cross-lip', quad(-6.5, 5.5, 0.9, 1.5)], ['cross-bar-lip', quad(XB + 0.9, XB + 1.5, -2.8, 2.8)]])
    s.add({ type: 'poly', name, pts: q, mat: pal.stone, shade: 'flat', band: 0 });

  return ctx.lib.proc(s).add('groundShadow', {}).render();
}
