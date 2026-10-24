// family-rod base.v2 (r2) — from base.v1, changed what the v1 roster and review asked: v1 ran the same down-right
// diagonal at the same length as the sword, key and arrows, with the same red head. v2 turns the rod to lie along the
// grid's y axis (down-left on screen, the other diagonal), makes the wooden shaft thinner (one voxel wide), and gives it
// a distinct head: a metal collar holding a round pale-blue crystal knob (cloth ramp), taller than the shaft, so it reads
// as a wand or staff with an orb. No red-orange. Fine-voxel (k = 2) T2+ 3D model, raster renderer, grid-aligned
// (yaw 45), ground centre on the floor diamond's centre. Role ramps only (R11).
export const meta = { brief: 'family-rod', pass: 'r2', notes: 'thin rod on the other diagonal with a metal collar and a pale blue crystal knob', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, m = ctx.lib.t2.scene3d({ k: 2 });
  const U = w / 4, N = U * 2;
  const cells = new Map();
  const put = (part, mat, x, y, z) => { if (x < 0 || y < 0 || x >= N || y >= N) return; if (!cells.has(part)) cells.set(part, { mat, cs: [] }); cells.get(part).cs.push([x, y, z]); };
  const box = (part, mat, x0, y0, z0, bw, bd, bh) => { for (let z = z0; z < z0 + bh; z++) for (let y = y0; y < y0 + bd; y++) for (let x = x0; x < x0 + bw; x++) put(part, mat, x, y, z); };
  box('shaft', 'wood', 8, 3, 0, 1, 9, 1);           // thin shaft along grid y
  box('foot', 'metal', 8, 2, 0, 1, 1, 1);
  box('collar', 'metal', 8, 12, 0, 1, 1, 2);        // metal collar
  // crystal knob: a 3 x 3 x 3 block with its eight corners cut, so it reads round, not as a hammer head
  for (let z = 0; z < 3; z++) for (let y = 13; y < 16; y++) for (let x = 7; x < 10; x++) if ((x !== 8) + (y !== 14) + (z !== 1) < 3) put('orb', 'cloth', x, y, z);
  for (const [name, { mat, cs }] of cells) m.add({ type: 'cells', name, cells: cs, mat });
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [U / 2, U / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
