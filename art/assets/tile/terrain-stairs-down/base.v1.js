// terrain-stairs-down base.v1 (r1) — adapted from the iso floor tile template: a 32 x 16 floor diamond (dirt joints and
// four worn flags framing the well, low in contrast like terrain-floor) with a stairwell cut into it. Three stone treads
// start flush with the floor at the near (south) rim and sink 1 px each toward map north (screen up-right) into a dark
// opening; each tread darkens a band (stone.1, stone.2, dirt.2) and its far edge, the nosing, is one band lighter
// (stone.0 on the top step), the west wall's inner face shows above the sunken treads, and the far end is the outline
// void. Stone + dirt ramps and the outline only. ctx.params.steps: 2-4 treads.
export const meta = { brief: 'terrain-stairs-down', pass: 'r1', notes: 'stairwell of 3 stone treads sinking toward map north into a dark opening' };

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
  const U0 = 0.18, U1 = 0.84, Q0 = 0.08, Q1 = 0.92, n = P.steps, d = 1;
  const well = poly([[U0, Q0], [U1, Q0], [U1, Q1], [U0, Q1]]);
  const L = (Q1 - Q0 - 0.12) / n; // the treads stop short of the far wall, leaving the dark drop beyond them
  const pit = [];
  // the deep void and the far (north) wall's face sinking into it
  pit.push({ type: 'path', name: 'void', d: well, color: 'outline' });
  pit.push({ type: 'path', name: 'farwall', d: poly([[U0, Q0], [U1, Q0], [U1, Q0 + 0.1], [U0, Q0 + 0.1]], 0), mat: dirt, shade: 'flat', band: dD });
  // farthest first, so nearer (higher) treads cover the sunken ones
  for (let k = n - 1; k >= 0; k--) {
    const qa = Q1 - (k + 1) * L, qb = Q1 - k * L, dy = k * d;
    const deep = k / Math.max(1, n - 1);
    // the west wall's inner face above this tread (faces east: the shaded side)
    if (k > 0) pit.push({ type: 'path', name: 'westwall', d: `M${toXY(U0, qa).join(' ')} L${toXY(U0, qb).join(' ')} L${toXY(U0 + 0.07, qb, dy).join(' ')} L${toXY(U0 + 0.07, qa, dy).join(' ')} Z`, mat: k > 1 ? dirt : stone, shade: 'flat', band: k > 1 ? dD : sD });
    // the tread darkens a band with each step down; its far edge (the nosing) catches the light, one band lighter
    const tb = [[stone, 1], [stone, sD], [dirt, dD]][Math.min(2, Math.round(deep * 2))];
    const nb = [[stone, 0], [stone, 1], [stone, sD]][Math.min(2, Math.round(deep * 2))];
    pit.push({ type: 'path', name: 'tread', d: poly([[U0, qa], [U1, qa], [U1, qb], [U0, qb]], dy), mat: tb[0], shade: 'flat', band: tb[1] });
    pit.push({ type: 'path', name: 'nosing', d: poly([[U0, qa], [U1, qa], [U1, qa + 0.13], [U0, qa + 0.13]], dy), mat: nb[0], shade: 'flat', band: nb[1] });
  }
  s.add({ type: 'group', name: 'stairwell', clip: { type: 'path', d: well }, children: pit });
  // the near rims (south and east) are the floor's cut edge: a lit lip of stone along the south rim
  s.add({ type: 'path', name: 'lip', d: poly([[U0, Q1], [U1, Q1], [U1 + 0.02, Q1 + 0.05], [U0, Q1 + 0.05]]), mat: stone, shade: 'flat', band: 1 });
  return ctx.lib.proc(s).noDefaults().render();
}
