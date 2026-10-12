// terrain-stairs-down base.v3 (r3) — from base.v2, one change (the r2 review): 2 deeper readable steps. Each step is
// laid out in whole pixels at a fixed column: a 2 px stone.1 tread, a 1 px stone.0 nosing at its far edge and a 2 px
// riser (stone.2) dropping 3 px to the next; the sunken step and the pit show both side walls'
// inner faces (west wider, east thin, stone.2 / dirt darkest). The dark pit beyond and the floor flags are unchanged.
export const meta = { brief: 'terrain-stairs-down', pass: 'r3', notes: '2 deeper steps: tread, lit nosing, dark riser; both side walls shown' };

export const params = {
  steps: { type: 'range', min: 2, max: 3, step: 1, default: 2 },
};

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h, { outline: false });
  const dirt = pal.dirt, stone = pal.stone, dD = dirt.length - 1, sD = stone.length - 1;
  const cx = w / 2, top = h - 16, hw = w / 2, hh = 8;
  // cell coordinates as in terrain-floor: u runs down-right (map east), q down-left (map south)
  const toXY = (u, q, dy = 0) => [cx + (u - q) * hw, top + (u + q) * hh + dy];
  const poly = (pts, dy = 0) => 'M' + pts.map(([u, q]) => toXY(u, q, dy).map(n => n.toFixed(2)).join(' ')).join(' L') + ' Z';
  const diamond = `M${cx} ${top} L${w} ${top + hh} L${cx} ${h} L0 ${top + hh} Z`;

  // floor: joints in the dark band, four worn flags framing the stairwell in the middle band
  s.add({ type: 'path', name: 'joint', d: diamond, mat: dirt, shade: 'flat', band: dD });
  const flags = [
    [[0.04, 0.04], [0.62, 0.04], [0.6, 0.12], [0.16, 0.12], [0.14, 0.5], [0.04, 0.52]],
    [[0.66, 0.04], [0.96, 0.05], [0.96, 0.6], [0.86, 0.58], [0.84, 0.12], [0.64, 0.12]],
    [[0.04, 0.56], [0.14, 0.54], [0.16, 0.9], [0.5, 0.9], [0.52, 0.96], [0.05, 0.96]],
    [[0.56, 0.9], [0.84, 0.9], [0.86, 0.62], [0.96, 0.64], [0.95, 0.96], [0.56, 0.96]],
  ];
  const floorBits = flags.map((f, i) => ({ type: 'path', name: 'flag', d: poly(f), mat: dirt, shade: 'flat', band: i === 2 ? 0 : 1 }));
  s.add({ type: 'group', name: 'floor', clip: { type: 'path', d: diamond }, children: floorBits });

  // the stairwell: u in [U0, U1], q from Q1 (near rim, south) to Q0 (far rim, north). At a fixed column a q span
  // of k/16 is k px, so each band below is laid out in whole pixels, near to far.
  const U0 = 0.18, U1 = 0.84, Q0 = 0.03, Q1 = 0.92, n = P.steps;
  const well = poly([[U0, Q0], [U1, Q0], [U1, Q1], [U0, Q1]]);
  const px = k => k / 16;
  const T = n > 2 ? 1 : 2, NOSE = 1, RISE = 2, STEP = T + NOSE + RISE; // tread, lit nosing, dark riser (a 3 px drop)
  const pit = [];
  // the deep void fills the well; the far (north) wall's face is a 1 px dark rim at its top
  pit.push({ type: 'path', name: 'void', d: well, color: 'outline' });
  pit.push({ type: 'path', name: 'farwall', d: poly([[U0, Q0], [U1, Q0], [U1, Q0 + px(1)], [U0, Q0 + px(1)]]), mat: dirt, shade: 'flat', band: dD });
  const band = (u0, u1, q0, q1, mat, b, name) => pit.push({ type: 'path', name, d: poly([[u0, q0], [u1, q0], [u1, q1], [u0, q1]]), mat, shade: 'flat', band: b });
  const qPit = Q1 - n * px(STEP);
  // the side walls' inner faces beside the pit: west (lit side away) wide, east thin, both in shadow
  band(U0, U0 + px(2), Q0 + px(1), qPit, stone, sD, 'westwall');
  band(U1 - px(1), U1, Q0 + px(1), qPit, stone, sD, 'eastwall');
  for (let k = 0; k < n; k++) {
    const qb = Q1 - k * px(STEP);           // near edge of this step's band
    const qt = qb - px(T), qn = qt - px(NOSE), qr = qn - px(RISE);
    // each step sinks: the walls beside it show more face the deeper it goes
    const wl = k * px(1), wr = k * px(1);
    if (wl > 0) band(U0, U0 + wl, qr, qb, stone, sD, 'westwall');
    if (wr > 0) band(U1 - wr, U1, qr, qb, stone, sD, 'eastwall');
    band(U0 + wl, U1 - wr, qt, qb, stone, 1, 'tread');
    band(U0 + wl, U1 - wr, qn, qt, stone, 0, 'nosing');
    band(U0 + wl, U1 - wr, qr, qn, stone, sD, 'riser');
  }
  s.add({ type: 'group', name: 'stairwell', clip: { type: 'path', d: well }, children: pit });
  // the near rims (south and east) are the floor's cut edge: a lit lip of stone along the south rim
  s.add({ type: 'path', name: 'lip', d: poly([[U0, Q1], [U1, Q1], [U1 + 0.02, Q1 + 0.05], [U0, Q1 + 0.05]]), mat: stone, shade: 'flat', band: 1 });
  return ctx.lib.proc(s).noDefaults().render();
}
