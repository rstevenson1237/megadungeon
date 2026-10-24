// feature-weapon-rack base.v2 (r2) — from base.v1. One change, as the v1 roster asked: the rack is rebuilt as an OPEN
// frame with weapons that read as weapons. v1's plinth and close-packed slots made a solid slab (a wall section or a
// framed painting); v2 drops the plinth for two foot runners, keeps two thin posts with a top rail and a low rail, and
// leaves the floor visible through the frame. Three distinct weapons lean back against the top rail: a spear (leather-bound haft,
// winged steel head, tallest), a sword (steel blade, crossguard, leather grip) and an axe (leather-bound haft, broad steel head). Also re-placed
// for the brief's 32 x 40 frame: a fine-voxel model (k = 2) on the raster renderer, grid-aligned (yaw 45), its ground
// centre on the diamond's centre (16, 32); 1.6 m = 26 px tall. States: closed = all three; open = the sword is gone (a
// gap); looted = bare frame. Inner lines by depth only, so the 1 px steel parts keep their colour. Role ramps only (R11).
export const meta = { brief: 'feature-weapon-rack', pass: 'r2', notes: 'open frame, spear/sword/axe leaning on the top rail; gap / bare by state', mirror: false };

export const params = {
  body: { type: 'swap', options: ['wood', 'stone', 'leather'], default: 'wood' },
  trim: { type: 'swap', options: ['metal', 'accent'], default: 'metal' },
};

export function render(ctx) {
  const [w, h] = ctx.size, P = ctx.params, st = ctx.state, m = ctx.lib.t2.scene3d({ k: 2 });
  const U = 8, N = U * 2;                       // the cell: 16 fine voxels a side; a voxel is 1 px high
  const cells = new Map();
  const put = (part, mat, x, y, z) => { if (x < 0 || y < 0 || x >= N || y >= N || z < 0) return; if (!cells.has(part)) cells.set(part, { mat, cs: [] }); cells.get(part).cs.push([x, y, z]); };
  const box = (part, mat, x0, y0, z0, bw, bd, bh) => { for (let z = z0; z < z0 + bh; z++) for (let y = y0; y < y0 + bd; y++) for (let x = x0; x < x0 + bw; x++) put(part, mat, x, y, z); };
  const TOP = 17, RY = 7, L = 0, R = 15;        // post height (+ rail; with the footprint ~26 px drawn), the frame's plane, end posts
  // frame: two foot runners, two slim posts, a top rail and a low rail — open between them, the floor shows through
  box('footL', P.body, L, RY - 2, 0, 1, 5, 1);
  box('footR', P.body, R, RY - 2, 0, 1, 5, 1);
  box('postL', P.body, L, RY, 1, 1, 1, TOP);
  box('postR', P.body, R, RY, 1, 1, 1, TOP);
  box('railTop', P.body, L + 1, RY, TOP - 1, R - L - 1, 1, 2);
  box('railLow', P.body, L + 1, RY, 6, R - L - 1, 1, 1);
  // weapons stand just in front of the rails, feet a voxel further out so they lean back onto the top rail
  const yAt = (z, top) => RY + 1 + (z < top * 0.4 ? 1 : 0);
  const show = st === 'looted' ? [] : st === 'open' ? ['spear', 'axe'] : ['spear', 'sword', 'axe'];
  if (show.includes('spear')) {                   // x 4: leather-bound haft, a winged steel head standing well above the rail
    for (let z = 0; z < 17; z++) put('spearHaft', 'leather', 4, yAt(z, 17), z);
    box('spearHead', P.trim, 4, RY + 1, 17, 1, 1, 4);
    box('spearWing', P.trim, 3, RY + 1, 18, 1, 1, 2);
    box('spearWing2', P.trim, 5, RY + 1, 18, 1, 1, 2);
  }
  if (show.includes('sword')) {                   // x 8: point down, crossguard and leather grip above the rail
    for (let z = 1; z < 12; z++) put('swordBlade', P.trim, 8, yAt(z, 12), z);
    box('swordGuard', P.trim, 7, RY + 1, 12, 3, 1, 1);
    box('swordGrip', 'leather', 8, RY + 1, 13, 1, 1, 3);
    box('swordPommel', P.trim, 8, RY + 1, 16, 1, 1, 1);
  }
  if (show.includes('axe')) {                     // x 12: leather-bound haft, a broad steel head on its left side
    for (let z = 0; z < 18; z++) put('axeHaft', 'leather', 12, yAt(z, 18), z);
    box('axeHead', P.trim, 10, RY + 1, 13, 2, 1, 5);
    box('axeEdge', P.trim, 9, RY + 1, 12, 1, 1, 7);
  }
  for (const [name, { mat, cs }] of cells) m.add({ type: 'cells', name, cells: cs, mat });
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [U / 2, U / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'depth' });
}
