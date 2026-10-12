// terrain-stairs-down base.v2 (r2) — from base.v1, one change (the r1 review): the opening is the read. The far ~40% of
// the well is a wide dark pit (outline, a dirt-darkest rim on the far wall), and the treads drop 2 px each with a dark
// riser band (dirt's darkest, the outline at the bottom) beyond every nosing; treads step down stone.0, stone.1, stone.2, so only the
// top nosing is stone.0 (the near lip stays stone.1). The drop shows as the west wall's inner face widening step by step.
export const meta = { brief: 'terrain-stairs-down', pass: 'r2', notes: 'wide dark pit in the far part of the well; treads drop 2 px with dark risers' };

export const params = {
  steps: { type: 'range', min: 2, max: 4, step: 1, default: 3 },
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

  // the stairwell: u in [U0, U1], q from Q1 (near rim, south) to Q0 (far rim, north)
  const U0 = 0.18, U1 = 0.84, Q0 = 0.08, Q1 = 0.92, n = P.steps, d = 2;
  const well = poly([[U0, Q0], [U1, Q0], [U1, Q1], [U0, Q1]]);
  const QP = Q0 + 0.4 * (Q1 - Q0);  // the pit: the far 40% of the well
  const L = (Q1 - QP) / n;          // each step's band: tread, nosing, riser
  const D = d / 16;                 // a d px drop is d/16 of q at a fixed column
  const pit = [];
  // the deep void fills the well; the far (north) wall's face is a thin dark rim at its top
  pit.push({ type: 'path', name: 'void', d: well, color: 'outline' });
  pit.push({ type: 'path', name: 'farwall', d: poly([[U0, Q0], [U1, Q0], [U1, Q0 + 0.06], [U0, Q0 + 0.06]]), mat: dirt, shade: 'flat', band: dD });
  const noseB = [[stone, 0], [stone, 1], [stone, sD]];
  // farthest first, so nearer (higher) treads cover the sunken ones
  for (let k = n - 1; k >= 0; k--) {
    const qa = Q1 - (k + 1) * L, qb = Q1 - k * L, dy = k * d, sh = k * D;
    const i = Math.min(2, Math.round(k / Math.max(1, n - 1) * 2));
    // the west wall's inner face, exposed as the sunken tread slides east by its drop
    if (k > 0) pit.push({ type: 'path', name: 'westwall', d: poly([[U0, qa], [U0 + 2 * sh, qa], [U0 + 2 * sh, qb], [U0, qb]]), mat: k > 1 ? dirt : stone, shade: 'flat', band: k > 1 ? dD : sD });
    // band layout near to far: the tread with its lit nosing (too shallow at this size to split), then the dark riser
    const qr = qa + 1.1 / 16; // the riser a pixel deep at a fixed column; the tread (its nosing lit) fills the rest
    const at = (q0, q1) => poly([[U0, q0 - sh], [U1 + 2 * sh, q0 - sh], [U1 + 2 * sh, q1 - sh], [U0, q1 - sh]], dy);
    pit.push({ type: 'path', name: 'nosing', d: at(qr, qb), mat: noseB[i][0], shade: 'flat', band: noseB[i][1] });
    if (k === n - 1) pit.push({ type: 'path', name: 'riser', d: at(qa, qr), color: 'outline' });
    else pit.push({ type: 'path', name: 'riser', d: at(qa, qr), mat: dirt, shade: 'flat', band: dD });
  }
  s.add({ type: 'group', name: 'stairwell', clip: { type: 'path', d: well }, children: pit });
  // the near rims (south and east) are the floor's cut edge: a lit lip of stone along the south rim
  s.add({ type: 'path', name: 'lip', d: poly([[U0, Q1], [U1, Q1], [U1 + 0.02, Q1 + 0.05], [U0, Q1 + 0.05]]), mat: stone, shade: 'flat', band: 1 });
  return ctx.lib.proc(s).noDefaults().render();
}
