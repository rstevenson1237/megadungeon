// feature-sarcophagus base.v5 (x2) — from base.v4, keeping its working parts (a straight far side; open: the lid slid
// back onto the far rim; the tub the same pixels in both states), redrawn at pixel scale because the 2 px voxel grid
// could not hold what the review asked: (1) a clear taper, the plan 8 units wide at the head (far-left) and 4.5 at
// the foot (near-right), the near side slanting, so the foot end is 3-4 px narrower on screen; (2) a 1 px dark cross
// (stone.2) inlaid along the lid's long axis, its crossbar near the head, on a light lid top; (3) open: the tub's top
// course is hollowed inside a 1-unit rim and the cavity (floor and inner walls) is in the darkest steps (stone.2,
// dirt.2); the lid slides back onto the far rim and 2.5 units toward the head (off the head end), so most of the
// hollow shows; the tub's outer faces keep their colours;
// (4) the plinth is two horizontal courses at the base under a lit ledge: a mid band over a dark band, following each
// face's base edge. Rendered by a per-pixel raycast through the solid (1 unit = 1 px across, 1/2 px down; z 1 px),
// outer ink drawn here; ramps only (R11).
export const meta = { brief: 'feature-sarcophagus', pass: 'x2', notes: 'pixel-scale tapered coffin, dark cross inlay on the lid, two-band plinth; open = lid slid back onto the far rim over a dark cavity, tub fixed', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir, ink = ctx.dir.outline, open = ctx.state === 'open';
  const g = ctx.lib.t2.scene3d({ k: 2 }).render(w, h, { renderer: 'raster', yaw: 45, pivot: [0, 0, 0], at: [w / 2, h - 8], shadow: false });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g.alpha(x, y) > 0) g.clear(x, y);
  const s = pal.stone, d = pal.dirt;

  // the plan: head at x 0, foot at x L; the far side straight at y 0, the near side tapering from W0 to W1 wide
  const L = 13, W0 = 8, W1 = 4.5;
  const wd = (x) => W0 + (W1 - W0) * (Math.min(Math.max(x, 0), L) / L);
  const inPlan = (x, y, grow) => x >= -grow && x < L + grow && y >= -grow && y < wd(x) + grow;
  // plinth top, tub top, lid thickness, wall, cavity floor; open: the lid slides BACK onto the far rim and HEAD-ward,
  // so its narrow foot end still rests on the rim and most of the hollow shows
  const PL = 3, TOP = 7, LID = 2, WALL = 1, FLOOR = 4, BACK = open ? 5.5 : 0, HEAD = open ? 2.5 : 0;
  const hollow = (x, y) => x >= WALL && x < L - WALL && y >= WALL && y < wd(x) - WALL;
  // solid parts: 1 plinth (grown 1), 2 tub, 3 lid (grown 0.5)
  const part = (x, y, z) => {
    if (z < 0) return 0;
    if (z < PL) return inPlan(x, y, 1) ? 1 : 0;
    if (z < TOP) return inPlan(x, y, 0) && !(open && z >= FLOOR && hollow(x, y)) ? 2 : 0;
    if (z < TOP + LID) return inPlan(x + HEAD, y + BACK, 0.5) ? 3 : 0;
    return 0;
  };

  // which face a hit lies on: 'top', 'side' (looking +y: the near long side), 'end' (looking +x: the foot end), or
  // the hollow's 'inner-side' (its far wall) and 'inner-end' (its head wall)
  const E = 0.05;
  const faceOf = (p, x, y, z) => {
    if (part(x, y, z + E) !== p) return 'top';
    const grow = p === 1 ? 1 : p === 3 ? 0.5 : 0, yy = p === 3 ? y + BACK : y, xx = p === 3 ? x + HEAD : x;
    const outSide = wd(xx) + grow - yy, outEnd = L + grow - xx;
    if (open && p === 2 && z >= FLOOR - 0.3 && outSide > WALL - 0.4 && outEnd > WALL - 0.4) {
      const dSide = Math.abs(y - WALL), dEnd = Math.abs(x - WALL);
      if (Math.abs(z - FLOOR) < Math.min(dSide, dEnd)) return 'top';   // the cavity floor, where it meets a wall
      return dSide < dEnd ? 'inner-side' : 'inner-end';
    }
    return outSide < outEnd ? 'side' : 'end';
  };
  // screen: sx = X0 + (x - y), sy = Y0 + (x + y) / 2 - z; the plan's centre stands on the cell centre, 2 px left so
  // the open lid fits the frame
  const X0 = w / 2 - 2 - (L - W0) / 2, Y0 = h - 8 - (L + W0) / 4, STEP = 0.02;
  const hit = (px, py) => {
    const sx = px + 0.5 - X0, sy = py + 0.5 - Y0, Z = 20;
    let x = (sx + 2 * (sy + Z)) / 2, y = (2 * (sy + Z) - sx) / 2, z = Z;
    for (let t = 0; t < 60; t += STEP) {
      const p = part(x, y, z);
      if (p) return { p, face: faceOf(p, x, y, z), x, y, z };
      x -= STEP; y -= STEP; z -= STEP;
    }
    return null;
  };

  const colour = ({ p, face, x, y, z }) => {
    if (p === 1) { // plinth: a lit ledge over two horizontal courses, mid over dark
      if (face === 'top') return s[0];
      if (face === 'side') return z >= 1.5 ? d[1] : s[2];
      return z >= 1.5 ? d[2] : s[2];
    }
    if (p === 2) {
      if (face === 'inner-side') return d[2];                     // the hollow's far wall, darkest
      if (face === 'inner-end') return s[2];                      // the hollow's head wall, darkest
      if (face === 'top') return z < TOP - 0.5 ? s[2] : s[0];     // the cavity floor darkest; the rim lit
      return face === 'side' ? s[1] : d[1];
    }
    // lid: a dark seam along its bottom edge, side faces, a light top (the cross is plotted below)
    if (face !== 'top') return z < TOP + 0.75 ? s[2] : face === 'side' ? s[1] : d[1];
    return s[0];
  };

  const lidTop = new Uint8Array(w * h);
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const r = hit(px, py);
    if (!r) continue;
    g.set(px, py, colour(r));
    if (r.p === 3 && r.face === 'top') lidTop[py * w + px] = 1;
  }
  // the cross, inlaid 1 px wide in stone.2 on the lid top, plotted in screen space so its lines stay clean 2:1 steps:
  // the long bar along the lid's centre line, the crossbar near the head
  const zt = TOP + LID, at = (x, y) => [Math.floor(X0 + x - y), Math.floor(Y0 + (x + y) / 2 - zt)];
  const plot = ([px, py]) => { if (px >= 0 && py >= 0 && px < w && py < h && lidTop[py * w + px]) g.set(px, py, s[2]); };
  const mid = Math.round((W0 + W1) / 4) - BACK;   // a straight centre line, so the bar steps evenly
  for (let x = 1; x <= L - 2; x += 1) plot(at(x - HEAD, mid));
  for (let y = -2; y <= 2; y += 1) plot(at(4 - HEAD, mid + y));
  // outer ink: every empty pixel touching the object (4-neighbours)
  const filled = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) filled.push(g.alpha(x, y) > 0);
  const f = (x, y) => x >= 0 && y >= 0 && x < w && y < h && filled[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
    if (!f(x, y) && (f(x - 1, y) || f(x + 1, y) || f(x, y - 1) || f(x, y + 1))) g.set(x, y, ink);
  return g;
}
