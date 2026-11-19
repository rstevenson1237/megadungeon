// setpiece-abyssal-throne base.v2 (r2) — from base.v1 (6.5: "throne body is drawn front-on and flat (no iso side face,
// seat or arms), so it clashes with the iso dais and looks like a slab; grey not black, low contrast on dark floor,
// banded dais edges"). One change, the review's point: the throne is rebuilt in the dais's own 2:1 projection.
// - The throne is now a set of iso boxes in the same model space as the dais (X down-right, Y down-left, Z up), set
//   corner-on and facing +Y (the viewer's lower left): its front planes take the mid tone, its +X side plane the dark
//   tone, its tops the lit tone, exactly as the approved feature-altar / feature-sarcophagus boxes do.
// - Parts: a tall back slab across the rear of the top step, with four raised ribs on its front that run up past the
//   top edge into spikes, and a tallest middle spike; a real seat box between two heavy arms, each arm ending in an
//   overhanging knuckle block; the whole throne fills the dais's (wider) top step and uses the frame's full height.
// - Near-black: tops stone's darkest step, fronts cloth's darkest, sides leather's darkest (no pure black), with a
//   rim highlight (stone's mid step) on the lit edges — the top-to-front edges and the back-left vertical edges, the
//   side the direction's light [-1, -1, 1] comes from — so it reads on level 100's dark floor.
//   A softer edge (dirt's darkest step) runs where each top meets its dark side, so the arm's side plane parts from the back's.
// - The ember slit stays the one bright accent (glow ramp with a dark-red accent rim), down the back between the ribs.
// - The dais steps drop the per-step bright nosing that banded at 1x: clean three-tone steps (lit tread, mid left
//   riser, dark right riser). Role ramps from ctx.dir.pal only (R11); the outline is the direction's line pass.
export const meta = { brief: 'setpiece-abyssal-throne', pass: 'r2', notes: 'iso throne: corner-on near-black boxes (back, ribs into spikes, seat, heavy knuckled arms), rim-lit edges, ember slit; clean three-tone dais', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir;
  const g = new ctx.lib.Grid(w, h), CX = w / 2, CY = h - 16;
  const S = pal.stone, DK = pal.dirt, A = pal.accent, G = pal.glow;
  // model (X down-right, Y down-left, Z up; 1 px per unit) to screen
  const sx = (X, Y) => CX + X - Y, sy = (X, Y, Z) => CY + (X + Y) / 2 - Z;
  const P3 = (X, Y, Z) => [sx(X, Y), sy(X, Y, Z)];
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
      if (inPoly(pts, x + 0.5, y + 0.5)) g.set(x, y, col);
  };
  const px = (x, y, c) => { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < w && y < h) g.set(x, y, c); };
  // a box: top, the +Y face (lower left) and the +X face (lower right)
  const box = (x0, x1, y0, y1, z0, z1, top, left, right) => {
    fill([P3(x1, y1, z1), P3(x1, y1, z0), P3(x0, y1, z0), P3(x0, y1, z1)], left);
    fill([P3(x1, y0, z1), P3(x1, y0, z0), P3(x1, y1, z0), P3(x1, y1, z1)], right);
    fill([P3(x0, y0, z1), P3(x1, y0, z1), P3(x1, y1, z1), P3(x0, y1, z1)], top);
  };

  // the dais: three square steps, clean three tones (no bright nosing bands)
  const STEPS = [[14, 0, 3], [11.5, 3, 6], [9, 6, 9]];
  for (const [r, z0, z1] of STEPS) box(-r, r, -r, r, z0, z1, S[1], DK[1], DK[2]);
  const ZD = 9;                                                 // the dais top

  // the black throne: lit top, mid front (+Y), dark side (+X), and a rim on the lit edges
  const TOP = S[2], FR = pal.cloth[2], SD = pal.leather[2], RIM = S[1];
  const part = (x0, x1, y0, y1, z0, z1, top = TOP) => {
    box(x0, x1, y0, y1, z0, z1, top, FR, SD);
    // rim: the top's front (+Y) edge, one pixel per column, and the front face's left vertical edge
    for (let x = Math.ceil(sx(x0, y1)); x < sx(x1, y1); x++) px(x, CY + (x - CX + 2 * y1) / 2 - z1, RIM);
    for (let y = Math.ceil(sy(x0, y1, z1)); y < sy(x0, y1, z0) - 1; y++) px(sx(x0, y1), y, RIM);
    // a softer edge (dirt's darkest step) where the top meets the dark side, so stacked side planes separate
    for (let x = Math.ceil(sx(x1, y1)); x < sx(x1, y0); x++) px(x, CY + (2 * x1 - (x - CX)) / 2 - z1, DK[2]);
  };

  // the back: a tall slab across the rear of the top step
  const BX = 8.5, BY0 = -9, BY1 = -5.5, ZB = ZD + 37;
  part(-BX, BX, BY0, BY1, ZD, ZB);
  // the crown: a tallest middle spike rising out of the back's top
  const spike = (X, Y, r, z0, H) => {
    const tip = P3(X, Y, z0 + H);
    fill([P3(X - r, Y + r, z0), P3(X + r, Y + r, z0), tip], FR);   // front (+Y) face
    fill([P3(X + r, Y + r, z0), P3(X + r, Y - r, z0), tip], SD);   // side (+X) face
    // rim down the lit left edge
    const [x0, y0] = P3(X - r, Y + r, z0), [x1, y1] = tip;
    for (let y = Math.ceil(y1) + 1; y < y0; y++) px(x0 + (x1 - x0) * (y0 - y) / (y0 - y1), y, RIM);
  };
  spike(0, (BY0 + BY1) / 2, 1.75, ZB - 1, 11);
  // ribs: raised bars on the back's front, running up past its top into spikes
  for (const [X, H] of [[-6.5, 4], [-3, 6], [3, 6], [6.5, 4]]) {
    part(X - 1, X + 1, BY1, BY1 + 2, ZD + 12, ZB + 1);
    spike(X, BY1 + 1, 1, ZB + 1, H);
  }
  // the ember: a glowing slit down the middle of the back's front, white-hot core, orange glow, dark-red rim
  const ex = Math.floor(sx(0, BY1)), eTop = Math.floor(sy(0, BY1, ZB - 4)), eBot = Math.floor(sy(0, BY1, ZD + 16));
  for (let y = eTop; y <= eBot; y++) {
    const edge = y === eTop || y === eBot, core = y > eTop + 3 && y < eBot - 3;
    px(ex - 1, y, edge ? A[2] : core ? G[1] : A[2]);
    px(ex, y, edge ? A[2] : core ? G[0] : G[1]);
    px(ex + 1, y, A[2]);
  }

  // the left arm, the seat between the arms, the right arm (back to front)
  const AY0 = BY1, AY1 = 7, ZA = ZD + 12;
  const arm = (x0, x1) => {
    part(x0, x1, AY0, AY1 - 1.5, ZD, ZA);
    part(x0 - 0.5, x1 + 0.5, AY1 - 3, AY1 + 0.5, ZA - 3, ZA + 2);   // the knuckled front block, overhanging
  };
  arm(-BX, -5);
  part(-5, 5, BY1, AY1 - 1, ZD, ZD + 7);                            // the seat
  arm(5, BX);

  return ctx.lib.line(g);
}
