// feature-weapon-rack base.v4 (x1, the blind reviewer's extra revision) — from base.v3. One change, the weapons and the
// rack's form, as the blind re-score asked. v3's voxel weapons came out as flat near-white slabs with red stripes and
// its diagonal frame left no room for them, so v4 draws the rack and its weapons pixel by pixel, in the iso view, the
// rack set across the cell's left-right diagonal (facing the viewer) so the weapons stand side by side:
// - weapons, each its own shape with a 1 px outline: two spears whose leaf points stand above the top rail, a sword
//   point down with a crossguard, leather grip and pommel, and an axe with a bearded bit above the rail; steel takes
//   the metal ramp's mid and dark steps, its light step only on the lit (left) cutting edges; hafts wood mid;
// - open drops the right half (the axe and the second spear): empty slots and bare rail show; looted is bare;
// - form: 2 px uprights (lit and mid columns), a top and a low rail with lit tops, a far stretcher in the wood shadow
//   step behind the weapons, a base plank on two cross feet, and the direction's contact shadow under it.
// Placement as v3: the object stands on the floor diamond's centre (16, h - 8). Role ramps only (R11).
export const meta = { brief: 'feature-weapon-rack', pass: 'x1', notes: 'pixel-drawn spears, sword, axe on a front-facing rack with uprights, plank and feet; open drops the right half', mirror: false };

export const params = {
  body: { type: 'swap', options: ['wood', 'stone', 'leather'], default: 'wood' },
  trim: { type: 'swap', options: ['metal', 'accent'], default: 'metal' },
};

// weapon sprites, top row first, the bottom row standing on the base plank; '.' leaves the pixel alone
// o outline · H steel light (lit edge) · M steel mid · D steel dark · w haft (wood mid) · l grip (leather mid)
const SPEAR = ['..o..', '.oHo.', 'oHMDo', 'oHMDo', 'oMMDo', '.oDo.', '.olo.', '.olo.'];
const SWORD = [
  '..ooo..', '..oMo..', '..olo..', '..olo..', '..olo..', 'ooooooo', 'oHMMMDo', 'oooHDoo',
  '..oHDo.', '..oMDo.',
];
const SWORD_TIP = ['..oDDo.', '...oo..'];
const AXE = ['.oo...o.', 'oHMo.owo', 'oHMMoowo', 'oHMMDDwo', 'oHMMoowo', 'oHMo.owo', '.oo..owo'];   // a crescent bit on its haft (col 6)

export function render(ctx) {
  const [w, h] = ctx.size, P = ctx.params, pal = ctx.dir.pal, st = ctx.state;
  const blank = () => ctx.lib.t2.scene3d({ k: 2 }).render(w, h, { renderer: 'raster', yaw: 45, at: [w / 2, h - 8], shadow: false });
  const wd = pal[P.body], W0 = wd[0], W1 = wd[1], W2 = wd[wd.length - 1];
  const tr = pal[P.trim], key = { o: ctx.dir.outline, H: tr[0], M: tr[1], D: tr[tr.length - 1], w: pal.wood[1], l: pal.leather[1] };
  const cx = w >> 1, gy = h - 8;                // the floor diamond's centre
  const G = blank();
  const fill = (x, y, fw, fh, c) => G.fill(x, y, fw, fh, c);
  // rack, back to front. Rows from the post tops T: top rail T+2..T+4, far rail T+10..T+11, plank PT..PT+2, feet below
  const XL = cx - 12, XR = cx + 10;             // left and right uprights (2 px each): x 4-5 and 26-27
  const T = gy - 21, PT = gy - 4;               // post tops, plank top
  fill(XL + 2, T + 10, XR - XL - 2, 2, W2);     // far rail, in the wood shadow step behind the weapons
  for (const x of [XL - 1, XR - 1]) {           // cross feet, running front to back: lit top, mid front
    fill(x, gy - 3, 4, 4, W0); fill(x, gy + 1, 4, 1, W1);
  }
  fill(XL, PT, XR - XL + 2, 1, W0); fill(XL, PT + 1, XR - XL + 2, 2, W1);   // base plank: lit top, mid front
  for (const x of [XL, XR]) { fill(x, T, 1, PT - T, W0); fill(x + 1, T, 1, PT - T, W1); }   // uprights
  fill(XL + 2, T + 2, XR - XL - 2, 1, W0); fill(XL + 2, T + 3, XR - XL - 2, 2, W1);       // top rail
  // the direction's outer line around the frame; the weapons carry their own outline, so the gaps between them stay open
  const g = blank();
  ctx.lib.iso.groundShadow(g, cx, gy + 1, 13);  // contact shadow
  g.stamp(ctx.lib.fx.line(G));
  // weapons, each standing on the plank top (row PT - 1 is its foot)
  const draw = (rows, x0, y0) => rows.forEach((row, i) => { for (let j = 0; j < row.length; j++) { const c = key[row[j]]; if (c) g.set(x0 + j, y0 + i, c); } });
  const shaft = (x, y0, y1) => { for (let y = y0; y <= y1; y++) { g.set(x - 1, y, key.o); g.set(x, y, key.w); g.set(x + 1, y, key.o); } };
  const spear = (x) => { draw(SPEAR, x - 2, T - 4); shaft(x, T + 4, PT - 1); };
  const sword = (x) => {                         // hilt up: pommel at the top rail, crossguard below it, blade to the plank
    draw(SWORD, x - 3, T + 2); for (let y = T + 12; y < PT - 2; y++) draw(['..oMDo.'], x - 3, y); draw(SWORD_TIP, x - 3, PT - 2);
  };
  const axe = (x) => { draw(AXE, x - 6, T - 5); shaft(x, T + 2, PT - 1); };
  if (st !== 'looted') { spear(XL + 4); sword(XL + 9); }
  if (st === 'closed') { axe(XL + 14); spear(XL + 19); }
  return g;
}
