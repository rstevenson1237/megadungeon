// feature-weapon-rack base.v5 (x2) — from base.v3 (6.5, the best base) with base.v4's weapons. One change, as the
// review of v4 asked: the rack goes back on one grid axis. v4's pixel-drawn spear, sword and axe read well, but its
// frame stood flat across the cell's left-right diagonal and read as a fence sticker. v5 builds the frame as v3 did,
// in voxels along the cell's x axis (parallel to a wall face, on the 2:1 slope), now with form: a plinth 4 voxels deep
// and 2 high, 2 x 2 uprights and a 2 x 2 top rail, so each has a lit top and a side face; the dark low rail is gone;
// a pair of empty pegs juts from the top rail at each slot, so the looted rack still reads as a rack. v4's weapon
// sprites are stamped on that slope, each foot on the plinth top, the spear and axe heads 5-6 px above the top rail and
// the sword's hilt above it. States by weapon count: closed 3 (spear, sword, axe), open 1 (spear: the right two
// slots stand empty on their pegs), looted 0. A contact shadow (v4's) sits under the plinth. Role ramps only (R11).
export const meta = { brief: 'feature-weapon-rack', pass: 'x2', notes: 'v3 voxel rack on one grid axis with plinth, 2x2 uprights and rail, pegs; v4 pixel weapons on the slope', mirror: false };

export const params = {
  body: { type: 'swap', options: ['wood', 'stone', 'leather'], default: 'wood' },
  trim: { type: 'swap', options: ['metal', 'accent'], default: 'metal' },
};

// weapon sprites (v4's), top row first; '.' leaves the pixel alone
// o outline · H steel light (lit edge) · M steel mid · D steel dark · w haft (wood mid) · l grip (leather mid)
const SPEAR = ['..o..', '.oHo.', 'oHMDo', 'oHMDo', 'oMMDo', '.oDo.', '.olo.', '.olo.'];
const HILT = ['..ooo..', '..oMo..', '..olo..', '..olo..', '..olo..', 'ooooooo', 'oHMMMDo', 'oooHDoo'];
const BLADE = '..oHDo.', TIP = ['..oDDo.', '...oo..'];
const AXE = ['.o...oo.', 'owo.oMHo', 'owooMMHo', 'owDDMMHo', 'owooMMHo', 'owo.oMHo', 'owo..oo.'];   // v4's axe mirrored: the bit faces right, away from the sword

export function render(ctx) {
  const [w, h] = ctx.size, P = ctx.params, pal = ctx.dir.pal, st = ctx.state, m = ctx.lib.t2.scene3d({ k: 2 });
  const U = 8, N = U * 2;
  const cells = new Map();
  const put = (part, mat, x, y, z) => { if (x < 0 || y < 0 || x >= N || y >= N || z < 0) return; if (!cells.has(part)) cells.set(part, { mat, cs: [] }); cells.get(part).cs.push([x, y, z]); };
  const box = (part, mat, x0, y0, z0, bw, bd, bh) => { for (let z = z0; z < z0 + bh; z++) for (let y = y0; y < y0 + bd; y++) for (let x = x0; x < x0 + bw; x++) put(part, mat, x, y, z); };
  const TOP = 14, RY = 6, L = 0, R = 14;        // post tops, the frame's back plane (y 6-7), end posts (x 0-1, 14-15)
  box('plinth', P.body, L, RY - 1, 0, R - L + 2, 4, 2);
  box('postL', P.body, L, RY, 2, 2, 2, TOP - 2);
  box('postR', P.body, R, RY, 2, 2, 2, TOP - 2);
  box('railTop', P.body, L + 2, RY, TOP - 2, R - L - 2, 2, 2);
  const SLOTS = [3, 8, 13];                      // voxel x of the spear, sword and axe
  for (const x of SLOTS) box('peg' + x, P.body, x, RY + 2, TOP - 2, 1, 3, 1);   // a peg jutting from the rail's front, its top lit
  for (const [name, { mat, cs }] of cells) m.add({ type: 'cells', name, cells: cs, mat });
  const view = { renderer: 'raster', yaw: 45, pivot: [U / 2, U / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'depth' };
  const g = ctx.lib.t2.scene3d({ k: 2 }).render(w, h, view);
  ctx.lib.iso.groundShadow(g, w >> 1, h - 7, 12);   // the direction's contact shadow, under the plinth
  g.stamp(m.render(w, h, view));

  // the weapons, pixel by pixel on the slope: a voxel (x, y, z) lands near (16 + x - y, 23 + (x + y) / 2 - z)
  const tr = pal[P.trim], key = { o: ctx.dir.outline, H: tr[0], M: tr[1], D: tr[tr.length - 1], w: pal.wood[1], l: pal.leather[1] };
  const FY = RY + 3;                             // the weapons stand just in front of the pegs
  const sx = (x) => 16 + x - FY, sy = (x, z) => Math.round(23 + (x + FY) / 2 - z);
  const draw = (rows, x0, y0) => rows.forEach((row, i) => { for (let j = 0; j < row.length; j++) { const c = key[row[j]]; if (c) g.set(x0 + j, y0 + i, c); } });
  const shaft = (x, y0, y1) => { for (let y = y0; y <= y1; y++) { g.set(x - 1, y, key.o); g.set(x, y, key.w); g.set(x + 1, y, key.o); } };
  const spear = (vx) => { const x = sx(vx), r = sy(vx, TOP), f = sy(vx, 2) - 1; draw(SPEAR, x - 2, r - 7); shaft(x, r + 1, f); };
  const sword = (vx) => {                        // point down: the hilt above the rail, the guard on it, the tip on the plinth
    const x = sx(vx), r = sy(vx, TOP), f = sy(vx, 2) - 1;
    draw(HILT, x - 3, r - 6); for (let y = r + 2; y < f - 1; y++) draw([BLADE], x - 3, y); draw(TIP, x - 3, f - 1);
  };
  const axe = (vx) => { const x = sx(vx), r = sy(vx, TOP), f = sy(vx, 2) - 1; draw(AXE, x - 1, r - 7); shaft(x, r, f); };
  if (st !== 'looted') spear(SLOTS[0]);
  if (st === 'closed') { sword(SLOTS[1]); axe(SLOTS[2]); }
  return g;
}
