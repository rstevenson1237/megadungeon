// setpiece-abyssal-throne base.v1 (r1) — from the iso chest template, redrawn for the brief: the Abyssal Throne of
// level 100, a vast black throne on a stepped dais (4 m, the large 64 x 80 frame). Painted pixel by pixel in the 2:1
// projection the approved features use (feature-altar base.v5, feature-sarcophagus base.v5: 1 unit = 1 px across,
// 1/2 px down, 1 px up; lit tops, mid +Y faces, dark +X faces; the direction's line pass for the outline).
// - Dais: three square stone steps (26, 21 and 16 units across, 3 px risers) seen corner-on as a stepped diamond, each
//   with a lit nosing on its two front edges so the steps read at 1x.
// - Throne (black: the dirt and stone ramps' darkest steps) set square to the viewer on the dais's diagonal, so its
//   full width shows: a tall back rising about 30 px over the seat, ribbed with dark grooves and crowned with five
//   spikes (the middle one tallest); a low seat; two heavy arms set wide, with knuckled front ends. Every part is a
//   prism with chamfered front corners, so each shows a lit left bevel and a dark right bevel beside its front face.
// - The one bright accent: an ember slit down the middle of the back (glow ramp, a dark-red accent rim), so the
//   throne stands out on the theme's dark red floor. Role ramps from ctx.dir.pal only (R11).
export const meta = { brief: 'setpiece-abyssal-throne', pass: 'r1', notes: 'pixel-painted: three-step diamond dais, frontal black throne with a tall ribbed back and five spikes, heavy knuckled arms, ember slit in the back', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir;
  const g = new ctx.lib.Grid(w, h), CX = w / 2, CY = h - 15;
  const S = pal.stone, DK = pal.dirt, A = pal.accent, G = pal.glow;
  // model (X down-right, Y down-left, Z up; 1 px per unit) to screen. The throne is laid out in (a, f): a across the
  // screen, f toward the viewer (X = (f + a) / 2, Y = (f - a) / 2), so sx = CX + a, sy = CY + f / 2 - z.
  const sx = (X, Y) => CX + X - Y, sy = (X, Y, Z) => CY + (X + Y) / 2 - Z;
  const P3 = (X, Y, Z) => [sx(X, Y), sy(X, Y, Z)];
  const Q = (a, f, z) => [CX + a, CY + f / 2 - z];
  const inPoly = (pts, x, y) => {             // pixel centre inside a convex polygon (either winding)
    let pos = 0, neg = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
      const c = (x1 - x0) * (y - y0) - (y1 - y0) * (x - x0);
      if (c > 1e-9) pos++; else if (c < -1e-9) neg++;
    }
    return !(pos && neg);
  };
  const fill = (pts, col) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
      if (inPoly(pts, x + 0.5, y + 0.5)) g.set(x, y, typeof col === 'function' ? col(x, y) : col);
  };
  const px = (x, y, c) => { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < w && y < h) g.set(x, y, c); };

  // the dais: three square steps, a lit nosing along each step's two front edges
  const STEPS = [[13, 0, 3], [10.5, 3, 6], [8, 6, 9]];
  for (const [r, z0, z1] of STEPS) {
    fill([P3(r, r, z1), P3(r, r, z0), P3(-r, r, z0), P3(-r, r, z1)], DK[0]);
    fill([P3(r, -r, z1), P3(r, -r, z0), P3(r, r, z0), P3(r, r, z1)], DK[1]);
    fill([P3(-r, -r, z1), P3(r, -r, z1), P3(r, r, z1), P3(-r, r, z1)], S[1]);
    for (let t = -r; t < r; t += 0.5) {
      px(sx(t, r) + 0.5, sy(t, r, z1) - 0.5, S[0]);
      px(sx(r, t) - 0.5, sy(r, t, z1) - 0.5, S[0]);
    }
  }
  const ZD = 9;                                                 // the dais top

  // the black throne's tones: top, front face, lit left bevel, dark right bevel, a rim highlight
  const T = { top: DK[1], front: DK[2], left: DK[1], right: S[2] }, RIM = DK[0];
  // a throne part: a0..a1 across, f0..f1 deep, z0..z1 high, front corners chamfered by c (screen px)
  const part = (a0, a1, f0, f1, z0, z1, c = 2, top = T.top) => {
    fill([Q(a0, f1 - c, z1), Q(a0 + c, f1, z1), Q(a0 + c, f1, z0), Q(a0, f1 - c, z0)], T.left);
    fill([Q(a1 - c, f1, z1), Q(a1, f1 - c, z1), Q(a1, f1 - c, z0), Q(a1 - c, f1, z0)], T.right);
    fill([Q(a0 + c, f1, z1), Q(a1 - c, f1, z1), Q(a1 - c, f1, z0), Q(a0 + c, f1, z0)], T.front);
    fill([Q(a0, f0, z1), Q(a1, f0, z1), Q(a1, f1 - c, z1), Q(a1 - c, f1, z1), Q(a0 + c, f1, z1), Q(a0, f1 - c, z1)], top);
    for (let a = a0 + c; a < a1 - c; a++) px(CX + a, CY + f1 / 2 - z1, RIM);   // the lit front edge of the top
  };

  // the back: wide and tall, across the dais's rear
  const BA = 11, BF0 = -8, BF1 = -3, ZB = ZD + 34;
  part(-BA, BA, BF0, BF1, ZD, ZB);
  // spikes along the crown, each a pyramid lit on its left half; the middle one tallest
  for (const [a, H, r] of [[-9.5, 7, 1.5], [-5, 10, 1.5], [0, 16, 2], [5, 10, 1.5], [9.5, 7, 1.5]]) {
    const yb = CY + BF0 / 2 - ZB + 2, tip = [CX + a, yb - H];
    fill([[CX + a - r, yb], [CX + a, yb], tip], T.left);
    fill([[CX + a, yb], [CX + a + r, yb], tip], T.right);
  }
  // ribs: dark grooves down the back's front face, each with a lit edge on its left
  const faceTop = CY + BF1 / 2 - ZB, faceBot = CY + BF1 / 2 - ZD;
  for (const a of [-7, -4, 4, 7]) for (let y = faceTop + 2; y < faceBot - 1; y++) {
    px(CX + a, y, T.right);
    px(CX + a - 1, y, RIM);
  }
  // the ember: a glowing slit down the middle of the back, a white-hot core in an orange glow with a dark-red rim
  for (let y = faceTop + 5; y < faceTop + 25; y++) {
    const core = y > faceTop + 8 && y < faceTop + 22;
    px(CX - 1, y, core ? G[1] : A[2]);
    px(CX, y, core ? G[0] : G[1]);
    px(CX + 1, y, A[2]);
  }
  px(CX - 1, faceTop + 4, A[2]); px(CX, faceTop + 4, A[2]);
  px(CX - 1, faceTop + 25, A[2]); px(CX, faceTop + 25, A[2]);

  // the seat, low between the arms
  part(-7, 7, BF1, 8, ZD, ZD + 7, 2);
  // the heavy arms, set wide, each ending in a knuckled block that overhangs its front
  for (const [a0, a1] of [[-12, -7], [7, 12]]) {
    part(a0, a1, BF1, 8, ZD, ZD + 14, 1.5);
    part(a0 - 0.5, a1 + 0.5, 6, 11, ZD + 12, ZD + 17, 1.5, RIM);
  }

  return ctx.lib.line(g);
}
