// feature-weapon-rack base.v3 (r3) — from base.v2 (6.5, the best so far). One change, as the r2 review asked: the
// weapons are thickened and brightened so they read at 1x. v2's 1-voxel blades took the metal ramp's mid and dark steps
// on their visible faces and read as a muddy grey line; v3 draws every steel part 2 voxels wide (spear head a broad
// leaf, sword blade 2 wide with a 4-wide guard, axe head a 2 x 8 bit, with a voxel gap between sword and axe) on a lifted metal ramp (the ramp's light step on
// both lit faces, its mid step in shade), taken from ctx.dir.pal, so the steel stands out from the wood frame.
// Frame, placement, states and everything else are v2's. Role ramps only (R11).
export const meta = { brief: 'feature-weapon-rack', pass: 'r3', notes: 'v2 with thicker, brighter steel on the weapons', mirror: false };

export const params = {
  body: { type: 'swap', options: ['wood', 'stone', 'leather'], default: 'wood' },
  trim: { type: 'swap', options: ['metal', 'accent'], default: 'metal' },
};

export function render(ctx) {
  const [w, h] = ctx.size, P = ctx.params, pal = ctx.dir.pal, st = ctx.state, m = ctx.lib.t2.scene3d({ k: 2 });
  const U = 8, N = U * 2;                       // the cell: 16 fine voxels a side; a voxel is 1 px high
  const cells = new Map();
  const put = (part, mat, x, y, z) => { if (x < 0 || y < 0 || x >= N || y >= N || z < 0) return; if (!cells.has(part)) cells.set(part, { mat, cs: [] }); cells.get(part).cs.push([x, y, z]); };
  const box = (part, mat, x0, y0, z0, bw, bd, bh) => { for (let z = z0; z < z0 + bh; z++) for (let y = y0; y < y0 + bd; y++) for (let x = x0; x < x0 + bw; x++) put(part, mat, x, y, z); };
  const tr = pal[P.trim], STEEL = [tr[0], tr[0], tr[1]];   // lifted trim ramp: light step on both lit faces
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
  if (show.includes('spear')) {                   // x 3-4: leather-bound haft, a broad leaf head standing well above the rail
    for (let z = 0; z < 17; z++) put('spearHaft', 'leather', 4, yAt(z, 17), z);
    box('spearHead', STEEL, 3, RY + 1, 17, 2, 1, 4);
    box('spearWing', STEEL, 2, RY + 1, 18, 1, 1, 2);
    box('spearWing2', STEEL, 5, RY + 1, 18, 1, 1, 2);
  }
  if (show.includes('sword')) {                   // x 6-7: point down, a 2-wide blade, crossguard and leather grip above the rail
    for (let z = 1; z < 12; z++) { put('swordBlade', STEEL, 6, yAt(z, 12), z); put('swordBlade', STEEL, 7, yAt(z, 12), z); }
    box('swordGuard', STEEL, 5, RY + 1, 12, 4, 1, 1);
    box('swordGrip', 'leather', 6, RY + 1, 13, 2, 1, 3);
    box('swordPommel', STEEL, 6, RY + 1, 16, 2, 1, 1);
  }
  if (show.includes('axe')) {                     // x 12: leather-bound haft, a broad 2 x 8 steel bit, a gap from the sword on its left side
    for (let z = 0; z < 18; z++) put('axeHaft', 'leather', 12, yAt(z, 18), z);
    box('axeHead', STEEL, 11, RY + 1, 12, 1, 1, 6);
    box('axeEdge', STEEL, 10, RY + 1, 11, 1, 1, 8);
  }
  for (const [name, { mat, cs }] of cells) m.add({ type: 'cells', name, cells: cs, mat });
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [U / 2, U / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'depth' });
}
