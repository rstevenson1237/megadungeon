// terrain-stairs-down base.v4 (x1, extra revision after the blind re-score) — from base.v3, one change: the descent.
// The blind review of finish.v1 (6): every tread shared one tone with no riser, so the stair read as bars on a hatch,
// the pit was a flat fill and the far rim's 3 outline dots read as specks. Now the stairwell is laid out pixel by
// pixel in whole-pixel bands of the cell's q (near to far, one band = 1 px at any column):
// - the treads shade down the stone ramp: the near tread stone.1 under a stone.0 nosing, the middle one stone.1
//   going to dirt's darkest under a nosing lit only at its west (light) end, the last a dirt-dark tread whose dim
//   stone.1 nosing fades into the opening's shadow; a 1 px stone.2 riser under every nosing, so each tread steps down;
// - the side walls' inner faces widen 1 px per step as the treads sink (as in v3);
// - the pit grades from stone.2 by the last riser to the outline colour only in the deepest 1 px at the far wall;
// - the far edge is a continuous 1 px stone.1 rim lip instead of the 3 dots.
// finish.v1's floor fixes are folded in (the mottled left lip and the soft dirt.1 edge on the opening's lit side);
// the graded pit replaces its pit fix. Ramps: stone, dirt (the floor; dirt.2 in the opening) and outline only.
export const meta = { brief: 'terrain-stairs-down', pass: 'x1', notes: 'the descent: treads light to dark, 1 px risers, graded pit, continuous far rim lip' };

export const params = {
  steps: { type: 'range', min: 3, max: 3, step: 1, default: 3 },
};

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h, { outline: false });
  const dirt = pal.dirt, stone = pal.stone, dD = dirt.length - 1, sD = stone.length - 1;
  const cx = w / 2, top = h - 16, hw = w / 2, hh = 8;
  // cell coordinates as in terrain-floor: u runs down-right (map east), q down-left (map south)
  const toXY = (u, q, dy = 0) => [cx + (u - q) * hw, top + (u + q) * hh + dy];
  const toUQ = (x, y) => { const a = (x - cx) / hw, b = (y - top) / hh; return [(a + b) / 2, (b - a) / 2]; };
  const poly = (pts, dy = 0) => 'M' + pts.map(([u, q]) => toXY(u, q, dy).map(n => n.toFixed(2)).join(' ')).join(' L') + ' Z';
  const diamond = `M${cx} ${top} L${w} ${top + hh} L${cx} ${h} L0 ${top + hh} Z`;
  const S = i => `stone.${Math.min(i, sD)}`, D = i => `dirt.${Math.min(i, dD)}`;

  // floor: joints in the dark band, four worn flags framing the stairwell in the middle band (as v3)
  s.add({ type: 'path', name: 'joint', d: diamond, mat: dirt, shade: 'flat', band: dD });
  const flags = [
    [[0.04, 0.04], [0.62, 0.04], [0.6, 0.12], [0.16, 0.12], [0.14, 0.5], [0.04, 0.52]],
    [[0.66, 0.04], [0.96, 0.05], [0.96, 0.6], [0.86, 0.58], [0.84, 0.12], [0.64, 0.12]],
    [[0.04, 0.56], [0.14, 0.54], [0.16, 0.9], [0.5, 0.9], [0.52, 0.96], [0.05, 0.96]],
    [[0.56, 0.9], [0.84, 0.9], [0.86, 0.62], [0.96, 0.64], [0.95, 0.96], [0.56, 0.96]],
  ];
  const floorBits = flags.map((f, i) => ({ type: 'path', name: 'flag', d: poly(f), mat: dirt, shade: 'flat', band: i === 2 ? 0 : 1 }));
  s.add({ type: 'group', name: 'floor', clip: { type: 'path', d: diamond }, children: floorBits });

  // finish.v1's floor fixes, folded in: the left flag's solid dirt.0 broken into the floor's mottle with one light
  // speck, and the opening's lit (west) edge softened from dirt.2 to dirt.1 so the cut sits flush
  const floorFix = {
    5: { 6: 1, 7: 2, 8: 1 }, 6: { 4: 2, 5: 1, 6: 1, 7: 1 }, 7: { 2: 1, 3: 0, 4: 1, 5: 2 }, 8: { 2: 1, 3: 2, 4: 1 },
    3: { 14: 1 }, 4: { 12: 1 },
  };
  floorFix[5][9] = 1; floorFix[5][10] = 1; floorFix[6][8] = 1; floorFix[7][6] = 1;
  const fix = [];
  for (const [y, row] of Object.entries(floorFix)) for (const [x, b] of Object.entries(row)) {
    fix.push({ type: 'rect', name: 'floorfix', x: +x, y: top + +y, w: 1, h: 1, color: D(b) });
  }
  s.add({ type: 'group', name: 'floorfix', children: fix });

  // the stairwell: u in [U0, U1], q from Q1 (near rim, south) to Q0 (far rim, north), 14 whole px of q
  const U0 = 0.18, U1 = 0.84, Q1 = 0.92, Q0 = Q1 - 14 / 16;
  // band o counts px from the near rim; a tone per band, near to far: tread, nosing, riser per step, then the pit
  const W = 'west', E = 'east';
  const bands = [
    { t: S(1), part: 'tread', k: 0 }, { t: S(1), part: 'tread', k: 0 }, { t: S(0), part: 'nosing', k: 0 }, { t: S(sD), part: 'riser', k: 0 },
    { t: D(dD), part: 'tread', k: 1 }, { t: D(dD), part: 'tread', k: 1 }, { t: S(1), part: 'nosing', k: 1 }, { t: S(sD), part: 'riser', k: 1 },
    { t: S(sD), part: 'tread', k: 2 }, { t: S(sD), part: 'tread', k: 2 }, { t: D(dD), part: 'nosing', k: 2 }, { t: S(sD), part: 'riser', k: 2 },
    { t: 'outline', part: 'pit', k: 3 }, { t: S(1), part: 'rim', k: 3 },
  ];
  const wallW = k => [Math.min(k, 2) + (k >= 3 ? 0 : 0), Math.min(k, 1) + (k >= 3 ? 0 : 0)]; // west, east face width in px
  const runs = new Map();                                   // token -> pixel runs, merged along each row
  const put = (x, y, t, name) => {
    const key = `${t}|${name}`; if (!runs.has(key)) runs.set(key, []);
    const r = runs.get(key), last = r[r.length - 1];
    if (last && last.y === y && last.x + last.w === x) last.w++; else r.push({ x, y, w: 1 });
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [u, q] = toUQ(x + 0.5, y + 0.5);
    if (u < U0 || u >= U1 || q < Q0 || q >= Q1) continue;
    const o = Math.min(13, Math.floor((Q1 - q) * 16)), b = bands[o];
    const du0 = (u - U0) * 16, du1 = (U1 - u) * 16;         // px from the west / east wall along u
    if (b.part !== 'rim') {
      const [wl, wr] = b.part === 'pit' ? [2, 1] : wallW(b.k);
      if (du0 < wl) { put(x, y, S(sD), W + 'wall'); continue; }
      if (du1 < wr) { put(x, y, S(sD), E + 'wall'); continue; }
    }
    put(x, y, b.t, b.part);
  }
  const pit = [];
  for (const [key, r] of runs) {
    const [t, name] = key.split('|');
    for (const { x, y, w: rw } of r) pit.push({ type: 'rect', name, x, y, w: rw, h: 1, color: t });
  }
  s.add({ type: 'group', name: 'stairwell', children: pit });
  // the near rims (south and east) are the floor's cut edge: a lit lip of stone along the south rim (as v3)
  s.add({ type: 'path', name: 'lip', d: poly([[U0, Q1], [U1, Q1], [U1 + 0.02, Q1 + 0.05], [U0, Q1 + 0.05]]), mat: stone, shade: 'flat', band: 1 });
  return ctx.lib.proc(s).noDefaults().render();
}
