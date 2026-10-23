// feature-sarcophagus base.v5 (x2) — from base.v4, keeping its working parts (open: the lid slid back onto the far rim;
// the tub fixed between states), redrawn at pixel scale because the 2 px voxel grid could not hold what the review
// asked: (1) a clear taper, the plan a trapezoid 9 units wide at the head (far-left) and 6 at the foot (near-right),
// so the foot end is about 3 px narrower on screen; (2) a 1 px dark cross inlaid along the lid's long axis (stone.2),
// its crossbar near the head, on a light lid top with a 1 px stone.1 border; (3) open: the tub's top course is
// hollowed, its rim lit and the cavity (floor and inner walls) in the darkest steps (stone.2, dirt.2); the tub's
// outer faces are the same pixels in both states; (4) the plinth is two horizontal courses at the base, a lit ledge
// over a mid band over a dark band, following each face's base edge. Rendered by a small per-pixel raycast through
// the solid (1 unit = 1 px across, 1/2 px down; z 1 px), outer ink drawn here; ramps only (R11).
export const meta = { brief: 'feature-sarcophagus', pass: 'x2', notes: 'pixel-scale tapered coffin, dark cross inlay on the lid, two-band plinth; open = lid slid back onto the far rim over a dark cavity, tub fixed', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir, ink = ctx.dir.outline, open = ctx.state === 'open';
  const g = ctx.lib.t2.scene3d({ k: 2 }).render(w, h, { renderer: 'raster', yaw: 45, pivot: [0, 0, 0], at: [w / 2, h - 8], shadow: false });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g.alpha(x, y) > 0) g.clear(x, y);
  const s = pal.stone, d = pal.dirt;

  // the plan: head at x 0, foot at x L; the long axis's centre line at y C; half-width tapers head to foot
  const L = 15, HW0 = 4, HW1 = 2.5, C = HW0;
  const hw = (x) => HW0 + (HW1 - HW0) * (x / L);
  const inPlan = (x, y, grow) => x >= -grow && x < L + grow && Math.abs(y - C) < hw(Math.min(Math.max(x, 0), L)) + grow;
  const PL = 2, TOP = 6, LID = 2, WALL = 1.5, FLOOR = 3, BACK = open ? 4 : 0; // plinth top, tub top, lid thickness, open: lid slides BACK
  // solid parts: 1 plinth (grown 1), 2 tub, 3 lid (grown 0.5, shifted back when open)
  const part = (x, y, z) => {
    if (z < 0) return 0;
    if (z < PL) return inPlan(x, y, 1) ? 1 : 0;
    if (z < TOP) {
      if (!inPlan(x, y, 0)) return 0;
      if (open && z >= FLOOR && inPlan(x - WALL, y, 0) && inPlan(x + WALL, y, 0) && Math.abs(y - C) < hw(Math.min(Math.max(x, 0), L)) - WALL) return 0;
      return 2;
    }
    if (z < TOP + LID) return inPlan(x, y + BACK, 0.5) ? 3 : 0;
    return 0;
  };

  // screen: sx = X0 + (x - y), sy = Y0 + (x + y) / 2 - z; the plan's centre stands on the cell centre (1 px left)
  const X0 = w / 2 - 1 - (L / 2 - C), Y0 = h - 8 - (L / 2 + C) / 2;
  const STEP = 0.02, E = 0.05;
  // which face a hit lies on: 'top' (a horizontal face), 'side' (looking +y: the near long side, or the hollow's far
  // inner wall) or 'end' (looking +x: the foot end, or the hollow's head inner wall)
  const faceOf = (p, x, y, z) => {
    if (part(x, y, z + E) !== p) return 'top';
    const grow = p === 1 ? 1 : p === 3 ? 0.5 : 0, yy = p === 3 ? y + BACK : y, xc = Math.min(Math.max(x, 0), L);
    const outSide = hw(xc) + grow - Math.abs(yy - C), outEnd = L + grow - x;
    if (open && p === 2 && z >= FLOOR && outSide > WALL - E - 0.3 && outEnd > WALL - E - 0.3 && x > WALL - E - 0.3) {
      const inSide = Math.abs(yy - (C - (hw(xc) - WALL))), inEnd = Math.abs(x - WALL);
      return inSide < inEnd ? 'side' : 'end';
    }
    return outSide < outEnd ? 'side' : 'end';
  };
  const hit = (px, py) => {
    const sx = px + 0.5 - X0, sy = py + 0.5 - Y0, Z = 20;
    let x = (sx + 2 * (sy + Z)) / 2, y = (2 * (sy + Z) - sx) / 2, z = Z;
    for (let t = 0; t < 60; t += STEP) {
      const p = part(x, y, z);
      if (p) {
        return { p, face: faceOf(p, x, y, z), x, y, z };
      }
      x -= STEP; y -= STEP; z -= STEP;
    }
    return null;
  };

  const colour = ({ p, face, x, y, z }) => {
    if (p === 1) { // plinth: a lit ledge, then two horizontal courses
      if (face === 'top') return s[0];
      if (face === 'side') return z >= 1.5 ? d[0] : s[2];
      return z >= 1.5 ? d[1] : s[2];
    }
    if (p === 2) {
      const cavity = open && z <= TOP - 0.01 && (face === 'top' ? z < TOP - 0.5 : inPlan(x, y, 0) && z >= FLOOR && (Math.abs(y - C) < hw(Math.min(Math.max(x, 0), L)) - WALL + 0.6 || x < WALL + 0.6));
      if (open && face !== 'top' && z >= FLOOR && isInner(x, y)) return face === 'side' ? d[2] : s[2];
      if (face === 'top') return cavity ? s[2] : s[0];   // the rim lit; the cavity floor darkest
      return face === 'side' ? s[1] : d[1];
    }
    // lid: dark bottom edge (the seam), side faces, light top with a stone.1 border and a stone.2 cross
    if (face !== 'top') return z < TOP + 0.75 ? s[2] : face === 'side' ? s[1] : d[1];
    const ly = y + BACK, half = hw(Math.min(Math.max(x, 0), L)) + 0.5;
    const off = Math.abs(ly - C);
    if (x < 0.5 || x > L - 0.5 || off > half - 1) return s[1];
    if (Math.abs(ly - C) < 0.5 && x > 1.5 && x < L - 2) return s[2];
    if (x >= 4 && x < 5 && off < half - 1.8) return s[2];
    return s[0];
  };
  // inner walls of the hollow: faces met inside the outer plan, away from its outer boundary
  const isInner = (x, y) => Math.abs(y - C) < hw(Math.min(Math.max(x, 0), L)) - 0.3 && x > 0.3 && x < L - 0.3;

  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const r = hit(px, py);
    if (r) g.set(px, py, colour(r));
  }
  // outer ink: every empty pixel touching the object (4-neighbours)
  const filled = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) filled.push(g.alpha(x, y) > 0);
  const f = (x, y) => x >= 0 && y >= 0 && x < w && y < h && filled[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
    if (!f(x, y) && (f(x - 1, y) || f(x + 1, y) || f(x, y - 1) || f(x, y + 1))) g.set(x, y, ink);
  return g;
}
